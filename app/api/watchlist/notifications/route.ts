import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const { data } = await supabase
    .from('watchlist_notifications')
    .select('id, entity_id, notification_type, message, previous_value, new_value, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ notifications: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.ids) ? body.ids : []
  if (ids.length === 0) {
    // Mark all as read
    await supabase.from('watchlist_notifications').update({ is_read: true }).eq('user_id', user.id)
  } else {
    await supabase.from('watchlist_notifications').update({ is_read: true }).in('id', ids).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
