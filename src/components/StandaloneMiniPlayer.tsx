import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Disc,
  Music,
  Move,
  Pin,
  PinOff,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Radio
} from 'lucide-react';
import { AudioTrack, UIThemeConfig } from '../types';

interface StandaloneMiniPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onStopPlayback: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  audioTrack: AudioTrack;
  playlist: File[];
  currentTrackIndex: number;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  bpm?: number;
  getAnalyserNode?: () => AnalyserNode | null;
  getAnalyserData?: () => Uint8Array | null;
  themeConfig?: UIThemeConfig;
}

const hexToRgb = (hex: string) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 34, g: 197, b: 94 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

export const StandaloneMiniPlayer: React.FC<StandaloneMiniPlayerProps> = ({
  isOpen,
  onClose,
  isPlaying,
  onTogglePlayback,
  onStopPlayback,
  currentTime,
  duration,
  onSeek,
  audioTrack,
  playlist,
  currentTrackIndex,
  onPrevTrack,
  onNextTrack,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  bpm = 120,
  getAnalyserNode,
  getAnalyserData,
  themeConfig
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [visMode, setVisMode] = useState<'bars' | 'wave' | 'vu'>('bars');
  const [sensitivityBoost, setSensitivityBoost] = useState<number>(1.6); // 1.6x default gain boost
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const localFreqRef = useRef<Uint8Array | null>(null);
  const localTimeRef = useRef<Uint8Array | null>(null);
  const peakCapsRef = useRef<number[]>([]);

  const accentColor = themeConfig?.hexAccent || '#b8ee02';
  const { r, g, b } = hexToRgb(accentColor);

  // Render hyper-reactive audio spectrum / waveform / VU meter in sync with UI Theme
  useEffect(() => {
    if (!canvasRef.current || !isOpen || isCollapsed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderSpectrum = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Acquire live audio frequency & waveform buffers directly from AnalyserNode or getter
      let freqData: Uint8Array | null = null;
      let timeData: Uint8Array | null = null;

      const node = getAnalyserNode ? getAnalyserNode() : null;
      if (node) {
        if (!localFreqRef.current || localFreqRef.current.length !== node.frequencyBinCount) {
          localFreqRef.current = new Uint8Array(node.frequencyBinCount);
          localTimeRef.current = new Uint8Array(node.frequencyBinCount);
        }
        node.getByteFrequencyData(localFreqRef.current);
        node.getByteTimeDomainData(localTimeRef.current);
        freqData = localFreqRef.current;
        timeData = localTimeRef.current;
      } else if (getAnalyserData) {
        freqData = getAnalyserData();
      }

      const hasLiveAudio = isPlaying && freqData && freqData.some(v => v > 0);

      // --- MODE 1: LOGARITHMIC SPECTRUM BARS WITH GRAVITY PEAK CAPS (THEMED) ---
      if (visMode === 'bars') {
        const barCount = 22;
        const barWidth = (width / barCount) - 1.5;

        if (peakCapsRef.current.length !== barCount) {
          peakCapsRef.current = new Array(barCount).fill(0);
        }

        // Create gradient once for all bars instead of inside 22 loop iterations per frame
        const barGrad = ctx.createLinearGradient(0, height, 0, 0);
        barGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
        barGrad.addColorStop(0.65, accentColor);
        barGrad.addColorStop(1.0, '#ffffff');

        for (let i = 0; i < barCount; i++) {
          let val = 0;

          if (hasLiveAudio && freqData) {
            // Logarithmic bin mapping to give balanced reactivity across bass, mids, and high treble
            const logRatio = Math.pow(i / (barCount - 1), 1.5);
            const maxBin = Math.floor(freqData.length * 0.75);
            const binIndex = Math.min(maxBin, Math.max(0, Math.floor(logRatio * maxBin)));

            const raw = freqData[binIndex] / 255;
            val = Math.min(1.0, Math.pow(raw, 0.65) * sensitivityBoost);
          } else if (isPlaying) {
            // High-tempo procedural synth fallback animation
            const t = Date.now() * 0.008;
            const bP = (bpm / 60) * Math.PI * 2;
            const beatPulse = Math.pow(Math.sin(t * bP) * 0.5 + 0.5, 3);
            val = Math.sin(t * 2 + i * 0.35) * 0.3 + 0.35 + beatPulse * 0.35;
          }

          // Gravity peak caps decay logic
          if (val >= peakCapsRef.current[i]) {
            peakCapsRef.current[i] = val;
          } else {
            peakCapsRef.current[i] = Math.max(0, peakCapsRef.current[i] - 0.028);
          }

          const barHeight = Math.max(2, val * (height - 3));
          const x = i * (barWidth + 1.5);
          const y = height - barHeight;

          // Glowing rounded equalizer bar matched to UI theme accent
          ctx.shadowBlur = val > 0.4 ? 6 : 0;
          ctx.shadowColor = accentColor;

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 1.5);
          ctx.fill();

          // Peak cap dot
          const peakY = height - Math.max(2, peakCapsRef.current[i] * (height - 3));
          ctx.fillStyle = val > 0.8 ? '#ffffff' : accentColor;
          ctx.fillRect(x, Math.max(0, peakY - 1.5), barWidth, 1.5);
        }
      }

      // --- MODE 2: HIGH-SENSITIVITY NEON OSCILLOSCOPE WAVEFORM (THEMED) ---
      else if (visMode === 'wave') {
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = accentColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = accentColor;

        ctx.beginPath();
        const sliceWidth = width / (timeData && timeData.length > 0 ? timeData.length : 64);
        let x = 0;

        if (hasLiveAudio && timeData) {
          for (let i = 0; i < timeData.length; i += 2) {
            const v = (timeData[i] - 128) / 128; // -1 to 1
            const amplified = v * sensitivityBoost * 1.5;
            const y = (height / 2) + (amplified * (height / 2 - 1));

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth * 2;
          }
        } else {
          // Synthetic dynamic wave fallback
          const t = Date.now() * 0.006;
          for (let i = 0; i <= width; i += 4) {
            const wave = isPlaying
              ? Math.sin(t * 3 + i * 0.08) * Math.cos(t * 2 + i * 0.03) * (height / 2 - 2) * (isPlaying ? 0.8 : 0.1)
              : 0;
            const y = height / 2 + wave;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
        }

        ctx.stroke();

        // Subtle gradient fill under wave
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
        bgGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
        ctx.fillStyle = bgGrad;
        ctx.fill();
      }

      // --- MODE 3: STEREO DUAL VU METER (THEMED) ---
      else if (visMode === 'vu') {
        let leftRMS = 0;
        let rightRMS = 0;

        if (hasLiveAudio && freqData && freqData.length > 0) {
          const half = Math.floor(freqData.length / 2);
          if (half > 0) {
            let sumL = 0, sumR = 0;
            for (let i = 0; i < half; i++) sumL += freqData[i];
            for (let i = half; i < freqData.length; i++) sumR += freqData[i];

            leftRMS = Math.min(1.0, (sumL / half / 255) * sensitivityBoost * 1.4);
            rightRMS = Math.min(1.0, (sumR / (freqData.length - half) / 255) * sensitivityBoost * 1.4);
          }
        } else if (isPlaying) {
          const t = Date.now() * 0.007;
          leftRMS = Math.abs(Math.sin(t * 2)) * 0.7 + 0.15;
          rightRMS = Math.abs(Math.cos(t * 2.3)) * 0.7 + 0.15;
        }

        const meterHeight = 4;
        const meterYL = 1.5;
        const meterYR = 6.5;

        const vuGrad = ctx.createLinearGradient(12, 0, width - 2, 0);
        vuGrad.addColorStop(0, accentColor);
        vuGrad.addColorStop(0.7, '#f59e0b');
        vuGrad.addColorStop(1, '#ef4444');

        // Draw Left & Right Channel Meters
        [ { val: leftRMS, y: meterYL, label: 'L' }, { val: rightRMS, y: meterYR, label: 'R' } ].forEach(ch => {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(12, ch.y, width - 14, meterHeight);

          const filledWidth = ch.val * (width - 14);
          ctx.fillStyle = vuGrad;
          ctx.fillRect(12, ch.y, filledWidth, meterHeight);

          ctx.fillStyle = '#a1a1aa';
          ctx.font = '8px monospace';
          ctx.fillText(ch.label, 2, ch.y + 4);
        });
      }

      animationFrameId = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, isCollapsed, isPlaying, visMode, sensitivityBoost, bpm, getAnalyserNode, getAnalyserData, themeConfig, accentColor, r, g, b]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag={!isPinned}
        dragMomentum={false}
        dragElastic={0.05}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className={`fixed z-[9999] backdrop-blur-xl border shadow-2xl rounded-2xl overflow-hidden font-mono select-none text-zinc-100 ${
          themeConfig?.cardBg || 'bg-zinc-950/95'
        } ${themeConfig?.border || 'border-zinc-800/90'} ${
          themeConfig?.accentGlow || ''
        } ${
          isPinned
            ? 'top-20 right-6 w-80'
            : 'bottom-24 right-6 w-80 md:w-88'
        }`}
      >
        {/* DRAG / TITLE BAR */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 border-b cursor-grab active:cursor-grabbing ${
          themeConfig?.headerBg || 'bg-zinc-900/90 border-zinc-800/80'
        }`}>
          <div className="flex items-center space-x-2 truncate">
            <Move className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ color: accentColor }} />
              <span className="text-[10px] font-bold text-zinc-200 tracking-wider uppercase">CHAOTIC FART PLAYER</span>
            </div>
            {bpm && bpm > 0 && (
              <span className={`text-[9px] border px-1.5 py-0.2 rounded font-bold ${
                themeConfig?.badgeBg || 'bg-brand-green/10 border-brand-green/30 text-brand-green'
              }`}>
                {bpm} BPM
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {/* PIN TO CORNER TOGGLE */}
            <button
              type="button"
              onClick={() => setIsPinned(prev => !prev)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isPinned
                  ? `${themeConfig?.accentText || 'text-brand-green'} ${themeConfig?.accentBg || 'bg-brand-green/10'}`
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title={isPinned ? 'Unpin Standalone Player' : 'Pin to Top-Right Corner'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>

            {/* MINIMIZE / COLLAPSE TOGGLE */}
            <button
              type="button"
              onClick={() => setIsCollapsed(prev => !prev)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Player' : 'Collapse to Mini Pill'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* RE-ATTACH / CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
              title="Dock Player back to Workspace"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLLAPSED MINI CAPSULE MODE */}
        {isCollapsed ? (
          <div className="p-2.5 flex items-center justify-between space-x-3 bg-zinc-950/90">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0"
                style={{ color: accentColor }}
              >
                <Music className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-zinc-200 truncate">{audioTrack.name || "Live Track"}</span>
                <span className="text-[9px] text-zinc-500 font-mono">
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onTogglePlayback}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
                themeConfig?.primaryButtonBg || 'bg-brand-green text-zinc-950'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
            </button>
          </div>
        ) : (
          /* FULL STANDALONE MINI-PLAYER EXPANDED CONTENT */
          <div className="p-4 space-y-3.5 bg-zinc-950/80">
            {/* Track Info & Artwork / Spectrum Visualizer Header */}
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center group shadow-inner">
                {audioTrack.coverUrl ? (
                  <img src={audioTrack.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center">
                    <Radio className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} style={{ color: accentColor }} />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-zinc-100 truncate tracking-tight">{audioTrack.name || "Default Audio"}</span>
                <span className="text-[10px] text-zinc-400 truncate mt-0.5">{audioTrack.artist || "Chaotic Studio"}</span>
                
                {/* Mini Canvas Spectrum Meter & Display Controls */}
                <div className="mt-2 space-y-1">
                  <div className="w-full h-5 bg-zinc-900/90 rounded border border-zinc-800/80 overflow-hidden px-1 py-0.5 relative group">
                    <canvas ref={canvasRef} width={220} height={14} className="w-full h-full block" />
                  </div>

                  {/* Mode & Sensitivity Bar */}
                  <div className="flex items-center justify-between text-[8px] font-mono pt-0.5">
                    <div className="flex items-center space-x-1 bg-zinc-900/90 border border-zinc-800/80 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => setVisMode('bars')}
                        className={`px-1.5 py-0.2 rounded cursor-pointer transition-colors ${
                          visMode === 'bars'
                            ? `${themeConfig?.tabActiveBg || 'bg-brand-green/25'} ${themeConfig?.accentText || 'text-brand-green'} font-bold`
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Equalizer Spectrum Bars"
                      >
                        BARS
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisMode('wave')}
                        className={`px-1.5 py-0.2 rounded cursor-pointer transition-colors ${
                          visMode === 'wave'
                            ? `${themeConfig?.tabActiveBg || 'bg-brand-green/25'} ${themeConfig?.accentText || 'text-brand-green'} font-bold`
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Oscilloscope Waveform Line"
                      >
                        WAVE
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisMode('vu')}
                        className={`px-1.5 py-0.2 rounded cursor-pointer transition-colors ${
                          visMode === 'vu'
                            ? `${themeConfig?.tabActiveBg || 'bg-brand-green/25'} ${themeConfig?.accentText || 'text-brand-green'} font-bold`
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Stereo L/R VU Meter"
                      >
                        VU
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 bg-zinc-900/90 border border-zinc-800/80 rounded p-0.5">
                      <span className="text-zinc-500 pl-0.5 uppercase">GAIN</span>
                      {[
                        { label: '1x', val: 1.0 },
                        { label: '1.6x', val: 1.6 },
                        { label: '2.5x', val: 2.5 }
                      ].map(s => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setSensitivityBoost(s.val)}
                          className={`px-1 py-0.2 rounded cursor-pointer transition-colors ${
                            sensitivityBoost === s.val
                              ? `${themeConfig?.accentText || 'text-brand-green'} font-bold`
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                          title={`Audio Gain Sensitivity Boost ${s.label}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Progress Scrubber */}
            <div className="space-y-1">
              <div className="relative w-full h-2 bg-zinc-900 rounded-full overflow-hidden cursor-pointer group">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentTime / (duration || 30)) * 100))}%`,
                    backgroundColor: accentColor
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 30}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                <span className={`font-bold ${themeConfig?.accentText || 'text-brand-green'}`}>
                  {audioTrack.file 
                    ? `${Math.floor(duration / 60)}:${(Math.floor(duration % 60)).toString().padStart(2, '0')}`
                    : 'LOOP'
                  }
                </span>
              </div>
            </div>

            {/* Main Playback Transport Buttons */}
            <div className="flex items-center justify-between pt-1">
              {/* Prev Track */}
              <button
                type="button"
                onClick={onPrevTrack}
                disabled={!playlist || playlist.length <= 1}
                className={`p-2 rounded-lg transition-colors ${
                  playlist && playlist.length > 1 ? 'text-zinc-300 hover:text-white hover:bg-zinc-900' : 'text-zinc-700 cursor-not-allowed'
                }`}
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Stop Button */}
              <button
                type="button"
                onClick={onStopPlayback}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="Stop & Reset"
              >
                <Square className="w-4 h-4" />
              </button>

              {/* Master Play / Pause Button */}
              <button
                type="button"
                onClick={onTogglePlayback}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                  themeConfig?.primaryButtonBg || 'bg-brand-green text-zinc-950 hover:bg-lime-300'
                }`}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-zinc-950" /> : <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />}
              </button>

              {/* Volume & Mute control */}
              <div className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  style={{ accentColor: accentColor }}
                  className="w-12 h-1 cursor-pointer"
                />
              </div>

              {/* Next Track */}
              <button
                type="button"
                onClick={onNextTrack}
                disabled={!playlist || playlist.length <= 1}
                className={`p-2 rounded-lg transition-colors ${
                  playlist && playlist.length > 1 ? 'text-zinc-300 hover:text-white hover:bg-zinc-900' : 'text-zinc-700 cursor-not-allowed'
                }`}
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Playlist Track Index Footer */}
            {playlist && playlist.length > 1 && (
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                <span>PLAYLIST QUEUE</span>
                <span className="text-zinc-300 font-bold">Track {currentTrackIndex + 1} of {playlist.length}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
