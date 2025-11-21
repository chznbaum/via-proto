#!/usr/bin/env tsx

/**
 * Split the monolithic topics_seed_new_structure.json into modular seed files
 * This script reads the current JSON and splits it into:
 * - data/seeds/categories.json (flat structure with parent_slug)
 * - data/seeds/competencies/{domain}.json
 * - data/seeds/topics/{domain}.json
 * - data/seeds/unsplash_images.json
 */

import fs from 'fs';
import path from 'path';

// Icon mapping from old format to iconify format (lucide set)
const iconMap: Record<string, string> = {
  ComputerDesktopIcon: 'lucide:computer',
  CodeBracketIcon: 'lucide:code-2',
  GlobeAltIcon: 'lucide:globe',
  DevicePhoneMobileIcon: 'lucide:smartphone',
  CircleStackIcon: 'lucide:database',
  ServerIcon: 'lucide:server',
  PuzzlePieceIcon: 'lucide:puzzle',
  CpuChipIcon: 'lucide:cpu',
  CheckCircleIcon: 'lucide:check-circle-2',
  ChartBarIcon: 'lucide:bar-chart-3',
  BeakerIcon: 'lucide:flask-conical',
  CloudIcon: 'lucide:cloud',
  ShieldCheckIcon: 'lucide:shield-check',
  LockClosedIcon: 'lucide:lock',
  PaintBrushIcon: 'lucide:paintbrush',
  PhotoIcon: 'lucide:image',
  FilmIcon: 'lucide:film',
  MusicalNoteIcon: 'lucide:music',
  CameraIcon: 'lucide:camera',
  PencilIcon: 'lucide:pencil',
  BriefcaseIcon: 'lucide:briefcase',
  AcademicCapIcon: 'lucide:graduation-cap',
  ChatBubbleLeftRightIcon: 'lucide:messages-square',
  LanguageIcon: 'lucide:languages',
  CalculatorIcon: 'lucide:calculator',
  ScaleIcon: 'lucide:scale',
  BuildingLibraryIcon: 'lucide:landmark',
  SparklesIcon: 'lucide:sparkles',
  HeartIcon: 'lucide:heart',
  UserGroupIcon: 'lucide:users',
};

interface Category {
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  parent_slug: string | null;
  subcategories?: Category[];
}

interface Competency {
  name: string;
  slug: string;
  description: string;
  category_slug: string;
  synonyms?: string[];
  icon?: string;
}

interface CompetencyPrerequisite {
  competency_slug: string;
  prerequisite_slug: string;
  prerequisite_level: string;
  notes?: string;
}

interface CompetencyAlternative {
  competency_slug: string;
  alternative_slug: string;
  relationship_type: string;
  notes?: string;
}

interface Topic {
  name: string;
  slug: string;
  description: string;
  category_slug: string;
  competencies: {
    competency_slug: string;
    is_primary: boolean;
  }[];
}

interface SeedData {
  categories: Category[];
  competencies: Competency[];
  competency_prerequisites: CompetencyPrerequisite[];
  competency_alternatives: CompetencyAlternative[];
  topics: Topic[];
}

// Domain mapping for competencies and topics
const domainMap: Record<string, string> = {
  'programming': 'programming',
  'frontend-development': 'web-development',
  'backend-development': 'web-development',
  'fullstack-development': 'web-development',
  'web-development': 'web-development',
  'mobile-development': 'programming',
  'game-development': 'programming',
  'systems-programming': 'programming',
  'software-testing': 'programming',
  'data-science': 'data-science',
  'data-engineering': 'data-science',
  'databases': 'data-science',
  'data-analytics': 'data-science',
  'cloud-devops': 'web-development',
  'information-security': 'programming',
  'cybersecurity': 'programming',
  'uiux-design': 'design',
  'graphic-design': 'design',
  'motion-3d': 'design',
  'photography-video': 'creative-arts',
  'music': 'creative-arts',
  'writing': 'creative-arts',
  'theater': 'creative-arts',
  'visual-arts': 'creative-arts',
  'design-creativity': 'design',
  'creative-arts': 'creative-arts',
  'business-management': 'business',
  'entrepreneurship': 'business',
  'marketing-sales': 'business',
  'project-management': 'business',
  'finance-accounting': 'finance',
  'linguistics': 'languages',
  'natural-languages': 'languages',
  'constructed-languages': 'languages',
  'mathematics': 'mathematics',
  'algebra': 'mathematics',
  'geometry-trigonometry': 'mathematics',
  'calculus-analysis': 'mathematics',
  'science': 'science',
  'physical-sciences': 'science',
  'life-sciences': 'science',
  'earth-environmental-sciences': 'science',
  'personal-development': 'personal-development',
  'productivity-organization': 'personal-development',
  'communication-skills': 'personal-development',
  'leadership-management': 'business',
  'health-fitness': 'health-fitness',
  'physical-fitness': 'health-fitness',
  'nutrition': 'health-fitness',
  'mental-health': 'health-fitness',
};

function flattenCategories(categories: Category[], parentSlug: string | null = null): Category[] {
  const result: Category[] = [];

  for (const category of categories) {
    const { subcategories, ...flatCategory } = category;

    // Convert icon to iconify format
    const icon = iconMap[category.icon] || category.icon;

    result.push({
      ...flatCategory,
      icon,
      parent_slug: parentSlug,
    });

    if (subcategories && subcategories.length > 0) {
      result.push(...flattenCategories(subcategories, category.slug));
    }
  }

  return result;
}

function addNewCategories(categories: Category[]): Category[] {
  // Add new top-level categories
  const newCategories: Category[] = [
    {
      name: 'Home & Lifestyle',
      slug: 'home-lifestyle',
      description: 'Practical skills for home, garden, and daily living',
      icon: 'lucide:home',
      display_order: 9,
      parent_slug: null,
    },
    {
      name: 'Recreation & Hobbies',
      slug: 'recreation-hobbies',
      description: 'Games, sports, and recreational activities',
      icon: 'lucide:gamepad-2',
      display_order: 10,
      parent_slug: null,
    },
  ];

  // Add Fiber Arts & Crafts under Design & Creativity
  const fiberArts: Category = {
    name: 'Fiber Arts & Crafts',
    slug: 'fiber-arts-crafts',
    description: 'Textile arts, sewing, knitting, and fiber crafts',
    icon: 'lucide:scissors',
    display_order: 5,
    parent_slug: 'design-creativity',
  };

  return [...categories, ...newCategories, fiberArts];
}

function groupCompetenciesByDomain(
  competencies: Competency[],
  prerequisites: CompetencyPrerequisite[],
  alternatives: CompetencyAlternative[]
): Record<string, any> {
  const grouped: Record<string, any> = {};

  for (const comp of competencies) {
    const domain = domainMap[comp.category_slug] || 'programming';

    if (!grouped[domain]) {
      grouped[domain] = { competencies: [] };
    }

    // Find prerequisites and alternatives for this competency
    const compPrereqs = prerequisites.filter(p => p.competency_slug === comp.slug);
    const compAlts = alternatives.filter(a => a.competency_slug === comp.slug);

    // Build competency with embedded relationships
    const competencyData: any = {
      name: comp.name,
      slug: comp.slug,
      description: comp.description,
      category_slug: comp.category_slug,
    };

    if (comp.synonyms && comp.synonyms.length > 0) {
      competencyData.synonyms = comp.synonyms;
    }

    if (comp.icon) {
      competencyData.icon = comp.icon;
    }

    if (compPrereqs.length > 0) {
      competencyData.prerequisites = compPrereqs.map(p => ({
        prerequisite_slug: p.prerequisite_slug,
        prerequisite_level: p.prerequisite_level,
        notes: p.notes,
      }));
    }

    if (compAlts.length > 0) {
      competencyData.alternatives = compAlts.map(a => ({
        alternative_slug: a.alternative_slug,
        relationship_type: a.relationship_type,
        notes: a.notes,
      }));
    }

    grouped[domain].competencies.push(competencyData);
  }

  return grouped;
}

function groupTopicsByDomain(topics: Topic[]): Record<string, any> {
  const grouped: Record<string, any> = {};

  for (const topic of topics) {
    const domain = domainMap[topic.category_slug] || 'programming';

    if (!grouped[domain]) {
      grouped[domain] = { topics: [] };
    }

    grouped[domain].topics.push(topic);
  }

  return grouped;
}

async function main() {
  console.log('🚀 Starting seed data split...\n');

  // Read source file
  const sourcePath = path.join(process.cwd(), 'data/topics_seed_new_structure.json');
  const sourceData: SeedData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

  // 1. Process and save categories
  console.log('📁 Processing categories...');
  let flatCategories = flattenCategories(sourceData.categories);
  flatCategories = addNewCategories(flatCategories);

  const categoriesPath = path.join(process.cwd(), 'data/seeds/categories.json');
  fs.writeFileSync(
    categoriesPath,
    JSON.stringify({ categories: flatCategories }, null, 2)
  );
  console.log(`✅ Saved ${flatCategories.length} categories to data/seeds/categories.json\n`);

  // 2. Process and save competencies by domain
  console.log('🎯 Processing competencies...');
  const competenciesByDomain = groupCompetenciesByDomain(
    sourceData.competencies,
    sourceData.competency_prerequisites,
    sourceData.competency_alternatives
  );

  for (const [domain, data] of Object.entries(competenciesByDomain)) {
    const domainPath = path.join(process.cwd(), `data/seeds/competencies/${domain}.json`);
    fs.writeFileSync(domainPath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${data.competencies.length} competencies to data/seeds/competencies/${domain}.json`);
  }
  console.log('');

  // 3. Process and save topics by domain
  console.log('📚 Processing topics...');
  const topicsByDomain = groupTopicsByDomain(sourceData.topics);

  for (const [domain, data] of Object.entries(topicsByDomain)) {
    const domainPath = path.join(process.cwd(), `data/seeds/topics/${domain}.json`);
    fs.writeFileSync(domainPath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${data.topics.length} topics to data/seeds/topics/${domain}.json`);
  }
  console.log('');

  // 4. Create empty unsplash_images.json (will be populated from seed.sql)
  console.log('🖼️  Creating unsplash_images.json...');
  const imagesPath = path.join(process.cwd(), 'data/seeds/unsplash_images.json');
  fs.writeFileSync(
    imagesPath,
    JSON.stringify({ images: [] }, null, 2)
  );
  console.log('✅ Created data/seeds/unsplash_images.json (empty, to be populated manually)\n');

  console.log('✨ Seed data split complete!');
  console.log('\nNext steps:');
  console.log('1. Review the generated files in data/seeds/');
  console.log('2. Manually add unsplash images to data/seeds/unsplash_images.json');
  console.log('3. Run: npm run generate:seed');
  console.log('4. Run: supabase db reset');
}

main().catch(console.error);
