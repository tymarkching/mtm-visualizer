import React from 'react';
import { UITheme, UILayout } from '../types';
import { UI_THEMES, UI_LAYOUTS } from '../data/ui-themes';
import { Layout, Palette, Tv, Monitor, Sliders, Sparkles, Eye } from 'lucide-react';

interface UIThemeLayoutBarProps {
  currentTheme: UITheme;
  currentLayout: UILayout;
  onSelectTheme: (theme: UITheme) => void;
  onSelectLayout: (layout: UILayout) => void;
}

export const UIThemeLayoutBar: React.FC<UIThemeLayoutBarProps> = ({
  currentTheme,
  currentLayout,
  onSelectTheme,
  onSelectLayout,
}) => {
  const activeThemeConfig = UI_THEMES.find(t => t.id === currentTheme) || UI_THEMES[0];

  return (
    <div className={`w-full bg-zinc-950/80 border-b border-zinc-900/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-sans backdrop-blur-md transition-all duration-500 ease-in-out`}>
      {/* Left: UI Themes Selector (1, 2, 3, 4, 5) */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1">
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400 shrink-0 mr-1">
          <Palette className={`w-3.5 h-3.5 ${activeThemeConfig.accentText} transition-colors duration-500 ease-in-out`} />
          <span className="font-semibold uppercase tracking-wider hidden sm:inline">UI Theme:</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {UI_THEMES.map((t) => {
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t.id)}
                title={t.description}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all duration-500 ease-in-out cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                  isActive
                    ? `${t.buttonBg} ${t.accentGlow} font-bold ring-1 ring-white/20 scale-105 shadow-md`
                    : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-850 hover:text-zinc-200 hover:scale-102'
                }`}
              >
                <span className="transition-all duration-300">{t.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Layout Switcher Options (Studio, Compact Deck, Cinema Zen) */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400 mr-1">
          <Layout className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold uppercase tracking-wider hidden md:inline">Interface Layout:</span>
        </div>

        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg">
          {UI_LAYOUTS.map((l) => {
            const isActive = currentLayout === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectLayout(l.id)}
                title={l.description}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                {l.id === 'studio' && <Sliders className="w-3 h-3 text-brand-green" />}
                {l.id === 'cinema' && <Eye className="w-3 h-3 text-amber-400" />}
                <span className="hidden sm:inline">{l.name}</span>
                <span className="sm:hidden">{l.id === 'studio' ? 'FULL DJ' : 'CINEMA'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
