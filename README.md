# Next Move — AI Career Intelligence Platform

> Know before you accept the offer.

Next Move is a premium SaaS platform that helps job seekers make smarter career decisions by analyzing companies across 10 key dimensions using AI.

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/angiefuhrich-arch/nextmove.git
cd nextmove
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase project settings (secret) |
| `STRIPE_SECRET_KEY` | From Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook settings |
| `STRIPE_PRO_PRICE_ID` | Price ID for Pro plan ($12/mo) |
| `STRIPE_PREMIUM_PRICE_ID` | Price ID for Premium plan ($29/mo) |
| `OPENAI_API_KEY` | From OpenAI platform |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 3. Supabase setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the schema: copy `supabase/schema.sql` into the Supabase SQL editor and execute
3. Enable Email Auth in Authentication > Providers

### 4. Seed mock data
```bash
npm run seed
```

### 5. Stripe setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products:
   - **Pro** — $12/month recurring → copy the Price ID to `STRIPE_PRO_PRICE_ID`
   - **Premium** — $29/month recurring → copy the Price ID to `STRIPE_PREMIUM_PRICE_ID`
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 6. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
nextmove/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── login/              # Auth pages
│   ├── signup/
│   ├── pricing/            # Pricing page
│   ├── dashboard/          # Main dashboard
│   ├── search/             # Company search
│   ├── company/[slug]/     # Company report page
│   ├── compare/            # Company comparison
│   ├── watchlist/          # Saved companies
│   ├── offer-assistant/    # Offer decision tool
│   ├── account/            # Account & billing
│   └── api/                # API routes
│       ├── offers/analyze/ # Offer analysis endpoint
│       └── stripe/         # Stripe checkout, portal, webhook
├── components/
│   ├── ui/                 # Base UI components
│   ├── layout/             # Sidebar, navbar, dashboard layout
│   └── company/            # Company-specific components
├── lib/
│   ├── mock-data.ts        # Mock company data (12 companies)
│   ├── openai.ts           # OpenAI integration + mock fallback
│   ├── stripe.ts           # Stripe client
│   ├── utils.ts            # Shared utilities
│   └── supabase/           # Supabase client/server helpers
├── scripts/
│   └── seed.ts             # Database seed script
├── supabase/
│   └── schema.sql          # Full database schema
├── types/
│   └── index.ts            # TypeScript types
└── middleware.ts            # Auth protection for dashboard routes
```

## Pages

| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/pricing` | Pricing plans | No |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/dashboard` | Overview + quick actions | Yes |
| `/search` | Search companies | Yes |
| `/company/[slug]` | Full company report | Yes |
| `/compare` | Side-by-side comparison | Yes (Pro+) |
| `/watchlist` | Saved companies | Yes |
| `/offer-assistant` | Evaluate job offers | Yes (Pro+) |
| `/account` | Account & billing | Yes |

## Companies Included (Mock Data)

Google, Meta, Amazon, Microsoft, Canva, Stripe, HSBC, Airwallex, Glue Up, Salesforce, HubSpot, Revolut

## Subscription Tiers

| Feature | Free | Pro ($12) | Premium ($29) |
|---|---|---|---|
| Company reports/month | 3 | Unlimited | Unlimited |
| AI summary | Basic | Full | Full |
| Company comparison | ✗ | ✓ | ✓ |
| Watchlist | ✗ | ✓ | ✓ |
| Offer Assistant | ✗ | ✓ | ✓ |
| CV Fit Analysis | ✗ | ✗ | ✓ |
| Salary Negotiation | ✗ | ✗ | ✓ |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth + DB**: Supabase
- **Payments**: Stripe
- **AI**: OpenAI GPT-4o-mini (with mock fallback)

## Development Notes

- The app works fully without OpenAI/Stripe API keys using mock fallbacks
- Mock data for all 12 companies is built in — no database needed to browse
- Supabase is required for auth, watchlist, and offer analysis storage
