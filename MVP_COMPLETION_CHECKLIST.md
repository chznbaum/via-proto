# ViaProto MVP Completion Checklist

**Created:** November 19, 2025
**Status:** ~85% Complete - ~4-8 hours remaining for MVP launch
**Target:** Launch-ready application with polished UX

---

## How to Use This Checklist

- [ ] = Not started
- [x] = Completed
- 🔴 = CRITICAL - Blocks MVP launch
- 🟡 = IMPORTANT - Significantly improves launch quality
- 🟢 = NICE-TO-HAVE - Post-launch enhancement

**Estimated Times:** Conservative estimates; may be faster with AI assistance.

---

## CRITICAL - Blocks MVP Launch (4.5-6 hours)

### 1. Landing Page 🔴 (~2-3 hours)
**Reference:** PRD Section 5.1, IMPLEMENTATION_PLAN Days 5-7, Scalo DaisyUI template for Next.js (../scalo-nextjs@3.0.0/) with AI Storage landing page template preferred

- [x] **1.1 Hero Section** (30 min)
  - [x] Create hero component at `app/page.tsx`
  - [x] Value proposition headline: "Get ahead while others fall behind"
  - [x] Subheadline explaining benefit: "Get a complete, personalized learning path in 60 seconds. Everything you need to master any skill, curated and organized for you."
  - [x] Primary CTA button: "Generate Your First Path" → `/dashboard`
  - [x] Secondary CTA: "Browse Public Paths" → `/explore`
  - [x] Hero illustration from Undraw or Hero Patterns background
  - [x] Troubleshoot public learning path count and topic count not being correctly pulled from Supabase
    - No error being returned, `Stats fetched: {pathsCount: 0, topicsCount: 0}` in the console logs
  - [x] **Files to modify:** `app/page.tsx`
  - [x] **Design:** Use DaisyUI hero component pattern

- [x] **1.2 Feature Highlights** (45 min)
  - [x] Create 3-4 feature cards with icons (Heroicons)
  - [x] Features to highlight:
    - "AI-Powered Curation" - Claude Sonnet 4.5 for Pro users
    - "Real, Verified Resources" - No AI-generated content
    - "Track Your Progress" - Visual progress tracking (mention Pro feature)
    - "Team Collaboration" - Shared learning paths (Team tier)
  - [x] Use DaisyUI card components in grid layout
  - [x] Mobile-responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
  - **Component:** Create `components/LandingFeatures.tsx`

- [x] **1.3 Pricing Preview** (30 min)
  - [x] Embed simplified pricing comparison (3 tiers)
  - [x] Show key differentiators:
    - Free: 1 path/month, DeepSeek, public paths only
    - Pro: 5 paths/month, Claude Sonnet 4.5, private paths, progress tracking
    - Team: 10 base + 3/seat, all Pro features, team collaboration
  - [x] CTA button: "See Full Pricing" → `/pricing`
  - [x] Align pricing section layout with Scalo storage template (`scalo-nextjs@3.0.0/src/app/(landings)/storage/components/Pricing.tsx`)
    - [x] Narrow pricing section
    - [x] Align the Team plan box design with dark theme ("Ultimate") contrast box from the template
  - **Reuse:** Adapt from existing `components/Pricing.tsx`

- [ ] **1.4 Sample Path Preview (Optional)** (20 min)
  - [ ] Show collapsed view of a sample learning path
  - [ ] Static data (not from database)
  - [ ] Demonstrates path structure (sections, resources, badges)
  - [ ] Link to sample public path if available

- [x] **1.5 Footer** (15 min)
  - [x] Company info, social links (optional)
  - [x] Navigation: About, Contact, Pricing, Blog (if exists)
  - [x] Legal links: Terms of Service, Privacy Policy
  - [x] Copyright notice
  - [x] Align footer to the Scalo template
  - **Files to modify:** `components/Footer.tsx` (likely exists from ShipFast)

- [ ] **1.6 Path Generation Time Tracking** (30 min)
  - [ ] Add `generation_time_ms` column to `learning_paths` table
  - [ ] Track start and end time in path generation API endpoint
  - [ ] Store the duration in milliseconds when path is saved
  - [ ] Update hero stats to calculate and display real average generation time
  - [ ] Query: `SELECT AVG(generation_time_ms) FROM learning_paths WHERE generation_time_ms IS NOT NULL`
  - **Files to modify:**
    - Database migration for new column
    - `app/api/paths/generate/route.ts` - add timing logic
    - `components/landing/Hero.tsx` - fetch and display real average
  - **Note:** Currently showing static "60s" stat; this makes it dynamic and accurate
  
  - [x] **1.7 Additional Components from Scalo Template**
    - [x] Add FAQ section from Scalo storage template (`scalo-nextjs@3.0.0/src/app/(landings)/storage/components/FAQs.tsx`)
      - [x] Use placeholder Q&A (will generate from PRD later)
    - [x] Add below-FAQ CTA section from Scalo storage template (`scalo-nextjs@3.0.0/src/app/(landings)/storage/components/Footer.tsx` lines 9-32)

---

### 2. Public Browse Page 🔴 (~1.5-2 hours)
**Reference:** PRD Section 3.3.3, PRD Section 5.1
**Purpose:** Allow unauthenticated users to discover public learning paths (essential for SEO and lead generation)

- [x] **2.1 Create Public Explore Page** (1 hour)
  - [x] Create route: `app/explore/page.tsx`
  - [x] **No authentication required** - publicly accessible
  - [x] Fetch all public learning paths from database:
    ```typescript
    const { data: paths } = await supabase
      .from('learning_paths')
      .select('*, topics(*), profiles(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    ```
  - [x] Display paths in grid layout (similar to dashboard)
  - [x] Each path card shows:
    - Topic name
    - Title
    - Skill level badge
    - Estimated hours
    - View count
    - Creator name
    - Created date
    - Click → view path detail at `/paths/[id]`
  - [x] Use DaisyUI card components
  - [x] Mobile-responsive grid (1 col mobile, 2 md, 3 lg)
  - **New files:** `app/explore/page.tsx`
  - **Reuse component:** Can adapt `PathCard` component from dashboard

- [x] **2.2 Update Navigation** (15 min)
  - [x] Add "Explore" or "Browse Paths" link to main header navigation
  - [x] Position: Between "Home" and "Pricing" (or similar)
  - [x] Accessible to both authenticated and unauthenticated users
  - [x] Highlight as key discovery feature
  - **Files to modify:** `components/Header.tsx` or `components/LayoutClient.tsx`

- [x] **2.3 Update Dashboard** (10 min)
  - [x] Remove tabs (My Paths, Browse Public)
  - [x] Remove My Learning Paths h2 element
  - [x] Ensure headins on dashboard layout only use --font-sans instead of --font-serif
  - [x] Replicate the landing page logo on the dashboard
  - [x] We have two ways of opening the account drawer from the dashboard: in the layout sidebar and in the desktop topnav—remove the one from the topnav and ensure the one in the layout sidebar uses the user's avatar
  - **Files to modify:** `app/dashboard/page.tsx` or dashboard component

---

### 3. Terms of Service 🔴 (~30-60 min)
**Reference:** PRD Section 7 (Launch Checklist), existing `/tos` page

- [x] **3.1 Update TOS Content** (45 min)
  - [x] Review existing `app/tos/page.tsx` placeholder
  - [x] Restructure tos page to match Scalo terms template structure and styles
  - [x] Adapt ShipFast template terms to ViaProto specifics:
    - Service description: AI-powered learning path generation
    - External links disclaimer (resources are third-party)
    - User-generated content policy (public paths)
    - Rate limiting and subscription tiers
    - Acceptable use (no prompt injection, abuse)
    - Intellectual property (paths belong to account owner)
    - Termination and refund policy
  - [x] Add section: "External Resources Disclaimer"
    - We don't own/control external content
    - Users access resources at their own risk
    - Broken links may occur; we provide "regenerate" option
  - [x] Add section: "AI-Generated Content"
    - Paths are AI-assisted curation, not instruction
    - Accuracy not guaranteed; user discretion advised
  - **Files to modify:** `app/tos/page.tsx`
  - **Tool:** Use Claude to generate draft, then review/edit

- [x] **3.2 Verify Legal Page Layout** (5 min)
  - [x] Ensure proper styling (readable typography, max-width prose)
  - [x] Add "Last Updated" date
  - [x] Link to contact/support email for questions

---

### 4. Privacy Policy 🔴 (~30-60 min)
**Reference:** PRD Section 7, existing `/privacy-policy` page

- [x] **4.1 Update Privacy Policy Content** (50 min)
  - [x] Review existing `app/privacy-policy/page.tsx` placeholder
  - [x] Adapt ShipFast template to ViaProto specifics:
    - Data collected: Email, name, avatar (via Supabase Auth)
    - Payment info: Processed by Stripe (we don't store card details)
    - Usage data: Paths generated, topics selected, view counts
    - Third-party services disclosure:
      - Supabase (database, auth) - EU/US regions
      - Stripe (payments) - PCI-compliant
      - OpenRouter (AI generation) - prompt data sent to LLM providers
      - Resend (transactional emails)
      - Crisp Chat (support widget)
      - DataFast (analytics)
    - Cookies: Session cookies, analytics cookies
    - Data retention: Accounts deleted on request, cascade deletes
    - User rights: GDPR compliance (export, delete, access)
    - Public paths: Visible to all users, mandatory for free, opt-in sharing on pro/team
  - [x] Add section: "AI Model Providers"
    - User prompts sent to LLM providers (found in libs/models/model-config.ts) via OpenRouter
    - We don't control how model providers use data, but the user chooses which model they use
    - Link to OpenRouter, LLM provider privacy policies
  - **Files to modify:** `app/privacy-policy/page.tsx`
  - **Tool:** Use Claude to generate draft, then review

- [x] **4.2 Verify Privacy Page Layout** (5 min)
  - [x] Readable typography, proper section headings
  - [x] "Last Updated" date
  - [x] Contact email for privacy inquiries

---

### 5. App Branding Update 🔴 (~15-30 min)
**Reference:** Config files, PRD Section 2

- [x] **5.1 Update config.ts** (10 min)
  - [x] Open `config.ts` or equivalent config file
  - [x] Replace `appName: "ShipFast"` → `"ViaPro.to"`
  - [x] Update `appDescription` to ViaProto value prop
  - [x] Update `domainName` to production domain (e.g., `viaproto.com`)
  - [x] Verify `supportEmail` is correct
  - [x] Update social media handles if applicable
  - **Files to modify:** `config.ts`

- [x] **5.2 Search for ShipFast References** (15 min)
  - [x] Run global search: `Grep -i "shipfast"` across codebase
  - [x] Replace all remaining ShipFast branding with ViaProto
  - [x] Check files:
    - `app/layout.tsx` (metadata)
    - `components/Header.tsx` or `components/LayoutClient.tsx`
    - `components/Footer.tsx`
    - Email templates (if any)
  - [x] The README.md will need to be entirely replaced in preparation for launch
  - **Command:** Use Grep tool to find all instances

- [x] **5.3 Update Metadata** (5 min)
  - [x] Update `app/layout.tsx` metadata:
    - `title.default` → "ViaProto - Learning Paths to Help You Get Ahead"
    - `description` → ViaProto value prop
    - `openGraph.title` and `openGraph.description`
    - `twitter.title` and `twitter.description`
  - [x] Ensure other public-facing pages have appropriate metadata:
    - [x] Explore
    - [x] Terms of Service
    - [x] Privacy Policy
  - **Files to modify:** `app/layout.tsx`

---

### 6. End-to-End Testing 🔴 (~1 hour)
**Reference:** PRD Section 7, IMPLEMENTATION_PLAN Testing Strategy

- [ ] **6.1 New User Flow - Free Tier** (20 min)
  - [ ] Test signup with magic links
  - [ ] Verify personal account auto-created
  - [ ] Generate first learning path
  - [ ] Verify path marked as public (`is_public = true`)
  - [ ] Check rate limit counter: "1 of 1 paths used this month"
  - [ ] Try to generate second path → should show upgrade prompt
  - [ ] View generated path in dashboard "My Paths" tab
  - [ ] Click into path detail page → verify all sections/resources render
  - [ ] Navigate to `/explore` page → verify can see public paths (no auth required)
  - [ ] Test category and skill level filters on explore page
  - [ ] Browse public paths tab in dashboard → verify works

- [ ] **6.2 Pro Tier Upgrade Flow** (20 min)
  - [ ] Click upgrade to Pro from dashboard
  - [ ] Complete Stripe checkout (test mode with card `4242 4242 4242 4242`)
  - [ ] Verify redirect back to dashboard with success message
  - [ ] Check subscription status in account (should be `active`)
  - [ ] Verify rate limit updated: "0 of 5 paths remaining"
  - [ ] Generate new path → should use Claude Sonnet 4.5 model
  - [ ] Verify path is private by default (`is_public = false`)
  - [ ] Test toggling path visibility (if UI exists)
  - [ ] Open Stripe Customer Portal via account dropdown
  - [ ] Verify can manage subscription (cancel, update payment)

- [ ] **6.3 Team Tier Checkout** (15 min)
  - [ ] Navigate to pricing page
  - [ ] Select Team tier
  - [ ] Adjust seat count to 3
  - [ ] Verify price updates: 3 × $10/month = $30/month
  - [ ] Complete checkout (test mode)
  - [ ] Verify redirect and subscription activation
  - [ ] Check rate limit: "0 of 19 paths remaining" (10 base + 3×3 seats)
  - [ ] Generate team path → verify visible in "Team Paths" tab

- [ ] **6.4 Stripe Webhook Testing** (15 min)
  - [ ] Use Stripe CLI to forward webhooks to localhost:
    ```bash
    stripe listen --forward-to http://localhost:3001/api/webhook/stripe
    ```
  - [ ] Trigger test events:
    - `checkout.session.completed` → verify subscription activated
    - `invoice.paid` → verify generation counter reset
    - `customer.subscription.updated` → verify seat count updated
    - `customer.subscription.deleted` → verify downgrade to free tier
  - [ ] Check database after each webhook to confirm changes
  - **Note:** This requires Stripe CLI installed locally

- [ ] **6.5 Public Access & Error Handling** (10 min)
  - [ ] **Test unauthenticated access to /explore** → should work without login
  - [ ] **Test unauthenticated access to public path detail** → should work
  - [ ] Test path generation with invalid inputs (if possible)
  - [ ] Test accessing non-existent path ID → verify 404 or redirect
  - [ ] Test accessing another user's private path → verify RLS blocks access
  - [ ] Test rate limit exceeded → verify graceful error message
  - [ ] Check console for any errors during normal flows

---

## IMPORTANT - Significantly Improves Launch (9-14 hours)

### 7. Topic Improvements 🟡 (~1-2 hours)
**Reference:** MVP_LAUNCH_STATUS_REPORT Section "Important #6", PRD Section 3.1

- [x] **7.1 Expand Topic Specificity** (1.5 hours)
  - [x] Review current `data/topics_seed.json`
  - [x] Use AI to generate more specific, goal-oriented topics:
    - Instead of "Python" → add:
      - "Automating tasks with Python"
      - "Building web applications with Python" (Competencies: Python, Flask, Django, ...)
      - "Data analysis with Python" (Competencies: Python, Pandas, NumPy, ...)
      - "Machine learning with Python" (Competencies: Python, scikit-learn, ...)
      - "Building APIs with Python" (Competencies: Python, FastAPI, ...)
    - Instead of "React" → add:
      - "Building interactive UIs with React"
      - "Full-stack apps with React and Next.js"
      - "Mobile apps with React Native"
      - "State management in React"
  - [x] Ensure each topic has:
    - Clear learning goal in name
    - Relevant synonyms for search
    - Correct category assignment
      - Note that currently we are not setting categories despite needing them to be able to browse
        - Categories should be hierarchical and likely need to be their own table, with a join table for many-to-many association
    - We should similarly set a new table for the underlying skill/competency (ie: React, Spanish—currently this is the title for most topics) and relate with a join table
      - Purpose of this:
        - Be able to show related learning paths for the same competency (that the user has access to)
        - Be able to indicate some skills/competencies as prerequisites for others (ie: You need JavaScript before React)
          - We could then prompt the user to check off if they have the prerequisite skills and include that context in the generation prompt
        - Be able to indicate some skills/competencies are interchangeable (ie: Different types of relational database)
        - Be able to inform the LLM via the prompt what competencies we expect the user to develop in the learning path to improve the quality of path generation
  - [x] Update topics_seed.json with expanded list (target: 1000 topics, expanded in batches/multiple Claude Code sessions)
  - [x] Re-seed database: `npm scripts/generte-seeds.js && supabase db reset`
  - **Files to modify:** `data/topics_seed.json`, seed script
  - **Tool:** Use Claude to generate topic variations

- [x] **7.2 Verify Topic Search Quality** (15 min)
  - [x] Test typeahead with expanded topics
  - [x] Verify synonym matching works
  - [x] Ensure no duplicates or overlap

---

### 8. Browse Topics by Category UI 🟡 (~2-3 hours)
**Reference:** MVP_LAUNCH_STATUS_REPORT Section "Important #7", PRD Section 3.1

- [ ] **8.1 Create Category Browse Page** (1 hour)
  - [ ] Create new page: `app/browse/page.tsx`
  - [ ] Display category grid/cards:
    - Programming
    - Design
    - Business
    - Data Science
    - Marketing
    - Other categories from topics data
  - [ ] Each category card shows:
    - Category name
    - Icon (Heroicons)
    - Topic count
    - Click → filtered topic list
  - [ ] Use DaisyUI card components
  - **New files:** `app/browse/page.tsx`, `components/CategoryGrid.tsx`

- [ ] **8.2 Category-Filtered Topic List** (45 min)
  - [ ] Create route: `app/browse/[category]/page.tsx`
  - [ ] Fetch topics for selected category
  - [ ] Display as grid of topic cards
  - [ ] Each topic card:
    - Topic name
    - Description (if available)
    - Skill level selector dropdown
    - "Generate Path" button → creates path for this topic
  - **New files:** `app/browse/[category]/page.tsx`, `components/TopicCard.tsx`

- [ ] **8.3 Update Dashboard Navigation** (30 min)
  - [ ] Add "Browse by Category" link to dashboard or header
  - [ ] Update typeahead search to suggest "Or browse by category"
  - [ ] Ensure consistent styling with existing UI
  - **Files to modify:** `components/Header.tsx`, `app/dashboard/page.tsx`

- [ ] **8.4 Mobile Optimization** (15 min)
  - [ ] Test category grid on mobile (should collapse to 1-2 columns)
  - [ ] Test topic list on mobile
  - [ ] Ensure touch targets are adequate size

---

### 9. Initial Teams UI 🟡 (~3-4 hours)
**Reference:** MVP_LAUNCH_STATUS_REPORT Section "Important #8", PRD Section 3.6, IMPLEMENTATION_PLAN Week 3

**Note:** Data model and team subscriptions already working. This adds UI for team management.

- [ ] **9.1 Team Settings Page** (1 hour)
  - [ ] Create route: `app/dashboard/team/page.tsx`
  - [ ] Conditional rendering: Only show if user is in a team account
  - [ ] Display team information:
    - Team name
    - Seat count
    - Current members list (from `account_users`)
    - Each member shows: name, email, role, "joined X days ago"
  - [ ] Owner-only actions:
    - "Invite Member" button
    - "Remove Member" button per user
  - **New files:** `app/dashboard/team/page.tsx`, `components/TeamMembersList.tsx`
  - **API needed:** `/api/teams/[teamId]/members` (GET)

- [ ] **9.2 Team Invitation Flow** (1.5 hours)
  - [ ] Create API route: `app/api/teams/[teamId]/invite/route.ts`
  - [ ] POST handler:
    - Accept `email` parameter
    - Check if user exists (by email)
    - If user exists: Add to `account_users` directly
    - If user doesn't exist: Send invitation email via Resend
    - Email contains: Team name, inviter name, signup link with invite token
  - [ ] Create invitation modal in Team Settings:
    - Input field for email address
    - "Send Invitation" button
    - Success toast on send
  - [ ] Handle invitation acceptance:
    - Signup page checks for `?invite_token=` parameter
    - After auth, auto-adds user to team account
    - Sets team as user's default account
  - **New files:**
    - `app/api/teams/[teamId]/invite/route.ts`
    - `components/TeamInviteModal.tsx`
  - **Email template:** Create Resend template for team invites

- [ ] **9.3 Remove Team Member** (30 min)
  - [ ] Create API route: `app/api/teams/[teamId]/members/[userId]/route.ts`
  - [ ] DELETE handler:
    - Verify requester is team owner
    - Check target user is not owner (can't remove owner)
    - Delete from `account_users` table
    - Return success
  - [ ] Add "Remove" button to member list (owner-only)
  - [ ] Confirmation modal: "Are you sure you want to remove [name]?"
  - **New files:** `app/api/teams/[teamId]/members/[userId]/route.ts`

- [ ] **9.4 Role Management (Optional)** (30 min)
  - [ ] Add role dropdown per member (owner-only)
  - [ ] Roles: Owner, Admin, Member
  - [ ] API to update role:
    - PATCH `/api/teams/[teamId]/members/[userId]`
    - Update `account_users.role`
  - [ ] Prevent demoting the only owner
  - **Note:** Can defer to post-MVP if time constrained

- [ ] **9.5 Navigation Updates** (15 min)
  - [ ] Add "Team Settings" link to account dropdown (if user in team)
  - [ ] Add "Team" tab to dashboard navigation
  - **Files to modify:** `components/ButtonAccount.tsx`, dashboard layout

---

### 10. Link Preview Generation 🟡 (~2-3 hours)
**Reference:** MVP_LAUNCH_STATUS_REPORT Section "Important #9", PRD Section 3.2.3, IMPLEMENTATION_PLAN Section 1.3.6

- [ ] **10.1 OpenGraph Fetcher Utility** (45 min)
  - [ ] Create utility: `libs/opengraph.ts`
  - [ ] Function `fetchOpenGraph(url: string)`:
    - Fetch URL with HEAD request first (check 200 status)
    - If success, fetch full HTML
    - Parse OpenGraph tags:
      - `og:image`
      - `og:title`
      - `og:description`
    - Return object with tags or null if error/404
    - Handle timeouts (5 second max)
  - [ ] Use `cheerio` or built-in HTML parsing
  - **New files:** `libs/opengraph.ts`
  - **Dependencies:** May need `cheerio` package

- [ ] **10.2 Resource Card Preview** (1 hour)
  - [ ] Update `components/PathCard.tsx` or resource display component
  - [ ] When rendering resource:
    - Check if `og_image_url` exists in database
    - If yes: display image thumbnail
    - If no: fetch on client-side (or server-side in Server Component)
  - [ ] Display OpenGraph preview card:
    - Image thumbnail (if available)
    - og:title (fallback to resource title)
    - og:description (fallback to resource description)
    - URL domain (e.g., "youtube.com", "github.com")
  - [ ] Add "broken link" badge if fetch returns 404
  - **Files to modify:** Resource card component
  - **Note:** Use Server Component with `fetch()` for OG tags

- [ ] **10.3 Cache OpenGraph Data** (45 min)
  - [ ] Update path generation endpoint (`/api/paths/generate`)
  - [ ] After AI generates path, before storing:
    - For each resource, fetch OpenGraph data
    - Store in `resources.og_image_url`, `og_title`, `og_description` columns
    - Update `link_status` to 'active' or 'broken'
  - [ ] Update migration to add OG columns (if not already present):
    - `og_image_url` TEXT
    - `og_title` TEXT
    - `og_description` TEXT
  - **Files to modify:**
    - `app/api/paths/generate/route.ts`
    - Database migration (add columns)

- [ ] **10.4 Regenerate Section with Preview** (30 min)
  - [ ] When user clicks "Regenerate Section" (post-MVP feature):
    - Re-fetch OpenGraph data for new resources
    - Update cached data in database
  - **Note:** Regenerate feature may be post-MVP; this prepares for it

---

### 11. Path Social Sharing 🟡 (~1-2 hours)
**Reference:** MVP_LAUNCH_STATUS_REPORT Section "Important #10", PRD Section 8.2

- [ ] **11.1 Dynamic OpenGraph Meta Tags** (45 min)
  - [ ] Update `app/paths/[id]/page.tsx` `generateMetadata` function
  - [ ] Fetch learning path data
  - [ ] Return dynamic metadata:
    ```typescript
    export async function generateMetadata({ params }: Props): Promise<Metadata> {
      const path = await fetchPath(params.id);
      return {
        title: path.title,
        description: path.description || `Learn ${path.topic} - ${path.skill_level}`,
        openGraph: {
          title: path.title,
          description: path.description,
          type: 'website',
          images: [
            {
              url: '/og-image-default.png', // Or generate dynamic image
              width: 1200,
              height: 630,
            }
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: path.title,
          description: path.description,
        }
      };
    }
    ```
  - **Files to modify:** `app/paths/[id]/page.tsx`

- [ ] **11.2 Dynamic OG Image Generation (Optional)** (1 hour)
  - [ ] Use `@vercel/og` package to generate dynamic images
  - [ ] Create route: `app/api/og-image/route.tsx`
  - [ ] Generate image with:
    - Path title
    - Topic name
    - Skill level
    - ViaProto branding
  - [ ] Update metadata to use dynamic image: `/api/og-image?id=[pathId]`
  - **Note:** Can defer to post-MVP if time constrained
  - **Dependencies:** `@vercel/og` package

- [ ] **11.3 Twitter Card Validation** (15 min)
  - [ ] Test OG tags with Twitter Card Validator: https://cards-dev.twitter.com/validator
  - [ ] Test with Facebook Debugger: https://developers.facebook.com/tools/debug/
  - [ ] Verify image displays correctly
  - [ ] Ensure title and description are readable

---

## KNOWN ISSUES - Medium Priority Fixes

### 12. Rate Limit Billing Cycle Fix 🟡 (~30 min)
**Reference:** MVP_LAUNCH_STATUS_REPORT "Known Issues #1"

- [ ] **12.1 Update Reset Logic** (30 min)
  - [ ] Current: Resets on calendar month (first day of month)
  - [ ] Target: Reset on billing cycle anniversary
  - [ ] Update Stripe webhook handler (`/api/webhook/stripe`)
  - [ ] On `invoice.paid` event:
    - Get `subscription.current_period_start` from Stripe
    - Set `account.cycle_start_date = current_period_start`
    - Reset `paths_generated_this_cycle = 0`
  - [ ] Remove any cron job that resets on calendar month
  - **Files to modify:** `app/api/webhook/stripe/route.ts`

- [ ] **12.2 Generation Polling Function Issues** (20 min)
  - [ ] Investigate the following:
    - Polling checks are currently intended to take place every 2 seconds, but they are hitting much more frequently than that
    - On success or failure, polling continues to take place instead of stopping
      - Result of this is that users are bombarded with many success/error messages rather than just the one
  - [ ] On generation failure, give users a retry button on the card (instead of view path) that allows them to hit the generation function for that learning path again

- [ ] **12.3 Authentication Issues** (20 min)
  - [ ] Investigate the following:
    - Sign up works well, but login seems to have stopped working effectively:
      - When I attempt to log in with a valid email address for an existing user, I get the error that an account was not found and am redirected to sign up instead. This should only occur when an account genuinely can't be found. If we can't connect to the database for any reason, we should also error instead of creating the account, but the error message should be different.

---

## POST-MVP - Week 2+ Enhancements

### 13. Progress Tracking System 🟢 (~4-6 hours)
**Reference:** PRD Section 3.4, IMPLEMENTATION_PLAN Section 6, Week 2 roadmap

**Note:** Explicitly post-MVP per status report. Only implement if extra time.

- [ ] **13.1 Database Migration** (30 min)
  - [ ] Create `progress` table (see IMPLEMENTATION_PLAN Migration 10)
  - [ ] Columns: `user_id`, `resource_id`, `completed`, `completed_at`, `time_spent_minutes`, `notes`
  - [ ] Add RLS policies (users can only access their own progress)

- [ ] **13.2 API Routes** (1.5 hours)
  - [ ] `POST /api/progress/resources/[resourceId]` - Mark resource complete/incomplete
  - [ ] `PATCH /api/progress/resources/[resourceId]` - Update notes, time spent
  - [ ] `GET /api/progress/paths/[pathId]` - Get user's progress for a path

- [ ] **13.3 UI Components** (2 hours)
  - [ ] Add checkboxes to resource cards
  - [ ] Progress bars for sections (% complete)
  - [ ] Overall path progress bar
  - [ ] "Last studied: X days ago" timestamp

- [ ] **13.4 Notes Feature** (1 hour)
  - [ ] Add "Add Note" button per resource
  - [ ] Modal with markdown textarea
  - [ ] Display saved notes below resource

---

### 14. Path Editing & Management 🟢 (~6-8 hours)
**Reference:** PRD Section 8.2, IMPLEMENTATION_PLAN Week 4

- [ ] **14.1 Edit Path Metadata** (1 hour)
  - [ ] Edit title and description
  - [ ] Update API endpoint: `PATCH /api/paths/[id]`

- [ ] **14.2 Regenerate Section** (2 hours)
  - [ ] "Regenerate Section" button per section
  - [ ] Calls AI to generate new resources for that section
  - [ ] Replaces existing resources

- [ ] **14.3 Export Features** (3 hours)
  - [ ] Export path to PDF (with styling)
  - [ ] Export path to Markdown
  - [ ] Download button in path detail view

- [ ] **14.4 Archive/Duplicate** (1.5 hours)
  - [ ] Archive path (soft delete)
  - [ ] Duplicate path feature

---

### 15. Advanced Analytics 🟢 (~4-6 hours)
**Reference:** PRD Section 9

- [ ] User dashboard analytics
- [ ] Team admin progress dashboard
- [ ] Path popularity metrics
- [ ] Usage insights

---

## LAUNCH CHECKLIST - Final Steps Before Going Live

### Pre-Launch Verification
- [ ] All critical items (1-5) completed and tested
- [ ] Legal pages (TOS, Privacy Policy) reviewed and published
- [ ] Branding fully updated (no ShipFast references)
- [ ] Stripe switched from test mode to live mode
- [ ] Production environment variables set
- [ ] Custom domain configured with SSL
- [ ] CDN (Bunny CDN) configured for static assets
- [ ] Database backups configured
- [ ] Error monitoring setup (Sentry or similar)
- [ ] Support email configured and tested
- [ ] Social media accounts created (optional)
- [ ] Initial blog post or announcement drafted

### Launch Day
- [ ] Deploy to production (Coolify → Hetzner)
- [ ] Verify all pages load correctly
- [ ] Test signup flow on production
- [ ] Test payment flow with real card (refund immediately)
- [ ] Monitor error logs for first few hours
- [ ] Share on Product Hunt, Twitter, relevant communities
- [ ] Monitor analytics for first users

---

## Time Budget Summary

**Critical (Must Complete):**
- Landing Page: 2-3 hours
- Public Browse Page: 1.5-2 hours
- Terms of Service: 0.5-1 hour
- Privacy Policy: 0.5-1 hour
- Branding Updates: 0.25-0.5 hours
- End-to-End Testing: 1 hour
**Subtotal:** 5.75-8.5 hours

**Important (Recommended):**
- Topic Improvements: 1-2 hours
- Browse by Category: 2-3 hours
- Teams UI: 3-4 hours
- Link Previews: 2-3 hours
- Social Sharing: 1-2 hours
**Subtotal:** 9-14 hours

**Known Issues Fixes:**
- Rate limit billing cycle: 0.5 hours
- Free plan public default: 0.33 hours
**Subtotal:** ~1 hour

---

## Recommended Execution Order

### Option A: Fast Launch (1 day)
1. Branding Updates (30 min) 🔴
2. Landing Page (2.5 hours) 🔴
3. Public Browse Page (1.5 hours) 🔴
4. Terms of Service (45 min) 🔴
5. Privacy Policy (45 min) 🔴
6. End-to-End Testing (1 hour) 🔴
7. Topic Improvements (1.5 hours) 🟡
8. Deploy & Launch ✅
**Total:** ~8.5 hours

### Option B: Polished Launch (2-3 days)
Day 1:
1. Complete all Critical items (6-8.5 hours)
2. Topic Improvements (1.5 hours)

Day 2:
3. Browse by Category (2.5 hours)
4. Link Previews (2.5 hours)
5. Social Sharing (1.5 hours)

Day 3:
6. Teams UI (3.5 hours)
7. Known Issues Fixes (1 hour)
8. Final testing & Deploy ✅
**Total:** ~20.5 hours

### Option C: Feature-Complete Launch (3-4 days)
- All of Option B
- Plus: Progress Tracking (6 hours)
- Plus: Path Editing (6 hours)
**Total:** ~32.5 hours

---

## Notes

- **Parallelization:** Landing page components can be built independently (hero, features, pricing)
- **AI Assistance:** Use Claude to generate initial drafts for TOS, Privacy Policy, and topic expansions
- **Testing:** Test incrementally as you build; don't wait until end
- **Mobile-First:** Test each component on mobile viewport as you build
- **Deployment:** Use Coolify's deployment logs to catch errors early

---

**END OF CHECKLIST**

This checklist is ready for Claude to work through systematically. Each item includes context, file references, and clear acceptance criteria.
