import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOfferAnalysis } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { company, role, salary, currentSalary, location, workMode, priority } = body

    const analysis = await generateOfferAnalysis({
      company,
      role,
      salary: Number(salary),
      currentSalary: Number(currentSalary),
      location,
      workMode,
      priority,
    })

    // Store in DB if available
    try {
      await supabase.from('offer_analyses').insert({
        user_id: user.id,
        company_name: company,
        role_title: role,
        salary_offered: Number(salary),
        current_salary: Number(currentSalary),
        recommendation: analysis.recommendation,
        analysis_data: analysis,
      })
    } catch {}

    return NextResponse.json(analysis)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
