-- Add preferred_search_engine column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN preferred_search_engine TEXT NOT NULL DEFAULT 'duckduckgo';

-- Add constraint to validate search engine values
ALTER TABLE user_preferences
ADD CONSTRAINT valid_search_engine CHECK (
  preferred_search_engine IN (
    'duckduckgo',
    'google',
    'bing',
    'kagi',
    'yandex',
    'startpage',
    'brave',
    'ecosia',
    'yahoo',
    'baidu',
    'qwant',
    'mojeek',
    'you'
  )
);

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.preferred_search_engine IS 'User''s preferred search engine for resource search links';
