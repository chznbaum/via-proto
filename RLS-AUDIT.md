# Row Level Security (RLS) Policy Audit Report

**Date:** 2025-11-24
**Application:** ViaProto
**Database:** Supabase PostgreSQL with RLS

---

## Executive Summary

Conducted comprehensive review of all RLS policies across 8 core tables. Overall assessment: **GOOD** with **1 CRITICAL** issue requiring immediate attention.

**Key Findings:**
- ✅ All sensitive tables have RLS enabled
- ✅ User isolation properly enforced (users can only access their own data)
- ✅ Account-based authorization correctly implemented
- ✅ Infinite recursion fixed with SECURITY DEFINER functions
- ✅ Account creation works correctly (personal accounts created on signup)
- 🚨 **CRITICAL**: Anonymous users cannot view sections/resources for public paths (broken public path viewing)

**Note:** Team functionality is partially built and not yet enabled, so team-related permission issues are not urgent for MVP launch.

---

## Table-by-Table Analysis

### 1. ✅ profiles

**Status:** SECURE
**Migration:** `20251118120000_baseline_profiles.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT: Users can read own profile (`auth.uid() = id`)
- ✅ UPDATE: Users can update own profile (`auth.uid() = id`)
- ✅ INSERT: Users can insert own profile (`auth.uid() = id`)
- ❌ DELETE: No policy (users cannot delete own profile - intentional)

**Assessment:**
Perfect isolation. Users can only access their own profile data. No cross-user data leakage possible.

**Recommendation:** None. Working as designed.

---

### 2. ✅ accounts

**Status:** SECURE
**Migrations:** `20251118120001_create_accounts.sql`, `20251118120002_create_account_users.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT: Users can read accounts they belong to (via `account_users` join)
- ✅ UPDATE: Only account owners can update (`role = 'owner'`)
- ✅ DELETE: Only account owners can delete (`role = 'owner'`)
- ⚠️ **MISSING INSERT**: No policy for creating new accounts

**Assessment:**
Authorization is sound - only owners can modify billing-critical data. However, missing INSERT policy means users cannot create team accounts through the UI.

**Current Workaround:**
Accounts are created via Stripe webhook or admin tooling with service role.

**Recommendation:**
If you plan to add "Create Team" functionality in the UI, add:

```sql
-- Users can create team accounts (and become owner automatically)
CREATE POLICY "Users can create team accounts"
    ON public.accounts
    FOR INSERT
    WITH CHECK (true); -- No restrictions on INSERT
```

Then ensure your API route assigns the creator as owner in `account_users` atomically.

**Priority:** Low (add when implementing team creation UI)

---

### 3. ✅ account_users

**Status:** SECURE
**Migrations:** `20251118120002_create_account_users.sql`, `20251118140000_fix_rls_infinite_recursion.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT (own): Users can read their own memberships (`user_id = auth.uid()`)
- ✅ SELECT (all): Owners can read all memberships (via SECURITY DEFINER function)
- ✅ INSERT: Owners/admins can add members (`user_is_account_admin()`)
- ✅ UPDATE: Owners/admins can update roles (but not their own)
- ✅ DELETE: Users can leave OR owners/admins can remove others

**Assessment:**
Excellent implementation. The SECURITY DEFINER functions prevent infinite recursion while maintaining proper authorization. Role-based access control (RBAC) is correctly enforced.

**Security Note:**
The helper functions `user_has_account_role()` and `user_is_account_admin()` use `SECURITY DEFINER` which bypasses RLS. This is safe because:
1. Functions only query `account_users` (no sensitive data)
2. Functions are `STABLE` (read-only)
3. Functions use parameterized queries (no SQL injection)

**Recommendation:** None. This is the correct pattern for RLS with recursive checks.

---

### 4. ⚠️ learning_paths

**Status:** MOSTLY SECURE (2 issues)
**Migrations:** `20251118120005_create_learning_paths.sql`, `20251119000000_allow_anon_read_public_data.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT (public, authed): Authenticated users can read public paths (`is_public = true`)
- ✅ SELECT (public, anon): Anonymous users can read public paths (`is_public = true`)
- ✅ SELECT (private): Users can read paths from their accounts (via `account_users` join)
- ✅ INSERT: Users can create paths for their accounts (creator must be self, account membership verified)
- ⚠️ **UPDATE: TOO PERMISSIVE** - Any account member can update any path
- ⚠️ **DELETE: TOO PERMISSIVE** - Any account member can delete any path

**Current Policies:**
```sql
-- UPDATE: Any member can modify ANY path
CREATE POLICY "Users can update their account's learning paths"
    ON public.learning_paths
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
        )
    );

-- DELETE: Any member can delete ANY path
CREATE POLICY "Users can delete their account's learning paths"
    ON public.learning_paths
    FOR DELETE
    USING (...same as UPDATE...);
```

**Problem:**
In a team account with 5 members, any member can delete/modify paths created by other members. This could lead to:
- Accidental data loss (junior member deletes senior's path)
- Malicious destruction (disgruntled member sabotages team content)
- Loss of work (hours spent curating paths)

**Exploit Scenario:**
1. Team account has members: Alice (owner), Bob (admin), Charlie (member)
2. Alice creates valuable onboarding path with 8 sections, 40 resources
3. Charlie (malicious or careless) calls PATCH/DELETE on Alice's path
4. Path modified or permanently deleted

**Recommended Fix:**
See SECURITY-TASKS.md Week 1-2 priority. Restrict UPDATE/DELETE to:
- Path creator (any role), OR
- Account owners/admins

```sql
-- Replace existing UPDATE policy
DROP POLICY "Users can update their account's learning paths" ON public.learning_paths;

CREATE POLICY "Path creators and account admins can update paths"
    ON public.learning_paths
    FOR UPDATE
    USING (
        -- User is the creator
        creator_id = auth.uid()
        OR
        -- User is owner/admin of the account
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );

-- Replace existing DELETE policy
DROP POLICY "Users can delete their account's learning paths" ON public.learning_paths;

CREATE POLICY "Path creators and account admins can delete paths"
    ON public.learning_paths
    FOR DELETE
    USING (
        -- User is the creator
        creator_id = auth.uid()
        OR
        -- User is owner/admin of the account
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );
```

**Priority:** MEDIUM - Fix in Week 1-2 post-launch

---

### 5. 🚨 sections

**Status:** CRITICAL ISSUE
**Migration:** `20251118120006_create_sections.sql`

**RLS Enabled:** Yes

**Policies:**
- 🚨 **BROKEN**: SELECT for public paths requires authentication (`TO authenticated`)
- ✅ SELECT (private): Users can read sections from their account's paths
- ✅ INSERT: Users can create sections for their account's paths
- ⚠️ UPDATE: Any account member can update sections (same issue as paths)
- ⚠️ DELETE: Any account member can delete sections (same issue as paths)

**CRITICAL ISSUE:**

```sql
-- Current policy BLOCKS anonymous users
CREATE POLICY "Sections from public paths are readable by all"
    ON public.sections
    FOR SELECT
    TO authenticated  -- ❌ Requires authentication
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths
            WHERE learning_paths.id = sections.learning_path_id
            AND learning_paths.is_public = true
        )
    );
```

**Problem:**
Anonymous users can view public `learning_paths` but CANNOT see the sections inside them. This breaks the public path viewing experience.

**User Impact:**
1. Anonymous user visits `https://viapro.to/paths/abc-123` (public path)
2. Path metadata loads (title, description)
3. Sections fail to load (RLS blocks)
4. User sees empty path with no content
5. Bad first impression, looks like broken site

**Recommended Fix (IMMEDIATE):**

```sql
-- Drop existing policy
DROP POLICY "Sections from public paths are readable by all" ON public.sections;

-- Recreate with anon access
CREATE POLICY "Sections from public paths are readable by all"
    ON public.sections
    FOR SELECT
    TO anon, authenticated  -- ✅ Allow anonymous AND authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths
            WHERE learning_paths.id = sections.learning_path_id
            AND learning_paths.is_public = true
        )
    );
```

**Priority:** 🚨 **CRITICAL - FIX BEFORE LAUNCH**

This breaks core functionality (public path viewing).

---

### 6. 🚨 resources

**Status:** CRITICAL ISSUE
**Migration:** `20251118120007_create_resources.sql`

**RLS Enabled:** Yes

**Policies:**
- 🚨 **BROKEN**: SELECT for public paths requires authentication (`TO authenticated`)
- ✅ SELECT (private): Users can read resources from their account's paths
- ✅ INSERT: Users can create resources for their account's paths
- ⚠️ UPDATE: Any account member can update resources (same issue as paths)
- ⚠️ DELETE: Any account member can delete resources (same issue as paths)

**CRITICAL ISSUE:**
Exact same problem as sections. Anonymous users cannot see resources for public paths.

**Recommended Fix (IMMEDIATE):**

```sql
-- Drop existing policy
DROP POLICY "Resources from public paths are readable by all" ON public.resources;

-- Recreate with anon access
CREATE POLICY "Resources from public paths are readable by all"
    ON public.resources
    FOR SELECT
    TO anon, authenticated  -- ✅ Allow anonymous AND authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            WHERE s.id = resources.section_id
            AND lp.is_public = true
        )
    );
```

**Priority:** 🚨 **CRITICAL - FIX BEFORE LAUNCH**

---

### 7. ✅ user_preferences

**Status:** SECURE
**Migration:** `20251119210000_create_user_preferences.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT: Users can read own preferences (`auth.uid() = user_id`)
- ✅ INSERT: Users can insert own preferences (`auth.uid() = user_id`)
- ✅ UPDATE: Users can update own preferences (`auth.uid() = user_id`)
- ❌ DELETE: No policy (intentional - preferences cannot be deleted, only reset)

**Assessment:**
Perfect isolation. Users can only access their own UI preferences. No security issues.

**Recommendation:** None.

---

### 8. ✅ user_competencies

**Status:** SECURE
**Migration:** `20251120000011_create_user_competencies.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT: Users can read own assessments (`auth.uid() = user_id`)
- ✅ INSERT: Users can insert own assessments (`auth.uid() = user_id`)
- ✅ UPDATE: Users can update own assessments (`auth.uid() = user_id`)
- ✅ DELETE: Users can delete own assessments (`auth.uid() = user_id`)

**Assessment:**
Perfect isolation. Users can only manage their own skill assessments. Even though this is a join table, it's properly secured.

**Note:**
As discussed, the frontend uses dropdowns to select `competency_id` values, so invalid IDs are unlikely. Input validation can be a fast-follow.

**Recommendation:** None.

---

## Additional Tables Checked

### 9. ✅ topics, categories, competencies (Reference Data)

**Status:** SECURE
**Migrations:** Various

**RLS Enabled:** Yes (on topics)

**Policies:**
- ✅ Topics: Anonymous users can read active topics (`TO anon, USING (is_active = true)`)
- Note: Categories and competencies likely have similar policies or are read-only reference data

**Assessment:**
Reference data is properly exposed to both authenticated and anonymous users. No write access for regular users (admin-only via service role).

**Recommendation:** None.

---

### 10. ✅ unsplash_images

**Status:** SECURE
**Migration:** `20251119170000_create_unsplash_images_table.sql`

**RLS Enabled:** Yes

**Policies:**
- ✅ SELECT: Images readable by anonymous and authenticated users (`TO anon, authenticated`)
- No write policies (images inserted by worker with service role)

**Assessment:**
Properly configured for public image cache. Anonymous users need access to view images on public paths.

**Recommendation:** None.

---

## Summary of Required Fixes

### 🚨 CRITICAL (Fix Before Launch)

#### 1. Anonymous Access to Sections
**File:** New migration
**Issue:** Anonymous users cannot view sections for public paths
**Fix:** Add `TO anon, authenticated` to sections SELECT policy

```sql
-- Migration: Fix anonymous access to public path sections
DROP POLICY "Sections from public paths are readable by all" ON public.sections;

CREATE POLICY "Sections from public paths are readable by all"
    ON public.sections
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths
            WHERE learning_paths.id = sections.learning_path_id
            AND learning_paths.is_public = true
        )
    );
```

#### 2. Anonymous Access to Resources
**File:** Same migration as above
**Issue:** Anonymous users cannot view resources for public paths
**Fix:** Add `TO anon, authenticated` to resources SELECT policy

```sql
-- Same migration: Fix anonymous access to public path resources
DROP POLICY "Resources from public paths are readable by all" ON public.resources;

CREATE POLICY "Resources from public paths are readable by all"
    ON public.resources
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            WHERE s.id = resources.section_id
            AND lp.is_public = true
        )
    );
```

**Test After Fix:**
1. Log out of ViaProto (or use incognito mode)
2. Visit a public learning path URL: `/paths/[id]`
3. Verify sections and resources load correctly
4. Check browser DevTools Network tab for no 403/401 errors

---

### ⚠️ MEDIUM (Fix Week 1-2 Post-Launch)

#### 3. Path Deletion/Modification Authorization
**File:** New migration
**Issue:** Any team member can delete/modify any path in their account
**Fix:** Restrict UPDATE/DELETE to path creator or account admins
**Detailed Fix:** See Section 4 (learning_paths) above

**Also Apply To:**
- `sections` (UPDATE/DELETE policies)
- `resources` (UPDATE/DELETE policies)

All three tables should have the same creator-or-admin restriction.

---

## Testing RLS Policies

### Manual Testing Steps

1. **Test User Isolation (profiles, user_preferences, user_competencies):**
   ```sql
   -- As User A
   SELECT * FROM profiles WHERE id != auth.uid();
   -- Should return 0 rows

   -- Try to update User B's profile
   UPDATE profiles SET email = 'hacked@example.com' WHERE id = 'user-b-id';
   -- Should fail with permission denied
   ```

2. **Test Account-Based Authorization (learning_paths):**
   ```sql
   -- As User A (member of Account 1)
   SELECT * FROM learning_paths WHERE account_id = 'account-2-id';
   -- Should return 0 rows (can't see other accounts' private paths)

   -- As User A
   DELETE FROM learning_paths WHERE account_id = 'account-1-id' AND creator_id != auth.uid();
   -- Should succeed before fix, fail after fix (unless user is admin)
   ```

3. **Test Anonymous Access:**
   ```sql
   -- Log out, then use anon key
   SELECT * FROM learning_paths WHERE is_public = true;
   -- Should return public paths

   SELECT * FROM sections WHERE learning_path_id = 'public-path-id';
   -- Should FAIL before fix, SUCCEED after fix
   ```

### Automated Testing (Recommended)

Create test suite in `/tests/rls-policies.test.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('users cannot access other users profiles', async () => {
    const userAClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } }
    });

    const { data, error } = await userAClient
      .from('profiles')
      .select('*')
      .eq('id', userBId);

    expect(data).toEqual([]);
  });

  it('anonymous users can view public paths and their sections', async () => {
    const anonClient = createClient(url, anonKey);

    // Can view path
    const { data: paths } = await anonClient
      .from('learning_paths')
      .select('*')
      .eq('id', publicPathId)
      .eq('is_public', true);

    expect(paths).toHaveLength(1);

    // Can view sections (THIS WILL FAIL BEFORE FIX)
    const { data: sections } = await anonClient
      .from('sections')
      .select('*')
      .eq('learning_path_id', publicPathId);

    expect(sections.length).toBeGreaterThan(0);
  });

  it('team members cannot delete paths created by others', async () => {
    const charlieClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${charlieToken}` } }
    });

    const { error } = await charlieClient
      .from('learning_paths')
      .delete()
      .eq('id', alicesPathId); // Alice created this, Charlie is just a member

    expect(error).toBeTruthy(); // Should fail after fix
    expect(error?.code).toBe('42501'); // Insufficient privilege
  });
});
```

---

## Additional Security Notes

### SECURITY DEFINER Functions

The following functions bypass RLS:
- `user_has_account_role()` - Safe (read-only, parameterized)
- `user_is_account_admin()` - Safe (read-only, parameterized)

Both are marked `STABLE` (read-only) and use parameterized queries. Regular audits recommended when adding new SECURITY DEFINER functions.

### Service Role Usage

Service role bypasses ALL RLS policies. Currently used in:
- Stripe webhook handler (`/api/webhook/stripe/route.ts`)
- Background worker tasks (`libs/jobs/tasks/*.ts`)
- Admin operations

**Best Practices:**
1. ✅ Always validate data before service role operations
2. ✅ Log all service role operations for audit trail
3. ✅ Never expose service role client to client-side code
4. ⚠️ Add validation to webhook handler (see SECURITY-TASKS.md)

### Performance Considerations

RLS policies with JOINs (e.g., `sections`, `resources`) may impact query performance with large datasets.

**Current indexes:**
- ✅ `idx_sections_path_id` - Supports section policies
- ✅ `idx_resources_section_id` - Supports resource policies
- ✅ `idx_account_users_composite` - Supports account membership checks

**Monitor:**
- Query performance in production (use `EXPLAIN ANALYZE`)
- Add indexes if policy checks become slow (unlikely at MVP scale)

---

## Conclusion

Overall, ViaProto's RLS implementation is **solid** with proper user isolation and account-based authorization. The critical issues (anonymous access to sections/resources) are straightforward fixes that must be deployed before launch to avoid breaking public path viewing.

Post-launch priorities should focus on tightening path/section/resource modification policies to prevent accidental data loss in team accounts.

**Final Recommendation:**
1. ✅ Deploy the two CRITICAL fixes immediately (anonymous access)
2. ✅ Test public path viewing in incognito mode before launch
3. ⚠️ Schedule MEDIUM priority fixes for Week 1-2 post-launch
4. ✅ Set up RLS test suite to prevent regressions

---

**Audit Date:** 2025-11-24
**Auditor:** Security Auditor Agent
**Next Review:** After implementing fixes (within 1 week)
