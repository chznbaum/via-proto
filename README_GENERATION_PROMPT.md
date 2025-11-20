# README Generation Prompt for ViaProto

Use this prompt in your next session with Claude Code to generate a comprehensive README.md:

---

**Prompt:**

Please generate a comprehensive README.md for the ViaProto project. Before generating the README, review the following files to understand the current state of the application:

1. **Project Overview & Configuration:**
   - `config.ts` - App configuration, pricing tiers, and settings
   - `package.json` - Dependencies and tech stack
   - `.cursorrules` - Project overview and tech conventions
   - `CLAUDE_INSTRUCTIONS.md` - Technical patterns and architecture

2. **Key Features & Implementation:**
   - `PRD.md` - Product requirements and features
   - `IMPLEMENTATION_PLAN.md` - Technical implementation details
   - `MVP_COMPLETION_CHECKLIST.md` - Feature completion status

3. **Application Structure:**
   - `app/page.tsx` - Landing page (to understand core value proposition)
   - `app/dashboard/page.tsx` - Main dashboard functionality
   - `app/explore/page.tsx` - Public learning paths feature
   - `app/api/paths/generate/route.ts` - Path generation API
   - `libs/` directory - Core utilities and integrations

4. **Database Schema:**
   - Check `supabase/migrations/` for the current database structure

After reviewing these files, generate a README.md that includes:

## Sections to Include:

### 1. Header
- Project name and logo/banner (if available)
- Brief one-line description
- Key badges (if applicable): build status, license, etc.

### 2. About ViaProto
- What it is: AI-powered learning path generator
- Core value proposition (from landing page)
- Key differentiators

### 3. Features
- List of main features with brief descriptions
- Highlight AI models used (Claude Sonnet 4.5 for Pro, DeepSeek for Free)
- Mention tier-based features (Free, Pro, Team)

### 4. Tech Stack
- Frontend: Next.js 15.4+, React 19, TypeScript 5.9+
- Styling: Tailwind CSS 4.1+, DaisyUI 5.0+
- Backend: Supabase (database + auth), Stripe (payments)
- AI: OpenRouter (LLM routing)
- Email: Resend
- List other key dependencies from package.json

### 5. Getting Started

#### Prerequisites
- Node.js version requirement
- npm/yarn
- Supabase account
- Required API keys

#### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/via-proto.git
cd via-proto

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your keys
```

#### Environment Variables
List all required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `RESEND_API_KEY`
- etc.

#### Database Setup
```bash
# Run Supabase migrations
# Instructions for setting up the database schema
```

#### Running Locally
```bash
npm run dev
# Access at http://localhost:3001
```

### 6. Project Structure
Brief overview of key directories:
```
via-proto/
├── app/              # Next.js 15 App Router pages
├── components/       # React components
├── libs/             # Utilities and integrations
├── supabase/         # Database migrations and types
├── public/           # Static assets
└── config.ts         # App configuration
```

### 7. Key Features Explained

#### Learning Path Generation
- How the AI path generation works
- Which models are used for which tiers
- Path structure (sections, resources, skill levels)

#### Subscription Tiers
- Free: 1 path/month, DeepSeek, public paths only
- Pro: 5 paths/month, Claude Sonnet 4.5, private paths, progress tracking
- Team: 10+ paths/month (scales with seats), team collaboration

#### Public Path Browsing
- Explore page for discovering public paths
- SEO-friendly for lead generation

### 8. Development

#### Next.js 15 Patterns
- Async APIs (headers, cookies, params)
- Server Components vs Client Components
- Key patterns to follow (reference CLAUDE_INSTRUCTIONS.md)

#### Supabase Integration
- Row Level Security (RLS) policies
- Authentication flows
- Database patterns

#### Stripe Integration
- Webhook handling
- Subscription management
- Seat-based pricing for Team tier

### 9. Deployment
- Recommended platform: Vercel or self-hosted via Coolify
- Environment setup for production
- CDN configuration (if using Bunny CDN)

### 10. Contributing
- Guidelines for contributing (if accepting contributions)
- Code style and conventions
- How to submit issues or PRs

### 11. License
- Specify the license (if applicable)

### 12. Contact & Support
- Support email: chazona@viapro.to
- Links to relevant resources

### 13. Roadmap (Optional)
- Mention upcoming features from the MVP checklist:
  - Progress tracking system
  - Path editing & management
  - Advanced analytics
  - Teams collaboration features

### 14. Acknowledgments
- Credit to frameworks and tools used
- Any other acknowledgments

---

**Important Notes:**
- Keep the README concise but comprehensive
- Use clear, professional language
- Include code examples where helpful
- Make sure all file paths and commands are accurate
- Focus on what developers need to get started quickly
- Highlight the modern tech stack (Next.js 15, React 19, Tailwind v4)
