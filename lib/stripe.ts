import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
})

export const PLANS = {
  free: { name: 'Free', price: 0, currency: 'HKD', reports: 3 },
  pro: { name: 'Pro', price: 98, currency: 'HKD', reports: -1, priceId: process.env.STRIPE_PRICE_PRO },
  premium: { name: 'Premium', price: 228, currency: 'HKD', reports: -1, priceId: process.env.STRIPE_PRICE_PREMIUM },
}
