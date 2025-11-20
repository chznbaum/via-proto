#!/usr/bin/env node
/**
 * Generate SQL seed file from JSON data sources
 * Usage: node scripts/generate-seeds.js
 * Output: supabase/seed.sql
 */

const fs = require('fs');
const path = require('path');

const topicsPath = path.join(__dirname, '../data/topics_seed.json');
const unsplashPath = path.join(__dirname, '../data/unsplash_images_seed.json');
const outputPath = path.join(__dirname, '../supabase/seed.sql');

const topicsData = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
const unsplashData = JSON.parse(fs.readFileSync(unsplashPath, 'utf8'));

let sql = `-- Supabase Seed File
-- This file seeds the database with initial data
-- Run with: supabase db reset (drops and recreates with migrations + seeds)
-- Or: psql -h localhost -U postgres -d postgres -f supabase/seed.sql

-- Clear existing data (optional - use if reseeding)
TRUNCATE public.topic_synonyms, public.topics, public.unsplash_images CASCADE;

`;

// ============================================================
// UNSPLASH IMAGES
// ============================================================
sql += `-- ============================================================\n`;
sql += `-- UNSPLASH IMAGES\n`;
sql += `-- ============================================================\n\n`;

for (const image of unsplashData.images) {
  const photoId = image.photo_id.replace(/'/g, "''");
  const url = image.url.replace(/'/g, "''");
  const photographer = image.photographer.replace(/'/g, "''");
  const photographerUsername = image.photographer_username.replace(/'/g, "''");
  const downloadLocation = image.download_location.replace(/'/g, "''");
  const altDescription = (image.alt_description || '').replace(/'/g, "''");
  const usageNote = (image.usage_note || '').replace(/'/g, "''");

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
// TOPICS AND SYNONYMS
// ============================================================
sql += `\n-- ============================================================\n`;
sql += `-- TOPICS AND SYNONYMS\n`;
sql += `-- ============================================================\n\n`;

for (const [category, categoryData] of Object.entries(topicsData.categories)) {
  sql += `-- Category: ${category}\n`;

  for (const topic of categoryData.topics) {
    // Use explicit slug if provided, otherwise auto-generate
    const slug = topic.slug || topic.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const description = (topic.description || '').replace(/'/g, "''");
    const name = topic.name.replace(/'/g, "''");

    sql += `-- ${name}\n`;
    sql += `INSERT INTO public.topics (name, slug, category, description, is_active)\n`;
    sql += `VALUES ('${name}', '${slug}', '${category}', '${description}', true);\n`;

    // Add synonyms
    if (topic.synonyms && topic.synonyms.length > 0) {
      for (const synonym of topic.synonyms) {
        const cleanSynonym = synonym.replace(/'/g, "''");
        sql += `INSERT INTO public.topic_synonyms (topic_id, synonym)\n`;
        sql += `SELECT id, '${cleanSynonym}' FROM public.topics WHERE slug = '${slug}';\n`;
      }
    }

    sql += '\n';
  }
}

fs.writeFileSync(outputPath, sql);

const stats = {
  unsplashImages: unsplashData.images.length,
  categories: Object.keys(topicsData.categories).length,
  topics: Object.values(topicsData.categories).reduce((sum, cat) => sum + cat.topics.length, 0),
  synonyms: Object.values(topicsData.categories).reduce(
    (sum, cat) => sum + cat.topics.reduce((s, t) => s + (t.synonyms?.length || 0), 0),
    0
  )
};

console.log('✅ Generated seed.sql successfully!');
console.log(`   - ${stats.unsplashImages} Unsplash images`);
console.log(`   - ${stats.categories} categories`);
console.log(`   - ${stats.topics} topics`);
console.log(`   - ${stats.synonyms} synonyms`);
console.log(`\nFile: ${outputPath}`);
console.log('\nNext steps:');
console.log('1. Review data/unsplash_images_seed.json and data/topics_seed.json');
console.log('2. Re-run this script to regenerate seed.sql after changes');
console.log('3. Apply with: supabase db reset (or push to remote)');
