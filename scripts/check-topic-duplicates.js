#!/usr/bin/env node

/**
 * Check for duplicate topic slugs and names across all topic files
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function basicSlugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Find all topic JSON files
const topicFiles = glob.sync('data/seeds/topics/*.json');

const slugMap = new Map();
const nameMap = new Map();
const duplicateSlugs = [];
const duplicateNames = [];
const emptySlug = [];

topicFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!data.topics) return;

  data.topics.forEach(topic => {
    const slug = topic.slug || basicSlugify(topic.name);

    // Check for empty slugs
    if (!slug) {
      emptySlug.push({
        name: topic.name,
        file: path.basename(file)
      });
      return;
    }

    // Check for duplicate slugs
    if (slugMap.has(slug)) {
      const existing = slugMap.get(slug);
      if (!duplicateSlugs.find(d => d.slug === slug)) {
        duplicateSlugs.push({
          slug,
          occurrences: [existing, { name: topic.name, file: path.basename(file) }]
        });
      } else {
        const dup = duplicateSlugs.find(d => d.slug === slug);
        dup.occurrences.push({ name: topic.name, file: path.basename(file) });
      }
    } else {
      slugMap.set(slug, { name: topic.name, file: path.basename(file) });
    }

    // Check for duplicate names (case-insensitive)
    const lowerName = topic.name.toLowerCase();
    if (nameMap.has(lowerName)) {
      const existing = nameMap.get(lowerName);
      if (!duplicateNames.find(d => d.name === topic.name)) {
        duplicateNames.push({
          name: topic.name,
          occurrences: [existing, { file: path.basename(file), slug: topic.slug }]
        });
      } else {
        const dup = duplicateNames.find(d => d.name.toLowerCase() === lowerName);
        dup.occurrences.push({ file: path.basename(file), slug: topic.slug });
      }
    } else {
      nameMap.set(lowerName, { file: path.basename(file), slug: topic.slug });
    }
  });
});

// Report all issues
let hasErrors = false;

if (emptySlug.length > 0) {
  hasErrors = true;
  console.log('=== EMPTY SLUGS ===\n');
  emptySlug.forEach(t => console.log('-', t.name, `(${t.file})`));
  console.log('');
}

if (duplicateSlugs.length > 0) {
  hasErrors = true;
  console.log('=== DUPLICATE SLUGS ===\n');
  duplicateSlugs.forEach(d => {
    console.log('Slug:', d.slug);
    d.occurrences.forEach((occ, i) => {
      console.log(`  ${i + 1}.`, occ.name, `(${occ.file})`);
    });
    console.log('');
  });
  console.log(`❌ Found ${duplicateSlugs.length} duplicate slug${duplicateSlugs.length === 1 ? '' : 's'}\n`);
}

if (duplicateNames.length > 0) {
  hasErrors = true;
  console.log('=== DUPLICATE TOPIC NAMES ===\n');
  console.log('These topics have the same name:\n');
  duplicateNames.forEach(issue => {
    console.log(`Name: "${issue.name}"`);
    console.log('Found in:');
    issue.occurrences.forEach(occ => {
      console.log(`  - File: ${occ.file}, Slug: ${occ.slug}`);
    });
    console.log('');
  });
  console.log(`❌ Found ${duplicateNames.length} duplicate topic name${duplicateNames.length === 1 ? '' : 's'}\n`);
}

if (hasErrors) {
  console.log('To fix: Ensure each topic has a unique slug and name');
  process.exit(1);
} else {
  console.log('✅ No duplicate slugs found!');
  console.log('✅ No duplicate topic names found!');
  process.exit(0);
}
