import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0
        const plan = session.metadata?.plan

        // One-time credit purchase
        if (userId && credits > 0) {
          const idempotencyKey = `stripe_checkout_${session.id}`
          // Check idempotency
          const { data: existing } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle()
          if (!existing) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', userId)
              .single()
            const currentCredits = (profile?.credits ?? 0) as number
            const newBalance = currentCredits + credits
            await Promise.all([
              supabase.from('profiles').update({ credits: newBalance }).eq('id', userId),
              supabase.from('credit_transactions').insert({
                user_id: userId,
                transaction_type: 'purchase',
                amount: credits,
                reason: `Stripe checkout ${session.id}`,
                idempotency_key: idempotencyKey,
                balance_after: newBalance,
              }),
            ])
          }
        }

        // Subscription purchase
        if (userId && plan && session.subscription) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            tier: plan,
            status: 'active',
          }, { onConflict: 'user_id' })
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription & { current_period_end?: number }
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
        await supabase.from('subscriptions')
          .update({ status, ...(periodEnd && { current_period_end: periodEnd }) })
          .eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (error) {
    console.error('Webhook error:', error)
  }

  return NextResponse.json({ received: true })
}
