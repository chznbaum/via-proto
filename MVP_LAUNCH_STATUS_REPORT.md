ViaProto - MVP Launch Status Report

Updated: November 19, 2025
Status: Near launch-ready, ~4-8 hours of work remaining

---
✅ COMPLETED - Core Functionality Working

1. Database & Infrastructure

- ✅ All 10 Supabase migrations deployed and working
- ✅ Multi-account architecture (personal + team accounts)
- ✅ Account-users join table for team memberships
- ✅ Row Level Security (RLS) policies configured
- ✅ Topics table with synonym support
- ✅ Learning paths, sections, resources tables
- ✅ Database functions (search_topics, update triggers)

2. Authentication & Authorization

- ✅ Supabase Auth integrated (Google/GitHub OAuth)
- ✅ Personal account auto-created on signup
- ✅ Auth middleware protecting /dashboard routes
- ✅ User default account selection working
- ✅ RLS enforcing public vs private path visibility

3. AI Path Generation System

- ✅ /api/paths/generate endpoint fully functional
- ✅ OpenRouter integration with OpenAI SDK
- ✅ Model selection by tier (DeepSeek free, Claude Sonnet 4.5 paid)
- ✅ User-selectable model override for all tiers
- ✅ Rate limiting enforced:
  - Free: 1 path/month
  - Pro: 5 paths/month
  - Team: 10 base + 3 per additional seat beyond 2
- ✅ JSON schema validation for AI responses
- ✅ Path storage with metadata (model used, generation time)
- ✅ Sections and resources properly ordered and stored

4. Path Display & Viewing

- ✅ Path detail page (/paths/[id]) fully styled with:
  - Path metadata (topic, skill level, hours, views)
  - Expandable sections with prerequisite badges
  - Resource cards with type icons, free/paid badges, time estimates
  - Creator attribution and creation date
- ✅ View count increment (fire-and-forget)
- ✅ Back navigation to dashboard
- ✅ Public/private visibility enforcement via RLS

5. Dashboard & Path Management

- ✅ User dashboard at /dashboard
- ✅ Generation counter showing remaining paths
- ✅ Three-tab interface:
  - My Paths (account-owned paths)
  - Team Paths (conditional, shows for team accounts)
  - Browse Public (all public paths)
- ✅ Path cards showing metadata
- ✅ Create Path modal with form
- ✅ Path deletion functionality
- ✅ Empty states for each tab

6. Topic Selection

- ✅ Topics database seeded (data/topics_seed.json)
- ✅ TopicTypeahead component with fuzzy search
- ✅ Synonym matching via database function
- ✅ /api/topics endpoint with search + category filter

7. Stripe Integration & Payments

- ✅ Stripe config updated with correct tiers:
  - Pro: $12/mo or $100/year
  - Team: $10/seat/mo or $80/seat/year (min 2 seats)
- ✅ Pricing page with:
  - Monthly/yearly toggle
  - Team seat selector (min 2)
  - Plan cards showing features
- ✅ /api/stripe/create-checkout with seat count support
- ✅ Stripe webhook handler (/api/webhook/stripe):
  - checkout.session.completed → activate subscription
  - invoice.paid → reset generation counter on renewal
  - customer.subscription.updated → update seat count
  - customer.subscription.deleted → downgrade to free
- ✅ Customer portal access via ButtonAccount

8. API Routes

- ✅ /api/auth/callback - OAuth callback handler
- ✅ /api/paths - List paths (with view mode filter)
- ✅ /api/paths/generate - Generate new path
- ✅ /api/paths/[id] - Get/update/delete specific path
- ✅ /api/topics - Search topics
- ✅ /api/models - List available AI models by tier
- ✅ /api/stripe/create-checkout - Create subscription
- ✅ /api/stripe/create-portal - Customer portal
- ✅ /api/webhook/stripe - Stripe webhooks

9. Components Library

- ✅ PathCard - Display path in grid
- ✅ PathCreateForm - Generate new path modal
- ✅ TopicTypeahead - Search topics with autocomplete
- ✅ DashboardPaths - Main dashboard component
- ✅ ModelSelector - AI model selection dropdown
- ✅ Pricing - Pricing page component
- ✅ ButtonAccount - User account dropdown
- ✅ ButtonCheckout - Stripe checkout button

---
❌ NOT DONE - Blocking MVP Launch

Critical (Must-Have Before Launch):

1. Landing Page ⚠️ (~2-3 hours)
  - Currently shows default ShipFast placeholder at / (app/page.tsx)
  - Needs:
    - Hero section with value proposition
    - Feature highlights (AI-powered, curated resources, etc.)
    - Social proof / testimonials (optional for MVP)
    - Pricing preview with CTA
    - Sample path preview (optional)
    - Footer with legal links
2. Terms of Service ⚠️ (~30-60 minutes)
  - Page exists at /tos but has placeholder content
  - Needs real legal terms adapted to ViaProto
  - Can use ShipFast template as starting point
3. Privacy Policy ⚠️ (~30-60 minutes)
  - Page exists at /privacy-policy but has placeholder content
  - Needs real privacy policy adapted to ViaProto
  - Must cover: data collection, Stripe, Supabase, OpenRouter, cookies
4. App Branding Update ⚠️ (~15-30 minutes)
  - config.ts still says "ShipFast" in:
    - appName
    - appDescription
    - domainName
  - Update to ViaProto branding
  - Check for other ShipFast references in codebase
5. End-to-End Testing ⚠️ (~1 hour)
  - Manual test flows:
    - New user signup → create personal account
    - Generate path as free user (verify 1 path limit)
    - View generated path
    - Upgrade to Pro → verify subscription activation
    - Generate additional paths (verify 5 path limit)
    - Test team checkout with seat selection
  - Verify Stripe webhooks in test mode

---
📋 IMPORTANT - Nice-to-Have for Better Launch

These improve UX but aren't blocking:

6. Topic Improvements (~1-2 hours)
  - Current: Generic topics like "Python", "React"
  - Better: Specific learning goals:
    - "Automating things with Python"
    - "Building web applications with Python"
    - "Building APIs with Python"
    - "Analyzing data with Python"
  - Implementation: Use AI to expand data/topics_seed.json
  - Improves path quality and reduces ambiguity
7. Browse Topics by Category UI (~2-3 hours)
  - Currently: Only typeahead search available
  - Add: Category browsing interface
    - Category grid/cards on dashboard or /browse page
    - Categories: Programming, Design, Business, Data Science, Marketing, etc.
    - Click category → filtered topic list
    - Helps discovery when users don't know what to search for
  - API already supports category filtering
8. Initial Teams UI (~3-4 hours)
  - Current state:
    - Team accounts can be purchased via Stripe ✅
    - Team data model fully implemented ✅
    - Dashboard shows "Team Paths" tab for team accounts ✅
  - Missing:
    - Team creation/invitation flow
    - Team member management interface
    - Invite members via email
    - Remove team members
    - Role management (owner/admin/member)
  - Note: Users can still buy team plans and benefit from higher rate limits; they just can't invite members yet
9. Link Preview Generation (~2-3 hours)
  - Fetch OpenGraph metadata for resources
  - Cache og:image, og:title, og:description and other relevant OpenGraph tags in resources table
  - Display preview images in resource cards
  - Helps catch broken links (404s fail preview fetch)
  - Improves visual appeal of path display
10. Path Social Sharing (~1-2 hours)
  - Add OpenGraph meta tags to /paths/[id]
  - Generate dynamic OG images (optional - can use static for MVP)
  - Twitter card metadata
  - Improves SEO and social sharing

---
🚀 POST-MVP - Phase 2 Features

Week 2: Progress Tracking

- Database: progress table schema needed
- UI needed:
- Checkboxes on resources to mark complete
- Progress percentage bars (section + overall)
- "Last studied" timestamps
- Personal notes per resource (markdown)
- Estimated: ~4-6 hours

Week 2-3: Complete Teams UI

- Building on item #8 above
- Add:
  - Team admin dashboard with member progress
  - Required path assignments
  - Email notifications for assignments
  - Team learning goals/milestones
- Estimated: ~6-8 hours

Week 3-4: Path Editing & Management

- Path title/description editing
- Regenerate specific section (if resources outdated/broken)
- Duplicate path
- Archive path (soft delete)
- Export to PDF/Markdown
- Estimated: ~6-8 hours

Month 2-3: Advanced Features

- Team analytics dashboard
- Path templates (curated, pre-generated by admins)
- Automated link validation (background job)
- Community resource flagging
- Advanced search/filtering
- Path sharing via unique URL
- Embed paths (iframe)

---
⏱️ Time Estimates to MVP Launch

Critical (Blocking):
- Landing page: 2-3 hours
- Terms of Service: 30-60 minutes
- Privacy Policy: 30-60 minutes
- Branding updates: 15-30 minutes
- End-to-end testing: 1 hour

Subtotal: 4.5-6 hours of focused work

Important (Nice-to-Have):
- Topic improvements: 1-2 hours
- Browse by category: 2-3 hours
- Initial teams UI: 3-4 hours
- Link previews: 2-3 hours
- Social sharing: 1-2 hours

Subtotal: 9-14 hours additional

Total for polished launch: 13.5-20 hours (~2-3 days)

---
📝 Known Issues / Technical Debt

1. Rate Limit Tracking: Currently counts paths created this calendar month, not billing cycle
  - Should reset on cycle_start_date + 1 month
  - Currently resets on first day of calendar month
  - Medium priority fix
2. Free plan public paths: We warn but still create private by default
  - Paths made by free accounts should be public by default (paid default to private)
  - We removed the checkbox and now warn on free creation the plan will be public, but the plan is still automatically private
  - Medium priority fix
3. Team Account Creation: No UI flow for creating team accounts
  - Users must upgrade personal account to team via Stripe
  - Should add dedicated "Create Team" flow
  - Low priority (post-MVP)
4. Public Path Browse: Works but has no filtering/sorting UI
  - Can only view in dashboard "Browse Public" tab
  - Should add dedicated /browse or /explore page
  - Low priority (covered by item #7 above)
5. Error Handling: Some API endpoints could have better error messages
  - Works functionally but could be more user-friendly
  - Low priority polish

---
🎯 Recommended Launch Strategy

Option A: Fast Launch (1 day)

- Complete only "Critical" items above
- Launch with basic landing page, legal pages, branding
- Get first users and validate core value prop
- Add "Important" items in Week 2 based on feedback

Option B: Polished Launch (2-3 days)

- Complete "Critical" + "Important" items
- Launch with browse-by-category, improved topics, link previews
- Better first impression, more discovery options
- Still saves teams UI for post-launch based on demand

Option C: Feature-Complete Launch (3-4 days)

- Complete all items including teams UI
- Launch with full feature set from PRD
- Maximizes retention from early users
- Risk: longer time to validation

---
📊 Feature Completeness vs PRD

| Feature Category     | Status | MVP Required?                |
|----------------------|--------|------------------------------|
| Authentication       | 100% ✅ | Yes                          |
| Path Generation      | 100% ✅ | Yes                          |
| Path Display         | 100% ✅ | Yes                          |
| Topic Selection      | 90% ✅  | Yes (browse UI nice-to-have) |
| Rate Limiting        | 100% ✅ | Yes                          |
| Stripe Payments      | 100% ✅ | Yes                          |
| Public/Private Paths | 100% ✅ | Yes                          |
| Dashboard            | 100% ✅ | Yes                          |
| Landing Page         | 0% ❌   | Yes                          |
| Legal Pages          | 20% ⚠️ | Yes                          |
| Teams Data Model     | 100% ✅ | Yes                          |
| Teams UI             | 20% ⚠️ | No (can be post-MVP)         |
| Progress Tracking    | 0% ❌   | No (explicitly post-MVP)     |
| Link Validation      | 0% ❌   | No (nice-to-have)            |
| Social Sharing       | 0% ❌   | No (nice-to-have)            |

Overall MVP Completeness: ~85% (critical features done, polish remaining)

Note that the current level of progress is as of morning of day 2 (85% of requirements were completed in day 1) so at minimum we will go with Polished Launch but likely we can get done some or all of Feature-Complete Launch as well.

Planning documents to search/reference:
- PRD.md
- IMPLEMENTATION_PLAN.md
