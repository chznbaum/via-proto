-- Create user_preferences table for storing user UI customization settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system',
    font_family TEXT NOT NULL DEFAULT 'fixel',
    direction TEXT NOT NULL DEFAULT 'ltr',
    sidebar_theme TEXT NOT NULL DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Ensure only one preferences row per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id),

    -- Validate theme values
    CONSTRAINT valid_theme CHECK (theme IN ('light', 'contrast', 'material', 'dark', 'dim', 'material-dark', 'system')),

    -- Validate font_family values
    CONSTRAINT valid_font_family CHECK (font_family IN ('fixel', 'atkinson', 'geist', 'figtree')),

    -- Validate direction values
    CONSTRAINT valid_direction CHECK (direction IN ('ltr', 'rtl')),

    -- Validate sidebar_theme values
    CONSTRAINT valid_sidebar_theme CHECK (sidebar_theme IN ('light', 'dark'))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own preferences
CREATE POLICY "Users can read own preferences"
    ON user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();
