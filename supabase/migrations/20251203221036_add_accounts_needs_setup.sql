-- Migration: Add needs_setup column to accounts
-- Purpose: Track whether a team account needs initial setup (rename, invite members)

ALTER TABLE public.accounts
ADD COLUMN needs_setup boolean NOT NULL DEFAULT false;

-- Add setup_completed_at for tracking when setup was finished
ALTER TABLE public.accounts
ADD COLUMN setup_completed_at timestamptz;

-- Comment
COMMENT ON COLUMN public.accounts.needs_setup IS 'True when account was just created and needs initial setup (e.g., team rename, member invites). Set to false after setup wizard completion.';
COMMENT ON COLUMN public.accounts.setup_completed_at IS 'Timestamp when account setup was completed';
