# README Generation Prompt for ViaProto

Use this prompt in your next session with Claude Code to generate a comprehensive README.md based on the **actual current state** of the application:

---

**Prompt:**

Please generate a comprehensive README.md for the ViaProto project by investigating the actual codebase. **Do not rely on planning documents** (PRD, IMPLEMENTATION_PLAN, etc.) as they may be outdated. Instead, discover what the application actually does by examining the code.

## Phase 1: Investigation (Do This First)

### 1. Explore Project Structure
Use the `Glob` tool to understand the project layout:
- `Glob pattern="app/**/page.tsx"` - Find all pages
- `Glob pattern="app/api/**/route.ts"` - Find all API endpoints
- `Glob pattern="components/**/*.tsx"` - Find all components
- `Glob pattern="libs/**/*.ts"` - Find utility libraries
- `Glob pattern="supabase/migrations/*.sql"` - Find database migrations

### 2. Understand Core Configuration
Read these files to understand the tech stack and setup:
- `package.json` - Actual dependencies and versions
- `config.ts` - App configuration (pricing, features, settings)
- `next.config.js` or `next.config.mjs` - Next.js configuration
- `postcss.config.js` - PostCSS/Tailwind setup
- `tsconfig.json` - TypeScript configuration
- `.env.example` (if it exists) - Required environment variables

### 3. Investigate Database Schema
Read ALL migration files in `supabase/migrations/` to understand:
- What tables exist (learning_paths, resources, accounts, etc.)
- What columns each table has
- What relationships exist
- What RLS policies are in place
- Any recent schema changes

### 4. Map Out Features by Exploring Pages
For each page found in step 1, read the file and understand:
- `app/page.tsx` - What does the landing page show?
- `app/dashboard/page.tsx` - What can users do on the dashboard?
- `app/explore/page.tsx` - Does this page exist? What does it do?
- `app/pricing/page.tsx` - What pricing tiers exist?
- `app/paths/[id]/page.tsx` - How are paths displayed?
- Any other pages you discover

### 5. Understand API Capabilities
For each API route found in step 1, read the file to understand:
- What endpoints exist
- What data they accept/return
- What external services they integrate with
- Authentication/authorization requirements

### 6. Investigate Key Libraries and Integrations
Read files in `libs/` directory to understand:
- How Supabase is configured (`libs/supabase/`)
- How Stripe is integrated (`libs/stripe.ts`)
- How AI models are configured (look for OpenRouter, model configs)
- Email setup (Resend or similar)
- Any other integrations

### 7. Check Component Architecture
Sample key components to understand UI patterns:
- Header/navigation components
- Path generation components
- Pricing components
- Authentication components

## Phase 2: Ask Clarifying Questions

After completing your investigation, ask the user for clarification on:

1. **Product Positioning:**
   - What is the one-line elevator pitch?
   - Who is the target audience?
   - What problem does this solve?

2. **Deployment & Infrastructure:**
   - Where is this deployed (or intended to be deployed)?
   - What's the production domain/URL?
   - Any specific deployment instructions?

3. **Development Workflow:**
   - Any special scripts or commands developers should know?
   - Any gotchas or common issues?
   - Testing strategy?

4. **License & Contribution:**
   - What license should be listed?
   - Is this open to contributions?
   - Any contributor guidelines?

5. **Missing Context:**
   - Any features you discovered in code that need explanation?
   - Any unusual patterns or architectural decisions to document?
   - Anything that would confuse a new developer?

## Phase 3: Generate README

Based on your investigation and the user's answers, generate a README.md with these sections:

### 1. Header
- Project name: "ViaProto" (or actual name from config)
- One-line description (from user)
- Key badges (build status, license, etc.)

### 2. About
- What the application actually does (based on landing page)
- Core value proposition
- Who it's for

### 3. Features
- List features you discovered by reading the code
- Highlight actual AI models in use (check model config files)
- Document actual tier differences (check Stripe config and rate limiting logic)
- Note which features are implemented vs mentioned but not built

### 4. Tech Stack
List the **actual** versions from package.json:
- Framework: Next.js X.X
- React version
- TypeScript version
- Styling libraries
- Database and auth
- Payment processor
- AI/LLM provider
- Email service
- Any other significant dependencies

### 5. Getting Started

#### Prerequisites
Based on package.json engines field and actual setup:
- Node.js version
- Package manager
- Required accounts (Supabase, Stripe, etc.)

#### Installation
```bash
# Accurate clone command
git clone [actual-repo-url]
cd via-proto

# Actual install command
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your keys
```

#### Environment Variables
List **all** environment variables you found referenced in the code:
- NEXT_PUBLIC_* variables
- Private API keys
- Service URLs
- Webhook secrets
- Brief description of what each is used for

#### Database Setup
Document the **actual** steps to set up the database:
```bash
# Actual commands based on project setup
# May involve Supabase CLI, SQL scripts, etc.
```

#### Running Locally
```bash
# Actual dev command from package.json
npm run dev

# Actual port from config (default is likely 3000 or 3001)
```

### 6. Project Structure
Show the **actual** directory structure (use your Glob results):
```
via-proto/
├── app/                    # [Describe what you found]
│   ├── api/               # [List key APIs]
│   ├── dashboard/         # [Describe pages]
│   └── ...
├── components/            # [Describe component types]
├── libs/                  # [List utilities]
├── supabase/
│   └── migrations/        # Database schema
└── [other directories you found]
```

### 7. Architecture & Key Concepts

#### Learning Path Generation
Explain based on what you found in the code:
- How path generation works (API endpoints, AI calls)
- What models are actually used
- Data flow from request to stored path

#### Authentication
Based on Supabase implementation:
- How users sign up/log in
- Session management
- Protected routes

#### Database Architecture
Based on migrations you read:
- Key tables and relationships
- RLS policies
- Data ownership model

#### Payment Integration
Based on Stripe code:
- How subscriptions work
- Webhook handling
- Seat-based pricing (if implemented)

### 8. Development

#### Important Patterns
Document critical patterns you noticed:
- Next.js 15 async APIs (if used)
- Server vs Client Components
- Error handling patterns
- API route patterns

#### Common Tasks
Based on actual code:
- How to add a new page
- How to add an API endpoint
- How to modify the database schema
- How to test payments locally

### 9. Deployment

Document based on config files and deployment setup:
- Recommended platform
- Build command
- Environment variables for production
- Any CDN or asset management

### 10. Scripts

List **actual** scripts from package.json with descriptions:
```bash
npm run dev         # [What it does]
npm run build       # [What it does]
npm run lint        # [What it does]
# etc.
```

### 11. Contributing (if applicable)
- Based on user's answer about contributions
- Reference any coding standards you observed

### 12. License
- Based on user's answer

### 13. Roadmap (Optional)
- Only include if user provides specific features
- Or mention "See GitHub issues for roadmap"

### 14. Support & Contact
- Support email from config
- Any other contact methods

---

## Important Guidelines:

1. **Be Accurate:** Only document what actually exists in the code
2. **Be Specific:** Use exact versions, exact commands, exact file paths
3. **Be Honest:** If something is partially implemented or broken, note it
4. **Be Helpful:** Include gotchas, tips, and warnings you discover
5. **Be Current:** Document the state as of today, not what was planned
6. **Ask Questions:** If something in the code is unclear, ask the user to explain it

The goal is a README that a developer could use to understand and run this project **without reading planning docs**, based solely on the code that exists.
