import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const plan = req.nextUrl.searchParams.get('plan') as 'pro' | 'premium'
    const priceId = PLANS[plan]?.priceId

    if (!priceId || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return NextResponse.redirect(new URL('/account?message=stripe-not-configured', req.url))
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { userId: user.id, plan },
    })

    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL('/pricing?error=true', req.url))
  }
}
