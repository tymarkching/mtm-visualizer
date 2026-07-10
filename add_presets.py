import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                                <button
                                  type="button"
                                  onClick={() => setVisuals(prev => ({
                                    ...prev,
                                    waterReflectionTint: '#ffffff',
                                    waterReflectionOpacity: 0.4,
                                    waterReflectionBlur: 2,
                                    waterRefractionScale: 1,
                                    waterBeatIntensityMod: 1,
                                    waterRippleSpeed: 1,
                                    waterReflectionDepth: 0.4,
                                    waterRippleTexture: false,
                                    waterDistortion: false,
                                    waterRippleIntensity: 0.2,
                                    waterSyncToWaveform: false,
                                    waterColorShift: false
                                  }))}
                                  className="w-full col-span-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono uppercase py-1.5 rounded border border-zinc-700 transition-colors"
                                >
                                  Reset Effects
                                </button>
                              </div>"""

replacement = """                                <button
                                  type="button"
                                  onClick={() => setVisuals(prev => ({
                                    ...prev,
                                    waterReflectionTint: '#ffffff',
                                    waterReflectionOpacity: 0.8,
                                    waterReflectionBlur: 0.5,
                                    waterRefractionScale: 0.5,
                                    waterBeatIntensityMod: 0.2,
                                    waterRippleSpeed: 0.5,
                                    waterReflectionDepth: 0.15,
                                    waterRippleTexture: false,
                                    waterDistortion: false,
                                    waterRippleIntensity: 0.1,
                                    waterSyncToWaveform: false,
                                    waterColorShift: false
                                  }))}
                                  className="w-full bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 text-[10px] font-mono uppercase py-1.5 px-2 rounded border border-blue-900/50 transition-colors truncate"
                                >
                                  Mirror Calm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisuals(prev => ({
                                    ...prev,
                                    waterReflectionTint: '#00aaff',
                                    waterReflectionOpacity: 0.7,
                                    waterReflectionBlur: 3,
                                    waterRefractionScale: 4.0,
                                    waterBeatIntensityMod: 3.0,
                                    waterRippleSpeed: 3.5,
                                    waterReflectionDepth: 0.6,
                                    waterRippleTexture: true,
                                    waterDistortion: true,
                                    waterRippleIntensity: 2.0,
                                    waterSyncToWaveform: true,
                                    waterColorShift: false
                                  }))}
                                  className="w-full bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-400 text-[10px] font-mono uppercase py-1.5 px-2 rounded border border-cyan-900/50 transition-colors truncate"
                                >
                                  Water Ripple
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisuals(prev => ({
                                    ...prev,
                                    waterReflectionTint: '#ff00ff',
                                    waterReflectionOpacity: 0.85,
                                    waterReflectionBlur: 5,
                                    waterRefractionScale: 5.0,
                                    waterBeatIntensityMod: 4.0,
                                    waterRippleSpeed: 2.5,
                                    waterReflectionDepth: 0.8,
                                    waterRippleTexture: true,
                                    waterDistortion: true,
                                    waterRippleIntensity: 2.0,
                                    waterSyncToWaveform: true,
                                    waterColorShift: true,
                                    chromaticAberration: true
                                  }))}
                                  className="w-full bg-fuchsia-900/40 hover:bg-fuchsia-900/60 text-fuchsia-400 text-[10px] font-mono uppercase py-1.5 px-2 rounded border border-fuchsia-900/50 transition-colors truncate"
                                >
                                  Chromatic Tide
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisuals(prev => ({
                                    ...prev,
                                    waterReflectionTint: '#ffffff',
                                    waterReflectionOpacity: 0.4,
                                    waterReflectionBlur: 2,
                                    waterRefractionScale: 1,
                                    waterBeatIntensityMod: 1,
                                    waterRippleSpeed: 1,
                                    waterReflectionDepth: 0.4,
                                    waterRippleTexture: false,
                                    waterDistortion: false,
                                    waterRippleIntensity: 0.2,
                                    waterSyncToWaveform: false,
                                    waterColorShift: false
                                  }))}
                                  className="w-full col-span-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono uppercase py-1.5 rounded border border-zinc-700 transition-colors"
                                >
                                  Reset Effects
                                </button>
                              </div>"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
