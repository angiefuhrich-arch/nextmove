import OpenAI from 'openai'
import { SIGNAL_NAMES } from './scoring'
import type { CollectedSource } from './data-collection'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export interface SignalScore {
  signal_name: string
  score: number
  confidence: number
  reasoning: string
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  financial_runway: 'Company financial stability and risk of failure/bankruptcy (0=bankrupt risk, 100=extremely stable)',
  ladder_speed: 'Speed of career advancement and promotion velocity (0=very slow, 100=very fast)',
  skill_depreciation_risk: 'Risk that skills learned here will become obsolete quickly (0=no risk, 100=very high risk)',
  network_multiplier: 'Quality and value of professional network built by working here (0=poor, 100=exceptional)',
  layoff_convexity: 'Safety from layoffs — inverse of layoff risk (0=very high layoff risk, 100=very safe)',
  reputation_stain_risk: 'Risk that having this company on your resume hurts future career (0=no risk, 100=severe risk)',
  badge_premium: 'Premium brand value this company adds to your resume (0=no value, 100=massive premium)',
  talent_magnetism: 'Quality of colleagues you will work with (0=poor talent pool, 100=exceptional peers)',
  sector_optionality: 'How many future career doors this role opens across industries (0=very narrow, 100=very broad)',
  cultural_velocity_match: 'How well the company culture supports fast career progression (0=culture blocks growth, 100=culture accelerates growth)',
  global_mobility_index: 'How much this role enables international career moves (0=none, 100=very high)',
  english_working_language: 'Degree to which English is the primary working language (0=minimal, 100=fully English)',
  visa_sponsorship_history: 'Track record of sponsoring work visas for international hires (0=never, 100=always)',
  international_leadership_ratio: 'Proportion of leadership that is internationally diverse (0=all local, 100=highly international)',
  expat_retention_rate: 'How well the company retains international/expat employees (0=poor, 100=excellent)',
  cantonese_requirement_level: 'Degree to which Cantonese is required for day-to-day work (0=not required, 100=mandatory)',
  regional_office_culture: 'How internationally inclusive the regional office culture is (0=very local/insular, 100=very global/inclusive)',
}

function getFallbackScores(companyName: string): SignalScore[] {
  return SIGNAL_NAMES.map(name => ({
    signal_name: name,
    score: 50,
    confidence: 20,
    reasoning: `Insufficient data to score ${companyName} on ${name}. Default neutral score applied.`,
  }))
}

export async function analyzeSignals(
  companyName: string,
  market: string,
  sources: CollectedSource[]
): Promise<SignalScore[]> {
  if (!openai) return getFallbackScores(companyName)

  const evidenceText = sources
    .slice(0, 15)
    .map((s, i) => `[Source ${i + 1}: ${s.source_title} (${s.source_type}, reliability: ${s.reliability_score}/100)]\n${s.raw_text}`)
    .join('\n\n---\n\n')

  const signalList = SIGNAL_NAMES.map(name =>
    `- ${name}: ${SIGNAL_DESCRIPTIONS[name]}`
  ).join('\n')

  const prompt = `You are a career intelligence analyst for Scarsian. Your job is to analyze public evidence about a company and propose signal scores.

Company: ${companyName}
Market: ${market}

EVIDENCE:
${evidenceText || 'No external sources found. Use general industry knowledge with low confidence.'}

INSTRUCTIONS:
- Score each of the 17 signals from 0–100 based ONLY on the evidence above
- Assign confidence 0–100 reflecting how much evidence supports each score
- If evidence is thin, assign low confidence (20–40) and keep score near 50
- Never fabricate facts. Only score what the evidence supports.
- Reasoning must reference specific evidence (e.g., "Source 2 mentions...")

Return a JSON object with key "signals" containing an array of objects, each with:
- signal_name (exact name from list)
- score (0–100 integer)
- confidence (0–100 integer)
- reasoning (1–2 sentences referencing evidence)

SIGNALS TO SCORE:
${signalList}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a structured data extraction agent. Always return valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const signals: SignalScore[] = result.signals ?? []

    // Validate and fill missing signals
    const scored = new Set(signals.map(s => s.signal_name))
    const missing = SIGNAL_NAMES.filter(n => !scored.has(n))
    missing.forEach(name => signals.push({
      signal_name: name,
      score: 50,
      confidence: 20,
      reasoning: 'No evidence found for this signal. Default neutral score applied.',
    }))

    return signals.map(s => ({
      signal_name: s.signal_name,
      score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 50))),
      confidence: Math.max(0, Math.min(100, Math.round(Number(s.confidence) || 30))),
      reasoning: String(s.reasoning || ''),
    }))
  } catch {
    return getFallbackScores(companyName)
  }
}

export async function generateAnalystNote(
  companyName: string,
  market: string,
  scores: { scarsian_score: number; career_growth_score: number; career_risk_score: number; gfi_score: number; verdict: string },
  signals: SignalScore[]
): Promise<string> {
  if (!openai) {
    return `${companyName} in ${market} has been scored with a Scarsian Index of ${scores.scarsian_score}. Verdict: ${scores.verdict}. This note was auto-generated and should be reviewed by an analyst.`
  }

  const topSignals = [...signals]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => `${s.signal_name}: ${s.score}`)
    .join(', ')

  const bottomSignals = [...signals]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(s => `${s.signal_name}: ${s.score}`)
    .join(', ')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior career intelligence analyst at Scarsian. Write concise, professional analyst notes (3–4 sentences) for international professionals considering a career move. Be direct and specific.',
        },
        {
          role: 'user',
          content: `Write an analyst note for ${companyName} (${market}).
Scarsian Index: ${scores.scarsian_score}/100 (${scores.verdict})
Career Growth: ${scores.career_growth_score} | Career Risk: ${scores.career_risk_score} | GFI: ${scores.gfi_score}
Strongest signals: ${topSignals}
Weakest signals: ${bottomSignals}

Note: This is a DRAFT for admin review. The analyst note should be 3–4 sentences summarizing what type of professional this company suits, key strengths, and key risks.`,
        },
      ],
      temperature: 0.5,
    })
    return completion.choices[0].message.content?.trim() ?? ''
  } catch {
    return `${companyName} in ${market} scores ${scores.scarsian_score}/100 on the Scarsian Index (${scores.verdict}). Career growth prospects score ${scores.career_growth_score} while career risk safety scores ${scores.career_risk_score}. The Global Fit Index of ${scores.gfi_score} reflects international accessibility. This note requires analyst review before publication.`
  }
}
