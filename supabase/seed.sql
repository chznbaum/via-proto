-- Supabase Seed File (New Schema)
-- This file seeds the database with initial data using the new hierarchical structure
-- Run with: supabase db reset (drops and recreates with migrations + seeds)

-- Clear existing data (in correct order due to foreign key constraints)
TRUNCATE public.taggables, public.tags CASCADE;
TRUNCATE public.topic_competencies CASCADE;
TRUNCATE public.competency_synonyms CASCADE;
TRUNCATE public.competency_alternatives CASCADE;
TRUNCATE public.competency_prerequisites CASCADE;
TRUNCATE public.topics CASCADE;
TRUNCATE public.competencies CASCADE;
TRUNCATE public.categories CASCADE;
TRUNCATE public.unsplash_images CASCADE;

-- ============================================================
-- UNSPLASH IMAGES
-- ============================================================

-- man writing on paper
-- Usage: Used on /tos page for legal documentation illustration
INSERT INTO public.unsplash_images (photo_id, url, photographer, photographer_username, photographer_url, download_location, alt_description, usage_note)
VALUES ('OQMZwNd3ThU', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=tinysrgb&fit=crop&h=672&w=1120&fm=jpg&ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NDUyNjV8&ixlib=rb-4.1.0&q=80', 'Scott Graham', 'amstram', 'https://unsplash.com/@amstram?utm_source=ViaProto&utm_medium=referral', 'https://api.unsplash.com/photos/OQMZwNd3ThU/download?ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NDUyNjV8', 'man writing on paper', 'Used on /tos page for legal documentation illustration');

-- we''ve updated outr privacy policy sign
-- Usage: Used on /privacy-policy page for privacy documentation illustration
INSERT INTO public.unsplash_images (photo_id, url, photographer, photographer_username, photographer_url, download_location, alt_description, usage_note)
VALUES ('HkUDmu2uC9w', 'https://images.unsplash.com/photo-1571751902560-033d0c0f7e5f?crop=bottom&cs=tinysrgb&fit=crop&h=672&w=1120&fm=jpg&ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NTAwNzl8&ixlib=rb-4.1.0&q=80', 'lilartsy', 'lilartsy', 'https://unsplash.com/@lilartsy?utm_source=ViaProto&utm_medium=referral', 'https://api.unsplash.com/photos/HkUDmu2uC9w/download?ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NTAwNzl8', 'we''ve updated outr privacy policy sign', 'Used on /privacy-policy page for privacy documentation illustration');


-- ============================================================
-- CATEGORIES (Hierarchical)
-- ============================================================

-- Information & Technology
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Information & Technology', 'information-technology', 'Technology, software, and digital skills', NULL, 'ComputerDesktopIcon', 1, true);

  -- Programming
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Programming', 'programming', 'Software development and programming languages', (SELECT id FROM public.categories WHERE slug = 'information-technology'), 'CodeBracketIcon', 1, true);

    -- Web Development
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Web Development', 'web-development', 'Building websites and web applications', (SELECT id FROM public.categories WHERE slug = 'programming'), 'GlobeAltIcon', 1, true);

      -- Frontend Development
      INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
      VALUES ('Frontend Development', 'frontend-development', 'Client-side web development', (SELECT id FROM public.categories WHERE slug = 'web-development'), 'DevicePhoneMobileIcon', 1, true);

      -- Backend Development
      INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
      VALUES ('Backend Development', 'backend-development', 'Server-side web development', (SELECT id FROM public.categories WHERE slug = 'web-development'), 'ServerIcon', 2, true);

    -- Mobile Development
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Mobile Development', 'mobile-development', 'Building mobile applications', (SELECT id FROM public.categories WHERE slug = 'programming'), 'DevicePhoneMobileIcon', 2, true);

  -- Data & Analytics
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Data & Analytics', 'data-analytics', 'Data science, analysis, and visualization', (SELECT id FROM public.categories WHERE slug = 'information-technology'), 'ChartBarIcon', 2, true);

    -- Data Science
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Data Science', 'data-science', 'Statistical analysis and machine learning', (SELECT id FROM public.categories WHERE slug = 'data-analytics'), 'BeakerIcon', 1, true);

    -- Data Engineering
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Data Engineering', 'data-engineering', 'Building data pipelines and infrastructure', (SELECT id FROM public.categories WHERE slug = 'data-analytics'), 'CircleStackIcon', 2, true);

-- Design & Creativity
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Design & Creativity', 'design-creativity', 'Visual design, UX, and creative arts', NULL, 'PaintBrushIcon', 2, true);

-- Business & Management
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Business & Management', 'business-management', 'Business skills, management, and entrepreneurship', NULL, 'BriefcaseIcon', 3, true);

-- Languages
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Languages', 'languages', 'Natural language learning', NULL, 'LanguageIcon', 4, true);


-- ============================================================
-- COMPETENCIES
-- ============================================================

-- JavaScript
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('JavaScript', 'javascript', 'Programming language of the web', (SELECT id FROM public.categories WHERE slug = 'programming'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'JS' FROM public.competencies WHERE slug = 'javascript';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'ECMAScript' FROM public.competencies WHERE slug = 'javascript';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'ES6' FROM public.competencies WHERE slug = 'javascript';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'ES2015+' FROM public.competencies WHERE slug = 'javascript';

-- React
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('React', 'react', 'JavaScript library for building user interfaces', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'React.js' FROM public.competencies WHERE slug = 'react';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'ReactJS' FROM public.competencies WHERE slug = 'react';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'React Framework' FROM public.competencies WHERE slug = 'react';

-- HTML
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('HTML', 'html', 'Markup language for web pages', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'HTML5' FROM public.competencies WHERE slug = 'html';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'HyperText Markup Language' FROM public.competencies WHERE slug = 'html';

-- CSS
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('CSS', 'css', 'Style sheet language for web pages', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'CSS3' FROM public.competencies WHERE slug = 'css';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Cascading Style Sheets' FROM public.competencies WHERE slug = 'css';

-- Python
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Python', 'python', 'High-level programming language', (SELECT id FROM public.categories WHERE slug = 'programming'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Python Programming' FROM public.competencies WHERE slug = 'python';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Python3' FROM public.competencies WHERE slug = 'python';

-- Flask
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Flask', 'flask', 'Lightweight Python web framework', (SELECT id FROM public.categories WHERE slug = 'backend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Flask Framework' FROM public.competencies WHERE slug = 'flask';

-- Django
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Django', 'django', 'High-level Python web framework', (SELECT id FROM public.categories WHERE slug = 'backend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Django Framework' FROM public.competencies WHERE slug = 'django';

-- Spanish
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Spanish', 'spanish', 'Spanish language', (SELECT id FROM public.categories WHERE slug = 'languages'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Español' FROM public.competencies WHERE slug = 'spanish';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Spanish Language' FROM public.competencies WHERE slug = 'spanish';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Castellano' FROM public.competencies WHERE slug = 'spanish';


-- ============================================================
-- COMPETENCY PREREQUISITES
-- ============================================================

-- react requires javascript
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, is_required, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  true,
  'JavaScript fundamentals required before learning React';

-- flask requires python
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, is_required, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'flask'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  true,
  'Python basics required for Flask development';

-- django requires python
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, is_required, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'django'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  true,
  'Python basics required for Django development';


-- ============================================================
-- COMPETENCY ALTERNATIVES
-- ============================================================

-- flask ⇄ django (similar)
INSERT INTO public.competency_alternatives (competency_id, alternative_id, relationship_type, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'flask'),
  (SELECT id FROM public.competencies WHERE slug = 'django'),
  'similar',
  'Both are Python web frameworks. Flask is lightweight, Django is full-featured.';


-- ============================================================
-- TOPICS
-- ============================================================

-- Building interactive UIs with React
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Building interactive UIs with React', 'building-interactive-uis-with-react', 'Learn to create dynamic, interactive user interfaces using React''s component-based architecture', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Building web applications with Python
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Building web applications with Python', 'building-web-applications-with-python', 'Learn to build full-featured web applications using Python and modern frameworks', (SELECT id FROM public.categories WHERE slug = 'backend-development'), true);

-- Conversational Spanish for travelers
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Conversational Spanish for travelers', 'conversational-spanish-for-travelers', 'Learn essential Spanish phrases and conversations for travel', (SELECT id FROM public.categories WHERE slug = 'languages'), true);


-- ============================================================
-- TOPIC-COMPETENCY RELATIONSHIPS
-- ============================================================

-- Competencies for: Building interactive UIs with React
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  true,
  'intermediate';
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false,
  'intermediate';
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'html'),
  false,
  'beginner';
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'css'),
  false,
  'beginner';

-- Competencies for: Building web applications with Python
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  true,
  'intermediate';
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'flask'),
  false,
  'intermediate';
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'html'),
  false,
  'beginner';

-- Competencies for: Conversational Spanish for travelers
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary, proficiency_level)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'conversational-spanish-for-travelers'),
  (SELECT id FROM public.competencies WHERE slug = 'spanish'),
  true,
  'beginner';

