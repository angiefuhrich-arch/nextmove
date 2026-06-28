// Step: Collect
// Fetches content from Tier 1–3 source candidates discovered in the previous step.
// Tier 4 (LinkedIn, Glassdoor, Blind, Reddit, etc.) is excluded entirely.
// Each fetch is SSRF-safe via lib/pipeline/fetch.ts.

import { getCollectibleSources, updateSourceFetch, insertEvidenceRecord, getEvidenceCount } from '../db'
import { safeFetch } from '../fetch'
import { isScrapingAllowed } from '../source-tiers'
import type { PipelineContext, StepResult } from '../types'
import { PIPELINE_VERSION } from '../types'

// Maximum concurrent fetches — stay polite to external servers
const MAX_CONCURRENT = 4
// Minimum Tier 1–3 evidence records required to proceed
const MIN_EVIDENCE_COUNT = 2

async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = []
  const queue = [...tasks]
  const active: Promise<void>[] = []

  return new Promise((resolve, reject) => {
    const next = () => {
      while (active.length < limit && queue.length > 0) {
        const task = queue.shift()!
        const p = task().then(
          result => {
            results.push(result)
            active.splice(active.indexOf(p), 1)
            if (queue.length === 0 && active.length === 0) resolve(results)
            else next()
          },
          reject
        )
        active.push(p)
      }
    }
    next()
    if (queue.length === 0) resolve(results)
  })
}

type EvidenceType = 'financial' | 'leadership' | 'headcount' | 'culture' | 'compensation' | 'legal' | 'product' | 'market' | 'sentiment'

function inferEvidenceType(url: string, title: string): EvidenceType {
  const text = (url + ' ' + title).toLowerCase()
  if (/annual.report|revenue|financial|earnings|profit|loss|funding|ipo|valuation/.test(text)) return 'financial'
  if (/ceo|cto|cfo|leadership|executive|board|founder|management/.test(text))                  return 'leadership'
  if (/layoff|headcount|hiring|redundanc|retrench|job cut|workforce/.test(text))               return 'headcount'
  if (/culture|glassdoor|review|employee|work.?life|burnout/.test(text))                       return 'culture'
  if (/salary|compensation|pay|bonus|equity|stock|benefit/.test(text))                         return 'compensation'
  if (/lawsuit|legal|regulatory|fine|penalty|compliance|investigation/.test(text))             return 'legal'
  if (/product|launch|release|feature|roadmap/.test(text))                                     return 'product'
  if (/market|competitor|growth|expansion|acquisition|merger/.test(text))                      return 'market'
  return 'market'  // default
}

export async function collectStep(ctx: PipelineContext): Promise<StepResult> {
  const sources = await getCollectibleSources(ctx.runId)

  if (sources.length === 0) {
    return {
      success: false,
      insufficientEvidence: true,
      note: 'No Tier 1–3 sources available for collection',
    }
  }

  let successCount = 0
  let failCount    = 0
  let skippedCount = 0

  const fetchTasks = sources.map(source => async () => {
    // Double-check scraping permission via tier rules
    if (!isScrapingAllowed(source.url)) {
      await updateSourceFetch(source.id, { fetchStatus: 'skipped' })
      skippedCount++
      return
    }

    const result = await safeFetch(source.url)

    if (!result.ok) {
      await updateSourceFetch(source.id, {
        fetchStatus: result.error?.startsWith('Blocked') ? 'blocked' : 'failed',
        httpStatus:   result.status,
        fetchError:   result.error,
        contentLength: 0,
      })
      failCount++
      return
    }

    await updateSourceFetch(source.id, {
      fetchStatus:     'success',
      httpStatus:      result.status,
      pageTitle:       result.pageTitle,
      metaDescription: result.metaDescription,
      rawText:         result.excerpt,
      contentLength:   result.contentLength,
    })

    // Build evidence text from what we collected
    const evidenceText = [
      result.pageTitle         ? `Title: ${result.pageTitle}`           : null,
      result.metaDescription   ? `Summary: ${result.metaDescription}`   : null,
      result.excerpt           ? `Content excerpt:\n${result.excerpt}`  : null,
    ].filter(Boolean).join('\n\n')

    if (evidenceText.length > 50) {
      await insertEvidenceRecord({
        pipelineRunId:     ctx.runId,
        entityId:          ctx.entityId,
        sourceCandidateId: source.id,
        evidenceType:      inferEvidenceType(source.url, result.pageTitle ?? ''),
        rawText:           evidenceText,
        sourceUrl:         source.url,
        sourceTier:        source.source_tier,
        pipelineVersion:   PIPELINE_VERSION,
      })
    }

    successCount++
  })

  await runWithConcurrencyLimit(fetchTasks, MAX_CONCURRENT)

  const evidenceCount = await getEvidenceCount(ctx.runId)

  if (evidenceCount < MIN_EVIDENCE_COUNT) {
    return {
      success: false,
      insufficientEvidence: true,
      note: `Only ${evidenceCount} evidence records collected from ${sources.length} sources (${failCount} failed, ${skippedCount} skipped). Minimum is ${MIN_EVIDENCE_COUNT}.`,
    }
  }

  return {
    success: true,
    note: `Collected ${successCount} sources; ${evidenceCount} evidence records stored; ${failCount} failed; ${skippedCount} skipped (Tier 4)`,
  }
}
