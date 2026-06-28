import 'server-only'

import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Primitive validators ──────────────────────────────────────────────────────

const noScript = (s: string) => !/<script|javascript:|data:|vbscript:/i.test(s)

const safeText = (maxLen: number) =>
  z.string()
    .trim()
    .max(maxLen)
    .refine(noScript, { message: 'Input contains disallowed content' })

const safeUrl = z.string()
  .trim()
  .max(2000)
  .url('Must be a valid URL')
  .refine(s => /^https?:\/\//i.test(s), { message: 'Only HTTP/HTTPS URLs allowed' })
  .refine(noScript, { message: 'URL contains disallowed content' })

// ── Route schemas ─────────────────────────────────────────────────────────────

export const SearchSchema = z.object({
  q: safeText(120).min(2, 'Query must be at least 2 characters'),
})

export const PipelineStartSchema = z.object({
  entityName: safeText(200).min(2, 'Entity name must be at least 2 characters'),
  entitySlug: z.string().trim().max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  entityType: z.enum(['employer', 'university', 'hospital', 'law_firm', 'accounting_firm', 'hotel', 'other'])
    .default('employer'),
})

export const SourceSubmitSchema = z.object({
  url:         safeUrl,
  description: safeText(500).optional(),
  entityId:    z.string().uuid().optional(),
})

export const FeedbackSchema = z.object({
  entityId: z.string().uuid(),
  briefId:  z.string().uuid(),
  rating:   z.number().int().min(1).max(5),
  comment:  safeText(1000).optional(),
})

export const RefreshRequestSchema = z.object({
  entitySlug: safeText(200).min(2),
  reason:     safeText(500).optional(),
})

export const AdminApproveSchema = z.object({
  briefId: z.string().uuid(),
  note:    safeText(1000).optional(),
})

export const AdminRejectSchema = z.object({
  briefId: z.string().uuid(),
  reason:  safeText(1000),
})

export const AdminInvalidateEvidenceSchema = z.object({
  evidenceId: z.string().uuid(),
  reason:     safeText(1000),
})

export const EntityMergeSchema = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  reason:         safeText(500).optional(),
})

// ── Validation helper ─────────────────────────────────────────────────────────

type ParseResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: NextResponse }

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): ParseResult<T> {
  const result = schema.safeParse(body)
  if (result.success) return { success: true, data: result.data, error: null }

  const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  return {
    success: false,
    data: null,
    error: NextResponse.json(
      { error: 'Invalid request.', details: messages },
      { status: 400 }
    ),
  }
}

export function parseQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): ParseResult<T> {
  const obj = Object.fromEntries(params.entries())
  return parseBody(schema, obj)
}
