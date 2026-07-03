# Codebase Structure

**Analysis Date:** 2026-07-03

## Directory Layout

```
via-proto/
├── app/                          # Next.js 15 App Router (all routes, layouts, API)
│   ├── layout.tsx               # Root layout (minimal; passes children to (main))
│   ├── (main)/                  # Main route group (landing, blog, public pages)
│   │   ├── layout.tsx           # Main layout (html/body, Topbar, Footer, ClientLayout)
│   │   ├── page.tsx             # Landing page (Hero, Features, Pricing)
│   │   ├── blog/                # Blog section (TinaCMS-managed)
│   │   │   ├── page.tsx         # Blog listing
│   │   │   └── [slug]/          # Dynamic blog post pages
│   │   ├── explore/             # Public path discovery
│   │   ├── paths/[id]/          # Public learning path view
│   │   ├── auth/                # Auth pages (moved to (auth) group)
│   │   ├── privacy/             # Privacy policy
│   │   ├── terms/               # Terms of service
│   │   └── [..not-found]/       # 404 catch-all
│   ├── (auth)/                  # Auth route group (login, register, OAuth)
│   │   ├── layout.tsx           # Auth layout (centered card with sidebar)
│   │   ├── login/page.tsx       # Login form
│   │   ├── register/page.tsx    # Sign-up form
│   │   └── callback/route.ts    # Supabase OAuth callback
│   ├── (dashboard)/             # Protected route group (requires auth)
│   │   ├── layout.tsx           # Dashboard layout (sidebar, topbar, rightbar)
│   │   ├── dashboard/page.tsx   # Main dashboard (path library, recent paths)
│   │   ├── skills/page.tsx      # Learning paths management
│   │   ├── upgrade/page.tsx     # Pricing & upgrade page
│   │   ├── progress/page.tsx    # Learning progress tracking
│   │   ├── account/page.tsx     # User account settings
│   │   └── account/[accountId]/ # Team account management
│   ├── api/                      # API routes (all endpoints)
│   │   ├── paths/
│   │   │   ├── route.ts         # GET paths (list user's paths) - not yet used
│   │   │   ├── initiate/route.ts # POST to create + queue generation
│   │   │   └── [id]/
│   │   │       ├── route.ts     # GET single path, PATCH update path
│   │   │       └── status/route.ts # GET generation status (polling endpoint)
│   │   ├── accounts/
│   │   │   ├── route.ts         # User account data
│   │   │   ├── [accountId]/route.ts # Team account details
│   │   │   └── switch/route.ts  # Switch active account
│   │   ├── webhook/
│   │   │   └── stripe/route.ts  # Stripe webhook handler
│   │   ├── auth/
│   │   │   ├── callback/route.ts # OAuth code exchange
│   │   │   └── setup-account/route.ts # Auto-create personal account
│   │   ├── stripe/
│   │   │   ├── create-checkout/route.ts # Start checkout session
│   │   │   └── create-portal/route.ts   # Open customer portal
│   │   ├── models/route.ts      # GET available models (filtered by tier)
│   │   ├── topics/route.ts      # GET topics (for autocomplete)
│   │   ├── search/route.ts      # POST search in learning paths
│   │   ├── user-competencies/route.ts # GET user's learned skills
│   │   ├── error-report/route.ts # POST client-side errors
│   │   ├── health/route.ts      # GET health check (liveness probe)
│   │   └── lead/route.ts        # POST email capture (waitlist)
│   ├── styles/
│   │   ├── app.css              # Tailwind + DaisyUI + custom styles
│   │   ├── core/                # Core CSS modules
│   │   └── pages/               # Page-specific styles
│   ├── llms.txt/route.ts        # Machine-readable LLM usage
│   ├── robots.txt/route.ts      # SEO robots.txt
│   └── sitemap.xml/route.ts     # SEO sitemap
│
├── libs/                         # Shared utilities and business logic
│   ├── supabase/                 # Database client factories
│   │   ├── server.ts            # Server-side SSR client (uses cookies)
│   │   ├── client.ts            # Browser client
│   │   ├── service.ts           # Service role client (bypasses RLS)
│   │   └── middleware.ts        # Auth middleware
│   ├── jobs/                     # Background job system (Graphile Worker)
│   │   ├── queue.ts             # Job queueing API (addJob, addJobsInSequence)
│   │   ├── types.ts             # Job payload TypeScript interfaces
│   │   ├── timing.ts            # Job timing/duration tracking
│   │   └── tasks/               # Individual job task implementations
│   │       ├── index.ts         # Task registry (tasks object for worker)
│   │       ├── generate-metadata.ts      # Step 1: Path title/description
│   │       ├── fetch-unsplash-image.ts   # Step 2: Cover image
│   │       ├── research-resources.ts     # Step 3: Web search for resources
│   │       ├── generate-sections-resources.ts # Step 4: Organize into sections
│   │       ├── validate-and-finalize.ts  # Step 5: Quality checks
│   │       ├── validate-resource-links.ts # Step 6/9: Link validation
│   │       ├── replace-broken-resources.ts # Step 7: Replace dead links
│   │       ├── enrich-sections.ts        # Step 8: Add more resources
│   │       └── notify-generation-failed.ts # Error: Send failure email
│   ├── models/                   # AI model configuration
│   │   ├── model-config.ts      # MODEL_CATALOG, model helpers
│   │   └── index.ts             # Exports
│   ├── auth.ts                  # Auth helpers (requireAuth, getUserDefaultAccount)
│   ├── accounts.ts              # Account/team management (create, add users)
│   ├── stripe.ts                # Stripe utilities (create checkout, portal)
│   ├── openrouter.ts            # OpenRouter API client (AI inference)
│   ├── unsplash.ts              # Unsplash API client (image search)
│   ├── link-metadata.ts         # OpenGraph metadata scraper
│   ├── search-engines.ts        # Web search (Google, DuckDuckGo wrappers)
│   ├── resend.ts                # Resend email client
│   ├── seo.tsx                  # SEO helpers (metadata, schema tags)
│   ├── api.ts                   # Shared API utilities
│   ├── embeddings.ts            # Vector embeddings for search
│   ├── teams.ts                 # Team management utilities
│   ├── gpt.ts                   # GPT-specific utilities
│   ├── validation/              # Zod validation schemas
│   │   ├── path-schema.ts       # Learning path validation
│   │   ├── team-schema.ts       # Team/account validation
│   │   └── progress-schema.ts   # Progress tracking validation
│   └── axiom/                   # Axiom logging integration
│
├── components/                   # React components (organized by feature)
│   ├── LayoutClient.tsx         # Client-side layout wrapper (providers)
│   ├── Topbar.tsx               # Navigation header
│   ├── Footer.tsx               # Footer
│   ├── SwetrixAnalytics.tsx     # Analytics snippet
│   ├── landing/                 # Landing page components
│   │   ├── Hero.tsx             # Hero section
│   │   ├── Features.tsx         # Features grid
│   │   ├── Pricing.tsx          # Pricing table
│   │   ├── FAQs.tsx             # FAQ section
│   │   └── ExamplePath.tsx      # Example learning path
│   ├── dashboard/               # Dashboard-specific components
│   │   ├── PathCard.tsx         # Learning path card
│   │   ├── PathList.tsx         # Paths grid/list
│   │   └── StatsWidget.tsx      # Stats summary
│   ├── dashboard-layout/        # Dashboard layout components
│   │   ├── DashboardSidebar.tsx # Left sidebar navigation
│   │   ├── DashboardTopbar.tsx  # Top bar with breadcrumbs
│   │   ├── DashboardRightbar.tsx # Right panel (help, etc.)
│   │   ├── DashboardFooter.tsx  # Dashboard footer
│   │   ├── DashboardAccountDrawer.tsx # Account switcher drawer
│   │   └── UpgradeProcessingModal.tsx # Payment processing UI
│   ├── paths/                   # Learning path view/edit components
│   │   ├── PathDetail.tsx       # Full path view
│   │   ├── SectionView.tsx      # Section detail
│   │   ├── ResourceCard.tsx     # Resource card
│   │   └── PathHeader.tsx       # Path title/description
│   ├── auth/                    # Auth form components
│   │   ├── LoginForm.tsx        # Email/password login
│   │   └── RegisterForm.tsx     # Sign-up form
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx           # Button variants
│   │   ├── Modal.tsx            # Modal dialog
│   │   ├── Tabs.tsx             # Tab component
│   │   ├── ButtonCheckout.tsx   # Stripe checkout button
│   │   └── ...                  # Other UI primitives
│   ├── teams/                   # Team management components
│   │   ├── TeamList.tsx         # List user's accounts/teams
│   │   └── AddTeamMember.tsx    # Invite interface
│   ├── progress/                # Progress tracking components
│   │   └── ProgressTracker.tsx  # Track learning sections
│   └── ...                      # Other specialized components
│
├── types/                        # TypeScript type definitions
│   ├── config.ts                # Config type interface
│   ├── search.ts                # Search types
│   ├── next-auth.d.ts           # NextAuth types (if used)
│   └── index.ts                 # Exports
│
├── contexts/                     # React Context (global state)
│   └── config.tsx               # App config context (theme, models, plans)
│
├── hooks/                        # Custom React hooks
│   └── use-local-storage.ts     # useLocalStorage hook
│
├── supabase/                     # Database schema and migrations
│   ├── migrations/              # Timestamped SQL migration files
│   │   ├── [timestamp]_init_schema.sql
│   │   ├── [timestamp]_add_learning_paths.sql
│   │   └── ...
│   ├── seed.sql                 # Seed data for topics (generated)
│   └── templates/               # Email templates for Supabase Auth
│
├── tina/                         # TinaCMS blog content management
│   ├── config.ts                # TinaCMS schema and TinaCloud config
│   └── __generated__/           # Auto-generated types (gitignored)
│
├── content/
│   └── posts/                   # Blog posts (MDX files, managed by TinaCMS)
│
├── data/                         # Seed data and references
│   ├── seeds/                   # JSON data for topics, competencies
│   │   ├── topics.json
│   │   ├── competencies.json
│   │   └── ...
│   └── iconify/                 # Icon sets
│
├── public/                       # Static assets
│   ├── images/                  # Logo, icons, screenshots
│   ├── fonts/                   # Custom fonts (Fixel, Young Serif)
│   ├── admin/                   # TinaCMS admin UI
│   └── blog/                    # Blog images
│
├── scripts/                      # Utility scripts
│   ├── generate-seeds.js        # Generate SQL from JSON
│   ├── generate-seed-sql.ts     # TypeScript version
│   ├── backfill-topic-embeddings.ts # Vector embeddings
│   └── ...
│
├── worker.ts                     # Graphile Worker entry point (background jobs)
├── config.ts                     # App-wide configuration singleton
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── next.config.js               # Next.js config
├── postcss.config.js            # PostCSS (Tailwind) config
├── tailwind.config.js           # Tailwind CSS config (or CSS-first in globals.css)
│
└── .planning/codebase/           # Generated codebase documentation
    ├── ARCHITECTURE.md
    ├── STRUCTURE.md
    ├── STACK.md
    ├── CONVENTIONS.md
    ├── TESTING.md
    └── CONCERNS.md
```

## Directory Purposes

**app/:** Next.js App Router. All route files (page.tsx, route.ts, layout.tsx) live here. Organized by route group: (main), (auth), (dashboard).

**libs/:** Business logic and utilities. Grouped by domain: supabase (DB), jobs (background queue), models (AI), auth (user/account), validation (Zod schemas). No dependencies on React or components.

**components/:** React UI components. Organized by feature/domain: landing, dashboard, paths, auth, ui (primitives), teams, progress. Use kebab-case file names.

**types/:** Standalone TypeScript interfaces and type definitions. Not domain-specific utilities.

**supabase/:** Database migrations and seed data. Migrations are timestamped SQL files. Seed data generated from JSON.

**tina/:** TinaCMS configuration for blog content management. Auto-generates types in `__generated__/` (gitignored).

**content/:** Blog post MDX files managed by TinaCMS.

**public/:** Static assets served by Next.js. No code here.

**scripts/:** Development/build utilities. Generators (seed SQL, embeddings), checks (topic duplicates), and analysis scripts.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout (sets metadataBase)
- `app/(main)/layout.tsx`: Main app layout (html/body, Topbar, Footer)
- `app/(dashboard)/layout.tsx`: Dashboard layout (sidebar, topbar)
- `worker.ts`: Background job processor entry point

**Configuration:**
- `config.ts`: App config (domain, Stripe plans, colors, auth URLs)
- `next.config.js`: Next.js build config
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Dependencies and npm scripts

**Core Logic:**
- `app/api/paths/initiate/route.ts`: Path creation and job queueing
- `libs/jobs/queue.ts`: Job queueing API
- `libs/jobs/tasks/index.ts`: Job task registry
- `libs/openrouter.ts`: AI model inference
- `libs/auth.ts`: Auth helpers and account lookup

**Testing:**
- No dedicated test directory found. Tests likely colocated with source files (not yet implemented at scale).

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `PathCard.tsx`, `Topbar.tsx`)
- Pages & routes: `lowercase/page.tsx`, `lowercase/route.ts` (Next.js convention)
- Utilities: `kebab-case.ts` (e.g., `link-metadata.ts`, `search-engines.ts`)
- Schemas: `kebab-case-schema.ts` (e.g., `path-schema.ts`, `team-schema.ts`)
- Subdirectories: `kebab-case/` (e.g., `dashboard-layout/`, `user-competencies/`)

**Functions:**
- Async functions: Use `async function` or `const x = async () => {}`
- Helpers: camelCase (e.g., `requireAuth()`, `getUserDefaultAccount()`, `getModelConfig()`)
- React hooks: `use*` (e.g., `useLocalStorage()`)
- Event handlers: `handle*` or `on*` (e.g., `handleSubmit()`, `onClick()`)

**Variables:**
- camelCase for constants and variables
- UPPER_CASE for truly global constants (rare)
- Descriptive names: `pathId` not `id`, `accountWithRole` not `data`

**Types:**
- PascalCase for types and interfaces
- Suffix `*Type` or `*Schema` for type definitions (e.g., `AccountType`, `PathGenerationRequestSchema`)
- Suffix `*Payload` for job payloads (e.g., `GenerateMetadataPayload`)

**React Components:**
- PascalCase: `PathCard`, `DashboardSidebar`
- Props interface: `{ComponentName}Props`
- Client components: Mark with `"use client"` at top of file

## Where to Add New Code

**New Learning Path Feature (e.g., path filtering, tagging):**
- Implementation: `app/(dashboard)/skills/page.tsx` (if UI) or `libs/accounts.ts` (if business logic)
- Components: `components/dashboard/`
- API route: `app/api/paths/[endpoint]/route.ts`
- Validation: `libs/validation/path-schema.ts` (add new Zod schema)
- Tests: Colocate in same directory as source

**New Team/Account Feature (e.g., role permissions):**
- Implementation: `libs/teams.ts` (business logic) or `libs/auth.ts` (auth helpers)
- API route: `app/api/accounts/[endpoint]/route.ts`
- Components: `components/teams/`
- Validation: `libs/validation/team-schema.ts`

**New Background Job (e.g., async task):**
- Task implementation: `libs/jobs/tasks/[job-name].ts`
- Register in: `libs/jobs/tasks/index.ts` (add to TaskList export)
- Queue it: Call `addJob('[job-name]', payload)` in API routes or other tasks
- Types: Add payload interface to `libs/jobs/types.ts`

**New External Integration (e.g., new API):**
- Client wrapper: `libs/[service-name].ts` (e.g., `libs/unsplash.ts`)
- Use in: Job tasks or API routes
- Environment var: Add to `.env.example`
- Error handling: Wrap in try/catch; log to console and Sentry

**New Utility or Helper:**
- Standalone: `libs/[utility-name].ts` (e.g., `libs/embeddings.ts`)
- Reusable: `libs/[domain]/[utility].ts` (e.g., `libs/models/model-config.ts`)
- Type definitions: `types/[domain].ts` if cross-module

**New Route/Page:**
- Landing/public: Add to `app/(main)/[route]/page.tsx`
- Auth pages: Add to `app/(auth)/[route]/page.tsx`
- Dashboard/protected: Add to `app/(dashboard)/[route]/page.tsx`
- Layout: Create subdirectory with `layout.tsx` if nested routes need shared wrapper

**New Component:**
- Feature-specific: `components/[feature]/[ComponentName].tsx`
- Reusable UI primitive: `components/ui/[ComponentName].tsx`
- Dashboard-specific: `components/dashboard/[ComponentName].tsx`

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase documentation (this STRUCTURE.md, ARCHITECTURE.md, etc.)
- Generated: Yes (by gsd-map-codebase agent)
- Committed: Yes (part of repo)

**`tina/__generated__/`:**
- Purpose: Auto-generated TypeScript types from TinaCMS schema
- Generated: Yes (by `tinacms build`)
- Committed: No (add to .gitignore)

**`supabase/migrations/`:**
- Purpose: Database schema migrations (SQL)
- Generated: No (hand-written)
- Committed: Yes (version control for DB)

**`content/posts/`:**
- Purpose: Blog post MDX files
- Generated: No (created via TinaCMS UI or manual commit)
- Committed: Yes (TinaCloud commits to Git)

**`node_modules/`:**
- Purpose: Installed packages
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

**`.next/`:**
- Purpose: Next.js build cache and output
- Generated: Yes (by next build)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-07-03*
