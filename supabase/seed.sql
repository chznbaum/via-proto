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

      -- Full-stack Development
      INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
      VALUES ('Full-stack Development', 'fullstack-development', 'End-to-end web application development', (SELECT id FROM public.categories WHERE slug = 'web-development'), 'CircleStackIcon', 2, true);

      -- Backend Development
      INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
      VALUES ('Backend Development', 'backend-development', 'Server-side web development', (SELECT id FROM public.categories WHERE slug = 'web-development'), 'ServerIcon', 3, true);

    -- Mobile Development
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Mobile Development', 'mobile-development', 'Building mobile applications', (SELECT id FROM public.categories WHERE slug = 'programming'), 'DevicePhoneMobileIcon', 2, true);

    -- Game Development
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Game Development', 'game-development', 'Creating video games and interactive experiences', (SELECT id FROM public.categories WHERE slug = 'programming'), 'PuzzlePieceIcon', 3, true);

    -- Systems Programming
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Systems Programming', 'systems-programming', 'Low-level programming and operating systems', (SELECT id FROM public.categories WHERE slug = 'programming'), 'CpuChipIcon', 4, true);

    -- Software Testing
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Software Testing', 'software-testing', 'Testing methodologies and quality assurance', (SELECT id FROM public.categories WHERE slug = 'programming'), 'CheckCircleIcon', 5, true);

  -- Data & Analytics
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Data & Analytics', 'data-analytics', 'Data science, analysis, and visualization', (SELECT id FROM public.categories WHERE slug = 'information-technology'), 'ChartBarIcon', 2, true);

    -- Data Science
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Data Science', 'data-science', 'Statistical analysis and machine learning', (SELECT id FROM public.categories WHERE slug = 'data-analytics'), 'BeakerIcon', 1, true);

    -- Data Engineering
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Data Engineering', 'data-engineering', 'Building data pipelines and infrastructure', (SELECT id FROM public.categories WHERE slug = 'data-analytics'), 'CircleStackIcon', 2, true);

    -- Databases
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Databases', 'databases', 'Database design, management, and optimization', (SELECT id FROM public.categories WHERE slug = 'data-analytics'), 'CircleStackIcon', 3, true);

  -- Cloud & DevOps
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Cloud & DevOps', 'cloud-devops', 'Cloud computing and DevOps practices', (SELECT id FROM public.categories WHERE slug = 'information-technology'), 'CloudIcon', 3, true);

  -- Information Security
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Information Security', 'information-security', 'Cybersecurity and information protection', (SELECT id FROM public.categories WHERE slug = 'information-technology'), 'ShieldCheckIcon', 4, true);

    -- Cybersecurity
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Cybersecurity', 'cybersecurity', 'Protecting systems and networks from attacks', (SELECT id FROM public.categories WHERE slug = 'information-security'), 'LockClosedIcon', 1, true);

-- Design & Creativity
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Design & Creativity', 'design-creativity', 'Visual design, UX, and creative arts', NULL, 'PaintBrushIcon', 2, true);

  -- UI/UX Design
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('UI/UX Design', 'uiux-design', 'User interface and user experience design', (SELECT id FROM public.categories WHERE slug = 'design-creativity'), 'DevicePhoneMobileIcon', 1, true);

  -- Graphic Design
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Graphic Design', 'graphic-design', 'Visual communication and graphic design', (SELECT id FROM public.categories WHERE slug = 'design-creativity'), 'PhotoIcon', 2, true);

  -- Motion & 3D
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Motion & 3D', 'motion-3d', 'Motion graphics, animation, and 3D modeling', (SELECT id FROM public.categories WHERE slug = 'design-creativity'), 'FilmIcon', 3, true);

  -- Creative Arts
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Creative Arts', 'creative-arts', 'Music, writing, photography, and visual arts', (SELECT id FROM public.categories WHERE slug = 'design-creativity'), 'MusicalNoteIcon', 4, true);

    -- Photography & Video
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Photography & Video', 'photography-video', 'Photography and videography', (SELECT id FROM public.categories WHERE slug = 'creative-arts'), 'CameraIcon', 1, true);

    -- Music
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Music', 'music', 'Music theory, performance, and production', (SELECT id FROM public.categories WHERE slug = 'creative-arts'), 'MusicalNoteIcon', 2, true);

    -- Writing
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Writing', 'writing', 'Creative and technical writing', (SELECT id FROM public.categories WHERE slug = 'creative-arts'), 'PencilIcon', 3, true);

    -- Theater
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Theater', 'theater', 'Acting, directing, and stage production', (SELECT id FROM public.categories WHERE slug = 'creative-arts'), 'FilmIcon', 4, true);

    -- Visual Arts
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Visual Arts', 'visual-arts', 'Drawing, painting, and traditional arts', (SELECT id FROM public.categories WHERE slug = 'creative-arts'), 'PaintBrushIcon', 5, true);

  -- Architecture
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Architecture', 'architecture', 'Architectural design and planning', (SELECT id FROM public.categories WHERE slug = 'design-creativity'), 'BuildingOfficeIcon', 5, true);

-- Business & Management
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Business & Management', 'business-management', 'Business skills, management, and entrepreneurship', NULL, 'BriefcaseIcon', 3, true);

  -- Product & Project Management
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Product & Project Management', 'product-project-management', 'Product development and project coordination', (SELECT id FROM public.categories WHERE slug = 'business-management'), 'ClipboardDocumentListIcon', 1, true);

  -- Marketing & Sales
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Marketing & Sales', 'marketing-sales', 'Marketing strategy and sales techniques', (SELECT id FROM public.categories WHERE slug = 'business-management'), 'MegaphoneIcon', 2, true);

  -- Leadership & Communication
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Leadership & Communication', 'leadership-communication', 'Leadership skills and professional communication', (SELECT id FROM public.categories WHERE slug = 'business-management'), 'UserGroupIcon', 3, true);

  -- Finance & Accounting
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Finance & Accounting', 'finance-accounting', 'Financial management and accounting principles', (SELECT id FROM public.categories WHERE slug = 'business-management'), 'CurrencyDollarIcon', 4, true);

    -- Personal Finance
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Personal Finance', 'personal-finance', 'Managing personal money and investments', (SELECT id FROM public.categories WHERE slug = 'finance-accounting'), 'BanknotesIcon', 1, true);

    -- Investing & Trading
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Investing & Trading', 'investing-trading', 'Investment strategies and trading', (SELECT id FROM public.categories WHERE slug = 'finance-accounting'), 'ChartBarIcon', 2, true);

    -- Corporate Finance
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Corporate Finance', 'corporate-finance', 'Business financial management', (SELECT id FROM public.categories WHERE slug = 'finance-accounting'), 'BuildingOfficeIcon', 3, true);

  -- Operations & Strategy
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Operations & Strategy', 'operations-strategy', 'Business operations and strategic planning', (SELECT id FROM public.categories WHERE slug = 'business-management'), 'CogIcon', 5, true);

-- Linguistics
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Linguistics', 'linguistics', 'Language learning and speech development', NULL, 'LanguageIcon', 4, true);

  -- Languages
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Languages', 'languages', 'Natural language learning', (SELECT id FROM public.categories WHERE slug = 'linguistics'), 'GlobeAltIcon', 1, true);

  -- Speech Development & Pathology
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Speech Development & Pathology', 'speech-development-pathology', 'Speech therapy and language development', (SELECT id FROM public.categories WHERE slug = 'linguistics'), 'MicrophoneIcon', 2, true);

-- Mathematics
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Mathematics', 'mathematics', 'Mathematical theory and applications', NULL, 'CalculatorIcon', 5, true);

  -- Foundational Math
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Foundational Math', 'foundational-math', 'Basic mathematical concepts and operations', (SELECT id FROM public.categories WHERE slug = 'mathematics'), 'AcademicCapIcon', 1, true);

    -- Arithmetic
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Arithmetic', 'arithmetic', 'Basic number operations', (SELECT id FROM public.categories WHERE slug = 'foundational-math'), 'CalculatorIcon', 1, true);

    -- Algebra
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Algebra', 'algebra', 'Algebraic expressions and equations', (SELECT id FROM public.categories WHERE slug = 'foundational-math'), 'VariableIcon', 2, true);

    -- Geometry
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Geometry', 'geometry', 'Shapes, spaces, and spatial reasoning', (SELECT id FROM public.categories WHERE slug = 'foundational-math'), 'Square3Stack3DIcon', 3, true);

    -- Trigonometry
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Trigonometry', 'trigonometry', 'Angles and triangular relationships', (SELECT id FROM public.categories WHERE slug = 'foundational-math'), 'ChartPieIcon', 4, true);

  -- Advanced Math
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Advanced Math', 'advanced-math', 'Higher-level mathematical concepts', (SELECT id FROM public.categories WHERE slug = 'mathematics'), 'AcademicCapIcon', 2, true);

    -- Calculus
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Calculus', 'calculus', 'Differential and integral calculus', (SELECT id FROM public.categories WHERE slug = 'advanced-math'), 'ChartBarIcon', 1, true);

    -- Linear Algebra
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Linear Algebra', 'linear-algebra', 'Vectors, matrices, and linear transformations', (SELECT id FROM public.categories WHERE slug = 'advanced-math'), 'TableCellsIcon', 2, true);

    -- Differential Equations
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Differential Equations', 'differential-equations', 'Equations involving derivatives', (SELECT id FROM public.categories WHERE slug = 'advanced-math'), 'ArrowTrendingUpIcon', 3, true);

  -- Applied Math
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Applied Math', 'applied-math', 'Practical mathematical applications', (SELECT id FROM public.categories WHERE slug = 'mathematics'), 'ChartBarIcon', 3, true);

    -- Statistics & Probability
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Statistics & Probability', 'statistics-probability', 'Data analysis and probability theory', (SELECT id FROM public.categories WHERE slug = 'applied-math'), 'ChartBarIcon', 1, true);

    -- Discrete Mathematics
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Discrete Mathematics', 'discrete-mathematics', 'Mathematical structures for computer science', (SELECT id FROM public.categories WHERE slug = 'applied-math'), 'Squares2X2Icon', 2, true);

    -- Number Theory
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Number Theory', 'number-theory', 'Properties and relationships of numbers', (SELECT id FROM public.categories WHERE slug = 'applied-math'), 'HashtagIcon', 3, true);

-- Science
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Science', 'science', 'Natural sciences and scientific research', NULL, 'BeakerIcon', 6, true);

  -- Physical Sciences
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Physical Sciences', 'physical-sciences', 'Physics, chemistry, and physical phenomena', (SELECT id FROM public.categories WHERE slug = 'science'), 'BoltIcon', 1, true);

    -- Physics
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Physics', 'physics', 'Matter, energy, and fundamental forces', (SELECT id FROM public.categories WHERE slug = 'physical-sciences'), 'BoltIcon', 1, true);

    -- Chemistry
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Chemistry', 'chemistry', 'Chemical elements and reactions', (SELECT id FROM public.categories WHERE slug = 'physical-sciences'), 'BeakerIcon', 2, true);

    -- Astronomy
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Astronomy', 'astronomy', 'Celestial objects and universe', (SELECT id FROM public.categories WHERE slug = 'physical-sciences'), 'SparklesIcon', 3, true);

  -- Life Sciences
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Life Sciences', 'life-sciences', 'Biology and living organisms', (SELECT id FROM public.categories WHERE slug = 'science'), 'HeartIcon', 2, true);

    -- Biology
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Biology', 'biology', 'Living organisms and life processes', (SELECT id FROM public.categories WHERE slug = 'life-sciences'), 'SparklesIcon', 1, true);

    -- Genetics
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Genetics', 'genetics', 'Heredity and genetic variation', (SELECT id FROM public.categories WHERE slug = 'life-sciences'), 'DocumentMagnifyingGlassIcon', 2, true);

    -- Neuroscience
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Neuroscience', 'neuroscience', 'Brain and nervous system', (SELECT id FROM public.categories WHERE slug = 'life-sciences'), 'CpuChipIcon', 3, true);

  -- Environmental Science
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Environmental Science', 'environmental-science', 'Environment and ecosystems', (SELECT id FROM public.categories WHERE slug = 'science'), 'GlobeAltIcon', 3, true);

-- Personal Development
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Personal Development', 'personal-development', 'Self-improvement and life skills', NULL, 'UserIcon', 7, true);

  -- Productivity & Time Management
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Productivity & Time Management', 'productivity-time-management', 'Efficiency and time optimization', (SELECT id FROM public.categories WHERE slug = 'personal-development'), 'ClockIcon', 1, true);

  -- Cognitive Skills
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Cognitive Skills', 'cognitive-skills', 'Thinking and learning abilities', (SELECT id FROM public.categories WHERE slug = 'personal-development'), 'LightBulbIcon', 2, true);

    -- Critical Thinking
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Critical Thinking', 'critical-thinking', 'Logical analysis and reasoning', (SELECT id FROM public.categories WHERE slug = 'cognitive-skills'), 'AcademicCapIcon', 1, true);

    -- Memory & Learning
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Memory & Learning', 'memory-learning', 'Retention and learning techniques', (SELECT id FROM public.categories WHERE slug = 'cognitive-skills'), 'BookOpenIcon', 2, true);

    -- Problem Solving
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Problem Solving', 'problem-solving', 'Analytical problem resolution', (SELECT id FROM public.categories WHERE slug = 'cognitive-skills'), 'PuzzlePieceIcon', 3, true);

  -- Communication & Interpersonal
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Communication & Interpersonal', 'communication-interpersonal', 'Relationship and communication skills', (SELECT id FROM public.categories WHERE slug = 'personal-development'), 'ChatBubbleLeftRightIcon', 3, true);

  -- Mindfulness & Wellness
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Mindfulness & Wellness', 'mindfulness-wellness', 'Mental well-being and awareness', (SELECT id FROM public.categories WHERE slug = 'personal-development'), 'HeartIcon', 4, true);

-- Health & Fitness
INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
VALUES ('Health & Fitness', 'health-fitness', 'Physical health and wellness', NULL, 'HeartIcon', 8, true);

  -- Fitness & Exercise
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Fitness & Exercise', 'fitness-exercise', 'Physical training and exercise', (SELECT id FROM public.categories WHERE slug = 'health-fitness'), 'BoltIcon', 1, true);

    -- Strength Training
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Strength Training', 'strength-training', 'Resistance and weight training', (SELECT id FROM public.categories WHERE slug = 'fitness-exercise'), 'FireIcon', 1, true);

    -- Cardio & Endurance
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Cardio & Endurance', 'cardio-endurance', 'Cardiovascular fitness', (SELECT id FROM public.categories WHERE slug = 'fitness-exercise'), 'HeartIcon', 2, true);

    -- Flexibility & Mobility
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Flexibility & Mobility', 'flexibility-mobility', 'Stretching and movement quality', (SELECT id FROM public.categories WHERE slug = 'fitness-exercise'), 'ArrowsRightLeftIcon', 3, true);

  -- Nutrition & Diet
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Nutrition & Diet', 'nutrition-diet', 'Healthy eating and nutrition', (SELECT id FROM public.categories WHERE slug = 'health-fitness'), 'CakeIcon', 2, true);

  -- Mental Health
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Mental Health', 'mental-health', 'Psychological well-being', (SELECT id FROM public.categories WHERE slug = 'health-fitness'), 'HeartIcon', 3, true);

  -- Holistic Health
  INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
  VALUES ('Holistic Health', 'holistic-health', 'Alternative and integrative health', (SELECT id FROM public.categories WHERE slug = 'health-fitness'), 'SparklesIcon', 4, true);

    -- Yoga
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Yoga', 'yoga', 'Mind-body practice and movement', (SELECT id FROM public.categories WHERE slug = 'holistic-health'), 'UserIcon', 1, true);

    -- Meditation
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Meditation', 'meditation', 'Mindfulness and meditation practices', (SELECT id FROM public.categories WHERE slug = 'holistic-health'), 'SparklesIcon', 2, true);

    -- Alternative Medicine
    INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)
    VALUES ('Alternative Medicine', 'alternative-medicine', 'Complementary health practices', (SELECT id FROM public.categories WHERE slug = 'holistic-health'), 'BeakerIcon', 3, true);


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

-- TypeScript
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('TypeScript', 'typescript', 'Typed superset of JavaScript for safer code', (SELECT id FROM public.categories WHERE slug = 'programming'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'TS' FROM public.competencies WHERE slug = 'typescript';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'TypeScript Language' FROM public.competencies WHERE slug = 'typescript';

-- React
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('React', 'react', 'JavaScript library for building user interfaces', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'React.js' FROM public.competencies WHERE slug = 'react';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'ReactJS' FROM public.competencies WHERE slug = 'react';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'React Framework' FROM public.competencies WHERE slug = 'react';

-- Vue.js
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Vue.js', 'vuejs', 'Progressive JavaScript framework for building user interfaces', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Vue' FROM public.competencies WHERE slug = 'vuejs';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'VueJS' FROM public.competencies WHERE slug = 'vuejs';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Vue Framework' FROM public.competencies WHERE slug = 'vuejs';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Vue 3' FROM public.competencies WHERE slug = 'vuejs';

-- Angular
INSERT INTO public.competencies (name, slug, description, category_id, is_active)
VALUES ('Angular', 'angular', 'TypeScript-based framework for building scalable web applications', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'AngularJS' FROM public.competencies WHERE slug = 'angular';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Angular 2+' FROM public.competencies WHERE slug = 'angular';
INSERT INTO public.competency_synonyms (competency_id, synonym)
SELECT id, 'Angular Framework' FROM public.competencies WHERE slug = 'angular';

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

-- react requires javascript (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  'required',
  'JavaScript fundamentals required before learning React';

-- vuejs requires javascript (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  'required',
  'JavaScript fundamentals required before learning Vue.js';

-- angular requires javascript (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  'required',
  'JavaScript fundamentals required before learning Angular';

-- typescript requires javascript (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  'required',
  'TypeScript is a superset of JavaScript, so JavaScript fundamentals are essential';

-- flask requires python (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'flask'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  'required',
  'Python basics required for Flask development';

-- django requires python (required)
INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'django'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  'required',
  'Python basics required for Django development';


-- ============================================================
-- COMPETENCY ALTERNATIVES
-- ============================================================

-- react ⇄ vuejs (similar)
INSERT INTO public.competency_alternatives (competency_id, alternative_id, relationship_type, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  'similar',
  'Both are popular JavaScript frontend frameworks. React has larger ecosystem, Vue.js has gentler learning curve.';

-- react ⇄ angular (similar)
INSERT INTO public.competency_alternatives (competency_id, alternative_id, relationship_type, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  'similar',
  'Both are popular frontend frameworks. React is more flexible, Angular is more opinionated and feature-complete.';

-- vuejs ⇄ angular (similar)
INSERT INTO public.competency_alternatives (competency_id, alternative_id, relationship_type, notes)
SELECT 
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  'similar',
  'Both are complete frontend frameworks. Vue.js is more approachable, Angular is better for enterprise apps.';

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

-- Building reactive web applications with Vue.js
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Building reactive web applications with Vue.js', 'building-reactive-web-apps-vuejs', 'Create responsive, data-driven web applications using Vue.js''s reactive framework', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Building games for web browsers with Vue.js
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Building games for web browsers with Vue.js', 'building-browser-games-vuejs', 'Create interactive browser-based games using Vue.js components and reactivity', (SELECT id FROM public.categories WHERE slug = 'game-development'), true);

-- Managing frontend state with Vue.js and Pinia
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Managing frontend state with Vue.js and Pinia', 'state-management-vuejs-pinia', 'Master centralized state management in Vue.js applications using Pinia', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Scaffold performant Vue.js applications with Nuxt
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Scaffold performant Vue.js applications with Nuxt', 'scaffold-vuejs-apps-nuxt', 'Build server-rendered and statically generated Vue.js apps with Nuxt framework', (SELECT id FROM public.categories WHERE slug = 'fullstack-development'), true);

-- Testing Vue.js applications with Jest
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Testing Vue.js applications with Jest', 'testing-vuejs-jest', 'Write comprehensive unit and component tests for Vue.js apps using Jest', (SELECT id FROM public.categories WHERE slug = 'software-testing'), true);

-- Enterprise-scale applications with Angular
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Enterprise-scale applications with Angular', 'enterprise-apps-angular', 'Build large-scale, maintainable enterprise applications using Angular''s robust architecture', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Progressive Web Apps with Angular
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Progressive Web Apps with Angular', 'pwa-angular', 'Create offline-capable, installable Progressive Web Apps using Angular', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Reactive forms in Angular applications
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Reactive forms in Angular applications', 'reactive-forms-angular', 'Master complex form handling and validation with Angular reactive forms', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Testing Angular applications with Jasmine
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Testing Angular applications with Jasmine', 'testing-angular-jasmine', 'Write unit and integration tests for Angular apps using Jasmine and Karma', (SELECT id FROM public.categories WHERE slug = 'software-testing'), true);

-- Server-side rendering with Angular Universal
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Server-side rendering with Angular Universal', 'ssr-angular-universal', 'Implement server-side rendering for improved performance and SEO with Angular Universal', (SELECT id FROM public.categories WHERE slug = 'fullstack-development'), true);

-- State management with NgRx in Angular
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('State management with NgRx in Angular', 'state-management-ngrx-angular', 'Manage complex application state using NgRx and Redux patterns in Angular', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);

-- Type-safe JavaScript development with TypeScript
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Type-safe JavaScript development with TypeScript', 'type-safe-javascript-typescript', 'Write safer, more maintainable JavaScript code using TypeScript''s static typing', (SELECT id FROM public.categories WHERE slug = 'programming'), true);

-- Building Node.js APIs with TypeScript
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Building Node.js APIs with TypeScript', 'nodejs-apis-typescript', 'Create type-safe backend APIs using TypeScript and Node.js', (SELECT id FROM public.categories WHERE slug = 'backend-development'), true);

-- Full-stack development with TypeScript
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Full-stack development with TypeScript', 'fullstack-development-typescript', 'Build end-to-end type-safe applications with TypeScript across frontend and backend', (SELECT id FROM public.categories WHERE slug = 'fullstack-development'), true);

-- Migrating JavaScript projects to TypeScript
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Migrating JavaScript projects to TypeScript', 'migrating-javascript-typescript', 'Incrementally adopt TypeScript in existing JavaScript codebases', (SELECT id FROM public.categories WHERE slug = 'programming'), true);

-- Advanced TypeScript patterns and generics
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Advanced TypeScript patterns and generics', 'advanced-typescript-patterns', 'Master advanced TypeScript features including generics, utility types, and type inference', (SELECT id FROM public.categories WHERE slug = 'programming'), true);

-- Type-safe React applications with TypeScript
INSERT INTO public.topics (name, slug, description, category_id, is_active)
VALUES ('Type-safe React applications with TypeScript', 'type-safe-react-typescript', 'Build robust React applications with TypeScript for improved type safety and developer experience', (SELECT id FROM public.categories WHERE slug = 'frontend-development'), true);


-- ============================================================
-- TOPIC-COMPETENCY RELATIONSHIPS
-- ============================================================

-- Competencies for: Building interactive UIs with React
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'html'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-interactive-uis-with-react'),
  (SELECT id FROM public.competencies WHERE slug = 'css'),
  false;

-- Competencies for: Building web applications with Python
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'python'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'flask'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-web-applications-with-python'),
  (SELECT id FROM public.competencies WHERE slug = 'html'),
  false;

-- Competencies for: Conversational Spanish for travelers
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'conversational-spanish-for-travelers'),
  (SELECT id FROM public.competencies WHERE slug = 'spanish'),
  true;

-- Competencies for: Building reactive web applications with Vue.js
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-reactive-web-apps-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-reactive-web-apps-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-reactive-web-apps-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'html'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-reactive-web-apps-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'css'),
  false;

-- Competencies for: Building games for web browsers with Vue.js
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-browser-games-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'building-browser-games-vuejs'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Managing frontend state with Vue.js and Pinia
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'state-management-vuejs-pinia'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'state-management-vuejs-pinia'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Scaffold performant Vue.js applications with Nuxt
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'scaffold-vuejs-apps-nuxt'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'scaffold-vuejs-apps-nuxt'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Testing Vue.js applications with Jest
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'testing-vuejs-jest'),
  (SELECT id FROM public.competencies WHERE slug = 'vuejs'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'testing-vuejs-jest'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Enterprise-scale applications with Angular
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'enterprise-apps-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'enterprise-apps-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Progressive Web Apps with Angular
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'pwa-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'pwa-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Reactive forms in Angular applications
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'reactive-forms-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'reactive-forms-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Testing Angular applications with Jasmine
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'testing-angular-jasmine'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'testing-angular-jasmine'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Server-side rendering with Angular Universal
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'ssr-angular-universal'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'ssr-angular-universal'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: State management with NgRx in Angular
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'state-management-ngrx-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'angular'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'state-management-ngrx-angular'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Type-safe JavaScript development with TypeScript
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'type-safe-javascript-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'type-safe-javascript-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Building Node.js APIs with TypeScript
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'nodejs-apis-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'nodejs-apis-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Full-stack development with TypeScript
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'fullstack-development-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'fullstack-development-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Migrating JavaScript projects to TypeScript
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'migrating-javascript-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'migrating-javascript-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Advanced TypeScript patterns and generics
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'advanced-typescript-patterns'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'advanced-typescript-patterns'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

-- Competencies for: Type-safe React applications with TypeScript
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'type-safe-react-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'typescript'),
  true;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'type-safe-react-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'react'),
  false;
INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)
SELECT 
  (SELECT id FROM public.topics WHERE slug = 'type-safe-react-typescript'),
  (SELECT id FROM public.competencies WHERE slug = 'javascript'),
  false;

