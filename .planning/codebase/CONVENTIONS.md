# Coding Conventions

**Analysis Date:** 2026-07-03

## Naming Patterns

**Files:**
- kebab-case for all files (e.g., `button-lead.tsx`, `path-schema.ts`, `fetch-unsplash-image.ts`)
- No spaces or underscores in filenames

**Components:**
- PascalCase (e.g., `DashboardPaths`, `ButtonLead`, `GeneratingPathCard`, `PathCreateForm`)
- File name matches component export name (e.g., `DashboardPaths.tsx` exports `DashboardPaths`)

**Functions:**
- camelCase (e.g., `requireAuth()`, `getUserAccounts()`, `canEditPath()`, `getAccountWithRole()`)
- Async functions follow the same camelCase rule (e.g., `fetchPaths()`, `handleSubmit()`)

**Variables:**
- camelCase (e.g., `userId`, `pathsThisMonth`, `accountId`, `subscriptionTier`)
- Boolean prefixes with `is`, `can`, `has` (e.g., `isLoading`, `canGenerate`, `hasAccess`)
- Constants in UPPER_CASE (e.g., `UPPER_SNAKE_CASE` - though few constants found)

**Types & Interfaces:**
- PascalCase (e.g., `AccountWithRole`, `DashboardPathsProps`, `GeneratingPath`, `PathGenerationRequest`)
- Prefer `interface` over `type` for object shapes
- Type-only imports use `import type { }` (e.g., `import type { ResearchResourcesPayload, TaskWithResult } from '../types'`)

**Enums & Unions:**
- camelCase for enum values (e.g., `subscription_tier: "free" | "pro" | "team"`)
- String literal unions preferred over enums (e.g., `"required" | "recommended" | "optional"`)

## Code Style

**Formatting:**
- No Prettier config found in repo root
- Default Next.js/ESLint formatting conventions applied
- 2-space indentation (standard for TypeScript)
- Single quotes in JavaScript, double quotes in JSX attributes

**Linting:**
- ESLint: `eslint:recommended` and `next/core-web-vitals` extensions
- Config: `.eslintrc.json` at project root
- Run: `npm run lint` - uses `next lint`
- Rules: `no-unused-vars: warn` (warnings only, not errors)

**TypeScript Configuration:**
- Location: `tsconfig.json` at project root
- `strict: false` but `noImplicitAny: true` and `strictNullChecks: true` enabled
- Module resolution: `node`, path alias `@/*` for root imports
- ES2017 target
- See `/Users/chazona/Repos/saas/via-proto/tsconfig.json` for full config

## Import Organization

**Standard Order:**
1. React/Next.js imports (e.g., `import React from 'react'`, `import { useState } from 'react'`)
2. Next.js framework imports (e.g., `import { redirect } from 'next/navigation'`)
3. Third-party library imports (e.g., `import axios from 'axios'`, `import { toast } from 'react-hot-toast'`)
4. Internal component imports (e.g., `import DashboardPaths from '@/components/paths/DashboardPaths'`)
5. Internal utility/lib imports (e.g., `import { requireAuth } from '@/libs/auth'`, `import apiClient from '@/libs/api'`)
6. Type/interface imports (e.g., `import type { User } from '@supabase/supabase-js'`)
7. Relative imports (if necessary) - avoid when using `@/` alias

**Path Aliases:**
- `@/*` points to project root (`/Users/chazona/Repos/saas/via-proto/`)
- Always use `@/` prefix for internal imports, never relative paths like `../../`

**Example Import Block:**
```typescript
import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { toast } from 'react-hot-toast';
import DashboardPaths from '@/components/paths/DashboardPaths';
import { requireAuth, getUserDefaultAccount } from '@/libs/auth';
import { createClient } from '@/libs/supabase/server';
import config from '@/config';
```

## Error Handling

**API Routes (Server):**
- Wrap logic in `try/catch` block
- Catch errors and return `NextResponse.json({ error: message }, { status: code })`
- Log errors to console: `console.error('Error description:', error)`
- Return appropriate HTTP status codes (400, 401, 403, 404, 429, 500)
- Handle Zod validation errors specifically: `if (error instanceof ZodError)` → 400
- Example from `/Users/chazona/Repos/saas/via-proto/app/api/paths/initiate/route.ts:19-100`

```typescript
export async function POST(req: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Utility Functions (libs/):**
- Throw `Error` with descriptive message for caller to handle
- Example from `libs/auth.ts:214`: `throw new Error("Not a member of this account")`
- Log debug info to console.error only on actual errors
- Return `null` or empty arrays on non-critical failures (don't throw)

```typescript
export async function getAccountWithRole(userId: string, accountId: string) {
  // ... logic
  if (error || !account) {
    throw new Error("Account not found");
  }
  return { account, role };
}
```

**Client Components:**
- Wrap async operations in `try/finally` to manage loading state
- Use `toast.error()` for user-facing error messages
- Log errors: `console.log(error)` for debugging
- Example from `components/ButtonLead.tsx:17-34`

```typescript
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e?.preventDefault();
  setIsLoading(true);
  try {
    await apiClient.post("/lead", { email });
    toast.success("Thanks for joining!");
    setEmail("");
  } catch (error) {
    console.log(error);
  } finally {
    setIsLoading(false);
  }
};
```

**Background Jobs (libs/jobs/tasks/):**
- Wrap in `try/catch`
- Log job start/completion: `console.log(\`[job_name] Starting for path ${pathId}\`)`
- Throw Error on failure (worker will retry up to 3 times)
- Check for cancellation early: `if (pathCheck?.generation_status === 'cancelled')`
- Example from `libs/jobs/tasks/fetch-unsplash-image.ts`

## Logging

**Framework:** Native `console` object (no dedicated logger library)

**Patterns:**
- Debug info: `console.log('message')`
- Errors: `console.error('Error description:', errorObject)`
- Job progress: `console.log(\`[job_name] Step description for pathId\`)`
- Always include context (path ID, user ID, etc.) for traceability

**Example:**
```typescript
console.log(`[fetch_unsplash_image] Starting for path ${pathId}`);
console.error("Error checking rate limit:", countError);
console.error("Error fetching accounts:", accountsError);
```

## Comments & Documentation

**JSDoc/TSDoc:**
- Required for exported functions and types
- Include `@param`, `@returns`, `@example`, `@throws` sections
- Format parameters with type and description
- Example from `libs/auth.ts:42-50`:

```typescript
/**
 * Require authentication. Redirects to login page if user is not authenticated.
 *
 * @returns Authenticated user object
 *
 * @example
 * ```typescript
 * // In a server component or API route
 * const user = await requireAuth();
 * ```
 */
export async function requireAuth(): Promise<User> { ... }
```

**Inline Comments:**
- Use `//` for single-line comments explaining "why", not "what"
- Use `/* */` only for multi-line comments (rare)
- Example from `app/api/paths/initiate/route.ts:37-39`:
```typescript
// User specified an account - verify they're a member
try {
  const accountWithRole = await getAccountWithRole(user.id, validatedInput.account_id);
```

**Comment Discipline:**
- Comment non-obvious logic and decisions
- Don't comment trivial code (good naming should explain)
- Update comments when code changes

## Function Design

**Size:** 
- Aim for ~30-50 lines per function
- Break complex logic into smaller helper functions
- Example: `fetchPaths()` in `/Users/chazona/Repos/saas/via-proto/components/paths/DashboardPaths.tsx` is ~50 lines

**Parameters:**
- Max 3-4 parameters per function
- Use object parameter for multiple related values:
```typescript
// Bad
function getAccount(userId, accountId, includeMetadata) { ... }

// Good
interface GetAccountOptions {
  userId: string;
  accountId: string;
  includeMetadata?: boolean;
}
function getAccount(options: GetAccountOptions) { ... }
```

**Return Values:**
- Use `Promise<T>` for async functions
- Return unions for multiple possible outcomes: `AccountWithRole | null`
- Use `Promise<{ success: true; data: T } | { success: false; error: string }>` for operation results
- Prefer nullable returns over throwing for common failure cases

## Validation

**Zod Schemas:**
- All API input validated with Zod schemas
- Schemas defined in `libs/validation/` with descriptive names
- Example: `PathGenerationRequestSchema`, `ResourceSchema`, `MetadataResponseSchema`
- Type exports via `z.infer<typeof Schema>` (e.g., `type PathGenerationRequest = z.infer<typeof PathGenerationRequestSchema>`)
- See `/Users/chazona/Repos/saas/via-proto/libs/validation/path-schema.ts` for full patterns

```typescript
// Define schema
const PathGenerationRequestSchema = z.object({
  topic_id: z.string().uuid(),
  goals: z.string().max(2000).optional(),
  is_public: z.boolean().optional().default(false),
});

// Use in API
const validatedInput = PathGenerationRequestSchema.parse(body);

// Export type
export type PathGenerationRequest = z.infer<typeof PathGenerationRequestSchema>;
```

## Async/Await (Next.js 15 Specific)

**Server Functions & API Routes:**
- Always `await` dynamic route params: `const { id } = await params;`
- Always `await` headers/cookies: `const headersList = await headers();`
- Always `await` Supabase client creation: `const supabase = await createClient();`
- Example from `app/(dashboard)/dashboard/page.tsx:16-18`:

```typescript
export default async function DashboardPage() {
  const user = await requireAuth();
  const defaultAccount = await getUserDefaultAccount(user.id);
  const supabase = await createClient();
  // ...
}
```

**Client Components:**
- Callbacks marked `async`: `const handleSubmit = async (e: React.FormEvent) => { ... }`
- Use `useEffect` with `.catch()` or `.then()` for async work
- Example from `components/paths/DashboardPaths.tsx:93-99`

## Type Assertions

**Minimalist Approach:**
- Avoid type assertions (`as`) when possible
- Use only when the TypeScript compiler can't infer safely
- Example from `libs/auth.ts:174`:
```typescript
return {
  account: account as AccountWithRole["account"],  // Necessary when type inference fails
  role: membership.role as "owner" | "admin" | "member",
};
```

## Module Exports

**Named Exports Preferred:**
- Use named exports for functions: `export function requireAuth() { ... }`
- Use named exports for types: `export interface AccountWithRole { ... }`
- Default export for components: `export default function DashboardPage() { ... }`
- Example: `libs/auth.ts` exports multiple auth functions by name

**Barrel Files:**
- Not heavily used in this codebase
- `types/index.ts` re-exports from `types/config.ts`
- Keep barrel files minimal, prefer direct imports

## Configuration

**Environment Variables:**
- Public vars prefixed with `NEXT_PUBLIC_`
- Used via `process.env.VARIABLE_NAME`
- Example: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.OPENROUTER_API_KEY`

**Config File:**
- `config.ts` at root stores application configuration
- Imports from `types/config.ts` for type definitions
- Accessed via: `import config from "@/config"`
- Contains: app name, domain, Stripe plans, auth URLs, etc.

## Real-World Code Examples

**Function with JSDoc & Error Handling:**
```typescript
/**
 * Get a specific account with the user's role in that account.
 * Throws an error if the user is not a member of the account.
 *
 * @param userId - The user's ID
 * @param accountId - The account ID to fetch
 * @returns Account with role information
 * @throws Error if user is not a member of the account
 */
export async function getAccountWithRole(
  userId: string,
  accountId: string
): Promise<AccountWithRole> {
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("account_users")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .single();

  if (membershipError || !membership) {
    throw new Error("Not a member of this account");
  }
  // ... more logic
}
```

**API Route with Validation:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedInput = PathGenerationRequestSchema.parse(body);
    
    // ... process validatedInput
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

*Convention analysis: 2026-07-03*
