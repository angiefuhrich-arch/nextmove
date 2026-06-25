import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
})

export const PLANS = {
  free: { name: 'Free', price: 0, reports: 3 },
  pro: { name: 'Pro', price: 12, reports: -1, priceId: process.env.STRIPE_PRO_PRICE_ID },
  premium: { name: 'Premium', price: 29, reports: -1, priceId: process.env.STRIPE_PREMIUM_PRICE_ID },
}
