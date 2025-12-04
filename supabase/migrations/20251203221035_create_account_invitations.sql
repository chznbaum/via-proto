-- Migration: Create account_invitations table
-- Purpose: Track team member invitations with expiry and token-based acceptance

CREATE TABLE public.account_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    invited_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'member',
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    accepted_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'member')),
    CONSTRAINT email_not_empty CHECK (char_length(trim(email)) > 0),
    CONSTRAINT token_not_empty CHECK (char_length(token) > 0),
    CONSTRAINT expires_after_created CHECK (expires_at > created_at)
);

-- Indexes for common queries
CREATE INDEX idx_invitations_account_id ON public.account_invitations(account_id);
CREATE INDEX idx_invitations_email ON public.account_invitations(email);
CREATE INDEX idx_invitations_token ON public.account_invitations(token);
CREATE INDEX idx_invitations_pending ON public.account_invitations(account_id, email)
    WHERE accepted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins/owners can view all invitations for their accounts
CREATE POLICY "Account admins can view invitations"
    ON public.account_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = account_invitations.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );

-- Users can view invitations sent to their email address
CREATE POLICY "Users can view invitations to their email"
    ON public.account_invitations
    FOR SELECT
    USING (
        email = (
            SELECT profiles.email FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

-- Admins/owners can create invitations for their accounts
CREATE POLICY "Account admins can create invitations"
    ON public.account_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = account_invitations.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );

-- Admins/owners can update invitations (e.g., change role before acceptance)
CREATE POLICY "Account admins can update invitations"
    ON public.account_invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = account_invitations.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );

-- Admins/owners can delete/revoke invitations
CREATE POLICY "Account admins can revoke invitations"
    ON public.account_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = account_invitations.account_id
            AND account_users.user_id = auth.uid()
            AND account_users.role IN ('owner', 'admin')
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_account_invitations_updated_at
    BEFORE UPDATE ON public.account_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.account_invitations IS 'Team member invitations with email tokens. Invitations expire after 7 days by default. Users without accounts can accept invitations, triggering personal account creation.';
COMMENT ON COLUMN public.account_invitations.token IS 'Unique secure token sent in invitation email for acceptance';
COMMENT ON COLUMN public.account_invitations.role IS 'Role to assign when invitation is accepted (admin or member)';
COMMENT ON COLUMN public.account_invitations.accepted_at IS 'Timestamp when invitation was accepted, NULL if pending';
COMMENT ON COLUMN public.account_invitations.accepted_by_user_id IS 'User who accepted (may differ from invited email if cross-email acceptance allowed)';
