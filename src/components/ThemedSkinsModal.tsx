import React, { useState } from 'react';
import { Sparkles, Search, X, Check, Palette, Shuffle, Layers } from 'lucide-react';
import { THEMED_SKINS } from '../data/themed-skins';
import { ThemedSkin, VisualizerSettings } from '../types';

interface ThemedSkinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySkin: (skin: ThemedSkin) => void;
  activeVisuals: VisualizerSettings;
}

/**
 * Renders an intuitive visual thumbnail preview for each preset
 * showing an exact representation of its waveform, style, and colors.
 */
const VisualizerThumbnailPreview = React.memo<{ skin: ThemedSkin; isActive: boolean }>(({ skin, isActive }) => {
  const pColor = skin.visuals.primaryColor || '#00ffaa';
  const sColor = skin.visuals.secondaryColor || '#00ffff';
  const gColor = skin.visuals.glowColor || pColor;
  const bgStart = skin.background.gradientStart || '#0a0a0f';
  const bgEnd = skin.background.gradientEnd || '#000005';
  const style = skin.visuals.style;

  const glowStyle = { filter: `drop-shadow(0px 0px 3px ${gColor})` };

  // Particle positions generator based on skin ID
  const particleDots = [
    { cx: 25, cy: 30, r: 2 },
    { cx: 80, cy: 20, r: 1.5 },
    { cx: 140, cy: 35, r: 2.5 },
    { cx: 200, cy: 15, r: 1.8 },
    { cx: 270, cy: 28, r: 2.2 },
    { cx: 50, cy: 75, r: 1.2 },
    { cx: 230, cy: 80, r: 2 },
  ];

  return (
    <div className={`relative w-full h-36 rounded-xl overflow-hidden bg-zinc-950 border transition-all duration-300 group-hover:border-zinc-700 shadow-inner ${
      isActive ? 'border-brand-green ring-2 ring-brand-green/40 shadow-brand-green/20' : 'border-zinc-800/90'
    }`}>
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)`,
        }}
      />

      {/* SVG Waveform Graphic */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`thumb-grad-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={pColor} />
            <stop offset="50%" stopColor={gColor} />
            <stop offset="100%" stopColor={sColor} />
          </linearGradient>
          <linearGradient id={`thumb-fill-${skin.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={pColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={sColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Circular / Concentric Radial Styles */}
        {(style === 'circular' ||
          style === 'circular-orbit' ||
          style === 'radial-bars' ||
          style === 'concentric-dual-radials' ||
          style === 'neon-tunnel' ||
          style === 'radial-inside-out' ||
          style === 'reflected-radial-ring-horizon') && (
          <g style={glowStyle}>
            <circle cx="150" cy="60" r="38" fill="none" stroke={`url(#thumb-grad-${skin.id})`} strokeWidth="2.5" strokeDasharray="4 2" />
            <circle cx="150" cy="60" r="24" fill="none" stroke={sColor} strokeWidth="1.8" />
            <circle cx="150" cy="60" r="10" fill={pColor} opacity="0.8" />
            {/* Radial Spikes */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 22.5 * Math.PI) / 180;
              const x1 = 150 + Math.cos(angle) * 24;
              const y1 = 60 + Math.sin(angle) * 24;
              const len = 12 + (i % 3) * 8;
              const x2 = 150 + Math.cos(angle) * (24 + len);
              const y2 = 60 + Math.sin(angle) * (24 + len);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? pColor : sColor} strokeWidth="2" strokeLinecap="round" />;
            })}
          </g>
        )}

        {/* Laser Horizon / Cyber Grid Styles */}
        {(style === 'cyber-laser-horizon' || style === 'laser-orbit' || style === 'prism-laser-scanner') && (
          <g>
            {/* Perspective Grid */}
            <path d="M0,120 L150,70 L300,120 M50,120 L150,70 L250,120 M100,120 L150,70 L200,120" stroke={sColor} strokeWidth="0.8" opacity="0.4" />
            <line x1="0" y1="90" x2="300" y2="90" stroke={sColor} strokeWidth="0.8" opacity="0.3" />
            <line x1="0" y1="105" x2="300" y2="105" stroke={sColor} strokeWidth="0.8" opacity="0.5" />
            {/* Scanning Horizon Wave */}
            <path d="M10,70 Q75,30 150,65 T290,60" fill="none" stroke={pColor} strokeWidth="3" style={glowStyle} />
          </g>
        )}

        {/* Equalizer Bars / Blocks / Matrix Styles */}
        {(style === 'bars' ||
          style === 'rounded-pill-bars' ||
          style === 'digital-matrix-blocks' ||
          style === 'digital-vu-blocks' ||
          style === 'double-mirror-bars' ||
          style === 'retro-arcade-stack' ||
          style === 'retro-arcade-dot-grid' ||
          style === 'reflected-matrix-dots') && (
          <g style={glowStyle}>
            {Array.from({ length: 22 }).map((_, i) => {
              const h = Math.sin(i * 0.4) * 35 + Math.cos(i * 0.7) * 15 + 40;
              const x = 12 + i * 13;
              const isCenter = style === 'double-mirror-bars';
              const y = isCenter ? 60 - h / 2 : 110 - h;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="8"
                  height={h}
                  rx={style === 'rounded-pill-bars' ? 4 : 1}
                  fill={i % 2 === 0 ? pColor : sColor}
                  opacity={0.85}
                />
              );
            })}
          </g>
        )}

        {/* Waveform / Strings / Echoes / EKG / Sine Wave Styles */}
        {(style === 'waveform' ||
          style === 'symmetrical-waveform' ||
          style === 'neon-glow-string' ||
          style === 'fresnel-wave' ||
          style === 'floating-wave-echo' ||
          style === 'minimalist-pulse-dot' ||
          style === 'bouncing-circles') && (
          <g style={glowStyle}>
            <path
              d="M10,60 Q50,10 100,60 T190,60 T290,60"
              fill="none"
              stroke={pColor}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M10,60 Q50,100 100,60 T190,60 T290,60"
              fill="none"
              stroke={sColor}
              strokeWidth="1.8"
              opacity="0.7"
              strokeDasharray="6 3"
            />
            {style === 'bouncing-circles' && (
              <>
                <circle cx="80" cy="25" r="6" fill={gColor} />
                <circle cx="150" cy="35" r="8" fill={pColor} />
                <circle cx="220" cy="20" r="5" fill={sColor} />
              </>
            )}
          </g>
        )}

        {/* EKG Heartbeat Pulse */}
        {style === 'heartbeat-ekg' && (
          <g style={glowStyle}>
            <path
              d="M10,60 L90,60 L105,20 L120,100 L135,10 L150,75 L165,60 L290,60"
              fill="none"
              stroke={pColor}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Silhouettes / Mountain / Mirror Area Styles */}
        {(style === 'shaded-mirror-silhouette' ||
          style === 'reflected-mountain-silhouette' ||
          style === 'mirrored-wave-silhouette' ||
          style === 'smooth-area-silhouette' ||
          style === 'reflected-center-split-pins') && (
          <g style={glowStyle}>
            <path
              d="M10,60 Q60,15 110,60 T210,30 T290,60 L290,110 L10,110 Z"
              fill={`url(#thumb-fill-${skin.id})`}
              stroke={pColor}
              strokeWidth="2.5"
            />
            <path
              d="M10,60 Q60,105 110,60 T210,90 T290,60 L290,10 L10,10 Z"
              fill="none"
              stroke={sColor}
              strokeWidth="1.5"
              opacity="0.5"
            />
          </g>
        )}

        {/* DNA Helix / Intertwined Wave */}
        {(style === 'dna-helix' || style === 'dna-helix-thread') && (
          <g style={glowStyle}>
            <path d="M10,60 Q80,10 150,60 T290,60" fill="none" stroke={pColor} strokeWidth="3" />
            <path d="M10,60 Q80,110 150,60 T290,60" fill="none" stroke={sColor} strokeWidth="3" />
            {Array.from({ length: 9 }).map((_, i) => {
              const x = 30 + i * 28;
              const y1 = 60 + Math.sin(i * 0.7) * 28;
              const y2 = 60 - Math.sin(i * 0.7) * 28;
              return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={gColor} strokeWidth="1.5" opacity="0.8" />;
            })}
          </g>
        )}

        {/* Wave Matrix / Topography */}
        {style === 'wave-matrix' && (
          <g stroke={pColor} fill="none" strokeWidth="1.5" opacity="0.85">
            <path d="M10,40 Q80,15 150,45 T290,35" />
            <path d="M10,60 Q80,30 150,65 T290,55" stroke={sColor} />
            <path d="M10,80 Q80,50 150,85 T290,75" stroke={gColor} />
          </g>
        )}

        {/* Frequency Spectrogram */}
        {style === 'frequency-spectrogram' && (
          <g style={glowStyle}>
            {Array.from({ length: 12 }).map((_, col) =>
              Array.from({ length: 5 }).map((_, row) => (
                <rect
                  key={`${col}-${row}`}
                  x={20 + col * 22}
                  y={20 + row * 18}
                  width="18"
                  height="14"
                  rx="2"
                  fill={(col + row) % 2 === 0 ? pColor : sColor}
                  opacity={(5 - row) * 0.18}
                />
              ))
            )}
          </g>
        )}

        {/* Reflected Glow Ribbon */}
        {style === 'reflected-glow-ribbon' && (
          <g style={glowStyle}>
            <path d="M10,70 C80,10 120,110 200,20 C240,80 270,40 290,60" fill="none" stroke={pColor} strokeWidth="4" />
            <path d="M10,70 C80,130 120,30 200,100 C240,40 270,80 290,60" fill="none" stroke={sColor} strokeWidth="2" opacity="0.6" />
          </g>
        )}

        {/* Floating Particles */}
        {particleDots.map((pt, i) => (
          <circle
            key={i}
            cx={pt.cx}
            cy={pt.cy}
            r={pt.r}
            fill={i % 2 === 0 ? pColor : gColor}
            opacity="0.8"
            style={glowStyle}
          />
        ))}
      </svg>

      {/* Top Corner Overlay Badges */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1.5">
        {isActive ? (
          <span className="bg-brand-green/95 text-zinc-950 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-lg shadow-brand-green/40 animate-pulse">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>SELECTED</span>
          </span>
        ) : (
          <span className="bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-800 font-mono text-[9px] font-semibold px-2 py-0.5 rounded-md shadow-md">
            {skin.category.toUpperCase()}
          </span>
        )}
      </div>

      {/* Live Waveform Indicator dot */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1.5 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-zinc-800/80">
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: pColor }} />
        <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase">{skin.visuals.style.replace(/-/g, ' ')}</span>
      </div>
    </div>
  );
});

export const ThemedSkinsModal: React.FC<ThemedSkinsModalProps> = React.memo(({
  isOpen,
  onClose,
  onApplySkin,
  activeVisuals,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredSkins = THEMED_SKINS.filter((skin) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      skin.name.toLowerCase().includes(query) ||
      skin.description.toLowerCase().includes(query) ||
      skin.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const handleRandomSelect = () => {
    const randomIndex = Math.floor(Math.random() * THEMED_SKINS.length);
    const randomSkin = THEMED_SKINS[randomIndex];
    onApplySkin(randomSkin);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-zinc-950 border border-zinc-800 w-full max-w-6xl h-[88vh] max-h-[850px] min-h-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green text-xl shadow-inner">
              🎨
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-mono font-bold text-white tracking-wide uppercase">Visualizer Preset Gallery</h2>
                <span className="bg-brand-green/20 text-brand-green text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-brand-green/30 font-extrabold">
                  {THEMED_SKINS.length} Presets Available
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Transform your visualizer with handcrafted aesthetic preset profiles, colors, particles, and backgrounds.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRandomSelect}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-brand-green border border-brand-green/30 hover:bg-brand-green/20 transition-all text-xs font-mono font-semibold cursor-pointer active:scale-95 shadow-sm"
              title="Pick a random preset"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Surprise Me</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-900/80 shrink-0">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search all presets by style, theme, or keyword (e.g., Aurora, Tokyo, Solar, Magma, Gold)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-green/60 transition-all font-sans shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-mono font-bold bg-zinc-800 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* SKINS GRID */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max items-stretch">
          {filteredSkins.map((skin) => {
            const isCurrentlyActive =
              activeVisuals.style === skin.visuals.style &&
              activeVisuals.primaryColor === skin.visuals.primaryColor;

            const primaryColor = skin.visuals.primaryColor || '#00ffaa';
            const glowColor = skin.visuals.glowColor || primaryColor;

            return (
              <div
                key={skin.id}
                onClick={() => onApplySkin(skin)}
                className={`group relative bg-zinc-900/90 hover:bg-zinc-900 border rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[380px] overflow-hidden ${
                  isCurrentlyActive
                    ? 'border-brand-green ring-2 ring-brand-green/50 shadow-2xl shadow-brand-green/20 bg-zinc-900 scale-[1.01]'
                    : 'border-zinc-800 hover:border-zinc-700 hover:shadow-xl hover:-translate-y-1'
                }`}
                style={{
                  boxShadow: isCurrentlyActive
                    ? `0 0 25px ${primaryColor}25, inset 0 0 10px ${primaryColor}15`
                    : undefined,
                }}
              >
                {/* Ambient Color Glow on Hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${glowColor} 0%, transparent 70%)`,
                  }}
                />

                {/* THUMBNAIL PREVIEW IMAGE */}
                <div className="mb-3">
                  <VisualizerThumbnailPreview skin={skin} isActive={isCurrentlyActive} />
                </div>

                {/* PRESET INFO */}
                <div className="relative z-10 flex-1 flex flex-col justify-between pt-1">
                  <div>
                    {/* Header Title & Active Badge Row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-base font-mono font-bold text-white group-hover:text-brand-green transition-colors leading-snug">
                        {skin.name}
                      </h3>

                      {isCurrentlyActive && (
                        <span className="flex items-center space-x-1 text-[10px] font-mono font-extrabold text-brand-green bg-brand-green/15 border border-brand-green/40 px-2 py-0.5 rounded-full shadow-sm shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Waveform Style & Category Badge */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border shadow-sm transition-colors"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          borderColor: `${primaryColor}60`,
                          color: primaryColor,
                        }}
                      >
                        {skin.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-300 font-sans line-clamp-2 leading-relaxed">
                      {skin.description}
                    </p>
                  </div>

                  {/* COLOR PALETTE PREVIEW SWATCHES & TAGS */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center space-x-1 text-zinc-400">
                        <Palette className="w-3 h-3" />
                        <span>Theme Swatches</span>
                      </span>
                      <span className="text-zinc-500 font-sans capitalize">{skin.category}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Primary dot */}
                      <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: skin.visuals.primaryColor }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400">Pri</span>
                      </div>

                      {/* Secondary dot */}
                      <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: skin.visuals.secondaryColor }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400">Sec</span>
                      </div>

                      {/* Glow dot */}
                      <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: skin.visuals.glowColor }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400">Glow</span>
                      </div>
                    </div>

                    {/* TAGS */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {skin.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono text-zinc-400 bg-zinc-950/80 border border-zinc-800 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CHOICE ACTION BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplySkin(skin);
                    }}
                    className={`w-full mt-3 py-2 rounded-xl font-mono text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
                      isCurrentlyActive
                        ? 'bg-brand-green/20 text-brand-green border border-brand-green/50 shadow-inner'
                        : 'bg-brand-green hover:bg-brand-green-hover text-zinc-950 shadow-md group-hover:shadow-lg group-hover:shadow-brand-green/20 active:scale-98'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isCurrentlyActive ? 'Active Choice' : 'Apply Preset'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSkins.length === 0 && (
            <div className="col-span-full py-12 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm text-zinc-300 font-mono">No presets matched your search.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                }}
                className="text-xs text-brand-green hover:underline font-mono"
              >
                Reset search
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-zinc-900/80 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400 font-mono shrink-0">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-brand-green" />
            <span>Presets automatically sync visual styles, color themes, particle setups, and background gradients.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

