import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function createCheckoutSession({
  customerId,
  priceId,
  businessId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  businessId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { businessId },
    subscription_data: {
      trial_period_days: 14,
      metadata: { businessId },
    },
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export const STRIPE_PRICES = {
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  growth_yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY!,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
};
