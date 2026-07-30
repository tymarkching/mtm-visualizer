import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Square, Volume2, VolumeX, Maximize2, Minimize2, 
  Tv, Sliders, Palette, X, Eye, Disc 
} from 'lucide-react';
import { UITheme, UILayout, UIThemeConfig } from '../types';
import { UI_THEMES, UI_LAYOUTS } from '../data/ui-themes';

interface CinemaZenOverlayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  trackName: string;
  artistName: string;
  currentTheme: UITheme;
  onSelectTheme: (theme: UITheme) => void;
  onSelectLayout: (layout: UILayout) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  themeConfig: UIThemeConfig;
}

export const CinemaZenOverlay: React.FC<CinemaZenOverlayProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  trackName,
  artistName,
  currentTheme,
  onSelectTheme,
  onSelectLayout,
  isFullscreen,
  onToggleFullscreen,
  themeConfig,
}) => {
  const [showControls, setShowControls] = useState<boolean>(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    setShowControls(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener('mousemove', handleMouseMove);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying]);

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-6 select-none"
        >
          {/* Top Cinema Overlay Header */}
          <div className="flex items-center justify-between w-full pointer-events-auto bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Eye className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-2">
                  <span>CINEMA MODE</span>
                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">100% VISUAL STAGE</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {trackName} {artistName ? `• ${artistName}` : ''}
                </span>
              </div>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onSelectLayout('studio')}
                className={`px-3.5 py-1.5 rounded-xl ${themeConfig.buttonBg} ${themeConfig.accentGlow} text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95`}
                title="Return to Studio Dashboard"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Return to Studio</span>
              </button>
            </div>
          </div>

          {/* Bottom Cinema Overlay Controls Bar */}
          <div className="w-full max-w-4xl mx-auto pointer-events-auto bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-3">
            {/* Timeline Scrubber */}
            <div className="relative w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden group cursor-pointer">
              <div 
                className={`h-full ${themeConfig.accentBg} transition-all duration-75`}
                style={{ width: `${Math.min(100, Math.max(0, (currentTime / (duration || 30)) * 100))}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration || 30}
                step="0.1"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            {/* Transport controls row */}
            <div className="flex items-center justify-between text-white font-mono">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${themeConfig.buttonBg} ${themeConfig.accentGlow}`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={onStop}
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>

                <div className="text-xs font-mono text-zinc-300">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-zinc-800">
                  <button type="button" onClick={onToggleMute} className="text-zinc-400 hover:text-white cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-amber-400 bg-zinc-700 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
