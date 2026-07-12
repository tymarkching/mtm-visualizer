const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newPanel = `                  {/* Waveform & Render Controls (Moved) */}
                  <div className="border-t border-zinc-800/60 pt-5 mt-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider text-left">Waveform & Render Controls</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 text-left">Performance, synchronization, and final render options</p>
                    </div>

                    <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px]">High-Resolution Rendering</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5 font-normal">Double the internal canvas scale during live preview</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, highResolutionPreview: !prev.highResolutionPreview }))}
                          className={\`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 \${
                            visuals.highResolutionPreview ? 'bg-brand-green' : 'bg-zinc-800'
                          }\`}
                        >
                          <span className={\`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all \${
                            visuals.highResolutionPreview ? 'translate-x-3.5' : 'translate-x-0'
                          }\`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Oscilloscope Mode</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5 font-normal">Switch from frequency spectrum to time-domain waveforms</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, timeDomainMode: !prev.timeDomainMode }))}
                          className={\`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 \${
                            visuals.timeDomainMode ? 'bg-brand-green' : 'bg-zinc-800'
                          }\`}
                        >
                          <span className={\`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all \${
                            visuals.timeDomainMode ? 'translate-x-3.5' : 'translate-x-0'
                          }\`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/40 pt-3">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px]">CRT Scanlines</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5 font-normal">Faint horizontal moving lines for a vintage display aesthetic</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, crtScanlines: !prev.crtScanlines }))}
                          className={\`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 \${
                            visuals.crtScanlines ? 'bg-brand-green' : 'bg-zinc-800'
                          }\`}
                        >
                          <span className={\`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all \${
                            visuals.crtScanlines ? 'translate-x-3.5' : 'translate-x-0'
                          }\`} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Beat Rhythm Multiplier */}
                    <div className="space-y-1 p-2.5 bg-[#07070a]/40 rounded border border-zinc-950/40 mt-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold mb-1">
                        <span>BEAT RHYTHM MULTIPLIER</span>
                        <span className="text-white font-semibold">{visuals.beatRhythmMultiplier === 0.5 ? '1/2x' : visuals.beatRhythmMultiplier === 2 ? '2x' : '1x'}</span>
                      </div>
                      <select
                        value={visuals.beatRhythmMultiplier || 1}
                        onChange={(e) => setVisuals(prev => ({ ...prev, beatRhythmMultiplier: parseFloat(e.target.value) }))}
                        className="w-full bg-[#0a0a0f] border border-zinc-800 rounded p-1.5 text-zinc-350 text-[10px] focus:outline-none focus:border-brand-green cursor-pointer"
                      >
                        <option value="0.5">1/2x (Half-Speed)</option>
                        <option value="1">1x (Standard)</option>
                        <option value="2">2x (Double-Time)</option>
                      </select>
                      <p className="text-[9px] text-zinc-500 mt-1 font-sans">Controls the tempo and synchronization pace of effects relative to the track's BPM.</p>
                    </div>

                    {/* Motion Blur Intensity */}
                    <div className="space-y-1 p-2.5 bg-[#07070a]/40 rounded border border-zinc-950/40 mt-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold mb-1">
                        <span>MOTION BLUR INTENSITY</span>
                        <span className="text-white font-semibold">{((visuals.motionBlurIntensity || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.95"
                        step="0.05"
                        value={visuals.motionBlurIntensity || 0}
                        onChange={(e) => setVisuals(prev => ({ ...prev, motionBlurIntensity: parseFloat(e.target.value) }))}
                        className="w-full accent-brand-green cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-500 mt-1 font-sans">Dynamically adjusts trail length of moving segments, enhancing cinematic fluidity.</p>
                    </div>

                  </div>
`;

const insertPoint = `                  </div>
                </div>
              </motion.div>
            )}

            {/* TABS C: PARTICLES SET */}`;

if (code.includes(insertPoint)) {
  code = code.replace(insertPoint, newPanel + insertPoint);
  console.log('Successfully inserted panel at bottom');
} else {
  console.log('Failed to find insert point');
}
fs.writeFileSync('src/App.tsx', code);
