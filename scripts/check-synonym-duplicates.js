const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/topics_seed.json', 'utf8'));

const issues = [];

for (const [category, categoryData] of Object.entries(data.categories)) {
  for (const topic of categoryData.topics) {
    if (!topic.synonyms || topic.synonyms.length === 0) continue;

    // Check for case-insensitive duplicates within same topic
    const seen = new Set();
    const duplicates = [];

    for (const synonym of topic.synonyms) {
      const lower = synonym.toLowerCase();
      if (seen.has(lower)) {
        duplicates.push(synonym);
      } else {
        seen.add(lower);
      }
    }

    if (duplicates.length > 0) {
      issues.push({
        topic: topic.name,
        category,
        duplicates,
        allSynonyms: topic.synonyms
      });
    }
  }
}

if (issues.length > 0) {
  console.log('=== DUPLICATE SYNONYMS (case-insensitive) ===\n');
  issues.forEach(issue => {
    console.log(`${issue.topic} (${issue.category}):`);
    console.log('  All synonyms:', issue.allSynonyms.join(', '));
    console.log('  Duplicates:', issue.duplicates.join(', '));
    console.log('');
  });
  console.log('Total topics with duplicate synonyms:', issues.length);
} else {
  console.log('✅ No duplicate synonyms found!');
}
