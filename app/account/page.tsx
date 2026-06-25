import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import Link from 'next/link'
import { CreditCard, User, Shield } from 'lucide-react'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check subscription from DB
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const tier = (sub?.tier as 'free' | 'pro' | 'premium') || 'free'
  const tierConfigs = {
    free: { label: 'Free Plan', color: 'text-slate-600', bg: 'bg-slate-100' },
    pro: { label: 'Pro Plan', color: 'text-blue-600', bg: 'bg-blue-100' },
    premium: { label: 'Premium Plan', color: 'text-purple-600', bg: 'bg-purple-100' },
  }
  const tierConfig = tierConfigs[tier] || tierConfigs.free

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account & Billing</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account, plan, and billing details.</p>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Account</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Member since</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Subscription</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${tierConfig.bg} ${tierConfig.color}`}>
                {tierConfig.label}
              </div>
              {sub?.current_period_end && (
                <p className="text-xs text-slate-400 mt-1">
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            {tier === 'free' ? (
              <Link
                href="/pricing"
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Upgrade to Pro
              </Link>
            ) : (
              <Link
                href="/api/stripe/portal"
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Manage Billing
              </Link>
            )}
          </div>

          {tier === 'free' && (
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-1">Free plan limits</p>
              <p>3 company reports per month · Basic scores · Basic AI summaries</p>
              <Link href="/pricing" className="text-green-600 font-medium hover:underline mt-1 inline-block">
                See what Pro unlocks →
              </Link>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Security</h2>
          </div>
          <p className="text-sm text-slate-500">Password changes and security settings are managed through your email provider.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
