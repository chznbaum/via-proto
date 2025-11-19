const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/topics_seed.json', 'utf8'));

function basicSlugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const slugMap = {};
const duplicates = [];
const emptySlug = [];

for (const [category, categoryData] of Object.entries(data.categories)) {
  for (const topic of categoryData.topics) {
    const slug = basicSlugify(topic.name);

    if (!slug) {
      emptySlug.push({ name: topic.name, category });
      continue;
    }

    if (slugMap[slug]) {
      duplicates.push({
        slug,
        existing: slugMap[slug],
        duplicate: { name: topic.name, category }
      });
    } else {
      slugMap[slug] = { name: topic.name, category };
    }
  }
}

if (emptySlug.length > 0) {
  console.log('=== EMPTY SLUGS ===\n');
  emptySlug.forEach(t => console.log('-', t.name, '('+t.category+')'));
  console.log('');
}

if (duplicates.length > 0) {
  console.log('=== DUPLICATE SLUGS ===\n');
  duplicates.forEach(d => {
    console.log('Slug:', d.slug);
    console.log('  1.', d.existing.name, '('+d.existing.category+')');
    console.log('  2.', d.duplicate.name, '('+d.duplicate.category+')');
    console.log('');
  });
  console.log('Total duplicates:', duplicates.length);
} else {
  console.log('✅ No duplicates found!');
}
