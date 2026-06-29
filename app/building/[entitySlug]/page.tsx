'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { PipelineLoader } from '@/components/scarsian/PipelineLoader'
import type { PipelineStatus, StepLogEntry } from '@/lib/pipeline/runner'

const TERMINAL: PipelineStatus[] = ['completed', 'insufficient_evidence', 'failed']
const POLL_INTERVAL = 2000

function BuildingPageInner() {
  const { entitySlug } = useParams<{ entitySlug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawRunId = searchParams.get('runId')
  // Guard against the literal string "undefined" leaking into the URL
  const runId = rawRunId && rawRunId !== 'undefined' ? rawRunId : null

  const [status, setStatus] = useState<PipelineStatus>('queued')
  const [stepLog, setStepLog] = useState<StepLogEntry[]>([])
  const [entityName, setEntityName] = useState(entitySlug)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!runId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/pipeline/${runId}/status`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
        setStepLog(data.stepLog ?? [])
        if (data.entityName) setEntityName(data.entityName)

        if (TERMINAL.includes(data.status) && !redirectedRef.current) {
          redirectedRef.current = true
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeout(() => {
            if (data.status === 'completed') {
              router.push(`/brief/${entitySlug}`)
            } else {
              router.push(`/insufficient/${entitySlug}`)
            }
          }, 1800)
        }
      } catch {
        // ignore transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [runId, entitySlug, router])

  return (
    <PipelineLoader
      entityName={entityName}
      status={status}
      stepLog={stepLog}
    />
  )
}

export default function BuildingPage() {
  return (
    <Suspense fallback={<PipelineLoader entityName="" status="queued" stepLog={[]} />}>
      <BuildingPageInner />
    </Suspense>
  )
}
