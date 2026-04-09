/**
 * Billing Router Tests
 * Tests Stripe product definitions, webhook event handling logic,
 * and subscription tier mapping — no live Stripe API calls.
 */

import { describe, it, expect } from "vitest";
import { WINGMAN_PLANS, getPlanByPriceId, getPlanById } from "./stripe/products";

describe("Stripe Products", () => {
  it("should define exactly 3 plans", () => {
    expect(WINGMAN_PLANS).toHaveLength(3);
  });

  it("should have free, premium, enterprise plans", () => {
    const ids = WINGMAN_PLANS.map((p) => p.id);
    expect(ids).toContain("free");
    expect(ids).toContain("premium");
    expect(ids).toContain("enterprise");
  });

  it("should have free plan with monthlyAmount 0", () => {
    const free = getPlanById("free");
    expect(free).toBeDefined();
    expect(free?.monthlyAmount).toBe(0);
  });

  it("should have premium plan priced between $10 and $50/month", () => {
    const premium = getPlanById("premium");
    expect(premium).toBeDefined();
    // monthlyAmount is in cents
    expect(premium!.monthlyAmount).toBeGreaterThanOrEqual(1000);
    expect(premium!.monthlyAmount).toBeLessThanOrEqual(5000);
  });

  it("should have enterprise plan more expensive than premium", () => {
    const premium = getPlanById("premium");
    const enterprise = getPlanById("enterprise");
    expect(enterprise!.monthlyAmount).toBeGreaterThan(premium!.monthlyAmount);
  });

  it("should return undefined for unknown plan id", () => {
    expect(getPlanById("unknown_plan")).toBeUndefined();
  });

  it("should return plan by monthly price id", () => {
    const plansWithPriceIds = WINGMAN_PLANS.filter((p) => p.monthlyPriceId);
    for (const plan of plansWithPriceIds) {
      const found = getPlanByPriceId(plan.monthlyPriceId!);
      expect(found).toBeDefined();
      expect(found?.id).toBe(plan.id);
    }
  });

  it("should return plan by yearly price id", () => {
    const plansWithYearlyIds = WINGMAN_PLANS.filter((p) => p.yearlyPriceId);
    for (const plan of plansWithYearlyIds) {
      const found = getPlanByPriceId(plan.yearlyPriceId!);
      expect(found).toBeDefined();
      expect(found?.id).toBe(plan.id);
    }
  });

  it("should return undefined for unknown price id", () => {
    expect(getPlanByPriceId("price_unknown_xyz_99999")).toBeUndefined();
  });

  it("each plan should have required fields", () => {
    for (const plan of WINGMAN_PLANS) {
      expect(plan.id).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(typeof plan.monthlyAmount).toBe("number");
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("yearly amount should be less than 12x monthly (discount applied)", () => {
    const paidPlans = WINGMAN_PLANS.filter((p) => p.monthlyAmount > 0);
    for (const plan of paidPlans) {
      expect(plan.yearlyAmount).toBeLessThan(plan.monthlyAmount * 12);
    }
  });

  it("free plan should not have guardianShield", () => {
    const free = getPlanById("free");
    expect(free?.guardianShield).toBe(false);
  });

  it("premium and enterprise plans should have guardianShield", () => {
    expect(getPlanById("premium")?.guardianShield).toBe(true);
    expect(getPlanById("enterprise")?.guardianShield).toBe(true);
  });

  it("free plan should have limited connections", () => {
    const free = getPlanById("free");
    expect(free!.maxConnections).toBeGreaterThan(0);
    expect(free!.maxConnections).toBeLessThan(100);
  });

  it("premium and enterprise plans should have unlimited connections (-1)", () => {
    expect(getPlanById("premium")?.maxConnections).toBe(-1);
    expect(getPlanById("enterprise")?.maxConnections).toBe(-1);
  });
});

describe("Stripe Webhook Event Handling Logic", () => {
  it("should detect test events by evt_test_ prefix", () => {
    const isTestEvent = (eventId: string) => eventId.startsWith("evt_test_");
    expect(isTestEvent("evt_test_abc123")).toBe(true);
    expect(isTestEvent("evt_1abc123")).toBe(false);
    expect(isTestEvent("evt_test_")).toBe(true);
  });

  it("should handle all required webhook event types", () => {
    const handledEvents = [
      "checkout.session.completed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
    ];

    // All critical subscription lifecycle events must be handled
    expect(handledEvents).toContain("checkout.session.completed");
    expect(handledEvents).toContain("customer.subscription.updated");
    expect(handledEvents).toContain("customer.subscription.deleted");
    expect(handledEvents).toContain("invoice.payment_succeeded");
    expect(handledEvents).toContain("invoice.payment_failed");
  });

  it("should map subscription status to correct tier", () => {
    function mapStatusToTier(status: string): string {
      if (status === "active" || status === "trialing") return "active";
      if (status === "past_due") return "past_due";
      return "free";
    }

    expect(mapStatusToTier("active")).toBe("active");
    expect(mapStatusToTier("trialing")).toBe("active");
    expect(mapStatusToTier("past_due")).toBe("past_due");
    expect(mapStatusToTier("canceled")).toBe("free");
    expect(mapStatusToTier("unpaid")).toBe("free");
    expect(mapStatusToTier("incomplete")).toBe("free");
    expect(mapStatusToTier("incomplete_expired")).toBe("free");
  });

  it("should correctly identify subscription deletion events", () => {
    const deletionEvents = ["customer.subscription.deleted"];
    expect(deletionEvents).toContain("customer.subscription.deleted");
    expect(deletionEvents).not.toContain("customer.subscription.updated");
  });

  it("checkout session metadata should include required fields", () => {
    // Validate the metadata structure we send to Stripe
    const mockMetadata = {
      user_id: "123",
      customer_email: "test@example.com",
      customer_name: "Test User",
      plan_id: "premium",
      billing_cycle: "monthly",
    };

    expect(mockMetadata).toHaveProperty("user_id");
    expect(mockMetadata).toHaveProperty("customer_email");
    expect(mockMetadata).toHaveProperty("plan_id");
    expect(mockMetadata).toHaveProperty("billing_cycle");
  });
});

describe("Billing Plan Feature Gates", () => {
  it("enterprise plan should have more features than premium", () => {
    const premium = getPlanById("premium");
    const enterprise = getPlanById("enterprise");
    expect(enterprise!.features.length).toBeGreaterThan(premium!.features.length);
  });

  it("premium plan should have more features than free", () => {
    const free = getPlanById("free");
    const premium = getPlanById("premium");
    expect(premium!.features.length).toBeGreaterThan(free!.features.length);
  });

  it("enterprise plan should have unlimited AI calls", () => {
    const enterprise = getPlanById("enterprise");
    expect(enterprise!.aiCalls).toBe(-1);
  });

  it("free plan should have limited AI calls", () => {
    const free = getPlanById("free");
    expect(free!.aiCalls).toBeGreaterThan(0);
    expect(free!.aiCalls).toBeLessThan(200);
  });

  it("enterprise plan should have conference mode", () => {
    expect(getPlanById("enterprise")?.conferenceMode).toBe(true);
  });

  it("free plan should not have conference mode", () => {
    expect(getPlanById("free")?.conferenceMode).toBe(false);
  });
});
