const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Wrap with AnimatePresence
content = content.replace(
  '{/* TABS A: AUDIO & TITLE INFOS */}',
  '<AnimatePresence mode="wait">\n            {/* TABS A: AUDIO & TITLE INFOS */}'
);

content = content.replace(
  '{/* Global Sticky Bottom Export Bar */}',
  '</AnimatePresence>\n          {/* Global Sticky Bottom Export Bar */}'
);

const tabs = ['track', 'visuals', 'particles', 'background', 'overlay', 'text', 'sfx', 'export'];

tabs.forEach(tab => {
  const searchStr = `{activeTab === '${tab}' && (\n              <div className="space-y-6">`;
  const replaceStr = `{activeTab === '${tab}' && (\n              <motion.div\n                key="${tab}"\n                initial={{ opacity: 0, x: 20 }}\n                animate={{ opacity: 1, x: 0 }}\n                exit={{ opacity: 0, x: -20 }}\n                transition={{ duration: 0.2, ease: 'easeOut' }}\n                className="space-y-6"\n              >`;
  
  content = content.replace(searchStr, replaceStr);
});

// For closing tags, we have 8 tabs, so we should replace `              </div>\n            )}` with `              </motion.div>\n            )}` exactly 8 times.
let count = 0;
content = content.replace(/              <\/div>\n            \)}/g, (match) => {
  count++;
  if (count <= 8) {
    return '              </motion.div>\n            )}';
  }
  return match;
});

fs.writeFileSync('src/App.tsx', content);
console.log(`Replaced ${count} closing tags`);
