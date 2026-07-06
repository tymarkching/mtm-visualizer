import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = '''                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    title={p.description}
                    style={isActive ? { borderColor: p.visuals.primaryColor, boxShadow: `0 0 12px ${p.visuals.primaryColor}30` } : {}}
                    className={`flex items-center justify-start text-left px-2 py-1.5 rounded border text-[10px] transition-all relative overflow-hidden group ${
                      isActive && p.id === 'crimson-pulse'
                        ? 'bg-brand-green text-zinc-950 font-bold border-brand-green'
                        : isActive
                        ? 'bg-zinc-900 text-white font-medium'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >'''

replacement = '''                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    title={p.description}
                    style={isActive ? { boxShadow: `0 0 12px var(--color-brand-green)` } : {}}
                    className={`flex items-center justify-start text-left px-3 py-2 rounded-t-md border-b-2 text-[10px] transition-all relative overflow-hidden group cursor-pointer ${
                      isActive
                        ? 'bg-brand-green text-zinc-950 font-bold border-brand-green'
                        : 'border-transparent text-lime-700 font-medium hover:text-brand-green hover:bg-brand-green-hover/5'
                    }`}
                  >'''

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
