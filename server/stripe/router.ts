/**
 * Wingman Stripe Billing Router
 * Handles checkout sessions, customer portal, subscription management.
 */

import { z } from "zod";
import Stripe from "stripe";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { WINGMAN_PLANS, getPlanById, getPlanByPriceId } from "./products";
import { sendSubscriptionEmail } from "../email";

// ─── Stripe client ────────────────────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2026-03-25.dahlia" }) : null;

function getStripe(): Stripe {
  if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured. Please add STRIPE_SECRET_KEY." });
  return stripe;
}

// ─── Helper: get or create Stripe customer ────────────────────────────────────
async function getOrCreateStripeCustomer(userId: number, email: string, name: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const userRows = await db.select({ stripeCustomerId: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1);
  const existingCustomerId = userRows[0]?.stripeCustomerId;

  if (existingCustomerId) return existingCustomerId;

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { userId: userId.toString() },
  });

  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

// ─── Billing Router ───────────────────────────────────────────────────────────
export const billingRouter = router({
  /**
   * Get all available plans
   */
  getPlans: publicProcedure.query(() => {
    return WINGMAN_PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      monthlyAmount: p.monthlyAmount,
      yearlyAmount: p.yearlyAmount,
      features: p.features,
      maxConnections: p.maxConnections,
      guardianShield: p.guardianShield,
      conferenceMode: p.conferenceMode,
    }));
  }),

  /**
   * Get the current user's subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const userRows = await db.select({
      subscriptionTier: users.subscriptionTier,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const user = userRows[0];
    if (!user) return null;

    const plan = getPlanById(user.subscriptionTier ?? "free");

    // If they have a Stripe subscription, fetch live status
    let stripeStatus: string | null = null;
    let currentPeriodEnd: Date | null = null;
    let cancelAtPeriodEnd = false;

    if (user.stripeSubscriptionId && stripe) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        stripeStatus = sub.status;
        // current_period_end is available as a number in older API versions
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
        cancelAtPeriodEnd = sub.cancel_at_period_end;
      } catch {
        // Subscription may have been deleted
      }
    }

    return {
      tier: user.subscriptionTier ?? "free",
      plan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripeStatus,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    };
  }),

  /**
   * Create a Stripe Checkout Session for upgrading
   */
  createCheckoutSession: protectedProcedure
    .input(z.object({
      planId: z.enum(["premium", "enterprise"]),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = getPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan" });

      const priceId = input.interval === "yearly" ? plan.yearlyPriceId : plan.monthlyPriceId;
      if (!priceId) throw new TRPCError({ code: "BAD_REQUEST", message: "Plan not available for purchase" });

      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email ?? "",
        ctx.user.name ?? ""
      );

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          plan_id: input.planId,
          interval: input.interval,
        },
        success_url: `${input.origin}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/billing?canceled=1`,
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Create a Stripe Customer Portal session for managing subscription
   */
  createPortalSession: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const userRows = await db.select({ stripeCustomerId: users.stripeCustomerId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const customerId = userRows[0]?.stripeCustomerId;

      if (!customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No billing account found. Please subscribe first." });
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${input.origin}/billing`,
      });

      return { portalUrl: session.url };
    }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const userRows = await db.select({ stripeSubscriptionId: users.stripeSubscriptionId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const subId = userRows[0]?.stripeSubscriptionId;

    if (!subId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });

    await getStripe().subscriptions.update(subId, { cancel_at_period_end: true });
    return { success: true, message: "Your subscription will cancel at the end of the billing period." };
  }),

  /**
   * Reactivate a subscription that was set to cancel
   */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const userRows = await db.select({ stripeSubscriptionId: users.stripeSubscriptionId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const subId = userRows[0]?.stripeSubscriptionId;

    if (!subId) throw new TRPCError({ code: "BAD_REQUEST", message: "No subscription found" });

    await getStripe().subscriptions.update(subId, { cancel_at_period_end: false });
    return { success: true, message: "Subscription reactivated." };
  }),
});

// ─── Webhook handler (Express route, not tRPC) ────────────────────────────────
export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!stripe) return { received: false, error: "Stripe not configured" };

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return { received: false, error: message };
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected:", event.type);
    return { received: true };
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

  const db = await getDb();
  if (!db) return { received: false, error: "DB unavailable" };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.user_id ?? "0", 10);
        const planId = session.metadata?.plan_id ?? "premium";

        if (!userId) break;

        // Get subscription ID from session
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

        // Update user subscription
        await db.update(users).set({
          subscriptionTier: planId as "free" | "premium" | "enterprise",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
        }).where(eq(users.id, userId));

        // Send confirmation email
        const userRows = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
        if (userRows[0]?.email) {
          const plan = getPlanById(planId);
          const interval = session.metadata?.interval ?? "monthly";
          const amount = interval === "yearly"
            ? `$${((plan?.yearlyAmount ?? 0) / 100).toFixed(2)}/year`
            : `$${((plan?.monthlyAmount ?? 0) / 100).toFixed(2)}/month`;

          // Get next billing date from subscription
          let nextBillingDate = "Next billing cycle";
          if (subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              const periodEndTs = (sub as unknown as { current_period_end?: number }).current_period_end;
              if (periodEndTs) {
                nextBillingDate = new Date(periodEndTs * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              }
            } catch { /* ignore */ }
          }

          await sendSubscriptionEmail({
            to: userRows[0].email,
            name: userRows[0].name ?? "there",
            planName: plan?.name ?? planId,
            amount,
            nextBillingDate,
            dashboardUrl: `${session.success_url?.split("/billing")[0] ?? ""}/dashboard`,
          });
        }

        console.log(`[Stripe Webhook] User ${userId} upgraded to ${planId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        // Find user by customer ID
        const userRows = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
        if (!userRows[0]) break;

        // Determine plan from price ID
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : null;

        if (plan) {
          await db.update(users).set({
            subscriptionTier: plan.id,
            stripeSubscriptionId: sub.id,
          }).where(eq(users.id, userRows[0].id));
        }

        console.log(`[Stripe Webhook] Subscription updated for customer ${customerId}: status=${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        // Downgrade user to free
        await db.update(users).set({
          subscriptionTier: "free",
          stripeSubscriptionId: null,
        }).where(eq(users.stripeCustomerId, customerId));

        console.log(`[Stripe Webhook] Subscription cancelled for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
        console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);
        // Could send a payment failure email here
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    return { received: false, error: "Webhook processing failed" };
  }

  return { received: true };
}
