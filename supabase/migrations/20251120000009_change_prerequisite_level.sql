-- Migration: Change is_required to prerequisite_level enum
-- Purpose: Support three levels of prerequisites (required/recommended/optional)
-- Date: 2025-11-20

-- Add new prerequisite_level column
ALTER TABLE public.competency_prerequisites
ADD COLUMN prerequisite_level text;

-- Migrate existing data: true -> 'required', false -> 'optional'
UPDATE public.competency_prerequisites
SET prerequisite_level = CASE
    WHEN is_required = true THEN 'required'
    ELSE 'optional'
END;

-- Make prerequisite_level NOT NULL and add constraint
ALTER TABLE public.competency_prerequisites
ALTER COLUMN prerequisite_level SET NOT NULL,
ADD CONSTRAINT valid_prerequisite_level CHECK (
    prerequisite_level IN ('required', 'recommended', 'optional')
);

-- Drop old is_required column
ALTER TABLE public.competency_prerequisites
DROP COLUMN is_required;

-- Update comment
COMMENT ON COLUMN public.competency_prerequisites.prerequisite_level IS 'Level of prerequisite requirement: required (cannot learn without), recommended (strongly beneficial), or optional (useful for specific interests).';
