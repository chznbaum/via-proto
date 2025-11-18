-- Migration 6: Create Learning Paths Table
-- Purpose: Store AI-generated learning paths
-- Date: 2025-11-18

-- Create learning_paths table
CREATE TABLE public.learning_paths (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES public.profiles(id),
    topic_id uuid NOT NULL REFERENCES public.topics(id),
    title text NOT NULL,
    description text,
    skill_level text NOT NULL,
    total_estimated_hours numeric(6,2) NOT NULL DEFAULT 0,
    is_public boolean NOT NULL,
    model_used text NOT NULL,
    generation_metadata jsonb DEFAULT '{}',
    view_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT valid_skill_level CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    CONSTRAINT valid_estimated_hours CHECK (total_estimated_hours >= 0)
);

-- Create indexes
CREATE INDEX idx_paths_account_id ON public.learning_paths(account_id);
CREATE INDEX idx_paths_creator_id ON public.learning_paths(creator_id);
CREATE INDEX idx_paths_topic_id ON public.learning_paths(topic_id);
CREATE INDEX idx_paths_is_public ON public.learning_paths(is_public);
CREATE INDEX idx_paths_created_at ON public.learning_paths(created_at DESC);
CREATE INDEX idx_paths_view_count ON public.learning_paths(view_count DESC);

-- Enable Row Level Security
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read public learning paths
CREATE POLICY "Public learning paths are readable by all"
    ON public.learning_paths
    FOR SELECT
    TO authenticated
    USING (is_public = true);

-- Users can read learning paths from their own accounts
CREATE POLICY "Users can read their account's learning paths"
    ON public.learning_paths
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can insert learning paths for their accounts
CREATE POLICY "Users can create learning paths for their accounts"
    ON public.learning_paths
    FOR INSERT
    WITH CHECK (
        creator_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Users can update learning paths from their own accounts
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

-- Users can delete learning paths from their own accounts
CREATE POLICY "Users can delete their account's learning paths"
    ON public.learning_paths
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = learning_paths.account_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON public.learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.learning_paths IS 'AI-generated learning paths. Belong to accounts (not users directly). Rate limiting is per account. Free tier paths are public, Pro/Team paths are private by default.';
