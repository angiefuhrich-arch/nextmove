import { Company, CompanyReport } from '@/types'

export const MOCK_COMPANIES: Company[] = [
  {
    id: '1', name: 'Google', slug: 'google', industry: 'Technology', size: '100,000+',
    headquarters: 'Mountain View, CA', founded: 1998, website: 'google.com',
    description: 'Global technology leader in search, cloud, AI, and advertising.'
  },
  {
    id: '2', name: 'Meta', slug: 'meta', industry: 'Technology', size: '70,000+',
    headquarters: 'Menlo Park, CA', founded: 2004, website: 'meta.com',
    description: 'Social media and metaverse company behind Facebook, Instagram, and WhatsApp.'
  },
  {
    id: '3', name: 'Amazon', slug: 'amazon', industry: 'Technology / E-commerce', size: '1,500,000+',
    headquarters: 'Seattle, WA', founded: 1994, website: 'amazon.com',
    description: 'World\'s largest e-commerce platform and cloud computing provider (AWS).'
  },
  {
    id: '4', name: 'Microsoft', slug: 'microsoft', industry: 'Technology', size: '220,000+',
    headquarters: 'Redmond, WA', founded: 1975, website: 'microsoft.com',
    description: 'Enterprise software, cloud (Azure), and AI platform leader.'
  },
  {
    id: '5', name: 'Canva', slug: 'canva', industry: 'Design / SaaS', size: '4,000+',
    headquarters: 'Sydney, Australia', founded: 2013, website: 'canva.com',
    description: 'Design platform making visual content creation accessible to everyone.'
  },
  {
    id: '6', name: 'Stripe', slug: 'stripe', industry: 'Fintech', size: '8,000+',
    headquarters: 'San Francisco, CA', founded: 2010, website: 'stripe.com',
    description: 'Global payments infrastructure and financial tools for businesses.'
  },
  {
    id: '7', name: 'HSBC', slug: 'hsbc', industry: 'Banking / Finance', size: '220,000+',
    headquarters: 'London, UK', founded: 1865, website: 'hsbc.com',
    description: 'One of the world\'s largest banking and financial services organisations.'
  },
  {
    id: '8', name: 'Airwallex', slug: 'airwallex', industry: 'Fintech', size: '1,500+',
    headquarters: 'Melbourne, Australia', founded: 2015, website: 'airwallex.com',
    description: 'Global payments and financial infrastructure platform for modern businesses.'
  },
  {
    id: '9', name: 'Glue Up', slug: 'glue-up', industry: 'SaaS / Community', size: '300+',
    headquarters: 'Washington, DC', founded: 2013, website: 'glueup.com',
    description: 'Community management and event platform for associations and chambers.'
  },
  {
    id: '10', name: 'Salesforce', slug: 'salesforce', industry: 'Enterprise SaaS', size: '70,000+',
    headquarters: 'San Francisco, CA', founded: 1999, website: 'salesforce.com',
    description: 'World\'s #1 CRM and enterprise cloud platform.'
  },
  {
    id: '11', name: 'HubSpot', slug: 'hubspot', industry: 'Marketing / SaaS', size: '7,000+',
    headquarters: 'Cambridge, MA', founded: 2006, website: 'hubspot.com',
    description: 'Inbound marketing, sales, and service software platform.'
  },
  {
    id: '12', name: 'Revolut', slug: 'revolut', industry: 'Fintech', size: '8,000+',
    headquarters: 'London, UK', founded: 2015, website: 'revolut.com',
    description: 'Global neobank offering banking, trading, and crypto services.'
  },
]

export const MOCK_REPORTS: Record<string, CompanyReport> = {
  google: {
    id: 'r1', company_id: '1', overall_score: 88, verdict: 'strong',
    ai_summary: 'Google remains one of the most desirable employers in tech. Strong compensation, world-class engineering culture, and exceptional career development opportunities. Bureaucracy has increased post-2022, and recent layoffs signal strategic shifts, but the fundamentals remain strong for ambitious engineers and product people.',
    best_reasons: ['Industry-leading compensation and equity', 'Unmatched learning and development resources', 'Cutting-edge technical problems at massive scale', 'Strong alumni network and brand recognition', 'Excellent benefits including healthcare and parental leave'],
    biggest_risks: ['Growing bureaucracy and slower decision-making', 'Post-layoff uncertainty in some product areas', 'Highly competitive internal promotions', 'Role can feel siloed in large org'],
    good_for: ['Senior engineers seeking scale and compensation', 'New grads wanting career acceleration', 'Product managers in AI/Cloud', 'Anyone valuing brand and stability'],
    avoid_if: ['You prefer startup speed and autonomy', 'You want direct business impact visibility', 'You dislike performance review culture'],
    confidence_score: 91,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 95, status: 'green', explanation: 'Exceptionally strong balance sheet. Revenue diversified across Search, Cloud, YouTube, and AI. Near-zero bankruptcy risk.' },
      { category: 'Leadership', score: 75, status: 'green', explanation: 'Sundar Pichai provides steady direction. Some criticism over layoff handling but overall respected externally.' },
      { category: 'Work-Life Balance', score: 72, status: 'green', explanation: 'Generally good, with 20% time and flexibility. Varies significantly by team and manager.' },
      { category: 'Compensation', score: 93, status: 'green', explanation: 'Top-tier total comp including base, bonus, and RSUs. Refreshes are competitive.' },
      { category: 'Career Growth', score: 82, status: 'green', explanation: 'Strong internal mobility, mentorship programs, and clear leveling. Promotion can be slow at higher levels.' },
      { category: 'Culture', score: 80, status: 'green', explanation: 'Intellectual, data-driven culture. Psychological safety generally high. Post-2022 culture shift noted by some.' },
      { category: 'Layoff Risk', score: 78, status: 'green', explanation: 'Had significant layoffs in 2023-24 but focused. Core business units remain stable. AI pivot adds uncertainty.' },
      { category: 'Employee Sentiment', score: 84, status: 'green', explanation: 'Glassdoor 4.3/5. High satisfaction with benefits and teammates. Lower scores for work volume.' },
      { category: 'Interview Experience', score: 70, status: 'green', explanation: 'Rigorous but fair. Algorithm-heavy. Known process. Feedback not always provided. 2-4 month cycle typical.' },
      { category: 'Promotion Potential', score: 76, status: 'green', explanation: 'Structured levels (L3-L10). Promotion requires strong peer-reviewed evidence. Slower at senior levels.' },
    ]
  },
  meta: {
    id: 'r2', company_id: '2', overall_score: 78, verdict: 'strong',
    ai_summary: 'Meta offers exceptional compensation and has stabilized after the 2022-23 "Year of Efficiency." The Metaverse bet remains controversial, but the core ads business is strong. AI investment is accelerating. Best for high-performers who thrive in performance-driven environments and want top-of-market pay.',
    best_reasons: ['Top-quartile compensation in tech', 'Performance-driven culture rewards high output', 'Significant AI and infrastructure investment', 'Fast decision-making compared to Google', 'Strong eng culture'],
    biggest_risks: ['Intense performance pressure with forced ranking', 'Metaverse pivot uncertainty', 'Regulatory and reputational risk', 'Cultural shift post-Zuckerberg refocus'],
    good_for: ['High performers wanting maximum comp', 'Engineers in AI/ML and infrastructure', 'People who thrive under pressure'],
    avoid_if: ['You need psychological safety and low pressure', 'Brand/mission matters to you', 'You prefer collaborative over competitive culture'],
    confidence_score: 87,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 88, status: 'green', explanation: 'Strong ad revenue recovery. Reality Labs losses are significant but contained. Solid free cash flow.' },
      { category: 'Leadership', score: 68, status: 'yellow', explanation: 'Zuckerberg remains decisive but polarizing. "Year of Efficiency" was well-executed. Metaverse strategy still questioned.' },
      { category: 'Work-Life Balance', score: 62, status: 'yellow', explanation: '"Always-on" culture in many teams. High performer bar can mean long hours. Depends heavily on team.' },
      { category: 'Compensation', score: 95, status: 'green', explanation: 'Industry-leading total comp. Significant RSU grants. Refreshes aggressive for top performers.' },
      { category: 'Career Growth', score: 75, status: 'green', explanation: 'Fast growth for strong performers. PIP culture creates risk. IC track well-defined.' },
      { category: 'Culture', score: 65, status: 'yellow', explanation: 'Move fast culture remains. More aggressive since 2022. Mission alignment harder with metaverse focus.' },
      { category: 'Layoff Risk', score: 60, status: 'yellow', explanation: 'Significant 2022-2023 layoffs. Stabilized but performance-based exits remain common.' },
      { category: 'Employee Sentiment', score: 72, status: 'green', explanation: 'Glassdoor 3.9/5. High comp satisfaction. Lower scores for culture and work-life balance.' },
      { category: 'Interview Experience', score: 72, status: 'green', explanation: 'Behavioral + coding focus. Fairly efficient. System design for senior roles. Clear rubric.' },
      { category: 'Promotion Potential', score: 70, status: 'green', explanation: 'Fast for strong performers. Biannual cycles. Forced distribution means competition is real.' },
    ]
  },
  amazon: {
    id: 'r3', company_id: '3', overall_score: 65, verdict: 'caution',
    ai_summary: 'Amazon offers massive scale, strong compensation, and unmatched operational experience. However, the intense pressure culture, RTO mandates, and leadership principles-driven environment can be exhausting. Excellent for career acceleration if you can handle the pace, but not for everyone.',
    best_reasons: ['Unmatched operational scale and learning', 'Strong career acceleration (2-3 years feels like 5)', 'Competitive compensation with RSU vesting', 'Huge internal mobility across AWS, Retail, etc.', 'Brand is resume gold'],
    biggest_risks: ['Very high stress and burnout rate', 'Leadership principles used in everything, intensely', 'Full return-to-office mandate', 'High turnover — average tenure ~18 months', 'Bureaucracy and process-heavy'],
    good_for: ['Career accelerators who can handle pressure', 'Ops, supply chain, and PM professionals', 'Engineers seeking AWS scale and depth'],
    avoid_if: ['Work-life balance is a priority', 'You prefer flat or startup cultures', 'Remote or hybrid is non-negotiable'],
    confidence_score: 89,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 92, status: 'green', explanation: 'AWS dominates cloud. Retail profitability improved. Balance sheet is fortress-level.' },
      { category: 'Leadership', score: 60, status: 'yellow', explanation: 'Andy Jassy is operational. Leadership Principles are deeply embedded. Top-down culture.' },
      { category: 'Work-Life Balance', score: 38, status: 'red', explanation: 'Widely cited as poor. 5-day RTO enforced. High output expectations. Burnout is common.' },
      { category: 'Compensation', score: 80, status: 'green', explanation: 'Competitive base cap ($350k), strong RSUs. Back-loaded vesting (5/15/40/40) causes Year 1-2 pain.' },
      { category: 'Career Growth', score: 78, status: 'green', explanation: 'Accelerated learning environment. Internal moves common. Promotion culture is merit-driven.' },
      { category: 'Culture', score: 50, status: 'yellow', explanation: 'Leadership Principles define everything. Meritocratic but can feel aggressive. Strong Disagree & Commit culture.' },
      { category: 'Layoff Risk', score: 55, status: 'yellow', explanation: 'Multiple large-scale layoffs 2022-2024. PIPs common. Performance bar is consistently enforced.' },
      { category: 'Employee Sentiment', score: 58, status: 'yellow', explanation: 'Glassdoor 3.5/5. High variance — AWS employees rate higher than retail. Stress frequently cited.' },
      { category: 'Interview Experience', score: 62, status: 'yellow', explanation: 'LP (Leadership Principles) behavioral heavy. Bar raiser adds unpredictability. 4-8 week process.' },
      { category: 'Promotion Potential', score: 65, status: 'yellow', explanation: 'Clear levels (SDE I-III, Principal). Promotion is rigorous but achievable with right manager.' },
    ]
  },
  microsoft: {
    id: 'r4', company_id: '4', overall_score: 85, verdict: 'strong',
    ai_summary: 'Microsoft under Satya Nadella has undergone a remarkable cultural transformation. The growth mindset philosophy has created a psychologically safe, collaborative environment. Strong compensation, excellent work-life balance relative to peers, and the AI/Copilot wave makes this a top destination in 2025.',
    best_reasons: ['Best work-life balance among FAANG-tier companies', 'Strong AI/Copilot growth story', 'Collaborative, growth mindset culture', 'Excellent healthcare and parental leave', 'Strong internal mobility'],
    biggest_risks: ['Slower pace than some startups', 'SharePoint/legacy product teams can be slow-moving', 'Acquisition integration challenges', 'Comp slightly below Google/Meta'],
    good_for: ['People prioritizing balance and culture', 'Enterprise SaaS and PM professionals', 'AI/ML engineers wanting real-world deployment', 'Parents and people with life obligations'],
    avoid_if: ['You want maximum total comp', 'You prefer fast-paced startup energy', 'You dislike enterprise software customers'],
    confidence_score: 90,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 96, status: 'green', explanation: 'Azure growth trajectory strong. Diversified across cloud, Office 365, gaming, LinkedIn. Excellent balance sheet.' },
      { category: 'Leadership', score: 88, status: 'green', explanation: 'Satya Nadella widely respected. Growth mindset transformation is real and embedded. Clear AI vision.' },
      { category: 'Work-Life Balance', score: 85, status: 'green', explanation: 'Best in class for its size. Flexible work arrangements. Culture actively discourages burnout.' },
      { category: 'Compensation', score: 84, status: 'green', explanation: 'Very competitive. Slightly below Google/Meta at top levels but better than most. Good refresh cycle.' },
      { category: 'Career Growth', score: 83, status: 'green', explanation: 'Clear career paths. Internal transfers common. Managers invested in growth. Learning culture.' },
      { category: 'Culture', score: 87, status: 'green', explanation: 'Growth mindset is real. Collaborative, low politics. Psychological safety consistently high.' },
      { category: 'Layoff Risk', score: 72, status: 'green', explanation: 'Had layoffs in 2023 but managed thoughtfully. Business fundamentals very strong going forward.' },
      { category: 'Employee Sentiment', score: 85, status: 'green', explanation: 'Glassdoor 4.4/5. Consistently one of the highest among large tech companies.' },
      { category: 'Interview Experience', score: 78, status: 'green', explanation: 'Behavioral + coding. More collaborative than Google. Timelines reasonable at 3-5 weeks.' },
      { category: 'Promotion Potential', score: 80, status: 'green', explanation: 'Structured and fair. Biannual reviews. Managers are generally advocates for their reports.' },
    ]
  },
  canva: {
    id: 'r5', company_id: '5', overall_score: 81, verdict: 'strong',
    ai_summary: 'Canva is one of the most exciting scale-up opportunities globally. With 175M+ users, a mission-driven culture, and recent profitability, it offers the rare combo of startup energy with product-market fit certainty. Compensation is below US Big Tech but exceptional for Australia. IPO expected.',
    best_reasons: ['Rare mission-driven product with massive reach', 'Strong culture and values alignment', 'Pre-IPO equity opportunity', 'Exceptional Sydney office and culture', 'High-impact work at real scale'],
    biggest_risks: ['Compensation below US Big Tech peers', 'Sydney-based (timezone for remote)', 'IPO timeline uncertainty', 'Rapidly scaling culture growing pains'],
    good_for: ['Mission-driven product professionals', 'Designers and creatives wanting impact', 'Engineers wanting pre-IPO equity', 'People in Sydney/AU job market'],
    avoid_if: ['US Big Tech comp is your benchmark', 'You need fully remote in US timezone', 'You prefer established enterprise stability'],
    confidence_score: 84,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 85, status: 'green', explanation: 'Achieved profitability. $40B valuation. Strong SaaS revenue growth. IPO runway is solid.' },
      { category: 'Leadership', score: 88, status: 'green', explanation: 'Melanie Perkins is widely admired. Founders still deeply involved. Mission is genuine and lived.' },
      { category: 'Work-Life Balance', score: 80, status: 'green', explanation: 'Generally healthy. Strong parental leave. Growth phase means some intensity but not Amazon-level.' },
      { category: 'Compensation', score: 72, status: 'green', explanation: 'Top-tier for Australia. Below US FAANG. Equity is the real upside given IPO trajectory.' },
      { category: 'Career Growth', score: 82, status: 'green', explanation: 'Rapid company growth creates genuine opportunities. Good mentorship. Engineers have broad impact.' },
      { category: 'Culture', score: 90, status: 'green', explanation: 'One of the strongest cultures in tech. Values are real. High bar on hiring for culture fit.' },
      { category: 'Layoff Risk', score: 80, status: 'green', explanation: 'Profitable and growing. No significant layoffs historically. IPO prep adds some uncertainty.' },
      { category: 'Employee Sentiment', score: 86, status: 'green', explanation: 'Glassdoor 4.5/5. Culture and mission consistently praised. Location cited as limiting for some.' },
      { category: 'Interview Experience', score: 75, status: 'green', explanation: 'Values-based + technical. Fair process. Clear feedback. 3-4 week timeline typical.' },
      { category: 'Promotion Potential', score: 78, status: 'green', explanation: 'Company growth creates real advancement. Career framework clear. Performance culture fair.' },
    ]
  },
  stripe: {
    id: 'r6', company_id: '6', overall_score: 83, verdict: 'strong',
    ai_summary: 'Stripe remains one of the most intellectually stimulating places to work in tech. Writing culture, high bars, and exceptionally smart colleagues define the experience. Post-2022 restructuring has stabilized operations. For senior engineers and finance-adjacent PMs, this is a top-tier choice.',
    best_reasons: ['Exceptionally high intellectual bar — colleagues are outstanding', 'Writing culture produces clarity and thoughtfulness', 'Critical financial infrastructure role (mission matters)', 'Strong compensation and pre-IPO equity', 'Influential alumni network'],
    biggest_risks: ['Very high bar creates intense culture', 'Post-IPO timeline still unclear', 'Remote culture varies by team', 'Smaller than FAANG — fewer lateral moves'],
    good_for: ['Senior engineers wanting intellectual depth', 'Finance/fintech PM professionals', 'Writers and structured thinkers', 'People valuing company impact'],
    avoid_if: ['You prefer large internal mobility networks', 'Need immediate liquidity from equity', 'Prefer casual or relaxed cultures'],
    confidence_score: 85,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 88, status: 'green', explanation: 'Strong revenue from payments volume. Path to IPO clear. Institutional investor confidence high.' },
      { category: 'Leadership', score: 85, status: 'green', explanation: 'Collison brothers still deeply involved. Thoughtful leadership style. Long-term thinking embedded.' },
      { category: 'Work-Life Balance', score: 72, status: 'green', explanation: 'High bar creates intensity. Generally manageable. Better than Amazon but not Microsoft.' },
      { category: 'Compensation', score: 87, status: 'green', explanation: 'Very competitive. Equity is the big variable — IPO timing matters significantly.' },
      { category: 'Career Growth', score: 82, status: 'green', explanation: 'Deep learning opportunities. Writing skills developed. Smaller org than FAANG limits some moves.' },
      { category: 'Culture', score: 84, status: 'green', explanation: 'Writing-first, thoughtful, high-bar culture. Intellectual and rewarding. Can feel intense.' },
      { category: 'Layoff Risk', score: 75, status: 'green', explanation: '2022 layoffs were handled relatively well. Business fundamentals strong. Risk is manageable.' },
      { category: 'Employee Sentiment', score: 82, status: 'green', explanation: 'Glassdoor 4.2/5. High on intellectual stimulation. Some frustration with pace of decisions.' },
      { category: 'Interview Experience', score: 80, status: 'green', explanation: 'Rigorous but respectful. Writing exercise distinctive. System design heavy for senior roles.' },
      { category: 'Promotion Potential', score: 78, status: 'green', explanation: 'Clear career levels. High bar for promotion but process is fair and transparent.' },
    ]
  },
  hsbc: {
    id: 'r7', company_id: '7', overall_score: 58, verdict: 'caution',
    ai_summary: 'HSBC offers stability, global exposure, and competitive compensation for banking. However, the bureaucratic culture, slow decision-making, and regulatory environment can frustrate candidates from tech backgrounds. Best for those pursuing traditional banking careers with international mobility.',
    best_reasons: ['Exceptional global mobility across 60+ countries', 'Stable employer with 160-year track record', 'Strong compensation in banking tiers', 'Prestigious brand for finance careers', 'Comprehensive benefits and pension'],
    biggest_risks: ['Heavy bureaucracy and slow decision-making', 'Technology is significantly behind fintech peers', 'Regulatory risk and scrutiny', 'Cultural resistance to change'],
    good_for: ['Traditional banking and finance professionals', 'People seeking international career moves', 'Risk, compliance, and regulatory specialists'],
    avoid_if: ['You come from tech and value speed/innovation', 'You prefer flat hierarchies', 'Remote work is important to you'],
    confidence_score: 82,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 82, status: 'green', explanation: 'Systemically important bank. Strong capital ratios. Some exposure to HK/China geopolitical risk.' },
      { category: 'Leadership', score: 58, status: 'yellow', explanation: 'Georges Elhedery new CEO. Strategic direction shifting. Leadership transitions create uncertainty.' },
      { category: 'Work-Life Balance', score: 60, status: 'yellow', explanation: 'Better than investment banking but variable. Front office demanding. Operations more balanced.' },
      { category: 'Compensation', score: 72, status: 'green', explanation: 'Competitive within banking. Below tech peers for tech roles. Strong bonus in front office.' },
      { category: 'Career Growth', score: 58, status: 'yellow', explanation: 'Slow career progression. Hierarchy deeply embedded. International moves are a genuine benefit.' },
      { category: 'Culture', score: 50, status: 'yellow', explanation: 'Traditional, hierarchical, formal. Significant effort to modernize but change is slow.' },
      { category: 'Layoff Risk', score: 45, status: 'yellow', explanation: 'Regular restructuring rounds. 35,000 job cuts announced in recent years. Uncertainty persists.' },
      { category: 'Employee Sentiment', score: 55, status: 'yellow', explanation: 'Glassdoor 3.7/5. Stability praised. Culture and pace of change criticized frequently.' },
      { category: 'Interview Experience', score: 65, status: 'yellow', explanation: 'Structured competency-based. Slow process (6-12 weeks). Background checks extensive.' },
      { category: 'Promotion Potential', score: 48, status: 'yellow', explanation: 'Slow and tenure-based in many areas. Merit matters less than expected. Politics play a role.' },
    ]
  },
  airwallex: {
    id: 'r8', company_id: '8', overall_score: 76, verdict: 'strong',
    ai_summary: 'Airwallex is one of the most promising fintech scale-ups globally, now valued at $5.6B with a clear path to profitability. The fast-paced culture and global footprint make it exciting for fintech professionals. Compensation is competitive for APAC. IPO anticipated within 2-3 years.',
    best_reasons: ['High-growth fintech with real revenue and path to IPO', 'Global operations — genuine international exposure', 'Competitive equity and comp for APAC', 'Mission is tangible: democratizing global business finance', 'Fast-paced, entrepreneurial culture'],
    biggest_risks: ['Still scaling — processes and structure evolving', 'Intense pace can lead to burnout', 'APAC-centric timezone for some roles', 'Pre-IPO equity risk'],
    good_for: ['Fintech product and engineering talent', 'People seeking pre-IPO opportunities', 'Professionals with APAC market experience'],
    avoid_if: ['Need structured, established processes', 'Work-life balance is top priority', 'Prefer US-centric organizations'],
    confidence_score: 80,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 80, status: 'green', explanation: '$5.6B valuation. Nearing profitability. Strong investor backing (DST, Salesforce Ventures).' },
      { category: 'Leadership', score: 78, status: 'green', explanation: 'Jack Zhang is respected and visible. Founders still driving. Strong fintech domain expertise.' },
      { category: 'Work-Life Balance', score: 62, status: 'yellow', explanation: 'Scale-up pace means long hours in many teams. Culture improving as company matures.' },
      { category: 'Compensation', score: 74, status: 'green', explanation: 'Strong for APAC market. Equity is meaningful at current stage. Below US Big Tech.' },
      { category: 'Career Growth', score: 80, status: 'green', explanation: 'Company growth creates real opportunities fast. Talented, learning-focused environment.' },
      { category: 'Culture', score: 75, status: 'green', explanation: 'Fast-paced, mission-aligned. Some cultural friction as company scales globally.' },
      { category: 'Layoff Risk', score: 72, status: 'green', explanation: 'No significant layoffs. Growing headcount overall. Pre-IPO risk of adjustments exists.' },
      { category: 'Employee Sentiment', score: 74, status: 'green', explanation: 'Glassdoor 4.0/5. Growth opportunity praised. Work-life balance noted as challenging.' },
      { category: 'Interview Experience', score: 70, status: 'green', explanation: 'Technical + values-based. Reasonably efficient at 3-4 weeks. Good candidate experience.' },
      { category: 'Promotion Potential', score: 76, status: 'green', explanation: 'Fast growth company means frequent advancement for strong performers. Framework maturing.' },
    ]
  },
  'glue-up': {
    id: 'r9', company_id: '9', overall_score: 62, verdict: 'caution',
    ai_summary: 'Glue Up is a niche SaaS company serving associations and community organizations. It offers stability and work-life balance but limited career trajectory compared to high-growth alternatives. Good for professionals seeking meaningful work in a low-pressure environment.',
    best_reasons: ['Clear product focus and customer base', 'Good work-life balance', 'Remote-friendly culture', 'Stable niche market position', 'Manageable complexity'],
    biggest_risks: ['Limited growth trajectory vs. larger companies', 'Below-market compensation vs. Big Tech', 'Small team limits career diversity', 'Niche market caps upside'],
    good_for: ['Community and nonprofit sector professionals', 'People wanting work-life balance', 'Professionals who prefer smaller teams'],
    avoid_if: ['High growth and career acceleration is priority', 'Compensation is a primary driver', 'You want exposure to large-scale engineering'],
    confidence_score: 71,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 65, status: 'yellow', explanation: 'Bootstrapped to profitability. Stable but not high-growth. Limited public financial data.' },
      { category: 'Leadership', score: 68, status: 'yellow', explanation: 'Founder-led, focused. Limited visibility into senior leadership decision-making externally.' },
      { category: 'Work-Life Balance', score: 80, status: 'green', explanation: 'Strong work-life balance cited consistently. Remote work options. Reasonable hours.' },
      { category: 'Compensation', score: 55, status: 'yellow', explanation: 'Below market for tech roles. Adequate for niche market. Limited equity upside.' },
      { category: 'Career Growth', score: 55, status: 'yellow', explanation: 'Limited by company size and growth rate. Good for learning fundamentals.' },
      { category: 'Culture', score: 70, status: 'green', explanation: 'Collaborative and supportive. Mission-aligned with community focus. Positive environment.' },
      { category: 'Layoff Risk', score: 65, status: 'yellow', explanation: 'Small company risk. Profitable but exposed to economic shifts in association sector.' },
      { category: 'Employee Sentiment', score: 68, status: 'yellow', explanation: 'Glassdoor 3.8/5. Work-life balance praised. Limited growth opportunities noted.' },
      { category: 'Interview Experience', score: 65, status: 'yellow', explanation: 'Straightforward process. Values and skills focused. Typically 2-3 week timeline.' },
      { category: 'Promotion Potential', score: 50, status: 'yellow', explanation: 'Limited by company size. Flat structure means fewer titles but you can own more.' },
    ]
  },
  salesforce: {
    id: 'r10', company_id: '10', overall_score: 74, verdict: 'strong',
    ai_summary: 'Salesforce is the safe choice for enterprise SaaS professionals. Strong Ohana culture, good work-life balance, and solid compensation. Recent restructuring and AI pivot with Einstein/Agentforce brings renewed growth energy. The culture is unusually people-centric for its size.',
    best_reasons: ['Industry-leading CRM market position', 'People-first "Ohana" culture is real', 'Strong work-life balance for enterprise scale', 'Competitive comp with equity', 'Strong brand for enterprise sales career'],
    biggest_risks: ['Heavy reliance on Salesforce product ecosystem — skills can be niche', 'Post-restructuring uncertainty in some units', 'Large company bureaucracy', 'Marc Benioff style can be divisive'],
    good_for: ['Enterprise SaaS professionals and Salesforce specialists', 'People valuing culture and balance', 'Sales and customer success professionals'],
    avoid_if: ['You prefer technical depth over breadth', 'You want startup speed', 'You find "values-first" culture performative'],
    confidence_score: 83,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 85, status: 'green', explanation: 'Dominant CRM market. $35B+ revenue. Strong recurring SaaS base. Balance sheet solid.' },
      { category: 'Leadership', score: 72, status: 'green', explanation: 'Marc Benioff is visionary but polarizing. Agentforce AI bet shows strategic awareness.' },
      { category: 'Work-Life Balance', score: 78, status: 'green', explanation: 'One of the better WLB cultures in enterprise tech. Wellbeing genuinely prioritized.' },
      { category: 'Compensation', score: 78, status: 'green', explanation: 'Competitive but not top-tier. Strong for sales roles. Equity refresh program meaningful.' },
      { category: 'Career Growth', score: 74, status: 'green', explanation: 'Good within Salesforce ecosystem. Strong if you want to go deep on CRM/enterprise.' },
      { category: 'Culture', score: 80, status: 'green', explanation: 'Ohana culture is genuinely differentiated. Charitable focus. Inclusive and people-first.' },
      { category: 'Layoff Risk', score: 65, status: 'yellow', explanation: '10,000+ layoffs in 2023. Stabilized. AI push may create new pressures in some roles.' },
      { category: 'Employee Sentiment', score: 76, status: 'green', explanation: 'Glassdoor 4.1/5. Culture consistently praised. Some criticism of leadership decisions.' },
      { category: 'Interview Experience', score: 72, status: 'green', explanation: 'Values + skills based. Generally positive experience. Sales roles are more intensive.' },
      { category: 'Promotion Potential', score: 70, status: 'green', explanation: 'Good with right manager. Performance culture fair. Large org means many internal moves.' },
    ]
  },
  hubspot: {
    id: 'r11', company_id: '11', overall_score: 79, verdict: 'strong',
    ai_summary: 'HubSpot consistently ranks among the best places to work in software. Transparency-first culture (the "Culture Code" is legendary), genuinely good work-life balance, and strong product growth make this an excellent choice for marketing/sales professionals and engineers alike.',
    best_reasons: ['Legendary transparency culture (Culture Code is real)', 'Consistently top-rated employer', 'Strong product with clear market position', 'Good work-life balance culture', 'Excellent career development resources'],
    biggest_risks: ['Comp below Google/Meta/Stripe for eng roles', 'Public company pressures on growth', 'Marketing/sales company — eng sometimes secondary', 'Cambridge, MA-centric for senior leadership'],
    good_for: ['Marketing, sales, and customer success professionals', 'Engineers valuing culture over max comp', 'People who want psychological safety and growth'],
    avoid_if: ['Maximum engineering compensation is your goal', 'You prefer pure engineering-first companies', 'You want pre-IPO equity upside'],
    confidence_score: 86,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 80, status: 'green', explanation: 'Public company. $2B+ ARR growing steadily. Well managed through market pressures.' },
      { category: 'Leadership', score: 82, status: 'green', explanation: 'Yamini Rangan respected CEO. Founders still involved. Long-term vision well communicated.' },
      { category: 'Work-Life Balance', score: 84, status: 'green', explanation: 'Genuinely great WLB. Policies match reality. Unlimited PTO actually used.' },
      { category: 'Compensation', score: 73, status: 'green', explanation: 'Competitive for market. Not top 10% for pure engineering roles. Good equity for public stock.' },
      { category: 'Career Growth', score: 78, status: 'green', explanation: 'Strong learning culture. Clear paths. Management quality is high which accelerates growth.' },
      { category: 'Culture', score: 88, status: 'green', explanation: 'One of the most genuine cultures in SaaS. Transparency, HEART values lived daily.' },
      { category: 'Layoff Risk', score: 68, status: 'yellow', explanation: 'Had layoffs in 2023 but handled with unusual transparency. Core business solid.' },
      { category: 'Employee Sentiment', score: 84, status: 'green', explanation: 'Glassdoor 4.4/5. Culture is top-rated. One of the most cited "employer of choice."' },
      { category: 'Interview Experience', score: 78, status: 'green', explanation: 'Skills + culture fit. Generally positive. Clear about what they\'re looking for. 3-5 weeks.' },
      { category: 'Promotion Potential', score: 76, status: 'green', explanation: 'Regular review cycles. Managers invested in your development. Transparent criteria.' },
    ]
  },
  revolut: {
    id: 'r12', company_id: '12', overall_score: 62, verdict: 'caution',
    ai_summary: 'Revolut offers an extremely high-energy, high-pressure environment with excellent compensation for strong performers. It\'s one of the most demanding workplaces in fintech — a rocket ship if you can handle the pace and politics. Recent banking licenses and IPO trajectory add significant upside, but culture concerns are well-documented.',
    best_reasons: ['Pre-IPO equity with significant upside potential', 'Banking license in UK and EU — major milestone', 'Extremely fast product shipping culture', 'Top compensation for fintech space', 'Huge growth ambitions — 45M+ customers'],
    biggest_risks: ['Culture is widely cited as very demanding and stressful', 'Leadership style divisive under Nik Storonsky', 'High turnover rate', 'Regulatory scrutiny and compliance challenges', 'Work-life balance poor in most roles'],
    good_for: ['High-performing fintech professionals who thrive under pressure', 'Engineers wanting fast product velocity', 'People seeking pre-IPO equity with large upside'],
    avoid_if: ['Work-life balance is a priority', 'You prefer collaborative over competitive cultures', 'Psychological safety is important to you'],
    confidence_score: 83,
    last_updated: '2025-06-01',
    categories: [
      { category: 'Financial Stability', score: 78, status: 'green', explanation: 'First full year of profit achieved. Banking licenses secured. $45B valuation. IPO imminent.' },
      { category: 'Leadership', score: 48, status: 'yellow', explanation: 'Nik Storonsky is brilliant but polarizing. Leadership style is demanding and aggressive.' },
      { category: 'Work-Life Balance', score: 35, status: 'red', explanation: 'Widely cited as very poor. "Work is life" culture. Long hours are the norm. High burnout.' },
      { category: 'Compensation', score: 82, status: 'green', explanation: 'Competitive base + strong equity. IPO could be significant payout for early/current employees.' },
      { category: 'Career Growth', score: 72, status: 'green', explanation: 'Fast company = fast growth for strong performers. Survival of the fittest approach.' },
      { category: 'Culture', score: 42, status: 'yellow', explanation: 'Aggressive, move-fast culture. Frequent change. High politics. Mission-driven but intense.' },
      { category: 'Layoff Risk', score: 55, status: 'yellow', explanation: 'Performance-based cuts common. Growing headcount overall but high churn within.' },
      { category: 'Employee Sentiment', score: 58, status: 'yellow', explanation: 'Glassdoor 3.6/5. Compensation praised. Culture, management, work-life balance low.' },
      { category: 'Interview Experience', score: 65, status: 'yellow', explanation: 'Rigorous, fast-paced process. Reflects company culture. Not always process-oriented.' },
      { category: 'Promotion Potential', score: 65, status: 'yellow', explanation: 'Fast for standout performers. Political elements present. High performer culture dominant.' },
    ]
  },
}
