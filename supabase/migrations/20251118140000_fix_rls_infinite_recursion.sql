-- Migration: Fix RLS Infinite Recursion in account_users
-- Purpose: Replace recursive RLS policies with SECURITY DEFINER functions
-- Date: 2025-11-18

-- Create helper function to check if user has a specific role in an account
-- SECURITY DEFINER bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.user_has_account_role(
    check_user_id uuid,
    check_account_id uuid,
    required_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.account_users
        WHERE user_id = check_user_id
        AND account_id = check_account_id
        AND (required_role IS NULL OR role = required_role)
    );
$$;

-- Create helper function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.user_is_account_admin(
    check_user_id uuid,
    check_account_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.account_users
        WHERE user_id = check_user_id
        AND account_id = check_account_id
        AND role IN ('owner', 'admin')
    );
$$;

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Account owners can read all account memberships" ON public.account_users;
DROP POLICY IF EXISTS "Account owners and admins can add members" ON public.account_users;
DROP POLICY IF EXISTS "Account owners and admins can update member roles" ON public.account_users;
DROP POLICY IF EXISTS "Users can leave accounts or be removed by owners/admins" ON public.account_users;

-- Recreate policies using SECURITY DEFINER functions
-- Users can read their own account memberships (no recursion issue)
-- This policy already exists and is fine, no need to recreate

-- Account owners can read all memberships for their accounts (FIXED)
CREATE POLICY "Account owners can read all account memberships"
    ON public.account_users
    FOR SELECT
    USING (
        public.user_has_account_role(auth.uid(), account_id, 'owner')
    );

-- Account owners and admins can insert new members (FIXED)
CREATE POLICY "Account owners and admins can add members"
    ON public.account_users
    FOR INSERT
    WITH CHECK (
        public.user_is_account_admin(auth.uid(), account_id)
    );

-- Account owners and admins can update member roles (but not their own) (FIXED)
CREATE POLICY "Account owners and admins can update member roles"
    ON public.account_users
    FOR UPDATE
    USING (
        user_id != auth.uid()
        AND public.user_is_account_admin(auth.uid(), account_id)
    );

-- Users can remove themselves, or owners/admins can remove others (FIXED)
CREATE POLICY "Users can leave accounts or be removed by owners/admins"
    ON public.account_users
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.user_is_account_admin(auth.uid(), account_id)
    );

-- Add comments
COMMENT ON FUNCTION public.user_has_account_role IS 'Check if a user has a specific role in an account. SECURITY DEFINER bypasses RLS to prevent infinite recursion.';
COMMENT ON FUNCTION public.user_is_account_admin IS 'Check if a user is an owner or admin of an account. SECURITY DEFINER bypasses RLS to prevent infinite recursion.';
