-- Migration 3: Create Account Users Join Table
-- Purpose: Many-to-many relationship between users and accounts with roles
-- Date: 2025-11-18

-- Create account_users join table
CREATE TABLE public.account_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member',
    joined_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_user_account UNIQUE (user_id, account_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

-- Create indexes
CREATE INDEX idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX idx_account_users_composite ON public.account_users(user_id, account_id);

-- Enable Row Level Security
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_users
-- Users can read their own account memberships
CREATE POLICY "Users can read their own account memberships"
    ON public.account_users
    FOR SELECT
    USING (user_id = auth.uid());

-- Account owners can read all memberships for their accounts
CREATE POLICY "Account owners can read all account memberships"
    ON public.account_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users AS au
            WHERE au.account_id = account_users.account_id
            AND au.user_id = auth.uid()
            AND au.role = 'owner'
        )
    );

-- Account owners and admins can insert new members
CREATE POLICY "Account owners and admins can add members"
    ON public.account_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.account_users AS au
            WHERE au.account_id = account_users.account_id
            AND au.user_id = auth.uid()
            AND au.role IN ('owner', 'admin')
        )
    );

-- Account owners and admins can update member roles (but not their own)
CREATE POLICY "Account owners and admins can update member roles"
    ON public.account_users
    FOR UPDATE
    USING (
        user_id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.account_users AS au
            WHERE au.account_id = account_users.account_id
            AND au.user_id = auth.uid()
            AND au.role IN ('owner', 'admin')
        )
    );

-- Users can remove themselves, or owners/admins can remove others
CREATE POLICY "Users can leave accounts or be removed by owners/admins"
    ON public.account_users
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.account_users AS au
            WHERE au.account_id = account_users.account_id
            AND au.user_id = auth.uid()
            AND au.role IN ('owner', 'admin')
        )
    );

-- Add comment
COMMENT ON TABLE public.account_users IS 'Many-to-many relationship between users and accounts with roles. Personal accounts have one owner, team accounts can have multiple members with various roles.';

-- Now add the deferred RLS policies for accounts table
-- Users can read accounts they belong to
CREATE POLICY "Users can read their own accounts"
    ON public.accounts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = accounts.id
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can update accounts where they are owners
CREATE POLICY "Account owners can update their accounts"
    ON public.accounts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = accounts.id
            AND account_users.user_id = auth.uid()
            AND account_users.role = 'owner'
        )
    );

-- Users can delete accounts where they are owners
CREATE POLICY "Account owners can delete their accounts"
    ON public.accounts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = accounts.id
            AND account_users.user_id = auth.uid()
            AND account_users.role = 'owner'
        )
    );
