import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from './log'

export interface AuditEvent {
  adminUserId: string
  action: string
  targetTable?: string
  targetId?: string
  beforeState?: Record<string, unknown>
  afterState?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/** Write an admin audit log entry. Best-effort — never throws. */
export async function auditLog(event: AuditEvent): Promise<void> {
  try {
    const db = createAdminClient()
    await db.from('admin_audit_logs').insert({
      admin_user_id: event.adminUserId,
      action:        event.action,
      target_table:  event.targetTable ?? null,
      target_id:     event.targetId ?? null,
      before_state:  event.beforeState ?? null,
      after_state:   event.afterState ?? null,
      ip_address:    event.ipAddress ?? null,
      user_agent:    event.userAgent ?? null,
    })

    log.adminAction(event.adminUserId, event.action, event.targetTable, event.targetId)
  } catch (err) {
    // Audit log failure must never take down the main operation
    console.error('[audit] failed to write audit log:', err)
  }
}

/** Convenience wrapper for extracting request metadata */
export function requestMeta(request: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: (request.headers.get('x-real-ip') ??
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()),
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
}
