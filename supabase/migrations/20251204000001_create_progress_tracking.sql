-- Migration: Create Progress Tracking Tables
-- Purpose: Track user learning progress on paths and resources
-- Date: 2025-12-04

-- =====================================================
-- Table 1: user_path_tracking
-- Tracks user's explicit tracking relationship with paths
-- =====================================================

CREATE TABLE public.user_path_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'completed', 'archived')
    ),
    started_at timestamptz NOT NULL DEFAULT now(),
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Each user can only track a path once
    CONSTRAINT unique_user_path_tracking UNIQUE (user_id, learning_path_id)
);

-- Indexes for user_path_tracking
CREATE INDEX idx_user_path_tracking_user_id ON public.user_path_tracking(user_id);
CREATE INDEX idx_user_path_tracking_path_id ON public.user_path_tracking(learning_path_id);
CREATE INDEX idx_user_path_tracking_status ON public.user_path_tracking(status);
CREATE INDEX idx_user_path_tracking_last_activity ON public.user_path_tracking(last_activity_at DESC);
-- Composite index for aggregate stats queries
CREATE INDEX idx_user_path_tracking_path_active_month
    ON public.user_path_tracking(learning_path_id, last_activity_at)
    WHERE status IN ('active', 'completed');

-- Enable RLS
ALTER TABLE public.user_path_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tracking records
CREATE POLICY "Users can view their own path tracking"
    ON public.user_path_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own path tracking"
    ON public.user_path_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path tracking"
    ON public.user_path_tracking
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path tracking"
    ON public.user_path_tracking
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_path_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_path_tracking_updated_at
    BEFORE UPDATE ON public.user_path_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_path_tracking_updated_at();

-- Comments
COMMENT ON TABLE public.user_path_tracking IS 'Tracks which learning paths a user is actively learning. Supports active, completed, and archived states.';
COMMENT ON COLUMN public.user_path_tracking.status IS 'Tracking status: active (currently learning), completed (finished), or archived (hidden but data preserved).';
COMMENT ON COLUMN public.user_path_tracking.last_activity_at IS 'Updated whenever user updates any resource progress in this path.';

-- =====================================================
-- Table 2: user_resource_progress
-- Tracks progress on individual resources
-- =====================================================

CREATE TABLE public.user_resource_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    tracking_id uuid NOT NULL REFERENCES public.user_path_tracking(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'in_progress', 'completed', 'skipped')
    ),
    started_at timestamptz,
    completed_at timestamptz,
    skipped_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Each user can only have one progress record per resource
    CONSTRAINT unique_user_resource_progress UNIQUE (user_id, resource_id)
);

-- Indexes for user_resource_progress
CREATE INDEX idx_user_resource_progress_user_id ON public.user_resource_progress(user_id);
CREATE INDEX idx_user_resource_progress_resource_id ON public.user_resource_progress(resource_id);
CREATE INDEX idx_user_resource_progress_tracking_id ON public.user_resource_progress(tracking_id);
CREATE INDEX idx_user_resource_progress_status ON public.user_resource_progress(status);

-- Enable RLS
ALTER TABLE public.user_resource_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own progress records
CREATE POLICY "Users can view their own resource progress"
    ON public.user_resource_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resource progress"
    ON public.user_resource_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resource progress"
    ON public.user_resource_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resource progress"
    ON public.user_resource_progress
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_resource_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_resource_progress_updated_at
    BEFORE UPDATE ON public.user_resource_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_resource_progress_updated_at();

-- Comments
COMMENT ON TABLE public.user_resource_progress IS 'Tracks user progress on individual resources within a learning path.';
COMMENT ON COLUMN public.user_resource_progress.status IS 'Progress status: not_started, in_progress, completed, or skipped.';
COMMENT ON COLUMN public.user_resource_progress.notes IS 'Optional user notes about this resource.';

-- =====================================================
-- Table 3: path_learner_stats
-- Denormalized aggregate stats for public display
-- =====================================================

CREATE TABLE public.path_learner_stats (
    learning_path_id uuid PRIMARY KEY REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    total_learners integer NOT NULL DEFAULT 0,
    active_this_month integer NOT NULL DEFAULT 0,
    completed_count integer NOT NULL DEFAULT 0,
    last_calculated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.path_learner_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view learner stats (anonymized aggregate data)
CREATE POLICY "Anyone can view learner stats"
    ON public.path_learner_stats
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Comments
COMMENT ON TABLE public.path_learner_stats IS 'Denormalized aggregate learner statistics for paths. Updated via trigger for performance.';
COMMENT ON COLUMN public.path_learner_stats.total_learners IS 'Count of users with non-archived tracking for this path.';
COMMENT ON COLUMN public.path_learner_stats.active_this_month IS 'Count of users with activity in the current month.';
COMMENT ON COLUMN public.path_learner_stats.completed_count IS 'Count of users who have marked this path as completed.';

-- =====================================================
-- Function to update path_learner_stats
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_path_learner_stats(path_id uuid)
RETURNS void AS $$
DECLARE
    first_of_month timestamptz := date_trunc('month', now());
BEGIN
    INSERT INTO public.path_learner_stats (
        learning_path_id,
        total_learners,
        active_this_month,
        completed_count,
        last_calculated_at
    )
    SELECT
        path_id,
        COUNT(*) FILTER (WHERE status != 'archived'),
        COUNT(*) FILTER (WHERE status IN ('active', 'completed') AND last_activity_at >= first_of_month),
        COUNT(*) FILTER (WHERE status = 'completed'),
        now()
    FROM public.user_path_tracking
    WHERE learning_path_id = path_id
    ON CONFLICT (learning_path_id)
    DO UPDATE SET
        total_learners = EXCLUDED.total_learners,
        active_this_month = EXCLUDED.active_this_month,
        completed_count = EXCLUDED.completed_count,
        last_calculated_at = EXCLUDED.last_calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger to update stats when tracking changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_update_path_learner_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_path_learner_stats(OLD.learning_path_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_path_learner_stats(NEW.learning_path_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_path_stats_on_tracking_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_path_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_path_learner_stats();

-- =====================================================
-- Trigger to update last_activity_at when resource progress changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_update_tracking_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_path_tracking
    SET last_activity_at = now()
    WHERE id = NEW.tracking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracking_on_resource_progress
    AFTER INSERT OR UPDATE ON public.user_resource_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_tracking_last_activity();
