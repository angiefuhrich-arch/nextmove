import OpenAI from 'openai'
import { SIGNAL_NAMES, SCORING_SIGNALS, CONFIDENCE_SIGNALS } from './scoring'
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

// Human-readable descriptions for the AI prompt
const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  // Career Growth Score
  promotion_velocity:
    'Speed of career advancement and promotion within this company (0=extremely slow/no growth, 100=very fast advancement)',
  skill_transferability:
    'How transferable the skills learned here are to other companies and roles (0=very niche/siloed, 100=highly transferable)',
  network_multiplier:
    'Quality and value of the professional network built by working here (0=poor network, 100=exceptional network)',

  // Career Risk Score
  layoff_resilience:
    'How safe employees are from layoffs — inverse of layoff risk (0=very high layoff risk, 100=extremely stable employment)',
  reputation_safety:
    'How safe your professional reputation is by having this company on your CV (0=serious reputational risk, 100=very safe/enhancing)',
  financial_stability:
    'Company financial health and risk of failure/bankruptcy (0=very high risk, 100=extremely stable)',

  // Market Value Score
  badge_premium:
    'Premium brand value this company adds to your resume for future employers (0=no value/negative, 100=massive premium)',
  talent_magnetism:
    'Quality of colleagues you will work with (0=poor talent pool, 100=world-class peers)',
  sector_optionality:
    'Number of future career doors this role opens across industries and sectors (0=very narrow, 100=very broad)',

  // Career Fit Score
  culture_alignment:
    'How well company culture supports meaningful and sustainable career progression (0=culture blocks careers, 100=culture actively accelerates careers)',

  // GFI signals
  communication_accessibility:
    'Ease with which international professionals can communicate effectively day-to-day (0=very difficult, 100=extremely accessible)',
  visa_accessibility:
    'Track record and willingness to sponsor work visas for international hires (0=never sponsors, 100=actively sponsors all cases)',
  international_leadership:
    'Proportion of leadership that is internationally diverse (0=entirely local, 100=highly international at all levels)',
  expat_retention:
    'How well the company retains international/expat employees long-term (0=very poor retention, 100=excellent retention)',
  language_accessibility:
    'Degree to which the primary working language is accessible to international professionals — English-first scores highest (0=local language only, 100=fully English)',
  regional_autonomy:
    'How much decision-making power and independence the regional office has vs. HQ (0=fully HQ-controlled, 100=fully autonomous regional office)',

  // Adjustment layer
  momentum_score:
    'Company career outlook trend over the past 12 months — is the career opportunity improving or deteriorating? (0=rapidly deteriorating, 50=stable/neutral, 100=rapidly improving)',
  volatility_score:
    'Instability level from layoffs, exec turnover, restructuring, scandals, earnings surprises (0=very stable, 100=extremely volatile/unstable)',

  // Confidence signals (assessed separately)
  evidence_coverage:
    'How much public evidence was found about career outcomes at this company (0=almost none, 100=extensive coverage)',
  data_freshness:
    'How recent and up-to-date the evidence is (0=very outdated/stale, 100=very recent/current)',
  cross_source_agreement:
    'How consistently different sources agree on career outcomes at this company (0=highly contradictory, 100=very consistent)',
  sample_reliability:
    'How reliable and credible the sources are (0=low quality/biased sources, 100=high quality/authoritative sources)',
}

function buildFallbackScores(companyName: string): SignalScore[] {
  return SIGNAL_NAMES.map(name => ({
    signal_name: name,
    score: 50,
    confidence: 20,
    reasoning: `Insufficient public data to score ${companyName} on ${name}. Neutral default applied.`,
  }))
}

export async function analyzeSignals(
  companyName: string,
  market: string,
  sources: CollectedSource[]
): Promise<SignalScore[]> {
  if (!openai) return buildFallbackScores(companyName)

  const evidenceText = sources
    .slice(0, 15)
    .map((s, i) =>
      `[Source ${i + 1}: "${s.source_title}" | type: ${s.source_type} | reliability: ${s.reliability_score}/100${s.published_date ? ` | date: ${s.published_date}` : ''}]\n${s.raw_text}`
    )
    .join('\n\n---\n\n')

  const scoringList = SCORING_SIGNALS.map(n => `- ${n}: ${SIGNAL_DESCRIPTIONS[n]}`).join('\n')
  const confidenceList = CONFIDENCE_SIGNALS.map(n => `- ${n}: ${SIGNAL_DESCRIPTIONS[n]}`).join('\n')

  const prompt = `You are a career intelligence analyst at Scarsian. Your task is to analyze public evidence about a company and propose signal scores. The backend will calculate the final Scarsian Index — you never compute the final score.

Company: ${companyName}
Market: ${market}

EVIDENCE:
${evidenceText || 'No external sources were found. Score all signals at 50 with confidence 20 and note the lack of evidence.'}

YOUR INSTRUCTIONS:
1. Score each signal from 0–100 based ONLY on the evidence above.
2. Never invent facts. If evidence is thin, score near 50 with low confidence (20–35).
3. Each score must include reasoning that references specific sources by number (e.g. "Source 2 states...").
4. Confidence reflects how strongly the evidence supports your score — not your general knowledge.
5. For momentum_score: 50 = stable/neutral, >50 = improving, <50 = deteriorating.
6. For volatility_score: 0 = very stable, 100 = extremely volatile.
7. Score confidence signals (evidence_coverage, data_freshness, etc.) based on the quality of the evidence you received, not on the company.

SCORING SIGNALS (score each 0–100):
${scoringList}

CONFIDENCE SIGNALS (score each 0–100 — assess the evidence quality, not the company):
${confidenceList}

Return a JSON object with key "signals" containing an array. Each item:
{
  "signal_name": "<exact name>",
  "score": <integer 0–100>,
  "confidence": <integer 0–100>,
  "reasoning": "<1–2 sentences citing sources>"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a structured data extraction agent. Always return valid JSON with no markdown.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const rawSignals: SignalScore[] = result.signals ?? []

    // Index by name for fast lookup
    const byName = new Map(rawSignals.map(s => [s.signal_name, s]))

    // Build validated output, filling missing signals with defaults
    return SIGNAL_NAMES.map(name => {
      const raw = byName.get(name)
      if (!raw) {
        return {
          signal_name: name,
          score: 50,
          confidence: 20,
          reasoning: `No evidence found for this signal. Neutral default applied.`,
        }
      }
      return {
        signal_name: name,
        score: clamp(Math.round(Number(raw.score) || 50)),
        confidence: clamp(Math.round(Number(raw.confidence) || 25)),
        reasoning: String(raw.reasoning || ''),
      }
    })
  } catch {
    return buildFallbackScores(companyName)
  }
}

export async function generateAnalystNote(
  companyName: string,
  market: string,
  scores: {
    scarsian_score: number
    career_growth_score: number
    career_risk_score: number
    market_value_score: number
    career_fit_score: number
    gfi_score: number
    verdict: string
    insufficient_data: boolean
  },
  signals: SignalScore[]
): Promise<string> {
  if (scores.insufficient_data) {
    return `Insufficient public data to generate a reliable analyst note for ${companyName} in ${market}. Evidence coverage is too low to support a confident assessment. Additional research is recommended before publication.`
  }

  if (!openai) {
    return `${companyName} (${market}) scores ${scores.scarsian_score}/100 on the Scarsian Index (${scores.verdict}). Career Growth: ${scores.career_growth_score} | Risk Safety: ${scores.career_risk_score} | GFI: ${scores.gfi_score}. This note requires analyst review before publication.`
  }

  const scoringSignals = signals.filter(s => !(['evidence_coverage','data_freshness','cross_source_agreement','sample_reliability'] as string[]).includes(s.signal_name))
  const top3 = [...scoringSignals].sort((a, b) => b.score - a.score).slice(0, 3).map(s => `${s.signal_name} (${s.score})`).join(', ')
  const bottom3 = [...scoringSignals].sort((a, b) => a.score - b.score).slice(0, 3).map(s => `${s.signal_name} (${s.score})`).join(', ')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior career intelligence analyst at Scarsian. Write sharp, specific, professional analyst notes for international professionals weighing a career move. Be direct. No filler.',
        },
        {
          role: 'user',
          content: `Write a 3–4 sentence analyst note (DRAFT — for admin review) for ${companyName} in ${market}.

Scarsian Index: ${scores.scarsian_score}/100 (${scores.verdict})
Career Growth: ${scores.career_growth_score} | Risk Safety: ${scores.career_risk_score} | Market Value: ${scores.market_value_score} | Career Fit: ${scores.career_fit_score} | GFI: ${scores.gfi_score}
Strongest signals: ${top3}
Weakest signals: ${bottom3}

Cover: who this company suits, key career strengths, key risks, and one sentence on international accessibility.`,
        },
      ],
      temperature: 0.4,
    })
    return completion.choices[0].message.content?.trim() ?? ''
  } catch {
    return `${companyName} (${market}) scores ${scores.scarsian_score}/100 on the Scarsian Index (${scores.verdict}). Strongest signals: ${top3}. Weakest signals: ${bottom3}. This note requires analyst review before publication.`
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v))
}
