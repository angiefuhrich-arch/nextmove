import { createClient } from '@supabase/supabase-js'
import { MOCK_COMPANIES, MOCK_REPORTS } from '../lib/mock-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Seeding companies...')

  for (const company of MOCK_COMPANIES) {
    const { error } = await supabase.from('companies').upsert(company, { onConflict: 'slug' })
    if (error) console.error(`Error seeding ${company.name}:`, error.message)
    else console.log(`✓ ${company.name}`)
  }

  console.log('\nSeeding company reports...')

  for (const [slug, report] of Object.entries(MOCK_REPORTS)) {
    const company = MOCK_COMPANIES.find(c => c.slug === slug)
    if (!company) continue

    const { error } = await supabase.from('company_reports').upsert({
      ...report,
      company_slug: slug,
      company_id: company.id,
    }, { onConflict: 'id' })
    if (error) console.error(`Error seeding report for ${slug}:`, error.message)
    else console.log(`✓ ${slug} report`)
  }

  console.log('\n✅ Seed complete!')
}

seed().catch(console.error)
