# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ViaProto is an AI-powered learning path generator built with Next.js 15, TypeScript, Supabase, and Stripe. It generates personalized, comprehensive learning paths using 40+ AI models via OpenRouter, complete with curated resources from verified web sources.

**Production URL**: https://viapro.to
**Development Port**: 3001

## Tech Stack

- **Framework**: Next.js 15.1.8 (App Router)
- **Language**: TypeScript 5.9.2
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Google OAuth, Email)
- **AI**: OpenRouter API (40+ models: Claude, GPT, Gemini, DeepSeek, etc.)
- **Payments**: Stripe (subscription-based with webhooks)
- **Styling**: Tailwind CSS 4.1+ (CSS-first config) + DaisyUI 5.0+
- **Email**: Resend
- **Background Jobs**: Graphile Worker
- **Images**: Unsplash API

## Essential Commands

### Development
```bash
# Start dev server (required)
npm run dev  # http://localhost:3001

# Start background worker (REQUIRED for path generation)
npm run worker:dev  # Hot-reload enabled

# Build and lint
npm run build
npm run lint
```

### Database (Supabase)
```bash
# Start local Supabase instance
supabase start

# Reset database with migrations and seed data
supabase db reset

# Push migrations to remote
supabase db push

# Generate seed files from JSON data
node scripts/generate-seeds.js
```

### Stripe Testing
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Worker Management
The background worker is **critical** for path generation. Without it running, learning paths will remain stuck in "pending" state. Always run `npm run worker:dev` alongside `npm run dev` during development.

## Critical Next.js 15 Patterns

### Async APIs (Breaking Change)
Next.js 15 made several APIs async. **Always use `await`**:

```typescript
// Dynamic route params - MUST await
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // Required
  // ...
}

// Headers and cookies - MUST await
import { headers, cookies } from 'next/headers';

const headersList = await headers();
const cookieStore = await cookies();
```

### Supabase Server Client
```typescript
// Server components/API routes - MUST await
import { createClient } from "@/libs/supabase/server";

const supabase = await createClient();  // Required in Next.js 15
const { data: { user } } = await supabase.auth.getUser();
```

### Client Components
```typescript
"use client";
import { createClient } from "@/libs/supabase/client";

const supabase = createClient();  // No await needed for client
```

## Architecture

### Background Job System (Graphile Worker)

Learning path generation is split into three sequential background jobs to handle long-running AI operations:

1. **`generate_metadata`** (`libs/jobs/tasks/generate-metadata.ts`)
   - Generates path title, description, skill level assessment
   - Status: `pending` → `generating_metadata`

2. **`fetch_unsplash_image`** (`libs/jobs/tasks/fetch-unsplash-image.ts`)
   - Fetches relevant cover image from Unsplash
   - Status: `generating_metadata` → `fetching_image`

3. **`generate_sections_resources`** (`libs/jobs/tasks/generate-sections-resources.ts`)
   - AI generates 5-8 sections with 3-7 curated resources each
   - Performs web search to verify resource URLs
   - Status: `fetching_image` → `curating_resources` → `completed`

Each job retries up to 3 times on failure. On permanent failure, `notify_generation_failed` emails the user.

**Worker Entry Point**: `worker.ts` - registers all tasks and handles graceful shutdown.

### Account & Rate Limiting System

**Account Types:**
- **Personal**: 1 user, 1 seat (created automatically on signup)
- **Team**: 2+ users, shared quota, multiple seats

**Rate Limits** (enforced at `/api/paths/initiate/route.ts:68-76`):
- **Free**: 1 path/month
- **Pro**: 5 paths/month
- **Team**: 10 + (3 × additional seats) paths/month
  - 2 seats = 10 paths
  - 5 seats = 19 paths
  - 10 seats = 34 paths

Rate limits are checked **before** path creation to prevent quota exhaustion. Paths count against quota immediately when initiated (not when completed).

**Key Function**: `getUserDefaultAccount()` in `libs/auth.ts` retrieves account with tier information.

### AI Model System

**Model Configuration**: `libs/models/model-config.ts`

40+ models organized by:
- **Tier Access**: `free`, `pro`, `team`
- **Cost Tier**: `free`, `low`, `medium`, `high`, `premium`
- **Providers**: Anthropic, Google, OpenAI, DeepSeek, Meta, etc.

**Adding a New Model**:
1. Edit `MODEL_CATALOG` in `libs/models/model-config.ts`
2. Add entry with `id`, `name`, `provider`, `minimumTier`, `costTier`, etc.
3. Model automatically appears in UI and generation flow

**AI Generation Logic**: `libs/openrouter.ts` - constructs prompts and calls OpenRouter API with structured JSON output.

### Database Schema

**Core Tables** (with Row Level Security):
- `profiles` - User profiles (1:1 with auth.users)
- `accounts` - Billing entities (personal/team)
- `account_users` - Many-to-many user ↔ account relationship
- `topics` - Pre-seeded learning topics (~500+ topics)
- `learning_paths` - Generated paths (belongs to account)
- `sections` - Ordered sections within paths
- `resources` - Learning resources (videos, articles, books, projects)
- `unsplash_images` - Cached cover images

**Migrations**: `supabase/migrations/` - timestamped SQL files
**Seed Data**: `supabase/seed.sql` (generated from `data/*.json` via `scripts/generate-seeds.js`)

### Stripe Integration

**Webhook Handler**: `/api/webhook/stripe/route.ts`

**Key Events**:
- `checkout.session.completed` - Initial subscription
- `customer.subscription.updated` - Plan changes, renewals
- `customer.subscription.deleted` - Cancellations
- `invoice.payment_succeeded` - Payment confirmations
- `invoice.payment_failed` - Payment failures

Subscription data is stored in `accounts` table:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_tier` (free/pro/team)
- `subscription_status` (active/past_due/canceled)
- `seat_count` (for team plans)

**Checkout Flow**: `/api/stripe/create-checkout/route.ts` creates Stripe sessions
**Portal Access**: `/api/stripe/create-portal/route.ts` for subscription management

## File Structure & Conventions

### Naming Conventions
- **Files**: kebab-case (`button-checkout.tsx`)
- **Components**: PascalCase (`ButtonCheckout`)
- **Functions/Variables**: camelCase (`getUserAccount`)

### Key Directories
```
app/
├── (main)/             # Main app routes
│   ├── (dashboard)/    # Protected routes (requires auth)
│   │   ├── dashboard/  # Main user dashboard
│   │   ├── skills/     # Learning path management
│   │   └── upgrade/    # Pricing/upgrade page
│   ├── auth/           # Login/register pages
│   ├── blog/           # Blog page (static for now)
│   ├── paths/[id]/     # Public path detail page
│   ├── explore/        # Public path discovery
│   └── layout.tsx      # App layout (html/body, fonts, ClientLayout)
├── api/                # App API routes
│   ├── paths/          # Path generation & management
│   │   ├── initiate/   # POST: Start generation
│   │   └── [id]/status # GET: Poll generation status
│   ├── stripe/         # Payment endpoints
│   └── webhook/        # External webhooks
└── layout.tsx          # Root layout with metadataBase

libs/
├── supabase/           # Database clients (server, client, service)
├── models/             # AI model configuration
├── jobs/               # Background job tasks
│   ├── queue.ts        # Job queuing utilities
│   └── tasks/          # Individual task implementations
├── openrouter.ts       # AI generation logic
├── stripe.ts           # Stripe utilities
├── accounts.ts         # Account management utilities
└── validation/         # Zod schemas

components/             # React components (organized by feature)
types/                  # TypeScript type definitions
supabase/
├── migrations/         # Database schema migrations
└── seed.sql           # Topic seed data
```

### Route Group Architecture

- **`app/(main)/`** - Main application
  - Has its own `<html>`, `<head>`, `<body>` structure
  - Includes custom fonts, analytics (Swetrix), and ClientLayout providers
  - All user-facing pages live here

- **`app/layout.tsx`** - Root layout with metadataBase
  - Sets metadataBase for proper URL resolution
  - Returns `{children}` to allow (main) route group to define document structure

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Internal components (`components/`)
4. Internal utilities (`libs/`)
5. Types (`types/`)
6. Config (`config.ts`)
7. Relative imports

## Tailwind CSS v4 Specific Patterns

**Configuration**: CSS-first approach (no `tailwind.config.js`)

All customization in `app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-brand-500: #570df8;
  --spacing-custom: 2.5rem;
}
```

**PostCSS Plugin**: `@tailwindcss/postcss` (not `tailwindcss` plugin)

**DaisyUI Classes**: Use component classes like `btn`, `btn-primary`, `card`, `badge`, etc.

## Common Development Patterns

### Authentication Checks
```typescript
// Server component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect("/auth/login");
}
```

### API Route Structure
```typescript
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate input (use Zod)
    const body = await req.json();
    const validated = Schema.parse(body);

    // 3. Business logic

    // 4. Return response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Queuing Background Jobs
```typescript
import { addJob } from '@/libs/jobs/queue';

await addJob('generate_metadata', {
  pathId: path.id,
  topicName: topic.name,
  userId: user.id,
  goals: userGoals,
  modelId: selectedModel,
});
```

## Environment Variables

Required variables (see `.env.example`):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=  # PostgreSQL connection string for worker

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

# Worker
WORKER_CONCURRENCY=3
WORKER_POLL_INTERVAL=1000
```

## Important Gotchas

### Path Generation Flow
1. User initiates path → `POST /api/paths/initiate`
2. Path record created with `status: 'pending'`
3. Job queued → `generate_metadata`
4. Client polls `GET /api/paths/[id]/status` every 2-3 seconds
5. Status transitions: `pending` → `generating_metadata` → `fetching_image` → `curating_resources` → `completed`
6. **Worker must be running** or jobs never execute

### Supabase Service Role vs Anon Key
- **Anon Key**: Client-side, RLS policies enforced
- **Service Role Key**: Server-side only, **bypasses RLS**
- Use service role only when necessary (webhooks, admin operations)
- Import from `@/libs/supabase/service` for service role client

### Webhook Signature Verification
Always verify signatures for Stripe webhooks:
```typescript
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### Free Tier Restrictions
- Free tier paths are **always public** (cannot be private)
- Free tier has access to only 7 free AI models
- Enforced in `/api/paths/initiate/route.ts:106-111`

## Testing Checklist

When testing path generation:
1. ✅ Dev server running (`npm run dev`)
2. ✅ Worker running (`npm run worker:dev`)
3. ✅ Supabase local instance running (`supabase start`)
4. ✅ User authenticated
5. ✅ Account has remaining quota
6. ✅ Valid topic selected
7. ✅ OpenRouter API key configured

## Configuration

**App Config**: `config.ts` - contains Stripe plan definitions, email addresses, color themes, URLs

**Stripe Plans**: Defined in `config.ts` with separate entries for monthly/yearly variants. Update `priceId` values when creating new Stripe prices.

## Deployment (Coolify)

**Two Services Required**:
1. **Web Service**: Next.js app (`npm run build && npm run start`)
2. **Worker Service**: Background processor (`npm run worker`)

Both services must share the same `DATABASE_URL` to connect to Supabase.

**Pre-Deployment**:
- Run `supabase db push` to apply migrations
- Seed topics database
- Configure Stripe webhook URL: `https://viapro.to/api/webhook/stripe`
- Verify all environment variables set in Coolify

## Security Notes

- Always validate inputs with Zod schemas
- Use RLS policies for data access control
- Never expose `SUPABASE_SERVICE_ROLE_KEY` on client
- Verify webhook signatures (Stripe)
- Rate limit enforcement happens before resource creation
- OAuth providers configured in Supabase dashboard

## TypeScript Patterns

- Use strict mode (enabled in `tsconfig.json`)
- Prefer `interface` over `type` for object shapes
- Use `import type { }` for type-only imports
- Generic types for reusable components
- Zod for runtime validation
- Handle Promise types correctly (especially Next.js 15 async APIs)
