-- Migration 4: Add Default Account to Profiles
-- Purpose: Track user's default/active account for context switching and add user profile fields
-- Date: 2025-11-18

-- Add new columns to profiles
ALTER TABLE public.profiles
    ADD COLUMN default_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    ADD COLUMN name text,
    ADD COLUMN avatar_url text;

-- Create index on default_account_id
CREATE INDEX idx_profiles_default_account_id ON public.profiles(default_account_id);

-- Remove old billing columns (billing is now account-level, not user-level)
-- Drop the index first
DROP INDEX IF EXISTS public.idx_profiles_customer_id;

-- Drop the columns
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS customer_id,
    DROP COLUMN IF EXISTS price_id,
    DROP COLUMN IF EXISTS has_access;

-- Add comment
COMMENT ON COLUMN public.profiles.default_account_id IS 'User''s currently selected/active account. Users can switch between accounts via UI.';
COMMENT ON COLUMN public.profiles.name IS 'User''s display name.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user''s profile avatar image.';
