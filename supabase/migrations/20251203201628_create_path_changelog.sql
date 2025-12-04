-- Migration: Create path changelog for edit history
-- Tracks all manual edits to learning paths for version history and audit trail

CREATE TABLE public.path_changelog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    actor_id uuid NOT NULL REFERENCES public.profiles(id),
    action_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints for valid action types
    CONSTRAINT valid_action_type CHECK (action_type IN (
        'add_resource',
        'remove_resource',
        'reorder_resources',
        'add_section',
        'remove_section',
        'remix_path'
    )),

    -- Constraints for valid entity types
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('resource', 'section', 'path'))
);

-- Indexes for efficient querying
CREATE INDEX idx_changelog_path_id ON public.path_changelog(learning_path_id);
CREATE INDEX idx_changelog_actor_id ON public.path_changelog(actor_id);
CREATE INDEX idx_changelog_created_at ON public.path_changelog(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.path_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Changelog readable for public paths (anyone can view)
CREATE POLICY "Changelog readable for public paths"
    ON public.path_changelog
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths
            WHERE learning_paths.id = path_changelog.learning_path_id
            AND learning_paths.is_public = true
        )
    );

-- RLS Policy: Changelog readable for account members (private paths)
CREATE POLICY "Changelog readable for account members"
    ON public.path_changelog
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = path_changelog.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- RLS Policy: Account members can insert changelog entries
-- Note: The actor_id must match the current user
CREATE POLICY "Account members can insert changelog"
    ON public.path_changelog
    FOR INSERT
    TO authenticated
    WITH CHECK (
        actor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = path_changelog.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE public.path_changelog IS 'Tracks all manual edits to learning paths for version history and audit trail.';
COMMENT ON COLUMN public.path_changelog.action_type IS 'Type of action: add_resource, remove_resource, reorder_resources, add_section, remove_section, remix_path';
COMMENT ON COLUMN public.path_changelog.entity_type IS 'Type of entity affected: resource, section, or path';
COMMENT ON COLUMN public.path_changelog.entity_id IS 'ID of the affected entity (resource, section, or path)';
COMMENT ON COLUMN public.path_changelog.details IS 'JSONB containing action-specific details (titles, before/after states, etc.)';
