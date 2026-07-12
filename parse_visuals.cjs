const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
let inVisuals = false;
let depth = 0;
let results = [];
for (let i = 6465; i < 9030; i++) {
  if (lines[i].includes('activeTab === \'visuals\' && (')) {
    inVisuals = true;
  }
  if (inVisuals) {
    if (lines[i].match(/<h[34]/)) {
      results.push(`${i+1}: ${lines[i].trim()}`);
    }
  }
}
console.log(results.join('\n'));
