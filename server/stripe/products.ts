/**
 * Wingman Stripe Product & Price Definitions
 * These map to Stripe Products/Prices created in the Stripe Dashboard.
 * In production, set the STRIPE_PRICE_* env vars to the actual Stripe Price IDs.
 */

export interface WingmanPlan {
  id: "free" | "premium" | "enterprise";
  name: string;
  tagline: string;
  monthlyPriceId: string | null; // Stripe Price ID
  yearlyPriceId: string | null;  // Stripe Price ID
  monthlyAmount: number;         // cents
  yearlyAmount: number;          // cents
  features: string[];
  maxConnections: number;
  maxSpaces: number;
  aiCalls: number;
  guardianShield: boolean;
  conferenceMode: boolean;
}

export const WINGMAN_PLANS: WingmanPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started with your AI Wingman",
    monthlyPriceId: null,
    yearlyPriceId: null,
    monthlyAmount: 0,
    yearlyAmount: 0,
    features: [
      "1 Wingman profile",
      "Up to 10 connections",
      "Basic Soul Forge interview",
      "Standard matching",
      "Community spaces",
    ],
    maxConnections: 10,
    maxSpaces: 3,
    aiCalls: 50,
    guardianShield: false,
    conferenceMode: false,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Unlock the full Wingman experience",
    monthlyPriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "price_premium_monthly",
    yearlyPriceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? "price_premium_yearly",
    monthlyAmount: 1999, // $19.99/mo
    yearlyAmount: 19199, // $191.99/yr (20% off)
    features: [
      "Unlimited connections",
      "Full MAESTRO Soul Forge (4 layers)",
      "Prediction Magic Moments",
      "Priority matching algorithm",
      "Conference Mode",
      "Guardian Shield™ safety",
      "Personality DNA Helix",
      "Compatibility Radar",
      "Travel alerts",
      "Advanced analytics",
    ],
    maxConnections: -1, // unlimited
    maxSpaces: 20,
    aiCalls: 500,
    guardianShield: true,
    conferenceMode: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations and power users",
    monthlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "price_enterprise_monthly",
    yearlyPriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? "price_enterprise_yearly",
    monthlyAmount: 9999, // $99.99/mo
    yearlyAmount: 95990, // $959.90/yr
    features: [
      "Everything in Premium",
      "Multi-tenant organization",
      "Team management dashboard",
      "Custom Wingman branding",
      "Dedicated conference spaces",
      "Priority support",
      "SLA guarantee",
      "Custom integrations",
      "Audit logs",
      "SSO / SAML",
      "White-label Wingman branding",
    ],
    maxConnections: -1,
    maxSpaces: -1,
    aiCalls: -1,
    guardianShield: true,
    conferenceMode: true,
  },
];

export function getPlanById(id: string): WingmanPlan | undefined {
  return WINGMAN_PLANS.find((p) => p.id === id);
}

export function getPlanByPriceId(priceId: string): WingmanPlan | undefined {
  return WINGMAN_PLANS.find(
    (p) => p.monthlyPriceId === priceId || p.yearlyPriceId === priceId
  );
}
