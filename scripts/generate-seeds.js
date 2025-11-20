#!/usr/bin/env node
/**
 * Generate SQL seed file from JSON data sources
 * Usage: node scripts/generate-seeds.js
 * Output: supabase/seed.sql
 */

const fs = require('fs');
const path = require('path');

const topicsPath = path.join(__dirname, '../data/topics_seed_new_structure.json');
const unsplashPath = path.join(__dirname, '../data/unsplash_images_seed.json');
const outputPath = path.join(__dirname, '../supabase/seed.sql');

const topicsData = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
const unsplashData = JSON.parse(fs.readFileSync(unsplashPath, 'utf8'));

// Helper function to escape single quotes in SQL
const escapeSql = (str) => (str || '').replace(/'/g, "''");

let sql = `-- Supabase Seed File (New Schema)
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

`;

// ============================================================
// UNSPLASH IMAGES
// ============================================================
sql += `-- ============================================================\n`;
sql += `-- UNSPLASH IMAGES\n`;
sql += `-- ============================================================\n\n`;

for (const image of unsplashData.images) {
  const photoId = escapeSql(image.photo_id);
  const url = escapeSql(image.url);
  const photographer = escapeSql(image.photographer);
  const photographerUsername = escapeSql(image.photographer_username);
  const downloadLocation = escapeSql(image.download_location);
  const altDescription = escapeSql(image.alt_description);
  const usageNote = escapeSql(image.usage_note);

  // Construct photographer URL with UTM parameters (per Unsplash API guidelines)
  const photographerUrl = `https://unsplash.com/@${photographerUsername}?utm_source=ViaProto&utm_medium=referral`;

  sql += `-- ${altDescription || photoId}\n`;
  if (image.usage_note) {
    sql += `-- Usage: ${image.usage_note}\n`;
  }
  sql += `INSERT INTO public.unsplash_images (photo_id, url, photographer, photographer_username, photographer_url, download_location, alt_description, usage_note)\n`;
  sql += `VALUES ('${photoId}', '${url}', '${photographer}', '${photographerUsername}', '${photographerUrl}', '${downloadLocation}', ${altDescription ? `'${altDescription}'` : 'NULL'}, ${usageNote ? `'${usageNote}'` : 'NULL'});\n\n`;
}

// ============================================================
// CATEGORIES (Hierarchical)
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- CATEGORIES (Hierarchical)\n`;
sql += `-- ============================================================\n\n`;

// Recursive function to insert categories in proper order (parent before children)
function insertCategoriesRecursively(categories, parentSlug = null, level = 0) {
  for (const category of categories) {
    const name = escapeSql(category.name);
    const slug = category.slug;
    const description = escapeSql(category.description);
    const icon = category.icon || null;
    const displayOrder = category.display_order || 0;

    const indent = '  '.repeat(level);
    sql += `${indent}-- ${name}\n`;
    sql += `${indent}INSERT INTO public.categories (name, slug, description, parent_id, icon, display_order, is_active)\n`;

    if (parentSlug) {
      sql += `${indent}VALUES ('${name}', '${slug}', '${description}', (SELECT id FROM public.categories WHERE slug = '${parentSlug}'), ${icon ? `'${icon}'` : 'NULL'}, ${displayOrder}, true);\n\n`;
    } else {
      sql += `${indent}VALUES ('${name}', '${slug}', '${description}', NULL, ${icon ? `'${icon}'` : 'NULL'}, ${displayOrder}, true);\n\n`;
    }

    // Recursively insert subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      insertCategoriesRecursively(category.subcategories, slug, level + 1);
    }
  }
}

insertCategoriesRecursively(topicsData.categories);

// ============================================================
// COMPETENCIES
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- COMPETENCIES\n`;
sql += `-- ============================================================\n\n`;

for (const competency of topicsData.competencies) {
  const name = escapeSql(competency.name);
  const slug = competency.slug;
  const description = escapeSql(competency.description);
  const categorySlug = competency.category_slug || null;

  sql += `-- ${name}\n`;
  sql += `INSERT INTO public.competencies (name, slug, description, category_id, is_active)\n`;

  if (categorySlug) {
    sql += `VALUES ('${name}', '${slug}', '${description}', (SELECT id FROM public.categories WHERE slug = '${categorySlug}'), true);\n`;
  } else {
    sql += `VALUES ('${name}', '${slug}', '${description}', NULL, true);\n`;
  }

  // Insert synonyms for this competency
  if (competency.synonyms && competency.synonyms.length > 0) {
    for (const synonym of competency.synonyms) {
      const cleanSynonym = escapeSql(synonym);
      sql += `INSERT INTO public.competency_synonyms (competency_id, synonym)\n`;
      sql += `SELECT id, '${cleanSynonym}' FROM public.competencies WHERE slug = '${slug}';\n`;
    }
  }

  sql += '\n';
}

// ============================================================
// COMPETENCY PREREQUISITES
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- COMPETENCY PREREQUISITES\n`;
sql += `-- ============================================================\n\n`;

for (const prereq of topicsData.competency_prerequisites) {
  const competencySlug = prereq.competency_slug;
  const prerequisiteSlug = prereq.prerequisite_slug;
  const prerequisiteLevel = prereq.prerequisite_level || 'required'; // default to 'required'
  const notes = prereq.notes ? escapeSql(prereq.notes) : null;

  sql += `-- ${competencySlug} requires ${prerequisiteSlug} (${prerequisiteLevel})\n`;
  sql += `INSERT INTO public.competency_prerequisites (competency_id, prerequisite_id, prerequisite_level, notes)\n`;
  sql += `SELECT \n`;
  sql += `  (SELECT id FROM public.competencies WHERE slug = '${competencySlug}'),\n`;
  sql += `  (SELECT id FROM public.competencies WHERE slug = '${prerequisiteSlug}'),\n`;
  sql += `  '${prerequisiteLevel}',\n`;
  sql += `  ${notes ? `'${notes}'` : 'NULL'};\n\n`;
}

// ============================================================
// COMPETENCY ALTERNATIVES
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- COMPETENCY ALTERNATIVES\n`;
sql += `-- ============================================================\n\n`;

for (const alt of topicsData.competency_alternatives) {
  const competencySlug = alt.competency_slug;
  const alternativeSlug = alt.alternative_slug;
  const relationshipType = alt.relationship_type || 'interchangeable';
  const notes = alt.notes ? escapeSql(alt.notes) : null;

  sql += `-- ${competencySlug} ⇄ ${alternativeSlug} (${relationshipType})\n`;
  sql += `INSERT INTO public.competency_alternatives (competency_id, alternative_id, relationship_type, notes)\n`;
  sql += `SELECT \n`;
  sql += `  (SELECT id FROM public.competencies WHERE slug = '${competencySlug}'),\n`;
  sql += `  (SELECT id FROM public.competencies WHERE slug = '${alternativeSlug}'),\n`;
  sql += `  '${relationshipType}',\n`;
  sql += `  ${notes ? `'${notes}'` : 'NULL'};\n\n`;
}

// ============================================================
// TOPICS
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- TOPICS\n`;
sql += `-- ============================================================\n\n`;

for (const topic of topicsData.topics) {
  const name = escapeSql(topic.name);
  const slug = topic.slug;
  const description = escapeSql(topic.description);
  const categorySlug = topic.category_slug;

  sql += `-- ${name}\n`;
  sql += `INSERT INTO public.topics (name, slug, description, category_id, is_active)\n`;
  sql += `VALUES ('${name}', '${slug}', '${description}', (SELECT id FROM public.categories WHERE slug = '${categorySlug}'), true);\n\n`;
}

// ============================================================
// TOPIC-COMPETENCY RELATIONSHIPS
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- TOPIC-COMPETENCY RELATIONSHIPS\n`;
sql += `-- ============================================================\n\n`;

for (const topic of topicsData.topics) {
  const topicSlug = topic.slug;

  if (topic.competencies && topic.competencies.length > 0) {
    sql += `-- Competencies for: ${topic.name}\n`;

    for (const comp of topic.competencies) {
      const competencySlug = comp.competency_slug;
      const isPrimary = comp.is_primary === true;

      sql += `INSERT INTO public.topic_competencies (topic_id, competency_id, is_primary)\n`;
      sql += `SELECT \n`;
      sql += `  (SELECT id FROM public.topics WHERE slug = '${topicSlug}'),\n`;
      sql += `  (SELECT id FROM public.competencies WHERE slug = '${competencySlug}'),\n`;
      sql += `  ${isPrimary};\n`;
    }
    sql += '\n';
  }
}

fs.writeFileSync(outputPath, sql);

// Calculate statistics
function countCategories(categories) {
  let count = categories.length;
  for (const cat of categories) {
    if (cat.subcategories) {
      count += countCategories(cat.subcategories);
    }
  }
  return count;
}

const stats = {
  unsplashImages: unsplashData.images.length,
  categories: countCategories(topicsData.categories),
  competencies: topicsData.competencies.length,
  competencySynonyms: topicsData.competencies.reduce((sum, c) => sum + (c.synonyms?.length || 0), 0),
  topics: topicsData.topics.length,
  competencyPrerequisites: topicsData.competency_prerequisites.length,
  competencyAlternatives: topicsData.competency_alternatives.length,
  topicCompetencyRelationships: topicsData.topics.reduce((sum, t) => sum + (t.competencies?.length || 0), 0)
};

console.log('✅ Generated seed.sql successfully!');
console.log(`   - ${stats.unsplashImages} Unsplash images`);
console.log(`   - ${stats.categories} categories (hierarchical)`);
console.log(`   - ${stats.competencies} competencies`);
console.log(`   - ${stats.competencySynonyms} competency synonyms`);
console.log(`   - ${stats.topics} topics`);
console.log(`   - ${stats.competencyPrerequisites} competency prerequisites`);
console.log(`   - ${stats.competencyAlternatives} competency alternatives`);
console.log(`   - ${stats.topicCompetencyRelationships} topic-competency relationships`);
console.log(`\nFile: ${outputPath}`);
console.log('\nNext steps:');
console.log('1. Review data/topics_seed_new_structure.json');
console.log('2. Re-run this script to regenerate seed.sql after changes');
console.log('3. Apply with: supabase db reset');
