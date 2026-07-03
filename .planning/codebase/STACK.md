# Technology Stack

**Analysis Date:** 2026-07-03

## Languages

**Primary:**
- TypeScript 5.9.2 - Full codebase (server, client, API routes, background workers)

**Secondary:**
- JavaScript - Configuration files (`next.config.js`, `tina/config.ts` uses TypeScript but some scripts use plain JS)
- SQL - Database schema and migrations (`supabase/migrations/`)

## Runtime

**Environment:**
- Node.js >=24 (configured in `package.json` engines)

**Package Manager:**
- npm with lockfile (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 15.5.19 - Full-stack framework with App Router, server components, API routes, middleware
- React 19.2.1 - UI component library with latest hooks
- TypeScript 5.9.2 - Language and type system

**Testing:**
- Jest (type definitions present, not actively used in visible tests)
- Vitest (type definitions present)

**Build/Dev:**
- TinaCMS 3.9.3 - Headless CMS for blog (Git-based MDX content)
- Tailwind CSS 4.1.10 - CSS-first utility framework with PostCSS plugin
- Next.js MDX (@next/mdx 15.1.8) - Markdown as components for blog posts

## Key Dependencies

**Critical Infrastructure:**
- @supabase/supabase-js 2.45.0 - PostgreSQL database client
- @supabase/ssr 0.4.0 - Server-side rendering support for Supabase Auth
- graphile-worker 0.16.6 - Background job queue for learning path generation
- stripe 13.11.0 - Payment processing and webhook verification
- openai 6.9.1 - OpenRouter API client (uses OpenAI SDK with custom baseURL)

**Data & Validation:**
- zod 3.24.1 - Runtime schema validation for API requests/responses
- axios 1.7.9 - HTTP client for custom API calls

**UI & Components:**
- react-dom 19.2.1 - React DOM rendering
- @headlessui/react 2.2.0 - Unstyled accessible components
- daisyui 5.0.5 - Tailwind CSS component library
- react-hot-toast 2.4.1 - Toast notifications
- nextjs-toploader 3.7.15 - Progress bar during navigation
- motion 12.23.15 - Animation library (Framer Motion alternative)
- simplebar-react 3.3.2 - Custom scrollbar styling
- react-syntax-highlighter 15.6.1 - Code block highlighting in documentation

**Email & Communication:**
- resend 4.0.1 - Transactional email service
- crisp-sdk-web 1.0.25 - Customer support chat widget

**Monitoring & Analytics:**
- @sentry/nextjs 10.27.0 - Error tracking and performance monitoring with source map support
- @axiomhq/js 1.3.1 - Axiom client (logging/analytics)
- @axiomhq/nextjs 0.1.6 - Axiom Next.js integration
- @axiomhq/react 0.1.6 - Axiom React instrumentation
- @axiomhq/logging 0.1.6 - Structured logging
- swetrix 3.7.2 - Privacy-focused analytics

**Icon System:**
- @iconify/react 6.0.2 - Icon library with on-demand loading
- @iconify-json/devicon 1.2.50 - Developer icons
- @iconify-json/logos 1.2.10 - Technology logos
- @iconify-json/lucide 1.2.73 - Lucide icons
- @iconify-json/tabler 1.2.23 - Tabler icons
- @iconify/tailwind4 1.1.0 - Tailwind CSS integration for icons

**Content Management:**
- tinacms 3.9.3 - Visual git-based CMS
- @tinacms/cli 2.5.1 - TinaCMS CLI for schema generation
- @mdx-js/loader 3.1.0 - MDX webpack loader
- @mdx-js/react 3.1.0 - MDX React provider
- @next/mdx 15.1.8 - Next.js MDX plugin

**Other Utilities:**
- form-data 4.0.1 - Multipart form data construction
- @paritydeals/react-promotions-ui 1.2.0-beta - Regional pricing/promo UI widget
- tsx 4.20.6 - TypeScript executor for background worker
- eslint 9.17.0 - Code linting (errors ignored in production builds)
- eslint-config-next 15.5.19 - Next.js ESLint configuration

## Configuration

**Environment:**
- Environment variables from `.env` / `.env.local` (see INTEGRATIONS.md for required vars)
- Development: local Supabase instance (`supabase start`)
- Development: local Stripe webhooks (`stripe listen --forward-to localhost:3001/api/webhook/stripe`)

**Build Configuration:**
- `next.config.js` - Extensive security headers, CSP policy, image optimization settings, Sentry integration
- `tsconfig.json` - Strict mode disabled (`"strict": false`), but `strictNullChecks: true`, path aliases (`@/*`), Next.js plugin
- `tailwind.config.js` - CSS-first configuration (all customization in `app/globals.css`)
- `postcss.config.js` - Tailwind CSS v4 PostCSS plugin
- `tina/config.ts` - TinaCMS schema for blog posts (MDX format in `content/posts/`)
- `.eslintrc` - ESLint rules (errors ignored in production)

**Deployment:**
- `package.json` scripts define build process: `tinacms build && next build`
- Output: `standalone` mode for Docker/serverless deployment
- Sentry source map upload (requires SENTRY_AUTH_TOKEN)
- CDN_URL environment variable for BunnyCDN asset prefix

## Platform Requirements

**Development:**
- Node.js 24+
- npm 10+ (package manager)
- PostgreSQL (via local Supabase)
- Stripe CLI (for webhook forwarding)

**Production:**
- Node.js 24+
- PostgreSQL database (Supabase hosted)
- Persistent storage for background job state (Database)
- Two separate services: Web (Next.js) and Worker (Graphile Worker)

---

*Stack analysis: 2026-07-03*
