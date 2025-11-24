# ViaProto

**AI-powered learning paths in 60 seconds.** Generate comprehensive, personalized curricula with curated resources from real human creators.

Production URL: https://viapro.to (not yet live)

---

## What It Does

ViaProto solves the problem of information overload and deteriorating search quality. Instead of spending hours wading through SEO-gamed content farms, users get:

- **Structured learning paths** with 5-8 sections of curated resources
- **40+ AI models** to choose from (Claude, GPT, Gemini, DeepSeek, etc.)
- **Verified resources** via AI web search (videos, articles, books, projects, courses, etc.)
- **Free & paid options** clearly labeled for each resource
- **Team collaboration** with seat-based pricing

**Target audience**: Professionals who need to upskill quickly in an era of mounting layoffs and increasing automation.

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.1.8 |
| Language | TypeScript | 5.9.2 |
| UI | React | 19.0.0 |
| Styling | Tailwind CSS + DaisyUI | 4.1.10 + 5.0.5 |
| Database | Supabase (PostgreSQL) | 2.45.0 |
| Auth | Supabase Auth | 2.45.0 |
| AI | OpenRouter (40+ models) | via OpenAI SDK 6.9.1 |
| Payments | Stripe | 13.11.0 |
| Email | Resend | 4.0.1 |
| Images | Unsplash API | Custom integration |
| Background Jobs | Graphile Worker | 0.16.6 |
| Deployment | Coolify → Hetzner VPS | - |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase CLI ([install](https://supabase.com/docs/guides/cli))
- Accounts: Supabase, Stripe, OpenRouter, Resend, Unsplash

### Installation

```bash
# Clone and install
git clone https://github.com/yourusername/via-proto.git
cd via-proto
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your keys
```

### Database Setup

```bash
# Start local Supabase
supabase start

# Apply migrations and seed data
supabase db reset

# Generate/apply topic seeds
node scripts/generate-seeds.js
```

Update `.env.local` with the credentials from `supabase start` output.

### Run Development Server

```bash
# Terminal 1: Next.js dev server
npm run dev
# → http://localhost:3001

# Terminal 2: Background job worker (required for path generation)
npm run worker:dev
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
OPENROUTER_API_KEY=

# Services
RESEND_API_KEY=
UNSPLASH_ACCESS_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Worker (Background Jobs)
WORKER_CONCURRENCY=3
WORKER_POLL_INTERVAL=1000
```

---

## Project Structure

```
via-proto/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   ├── api/                  # API endpoints
│   │   ├── paths/           # Path generation & management
│   │   ├── stripe/          # Payment handling
│   │   ├── topics/          # Topic search
│   │   └── webhook/         # Stripe webhooks
│   ├── auth/                # Login/register pages
│   ├── blog/                # Blog system
│   ├── explore/             # Public path discovery
│   ├── paths/[id]/          # Path detail page
│   └── pricing/             # Pricing page
├── components/              # React components
├── libs/
│   ├── models/             # AI model configuration (40+ models)
│   ├── supabase/           # Database clients
│   ├── openrouter.ts       # AI generation logic
│   ├── stripe.ts           # Payment utilities
│   └── validation/         # Zod schemas
├── supabase/
│   ├── migrations/         # Database schema (timestamped)
│   └── seed.sql           # Topic data
├── data/                   # JSON source for seeds
├── scripts/
│   └── generate-seeds.js  # Seed file generator
└── config.ts              # App configuration
```

---

## Key Concepts

### Rate Limits by Tier

| Tier | Monthly Paths | Cost | Models |
|------|--------------|------|--------|
| Free | 1 | $0 | 7 free models |
| Pro | 5 | $12/mo or $100/yr | All 40+ models |
| Team | 10 + (3 per seat) | $10/seat/mo | All 40+ models |

**Team scaling**: 2 seats = 10 paths, 5 seats = 19 paths, 10 seats = 34 paths

### Path Generation Flow (Background Jobs)

1. User selects topic, skill level, optional goals, optional AI model
2. System checks rate limits and model access
3. **Job #1** (`generate_metadata`): AI generates title, description, skill level
4. **Job #2** (`fetch_unsplash_image`): Fetches cover image from Unsplash
5. **Job #3** (`generate_sections_resources`): AI generates 5-8 sections with 3-7 resources each
6. Multi-stage status tracking: `pending` → `generating_metadata` → `fetching_image` → `curating_resources` → `completed`
7. Each job retries up to 3 times on failure; users notified via email on permanent failure
8. Result: 20-100+ hours of curated learning content

**Worker Process**: Run `npm run worker` to start the Graphile Worker background processor

### Account Architecture

- **Personal accounts**: 1 user, 1 seat
- **Team accounts**: 2+ users, shared quota
- Learning paths belong to accounts, not users
- Billing via Stripe `customer_id` on account

### Database Schema

Core tables with Row-Level Security:
- `profiles` - User profiles
- `accounts` - Billing entities (personal/team)
- `account_users` - User ↔ Account relationship
- `topics` - Pre-seeded learning topics
- `learning_paths` - AI-generated paths
- `sections` - Path sections (ordered)
- `resources` - Learning resources (videos, articles, etc.)
- `unsplash_images` - Cached featured images

---

## Development

### Common Commands

```bash
npm run dev          # Development server (port 3001)
npm run worker       # Background job worker (required for path generation)
npm run worker:dev   # Worker with hot reload
npm run build        # Production build
npm run lint         # ESLint check
npm run postbuild    # Generate sitemap (auto-runs)

# Database
supabase db reset    # Reset with migrations + seed
supabase db push     # Push migrations to remote

# Stripe testing
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Add a New AI Model

Edit `libs/models/model-config.ts` and add to `MODEL_CATALOG`:

```typescript
{
  id: "provider/model-name",
  name: "Display Name",
  provider: "ProviderName",
  minimumTier: "free" | "pro",
  costTier: "free" | "low" | "medium" | "high" | "premium",
  supportsWebSearch: true,
  supportsStructuredOutput: true,
  description: "Brief description",
  featured: true,  // Optional
}
```

Model appears automatically in UI and generation API.

---

## Deployment

Deployed via **Coolify** to Hetzner VPS with BunnyCDN for DNS/CDN.

### Coolify Setup

**Two Services Required:**

**Service 1: Web (Next.js)**
1. Create Next.js application in Coolify
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add production environment variables
5. Link Supabase remote database
6. Configure domain: `viapro.to`

**Service 2: Worker (Background Jobs)**
1. Create Node.js application in Coolify
2. Set build command: `npm install`
3. Set start command: `npm run worker`
4. Share same environment variables as web service
5. Set restart policy: always
6. Both services must connect to same DATABASE_URL

### Production Checklist

- [ ] Apply database migrations: `supabase db push`
- [ ] Seed topics database
- [ ] Configure Stripe webhook: `https://viapro.to/api/webhook/stripe`
- [ ] Test payment flows
- [ ] Verify RLS policies active
- [ ] Test path generation
- [ ] Enable SSL (Coolify auto-handles)

Full deployment guide: https://coolify.io/docs/applications/nextjs

---

## API Endpoints

### Path Generation
- `POST /api/paths/initiate` - Create path and queue background job
- `GET /api/paths/[id]/status` - Check generation status (poll this during generation)
- `GET /api/paths/[id]` - Get path details

### Other
- `POST /api/stripe/create-checkout` - Start payment
- `POST /api/stripe/create-portal` - Manage subscription
- `POST /api/webhook/stripe` - Handle Stripe events
- `GET /api/models` - List available AI models
- `GET /api/topics` - Search topics (typeahead)

---

## Support

- **Support**: support@viapro.to
- **Privacy**: privacy@viapro.to
- **Security**: security@viapro.to

---

## License

**Proprietary** - All rights reserved. Not open source.

---

Built with Next.js, Supabase, OpenRouter, Stripe, and Tailwind CSS.
