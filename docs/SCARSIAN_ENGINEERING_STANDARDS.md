# Scarsian Career Intelligence — Engineering Standards

## 1. AI Boundaries

- AI **proposes** signal scores only. AI never calculates pillars, Scarsian Index, or GFI.
- All scoring is deterministic, server-side, and references a versioned formula.
- `lib/scoring.ts` is the single source of truth for all calculations.
- AI-generated content (analyst notes, signal reasoning) is never used as input to any formula.
- OpenAI API keys must never appear in client-side code or be accessible from the browser.

## 2. Formula Versioning

- Every Scarsian Index calculation must record: `formula_version_id`, `engine_mapping_version`, `calculation_timestamp`, signal IDs used, engine output IDs used.
- Historical snapshots are **immutable**. A new formula version creates new snapshots; it never silently recalculates old ones.
- Formula weights and engine-to-pillar mappings are stored in `formula_versions` and `engine_formula_mappings` tables.
- Changing formula weights requires inserting a new `formula_versions` row with a new version string (e.g. `v1.0.0` → `v1.1.0`). The old row must not be modified.

## 3. Evidence Immutability

- Evidence records are **never overwritten**. If evidence is wrong, mark `disputed = true` on the original record and create a new corrected record referencing `supersedes_id`.
- No `UPDATE` on `evidence_records` except to set `disputed = true` or `review_status`.
- All evidence inserts must record `source_url`, `source_type`, `collected_at`, and `collected_by` (user ID or system).

## 4. Data Access

- Supabase service role client (`lib/supabase/admin.ts`) is **server-side only**. It must never be imported in any file under `app/` that could run in the browser, or in any `components/` file.
- The anon client is used only for read-only public data and auth flows.
- All writes to intelligence tables go through the admin client in API routes.
- Data access layer (DAL) functions in `lib/dal/` are the only place that directly queries intelligence tables. Frontend calls API routes; API routes call DAL functions.

## 5. Row-Level Security

- **Every table** must have RLS enabled and at least one policy defined.
- Default posture: deny all. Policies grant minimum required access.
- Public-read tables: `entities`, `formula_versions`, `engine_formula_mappings` (read-only for authenticated users).
- Write access to all intelligence tables: admin users only (checked via `profiles.is_admin = true`).
- Evidence records: no `DELETE` policy. Disputes only via `UPDATE` setting `disputed = true`.
- Personal data tables (`user_career_profiles`, `user_wallets`): users can only read/write their own rows.

## 6. Admin Authorization

- All `/api/admin/*` routes must verify both: (1) authenticated session, (2) `profiles.is_admin = true`.
- Admin checks use the user-context Supabase client (not the service role client) to enforce RLS on the auth lookup.
- Admin actions must be logged to `audit_logs` with `action`, `entity_type`, `entity_id`, `user_id`, `timestamp`, and a `diff` payload.

## 7. No Score Goes Public Without Approval

- Snapshots remain in `status = 'draft'` until an admin reviews and sets `status = 'approved'`.
- Public-facing pages only surface data from approved snapshots.
- Signal scores are never directly exposed to end users; only final pillar scores and the Scarsian Index are shown.

## 8. Error Handling

- API routes return generic messages to clients: `"Internal server error"`. Detailed errors are logged server-side only.
- Validation errors (missing fields, bad input) return specific messages because they contain no internal state.
- Never return raw Supabase or Postgres error messages to the client.

## 9. TypeScript Strictness

- `npx tsc --noEmit` must pass with zero errors before any commit to the working branch.
- No `any` except in narrow adapter layers with a comment explaining why.
- All database row types are generated from or manually mirrored against the actual schema; no guessing column types.

## 10. Signal Expiry and Decay

- Signals include `expires_at` based on the signal type's default expiry rule.
- Signals must not be hard-deleted on expiry. Set `expired = true` and retain for audit.
- Scoring uses only non-expired signals unless explicitly in a historical recalculation context.
- Signal decay is gradual: weight of a signal decreases linearly as `expires_at` approaches, beginning at 50% of remaining lifetime.

## 11. Rate Limits and Abuse Prevention

- AI analysis endpoints (`/api/admin/analyze`) must be rate-limited per admin user.
- Report generation and unlocking endpoints must validate wallet balance before calling any AI API.
- All Stripe webhook handlers must verify `stripe-signature` header before processing.

## 12. Secrets

- No API keys, service role keys, or webhook secrets in committed files.
- `.env.local` is gitignored.
- All secrets are environment variables accessed via `process.env` on the server only.
