import OpenAI from 'openai'
import { CompanyReport, OfferAnalysis } from '@/types'
import { MOCK_REPORTS } from './mock-data'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function generateCompanyReport(companyName: string, slug: string): Promise<Partial<CompanyReport>> {
  // Return mock data if available
  if (MOCK_REPORTS[slug]) return MOCK_REPORTS[slug]

  if (!openai) {
    return getMockReport(companyName)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a career intelligence analyst. Generate a realistic company analysis in JSON format with: overall_score (0-100), verdict ("strong"|"caution"|"no-go"), ai_summary (2 sentences), best_reasons (array of 4 strings), biggest_risks (array of 3 strings), good_for (array of 3 strings), avoid_if (array of 2 strings), confidence_score (0-100), categories (array of 10 objects with category, score, status, explanation). Categories: Financial Stability, Leadership, Work-Life Balance, Compensation, Career Growth, Culture, Layoff Risk, Employee Sentiment, Interview Experience, Promotion Potential. Status is "green" (70+), "yellow" (45-69), "red" (<45).`
        },
        { role: 'user', content: `Generate a career intelligence report for: ${companyName}` }
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch {
    return getMockReport(companyName)
  }
}

export async function generateOfferAnalysis(data: {
  company: string
  role: string
  salary: number
  currentSalary: number
  location: string
  workMode: string
  priority: string
}): Promise<OfferAnalysis> {
  if (!openai) {
    return getMockOfferAnalysis(data)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career advisor. Analyze this job offer and respond in JSON with: recommendation ("accept"|"negotiate"|"decline"), negotiation_tips (array of 3 strings), risk_warnings (array of 2 strings), career_outlook (string about 3-year trajectory), explanation (2-3 sentences).'
        },
        {
          role: 'user',
          content: `Analyze offer: ${data.role} at ${data.company}, salary $${data.salary} (current: $${data.currentSalary}), ${data.location}, ${data.workMode}, priority: ${data.priority}`
        }
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch {
    return getMockOfferAnalysis(data)
  }
}

function getMockReport(companyName: string): Partial<CompanyReport> {
  return {
    overall_score: 72,
    verdict: 'caution',
    ai_summary: `${companyName} is a notable employer in its sector with both opportunities and challenges for career growth. Analysis based on available market data and employee sentiment.`,
    best_reasons: ['Competitive compensation package', 'Career development opportunities', 'Industry expertise and learning', 'Professional network building'],
    biggest_risks: ['Market competition may affect stability', 'Role-specific growth limitations', 'Limited public data available for full assessment'],
    good_for: ['Professionals seeking industry experience', 'People aligned with company mission', 'Those prioritizing learning over maximum pay'],
    avoid_if: ['Maximum compensation is primary goal', 'You prefer larger established companies', 'Fast career advancement is critical'],
    confidence_score: 65,
    last_updated: new Date().toISOString().split('T')[0],
    categories: [
      { category: 'Financial Stability', score: 70, status: 'green', explanation: 'Adequate financial position based on available information.' },
      { category: 'Leadership', score: 68, status: 'yellow', explanation: 'Leadership effectiveness requires more data for full assessment.' },
      { category: 'Work-Life Balance', score: 65, status: 'yellow', explanation: 'Balance varies by team and role based on employee reports.' },
      { category: 'Compensation', score: 72, status: 'green', explanation: 'Compensation is competitive within the sector.' },
      { category: 'Career Growth', score: 70, status: 'green', explanation: 'Growth opportunities exist but depend on individual performance.' },
      { category: 'Culture', score: 68, status: 'yellow', explanation: 'Culture shows positive attributes with room for improvement.' },
      { category: 'Layoff Risk', score: 65, status: 'yellow', explanation: 'Moderate risk level based on industry trends.' },
      { category: 'Employee Sentiment', score: 68, status: 'yellow', explanation: 'Mixed but generally positive employee feedback.' },
      { category: 'Interview Experience', score: 70, status: 'green', explanation: 'Interview process is professional and structured.' },
      { category: 'Promotion Potential', score: 65, status: 'yellow', explanation: 'Promotion pathways exist with merit-based advancement.' },
    ]
  }
}

function getMockOfferAnalysis(data: { company: string; role: string; salary: number; currentSalary: number; priority: string }): OfferAnalysis {
  const raise = ((data.salary - data.currentSalary) / data.currentSalary) * 100
  const recommendation = raise > 15 ? 'accept' : raise > 5 ? 'negotiate' : 'decline'

  return {
    recommendation,
    negotiation_tips: [
      `Request a ${Math.min(raise + 10, 25).toFixed(0)}% higher base given your current compensation`,
      'Negotiate signing bonus to cover transition costs',
      'Ask about equity vesting schedule and refresh policy',
    ],
    risk_warnings: [
      `${data.company} operates in a competitive market — research stability before accepting`,
      'Ensure non-compete clauses won\'t limit future options',
    ],
    career_outlook: `Over 3 years at ${data.company} as ${data.role}, you could expect to advance ${raise > 10 ? 'significantly' : 'moderately'} with strong performance. The role aligns ${data.priority === 'growth' ? 'well' : 'adequately'} with your stated priority of ${data.priority}.`,
    explanation: `Based on a ${raise > 0 ? raise.toFixed(0) + '% salary increase' : 'salary decrease'} and your ${data.priority} priority, we recommend you ${recommendation}. ${recommendation === 'negotiate' ? 'There is room to improve the offer before accepting.' : recommendation === 'accept' ? 'The offer looks favorable overall.' : 'The offer does not meet your career goals.'}`,
  }
}
