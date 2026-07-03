# External Integrations

**Analysis Date:** 2026-07-03

## APIs & External Services

**AI Model Generation:**
- OpenRouter - AI model inference (40+ models: Claude, GPT-4, Gemini, DeepSeek, etc.)
  - SDK/Client: openai 6.9.1 (with custom baseURL: `https://openrouter.ai/api/v1`)
  - Auth: `OPENROUTER_API_KEY` (env var)
  - Used in: `libs/openrouter.ts`, `libs/jobs/tasks/generate-sections-resources.ts`
  - Supports structured JSON output for learning path sections/resources

**Image Search & Attribution:**
- Unsplash API - Cover images for learning paths
  - Auth: `UNSPLASH_ACCESS_KEY` (env var)
  - Used in: `libs/unsplash.ts`, `libs/jobs/tasks/fetch-unsplash-image.ts`
  - Requires download event trigger for API compliance (tracks usage per Unsplash license)
  - Fallback: Images cached in `unsplash_images` table to reduce API calls

**Icon Delivery:**
- Iconify Design - Icon library on-demand loading
  - API endpoints: `https://api.iconify.design`, `https://api.simplesvg.com`, `https://api.unisvg.com`
  - Client-side icon resolution (built into @iconify/react)
  - Caching via Tailwind CSS integration (@iconify/tailwind4)

**Pricing & Regional Localization:**
- ParityDeals - Regional pricing/promo widget
  - Component: `@paritydeals/react-promotions-ui` 1.2.0-beta
  - Env var: `NEXT_PUBLIC_PARITYDEALS_PRODUCT_ID` (e.g., `promo_xxx...`)
  - Used in: `components/Pricing.tsx`, `components/landing/Pricing.tsx`
  - Allows showing localized pricing based on user's region

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: @supabase/supabase-js (browser), @supabase/ssr (server components)
  - Row Level Security (RLS) enabled for data access control
  - Key tables: profiles, accounts, account_users, topics, learning_paths, sections, resources, unsplash_images
  - Migrations: `supabase/migrations/` (timestamped SQL files)
  - Seed data: `supabase/seed.sql` (generated from JSON via scripts/generate-seeds.js)

**File Storage:**
- Scaleway S3 (Object Storage)
  - Buckets: `viaproto-prod.s3.nl-ams.scw.cloud`, `viaproto-dev.s3.nl-ams.scw.cloud`
  - Hosted in Netherlands region (nl-ams)
  - Used for: Static asset uploads, user-generated content
  - Access: Configured via Next.js `remotePatterns` in `next.config.js`

**Content Delivery:**
- BunnyCDN - Static asset CDN
  - Domains: `https://cdn.viapro.to` (production), `https://cdn-dev.viapro.to` (staging)
  - Asset prefix: Baked in at build time via `CDN_URL` environment variable
  - Image optimization disabled (BunnyCDN handles it)
  - CSP allows: `https://cdn.viapro.to https://cdn-dev.viapro.to`

**Caching:**
- In-app caching via Supabase queries (RLS cached per user)
- HTTP caching for static assets: `max-age=31536000, immutable` (1 year for versioned Next.js assets)
- No external caching service (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (manages user sessions and OAuth)
  - OAuth Providers: Google (configured in Supabase dashboard)
  - Email/Password: Magic links via Resend
  - Session Management: Cookie-based (14-day maxAge in `libs/supabase/server.ts`)
  - Server: @supabase/ssr for Next.js 15 async APIs (must await `createClient()`)
  - Client: @supabase/supabase-js for browser usage (no await)

**Service Role Access:**
- Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
  - Bypasses RLS for trusted server-side code
  - Used in: Background workers, webhooks, admin operations
  - Client: `createServiceClient()` from `libs/supabase/service.ts`
  - **Never expose to client-side code**

## Monitoring & Observability

**Error Tracking:**
- Sentry 10.27.0 - Exception tracking and performance monitoring
  - DSN: `NEXT_PUBLIC_SENTRY_DSN` (env var)
  - Config files: `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`
  - Initialization: `worker.ts` for background jobs, `instrumentation-client.ts` for frontend
  - Webpack plugin: Automatic source map upload (requires SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN)
  - Tunnel route: `/monitoring` (bypasses ad-blockers)
  - Automatic React component annotation for breadcrumbs

**Structured Logging:**
- Axiom - Cloud logging and analytics
  - Token: `NEXT_PUBLIC_AXIOM_TOKEN` (env var)
  - Dataset: `NEXT_PUBLIC_AXIOM_DATASET` (env var)
  - Client: `@axiomhq/js`, `@axiomhq/nextjs`, `@axiomhq/react`
  - Enabled for frontend and backend event tracking

**Analytics:**
- Swetrix 3.7.2 - Privacy-focused analytics (no cookies, GDPR-compliant)
  - Component: `<SwetrixAnalytics />` in `app/(main)/layout.tsx`
  - Tracks page views, user interactions (self-hosted or cloud)
  - No personally identifiable information collected

## CI/CD & Deployment

**Hosting:**
- Coolify (self-hosted containerized deployment)
  - Two services required:
    1. Web Service: `npm run build && npm run start`
    2. Worker Service: `npm run worker` (background jobs)
  - Both services share `DATABASE_URL` for Supabase connection
  - Deployment: Docker containers (Next.js standalone mode)

**CI Pipeline:**
- GitHub Actions (inferred from TINA_BRANCH detection in `tina/config.ts`)
  - Environment variables from Coolify secrets
  - Pre-deployment: `supabase db push` (apply migrations)

**Build Integration:**
- TinaCMS build step: `tinacms build` (generates schema types, updates media indexing)
- Next.js build: `next build` (TypeScript errors and ESLint warnings ignored)

## Environment Configuration

**Required env vars (see .env.example):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, bypasses RLS)
- `DATABASE_URL` - PostgreSQL connection string (for background worker)
- `STRIPE_PUBLIC_KEY` - Stripe publishable key (client-side)
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `OPENROUTER_API_KEY` - OpenRouter API key for AI models
- `RESEND_API_KEY` - Resend email service API key
- `UNSPLASH_ACCESS_KEY` - Unsplash API access key
- `NEXT_PUBLIC_SITE_URL` - Site URL (default: `http://localhost:3001`)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` - Sentry configuration
- `NEXT_PUBLIC_AXIOM_TOKEN` - Axiom logging token
- `NEXT_PUBLIC_AXIOM_DATASET` - Axiom dataset name
- `NEXT_PUBLIC_PARITYDEALS_PRODUCT_ID` - ParityDeals product ID for regional pricing
- `NEXT_PUBLIC_TINA_CLIENT_ID` - TinaCMS cloud client ID
- `TINA_TOKEN` - TinaCMS read-only token
- `TINA_SEARCH_TOKEN` - TinaCMS search indexer token
- `TINA_BRANCH` - Git branch for TinaCMS content (auto-detected from CI/CD)
- `NEXT_PUBLIC_TINA_BRANCH` - TinaCMS branch (optional override)
- `WORKER_CONCURRENCY` - Graphile Worker concurrency (default: 3)
- `WORKER_POLL_INTERVAL` - Job poll interval in ms (default: 1000)
- `CDN_URL` - BunnyCDN asset prefix (e.g., `https://cdn.viapro.to`)
- `NODE_ENV` - Environment (development/production)

**Secrets location:**
- Development: `.env.local` (gitignored)
- Production: Coolify environment variables (encrypted at rest)
- CI/CD: GitHub Actions secrets or Coolify dashboard

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe Webhooks (`POST /api/webhook/stripe/route.ts`)
  - Events handled:
    - `checkout.session.completed` - Initial subscription/payment success
    - `customer.subscription.updated` - Plan changes, renewals, status updates
    - `customer.subscription.deleted` - Cancellations
    - `invoice.payment_succeeded` - Successful payment
    - `invoice.payment_failed` - Payment failures
  - Signature verification: Required (uses `stripe.webhooks.constructEvent()`)
  - Webhook URL to configure: `https://viapro.to/api/webhook/stripe` (production)
  - Local dev: Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhook/stripe`

**Outgoing Webhooks:**
- Resend Email - Transactional emails sent via API
  - Used for: Magic login links, generation status updates, failed path notifications
  - Client: `libs/resend.ts` (uses Resend SDK)

**Job Queue:**
- Graphile Worker - PostgreSQL-based job queue
  - Database: Supabase PostgreSQL
  - Jobs include: generate_metadata, fetch_unsplash_image, generate_sections_resources, notify_generation_failed
  - Job payload stored in database, no external service needed

## Content Management

**Blog System:**
- TinaCloud (Git-based headless CMS)
  - Storage: Git repository (`content/posts/` as MDX files)
  - Admin interface: `/admin/index.html` (visual editor)
  - Schema: `tina/config.ts` (defines post fields and structure)
  - Auto-generated types: `tina/__generated__/` (gitignored, regenerated at build)
  - Client ID: `NEXT_PUBLIC_TINA_CLIENT_ID` (env var)
  - Read token: `TINA_TOKEN` (env var)
  - Search token: `TINA_SEARCH_TOKEN` (env var, enables admin search)
  - Branch detection: TINA_BRANCH, GITHUB_BRANCH, VERCEL_GIT_COMMIT_REF, HEAD env vars

## API Client Initialization

**Server Components (Next.js 15+):**
```typescript
const supabase = await createClient();  // Must await
const { data: { user } } = await supabase.auth.getUser();
```

**Client Components:**
```typescript
"use client";
const supabase = createClient();  // No await
```

**Background Workers:**
```typescript
const supabase = createServiceClient();  // Service role, no await
```

---

*Integration audit: 2026-07-03*
