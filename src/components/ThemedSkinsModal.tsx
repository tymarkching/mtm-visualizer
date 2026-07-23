import React, { useState } from 'react';
import { Sparkles, Search, X, Check, Palette, Shuffle, Layers } from 'lucide-react';
import { THEMED_SKINS } from '../data/themed-skins';
import { SkinCategory, ThemedSkin, VisualizerSettings } from '../types';

interface ThemedSkinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySkin: (skin: ThemedSkin) => void;
  activeVisuals: VisualizerSettings;
}

const CATEGORIES: { id: SkinCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Presets', icon: '✨' },
  { id: 'cyber', label: 'Cyber & Synth', icon: '⚡' },
  { id: 'cosmic', label: 'Cosmic Space', icon: '🌌' },
  { id: 'zen', label: 'Zen & Ambient', icon: '🌸' },
  { id: 'bass', label: 'Heavy Bass', icon: '🔥' },
  { id: 'luxury', label: 'Minimal & Gold', icon: '💎' },
  { id: 'retro', label: 'Retro 80s', icon: '🏎️' },
  { id: 'ocean', label: 'Ocean & Aurora', icon: '🌊' },
];

export const ThemedSkinsModal: React.FC<ThemedSkinsModalProps> = ({
  isOpen,
  onClose,
  onApplySkin,
  activeVisuals,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SkinCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredSkins = THEMED_SKINS.filter((skin) => {
    const matchesCategory = selectedCategory === 'all' || skin.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      skin.name.toLowerCase().includes(query) ||
      skin.description.toLowerCase().includes(query) ||
      skin.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleRandomSelect = () => {
    const randomIndex = Math.floor(Math.random() * THEMED_SKINS.length);
    const randomSkin = THEMED_SKINS[randomIndex];
    onApplySkin(randomSkin);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-zinc-950 border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-zinc-100"
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
                <span className="bg-brand-green/20 text-brand-green text-[10px] font-mono px-2 py-0.5 rounded-full border border-brand-green/30 font-bold">
                  {THEMED_SKINS.length} Presets
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

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-900/80 space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search presets by style, theme, or keyword (e.g., Synthwave, Cyber, Nebula, Gold)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-green/60 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-brand-green text-zinc-950 border-brand-green shadow-md shadow-brand-green/20'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SKINS GRID */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkins.map((skin) => {
            const isCurrentlyActive =
              activeVisuals.style === skin.visuals.style &&
              activeVisuals.primaryColor === skin.visuals.primaryColor;

            return (
              <div
                key={skin.id}
                onClick={() => onApplySkin(skin)}
                className={`group relative bg-zinc-900/50 hover:bg-zinc-900 border rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isCurrentlyActive
                    ? 'border-brand-green ring-1 ring-brand-green/40 shadow-lg shadow-brand-green/10 bg-zinc-900'
                    : 'border-zinc-850 hover:border-zinc-700 hover:shadow-md'
                }`}
              >
                {/* TOP HEADER */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                      {skin.badge}
                    </span>
                    {isCurrentlyActive && (
                      <span className="flex items-center space-x-1 text-[10px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/30 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-mono font-bold text-white group-hover:text-brand-green-hover transition-colors">
                    {skin.name}
                  </h3>

                  <p className="text-xs text-zinc-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                    {skin.description}
                  </p>
                </div>

                {/* COLOR PALETTE PREVIEW SWATCHES */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-zinc-400" />
                      <span>Color Palette</span>
                    </span>
                    <span className="text-zinc-400 font-sans capitalize">{skin.category}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Primary dot */}
                    <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: skin.visuals.primaryColor }}
                      />
                      <span className="text-[9px] font-mono text-zinc-400">Primary</span>
                    </div>

                    {/* Secondary dot */}
                    <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: skin.visuals.secondaryColor }}
                      />
                      <span className="text-[9px] font-mono text-zinc-400">Secondary</span>
                    </div>

                    {/* Glow dot */}
                    <div className="flex items-center space-x-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: skin.visuals.glowColor }}
                      />
                      <span className="text-[9px] font-mono text-zinc-400">Glow</span>
                    </div>
                  </div>

                  {/* TAGS */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {skin.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono text-zinc-400 bg-zinc-950/70 border border-zinc-800 px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApplySkin(skin);
                  }}
                  className={`w-full mt-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    isCurrentlyActive
                      ? 'bg-brand-green/20 text-brand-green border border-brand-green/40'
                      : 'bg-brand-green hover:bg-brand-green-hover text-zinc-950 shadow-md active:scale-98'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isCurrentlyActive ? 'Applied Preset' : 'Apply Preset'}</span>
                </button>
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
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs text-brand-green hover:underline font-mono"
              >
                Reset filters
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
            className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
