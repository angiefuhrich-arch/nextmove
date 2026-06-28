import 'server-only'

// Structured logger — safe for production.
// Never logs: API keys, raw auth tokens, payment details, full private user data.

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  event: string
  [key: string]: unknown
}

const REDACTED = '[REDACTED]'

// Fields that should never appear in logs
const SENSITIVE_KEYS = new Set([
  'apiKey', 'api_key', 'key', 'secret', 'password', 'token',
  'access_token', 'refresh_token', 'service_role',
  'stripe_secret', 'webhook_secret', 'authorization',
  'cookie', 'creditCard', 'cardNumber',
])

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      safe[k] = REDACTED
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      safe[k] = redact(v as Record<string, unknown>)
    } else {
      safe[k] = v
    }
  }
  return safe
}

function emit(entry: LogEntry) {
  const { level, ...rest } = entry
  const safeRest = redact(rest as Record<string, unknown>)
  const output = JSON.stringify({ ts: new Date().toISOString(), level, ...safeRest })

  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else if (level === 'debug') console.debug(output)
  else console.log(output)
}

export const log = {
  pipelineStarted: (runId: string, entityName: string, userId?: string) =>
    emit({ level: 'info', event: 'pipeline.started', runId, entityName, userId }),

  pipelineCompleted: (runId: string, entitySlug: string, status: string) =>
    emit({ level: 'info', event: 'pipeline.completed', runId, entitySlug, status }),

  pipelineFailed: (runId: string, step: string, error: string) =>
    emit({ level: 'error', event: 'pipeline.failed', runId, step, error }),

  sourceFetchFailed: (url: string, error: string, runId?: string) =>
    emit({ level: 'warn', event: 'source.fetch_failed', url, error, runId }),

  ssrfBlocked: (url: string, reason: string, runId?: string) =>
    emit({ level: 'warn', event: 'security.ssrf_blocked', url, reason, runId }),

  rateLimitHit: (key: string, limitName: string, ip?: string) =>
    emit({ level: 'info', event: 'security.rate_limit_hit', key, limitName, ip }),

  aiValidationFailed: (runId: string, reason: string) =>
    emit({ level: 'warn', event: 'ai.validation_failed', runId, reason }),

  creditDeductionFailed: (userId: string, reason: string, runId?: string) =>
    emit({ level: 'error', event: 'credits.deduction_failed', userId, reason, runId }),

  adminAction: (adminId: string, action: string, targetTable?: string, targetId?: string) =>
    emit({ level: 'info', event: 'admin.action', adminId, action, targetTable, targetId }),

  evidenceInvalidated: (evidenceId: string, adminId: string, reason: string) =>
    emit({ level: 'info', event: 'evidence.invalidated', evidenceId, adminId, reason }),

  authFailed: (path: string, ip: string, reason: string) =>
    emit({ level: 'warn', event: 'security.auth_failed', path, ip, reason }),
}
