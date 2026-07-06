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
  
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    
    // Find the corresponding closing div.
    // The structure is {activeTab === 'tab' && ( <motion.div ...> ... </motion.div> )}
    // We just need to find the `</div>\n            )}` right before the next tab comment.
    // It's easier to just search and replace `</div>\n            )}` that belongs to this tab, but they all look the same.
    // Let's use a regex that matches `</div>\n            )}` and replace it with `</motion.div>\n            )}`
  }
});

// To replace the closing divs safely, we can do it during the process by finding the matching bracket.
// Instead of that, maybe we can just replace ALL `</div>\n            )}` with `</motion.div>\n            )}` inside the AnimatePresence block.
// Let's check how many `</div>\n            )}` there are.
