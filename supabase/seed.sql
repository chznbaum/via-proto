-- Supabase Seed File
-- This file seeds the database with initial data
-- Run with: supabase db reset (drops and recreates with migrations + seeds)
-- Or: psql -h localhost -U postgres -d postgres -f supabase/seed.sql

-- Clear existing data (optional - use if reseeding)
TRUNCATE public.topic_synonyms, public.topics, public.unsplash_images CASCADE;

-- ============================================================
-- UNSPLASH IMAGES
-- ============================================================

-- man writing on paper
-- Usage: Used on /tos page for legal documentation illustration
INSERT INTO public.unsplash_images (photo_id, url, photographer, photographer_url, download_location)
VALUES ('OQMZwNd3ThU', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NDUyNjV8&ixlib=rb-4.1.0&q=80&w=1080', 'Scott Graham', 'https://unsplash.com/@amstram?utm_source=ViaProto&utm_medium=referral', 'https://api.unsplash.com/photos/OQMZwNd3ThU/download?ixid=M3w4MzI5NTB8MHwxfGFsbHx8fHx8fHx8fDE3NjM2NDUyNjV8');


-- ============================================================
-- TOPICS AND SYNONYMS
-- ============================================================

-- Category: Programming
-- React
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('React', 'react', 'Programming', 'JavaScript library for building user interfaces', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'React.js' FROM public.topics WHERE slug = 'react';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ReactJS' FROM public.topics WHERE slug = 'react';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'React Framework' FROM public.topics WHERE slug = 'react';

-- Vue.js
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Vue.js', 'vue-js', 'Programming', 'Progressive JavaScript framework', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vue' FROM public.topics WHERE slug = 'vue-js';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'VueJS' FROM public.topics WHERE slug = 'vue-js';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vue Framework' FROM public.topics WHERE slug = 'vue-js';

-- Angular
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Angular', 'angular', 'Programming', 'Platform for building web applications', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'AngularJS' FROM public.topics WHERE slug = 'angular';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Angular Framework' FROM public.topics WHERE slug = 'angular';

-- Node.js
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Node.js', 'node-js', 'Programming', 'JavaScript runtime built on Chrome''s V8 engine', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Node' FROM public.topics WHERE slug = 'node-js';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'NodeJS' FROM public.topics WHERE slug = 'node-js';

-- Python
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Python', 'python', 'Programming', 'High-level programming language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Python Programming' FROM public.topics WHERE slug = 'python';

-- JavaScript
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('JavaScript', 'javascript', 'Programming', 'Programming language of the web', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'JS' FROM public.topics WHERE slug = 'javascript';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ECMAScript' FROM public.topics WHERE slug = 'javascript';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ES6' FROM public.topics WHERE slug = 'javascript';

-- TypeScript
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('TypeScript', 'typescript', 'Programming', 'Typed superset of JavaScript', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'TS' FROM public.topics WHERE slug = 'typescript';

-- Java
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Java', 'java', 'Programming', 'Object-oriented programming language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Java Programming' FROM public.topics WHERE slug = 'java';

-- C++
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('C++', 'cpp', 'Programming', 'General-purpose programming language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'CPP' FROM public.topics WHERE slug = 'cpp';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'C Plus Plus' FROM public.topics WHERE slug = 'cpp';

-- C#
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('C#', 'csharp', 'Programming', 'Modern object-oriented language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'C Sharp' FROM public.topics WHERE slug = 'csharp';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'CSharp' FROM public.topics WHERE slug = 'csharp';

-- Go
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Go', 'go', 'Programming', 'Statically typed, compiled language by Google', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Golang' FROM public.topics WHERE slug = 'go';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Go Programming' FROM public.topics WHERE slug = 'go';

-- Rust
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Rust', 'rust', 'Programming', 'Systems programming language focused on safety', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Rust Programming' FROM public.topics WHERE slug = 'rust';

-- Swift
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Swift', 'swift', 'Programming', 'Programming language for iOS and macOS', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Swift Programming' FROM public.topics WHERE slug = 'swift';

-- Kotlin
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Kotlin', 'kotlin', 'Programming', 'Modern programming language for Android', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Kotlin Programming' FROM public.topics WHERE slug = 'kotlin';

-- PHP
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('PHP', 'php', 'Programming', 'Server-side scripting language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'PHP Programming' FROM public.topics WHERE slug = 'php';

-- Ruby
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Ruby', 'ruby', 'Programming', 'Dynamic, open source programming language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Ruby Programming' FROM public.topics WHERE slug = 'ruby';

-- Ruby on Rails
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Ruby on Rails', 'ruby-on-rails', 'Programming', 'Web application framework written in Ruby', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Rails' FROM public.topics WHERE slug = 'ruby-on-rails';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'RoR' FROM public.topics WHERE slug = 'ruby-on-rails';

-- Django
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Django', 'django', 'Programming', 'High-level Python web framework', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Django Framework' FROM public.topics WHERE slug = 'django';

-- Flask
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Flask', 'flask', 'Programming', 'Lightweight Python web framework', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Flask Framework' FROM public.topics WHERE slug = 'flask';

-- Express.js
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Express.js', 'express-js', 'Programming', 'Web framework for Node.js', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Express' FROM public.topics WHERE slug = 'express-js';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ExpressJS' FROM public.topics WHERE slug = 'express-js';

-- Next.js
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Next.js', 'next-js', 'Programming', 'React framework for production', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Next' FROM public.topics WHERE slug = 'next-js';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'NextJS' FROM public.topics WHERE slug = 'next-js';

-- Svelte
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Svelte', 'svelte', 'Programming', 'Cybernetically enhanced web apps', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'SvelteJS' FROM public.topics WHERE slug = 'svelte';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Svelte Framework' FROM public.topics WHERE slug = 'svelte';

-- SQL
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('SQL', 'sql', 'Programming', 'Language for managing relational databases', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Structured Query Language' FROM public.topics WHERE slug = 'sql';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Database Queries' FROM public.topics WHERE slug = 'sql';

-- PostgreSQL
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('PostgreSQL', 'postgresql', 'Programming', 'Advanced open source relational database', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Postgres' FROM public.topics WHERE slug = 'postgresql';

-- MySQL
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('MySQL', 'mysql', 'Programming', 'Popular open-source relational database', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'My SQL' FROM public.topics WHERE slug = 'mysql';

-- MongoDB
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('MongoDB', 'mongodb', 'Programming', 'NoSQL document database', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Mongo' FROM public.topics WHERE slug = 'mongodb';

-- Redis
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Redis', 'redis', 'Programming', 'In-memory data structure store', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Redis Database' FROM public.topics WHERE slug = 'redis';

-- GraphQL
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('GraphQL', 'graphql', 'Programming', 'Query language for APIs', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Graph QL' FROM public.topics WHERE slug = 'graphql';

-- REST API
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('REST API', 'rest-api', 'Programming', 'Architectural style for web services', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'RESTful API' FROM public.topics WHERE slug = 'rest-api';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'REST' FROM public.topics WHERE slug = 'rest-api';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'RESTful Services' FROM public.topics WHERE slug = 'rest-api';

-- Docker
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Docker', 'docker', 'Programming', 'Platform for containerization', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Docker Containers' FROM public.topics WHERE slug = 'docker';

-- Kubernetes
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Kubernetes', 'kubernetes', 'Programming', 'Container orchestration platform', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'K8s' FROM public.topics WHERE slug = 'kubernetes';

-- Git
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Git', 'git', 'Programming', 'Distributed version control system', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Git Version Control' FROM public.topics WHERE slug = 'git';

-- GitHub
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('GitHub', 'github', 'Programming', 'Code hosting platform', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Github' FROM public.topics WHERE slug = 'github';

-- AWS
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('AWS', 'aws', 'Programming', 'Cloud computing platform by Amazon', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Amazon Web Services' FROM public.topics WHERE slug = 'aws';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Amazon AWS' FROM public.topics WHERE slug = 'aws';

-- Azure
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Azure', 'azure', 'Programming', 'Cloud computing service by Microsoft', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Microsoft Azure' FROM public.topics WHERE slug = 'azure';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Azure Cloud' FROM public.topics WHERE slug = 'azure';

-- Google Cloud
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Google Cloud', 'google-cloud', 'Programming', 'Cloud computing services by Google', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'GCP' FROM public.topics WHERE slug = 'google-cloud';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Google Cloud Platform' FROM public.topics WHERE slug = 'google-cloud';

-- DevOps
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('DevOps', 'devops', 'Programming', 'Practices combining development and IT operations', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Dev Ops' FROM public.topics WHERE slug = 'devops';

-- CI/CD
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('CI/CD', 'ci-cd', 'Programming', 'Automated software delivery practices', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Continuous Integration' FROM public.topics WHERE slug = 'ci-cd';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Continuous Deployment' FROM public.topics WHERE slug = 'ci-cd';

-- Machine Learning
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Machine Learning', 'machine-learning', 'Programming', 'AI systems that learn from data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ML' FROM public.topics WHERE slug = 'machine-learning';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Machine Learning Fundamentals' FROM public.topics WHERE slug = 'machine-learning';

-- Deep Learning
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Deep Learning', 'deep-learning', 'Programming', 'Subset of machine learning using neural networks', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'DL' FROM public.topics WHERE slug = 'deep-learning';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Neural Networks' FROM public.topics WHERE slug = 'deep-learning';

-- TensorFlow
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('TensorFlow', 'tensorflow', 'Programming', 'Machine learning framework by Google', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Tensor Flow' FROM public.topics WHERE slug = 'tensorflow';

-- PyTorch
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('PyTorch', 'pytorch', 'Programming', 'Machine learning framework by Meta', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Py Torch' FROM public.topics WHERE slug = 'pytorch';

-- Data Structures
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Data Structures', 'data-structures', 'Programming', 'Ways of organizing and storing data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'DSA' FROM public.topics WHERE slug = 'data-structures';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Structures and Algorithms' FROM public.topics WHERE slug = 'data-structures';

-- Algorithms
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Algorithms', 'algorithms', 'Programming', 'Step-by-step procedures for calculations', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Algorithm Design' FROM public.topics WHERE slug = 'algorithms';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Algorithmic Thinking' FROM public.topics WHERE slug = 'algorithms';

-- System Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('System Design', 'system-design', 'Programming', 'Designing scalable software systems', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Systems Design' FROM public.topics WHERE slug = 'system-design';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Software Architecture' FROM public.topics WHERE slug = 'system-design';

-- Microservices
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Microservices', 'microservices', 'Programming', 'Architectural style for building applications', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Microservice Architecture' FROM public.topics WHERE slug = 'microservices';

-- Blockchain
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Blockchain', 'blockchain', 'Programming', 'Distributed ledger technology', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Blockchain Technology' FROM public.topics WHERE slug = 'blockchain';

-- Web3
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Web3', 'web3', 'Programming', 'Decentralized internet', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Web 3' FROM public.topics WHERE slug = 'web3';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Web 3.0' FROM public.topics WHERE slug = 'web3';

-- Solidity
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Solidity', 'solidity', 'Programming', 'Programming language for Ethereum smart contracts', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Solidity Programming' FROM public.topics WHERE slug = 'solidity';

-- Cybersecurity
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Cybersecurity', 'cybersecurity', 'Programming', 'Protection of computer systems from threats', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Cyber Security' FROM public.topics WHERE slug = 'cybersecurity';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Information Security' FROM public.topics WHERE slug = 'cybersecurity';

-- Category: Design
-- UI Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('UI Design', 'ui-design', 'Design', 'Designing user interfaces', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'User Interface Design' FROM public.topics WHERE slug = 'ui-design';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'UI/UX Design' FROM public.topics WHERE slug = 'ui-design';

-- UX Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('UX Design', 'ux-design', 'Design', 'Designing user experiences', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'User Experience Design' FROM public.topics WHERE slug = 'ux-design';

-- Figma
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Figma', 'figma', 'Design', 'Collaborative design tool', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Figma Design' FROM public.topics WHERE slug = 'figma';

-- Adobe XD
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Adobe XD', 'adobe-xd', 'Design', 'Vector-based design tool', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'XD' FROM public.topics WHERE slug = 'adobe-xd';

-- Sketch
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Sketch', 'sketch', 'Design', 'Digital design platform', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Sketch App' FROM public.topics WHERE slug = 'sketch';

-- Graphic Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Graphic Design', 'graphic-design', 'Design', 'Visual communication and problem-solving', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Graphics Design' FROM public.topics WHERE slug = 'graphic-design';

-- Logo Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Logo Design', 'logo-design', 'Design', 'Creating visual brand identities', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Brand Identity Design' FROM public.topics WHERE slug = 'logo-design';

-- Typography
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Typography', 'typography', 'Design', 'Art and technique of arranging type', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Type Design' FROM public.topics WHERE slug = 'typography';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Font Design' FROM public.topics WHERE slug = 'typography';

-- Color Theory
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Color Theory', 'color-theory', 'Design', 'Science of color interaction', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Colour Theory' FROM public.topics WHERE slug = 'color-theory';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Color Design' FROM public.topics WHERE slug = 'color-theory';

-- Adobe Photoshop
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Adobe Photoshop', 'adobe-photoshop', 'Design', 'Raster graphics editor', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Photoshop' FROM public.topics WHERE slug = 'adobe-photoshop';

-- Adobe Illustrator
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Adobe Illustrator', 'adobe-illustrator', 'Design', 'Vector graphics editor', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Illustrator' FROM public.topics WHERE slug = 'adobe-illustrator';

-- Motion Graphics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Motion Graphics', 'motion-graphics', 'Design', 'Creating animated graphics', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Motion Design' FROM public.topics WHERE slug = 'motion-graphics';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Animation' FROM public.topics WHERE slug = 'motion-graphics';

-- 3D Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('3D Design', '3d-design', 'Design', 'Creating three-dimensional digital models', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Three-Dimensional Design' FROM public.topics WHERE slug = '3d-design';

-- Blender
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Blender', 'blender', 'Design', '3D creation suite', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Blender 3D' FROM public.topics WHERE slug = 'blender';

-- Web Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Web Design', 'web-design', 'Design', 'Designing websites', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Website Design' FROM public.topics WHERE slug = 'web-design';

-- Mobile App Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Mobile App Design', 'mobile-app-design', 'Design', 'Designing mobile applications', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'App Design' FROM public.topics WHERE slug = 'mobile-app-design';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Mobile Design' FROM public.topics WHERE slug = 'mobile-app-design';

-- Prototyping
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Prototyping', 'prototyping', 'Design', 'Creating interactive mockups', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Design Prototyping' FROM public.topics WHERE slug = 'prototyping';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Interactive Prototypes' FROM public.topics WHERE slug = 'prototyping';

-- Wireframing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Wireframing', 'wireframing', 'Design', 'Creating basic layout sketches', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Wireframe Design' FROM public.topics WHERE slug = 'wireframing';

-- Design Systems
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Design Systems', 'design-systems', 'Design', 'Reusable design components and guidelines', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Design System' FROM public.topics WHERE slug = 'design-systems';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Component Libraries' FROM public.topics WHERE slug = 'design-systems';

-- Accessibility Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Accessibility Design', 'accessibility-design', 'Design', 'Designing for all users', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'A11y' FROM public.topics WHERE slug = 'accessibility-design';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Inclusive Design' FROM public.topics WHERE slug = 'accessibility-design';

-- Information Architecture
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Information Architecture', 'information-architecture', 'Design', 'Organizing and structuring information', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'IA' FROM public.topics WHERE slug = 'information-architecture';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Content Structure' FROM public.topics WHERE slug = 'information-architecture';

-- User Research
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('User Research', 'user-research', 'Design', 'Understanding user needs and behaviors', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'UX Research' FROM public.topics WHERE slug = 'user-research';

-- Usability Testing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Usability Testing', 'usability-testing', 'Design', 'Testing designs with real users', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'User Testing' FROM public.topics WHERE slug = 'usability-testing';

-- Interaction Design
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Interaction Design', 'interaction-design', 'Design', 'Designing interactive experiences', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'IxD' FROM public.topics WHERE slug = 'interaction-design';

-- Category: Data Science
-- Data Analysis
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Data Analysis', 'data-analysis', 'Data Science', 'Analyzing data to extract insights', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Analytics' FROM public.topics WHERE slug = 'data-analysis';

-- Data Visualization
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Data Visualization', 'data-visualization', 'Data Science', 'Visual representation of data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Viz' FROM public.topics WHERE slug = 'data-visualization';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'DataViz' FROM public.topics WHERE slug = 'data-visualization';

-- Statistics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Statistics', 'statistics', 'Data Science', 'Science of collecting and analyzing data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Statistical Analysis' FROM public.topics WHERE slug = 'statistics';

-- Probability
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Probability', 'probability', 'Data Science', 'Mathematics of chance and uncertainty', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Probability Theory' FROM public.topics WHERE slug = 'probability';

-- Python for Data Science
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Python for Data Science', 'python-for-data-science', 'Data Science', 'Using Python for data analysis', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Python Data Science' FROM public.topics WHERE slug = 'python-for-data-science';

-- R Programming
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('R Programming', 'r-programming', 'Data Science', 'Statistical programming language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'R Language' FROM public.topics WHERE slug = 'r-programming';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'R for Data Science' FROM public.topics WHERE slug = 'r-programming';

-- Pandas
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Pandas', 'pandas', 'Data Science', 'Data manipulation library for Python', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Python Pandas' FROM public.topics WHERE slug = 'pandas';

-- NumPy
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('NumPy', 'numpy', 'Data Science', 'Numerical computing library for Python', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Numerical Python' FROM public.topics WHERE slug = 'numpy';

-- Matplotlib
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Matplotlib', 'matplotlib', 'Data Science', 'Plotting library for Python', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Python Matplotlib' FROM public.topics WHERE slug = 'matplotlib';

-- Seaborn
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Seaborn', 'seaborn', 'Data Science', 'Statistical visualization library', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Python Seaborn' FROM public.topics WHERE slug = 'seaborn';

-- Tableau
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Tableau', 'tableau', 'Data Science', 'Data visualization platform', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Tableau Software' FROM public.topics WHERE slug = 'tableau';

-- Power BI
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Power BI', 'power-bi', 'Data Science', 'Business analytics service', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Microsoft Power BI' FROM public.topics WHERE slug = 'power-bi';

-- Excel
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Excel', 'excel', 'Data Science', 'Spreadsheet application', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Microsoft Excel' FROM public.topics WHERE slug = 'excel';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Spreadsheets' FROM public.topics WHERE slug = 'excel';

-- SQL for Data Analysis
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('SQL for Data Analysis', 'sql-for-data-analysis', 'Data Science', 'Using SQL for data analysis', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'SQL Analytics' FROM public.topics WHERE slug = 'sql-for-data-analysis';

-- Big Data
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Big Data', 'big-data', 'Data Science', 'Large-scale data processing', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Big Data Analytics' FROM public.topics WHERE slug = 'big-data';

-- Apache Spark
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Apache Spark', 'apache-spark', 'Data Science', 'Unified analytics engine', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Spark' FROM public.topics WHERE slug = 'apache-spark';

-- Hadoop
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Hadoop', 'hadoop', 'Data Science', 'Framework for distributed storage and processing', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Apache Hadoop' FROM public.topics WHERE slug = 'hadoop';

-- ETL
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('ETL', 'etl', 'Data Science', 'Data integration process', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Extract Transform Load' FROM public.topics WHERE slug = 'etl';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Pipeline' FROM public.topics WHERE slug = 'etl';

-- Data Engineering
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Data Engineering', 'data-engineering', 'Data Science', 'Building data infrastructure', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Pipeline Engineering' FROM public.topics WHERE slug = 'data-engineering';

-- Data Warehousing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Data Warehousing', 'data-warehousing', 'Data Science', 'Central repository of integrated data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Data Warehouse' FROM public.topics WHERE slug = 'data-warehousing';

-- Business Intelligence
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Business Intelligence', 'business-intelligence', 'Data Science', 'Technologies for analyzing business data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'BI' FROM public.topics WHERE slug = 'business-intelligence';

-- A/B Testing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('A/B Testing', 'a-b-testing', 'Data Science', 'Comparing two versions to determine better performance', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Split Testing' FROM public.topics WHERE slug = 'a-b-testing';

-- Predictive Analytics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Predictive Analytics', 'predictive-analytics', 'Data Science', 'Using data to predict future outcomes', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Predictive Modeling' FROM public.topics WHERE slug = 'predictive-analytics';

-- Time Series Analysis
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Time Series Analysis', 'time-series-analysis', 'Data Science', 'Analyzing data points over time', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Time Series' FROM public.topics WHERE slug = 'time-series-analysis';

-- Category: Business
-- Product Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Product Management', 'product-management', 'Business', 'Managing product development lifecycle', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Product Manager' FROM public.topics WHERE slug = 'product-management';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'PM' FROM public.topics WHERE slug = 'product-management';

-- Project Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Project Management', 'project-management', 'Business', 'Planning and executing projects', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'PM' FROM public.topics WHERE slug = 'project-management';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Project Manager' FROM public.topics WHERE slug = 'project-management';

-- Agile
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Agile', 'agile', 'Business', 'Iterative development approach', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Agile Methodology' FROM public.topics WHERE slug = 'agile';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Agile Development' FROM public.topics WHERE slug = 'agile';

-- Scrum
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Scrum', 'scrum', 'Business', 'Agile framework for project management', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Scrum Framework' FROM public.topics WHERE slug = 'scrum';

-- Entrepreneurship
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Entrepreneurship', 'entrepreneurship', 'Business', 'Starting and running a business', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Starting a Business' FROM public.topics WHERE slug = 'entrepreneurship';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Entrepreneurial Skills' FROM public.topics WHERE slug = 'entrepreneurship';

-- Business Strategy
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Business Strategy', 'business-strategy', 'Business', 'Long-term business planning', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Strategic Planning' FROM public.topics WHERE slug = 'business-strategy';

-- Marketing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Marketing', 'marketing', 'Business', 'Promoting and selling products', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Marketing Strategy' FROM public.topics WHERE slug = 'marketing';

-- Digital Marketing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Digital Marketing', 'digital-marketing', 'Business', 'Marketing through digital channels', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Online Marketing' FROM public.topics WHERE slug = 'digital-marketing';

-- Content Marketing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Content Marketing', 'content-marketing', 'Business', 'Marketing through valuable content', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Content Strategy' FROM public.topics WHERE slug = 'content-marketing';

-- SEO
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('SEO', 'seo', 'Business', 'Optimizing for search engines', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Search Engine Optimization' FROM public.topics WHERE slug = 'seo';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'SEO Marketing' FROM public.topics WHERE slug = 'seo';

-- Social Media Marketing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Social Media Marketing', 'social-media-marketing', 'Business', 'Marketing through social platforms', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'SMM' FROM public.topics WHERE slug = 'social-media-marketing';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Social Marketing' FROM public.topics WHERE slug = 'social-media-marketing';

-- Email Marketing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Email Marketing', 'email-marketing', 'Business', 'Marketing through email', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Email Campaigns' FROM public.topics WHERE slug = 'email-marketing';

-- Copywriting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Copywriting', 'copywriting', 'Business', 'Writing persuasive content', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Copy Writing' FROM public.topics WHERE slug = 'copywriting';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Marketing Copy' FROM public.topics WHERE slug = 'copywriting';

-- Sales
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Sales', 'sales', 'Business', 'Selling products or services', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Sales Skills' FROM public.topics WHERE slug = 'sales';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Selling' FROM public.topics WHERE slug = 'sales';

-- Negotiation
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Negotiation', 'negotiation', 'Business', 'Reaching mutual agreements', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Negotiation Skills' FROM public.topics WHERE slug = 'negotiation';

-- Leadership
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Leadership', 'leadership', 'Business', 'Leading and inspiring others', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Leadership Skills' FROM public.topics WHERE slug = 'leadership';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Management' FROM public.topics WHERE slug = 'leadership';

-- Public Speaking
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Public Speaking', 'public-speaking', 'Business', 'Speaking to audiences', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Presentation Skills' FROM public.topics WHERE slug = 'public-speaking';

-- Business Writing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Business Writing', 'business-writing', 'Business', 'Writing for business contexts', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Professional Writing' FROM public.topics WHERE slug = 'business-writing';

-- Financial Analysis
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Financial Analysis', 'financial-analysis', 'Business', 'Analyzing financial data', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Finance' FROM public.topics WHERE slug = 'financial-analysis';

-- Accounting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Accounting', 'accounting', 'Business', 'Recording and reporting financial transactions', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Business Accounting' FROM public.topics WHERE slug = 'accounting';

-- Economics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Economics', 'economics', 'Business', 'Study of resource allocation', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Economic Theory' FROM public.topics WHERE slug = 'economics';

-- Supply Chain Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Supply Chain Management', 'supply-chain-management', 'Business', 'Managing flow of goods and services', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'SCM' FROM public.topics WHERE slug = 'supply-chain-management';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Logistics' FROM public.topics WHERE slug = 'supply-chain-management';

-- Operations Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Operations Management', 'operations-management', 'Business', 'Managing business operations', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Operations' FROM public.topics WHERE slug = 'operations-management';

-- Human Resources
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Human Resources', 'human-resources', 'Business', 'Managing employees and workplace', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'HR' FROM public.topics WHERE slug = 'human-resources';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'People Management' FROM public.topics WHERE slug = 'human-resources';

-- Organizational Behavior
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Organizational Behavior', 'organizational-behavior', 'Business', 'Study of human behavior in organizations', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'OB' FROM public.topics WHERE slug = 'organizational-behavior';

-- Category: Language Learning
-- Spanish
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Spanish', 'spanish', 'Language Learning', 'Learning Spanish language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Spanish Language' FROM public.topics WHERE slug = 'spanish';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Spanish' FROM public.topics WHERE slug = 'spanish';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Español' FROM public.topics WHERE slug = 'spanish';

-- French
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('French', 'french', 'Language Learning', 'Learning French language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'French Language' FROM public.topics WHERE slug = 'french';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn French' FROM public.topics WHERE slug = 'french';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Français' FROM public.topics WHERE slug = 'french';

-- German
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('German', 'german', 'Language Learning', 'Learning German language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'German Language' FROM public.topics WHERE slug = 'german';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn German' FROM public.topics WHERE slug = 'german';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Deutsch' FROM public.topics WHERE slug = 'german';

-- Italian
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Italian', 'italian', 'Language Learning', 'Learning Italian language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Italian Language' FROM public.topics WHERE slug = 'italian';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Italian' FROM public.topics WHERE slug = 'italian';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Italiano' FROM public.topics WHERE slug = 'italian';

-- Mandarin Chinese
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Mandarin Chinese', 'mandarin-chinese', 'Language Learning', 'Learning Mandarin Chinese', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Chinese' FROM public.topics WHERE slug = 'mandarin-chinese';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Mandarin' FROM public.topics WHERE slug = 'mandarin-chinese';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, '中文' FROM public.topics WHERE slug = 'mandarin-chinese';

-- Japanese
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Japanese', 'japanese', 'Language Learning', 'Learning Japanese language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Japanese Language' FROM public.topics WHERE slug = 'japanese';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Japanese' FROM public.topics WHERE slug = 'japanese';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, '日本語' FROM public.topics WHERE slug = 'japanese';

-- Korean
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Korean', 'korean', 'Language Learning', 'Learning Korean language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Korean Language' FROM public.topics WHERE slug = 'korean';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Korean' FROM public.topics WHERE slug = 'korean';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, '한국어' FROM public.topics WHERE slug = 'korean';

-- Arabic
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Arabic', 'arabic', 'Language Learning', 'Learning Arabic language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Arabic Language' FROM public.topics WHERE slug = 'arabic';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Arabic' FROM public.topics WHERE slug = 'arabic';

-- Portuguese
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Portuguese', 'portuguese', 'Language Learning', 'Learning Portuguese language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Portuguese Language' FROM public.topics WHERE slug = 'portuguese';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Portuguese' FROM public.topics WHERE slug = 'portuguese';

-- Russian
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Russian', 'russian', 'Language Learning', 'Learning Russian language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Russian Language' FROM public.topics WHERE slug = 'russian';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Russian' FROM public.topics WHERE slug = 'russian';

-- Hindi
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Hindi', 'hindi', 'Language Learning', 'Learning Hindi language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Hindi Language' FROM public.topics WHERE slug = 'hindi';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Hindi' FROM public.topics WHERE slug = 'hindi';

-- English as a Second Language
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('English as a Second Language', 'english-as-a-second-language', 'Language Learning', 'Learning English as a second language', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ESL' FROM public.topics WHERE slug = 'english-as-a-second-language';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'English for Non-Native Speakers' FROM public.topics WHERE slug = 'english-as-a-second-language';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ESOL' FROM public.topics WHERE slug = 'english-as-a-second-language';

-- Grammar
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Grammar', 'grammar', 'Language Learning', 'Understanding language structure', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'English Grammar' FROM public.topics WHERE slug = 'grammar';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Language Grammar' FROM public.topics WHERE slug = 'grammar';

-- Vocabulary Building
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Vocabulary Building', 'vocabulary-building', 'Language Learning', 'Expanding language vocabulary', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vocabulary' FROM public.topics WHERE slug = 'vocabulary-building';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Word Learning' FROM public.topics WHERE slug = 'vocabulary-building';

-- Pronunciation
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Pronunciation', 'pronunciation', 'Language Learning', 'Improving language pronunciation', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Speaking Skills' FROM public.topics WHERE slug = 'pronunciation';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Accent Training' FROM public.topics WHERE slug = 'pronunciation';

-- Category: Mathematics
-- Algebra
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Algebra', 'algebra', 'Mathematics', 'Mathematical symbols and rules', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Algebraic Thinking' FROM public.topics WHERE slug = 'algebra';

-- Calculus
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Calculus', 'calculus', 'Mathematics', 'Study of continuous change', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Differential Calculus' FROM public.topics WHERE slug = 'calculus';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Integral Calculus' FROM public.topics WHERE slug = 'calculus';

-- Linear Algebra
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Linear Algebra', 'linear-algebra', 'Mathematics', 'Study of linear equations and transformations', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Matrices' FROM public.topics WHERE slug = 'linear-algebra';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vector Spaces' FROM public.topics WHERE slug = 'linear-algebra';

-- Discrete Mathematics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Discrete Mathematics', 'discrete-mathematics', 'Mathematics', 'Mathematics of discrete structures', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Discrete Math' FROM public.topics WHERE slug = 'discrete-mathematics';

-- Trigonometry
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Trigonometry', 'trigonometry', 'Mathematics', 'Study of triangles and angles', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Trig' FROM public.topics WHERE slug = 'trigonometry';

-- Geometry
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Geometry', 'geometry', 'Mathematics', 'Study of shapes and spaces', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Euclidean Geometry' FROM public.topics WHERE slug = 'geometry';

-- Differential Equations
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Differential Equations', 'differential-equations', 'Mathematics', 'Equations involving derivatives', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'ODEs' FROM public.topics WHERE slug = 'differential-equations';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'PDEs' FROM public.topics WHERE slug = 'differential-equations';

-- Number Theory
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Number Theory', 'number-theory', 'Mathematics', 'Study of integers and properties', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Theory of Numbers' FROM public.topics WHERE slug = 'number-theory';

-- Combinatorics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Combinatorics', 'combinatorics', 'Mathematics', 'Study of counting and arrangement', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Combinatorial Mathematics' FROM public.topics WHERE slug = 'combinatorics';

-- Graph Theory
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Graph Theory', 'graph-theory', 'Mathematics', 'Study of graphs and networks', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Network Theory' FROM public.topics WHERE slug = 'graph-theory';

-- Mathematical Logic
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Mathematical Logic', 'mathematical-logic', 'Mathematics', 'Study of formal logic', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Symbolic Logic' FROM public.topics WHERE slug = 'mathematical-logic';

-- Set Theory
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Set Theory', 'set-theory', 'Mathematics', 'Study of collections of objects', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Sets' FROM public.topics WHERE slug = 'set-theory';

-- Category: Science
-- Physics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Physics', 'physics', 'Science', 'Study of matter and energy', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Classical Physics' FROM public.topics WHERE slug = 'physics';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Modern Physics' FROM public.topics WHERE slug = 'physics';

-- Chemistry
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Chemistry', 'chemistry', 'Science', 'Study of matter and its properties', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Chemical Science' FROM public.topics WHERE slug = 'chemistry';

-- Biology
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Biology', 'biology', 'Science', 'Study of living organisms', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Life Sciences' FROM public.topics WHERE slug = 'biology';

-- Astronomy
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Astronomy', 'astronomy', 'Science', 'Study of celestial objects', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Astrophysics' FROM public.topics WHERE slug = 'astronomy';

-- Genetics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Genetics', 'genetics', 'Science', 'Study of genes and heredity', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Molecular Genetics' FROM public.topics WHERE slug = 'genetics';

-- Quantum Mechanics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Quantum Mechanics', 'quantum-mechanics', 'Science', 'Physics of atomic and subatomic particles', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Quantum Physics' FROM public.topics WHERE slug = 'quantum-mechanics';

-- Environmental Science
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Environmental Science', 'environmental-science', 'Science', 'Study of the environment', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Environmental Studies' FROM public.topics WHERE slug = 'environmental-science';

-- Neuroscience
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Neuroscience', 'neuroscience', 'Science', 'Study of the nervous system', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Brain Science' FROM public.topics WHERE slug = 'neuroscience';

-- Anatomy
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Anatomy', 'anatomy', 'Science', 'Study of body structure', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Human Anatomy' FROM public.topics WHERE slug = 'anatomy';

-- Physiology
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Physiology', 'physiology', 'Science', 'Study of body functions', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Human Physiology' FROM public.topics WHERE slug = 'physiology';

-- Microbiology
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Microbiology', 'microbiology', 'Science', 'Study of microscopic organisms', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Study of Microorganisms' FROM public.topics WHERE slug = 'microbiology';

-- Ecology
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Ecology', 'ecology', 'Science', 'Study of organisms and environment', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Ecological Science' FROM public.topics WHERE slug = 'ecology';

-- Category: Personal Development
-- Time Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Time Management', 'time-management', 'Personal Development', 'Managing time effectively', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Productivity' FROM public.topics WHERE slug = 'time-management';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Time Optimization' FROM public.topics WHERE slug = 'time-management';

-- Goal Setting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Goal Setting', 'goal-setting', 'Personal Development', 'Setting and achieving goals', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Setting Goals' FROM public.topics WHERE slug = 'goal-setting';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Objectives' FROM public.topics WHERE slug = 'goal-setting';

-- Mindfulness
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Mindfulness', 'mindfulness', 'Personal Development', 'Being present and aware', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Meditation' FROM public.topics WHERE slug = 'mindfulness';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Present Moment Awareness' FROM public.topics WHERE slug = 'mindfulness';

-- Emotional Intelligence
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Emotional Intelligence', 'emotional-intelligence', 'Personal Development', 'Understanding and managing emotions', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'EQ' FROM public.topics WHERE slug = 'emotional-intelligence';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Emotional Quotient' FROM public.topics WHERE slug = 'emotional-intelligence';

-- Critical Thinking
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Critical Thinking', 'critical-thinking', 'Personal Development', 'Thinking clearly and rationally', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Analytical Thinking' FROM public.topics WHERE slug = 'critical-thinking';

-- Problem Solving
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Problem Solving', 'problem-solving', 'Personal Development', 'Finding solutions to challenges', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Problem-Solving Skills' FROM public.topics WHERE slug = 'problem-solving';

-- Decision Making
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Decision Making', 'decision-making', 'Personal Development', 'Making effective decisions', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Decision-Making Skills' FROM public.topics WHERE slug = 'decision-making';

-- Communication Skills
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Communication Skills', 'communication-skills', 'Personal Development', 'Communicating clearly and effectively', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Effective Communication' FROM public.topics WHERE slug = 'communication-skills';

-- Conflict Resolution
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Conflict Resolution', 'conflict-resolution', 'Personal Development', 'Resolving disagreements', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Conflict Management' FROM public.topics WHERE slug = 'conflict-resolution';

-- Memory Improvement
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Memory Improvement', 'memory-improvement', 'Personal Development', 'Enhancing memory capacity', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Memory Techniques' FROM public.topics WHERE slug = 'memory-improvement';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Mnemonics' FROM public.topics WHERE slug = 'memory-improvement';

-- Speed Reading
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Speed Reading', 'speed-reading', 'Personal Development', 'Reading faster while comprehending', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Fast Reading' FROM public.topics WHERE slug = 'speed-reading';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Rapid Reading' FROM public.topics WHERE slug = 'speed-reading';

-- Note-Taking
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Note-Taking', 'note-taking', 'Personal Development', 'Capturing information effectively', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Note Taking Skills' FROM public.topics WHERE slug = 'note-taking';

-- Study Skills
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Study Skills', 'study-skills', 'Personal Development', 'Effective learning techniques', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learning How to Learn' FROM public.topics WHERE slug = 'study-skills';

-- Habit Formation
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Habit Formation', 'habit-formation', 'Personal Development', 'Creating positive habits', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Building Habits' FROM public.topics WHERE slug = 'habit-formation';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Habit Building' FROM public.topics WHERE slug = 'habit-formation';

-- Stress Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Stress Management', 'stress-management', 'Personal Development', 'Managing and reducing stress', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Stress Relief' FROM public.topics WHERE slug = 'stress-management';

-- Category: Creative Arts
-- Photography
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Photography', 'photography', 'Creative Arts', 'Art of capturing images', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Digital Photography' FROM public.topics WHERE slug = 'photography';

-- Video Editing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Video Editing', 'video-editing', 'Creative Arts', 'Editing video content', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Video Production' FROM public.topics WHERE slug = 'video-editing';

-- Music Theory
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Music Theory', 'music-theory', 'Creative Arts', 'Understanding music structure', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Musical Theory' FROM public.topics WHERE slug = 'music-theory';

-- Guitar
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Guitar', 'guitar', 'Creative Arts', 'Playing the guitar', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Guitar Playing' FROM public.topics WHERE slug = 'guitar';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Guitar' FROM public.topics WHERE slug = 'guitar';

-- Piano
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Piano', 'piano', 'Creative Arts', 'Playing the piano', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Piano Playing' FROM public.topics WHERE slug = 'piano';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Learn Piano' FROM public.topics WHERE slug = 'piano';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Keyboard' FROM public.topics WHERE slug = 'piano';

-- Drawing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Drawing', 'drawing', 'Creative Arts', 'Creating art with pencils or pens', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Sketching' FROM public.topics WHERE slug = 'drawing';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Illustration' FROM public.topics WHERE slug = 'drawing';

-- Painting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Painting', 'painting', 'Creative Arts', 'Creating art with paints', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Fine Art Painting' FROM public.topics WHERE slug = 'painting';

-- Digital Art
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Digital Art', 'digital-art', 'Creative Arts', 'Creating art digitally', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Digital Illustration' FROM public.topics WHERE slug = 'digital-art';

-- Creative Writing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Creative Writing', 'creative-writing', 'Creative Arts', 'Writing creatively', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Fiction Writing' FROM public.topics WHERE slug = 'creative-writing';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Storytelling' FROM public.topics WHERE slug = 'creative-writing';

-- Screenwriting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Screenwriting', 'screenwriting', 'Creative Arts', 'Writing scripts for films/TV', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Script Writing' FROM public.topics WHERE slug = 'screenwriting';

-- Poetry
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Poetry', 'poetry', 'Creative Arts', 'Writing poems', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Poetic Writing' FROM public.topics WHERE slug = 'poetry';

-- Singing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Singing', 'singing', 'Creative Arts', 'Developing singing skills', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vocal Training' FROM public.topics WHERE slug = 'singing';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Voice Lessons' FROM public.topics WHERE slug = 'singing';

-- Acting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Acting', 'acting', 'Creative Arts', 'Performing arts', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Theatre' FROM public.topics WHERE slug = 'acting';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Drama' FROM public.topics WHERE slug = 'acting';

-- Film Making
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Film Making', 'film-making', 'Creative Arts', 'Creating films', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Filmmaking' FROM public.topics WHERE slug = 'film-making';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Video Production' FROM public.topics WHERE slug = 'film-making';

-- Animation
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Animation', 'animation', 'Creative Arts', 'Creating animated content', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, '2D Animation' FROM public.topics WHERE slug = 'animation';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, '3D Animation' FROM public.topics WHERE slug = 'animation';

-- Category: Health & Fitness
-- Yoga
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Yoga', 'yoga', 'Health & Fitness', 'Mind-body practice', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Hatha Yoga' FROM public.topics WHERE slug = 'yoga';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Vinyasa Yoga' FROM public.topics WHERE slug = 'yoga';

-- Meditation
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Meditation', 'meditation', 'Health & Fitness', 'Mental training practice', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Mindfulness Meditation' FROM public.topics WHERE slug = 'meditation';

-- Weight Training
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Weight Training', 'weight-training', 'Health & Fitness', 'Building muscle strength', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Strength Training' FROM public.topics WHERE slug = 'weight-training';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Resistance Training' FROM public.topics WHERE slug = 'weight-training';

-- Cardio Fitness
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Cardio Fitness', 'cardio-fitness', 'Health & Fitness', 'Heart-healthy exercise', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Cardiovascular Exercise' FROM public.topics WHERE slug = 'cardio-fitness';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Aerobic Exercise' FROM public.topics WHERE slug = 'cardio-fitness';

-- Running
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Running', 'running', 'Health & Fitness', 'Running for fitness', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Jogging' FROM public.topics WHERE slug = 'running';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Marathon Training' FROM public.topics WHERE slug = 'running';

-- Nutrition
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Nutrition', 'nutrition', 'Health & Fitness', 'Understanding food and health', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Healthy Eating' FROM public.topics WHERE slug = 'nutrition';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Nutritional Science' FROM public.topics WHERE slug = 'nutrition';

-- Meal Planning
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Meal Planning', 'meal-planning', 'Health & Fitness', 'Planning healthy meals', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Meal Prep' FROM public.topics WHERE slug = 'meal-planning';

-- Pilates
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Pilates', 'pilates', 'Health & Fitness', 'Low-impact exercise method', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Pilates Training' FROM public.topics WHERE slug = 'pilates';

-- CrossFit
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('CrossFit', 'crossfit', 'Health & Fitness', 'High-intensity functional training', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Cross Fit' FROM public.topics WHERE slug = 'crossfit';

-- Bodybuilding
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Bodybuilding', 'bodybuilding', 'Health & Fitness', 'Building muscle mass', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Body Building' FROM public.topics WHERE slug = 'bodybuilding';

-- Calisthenics
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Calisthenics', 'calisthenics', 'Health & Fitness', 'Exercise using body weight', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Bodyweight Training' FROM public.topics WHERE slug = 'calisthenics';

-- Stretching
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Stretching', 'stretching', 'Health & Fitness', 'Improving flexibility', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Flexibility Training' FROM public.topics WHERE slug = 'stretching';

-- Sports Nutrition
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Sports Nutrition', 'sports-nutrition', 'Health & Fitness', 'Nutrition for athletes', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Athletic Nutrition' FROM public.topics WHERE slug = 'sports-nutrition';

-- Mental Health
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Mental Health', 'mental-health', 'Health & Fitness', 'Emotional and psychological health', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Psychological Well-being' FROM public.topics WHERE slug = 'mental-health';

-- Sleep Science
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Sleep Science', 'sleep-science', 'Health & Fitness', 'Understanding and improving sleep', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Sleep Hygiene' FROM public.topics WHERE slug = 'sleep-science';

-- Category: Finance
-- Personal Finance
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Personal Finance', 'personal-finance', 'Finance', 'Managing personal money', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Money Management' FROM public.topics WHERE slug = 'personal-finance';

-- Investing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Investing', 'investing', 'Finance', 'Investing money for returns', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Investment' FROM public.topics WHERE slug = 'investing';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Stock Market' FROM public.topics WHERE slug = 'investing';

-- Stock Market
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Stock Market', 'stock-market', 'Finance', 'Trading stocks', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Stocks' FROM public.topics WHERE slug = 'stock-market';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Equity Trading' FROM public.topics WHERE slug = 'stock-market';

-- Cryptocurrency
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Cryptocurrency', 'cryptocurrency', 'Finance', 'Digital currencies and blockchain', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Crypto' FROM public.topics WHERE slug = 'cryptocurrency';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Digital Currency' FROM public.topics WHERE slug = 'cryptocurrency';

-- Real Estate Investing
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Real Estate Investing', 'real-estate-investing', 'Finance', 'Investing in properties', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Property Investment' FROM public.topics WHERE slug = 'real-estate-investing';

-- Retirement Planning
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Retirement Planning', 'retirement-planning', 'Finance', 'Planning for retirement', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Retirement Savings' FROM public.topics WHERE slug = 'retirement-planning';

-- Budgeting
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Budgeting', 'budgeting', 'Finance', 'Creating and managing budgets', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Budget Planning' FROM public.topics WHERE slug = 'budgeting';

-- Tax Planning
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Tax Planning', 'tax-planning', 'Finance', 'Planning for taxes', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Tax Strategy' FROM public.topics WHERE slug = 'tax-planning';

-- Financial Literacy
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Financial Literacy', 'financial-literacy', 'Finance', 'Understanding money and finance', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Money Skills' FROM public.topics WHERE slug = 'financial-literacy';

-- Trading
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Trading', 'trading', 'Finance', 'Buying and selling securities', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Day Trading' FROM public.topics WHERE slug = 'trading';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Active Trading' FROM public.topics WHERE slug = 'trading';

-- Options Trading
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Options Trading', 'options-trading', 'Finance', 'Trading options contracts', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Stock Options' FROM public.topics WHERE slug = 'options-trading';

-- Forex Trading
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Forex Trading', 'forex-trading', 'Finance', 'Trading foreign currencies', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Currency Trading' FROM public.topics WHERE slug = 'forex-trading';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'FX Trading' FROM public.topics WHERE slug = 'forex-trading';

-- Credit Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Credit Management', 'credit-management', 'Finance', 'Managing credit effectively', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Credit Score' FROM public.topics WHERE slug = 'credit-management';
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Credit Building' FROM public.topics WHERE slug = 'credit-management';

-- Debt Management
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Debt Management', 'debt-management', 'Finance', 'Managing and reducing debt', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Debt Reduction' FROM public.topics WHERE slug = 'debt-management';

-- Insurance
INSERT INTO public.topics (name, slug, category, description, is_active)
VALUES ('Insurance', 'insurance', 'Finance', 'Understanding insurance products', true);
INSERT INTO public.topic_synonyms (topic_id, synonym)
SELECT id, 'Insurance Planning' FROM public.topics WHERE slug = 'insurance';

