# Testing Patterns

**Analysis Date:** 2026-07-03

## Status

**No automated testing framework is configured in this codebase.** This is a production application relying on manual QA and integration testing during development. The following sections document the current state and recommendations.

## Current State

**Frameworks Installed:** None
- No Jest, Vitest, or other test runner configured
- No testing libraries (React Testing Library, Enzyme, etc.) installed
- `@types/jest` present in devDependencies but not actively used

**Test Scripts:** None
- `package.json` contains `"lint": "next lint"` but no test script
- No `test` or `test:watch` command available
- No coverage reporting configured

**Test Files:** None
- No `.test.ts`, `.spec.ts`, `.test.tsx`, or `.spec.tsx` files in `/Users/chazona/Repos/saas/via-proto/src`, `app/`, `libs/`, or `components/` directories
- Codebase is production code only

**Testing Approach:** Manual/Integration
- QA is likely performed manually in the browser during development
- API endpoints tested via Postman, curl, or similar tools
- Background job system (`Graphile Worker`) tested by running `npm run worker:dev` and observing path generation in real-time

## Recommended Testing Structure (If Implemented)

### Test Framework Setup

If testing is added to this project, the following configuration is recommended:

**Suggested Framework: Vitest** (Next.js 15 compatible, faster than Jest)
- Install: `npm install -D vitest @vitest/ui`
- Alternative: Jest with `@testing-library/react`

**Config Location:** `vitest.config.ts` at project root

### Test File Organization

**Pattern: Co-located tests** (tests next to source files)

```
libs/
├── auth.ts
├── auth.test.ts          # Unit tests for auth functions
├── api.ts
├── api.test.ts
├── validation/
│   ├── path-schema.ts
│   └── path-schema.test.ts
├── jobs/
│   ├── tasks/
│   │   ├── fetch-unsplash-image.ts
│   │   └── fetch-unsplash-image.test.ts

components/
├── paths/
│   ├── DashboardPaths.tsx
│   └── DashboardPaths.test.tsx
│   ├── PathCreateForm.tsx
│   └── PathCreateForm.test.tsx

app/
├── api/
│   ├── paths/
│   │   ├── initiate/
│   │   │   ├── route.ts
│   │   │   └── route.test.ts
```

**Naming Convention:** `[filename].test.ts` or `[filename].test.tsx`

### Test File Structure (Recommended Pattern)

Based on project style, recommended structure:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requireAuth, getUserDefaultAccount } from '@/libs/auth';
import { createClient } from '@/libs/supabase/server';

// Mock Supabase client
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Auth Module', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('should return authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
    });

    it('should throw when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No session'),
      });

      await expect(requireAuth()).rejects.toThrow();
    });
  });

  describe('getUserDefaultAccount', () => {
    it('should return account with role', async () => {
      const mockAccount = {
        id: 'acc-123',
        name: 'Test Account',
        subscription_tier: 'pro',
      };
      const mockRole = 'owner';

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { default_account_id: 'acc-123' },
          error: null,
        }),
      });
      // ... additional mocks for account fetch

      const result = await getUserDefaultAccount('user-123');
      expect(result?.account).toEqual(mockAccount);
      expect(result?.role).toBe(mockRole);
    });

    it('should return null when no account found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('No row found'),
        }),
      });

      const result = await getUserDefaultAccount('user-123');
      expect(result).toBeNull();
    });
  });
});
```

## Mocking Strategy (If Testing is Implemented)

### External APIs to Mock

**Supabase Client:**
- Mock `createClient()` to return mock client
- Mock `.select()`, `.eq()`, `.in()`, `.single()`, etc. chains
- Provide `data` and `error` in responses

**OpenRouter/OpenAI:**
- Mock the OpenAI client constructor
- Mock `chat.completions.create()` to return test responses
- Example:
```typescript
vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: '{"title":"Test"}' } }],
          }),
        },
      },
    })),
  };
});
```

**Stripe:**
- Mock `stripe.webhooks.constructEvent()` for webhook testing
- Mock subscription methods
- Example:
```typescript
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));
```

**Unsplash API:**
- Mock fetch calls to Unsplash
- Return test image URLs
- Example:
```typescript
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({
    results: [{ id: 'test-123', urls: { regular: 'https://...' } }],
  }),
});
```

### What to Mock

- **External APIs:** Supabase, OpenRouter, Stripe, Unsplash, Resend
- **File I/O:** If any file operations exist
- **Date/Time:** Use `vi.setSystemTime()` for consistent testing
- **Environment Variables:** Override via `process.env` or vi.stubEnv()

### What NOT to Mock (Unit Test in Isolation)

- **Zod Schemas:** Test validation with real schemas
- **Utility Functions:** Test without mocks (e.g., rate limit calculation)
- **Internal Dependencies:** Test integration between modules

## Test Categories (If Implemented)

### Unit Tests

**Focus:** Individual functions and utilities

**Examples:**
- `libs/auth.ts` - Auth functions with mocked Supabase
- `libs/validation/path-schema.ts` - Zod schema validation
- `config.ts` - Configuration values
- Rate limit calculations in `app/api/paths/initiate/route.ts`

**Location:** `[module].test.ts` next to source

```typescript
describe('Rate limit calculation', () => {
  it('should return 1 for free tier', () => {
    expect(getRateLimit('free', 1)).toBe(1);
  });

  it('should return 10 for pro tier', () => {
    expect(getRateLimit('pro', 1)).toBe(10);
  });

  it('should scale by seat count for team tier', () => {
    expect(getRateLimit('team', 2)).toBe(20); // Base 20
    expect(getRateLimit('team', 5)).toBe(38); // 20 + (3 × 6)
  });
});
```

### Integration Tests

**Focus:** API routes with database/external service interaction

**Examples:**
- `POST /api/paths/initiate` - Full path creation flow
- Stripe webhook handlers
- Background job task execution

**Location:** `__tests__/integration/` directory

```typescript
describe('POST /api/paths/initiate', () => {
  it('should create a path and queue generation job', async () => {
    const response = await fetch('/api/paths/initiate', {
      method: 'POST',
      body: JSON.stringify({
        topic_id: 'topic-123',
        goals: 'Learn AI basics',
      }),
    });

    expect(response.status).toBe(200);
    const { data: path } = await response.json();
    expect(path.generation_status).toBe('pending');
    expect(path.title).toContain('Learning');
  });

  it('should reject when rate limit exceeded', async () => {
    // Create max paths for tier
    // Try to create one more
    const response = await fetch('/api/paths/initiate', { ... });
    expect(response.status).toBe(429);
    expect(response.json()).toMatchObject({
      error: 'Monthly generation limit reached',
    });
  });
});
```

### Component Tests

**Focus:** React component rendering and interactions

**Examples:**
- Form submission (`PathCreateForm`)
- State management (`DashboardPaths`)
- Loading states and error displays

**Location:** `components/[name].test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardPaths } from '@/components/paths/DashboardPaths';

describe('DashboardPaths', () => {
  it('should display welcome message', () => {
    render(
      <DashboardPaths
        userId="user-123"
        accountId="acc-123"
        subscriptionTier="pro"
        // ... other props
      />
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should show create form when button clicked', async () => {
    render(<DashboardPaths {...props} />);
    const button = screen.getByText('Create Path');
    
    fireEvent.click(button);
    expect(screen.getByRole('form')).toBeVisible();
  });

  it('should display loading state while fetching paths', async () => {
    render(<DashboardPaths {...props} />);
    expect(screen.getByText('Loading paths...')).toBeInTheDocument();
  });
});
```

## Coverage Targets (If Testing is Implemented)

**Recommended Minimums:**
- **Overall:** 60%+
- **Critical Paths:** 80%+ (auth, payments, path generation)
- **API Routes:** 75%+ (especially `/api/paths/initiate`, webhooks)
- **Utility Functions:** 80%+ (auth, validation, config)
- **Components:** 50%+ (integration tested through E2E)

**Run Coverage:**
```bash
vitest run --coverage
# or
jest --coverage
```

## Error Testing Patterns (If Implemented)

### API Route Error Cases

```typescript
describe('POST /api/paths/initiate', () => {
  it('should return 401 when user not authenticated', async () => {
    // Mock unauthenticated user
    const response = await fetch('/api/paths/initiate', { ... });
    expect(response.status).toBe(401);
  });

  it('should return 400 when validation fails', async () => {
    const response = await fetch('/api/paths/initiate', {
      body: JSON.stringify({ /* invalid data */ }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it('should return 403 when user not member of account', async () => {
    // Try to create path for account user doesn't belong to
    const response = await fetch('/api/paths/initiate', {
      body: JSON.stringify({ account_id: 'other-account' }),
    });
    expect(response.status).toBe(403);
  });

  it('should return 429 when rate limit exceeded', async () => {
    // Max out user's monthly quota
    const response = await fetch('/api/paths/initiate', { ... });
    expect(response.status).toBe(429);
  });
});
```

### Function Error Cases

```typescript
describe('requireAccountAdmin', () => {
  it('should throw when user is not admin', async () => {
    mockRole = 'member';
    
    await expect(
      requireAccountAdmin('acc-123')
    ).rejects.toThrow('Unauthorized: Admin access required');
  });

  it('should throw when user not member of account', async () => {
    mockMembership = null;
    
    await expect(
      requireAccountAdmin('acc-123')
    ).rejects.toThrow('Not a member of this account');
  });
});
```

## Async Testing Patterns (If Implemented)

```typescript
describe('Async Operations', () => {
  it('should handle promises', async () => {
    const result = await asyncFunction();
    expect(result).toEqual(expected);
  });

  it('should handle async errors', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
  });

  it('should handle setTimeout-based code', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    
    setTimeout(callback, 1000);
    expect(callback).not.toHaveBeenCalled();
    
    vi.runAllTimers();
    expect(callback).toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});
```

## Manual Testing Checklist (Current Approach)

Since no automated tests exist, follow this checklist for manual QA:

### Before Committing Code

- [ ] Run `npm run lint` - no ESLint errors
- [ ] Test in browser: `npm run dev` on port 3001
- [ ] Test with worker: `npm run worker:dev` running alongside
- [ ] Test Supabase connection: Can fetch user data
- [ ] Test Stripe webhook: `stripe listen --forward-to localhost:3001/api/webhook/stripe`

### Path Generation Testing

- [ ] Start fresh path generation
- [ ] Verify job progression: `pending` → `generating_metadata` → `fetching_image` → `researching_resources` → `curating_resources` → `validating` → `completed`
- [ ] Check database records created in `learning_paths`, `sections`, `resources`
- [ ] Verify Unsplash image fetched and attached
- [ ] Test rate limiting: Generate max paths for tier, verify 429 on overage

### Auth & Payments Testing

- [ ] Google OAuth login flow
- [ ] Email/password signup
- [ ] Account creation (personal by default)
- [ ] Stripe checkout flow (use test cards)
- [ ] Subscription status updates
- [ ] Team account creation and seat assignment

### API Testing

Use Postman or curl to test:
```bash
# Initiate path generation
curl -X POST http://localhost:3001/api/paths/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic_id":"topic-uuid","goals":"Learn AI"}'

# Check path status
curl http://localhost:3001/api/paths/{pathId}/status

# Get path details
curl http://localhost:3001/api/paths/{pathId}
```

## Linting & Static Analysis

**ESLint Rules:**
- `no-unused-vars: warn` - Variables not used trigger warnings
- `next/core-web-vitals` - Next.js best practices enforced
- `eslint:recommended` - Base ESLint rules

**Run Lint:**
```bash
npm run lint
```

**Fix Auto-Fixable Issues:**
```bash
npm run lint -- --fix
```

---

*Testing analysis: 2026-07-03*

**Note:** This codebase currently relies on manual testing and integration testing in development. If automated testing is added, use the patterns and recommendations above to structure tests following the project's existing conventions.
