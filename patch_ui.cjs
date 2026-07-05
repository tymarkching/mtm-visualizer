const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldUI = `<div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Visual presets style selector</span>
              </span>
              <div className="flex items-center space-x-2.5">
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">1-Click Fast Formatting</span>
                <button
                  type="button"
                  onClick={handleShufflePreset}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-mono font-semibold cursor-pointer active:scale-95"
                  title="Shuffle randomly style presets"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle Preset</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {PRESETS.map((p) => {
                const isActive = visuals.style === p.visuals.style && background.type === p.background.type && particlesSet.type === p.particles.type;
                return (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    className={\`flex flex-col items-left text-left p-3 rounded-lg border text-xs transition-all relative overflow-hidden \${
                      isActive
                        ? 'bg-zinc-900 border-zinc-700 text-white font-medium'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800 text-zinc-400'
                    }\`}
                  >
                    <span className="font-medium block text-zinc-200 truncate w-full">{p.name}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1 font-mono">{p.description}</span>
                    {isActive && (
                      <span className="absolute right-1.5 top-1.5 bg-blue-600 text-white p-0.5 rounded-full text-[8px]">
                        <Check className="w-2 h-2" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>`;

const newUI = `<div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Visual presets style selector</span>
              </span>
              <div className="flex items-center space-x-2.5">
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">1-Click Fast Formatting</span>
                <button
                  type="button"
                  onClick={handleRandomizeStyles}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-mono font-semibold cursor-pointer active:scale-95"
                  title="Randomize everything"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>🎲 RANDOMIZE STYLES</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-2 w-full items-center">
              {PRESETS.map((p) => {
                const isActive = visuals.style === p.visuals.style && background.type === p.background.type && particlesSet.type === p.particles.type;
                return (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    className={\`flex items-center justify-center text-center px-2 py-1 rounded border text-[11px] transition-all relative overflow-hidden \${
                      isActive
                        ? 'bg-zinc-900 border-zinc-700 text-white font-medium'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800 text-zinc-400'
                    }\`}
                  >
                    <span className="truncate w-full">{p.name}</span>
                  </button>
                );
              })}
            </div>`;

if (code.includes(oldUI)) {
  fs.writeFileSync('src/App.tsx', code.replace(oldUI, newUI));
  console.log('UI updated');
} else {
  console.log('Could not find old UI exactly');
}
