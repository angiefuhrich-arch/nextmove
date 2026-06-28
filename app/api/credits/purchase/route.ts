import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const CREDIT_PACKAGES = [
  { id: 'starter',      credits: 3,  priceUsd: 2900,  name: 'Starter Pack' },
  { id: 'professional', credits: 10, priceUsd: 7900,  name: 'Professional Pack' },
  { id: 'enterprise',   credits: 30, priceUsd: 19900, name: 'Enterprise Pack' },
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { packageId } = body
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: pkg.priceUsd,
          product_data: {
            name: `Scarsian ${pkg.name}`,
            description: `${pkg.credits} Intelligence Brief credits. Credits never expire.`,
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}/wallet?purchase=success`,
      cancel_url: `${origin}/wallet`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        package_id: pkg.id,
        credits: pkg.credits.toString(),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          package_id: pkg.id,
          credits: pkg.credits.toString(),
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
