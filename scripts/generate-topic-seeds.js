#!/usr/bin/env node
/**
 * Generate SQL seed file from topics JSON
 * Usage: node scripts/generate-topic-seeds.js
 * Output: supabase/seed.sql
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/topics_seed.json');
const outputPath = path.join(__dirname, '../supabase/seed.sql');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let sql = `-- Supabase Seed File
-- This file seeds the database with initial topics and synonyms
-- Run with: supabase db reset (drops and recreates with migrations + seeds)
-- Or: psql -h localhost -U postgres -d postgres -f supabase/seed.sql

-- Clear existing data (optional - use if reseeding)
TRUNCATE public.topic_synonyms, public.topics CASCADE;

-- Insert topics and synonyms
`;

for (const [category, categoryData] of Object.entries(data.categories)) {
  sql += `\n-- Category: ${category}\n`;

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
  categories: Object.keys(data.categories).length,
  topics: Object.values(data.categories).reduce((sum, cat) => sum + cat.topics.length, 0),
  synonyms: Object.values(data.categories).reduce(
    (sum, cat) => sum + cat.topics.reduce((s, t) => s + (t.synonyms?.length || 0), 0),
    0
  )
};

console.log('✅ Generated seed.sql successfully!');
console.log(`   - ${stats.categories} categories`);
console.log(`   - ${stats.topics} topics`);
console.log(`   - ${stats.synonyms} synonyms`);
console.log(`\nFile: ${outputPath}`);
console.log('\nNext steps:');
console.log('1. Expand topics_seed.json with AI (optional)');
console.log('2. Re-run this script to regenerate seed.sql');
console.log('3. Apply with: supabase db reset (or push to remote)');
