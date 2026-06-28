import 'server-only'

// Prompt and schema version registry.
// Bump these when the corresponding prompt or schema changes.
// Stored on every event and signal row for reproducibility + audit.

export const EVIDENCE_SCHEMA_VERSION            = '1.0.0'
export const EVENT_EXTRACTION_PROMPT_VERSION    = '1.0.0'
export const SIGNAL_GENERATION_PROMPT_VERSION   = '1.0.0'

// Minimum evidence thresholds
export const MIN_EVIDENCE_FOR_EVENTS  = 2   // must have ≥2 non-duplicate Tier 1–3 records
export const MIN_EVENTS_FOR_SIGNALS   = 1   // must produce ≥1 substantive event
