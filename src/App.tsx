import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Upload,
  Download,
  Sparkles,
  Music,
  Settings,
  Layers,
  Type,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  AlertTriangle,
  Crop,
  FileVideo,
  Trash2,
  ListRestart,
  Disc,
  Save,
  FolderOpen,
  Shuffle,
} from 'lucide-react';
import {
  VisualizerStyle,
  ParticleType,
  VisualizerSettings,
  ParticleSettings,
  TitleOverlaySettings,
  BackgroundSettings,
  AudioTrack,
  ExportSettings,
  OverlayImage,
} from './types';
import {
  initParticles,
  updateParticles,
  drawBackground,
  drawParticles,
  drawVisualizer,
  drawTitleOverlay,
  drawProgressBar,
  drawWatermark,
  RenderParticle,
} from './utils/visualizer-renderer';
import { injectMP4Metadata } from './utils/metadata';

// Pre-configured thematic style presets of premium visualizers
const PRESETS = [
  {
    id: 'cyberpunk-sunset',
    name: 'Cyberpunk Sunset',
    description: 'Neon magenta visuals, flying amber spark particles, circular audio waveforms.',
    visuals: {
      style: 'circular' as VisualizerStyle,
      primaryColor: '#ff007f', // hot pink
      secondaryColor: '#00ffff', // neon cyan
      glowColor: '#ff007f',
      glowStrength: 15,
      lineThickness: 3,
      sensitivity: 1.2,
      fftSize: 256,
      barRoundness: 4,
      barSpacing: 4,
    },
    particles: {
      type: 'sparks' as ParticleType,
      count: 120,
      minSize: 2,
      maxSize: 6,
      speed: 4,
      color: '#ffaa00',
      gravity: -1.5, // float upwards
      wind: 0.5,
      beatReactive: true,
      beatThreshold: 130,
    },
    background: {
      type: 'gradient' as const,
      color: '#050510',
      gradientStart: '#08020e',
      gradientEnd: '#020d18',
      imageUrl: null,
      videoUrl: null,
      blur: 0,
      opacity: 0.75,
    },
    title: {
      visible: true,
      text: 'CYBERPUNK HARBOR',
      artist: 'Acoustic Shift',
      fontSize: 48,
      color: '#ffffff',
      fontFamily: 'Space Grotesk' as const,
      position: 'center' as const,
      fadeIn: true,
    }
  },
  {
    id: 'deep-space-aurora',
    name: 'Nebula Mountain Matrix',
    description: 'Emerald and blue glow overlapping matrix hills with starry particle dust.',
    visuals: {
      style: 'wave-matrix' as VisualizerStyle,
      primaryColor: '#00ff66', // lime emerald
      secondaryColor: '#7a22ff', // psychedelic violet
      glowColor: '#00ff66',
      glowStrength: 12,
      lineThickness: 2,
      sensitivity: 1.5,
      fftSize: 512,
      barRoundness: 0,
      barSpacing: 2,
    },
    particles: {
      type: 'dust' as ParticleType,
      count: 200,
      minSize: 1,
      maxSize: 4,
      speed: 1.5,
      color: '#00ffcc',
      gravity: 0,
      wind: -0.2,
      beatReactive: true,
      beatThreshold: 140,
    },
    background: {
      type: 'color' as const,
      color: '#030107',
      gradientStart: '#000000',
      gradientEnd: '#0c001a',
      imageUrl: null,
      videoUrl: null,
      blur: 0,
      opacity: 0.8,
    },
    title: {
      visible: true,
      text: 'NEBULA MATRIX LULLABY',
      artist: 'Solar Drift',
      fontSize: 42,
      color: '#00ffcc',
      fontFamily: 'JetBrains Mono' as const,
      position: 'top-left' as const,
      fadeIn: true,
    }
  },
  {
    id: 'retro-wave-vhs',
    name: 'Retro 80s Grid',
    description: 'Vintage glowing grid lines, rising neon bubbles, futuristic display typeface.',
    visuals: {
      style: 'retro' as VisualizerStyle,
      primaryColor: '#00ffff',
      secondaryColor: '#ff00ff',
      glowColor: '#ff00ff',
      glowStrength: 20,
      lineThickness: 4,
      sensitivity: 1.4,
      fftSize: 1024,
      barRoundness: 0,
      barSpacing: 3,
    },
    particles: {
      type: 'bubbles' as ParticleType,
      count: 60,
      minSize: 4,
      maxSize: 12,
      speed: 2,
      color: '#00ffbb',
      gravity: -1.2,
      wind: 0,
      beatReactive: true,
      beatThreshold: 120,
    },
    background: {
      type: 'gradient' as const,
      color: '#0a0a14',
      gradientStart: '#02000c',
      gradientEnd: '#1e002e',
      imageUrl: null,
      videoUrl: null,
      blur: 2,
      opacity: 0.85,
    },
    title: {
      visible: true,
      text: 'NEON WAVE CITADEL',
      artist: 'Vektor Horizon',
      fontSize: 52,
      color: '#ff00a2',
      fontFamily: 'Space Grotesk' as const,
      position: 'center' as const,
      fadeIn: true,
    }
  },
  {
    id: 'sakura-petal-drift',
    name: 'Sakura Petal Breeze',
    description: 'Drifting sakura blossoms, romantic red-violet orbits, classic serif display.',
    visuals: {
      style: 'laser-orbit' as VisualizerStyle,
      primaryColor: '#ffcad4', // baby pink
      secondaryColor: '#9d4edd', // purple orchid
      glowColor: '#ffcad4',
      glowStrength: 8,
      lineThickness: 3,
      sensitivity: 1.1,
      fftSize: 256,
      barRoundness: 2,
      barSpacing: 3,
    },
    particles: {
      type: 'sakura' as ParticleType,
      count: 90,
      minSize: 5,
      maxSize: 14,
      speed: 1.8,
      color: '#ff85a1',
      gravity: 0.8, // drift downward
      wind: 1.2, // swept sideways
      beatReactive: true,
      beatThreshold: 130,
    },
    background: {
      type: 'gradient' as const,
      color: '#0d0713',
      gradientStart: '#1d0b1d',
      gradientEnd: '#0b020a',
      imageUrl: null,
      videoUrl: null,
      blur: 0,
      opacity: 0.8,
    },
    title: {
      visible: true,
      text: 'SAKURA FALLS',
      artist: 'Haru Nostalgia',
      fontSize: 44,
      color: '#ffd0da',
      fontFamily: 'Playfair Display' as const,
      position: 'bottom-left' as const,
      fadeIn: true,
    }
  },
  {
    id: 'minimal-ivory',
    name: 'Monochromatic Wave',
    description: 'Sleek silver flowing wavelines and subtle dust sparkles over black canvas.',
    visuals: {
      style: 'waveform' as VisualizerStyle,
      primaryColor: '#ffffff',
      secondaryColor: '#6e7681',
      glowColor: '#ffffff',
      glowStrength: 5,
      lineThickness: 2.5,
      sensitivity: 1.0,
      fftSize: 512,
      barRoundness: 0,
      barSpacing: 4,
    },
    particles: {
      type: 'stars' as ParticleType,
      count: 150,
      minSize: 1,
      maxSize: 3,
      speed: 0.8,
      color: '#8c959f',
      gravity: -0.1,
      wind: 0.1,
      beatReactive: false,
      beatThreshold: 150,
    },
    background: {
      type: 'color' as const,
      color: '#030303',
      gradientStart: '#000000',
      gradientEnd: '#1e1e1e',
      imageUrl: null,
      videoUrl: null,
      blur: 0,
      opacity: 0.9,
    },
    title: {
      visible: true,
      text: 'AMORPHOUS VOID',
      artist: 'The Anti-Sound Scheme',
      fontSize: 38,
      color: '#ffffff',
      fontFamily: 'Outfit' as const,
      position: 'center' as const,
      fadeIn: true,
    }
  }
];

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'track' | 'background' | 'visuals' | 'particles' | 'overlay' | 'export'>('track');

  // Core Visualizer Customizations
  const [visuals, setVisuals] = useState<VisualizerSettings>(PRESETS[0].visuals);
  const [particlesSet, setParticlesSet] = useState<ParticleSettings>(PRESETS[0].particles);
  const [background, setBackground] = useState<BackgroundSettings>(PRESETS[0].background);
  const [titleOverlay, setTitleOverlay] = useState<TitleOverlaySettings>(PRESETS[0].title);

  // Multi-Image Overlay (Stickers / Album covers) state
  const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
  const [selectedOverlayImageId, setSelectedOverlayImageId] = useState<string | null>(null);

  // Synchronizers of sticker images for the render loop ref cache
  const overlayImagesRef = useRef<OverlayImage[]>([]);
  const selectedOverlayImageIdRef = useRef<string | null>(null);
  const overlayImageElementsRef = useRef<{ [key: string]: HTMLImageElement }>({});

  useEffect(() => {
    overlayImagesRef.current = overlayImages;
  }, [overlayImages]);

  useEffect(() => {
    selectedOverlayImageIdRef.current = selectedOverlayImageId;
  }, [selectedOverlayImageId]);

  useEffect(() => {
    overlayImages.forEach(img => {
      if (!overlayImageElementsRef.current[img.id]) {
        const realImg = new Image();
        realImg.src = img.url;
        overlayImageElementsRef.current[img.id] = realImg;
      }
    });
  }, [overlayImages]);

  // Audio Playback & Web Audio API state
  const [audioTrack, setAudioTrack] = useState<AudioTrack>({
    name: 'Dynamic Visualizer Peak',
    artist: 'tymark',
    duration: 30, // Default fallback
    file: null,
    objectUrl: null,
    coverUrl: null,
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trackDuration, setTrackDuration] = useState<number>(16);

  // 3-Band Equalizer Gains (dB, from -12 to +12)
  const [eqBass, setEqBass] = useState<number>(0);
  const [eqMid, setEqMid] = useState<number>(0);
  const [eqTreble, setEqTreble] = useState<number>(0);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Export State
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    aspectRatio: '16:9',
    resolution: '1080p',
    fps: 60,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportTimeRemaining, setExportTimeRemaining] = useState<string>('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Tap Tempo history state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);

  // HTML Audio, Video & Image cache for canvas renderer
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Media loading references
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayVideoRef = useRef<HTMLVideoElement | null>(null);
  const watermarkImageRef = useRef<HTMLImageElement | null>(null);

  // Web Audio Context & Nodes refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const overlayMediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const overlayGainNodeRef = useRef<GainNode | null>(null);
  const previewGainNodeRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Interactive Particle Pool ref
  const particlesPoolRef = useRef<RenderParticle[]>([]);

  // Recording Stream & Recorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Video/Image overlay active drag interactions
  const dragRef = useRef<{
    type: 'move' | 'scale' | 'move-image' | 'scale-image';
    targetId?: string;
    startXPct: number;
    startYPct: number;
    startScalePct: number;
    startX: number;
    startY: number;
    startDist: number;
    startCanvasX: number;
    startCanvasY: number;
  } | null>(null);

  // Project Configuration Importer Ref
  const projectFileRef = useRef<HTMLInputElement | null>(null);

  // Apply Preset Config
  const loadPreset = (preset: typeof PRESETS[0]) => {
    setVisuals(preset.visuals);
    setParticlesSet(preset.particles);
    setBackground(preset.background);
    setTitleOverlay(preset.title);

    // Update track names to match preset titles if no file is uploaded
    if (!audioTrack.file) {
      setAudioTrack(prev => ({
        ...prev,
        name: preset.title.text,
        artist: preset.title.artist,
      }));
    }
  };

  const handleShufflePreset = () => {
    const activeIndex = PRESETS.findIndex(
      p => visuals.style === p.visuals.style && 
           background.type === p.background.type && 
           particlesSet.type === p.particles.type
    );
    let nextIndex = activeIndex;
    if (PRESETS.length > 1) {
      // Keep selecting random until it is a different one
      let attempts = 0;
      while (nextIndex === activeIndex && attempts < 10) {
        nextIndex = Math.floor(Math.random() * PRESETS.length);
        attempts++;
      }
    } else {
      nextIndex = 0;
    }
    if (PRESETS[nextIndex]) {
      loadPreset(PRESETS[nextIndex]);
    }
  };

  // Serialize and download visualizer configuration as project JSON
  const handleSaveProject = () => {
    const projectData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      visuals,
      particlesSet,
      background: {
        ...background,
        // Include URLs for completeness, though blob URLs are session-specific
        imageUrl: background.imageUrl,
        videoUrl: background.videoUrl,
      },
      titleOverlay,
      exportSettings,
      eq: {
        bass: eqBass,
        mid: eqMid,
        treble: eqTreble,
      }
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeTrackName = audioTrack.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `viz-project-${safeTrackName || 'config'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open / Trigger Project File Selector
  const handleOpenProjectClick = () => {
    if (projectFileRef.current) {
      projectFileRef.current.click();
    }
  };

  // Handle uploaded Project JSON file to restore applet configurations
  const handleOpenProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) return;
        const project = JSON.parse(event.target.result as string);
        
        // Detailed validation & state updates
        if (project.visuals) {
          setVisuals(prev => ({
            ...prev,
            ...project.visuals
          }));
        }
        
        if (project.particlesSet) {
          setParticlesSet(prev => ({
            ...prev,
            ...project.particlesSet
          }));
        }
        
        if (project.background) {
          setBackground(prev => ({
            ...prev,
            ...project.background
          }));

          // Re-instantiate canvas resource loaders matching imported state
          if (project.background.type === 'image' && project.background.imageUrl) {
            const imgObj = new Image();
            imgObj.src = project.background.imageUrl;
            bgImageRef.current = imgObj;
          } else if (project.background.type === 'video' && project.background.videoUrl) {
            const vid = document.createElement('video');
            vid.src = project.background.videoUrl;
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            vid.play()
              .then(() => {
                bgVideoRef.current = vid;
              })
              .catch(err => {
                console.warn("Could not autoplay imported background video:", err);
              });
          }
        }
        
        if (project.titleOverlay) {
          setTitleOverlay(prev => ({
            ...prev,
            ...project.titleOverlay
          }));
        }

        if (project.exportSettings) {
          setExportSettings(prev => ({
            ...prev,
            ...project.exportSettings
          }));
        }

        if (project.eq) {
          if (typeof project.eq.bass === 'number') setEqBass(project.eq.bass);
          if (typeof project.eq.mid === 'number') setEqMid(project.eq.mid);
          if (typeof project.eq.treble === 'number') setEqTreble(project.eq.treble);
        }

        alert("Project restored successfully! All custom visualizers, particulate levels, EQ coefficients, and text overlay states have been load-reconciled.");
      } catch (err) {
        console.error("Failed to parse visualizer project JSON:", err);
        alert("Invalid project file! Please provide a valid JSON project config file.");
      }
      
      e.target.value = ''; // Clean input
    };
    reader.readAsText(file);
  };

  // Initialize Web Audio graph
  const initOverlayAudio = (videoElement: HTMLVideoElement) => {
    if (!audioContextRef.current || !analyserRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;

    try {
      // Create a GainNode specifically for the overlay volume/mute control
      if (!overlayGainNodeRef.current) {
        const overlayGain = ctx.createGain();
        const vol = visuals.overlayVolume !== undefined ? visuals.overlayVolume / 100 : 1.0;
        const muted = !!visuals.overlayMuted;
        overlayGain.gain.value = muted ? 0 : vol;
        
        // Connect overlayGain directly to context destination for true independent audio tracks
        overlayGain.connect(ctx.destination);
        if (audioDestinationRef.current) {
          overlayGain.connect(audioDestinationRef.current);
        }
        overlayGainNodeRef.current = overlayGain;
      }

      // Create MediaElementAudioSourceNode if not created for this video element yet
      if (overlayMediaSourceRef.current) {
        try {
          overlayMediaSourceRef.current.disconnect();
        } catch (e) {}
      } else {
        overlayMediaSourceRef.current = ctx.createMediaElementSource(videoElement);
      }

      // Connect Overlay source to:
      // 1) Analyser directly (for raw visual analysis)
      overlayMediaSourceRef.current.connect(analyserRef.current);
      // 2) Overlay Gain Node (for controllable speaker output)
      overlayMediaSourceRef.current.connect(overlayGainNodeRef.current);

    } catch (err) {
      console.warn("Could not construct Web Audio routing for overlay video:", err);
    }
  };

  const initAudioSystem = () => {
    if (audioContextRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = visuals.fftSize;
      analyser.smoothingTimeConstant = typeof visuals.smoothing === 'number' ? visuals.smoothing : 0.8;

      // Initialize 3-Band Equalizer filters (adjusts audio before reaching analyser)
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 200; // Low crossover frequency
      bassFilter.gain.value = eqBass;

      const midFilter = ctx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1200; // mid band range
      midFilter.Q.value = 1.0;
      midFilter.gain.value = eqMid;

      const trebleFilter = ctx.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 4000; // High frequency crossover
      trebleFilter.gain.value = eqTreble;

      // Master Gain for Volume mapping (Fidelity master always at 1.0, with fade effects applied to it)
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;

      // Local Preview Gain Node connected only to physical hardware speakers
      const previewGain = ctx.createGain();
      previewGain.gain.value = isMuted ? 0 : volume;

      // Connections: source -> EQ Chain (Bass -> Mid -> Treble)
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      
      // Parallel routing logic to avoid silencing source files from analyser scope:
      // 1) Route EQ output directly to Analyser (Analysis path)
      trebleFilter.connect(analyser);
      // 2) Route EQ output to master Volume gain node (Fidelity path)
      trebleFilter.connect(gainNode);

      // Route main gain node output to:
      // A) speakers (via PreviewGainNode for dynamic volume/mute slider dampening)
      gainNode.connect(previewGain);
      previewGain.connect(ctx.destination);

      // B) Master Recording Destination for high-fidelity export captures
      const audioDestination = ctx.createMediaStreamDestination();
      audioDestinationRef.current = audioDestination;
      gainNode.connect(audioDestination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;
      previewGainNodeRef.current = previewGain;
      bassFilterRef.current = bassFilter;
      midFilterRef.current = midFilter;
      trebleFilterRef.current = trebleFilter;

      // Connect HTML5 Audio Element source securely (only once)
      if (audioRef.current && !mediaSourceRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(bassFilter);
        mediaSourceRef.current = source;
      }

      // If an overlay video exists, auto-route its audio
      if (overlayVideoRef.current && visuals.overlayVideoUrl) {
        initOverlayAudio(overlayVideoRef.current);
      }
    } catch (err) {
      console.warn("Could not bootstrap Web Audio Context due to browser constraints:", err);
    }
  };

  // Keep Analyser fftSize in sync
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = visuals.fftSize;
    }
  }, [visuals.fftSize]);

  // Keep Analyser smoothingTimeConstant in sync
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = typeof visuals.smoothing === 'number' ? visuals.smoothing : 0.8;
    }
  }, [visuals.smoothing]);

  // Keep EQ levels aligned with Filter Nodes dynamically
  useEffect(() => {
    if (bassFilterRef.current && audioContextRef.current) {
      bassFilterRef.current.gain.setValueAtTime(eqBass, audioContextRef.current.currentTime);
    }
  }, [eqBass]);

  useEffect(() => {
    if (midFilterRef.current && audioContextRef.current) {
      midFilterRef.current.gain.setValueAtTime(eqMid, audioContextRef.current.currentTime);
    }
  }, [eqMid]);

  useEffect(() => {
    if (trebleFilterRef.current && audioContextRef.current) {
      trebleFilterRef.current.gain.setValueAtTime(eqTreble, audioContextRef.current.currentTime);
    }
  }, [eqTreble]);

  // Keep volume & mute aligned with Node
  useEffect(() => {
    if (previewGainNodeRef.current && audioContextRef.current) {
      previewGainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  // Handle interactive manual seeking of the visualizer preview timeline
  const handleTimelineSeek = (newTime: number) => {
    initAudioSystem();
    const duration = trackDuration || 30;
    const targetTime = Math.max(0, Math.min(newTime, duration));
    
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }

    // Recalculate scheduled gains of master gainNodeRef
    if (gainNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const fadeIn = visuals.fadeInDuration !== undefined ? visuals.fadeInDuration : 0;
      const fadeOut = visuals.fadeOutDuration !== undefined ? visuals.fadeOutDuration : 0;

      gainNodeRef.current.gain.cancelScheduledValues(now);

      // Fade In mapping
      if (targetTime < fadeIn && fadeIn > 0) {
        const startVolume = targetTime / fadeIn;
        gainNodeRef.current.gain.setValueAtTime(startVolume, now);
        gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + (fadeIn - targetTime));
      } else {
        gainNodeRef.current.gain.setValueAtTime(1.0, now);
      }

      // Fade Out mapping
      if (fadeOut > 0 && duration > fadeOut) {
        if (targetTime < duration - fadeOut) {
          const fadeOutStartTime = now + (duration - fadeOut - targetTime);
          gainNodeRef.current.gain.setValueAtTime(1.0, fadeOutStartTime);
          gainNodeRef.current.gain.linearRampToValueAtTime(0, now + (duration - targetTime));
        } else {
          const remaining = duration - targetTime;
          const startVolume = remaining > 0 ? (remaining / fadeOut) : 0;
          gainNodeRef.current.gain.setValueAtTime(startVolume, now);
          gainNodeRef.current.gain.linearRampToValueAtTime(0, now + Math.max(0, remaining));
        }
      }
    }
  };

  // Handle Play / Pause for Custom track
  const handleTogglePlayback = async () => {
    initAudioSystem();

    // Ensure AudioContext is resumed (browser protection check)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);

      // Reset scheduled gains on stop or pause
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
        gainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      }
    } else {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          if (audioTrack.file) {
            await audioRef.current.play();
          }
        }
        setIsPlaying(true);

        // Schedule smooth Audio Fade In / Out on master volume gainNodeRef
        if (gainNodeRef.current && audioContextRef.current) {
          const ctx = audioContextRef.current;
          const now = ctx.currentTime;
          const fadeIn = visuals.fadeInDuration !== undefined ? visuals.fadeInDuration : 0;
          const fadeOut = visuals.fadeOutDuration !== undefined ? visuals.fadeOutDuration : 0;
          const duration = audioTrack.duration || (audioRef.current ? audioRef.current.duration : 30) || 30;

          gainNodeRef.current.gain.cancelScheduledValues(now);

          // Apply Fade In
          if (fadeIn > 0) {
            gainNodeRef.current.gain.setValueAtTime(0, now);
            gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + fadeIn);
          } else {
            gainNodeRef.current.gain.setValueAtTime(1.0, now);
          }

          // Apply Fade Out
          if (fadeOut > 0 && duration > fadeOut) {
            const fadeOutStartTime = now + duration - fadeOut;
            gainNodeRef.current.gain.setValueAtTime(1.0, fadeOutStartTime);
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + duration);
          }
        }
      } catch (e) {
        console.error("Playback error:", e);
      }
    }
  };

  const handleStopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);

    // Reset scheduled gain mappings
    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
        gainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current.currentTime);
      } catch (e) {}
    }
  };

  // HTML audio progress triggers updating times
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
    };

    const onLoadedMetadata = () => {
      setTrackDuration(el.duration);
      setAudioTrack(prev => ({ ...prev, duration: el.duration }));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
    };
  }, [audioTrack.objectUrl]);

  // Simulated timer loop for playback if there is no audio file loaded but visualizer is playing
  useEffect(() => {
    let dummyInterval: any = null;
    if (isPlaying && !audioTrack.file) {
      dummyInterval = setInterval(() => {
        setCurrentTime(prev => {
          const limit = audioTrack.duration || 30;
          const next = prev + 0.1;
          if (next >= limit) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else if (!isPlaying && !audioTrack.file) {
      setCurrentTime(0);
    }
    return () => clearInterval(dummyInterval);
  }, [isPlaying, audioTrack.file, audioTrack.duration]);

  // Handle Drag & Drop uploading processes
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const loadAudioFile = (file: File) => {
    initAudioSystem();
    const url = URL.createObjectURL(file);
    
    // Attempt parsing artist/title from filename
    let title = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
    let artist = 'Local Artist';
    
    const parts = title.split(' - ');
    if (parts.length > 1) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    setAudioTrack({
      name: title,
      artist: artist,
      duration: 0,
      file: file,
      objectUrl: url,
      coverUrl: null,
    });

    setTitleOverlay(prev => ({
      ...prev,
      text: title,
      artist: artist,
    }));

    setIsPlaying(false);
    setCurrentTime(0);
    
    // Auto-play the dropped audio
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log('Auto-play blocked, waiting for interaction'));
      }
    }, 150);
  };

  const loadBackgroundImgFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const imgObj = new Image();
    imgObj.src = url;
    bgImageRef.current = imgObj;
    
    setBackground(prev => ({
      ...prev,
      type: 'image',
      imageUrl: url,
    }));
  };

  const loadBackgroundVidFile = (file: File) => {
    const url = URL.createObjectURL(file);
    
    setBackground(prev => ({
      ...prev,
      type: 'video',
      videoUrl: url,
    }));

    // Generate HTML5 Video Node dynamically for canvas loop usage
    setTimeout(() => {
      const vid = document.createElement('video');
      vid.src = url;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play().then(() => {
        bgVideoRef.current = vid;
      }).catch(e => {
        console.warn("Background video play blocked:", e);
      });
    }, 100);
  };

  const loadOverlayVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    
    setVisuals(prev => ({
      ...prev,
      overlayVideoUrl: url,
    }));

    if (overlayVideoRef.current) {
      overlayVideoRef.current.src = url;
      overlayVideoRef.current.load();
      overlayVideoRef.current.muted = false; // We control output volume strictly via Web Audio GainNode!
      overlayVideoRef.current.volume = 1.0;

      const shouldPlay = isPlaying;
      if (shouldPlay) {
        overlayVideoRef.current.play().then(() => {
          initAudioSystem();
          if (overlayVideoRef.current) {
            initOverlayAudio(overlayVideoRef.current);
          }
        }).catch(e => {
          console.warn("Overlay video play blocked:", e);
        });
      } else {
        initAudioSystem();
        if (overlayVideoRef.current) {
          initOverlayAudio(overlayVideoRef.current);
        }
      }
    }
  };

  const handleAddOverlayImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        
        // Measure size to compute correct aspect ratio
        const tempImg = new Image();
        tempImg.onload = () => {
          const aspect = tempImg.width / tempImg.height || 1.0;
          const newId = `img_${Date.now()}`;
          
          const newImage: OverlayImage = {
            id: newId,
            url: url,
            name: file.name,
            x: 50,
            y: 50,
            scale: 30, // reasonable default size
            opacity: 100,
            aspectRatio: aspect,
            enableBeatReaction: false,
            beatReactionType: 'bass',
            beatReactionIntensity: 1.0
          };
          
          // Instantiate the image tag for canvas cached rendering
          const realImg = new Image();
          realImg.src = url;
          overlayImageElementsRef.current[newId] = realImg;
          
          setOverlayImages(prev => [...prev, newImage]);
          setSelectedOverlayImageId(newId);
        };
        tempImg.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearOverlayVideo = () => {
    setVisuals(prev => ({
      ...prev,
      overlayVideoUrl: null,
    }));
    if (overlayVideoRef.current) {
      overlayVideoRef.current.pause();
      overlayVideoRef.current.src = '';
    }
  };

  const getCanvasCoords = (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    const xFrac = (clientX - rect.left) / rect.width;
    const yFrac = (clientY - rect.top) / rect.height;
    
    return {
      x: xFrac * canvas.width,
      y: yFrac * canvas.height,
      canvasHitRadius: 18 * (canvas.width / rect.width)
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'overlay') return;

    const coords = getCanvasCoords(e.clientX, e.clientY, canvas);
    if (!coords) return;
    const { x, y, canvasHitRadius } = coords;

    // Check if clicked any overlay sticker image first (reverse draw order)
    const revImages = [...overlayImages].reverse();
    for (const imgItem of revImages) {
      const imgEl = overlayImageElementsRef.current[imgItem.id];
      if (!imgEl || !imgEl.complete) continue;

      const scalePct = imgItem.scale / 100;
      const imgAspect = imgItem.aspectRatio || 1.0;
      const targetWidth = canvas.width * 0.5 * scalePct; 
      const targetHeight = targetWidth / imgAspect;

      const cx = canvas.width * (imgItem.x / 100);
      const cy = canvas.height * (imgItem.y / 100);

      const x1 = cx - targetWidth / 2;
      const y1 = cy - targetHeight / 2;
      const x2 = cx + targetWidth / 2;
      const y2 = cy + targetHeight / 2;

      const dTL = Math.hypot(x - x1, y - y1);
      const dTR = Math.hypot(x - x2, y - y1);
      const dBL = Math.hypot(x - x1, y - y2);
      const dBR = Math.hypot(x - x2, y - y2);

      // Corner handles scale
      if (selectedOverlayImageId === imgItem.id && (dTL < canvasHitRadius || dTR < canvasHitRadius || dBL < canvasHitRadius || dBR < canvasHitRadius)) {
        dragRef.current = {
          type: 'scale-image',
          targetId: imgItem.id,
          startXPct: imgItem.x,
          startYPct: imgItem.y,
          startScalePct: imgItem.scale,
          startX: e.clientX,
          startY: e.clientY,
          startDist: Math.hypot(x - cx, y - cy),
          startCanvasX: x,
          startCanvasY: y
        };
        e.preventDefault();
        return;
      }
      // Inner body move
      else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        setSelectedOverlayImageId(imgItem.id);
        dragRef.current = {
          type: 'move-image',
          targetId: imgItem.id,
          startXPct: imgItem.x,
          startYPct: imgItem.y,
          startScalePct: imgItem.scale,
          startX: e.clientX,
          startY: e.clientY,
          startDist: 0,
          startCanvasX: x,
          startCanvasY: y
        };
        e.preventDefault();
        return;
      }
    }

    // fallback to main overlay video check
    if (!visuals.overlayVideoUrl) {
      // Clicked on empty space: deselect active sticker
      setSelectedOverlayImageId(null);
      return;
    }

    // Calculate dimensions
    const scalePct = visuals.overlayScale !== undefined ? visuals.overlayScale / 100 : 0.5;
    const videoAspect = (overlayVideoRef.current && overlayVideoRef.current.readyState >= 2)
      ? (overlayVideoRef.current.videoWidth / overlayVideoRef.current.videoHeight)
      : 16/9;
    const mode = visuals.overlayScaleMode || 'fit';

    let targetWidth = 0;
    let targetHeight = 0;

    if (mode === 'cover') {
      const canvasAspect = canvas.width / canvas.height;
      if (canvasAspect > videoAspect) {
        targetWidth = canvas.width;
        targetHeight = targetWidth / videoAspect;
      } else {
        targetHeight = canvas.height;
        targetWidth = targetHeight * videoAspect;
      }
      targetWidth *= scalePct;
      targetHeight *= scalePct;
    } else {
      targetWidth = canvas.width * 0.8 * scalePct; 
      targetHeight = targetWidth / videoAspect;
    }

    const xPct = visuals.overlayX !== undefined ? visuals.overlayX : 50;
    const yPct = visuals.overlayY !== undefined ? visuals.overlayY : 50;

    const cx = canvas.width * (xPct / 100);
    const cy = canvas.height * (yPct / 100);

    const x1 = cx - targetWidth / 2;
    const y1 = cy - targetHeight / 2;
    const x2 = cx + targetWidth / 2;
    const y2 = cy + targetHeight / 2;

    const dTL = Math.hypot(x - x1, y - y1);
    const dTR = Math.hypot(x - x2, y - y1);
    const dBL = Math.hypot(x - x1, y - y2);
    const dBR = Math.hypot(x - x2, y - y2);

    if (dTL < canvasHitRadius || dTR < canvasHitRadius || dBL < canvasHitRadius || dBR < canvasHitRadius) {
      setSelectedOverlayImageId(null); // deselect image if video hits
      dragRef.current = {
        type: 'scale',
        startXPct: xPct,
        startYPct: yPct,
        startScalePct: visuals.overlayScale !== undefined ? visuals.overlayScale : 50,
        startX: e.clientX,
        startY: e.clientY,
        startDist: Math.hypot(x - cx, y - cy),
        startCanvasX: x,
        startCanvasY: y
      };
      e.preventDefault();
    } else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      setSelectedOverlayImageId(null);
      dragRef.current = {
        type: 'move',
        startXPct: xPct,
        startYPct: yPct,
        startScalePct: visuals.overlayScale !== undefined ? visuals.overlayScale : 50,
        startX: e.clientX,
        startY: e.clientY,
        startDist: 0,
        startCanvasX: x,
        startCanvasY: y
      };
      e.preventDefault();
    } else {
      // Clicked on empty canvas space
      setSelectedOverlayImageId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'overlay') return;

    const coords = getCanvasCoords(e.clientX, e.clientY, canvas);
    if (!coords) return;
    const { x, y, canvasHitRadius } = coords;

    // Check if dragging is active
    if (dragRef.current) {
      if (dragRef.current.type === 'move-image') {
        const deltaX = x - dragRef.current.startCanvasX;
        const deltaY = y - dragRef.current.startCanvasY;
        const deltaXPct = (deltaX / canvas.width) * 100;
        const deltaYPct = (deltaY / canvas.height) * 100;

        const targetId = dragRef.current.targetId;
        setOverlayImages(prev => prev.map(img => img.id === targetId ? {
          ...img,
          x: Math.max(0, Math.min(100, Math.round(dragRef.current!.startXPct + deltaXPct))),
          y: Math.max(0, Math.min(100, Math.round(dragRef.current!.startYPct + deltaYPct)))
        } : img));
      } else if (dragRef.current.type === 'scale-image') {
        const targetId = dragRef.current.targetId;
        const imgItem = overlayImages.find(img => img.id === targetId);
        if (imgItem) {
          const cx = canvas.width * (imgItem.x / 100);
          const cy = canvas.height * (imgItem.y / 100);
          const currentDist = Math.hypot(x - cx, y - cy);
          const nextScale = dragRef.current.startScalePct * (currentDist / dragRef.current.startDist);
          setOverlayImages(prev => prev.map(img => img.id === targetId ? {
            ...img,
            scale: Math.max(5, Math.min(200, Math.round(nextScale)))
          } : img));
        }
      } else if (dragRef.current.type === 'move') {
        const deltaX = x - dragRef.current.startCanvasX;
        const deltaY = y - dragRef.current.startCanvasY;
        const deltaXPct = (deltaX / canvas.width) * 100;
        const deltaYPct = (deltaY / canvas.height) * 100;

        setVisuals(prev => ({
          ...prev,
          overlayX: Math.max(0, Math.min(100, Math.round(dragRef.current!.startXPct + deltaXPct))),
          overlayY: Math.max(0, Math.min(100, Math.round(dragRef.current!.startYPct + deltaYPct)))
        }));
      } else if (dragRef.current.type === 'scale') {
        const xPct = visuals.overlayX !== undefined ? visuals.overlayX : 50;
        const yPct = visuals.overlayY !== undefined ? visuals.overlayY : 50;
        const cx = canvas.width * (xPct / 100);
        const cy = canvas.height * (yPct / 100);
        const currentDist = Math.hypot(x - cx, y - cy);
        const nextScale = dragRef.current.startScalePct * (currentDist / dragRef.current.startDist);
        setVisuals(prev => ({
          ...prev,
          overlayScale: Math.max(5, Math.min(100, Math.round(nextScale)))
        }));
      }
      return;
    }

    // cursor styling when hovering over handles/content
    // Check overlay images in reverse order
    const revImages = [...overlayImages].reverse();
    for (const imgItem of revImages) {
      const scalePct = imgItem.scale / 100;
      const imgAspect = imgItem.aspectRatio || 1.0;
      const targetWidth = canvas.width * 0.5 * scalePct; 
      const targetHeight = targetWidth / imgAspect;

      const cx = canvas.width * (imgItem.x / 100);
      const cy = canvas.height * (imgItem.y / 100);

      const x1 = cx - targetWidth / 2;
      const y1 = cy - targetHeight / 2;
      const x2 = cx + targetWidth / 2;
      const y2 = cy + targetHeight / 2;

      const dTL = Math.hypot(x - x1, y - y1);
      const dTR = Math.hypot(x - x2, y - y1);
      const dBL = Math.hypot(x - x1, y - y2);
      const dBR = Math.hypot(x - x2, y - y2);

      if (selectedOverlayImageId === imgItem.id && (dTL < canvasHitRadius || dBR < canvasHitRadius)) {
        canvas.style.cursor = 'nwse-resize';
        return;
      } else if (selectedOverlayImageId === imgItem.id && (dTR < canvasHitRadius || dBL < canvasHitRadius)) {
        canvas.style.cursor = 'nesw-resize';
        return;
      } else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        canvas.style.cursor = 'move';
        return;
      }
    }

    if (!visuals.overlayVideoUrl) {
      canvas.style.cursor = 'default';
      return;
    }

    const scalePct = visuals.overlayScale !== undefined ? visuals.overlayScale / 100 : 0.5;
    const videoAspect = (overlayVideoRef.current && overlayVideoRef.current.readyState >= 2)
      ? (overlayVideoRef.current.videoWidth / overlayVideoRef.current.videoHeight)
      : 16/9;
    const mode = visuals.overlayScaleMode || 'fit';

    let targetWidth = 0;
    let targetHeight = 0;

    if (mode === 'cover') {
      const canvasAspect = canvas.width / canvas.height;
      if (canvasAspect > videoAspect) {
        targetWidth = canvas.width;
        targetHeight = targetWidth / videoAspect;
      } else {
        targetHeight = canvas.height;
        targetWidth = targetHeight * videoAspect;
      }
      targetWidth *= scalePct;
      targetHeight *= scalePct;
    } else {
      targetWidth = canvas.width * 0.8 * scalePct; 
      targetHeight = targetWidth / videoAspect;
    }

    const xPct = visuals.overlayX !== undefined ? visuals.overlayX : 50;
    const yPct = visuals.overlayY !== undefined ? visuals.overlayY : 50;

    const cx = canvas.width * (xPct / 100);
    const cy = canvas.height * (yPct / 100);

    const x1 = cx - targetWidth / 2;
    const y1 = cy - targetHeight / 2;
    const x2 = cx + targetWidth / 2;
    const y2 = cy + targetHeight / 2;

    const dTL = Math.hypot(x - x1, y - y1);
    const dTR = Math.hypot(x - x2, y - y1);
    const dBL = Math.hypot(x - x1, y - y2);
    const dBR = Math.hypot(x - x2, y - y2);

    if (dTL < canvasHitRadius || dBR < canvasHitRadius) {
      canvas.style.cursor = 'nwse-resize';
    } else if (dTR < canvasHitRadius || dBL < canvasHitRadius) {
      canvas.style.cursor = 'nesw-resize';
    } else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const handleCanvasMouseUp = () => {
    dragRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'overlay') return;

    const coords = getCanvasCoords(touch.clientX, touch.clientY, canvas);
    if (!coords) return;
    const { x, y, canvasHitRadius } = coords;

    // Check custom image stickers overlays first (reverse draw order)
    const revImages = [...overlayImages].reverse();
    for (const imgItem of revImages) {
      const imgEl = overlayImageElementsRef.current[imgItem.id];
      if (!imgEl || !imgEl.complete) continue;

      const scalePct = imgItem.scale / 100;
      const imgAspect = imgItem.aspectRatio || 1.0;
      const targetWidth = canvas.width * 0.5 * scalePct; 
      const targetHeight = targetWidth / imgAspect;

      const cx = canvas.width * (imgItem.x / 100);
      const cy = canvas.height * (imgItem.y / 100);

      const x1 = cx - targetWidth / 2;
      const y1 = cy - targetHeight / 2;
      const x2 = cx + targetWidth / 2;
      const y2 = cy + targetHeight / 2;

      const dTL = Math.hypot(x - x1, y - y1);
      const dTR = Math.hypot(x - x2, y - y1);
      const dBL = Math.hypot(x - x1, y - y2);
      const dBR = Math.hypot(x - x2, y - y2);

      if (selectedOverlayImageId === imgItem.id && (dTL < canvasHitRadius || dTR < canvasHitRadius || dBL < canvasHitRadius || dBR < canvasHitRadius)) {
        dragRef.current = {
          type: 'scale-image',
          targetId: imgItem.id,
          startXPct: imgItem.x,
          startYPct: imgItem.y,
          startScalePct: imgItem.scale,
          startX: touch.clientX,
          startY: touch.clientY,
          startDist: Math.hypot(x - cx, y - cy),
          startCanvasX: x,
          startCanvasY: y
        };
        if (e.cancelable) e.preventDefault();
        return;
      } else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        setSelectedOverlayImageId(imgItem.id);
        dragRef.current = {
          type: 'move-image',
          targetId: imgItem.id,
          startXPct: imgItem.x,
          startYPct: imgItem.y,
          startScalePct: imgItem.scale,
          startX: touch.clientX,
          startY: touch.clientY,
          startDist: 0,
          startCanvasX: x,
          startCanvasY: y
        };
        if (e.cancelable) e.preventDefault();
        return;
      }
    }

    if (!visuals.overlayVideoUrl) {
      setSelectedOverlayImageId(null);
      return;
    }

    // Calculate dimensions
    const scalePct = visuals.overlayScale !== undefined ? visuals.overlayScale / 100 : 0.5;
    const videoAspect = (overlayVideoRef.current && overlayVideoRef.current.readyState >= 2)
      ? (overlayVideoRef.current.videoWidth / overlayVideoRef.current.videoHeight)
      : 16/9;
    const mode = visuals.overlayScaleMode || 'fit';

    let targetWidth = 0;
    let targetHeight = 0;

    if (mode === 'cover') {
      const canvasAspect = canvas.width / canvas.height;
      if (canvasAspect > videoAspect) {
        targetWidth = canvas.width;
        targetHeight = targetWidth / videoAspect;
      } else {
        targetHeight = canvas.height;
        targetWidth = targetHeight * videoAspect;
      }
      targetWidth *= scalePct;
      targetHeight *= scalePct;
    } else {
      targetWidth = canvas.width * 0.8 * scalePct; 
      targetHeight = targetWidth / videoAspect;
    }

    const xPct = visuals.overlayX !== undefined ? visuals.overlayX : 50;
    const yPct = visuals.overlayY !== undefined ? visuals.overlayY : 50;

    const cx = canvas.width * (xPct / 100);
    const cy = canvas.height * (yPct / 100);

    const x1 = cx - targetWidth / 2;
    const y1 = cy - targetHeight / 2;
    const x2 = cx + targetWidth / 2;
    const y2 = cy + targetHeight / 2;

    const dTL = Math.hypot(x - x1, y - y1);
    const dTR = Math.hypot(x - x2, y - y1);
    const dBL = Math.hypot(x - x1, y - y2);
    const dBR = Math.hypot(x - x2, y - y2);

    if (dTL < canvasHitRadius || dTR < canvasHitRadius || dBL < canvasHitRadius || dBR < canvasHitRadius) {
      setSelectedOverlayImageId(null);
      dragRef.current = {
        type: 'scale',
        startXPct: xPct,
        startYPct: yPct,
        startScalePct: visuals.overlayScale !== undefined ? visuals.overlayScale : 50,
        startX: touch.clientX,
        startY: touch.clientY,
        startDist: Math.hypot(x - cx, y - cy),
        startCanvasX: x,
        startCanvasY: y
      };
      if (e.cancelable) e.preventDefault();
    } else if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
      setSelectedOverlayImageId(null);
      dragRef.current = {
        type: 'move',
        startXPct: xPct,
        startYPct: yPct,
        startScalePct: visuals.overlayScale !== undefined ? visuals.overlayScale : 50,
        startX: touch.clientX,
        startY: touch.clientY,
        startDist: 0,
        startCanvasX: x,
        startCanvasY: y
      };
      if (e.cancelable) e.preventDefault();
    } else {
      setSelectedOverlayImageId(null);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0 || !dragRef.current) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoords(touch.clientX, touch.clientY, canvas);
    if (!coords) return;
    const { x, y } = coords;

    if (dragRef.current.type === 'move-image') {
      const deltaX = x - dragRef.current.startCanvasX;
      const deltaY = y - dragRef.current.startCanvasY;
      const deltaXPct = (deltaX / canvas.width) * 100;
      const deltaYPct = (deltaY / canvas.height) * 100;

      const targetId = dragRef.current.targetId;
      setOverlayImages(prev => prev.map(img => img.id === targetId ? {
        ...img,
        x: Math.max(0, Math.min(100, Math.round(dragRef.current!.startXPct + deltaXPct))),
        y: Math.max(0, Math.min(100, Math.round(dragRef.current!.startYPct + deltaYPct)))
      } : img));
    } else if (dragRef.current.type === 'scale-image') {
      const targetId = dragRef.current.targetId;
      const imgItem = overlayImages.find(img => img.id === targetId);
      if (imgItem) {
        const cx = canvas.width * (imgItem.x / 100);
        const cy = canvas.height * (imgItem.y / 100);
        const currentDist = Math.hypot(x - cx, y - cy);
        const nextScale = dragRef.current.startScalePct * (currentDist / dragRef.current.startDist);
        setOverlayImages(prev => prev.map(img => img.id === targetId ? {
          ...img,
          scale: Math.max(5, Math.min(200, Math.round(nextScale)))
        } : img));
      }
    } else if (dragRef.current.type === 'move') {
      const deltaX = x - dragRef.current.startCanvasX;
      const deltaY = y - dragRef.current.startCanvasY;
      const deltaXPct = (deltaX / canvas.width) * 100;
      const deltaYPct = (deltaY / canvas.height) * 100;

      setVisuals(prev => ({
        ...prev,
        overlayX: Math.max(0, Math.min(100, Math.round(dragRef.current!.startXPct + deltaXPct))),
        overlayY: Math.max(0, Math.min(100, Math.round(dragRef.current!.startYPct + deltaYPct)))
      }));
    } else if (dragRef.current.type === 'scale') {
      const xPct = visuals.overlayX !== undefined ? visuals.overlayX : 50;
      const yPct = visuals.overlayY !== undefined ? visuals.overlayY : 50;
      const cx = canvas.width * (xPct / 100);
      const cy = canvas.height * (yPct / 100);
      const currentDist = Math.hypot(x - cx, y - cy);
      const nextScale = dragRef.current.startScalePct * (currentDist / dragRef.current.startDist);
      setVisuals(prev => ({
        ...prev,
        overlayScale: Math.max(5, Math.min(100, Math.round(nextScale)))
      }));
    }
    if (e.cancelable) e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const type = file.type;

      if (type.startsWith('audio/')) {
        loadAudioFile(file);
      } else if (type.startsWith('image/')) {
        loadBackgroundImgFile(file);
      } else if (type.startsWith('video/') || type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov')) {
        loadBackgroundVidFile(file);
      } else {
        alert("Unsupported file format! Please drop an audio, image, or video file.");
      }
    }
  };

  // Traditional manual file picker triggers
  const handleManualAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadAudioFile(e.target.files[0]);
    }
  };

  const handleManualBgAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const type = file.type;
      if (type.startsWith('image/')) {
        loadBackgroundImgFile(file);
      } else if (type.startsWith('video/') || type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov')) {
        loadBackgroundVidFile(file);
      } else {
        alert("Unsupported file format! Please upload an image (PNG, JPG, JPEG, WEBP) or video (MP4, WebM, MOV).");
      }
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const imgObj = new Image();
      imgObj.src = url;
      watermarkImageRef.current = imgObj;
      setVisuals(prev => ({
        ...prev,
        watermarkUrl: url,
        watermarkOpacity: prev.watermarkOpacity !== undefined ? prev.watermarkOpacity : 0.8,
        watermarkPosition: prev.watermarkPosition || 'top-right'
      }));
    }
  };

  const handleClearWatermark = () => {
    setVisuals(prev => ({
      ...prev,
      watermarkUrl: null
    }));
    watermarkImageRef.current = null;
  };

  const handleTapTempo = () => {
    const now = Date.now();
    setTapTimestamps(prev => {
      // Filter out taps older than 2.5 seconds (2500ms) to reset the chain
      const filtered = prev.filter(t => now - t < 2500);
      const newTaps = [...filtered, now];

      if (newTaps.length > 1) {
        // Calculate intervals
        const intervals: number[] = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        // Average interval
        const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        if (avgInterval > 0) {
          const calculatedBpm = Math.round(60000 / avgInterval);
          // Clamp BPM between 40 and 240
          const clampedBpm = Math.max(40, Math.min(240, calculatedBpm));
          
          setVisuals(prevVisuals => ({
            ...prevVisuals,
            beatLockBpm: clampedBpm,
            beatLock: true // automatically enable beat lock configuration on tap
          }));
        }
      } else {
        // First tap, ensure a decent starting value is initialized
        setVisuals(prevVisuals => ({
          ...prevVisuals,
          beatLockBpm: prevVisuals.beatLockBpm || 120
        }));
      }
      return newTaps;
    });
  };

  // Performance tracking refs to prevent continuous teardown & recreation of the render loop
  const visualsRef = useRef(visuals);
  const particlesSetRef = useRef(particlesSet);
  const backgroundRef = useRef(background);
  const titleOverlayRef = useRef(titleOverlay);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(audioTrack.duration);
  const isExportingRef = useRef(isExporting);
  const exportFpsRef = useRef(exportSettings.fps);
  const activeTabRef = useRef(activeTab);

  const renderFrameRef = useRef<(() => void) | null>(null);
  const currentFrameOverrideRef = useRef<{
    analyserData: Uint8Array;
    waveformData: Uint8Array;
    isBeat: boolean;
    beatIntensity: number;
  } | null>(null);
  const lastBeatTimeSecondsRef = useRef<number>(0);
  const exportTimerWorkerRef = useRef<Worker | null>(null);
  const ffmpegRef = useRef<any>(null);

  useEffect(() => { visualsRef.current = visuals; }, [visuals]);
  useEffect(() => { particlesSetRef.current = particlesSet; }, [particlesSet]);
  useEffect(() => { backgroundRef.current = background; }, [background]);
  useEffect(() => { titleOverlayRef.current = titleOverlay; }, [titleOverlay]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = audioTrack.duration; }, [audioTrack.duration]);
  useEffect(() => { isExportingRef.current = isExporting; }, [isExporting]);
  useEffect(() => { exportFpsRef.current = exportSettings.fps; }, [exportSettings.fps]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Initialize persistent overlay video element on mount
  useEffect(() => {
    const vid = document.createElement('video');
    vid.loop = true;
    vid.crossOrigin = 'anonymous';
    vid.playsInline = true;
    vid.muted = false; // We control output volume strictly via Web Audio GainNode!
    overlayVideoRef.current = vid;

    return () => {
      vid.pause();
      vid.src = '';
      overlayVideoRef.current = null;
    };
  }, []);

  // Sync foreground video playing state with track isPlaying state
  useEffect(() => {
    const shouldPlay = isPlaying;
    if (overlayVideoRef.current && visuals.overlayVideoUrl) {
      if (shouldPlay) {
        overlayVideoRef.current.play().catch(e => {
          console.warn("Overlay video play failed or blocked:", e);
        });
      } else {
        overlayVideoRef.current.pause();
      }
    }
  }, [isPlaying, visuals.overlayVideoUrl]);

  // Keep overlay volume & mute aligned with overlayGainNode
  useEffect(() => {
    if (overlayGainNodeRef.current && audioContextRef.current) {
      const vol = visuals.overlayVolume !== undefined ? visuals.overlayVolume / 100 : 1.0;
      const muted = !!visuals.overlayMuted;
      overlayGainNodeRef.current.gain.setValueAtTime(
        muted ? 0 : vol,
        audioContextRef.current.currentTime
      );
    }
  }, [visuals.overlayVolume, visuals.overlayMuted]);

  useEffect(() => {
    if (visuals.watermarkUrl) {
      const imgObj = new Image();
      imgObj.src = visuals.watermarkUrl;
      watermarkImageRef.current = imgObj;
    } else {
      watermarkImageRef.current = null;
    }
  }, [visuals.watermarkUrl]);

  // Clean trigger to rebuild particles pool when settings change structure
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      particlesPoolRef.current = initParticles(particlesSet, canvas.width, canvas.height);
    }
  }, [particlesSet]);

  // Canvas Drawing & Animation Core Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastBeatTime = 0;
    const beatCooldown = 150; // ms
    let currentShake = 0; // Decaying pixel-based offset representing active shake intensity
    let dynamicHeavyShake = 0; // Decaying heavy kick/sub-bass speaker shake intensity

    // Persistent interpolation arrays for motion smoothing
    let smoothAnalyser: Float32Array | null = null;
    let smoothWaveform: Float32Array | null = null;

    // CFR timing variables
    let lastFrameTime = performance.now();
    let lastRafTime = performance.now();
    let backupTimer: any = null;

    const renderFrame = () => {
      // Read audio spectrum buffer if audio systems are initialized
      let analyserData = new Uint8Array(visualsRef.current.fftSize / 2);
      let waveformData = new Uint8Array(visualsRef.current.fftSize / 2);

      let isBeat = false;
      let beatIntensity = 0;

      const isBeatLocked = !!visualsRef.current.beatLock;
      const bpm = visualsRef.current.beatLockBpm || 120;
      const bpmInterval = 60000 / bpm;
      const timeNow = Date.now();

      if (currentFrameOverrideRef.current) {
        // Deterministic offline render path
        analyserData.set(currentFrameOverrideRef.current.analyserData);
        waveformData.set(currentFrameOverrideRef.current.waveformData);
        isBeat = currentFrameOverrideRef.current.isBeat;
        beatIntensity = currentFrameOverrideRef.current.beatIntensity;
      } else if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(analyserData);
        analyserRef.current.getByteTimeDomainData(waveformData);

        if (isBeatLocked) {
          if (timeNow - lastBeatTime >= bpmInterval) {
            isBeat = true;
            beatIntensity = 1.0;
            lastBeatTime = timeNow;
          }
        } else {
          // Simple beat detect: monitor bass index (usually peak mid-lows bin 1 - 5)
          let bassSum = 0;
          const cutoff = Math.floor(analyserData.length * 0.12) || 4; // target bass bins
          for (let i = 0; i < cutoff; i++) {
            bassSum += analyserData[i];
          }
          const bassVal = bassSum / cutoff;
          
          // Dynamic threshold value depending on beatSensitivity
          const beatSens = visualsRef.current.beatSensitivity !== undefined ? visualsRef.current.beatSensitivity : 1.0;
          const threshold = Math.max(20, Math.min(240, 185 - (beatSens * 35)));
          if (bassVal > threshold && timeNow - lastBeatTime > beatCooldown) {
            isBeat = true;
            beatIntensity = Math.min(1.0, (bassVal - threshold) / (255 - threshold));
            lastBeatTime = timeNow;
          }
        }
      } else {
        // Fallback default idle audio values if not active
        const mockTime = Date.now() / 1500;
        for (let i = 0; i < analyserData.length; i++) {
          analyserData[i] = Math.max(0, Math.sin(mockTime * 3 + i * 0.1) * 60 + 40);
          waveformData[i] = Math.sin(mockTime * 5 + i * 0.25) * 45 + 128;
        }
        
        if (isBeatLocked) {
          if (timeNow - lastBeatTime >= bpmInterval) {
            isBeat = true;
            beatIntensity = 1.0;
            lastBeatTime = timeNow;
          }
        } else {
          // Random artificial idle beats
          if (Math.random() > 0.98) {
            isBeat = true;
            beatIntensity = 0.5;
          }
        }
      }

      // Apply Motion Smoothing if enabled in main drawing loop to reduce flickering in wave patterns
      const motionSmoothing = visualsRef.current.motionSmoothing;
      if (typeof motionSmoothing === 'number' && motionSmoothing > 0) {
        if (!smoothAnalyser || smoothAnalyser.length !== analyserData.length) {
          smoothAnalyser = new Float32Array(analyserData.length);
          for (let i = 0; i < analyserData.length; i++) {
            smoothAnalyser[i] = analyserData[i];
          }
        }
        if (!smoothWaveform || smoothWaveform.length !== waveformData.length) {
          smoothWaveform = new Float32Array(waveformData.length);
          for (let i = 0; i < waveformData.length; i++) {
            smoothWaveform[i] = waveformData[i];
          }
        }

        const smoothFactor = Math.max(0, Math.min(0.99, motionSmoothing));
        for (let i = 0; i < analyserData.length; i++) {
          smoothAnalyser[i] = smoothAnalyser[i] * smoothFactor + analyserData[i] * (1 - smoothFactor);
          smoothWaveform[i] = smoothWaveform[i] * smoothFactor + waveformData[i] * (1 - smoothFactor);
          analyserData[i] = Math.round(smoothAnalyser[i]);
          waveformData[i] = Math.round(smoothWaveform[i]);
        }
      }

      // Calculate dynamic average weights for sticker/background/shake beat reactions in real-time
      let avgBass = 0;
      let avgMain = 0;
      
      if (analyserData && analyserData.length > 0) {
        // bass is first 10% of bins
        const bassCount = Math.max(1, Math.floor(analyserData.length * 0.1));
        let bassSum = 0;
        for (let i = 0; i < bassCount; i++) {
          bassSum += analyserData[i];
        }
        avgBass = bassSum / bassCount;

        // main beat is higher mids, e.g. 15% to 50%
        const mainStart = Math.floor(analyserData.length * 0.1);
        const mainEnd = Math.floor(analyserData.length * 0.5);
        let mainSum = 0;
        let mainCount = 0;
        for (let i = mainStart; i < mainEnd; i++) {
          mainSum += analyserData[i];
          mainCount++;
        }
        avgMain = mainSum / Math.max(1, mainCount);
      }
      
      const bassReactiveFactor = avgBass / 255;
      const mainBeatReactiveFactor = avgMain / 255;

      // Decaying camera shake
      currentShake *= 0.88; // decay multiplier
      if (isBeat && visualsRef.current.cameraShake) {
        const shakeFactor = visualsRef.current.cameraShake;
        currentShake += beatIntensity * shakeFactor * 2.0;
        currentShake = Math.min(currentShake, shakeFactor * 6.0);
      }

      // 1. Kick/Sub-Bass Heavy Speaker Beat-Induced Camera Shake
      // Decays at 0.84 on every frame for brief high-energy shakes on kick peaks
      dynamicHeavyShake *= 0.84;
      if (isBeat && avgBass > 125) {
        const shakeMult = typeof visualsRef.current.shakeIntensity === 'number' ? visualsRef.current.shakeIntensity : 1.0;
        const kickFactor = (avgBass - 120) / 135;
        // Apply peak transient coordinate offset
        const impulse = Math.max(0.15, kickFactor) * 20.0 * shakeMult;
        dynamicHeavyShake = Math.min(40.0, dynamicHeavyShake + impulse);
      }

      // 2. Intensity-Based Shake: continuous subtle random translation triggered by frequency bins (avgBass/avgMain)
      let continuousShakeOffset = 0;
      if (visualsRef.current.intensityBasedShake) {
        const shakeMult = typeof visualsRef.current.shakeIntensity === 'number' ? visualsRef.current.shakeIntensity : 1.0;
        const intensityFactor = avgBass / 255.0; // 0.0 to 1.0 level
        continuousShakeOffset = intensityFactor * 7.5 * shakeMult; // continuous subtle jitter
      }

      ctx.save();

      // Global Canvas Rotation (Subtle persistent rotation of the entire stage)
      const rotDeg = visualsRef.current.canvasRotation || 0;
      if (rotDeg !== 0) {
        const rad = (rotDeg * Math.PI) / 180;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Resolve combined active camera shake:
      // Includes classic shake, heavy kick physical snap, and continuous intensity-based jitter
      const activeShake = currentShake + (dynamicHeavyShake > 0.1 ? dynamicHeavyShake : 0) + continuousShakeOffset;
      if (activeShake > 0.1) {
        const dx = (Math.random() - 0.5) * activeShake;
        const dy = (Math.random() - 0.5) * activeShake;
        ctx.translate(dx, dy);
      }

      // Camera Beat-Shake Feature (Original 2D helper retained if enabled alongside others)
      if (visualsRef.current.enableCameraBeatShake && avgBass > 140) {
        const shakePower = ((avgBass - 140) / (255 - 140)) * 12;
        const randomX = (Math.random() - 0.5) * shakePower;
        const randomY = (Math.random() - 0.5) * shakePower;
        ctx.translate(randomX, randomY);
      }

      let activeBgBeatPulse = 0;
      let isBgBeatReactEnabled = false;

      if (backgroundRef.current && backgroundRef.current.enableBeatReaction) {
        isBgBeatReactEnabled = true;
        if (backgroundRef.current.beatReactionType === 'beat') {
          activeBgBeatPulse = mainBeatReactiveFactor;
        } else {
          activeBgBeatPulse = bassReactiveFactor;
        }
      } else if (visualsRef.current && visualsRef.current.enableBeatPulse) {
        isBgBeatReactEnabled = true;
        activeBgBeatPulse = beatIntensity;
      }

      // 1. Draw Background (dim / blurred appropriately with potential beat pulse zoom)
      drawBackground(
        ctx,
        canvas.width,
        canvas.height,
        backgroundRef.current,
        bgImageRef.current,
        bgVideoRef.current,
        activeBgBeatPulse,
        isBgBeatReactEnabled
      );

      // 2. Compute and Draw Particles
      particlesPoolRef.current = updateParticles(
        particlesPoolRef.current,
        particlesSetRef.current,
        canvas.width,
        canvas.height,
        isBeat,
        beatIntensity
      );
      drawParticles(ctx, particlesPoolRef.current, particlesSetRef.current, isBeat, beatIntensity);

      // 3. Draw Foreground Video Overlay Track if present and loaded (draw before visualizer spectrum)
      if (overlayVideoRef.current && visualsRef.current.overlayVideoUrl) {
        const overlayVid = overlayVideoRef.current;
        try {
          // Check if video has ended or reached its end, loop it back safely
          if (overlayVid.ended || (overlayVid.duration && overlayVid.currentTime >= overlayVid.duration - 0.1)) {
            overlayVid.currentTime = 0;
            overlayVid.play().catch(() => {});
          }

          if (overlayVid.readyState >= 2) {
            ctx.save();
            
            const opacity = visualsRef.current.overlayOpacity !== undefined ? visualsRef.current.overlayOpacity / 100 : 1.0;
            ctx.globalAlpha = opacity;

            const scalePct = visualsRef.current.overlayScale !== undefined ? visualsRef.current.overlayScale / 100 : 0.5;
            const videoAspect = overlayVid.videoWidth / overlayVid.videoHeight || 16/9;
            const mode = visualsRef.current.overlayScaleMode || 'fit';

            let targetWidth = 0;
            let targetHeight = 0;

            if (mode === 'cover') {
              const canvasAspect = canvas.width / canvas.height;
              if (canvasAspect > videoAspect) {
                // canvas is wider than video aspect ratio
                targetWidth = canvas.width;
                targetHeight = targetWidth / videoAspect;
              } else {
                // canvas is taller or equal (e.g. Portrait)
                targetHeight = canvas.height;
                targetWidth = targetHeight * videoAspect;
              }
              // Scale cover size according to scalePct (100% covers viewport perfectly)
              targetWidth *= scalePct;
              targetHeight *= scalePct;
            } else {
              // 'fit' mode
              targetWidth = canvas.width * 0.8 * scalePct; 
              targetHeight = targetWidth / videoAspect;
            }

            const xPct = visualsRef.current.overlayX !== undefined ? visualsRef.current.overlayX : 50;
            const yPct = visualsRef.current.overlayY !== undefined ? visualsRef.current.overlayY : 50;

            const drawX = canvas.width * (xPct / 100) - targetWidth / 2;
            const drawY = canvas.height * (yPct / 100) - targetHeight / 2;

            ctx.drawImage(overlayVid, drawX, drawY, targetWidth, targetHeight);

            // Draw subtle interactive borders and handles when selecting this tab
            if (activeTabRef.current === 'overlay' && !isExportingRef.current) {
              ctx.save();
              ctx.globalAlpha = 1.0;
              
              // Draw neon border around the overlay bounds
              ctx.strokeStyle = 'rgba(236, 72, 153, 0.85)'; // semi-transparent pink
              ctx.lineWidth = 1.5;
              ctx.setLineDash([4, 4]); // dashed editor line
              ctx.strokeRect(drawX, drawY, targetWidth, targetHeight);

              // 4 corner circles
              const handleRadius = 6;
              const corners = [
                { x: drawX, y: drawY },
                { x: drawX + targetWidth, y: drawY },
                { x: drawX, y: drawY + targetHeight },
                { x: drawX + targetWidth, y: drawY + targetHeight }
              ];

              ctx.setLineDash([]); // clear dash for corners
              corners.forEach(corner => {
                // Outer halo
                ctx.beginPath();
                ctx.arc(corner.x, corner.y, handleRadius + 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
                ctx.fill();

                // Solid node core
                ctx.beginPath();
                ctx.arc(corner.x, corner.y, handleRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.strokeStyle = '#ec4899';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });

              // Center movement visualizer
              const centerX = drawX + targetWidth / 2;
              const centerY = drawY + targetHeight / 2;

              ctx.beginPath();
              ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#ec4899';
              ctx.fill();
              
              ctx.beginPath();
              ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.lineWidth = 1;
              ctx.stroke();

              // Label text overlay helper
              ctx.font = '500 10px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
              ctx.shadowBlur = 5;
              ctx.fillText('Drag corners to scale / Center to move', centerX, drawY - 8);

              ctx.restore();
            }

            ctx.restore();
          }
        } catch (overlayErr) {
          console.warn("Failsafe: error rendering overlay video, skipping this frame:", overlayErr);
        }
      }

      // 3.5 Draw Custom Multiple Foreground Image Overlays (Stickers)
      if (overlayImagesRef.current && overlayImagesRef.current.length > 0) {
        overlayImagesRef.current.forEach((imgItem) => {
          const imgEl = overlayImageElementsRef.current[imgItem.id];
          if (imgEl && (imgEl.complete || imgEl.readyState >= 2)) {
            ctx.save();
            try {
              const opacity = imgItem.opacity !== undefined ? imgItem.opacity / 100 : 1.0;
              ctx.globalAlpha = opacity;

              const scalePct = imgItem.scale / 100;
              const imgAspect = imgItem.aspectRatio || 1.0;
              // Base size relative to canvas width
              let targetWidth = canvas.width * 0.5 * scalePct;
              let targetHeight = targetWidth / imgAspect;

              // Beat reaction pulse dynamic calculation
              if (imgItem.enableBeatReaction) {
                const reactionFactor = imgItem.beatReactionType === 'beat' ? mainBeatReactiveFactor : bassReactiveFactor;
                const intensityVal = imgItem.beatReactionIntensity !== undefined ? imgItem.beatReactionIntensity : 1.0;
                // create a bouncy scale factor
                const pulseScale = 1.0 + (reactionFactor * 0.25 * intensityVal);
                targetWidth *= pulseScale;
                targetHeight *= pulseScale;
              }

              const drawX = canvas.width * (imgItem.x / 100) - targetWidth / 2;
              const drawY = canvas.height * (imgItem.y / 100) - targetHeight / 2;

              ctx.drawImage(imgEl, drawX, drawY, targetWidth, targetHeight);

              // Interactive editor controls for currently selected sticker inside overlay tab
              if (activeTabRef.current === 'overlay' && !isExportingRef.current && selectedOverlayImageIdRef.current === imgItem.id) {
                ctx.save();
                ctx.globalAlpha = 1.0;

                // Neon active blue editor border
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)'; // semi-transparent blue
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(drawX, drawY, targetWidth, targetHeight);

                // 4 corner circles
                const handleRadius = 6;
                const corners = [
                  { x: drawX, y: drawY },
                  { x: drawX + targetWidth, y: drawY },
                  { x: drawX, y: drawY + targetHeight },
                  { x: drawX + targetWidth, y: drawY + targetHeight }
                ];

                ctx.setLineDash([]); // clear dash for circles
                corners.forEach(corner => {
                  ctx.beginPath();
                  ctx.arc(corner.x, corner.y, handleRadius + 2.5, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(59, 130, 246, 0.35)'; // outer blue glow
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(corner.x, corner.y, handleRadius, 0, Math.PI * 2);
                  ctx.fillStyle = '#ffffff';
                  ctx.fill();

                  ctx.strokeStyle = '#3b82f6';
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                });

                // Center handle
                const centerX = drawX + targetWidth / 2;
                const centerY = drawY + targetHeight / 2;

                ctx.beginPath();
                ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.font = '500 10px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                ctx.shadowBlur = 5;
                ctx.fillText('Drag corners to scale sticker / Center to move', centerX, drawY - 8);

                ctx.restore();
              }
            } catch (err) {
              console.warn("Failsafe: error drawing custom overlay sticker:", err);
            } finally {
              ctx.restore();
            }
          }
        });
      }

      // 4. Draw Audio Waveform/Spectrums
      drawVisualizer(
        ctx,
        canvas.width,
        canvas.height,
        visualsRef.current,
        analyserData,
        waveformData,
        beatIntensity
      );

      // 4. Overlaid titles (with potential reactive text glows/pulses)
      drawTitleOverlay(
        ctx,
        canvas.width,
        canvas.height,
        titleOverlayRef.current,
        durationRef.current,
        currentTimeRef.current,
        visualsRef.current,
        analyserData
      );

      // 5. Dynamic Progress Bar Line overlay
      drawProgressBar(
        ctx,
        canvas.width,
        canvas.height,
        visualsRef.current,
        durationRef.current,
        currentTimeRef.current
      );

      // 6. Watermark Logo / Logo channel overlays
      drawWatermark(
        ctx,
        canvas.width,
        canvas.height,
        visualsRef.current,
        watermarkImageRef.current
      );

      // 7. Draw Cinematic Vignette Filter Overlay if enabled
      const vignetteVal = backgroundRef.current?.vignette ?? 0;
      if (vignetteVal > 0) {
        ctx.save();
        const halfW = canvas.width / 2;
        const halfH = canvas.height / 2;
        const maxRadius = Math.sqrt(halfW * halfW + halfH * halfH);
        const grad = ctx.createRadialGradient(
          halfW, halfH, maxRadius * 0.4,
          halfW, halfH, maxRadius
        );
        const alpha = (vignetteVal / 100) * 0.85; // cap at 0.85 opacity for optimal visual aesthetics
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // 8. Draw Built-in Brand Watermark if enabled in visuals (e.g. at bottom-right corner)
      if (visualsRef.current?.renderWatermark) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // subtle, semi-transparent modern overlay font color
        ctx.font = '500 12px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText('Made with tymark', canvas.width - 24, canvas.height - 24);
        ctx.restore();
      }

      // Restore camera shake transformation state
      ctx.restore();
    };

    const scheduleBackup = () => {
      if (backupTimer) clearTimeout(backupTimer);
      const fps = exportFpsRef.current || 30;
      const frameDuration = 1000 / fps;
      
      backupTimer = setTimeout(() => {
        if (isExportingRef.current) {
          const now = performance.now();
          lastFrameTime = now;
          renderFrame();
          scheduleBackup();
        }
      }, frameDuration);
    };

    // Expose renderFrame to the ref so offline exporter can trigger it
    renderFrameRef.current = renderFrame;

    const step = (timestamp: number) => {
      lastRafTime = performance.now();
      if (backupTimer) {
        clearTimeout(backupTimer);
        backupTimer = null;
      }

      // Render continuously even during export for the real-time recording pipeline

      // Continuous smooth live rendering matching local monitor capabilities
      renderFrame();

      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
      if (backupTimer) clearTimeout(backupTimer);
      renderFrameRef.current = null;
      if (exportTimerWorkerRef.current) {
        exportTimerWorkerRef.current.terminate();
        exportTimerWorkerRef.current = null;
      }
    };
  }, []);

  // Adjust canvas dimensions dynamically matching layout choice
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let baseWidth = 1920;
    let baseHeight = 1080;

    if (exportSettings.aspectRatio === '9:16') {
      baseWidth = 1080;
      baseHeight = 1920;
    } else if (exportSettings.aspectRatio === '1:1') {
      baseWidth = 1080;
      baseHeight = 1080;
    }

    let scale = 1.0;
    if (exportSettings.resolution === '2160p') {
      scale = 2.0; // 4K Ultra Quality (3840x2160)
    } else if (exportSettings.resolution === '720p') {
      scale = 1280 / 1920; // 720p scaling (1280x720)
    }

    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    // Refresh particle pool mapping coordinates on canvas resize
    particlesPoolRef.current = initParticles(particlesSet, canvas.width, canvas.height);
  }, [exportSettings.aspectRatio, exportSettings.resolution]);

  // Helper to generate beautifully simulated electronic music audio spectrum and waveform when synth or no file is loaded
  const generateRhythmicSimulatedData = (currentTime: number, fftSize: number) => {
    const analyserData = new Uint8Array(fftSize / 2);
    const waveformData = new Uint8Array(fftSize / 2);

    const bpm = 112; // matching synth BPM
    const beatInterval = 60 / bpm;
    const timeInBeat = currentTime % beatInterval;

    const bassDecay = Math.exp(-timeInBeat * 6);
    const melodyPulse = Math.sin(currentTime * Math.PI * 4) * 0.5 + 0.5;

    for (let i = 0; i < analyserData.length; i++) {
      if (i < 8) {
        analyserData[i] = Math.max(0, Math.min(255, 40 + bassDecay * 180 + Math.random() * 20));
      } else if (i < 30) {
        analyserData[i] = Math.max(0, Math.min(255, 30 + melodyPulse * 90 * Math.exp(-(i - 8) / 10) + Math.random() * 15));
      } else {
        const trebleSnare = (currentTime % (beatInterval * 2) > beatInterval - 0.1 && currentTime % (beatInterval * 2) < beatInterval + 0.1) ? 1.0 : 0.0;
        analyserData[i] = Math.max(0, Math.min(255, 15 + trebleSnare * 70 * Math.exp(-(i - 30) / 40) + Math.sin(currentTime * 10 + i * 0.1) * 15));
      }

      const angle = (i / analyserData.length) * Math.PI * 2;
      const waveBass = Math.sin(angle * 2 + currentTime * 20) * 50 * bassDecay;
      const waveMelody = Math.sin(angle * 8 + currentTime * 40) * 20 * melodyPulse;
      const waveNoise = (Math.random() - 0.5) * 10;
      waveformData[i] = Math.max(0, Math.min(255, 128 + waveBass + waveMelody + waveNoise));
    }

    return { analyserData, waveformData };
  };

  const generateOfflineAudioDataCache = async (fps: number, totalFrames: number) => {
    const videoOverlayPresent = !!(overlayVideoRef.current && visuals.overlayVideoUrl);
    if (!audioTrack.file && !videoOverlayPresent) {
      return null;
    }

    try {
      let audioBuffer;
      let sampleRate = 44100;
      let duration = audioTrack.duration || 16;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (audioTrack.file) {
        setExportTimeRemaining("Decoding audio track data...");
        const arrayBuffer = await audioTrack.file.arrayBuffer();
        setExportTimeRemaining("Analyzing frequencies...");
        const tempCtx = new AudioContextClass();
        audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        sampleRate = audioBuffer.sampleRate;
        duration = audioTrack.duration || audioBuffer.duration || 16;
        await tempCtx.close();
      } else {
        // No audio file but video overlay is active: construct a silent dummy buffer matching video overlay duration
        if (overlayVideoRef.current) {
          const videoDuration = overlayVideoRef.current.duration;
          if (videoDuration && !isNaN(videoDuration) && videoDuration > 0) {
            duration = videoDuration;
          }
        }
        setExportTimeRemaining("Creating silent fallback timeline for video overlay tracks...");
        const tempCtx = new AudioContextClass();
        const numSamples = Math.ceil(sampleRate * duration);
        audioBuffer = tempCtx.createBuffer(1, numSamples, sampleRate);
        await tempCtx.close();
      }

      const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      const offlineCtx = new OfflineAudioContextClass(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = offlineCtx.createAnalyser();
      analyser.fftSize = visuals.fftSize || 512;

      source.connect(analyser);
      analyser.connect(offlineCtx.destination);

      const cache: { freq: Uint8Array; time: Uint8Array }[] = new Array(totalFrames);

      // Schedule all suspend points prior to running rendering frame blocks
      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / fps;
        if (time >= duration) break;

        offlineCtx.suspend(time).then(() => {
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          const timeData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freqData);
          analyser.getByteTimeDomainData(timeData);
          cache[frame] = { freq: freqData, time: timeData };
          offlineCtx.resume();
        });
      }

      source.start(0);
      await offlineCtx.startRendering();
      return cache;
    } catch (err) {
      console.warn("Offline Audio extraction error, falling back to simulated visuals:", err);
      return null;
    }
  };

  const isExportingCancelledRef = useRef<boolean>(false);

  // Handle Video EXPORTS using Canvas Frame Captures & standard MediaRecorder Playback Stitching
  const handleStartExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportedVideoUrl(null);
    setExportTimeRemaining("Initializing...");
    setExportError(null);
    isExportingCancelledRef.current = false;

    // Ensure state references are set to exporting mode
    isExportingRef.current = true;
    currentFrameOverrideRef.current = null;

    initAudioSystem();
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Ensure audio track/synth starts fresh from index zero
    handleStopPlayback();

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      isExportingRef.current = false;
      return;
    }

    try {
      const fps = exportSettings.fps || 60;
      
      let totalDuration = 0;
      const videoOverlay = overlayVideoRef.current;
      if (audioTrack && audioTrack.duration) {
          totalDuration = audioTrack.duration; // Standard audio length
      } else if (videoOverlay && videoOverlay.duration) {
          totalDuration = videoOverlay.duration; // Full length of the overlay video
      } else {
          totalDuration = 30; // Safety fallback
      }

      setExportTimeRemaining("Initializing browser-native video encoder tracks...");

      // 1. Setup standard browser canvas capture stream with explicit frame rate of 60 FPS
      const canvasStream = canvas.captureStream(60);
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

      if (audioDestinationRef.current) {
        audioDestinationRef.current.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      }

      // Check supported codecs inside user's browser for high compatibility
      let selectedMimeType = 'video/webm;codecs=vp8,opus';
      if (exportSettings.format === 'mov') {
        selectedMimeType = 'video/quicktime;codecs=h264';
      } else if (exportSettings.format === 'mp4') {
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
          selectedMimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
        } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
          selectedMimeType = 'video/mp4;codecs=h264,aac';
        } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          selectedMimeType = 'video/mp4;codecs=h264';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          selectedMimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,aac')) {
          selectedMimeType = 'video/webm;codecs=h264,aac';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          selectedMimeType = 'video/webm;codecs=h264';
        }
      }

      if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
        selectedMimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
        selectedMimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
        selectedMimeType = 'video/webm';
      }

      // Initialize lightweight chunk assembly storage without raw frame images in RAM
      const exportChunks: Blob[] = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 6000000, // 6 Mbps HD high quality capture
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          exportChunks.push(event.data);
        }
      };

      // Wrap recorder finalization in a Promise cleanly declaring listener once to prevent duplicates
      recorder.onstop = null;
      const onRecordingStopped = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          try {
            const superBlob = new Blob(exportChunks, { type: selectedMimeType });
            try {
              // Programmatically assign metadata fields to output container properties
              (superBlob as any).title = audioTrack.name;
              (superBlob as any).artist = 'tymark';
              (superBlob as any).author = 'tymark';
              (superBlob as any).copyright = '© tymark';
              (superBlob as any).creator = 'tymark';
            } catch (e) {}
            resolve(superBlob);
          } catch (err) {
            reject(err);
          }
        };
      });

      // Reset playables currentTime
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = 1.0;
      }
      if (overlayVideoRef.current) {
        overlayVideoRef.current.currentTime = 0;
        overlayVideoRef.current.playbackRate = 1.0;
      }

      // Schedule smooth Audio Fade In / Out during export
      if (gainNodeRef.current && audioContextRef.current) {
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        const fadeIn = visuals.fadeInDuration !== undefined ? visuals.fadeInDuration : 0;
        const fadeOut = visuals.fadeOutDuration !== undefined ? visuals.fadeOutDuration : 0;

        gainNodeRef.current.gain.cancelScheduledValues(now);

        // Apply Fade In
        if (fadeIn > 0) {
          gainNodeRef.current.gain.setValueAtTime(0, now);
          gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + fadeIn);
        } else {
          gainNodeRef.current.gain.setValueAtTime(1.0, now);
        }

        // Apply Fade Out
        if (fadeOut > 0 && totalDuration > fadeOut) {
          const fadeOutStartTime = now + totalDuration - fadeOut;
          gainNodeRef.current.gain.setValueAtTime(1.0, fadeOutStartTime);
          gainNodeRef.current.gain.linearRampToValueAtTime(0, now + totalDuration);
        }
      }

      // Triggers physical play of background audio files at 1x speed during export
      if (audioRef.current) {
        audioRef.current.muted = false;
        if (audioTrack.file) {
          await audioRef.current.play();
        }
        setIsPlaying(true);
      }

      // Launch physical recording on start
      recorder.start();

      setExportTimeRemaining("Recording real-time audio and canvas output streams...");

      const startTime = Date.now();
      const recordingPromise = new Promise<void>((resolve, reject) => {
        const checkProgress = () => {
          if (isExportingCancelledRef.current) {
            reject(new Error("Export cancelled"));
            return;
          }

          let currentRecordedTime = 0;
          let isEnded = false;

          if (audioTrack.file && audioRef.current) {
            currentRecordedTime = audioRef.current.currentTime;
            isEnded = audioRef.current.ended || currentRecordedTime >= totalDuration;
          } else if (overlayVideoRef.current && visuals.overlayVideoUrl) {
            currentRecordedTime = overlayVideoRef.current.currentTime;
            isEnded = overlayVideoRef.current.ended || currentRecordedTime >= totalDuration;
          } else {
            currentRecordedTime = (Date.now() - startTime) / 1000;
            isEnded = currentRecordedTime >= totalDuration;
          }

          const renderProgress = Math.min(99, Math.floor((currentRecordedTime / totalDuration) * 99));
          setExportProgress(renderProgress);
          setCurrentTime(currentRecordedTime);

          setExportTimeRemaining(
            `Recording Clip: ${currentRecordedTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s (${renderProgress}% synchronized)...`
          );

          if (isEnded) {
            resolve();
          } else {
            requestAnimationFrame(checkProgress);
          }
        };

        requestAnimationFrame(checkProgress);
      });

      // Await real-time recording completion
      await recordingPromise;

      setExportTimeRemaining("Finalizing file encoding and saving video...");
      setExportProgress(99);

      // Stop recorder and playback tracks
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
      handleStopPlayback();

      // Await data collection completion from onstop event
      const superBlob = await onRecordingStopped;
      
      // Inject native container metadata tags ('auth', 'cprt', '©art') for explorer compatibility
      let finalBlob = superBlob;
      if (selectedMimeType.includes('mp4')) {
        try {
          const arrayBuffer = await superBlob.arrayBuffer();
          const infectedBuffer = injectMP4Metadata(arrayBuffer, "tymark", "© tymark");
          finalBlob = new Blob([infectedBuffer], { type: selectedMimeType });
        } catch (err) {
          console.error("MP4 Metadata Native injection failed:", err);
        }
      }
      
      const videoUrl = URL.createObjectURL(finalBlob);

      setExportedVideoUrl(videoUrl);
      setIsExporting(false);
      isExportingRef.current = false;
      setExportProgress(100);
      setExportTimeRemaining("Completed");

      // Auto trigger file save with correct extension matching selected MIME type
      const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement("a");
      a.href = videoUrl;
      
      const originalSongTitle = audioTrack.file 
        ? audioTrack.file.name.replace(/\.[^/.]+$/, "") 
        : audioTrack.name;
      a.download = `${originalSongTitle} - Visualization.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (e: any) {
      console.error("Recording Pipeline Error: ", e);
      const errMessage = e instanceof Error ? e.message : String(e);
      setExportError(errMessage);
      setExportTimeRemaining(`Failed: ${errMessage}`);
      setExportProgress(0);
      
      // Cleanup playback
      handleStopPlayback();
    } finally {
      setIsExporting(false);
      isExportingRef.current = false;
    }
  };

  const handleStopExport = () => {
    isExportingCancelledRef.current = true;
    currentFrameOverrideRef.current = null;
    isExportingRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("MediaRecorder stop error:", err);
      }
    }

    handleStopPlayback();
    setIsExporting(false);
    setExportError(null);
    setExportTimeRemaining("Cancelled");
    setExportProgress(0);
  };

  const clearBackgroundImg = () => {
    setBackground(prev => ({
      ...prev,
      type: prev.type === 'image' ? 'color' : prev.type,
      imageUrl: null,
    }));
    bgImageRef.current = null;
  };

  const clearBackgroundVid = () => {
    setBackground(prev => ({
      ...prev,
      type: prev.type === 'video' ? 'color' : prev.type,
      videoUrl: null,
    }));
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
    }
    bgVideoRef.current = null;
  };

  const clearAudioTrack = () => {
    handleStopPlayback();
    setAudioTrack({
      name: 'Demo Rhythmic Cyber-Beat',
      artist: 'Procedural Synthesizer Engine',
      duration: 16,
      file: null,
      objectUrl: null,
      coverUrl: null,
    });
    setTitleOverlay(prev => ({
      ...prev,
      text: 'Demo Beat',
      artist: 'Procedural Synth',
    }));
  };

  return (
    <div
      id="app-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col transition-colors duration-200 relative overflow-x-hidden`}
    >
      {/* Invisible HTML5 Audio Tag for Custom MP3 files */}
      <audio ref={audioRef} src={audioTrack.objectUrl || undefined} crossOrigin="anonymous" />

      {/* DRAG AND DROP OVERLAY SCREEN */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            id="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 m-4 rounded-xl"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-xl flex flex-col items-center max-w-md text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center animate-bounce border border-blue-500/20">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-tight text-white font-sans">Drop to Load Content</h3>
                <p className="text-zinc-400 mt-2 text-xs leading-relaxed">
                  Release your file to automatically import <span className="text-blue-400">audio tracks</span>, <span className="text-zinc-300">background images</span>, or <span className="text-zinc-300">background videos</span>.
                </p>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800">
                Supports MP3, WAV, WebM, MP4, PNG, JPG & WEBP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header id="main-header" className="border-b border-zinc-900 bg-zinc-950/90 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500 flex items-center justify-center shadow-sm">
            <Disc className="w-5 h-5 text-blue-500 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-zinc-100 leading-none">AUDIO VISUALIZER</h1>
            <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">Music Video Maker</span>
          </div>
        </div>

        {/* Playback Mini Controls in Header */}
        <div className="hidden sm:flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-300 font-mono font-medium truncate max-w-[150px]">
            {audioTrack.name}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400 font-mono">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Invisible project importer input element */}
          <input
            type="file"
            ref={projectFileRef}
            onChange={handleOpenProjectFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Open File visual toggle */}
          <button
            onClick={handleOpenProjectClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs transition-all cursor-pointer font-medium"
            title="Open an existing project JSON configuration file"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Open Project</span>
          </button>

          {/* Save Project visual toggle */}
          <button
            onClick={handleSaveProject}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 rounded-lg text-xs transition-all cursor-pointer font-medium"
            title="Export all visualizers, layers and overlay settings to .json file"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save Project</span>
          </button>

          <span className="hidden sm:inline text-xs text-blue-500 font-mono font-semibold bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
            PRO STUDIO
          </span>
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main id="main-content" className="flex-1 flex flex-col xl:flex-row min-h-0 bg-zinc-950 w-full max-w-[1920px] mx-auto xl:divide-x xl:divide-zinc-900">
        
        {/* LEFT COMPILER VIEW / WORKSPACE STAGE */}
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 items-center justify-center overflow-y-auto">
          
          {/* Theme Preset Selection Ribbon at Top */}
          <div className="w-full max-w-4xl space-y-2">
            <div className="flex items-center justify-between">
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
                    className={`flex flex-col items-left text-left p-3 rounded-lg border text-xs transition-all relative overflow-hidden ${
                      isActive
                        ? 'bg-zinc-900 border-zinc-700 text-white font-medium'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800 text-zinc-400'
                    }`}
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
            </div>
          </div>

          {/* ACTIVE WORKSPACE CANVAS STAGE WINDOW */}
          <div ref={containerRef} className="w-full max-w-4xl">
            <div className="bg-zinc-900 p-1.5 rounded-xl border border-zinc-900 shadow-sm relative group overflow-hidden">
              
              {/* Canvas Preview element */}
              <div 
                className="relative bg-black rounded-lg overflow-hidden shadow-inner flex items-center justify-center transition-all"
                style={{
                  aspectRatio: exportSettings.aspectRatio === '16:9' ? '16/9' : exportSettings.aspectRatio === '9:16' ? '9/16' : '1/1',
                  maxHeight: '480px',
                  width: '100%',
                  margin: '0 auto',
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain cursor-default"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasMouseUp}
                />

                {/* Loading state or No-Audio warning indicator overlay */}
                {!audioTrack.file && (
                  <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none px-4">
                    <div className="inline-flex items-center space-x-2 bg-zinc-900/95 border border-zinc-800 px-3 py-1.5 rounded-md backdrop-blur-sm text-[10px] text-zinc-300 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                      <span>Rhythmic visualizer simulation active. Drag and drop audio to begin custom rendering</span>
                    </div>
                  </div>
                )}

                {/* Exporting Indicator Overlay */}
                {isExporting && (
                  <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    {exportError ? (
                      <div className="flex flex-col items-center max-w-md w-full">
                        <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-4 border border-red-500/30">
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-red-500 font-mono">Export Failed</h3>
                        <p className="text-zinc-400 text-[11px] mt-3 leading-relaxed bg-zinc-950 p-4 rounded-lg border border-zinc-900 font-mono text-left select-all overflow-auto max-h-40 w-full whitespace-pre-wrap">
                          {exportError}
                        </p>
                        
                        <div className="flex items-center space-x-3 mt-6">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(exportError);
                            }}
                            className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] px-4 py-2 rounded transition-all font-mono uppercase"
                          >
                            Copy Error
                          </button>
                          <button
                            onClick={handleStopExport}
                            className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-900 text-[10px] px-4 py-2 rounded transition-all font-mono uppercase"
                          >
                            Close Overlay
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                          <FileVideo className="w-6 h-6 text-blue-500 animate-spin-slow" />
                        </div>
                        <h3 className="text-sm font-medium uppercase tracking-wider text-white font-mono">Export In Progress</h3>
                        <p className="text-zinc-500 text-[11px] mt-1.5 max-w-xs leading-normal">
                          Generating and encoding frames dynamically. Please keep this tab active and visible until compile finishes.
                        </p>
                        
                        {/* Progress tracking block */}
                        <div className="w-64 bg-zinc-900 border border-zinc-800 h-1.5 rounded-full overflow-hidden mt-5">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-350"
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between w-64 text-[9px] text-zinc-500 font-mono mt-1.5">
                          <span>{exportProgress}% Done</span>
                          <span className="text-blue-500">{exportTimeRemaining}</span>
                        </div>

                        {/* Tab throttling warning banner */}
                        <div className="mt-5 max-w-sm w-full bg-[#3a200a]/40 border border-[#d97706]/35 rounded-lg p-3 flex items-start space-x-2.5 text-left">
                          <AlertTriangle className="w-4 h-4 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] font-bold text-[#f59e0b] font-mono uppercase tracking-wider">Keep Page Focused</h4>
                            <p className="text-[10.5px] text-zinc-300 leading-normal font-sans">
                              Switching tabs or minimizing will cause the browser engine to freeze the rendering progress and stagger the background audio synchronization.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleStopExport}
                          className="mt-6 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 text-[10px] px-3.5 py-1.5 rounded transition-all font-mono uppercase"
                        >
                          Cancel Export
                        </button>

                        <p className="text-zinc-600 text-[9px] mt-4 max-w-xs leading-relaxed font-mono">
                          * Note: Chrome or Edge is highly recommended. If the saved file does not play in Windows Media Player, use VLC Player or open it in a browser window.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE PREVIEW CONTROLLER STATUS BAR */}
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Timeline slider representation */}
            <div className="w-full flex items-center space-x-3">
              <span className="text-xs text-zinc-500 font-mono min-w-[34px] text-right">
                {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
              </span>
              
              <div className="flex-1 flex items-center relative group min-w-0">
                <input
                  type="range"
                  min="0"
                  max={trackDuration || 30}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleTimelineSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer bg-zinc-950 appearance-none hover:bg-zinc-905 border border-zinc-900/60 transition-all outline-none"
                  title="Drag or click to seek audio playback timeline"
                />
              </div>

              <span className="text-xs text-zinc-500 font-mono min-w-[34px]">
                {audioTrack.file 
                  ? `${Math.floor(trackDuration / 60)}:${(Math.floor(trackDuration % 60)).toString().padStart(2, '0')}`
                  : 'LOOP'
                }
              </span>
            </div>

            {/* Controls panel button deck */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTogglePlayback}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-zinc-900" /> : <Play className="w-4 h-4 fill-zinc-900 text-zinc-900 ml-0.5" />}
                </button>

                <button
                  onClick={handleStopPlayback}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Stop and Reset"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>

              {/* Volume sliders */}
              <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-full">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 md:w-20 accent-blue-600 h-1 cursor-pointer"
                />
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR CONTROL DECKS */}
        <div className="w-full xl:w-[460px] flex flex-col bg-zinc-950 border-l border-zinc-900">
          
          {/* Tab Navigation selectors */}
          <div className="flex border-b border-zinc-900 bg-zinc-950 text-xs overflow-x-auto select-none">
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Track Info</span>
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'background'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Background</span>
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'visuals'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Waves</span>
            </button>
            <button
              onClick={() => setActiveTab('particles')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'particles'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Particles</span>
            </button>
            <button
              onClick={() => setActiveTab('overlay')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'overlay'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <FileVideo className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-3 px-3.5 flex items-center justify-center space-x-2 border-b-2 font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'border-blue-600 text-white bg-zinc-900/60 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* ACTIVE PANEL CONTENT WRAPPER */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6 max-h-[calc(100vh-140px)] bg-zinc-950">
            
            {/* TABS A: AUDIO & TITLE INFOS */}
            {activeTab === 'track' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">Audio Source Config</h3>
                  <p className="text-[11px] text-zinc-500 mt-1">Upload custom MP3 audio files or play live-synthesized demo streams.</p>
                </div>

                {/* Upload Deck File zone */}
                <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-5 text-center relative group">
                  <input
                    type="file"
                    accept="audio/*"
                    id="audio-selector"
                    onChange={handleManualAudioUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 py-3 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Music className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-300 font-medium font-sans">Click or Drag & Drop audio file</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Supports MP3, WAV, FLAC, AAC</p>
                    </div>
                  </div>
                </div>

                {audioTrack.file && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-blue-500 animate-pulse" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-zinc-100 font-medium truncate">{audioTrack.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">Custom file loaded • Sync ready</p>
                      </div>
                    </div>
                    <button
                      onClick={clearAudioTrack}
                      className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/15 transition-all cursor-pointer"
                      title="Clear Custom File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}



                {/* Background Music Track Controls */}
                <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-lg space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                      <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Background Music Routing Mix</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-900 px-3 py-2.5 rounded-lg font-sans">
                    <button
                      type="button"
                      onClick={() => setIsMuted(prev => !prev)}
                      className={`px-2.5 py-1.5 rounded text-[10px] font-semibold font-mono tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 flex-shrink-0 ${
                        isMuted
                          ? 'bg-red-955 border border-red-800 text-red-400'
                          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300'
                      }`}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-450 animate-pulse" />
                          <span>MUTED</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>MUTE</span>
                        </>
                      )}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                        <span>Music Volume</span>
                        <span className="text-zinc-200 font-semibold">{Math.round(volume * 100)} %</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          setIsMuted(false);
                        }}
                        className="w-full accent-blue-600 h-1 cursor-pointer bg-zinc-900 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Fade In & Fade Out Sliders */}
                  <div className="space-y-2.5 pt-3 border-t border-zinc-850/50">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>FADE IN DURATION</span>
                        <span className="text-zinc-200 font-semibold">
                          {visuals.fadeInDuration !== undefined ? visuals.fadeInDuration : 0}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={visuals.fadeInDuration !== undefined ? visuals.fadeInDuration : 0}
                        onChange={(e) => setVisuals(prev => ({ ...prev, fadeInDuration: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600 h-1 cursor-pointer bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>FADE OUT DURATION</span>
                        <span className="text-zinc-200 font-semibold">
                          {visuals.fadeOutDuration !== undefined ? visuals.fadeOutDuration : 0}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={visuals.fadeOutDuration !== undefined ? visuals.fadeOutDuration : 0}
                        onChange={(e) => setVisuals(prev => ({ ...prev, fadeOutDuration: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600 h-1 cursor-pointer bg-zinc-950 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Core 3-Band Equalizer Deck */}
                <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                      <span>3-Band Studio EQ</span>
                    </span>
                    {(eqBass !== 0 || eqMid !== 0 || eqTreble !== 0) && (
                      <button
                        onClick={() => {
                          setEqBass(0);
                          setEqMid(0);
                          setEqTreble(0);
                        }}
                        className="text-[9px] font-mono text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        RESET
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5">
                    {/* Bass scale */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>BASS (200 HZ)</span>
                        <span className="text-zinc-200 font-semibold">{eqBass > 0 ? `+${eqBass}` : eqBass} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqBass}
                        onChange={(e) => {
                          initAudioSystem();
                          setEqBass(parseInt(e.target.value));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Mids peaking scale */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>MID (1.2 KHZ)</span>
                        <span className="text-zinc-200 font-semibold">{eqMid > 0 ? `+${eqMid}` : eqMid} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqMid}
                        onChange={(e) => {
                          initAudioSystem();
                          setEqMid(parseInt(e.target.value));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Treble high peaking scale */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>TREBLE (4 KHZ)</span>
                        <span className="text-zinc-200 font-semibold">{eqTreble > 0 ? `+${eqTreble}` : eqTreble} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqTreble}
                        onChange={(e) => {
                          initAudioSystem();
                          setEqTreble(parseInt(e.target.value));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-zinc-900" />

                {/* VISIBLE TITLE TEXT OVERLAYS SETTINGS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                      <Type className="w-3.5 h-3.5 text-blue-500" />
                      <span>On-Screen Text Overlays</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTitleOverlay(prev => ({ ...prev, visible: !prev.visible }))}
                      className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                        titleOverlay.visible ? 'bg-blue-600' : 'bg-zinc-800'
                      }`}
                    >
                      <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                        titleOverlay.visible ? 'translate-x-3.5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {titleOverlay.visible && (
                    <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs space-y-3.5">
                      <div>
                        <label className="block text-zinc-500 mb-1 text-[10px] font-mono">Title Text Line</label>
                        <input
                          type="text"
                          value={titleOverlay.text}
                          onChange={(e) => setTitleOverlay(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="e.g. SONIC ASCENSION"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 uppercase font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 mb-1 text-[10px] font-mono">Artist / Description Subline</label>
                        <input
                          type="text"
                          value={titleOverlay.artist}
                          onChange={(e) => setTitleOverlay(prev => ({ ...prev, artist: e.target.value }))}
                          placeholder="e.g. Liquid Space Project"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white focus:outline-none text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-550 mb-1 text-[10px] font-mono font-normal">Font Family</label>
                          <select
                            value={titleOverlay.fontFamily}
                            onChange={(e: any) => setTitleOverlay(prev => ({ ...prev, fontFamily: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white focus:outline-none text-[11px]"
                          >
                            <option value="Inter">Clean Inter</option>
                            <option value="Space Grotesk">Tech Grotesk</option>
                            <option value="JetBrains Mono">Retro Mono</option>
                            <option value="Outfit">Outfit Bold</option>
                            <option value="Playfair Display">Serif Editorial</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-zinc-550 mb-1 text-[10px] font-mono">Text Color</label>
                          <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded p-1">
                            <input
                              type="color"
                              value={titleOverlay.color}
                              onChange={(e) => setTitleOverlay(prev => ({ ...prev, color: e.target.value }))}
                              className="w-7 h-6 rounded border-0 bg-transparent cursor-pointer"
                            />
                            <span className="font-mono text-[9px] text-zinc-400">{titleOverlay.color.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-550 mb-1 text-[10px] font-mono">Text size ({titleOverlay.fontSize}px)</label>
                          <input
                            type="range"
                            min="24"
                            max="72"
                            value={titleOverlay.fontSize}
                            onChange={(e) => setTitleOverlay(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-550 mb-1 text-[10px] font-mono">Layout Align</label>
                          <select
                            value={titleOverlay.position}
                            onChange={(e: any) => setTitleOverlay(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white focus:outline-none text-[11px]"
                          >
                            <option value="center">Centered</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TABS B: VISUALIZER WAVES */}
            {activeTab === 'visuals' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-grotesk">Waveform & Render Controls</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Configure audio frequency response algorithms and outline geometry.</p>
                </div>

                <div className="space-y-4">
                  {/* Visual Structure Style */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 font-mono uppercase">Wave representation Style</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'bars', name: 'Rounded Bars' },
                        { id: 'waveform', name: 'Bezier Wave' },
                        { id: 'circular', name: 'Neon Circle' },
                        { id: 'radial-bars', name: 'Sunburst Radial' },
                        { id: 'retro', name: 'Retro Sunset' },
                        { id: 'neon-tunnel', name: 'Dynamic Tunnel' },
                        { id: 'laser-orbit', name: 'Laser Orbits' },
                        { id: 'wave-matrix', name: 'Joy Hills' },
                        { id: 'heartbeat-ekg', name: 'Heartbeat EKG' },
                        { id: 'fresnel-wave', name: 'Fresnel Layer' },
                        { id: 'dna-helix', name: 'DNA Helix' },
                        { id: 'double-mirror-bars', name: 'Mirror Mirror Bars' },
                        { id: 'circular-orbit', name: 'Circular Orbit' },
                        { id: 'radial-inside-out', name: 'Inside-Out Radial' },
                        { id: 'digital-vu-blocks', name: 'Digital VU Blocks' },
                        { id: 'dna-helix-thread', name: 'DNA Helix Thread' },
                        { id: 'smooth-area-silhouette', name: 'Area Silhouette' },
                        { id: 'floating-matrix-particles', name: 'Floating Particles' },
                        { id: 'rounded-pill-bars', name: 'Rounded Pill Bars' },
                        { id: 'neon-glow-string', name: 'Neon Glow String' },
                        { id: 'floating-bubble-particles', name: 'Floating Bubbles' },
                        { id: 'mirrored-wave-silhouette', name: 'Mirrored Silhouette' },
                        { id: 'retro-arcade-dot-grid', name: 'Retro Dot Grid' },
                        { id: 'minimalist-pulse-dot', name: 'Minimalist Pulse Dots' },
                        { id: 'modern-sleek', name: 'Modern Sleek' },
                        { id: 'frequency-spectrogram', name: 'Spectrogram Waterfall' },
                        { id: 'three-d-speaker-effects', name: '3D Speakers & Floor' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setVisuals(prev => ({ ...prev, style: item.id as VisualizerStyle }))}
                          className={`py-2 px-3 rounded-lg border text-left transition-all text-[11px] leading-tight ${
                            visuals.style === item.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                              : 'bg-[#0a0a0f] border-gray-900 hover:bg-[#12121d] text-gray-400'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* --- SPECIAL 3D SPECTRUM & SPEAKER EFFECTS CATEGORY SECTION --- */}
                  <div className="bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-500/20 p-3 rounded-lg space-y-3 mt-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 text-left">
                        <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider font-mono">3D Spectrum & Speaker Effects</h4>
                        <p className="text-[9.5px] text-zinc-400 leading-tight">Dual physical speaker subwoofers and projected perspective landscape.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, style: 'three-d-speaker-effects' }))}
                        className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-all shrink-0 ${
                          visuals.style === 'three-d-speaker-effects'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-[#0a0a0f] border border-gray-800 text-gray-300 hover:text-white'
                        }`}
                      >
                        {visuals.style === 'three-d-speaker-effects' ? 'ACTIVE' : 'ACTIVATE'}
                      </button>
                    </div>

                    <div className="space-y-3 pt-2.5 border-t border-indigo-950/40">
                      {/* Speaker Bass Response Slider */}
                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-300 font-bold uppercase">Speaker Bass Response</span>
                          <span className="text-indigo-400 font-semibold font-mono">
                            {typeof visuals.speakerBassResponse === 'number' ? visuals.speakerBassResponse.toFixed(2) : '1.00'}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={typeof visuals.speakerBassResponse === 'number' ? visuals.speakerBassResponse : 1.0}
                          onChange={(e) => setVisuals(prev => ({ ...prev, speakerBassResponse: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <p className="text-[9px] text-zinc-500 font-sans leading-normal">
                          Controls the pulse scaling physical travel and vibration amplitude of dual subwoofers
                        </p>
                      </div>

                      {/* Shake Intensity Slider */}
                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-300 font-bold uppercase">Shake Intensity</span>
                          <span className="text-purple-400 font-semibold font-mono">
                            {typeof visuals.shakeIntensity === 'number' ? visuals.shakeIntensity.toFixed(2) : '1.00'}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="2.0"
                          step="0.05"
                          value={typeof visuals.shakeIntensity === 'number' ? visuals.shakeIntensity : 1.0}
                          onChange={(e) => setVisuals(prev => ({ ...prev, shakeIntensity: parseFloat(e.target.value) }))}
                          className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <p className="text-[9px] text-zinc-500 font-sans leading-normal">
                          Controls the physical viewport coordinate shake amplitude of beat-induced kick transients
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Waveform Placement Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-300 font-mono uppercase">Waveform Placement</label>
                    <select
                      id="waveform-placement-select"
                      value={visuals.placement || 'bottom'}
                      onChange={(e) => setVisuals(prev => ({ ...prev, placement: e.target.value as any }))}
                      className="w-full bg-[#0a0a0f] border border-gray-950 rounded-lg p-2 text-zinc-300 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="bottom">Bottom (Default Baseline)</option>
                      <option value="top">Top Baseline</option>
                      <option value="center">Center Placement</option>
                      <option value="left">Left Side Placement</option>
                      <option value="right">Right Side Placement</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Repositions or rotates the active rendering baseline on the visualizer canvas.
                    </p>
                  </div>

                  {/* Waveform Manual Offsets */}
                  <div className="space-y-3 bg-[#07070a]/50 p-2.5 rounded-lg border border-zinc-950/60">
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold">Horizontal Offset (X Position)</span>
                        <span className="text-[11px] font-semibold text-sky-400 font-mono">
                          {visuals.waveformOffsetX !== undefined ? visuals.waveformOffsetX : 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={visuals.waveformOffsetX !== undefined ? visuals.waveformOffsetX : 50}
                        onChange={(e) => setVisuals(prev => ({ ...prev, waveformOffsetX: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold">Vertical Offset (Y Position)</span>
                        <span className="text-[11px] font-semibold text-sky-400 font-mono">
                          {visuals.waveformOffsetY !== undefined ? visuals.waveformOffsetY : (visuals.placement === 'top' ? 25 : visuals.placement === 'bottom' ? 75 : 50)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={visuals.waveformOffsetY !== undefined ? visuals.waveformOffsetY : (visuals.placement === 'top' ? 25 : visuals.placement === 'bottom' ? 75 : 50)}
                        onChange={(e) => setVisuals(prev => ({ ...prev, waveformOffsetY: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  <hr className="border-[#12121e]" />

                  {/* Advanced Spectrum Color Modes */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-semibold text-zinc-400 font-mono uppercase">Advanced Spectrum Color Modes</label>
                    
                    <div className="grid grid-cols-3 gap-1 bg-[#0a0a0f] p-1 border border-zinc-900 rounded-lg text-center mb-2.5">
                      {[
                        { id: 'solid', name: 'Solid Color' },
                        { id: 'gradient', name: 'Gradient Blend' },
                        { id: 'rainbow', name: 'Rainbow Map' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, colorMode: mode.id as any }))}
                          className={`py-1.5 px-1 rounded font-mono text-[9px] font-semibold transition-all ${
                            (visuals.colorMode || 'gradient') === mode.id
                              ? 'bg-blue-600 border border-blue-500 text-white'
                              : 'border border-transparent text-gray-400 hover:text-white'
                          }`}
                        >
                          {mode.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {((visuals.colorMode || 'gradient') === 'solid' || (visuals.colorMode || 'gradient') === 'gradient') && (
                        <div>
                          <label className="block text-[9px] text-zinc-500 font-mono mb-1">
                            {(visuals.colorMode || 'gradient') === 'solid' ? 'Solid Color' : 'Color A (Bass)'}
                          </label>
                          <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1">
                            <input
                              type="color"
                              value={visuals.primaryColor}
                              onChange={(e) => setVisuals(prev => ({ ...prev, primaryColor: e.target.value }))}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                            />
                            <span className="font-mono text-[9px] text-zinc-400">{visuals.primaryColor.substring(1)}</span>
                          </div>
                        </div>
                      )}

                      {(visuals.colorMode || 'gradient') === 'gradient' && (
                        <div>
                          <label className="block text-[9px] text-zinc-500 font-mono mb-1">Color B (Treble)</label>
                          <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1">
                            <input
                              type="color"
                              value={visuals.secondaryColor}
                              onChange={(e) => setVisuals(prev => ({ ...prev, secondaryColor: e.target.value }))}
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                            />
                            <span className="font-mono text-[9px] text-zinc-400">{visuals.secondaryColor.substring(1)}</span>
                          </div>
                        </div>
                      )}

                      <div className={(visuals.colorMode || 'gradient') === 'rainbow' ? 'col-span-2' : ''}>
                        <label className="block text-[9px] text-zinc-500 font-mono mb-1">Neon Glow</label>
                        <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1 w-full">
                          <input
                            type="color"
                            value={visuals.glowColor}
                            onChange={(e) => setVisuals(prev => ({ ...prev, glowColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                          />
                          <span className="font-mono text-[9px] text-zinc-400">{visuals.glowColor.substring(1)}</span>
                        </div>
                      </div>
                    </div>

                    {(visuals.colorMode || 'gradient') === 'rainbow' && (
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans italic pt-1">
                        Frequency Map active: bass signals map to Red/Orange, mid tones to Green/Yellow, and high pitch lines map to Blue/Purple.
                      </p>
                    )}
                  </div>

                  {/* Spectrum Dimension & Sensitivity Controls */}
                  <div className="space-y-3.5 bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-xs">
                    
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>MAX LINE HEIGHT / VERTICAL SCALE</span>
                        <span className="text-white font-semibold">x{visuals.sensitivity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.5"
                        step="0.1"
                        value={visuals.sensitivity}
                        onChange={(e) => setVisuals(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>BEAT SENSITIVITY (THRESHOLD)</span>
                        <span className="text-white font-semibold">x{(visuals.beatSensitivity !== undefined ? visuals.beatSensitivity : 1.0).toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={visuals.beatSensitivity !== undefined ? visuals.beatSensitivity : 1.0}
                        onChange={(e) => setVisuals(prev => ({ ...prev, beatSensitivity: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Beat Lock & Tap Tempo Controls */}
                    <div className="space-y-2 border-t border-zinc-850 pt-2 bg-transparent">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px] uppercase">Beat Lock</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Force beats to cycle on set BPM instead of raw audio peaks</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, beatLock: !prev.beatLock }))}
                          className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                            visuals.beatLock ? 'bg-blue-600' : 'bg-zinc-800'
                          }`}
                        >
                          <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                            visuals.beatLock ? 'translate-x-3.5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2 items-center pt-1">
                        <div className="col-span-3 space-y-1">
                          <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                            <span>TEMPO (BPM)</span>
                            <span className="text-white font-semibold">{visuals.beatLockBpm || 120}</span>
                          </div>
                          <input
                            type="range"
                            min="40"
                            max="240"
                            step="1"
                            value={visuals.beatLockBpm || 120}
                            onChange={(e) => setVisuals(prev => ({ ...prev, beatLockBpm: parseInt(e.target.value) }))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                        <div className="col-span-2 pt-3">
                          <button
                            type="button"
                            onClick={handleTapTempo}
                            className="w-full py-2 px-2.5 bg-blue-950/20 text-blue-400 border border-blue-900/50 hover:bg-blue-900/35 hover:text-white rounded text-[10px] font-bold font-mono tracking-wider transition-all duration-150 active:scale-95 shadow-sm uppercase cursor-pointer"
                          >
                            Tap Tempo
                          </button>
                        </div>
                      </div>

                      {/* Visual Beat Tempo Pulse Metronome */}
                      <div className="flex items-center space-x-3 p-2 bg-[#0c0c14]/50 border border-zinc-950/60 rounded">
                        <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                          {/* Keyframe Definition inline styled specifically for the component */}
                          <style>{`
                            @keyframes bpm-pulse-main {
                              0%, 100% {
                                transform: scale(0.85);
                                opacity: 0.6;
                                filter: brightness(0.8) drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
                              }
                              15% {
                                transform: scale(1.25);
                                opacity: 1;
                                filter: brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.9));
                              }
                              30% {
                                transform: scale(0.95);
                                opacity: 0.75;
                                filter: brightness(0.95) drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
                              }
                            }
                            @keyframes bpm-pulse-ring {
                              0% {
                                transform: scale(0.65);
                                opacity: 0.95;
                              }
                              35% {
                                transform: scale(1.7);
                                opacity: 0;
                              }
                              100% {
                                transform: scale(0.65);
                                opacity: 0;
                              }
                            }
                          `}</style>
                          {/* Inner pulsing core */}
                          <div 
                            className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                            style={{
                              animation: `bpm-pulse-main ${60 / (visuals.beatLockBpm || 120)}s infinite ease-in-out`
                            }}
                          />
                          {/* Outer expanding ripple ring */}
                          <div 
                            className="absolute w-5 h-5 rounded-full border border-blue-500/80"
                            style={{
                              animation: `bpm-pulse-ring ${60 / (visuals.beatLockBpm || 120)}s infinite cubic-bezier(0.215, 0.61, 0.355, 1)`
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[9px] font-bold text-zinc-400 font-mono block uppercase tracking-wider">Metronome confirmation</span>
                          <span className="text-[10px] text-zinc-500 block font-sans">
                            Pulse matched to <strong className="text-blue-400 font-mono font-semibold">{(visuals.beatLockBpm || 120)} BPM</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>LINE WIDTH / THICKNESS</span>
                        <span className="text-white font-semibold">{visuals.lineThickness} px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="1"
                        value={visuals.lineThickness}
                        onChange={(e) => setVisuals(prev => ({ ...prev, lineThickness: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>LINE SPACING</span>
                        <span className="text-white font-semibold">{visuals.barSpacing} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={visuals.barSpacing}
                        onChange={(e) => setVisuals(prev => ({ ...prev, barSpacing: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1 border-t border-zinc-850 pt-2 bg-transparent">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>NEON GLOW STRENGTH</span>
                        <span className="text-white font-semibold">{visuals.glowStrength} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={visuals.glowStrength}
                        onChange={(e) => setVisuals(prev => ({ ...prev, glowStrength: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Flash on Beat</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Momentarily flash neon glow to white on kick peaks</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, flashOnBeat: !prev.flashOnBeat }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          visuals.flashOnBeat ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          visuals.flashOnBeat ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {visuals.flashOnBeat && (
                      <div className="pl-3 py-2 px-2.5 mt-0.5 bg-[#050508]/60 border-l-2 border-blue-600/80 space-y-2.5 rounded-r border-y border-r border-zinc-950/40">
                        {/* Dynamic Flash Intensity */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-zinc-400 font-sans text-[10px]">Flash Intensity</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {Math.round((visuals.flashIntensity !== undefined ? visuals.flashIntensity : 0.8) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={visuals.flashIntensity !== undefined ? visuals.flashIntensity : 0.8}
                            onChange={(e) => setVisuals(prev => ({ ...prev, flashIntensity: parseFloat(e.target.value) }))}
                            className="w-full accent-blue-600 h-1 rounded-full cursor-pointer bg-zinc-950 appearance-none"
                          />
                        </div>

                        {/* Flash Color Target Modes */}
                        <div>
                          <span className="font-semibold text-zinc-400 block font-sans text-[10px] mb-1">Flash Color Mode</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'white', label: 'Classic White' },
                              { id: 'colorA', label: 'Color A (Bass)' },
                              { id: 'glowColor', label: 'Neon Glow' },
                              { id: 'custom', label: 'Custom Picker' },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setVisuals(prev => ({ ...prev, flashColorMode: opt.id as any }))}
                                className={`px-1.5 py-1 text-[9px] font-medium font-sans border rounded transition-all text-center cursor-pointer ${
                                  (visuals.flashColorMode || 'white') === opt.id
                                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                                    : 'bg-[#030305]/80 text-zinc-400 border-zinc-950 hover:bg-[#0c0c12]/80 hover:text-zinc-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {visuals.flashColorMode === 'custom' && (
                            <div className="flex items-center gap-1.5 mt-2 bg-[#030305]/80 p-1 px-1.5 rounded border border-zinc-950/60 w-fit">
                              <input
                                type="color"
                                value={visuals.flashCustomColor || '#ffffff'}
                                onChange={(e) => setVisuals(prev => ({ ...prev, flashCustomColor: e.target.value }))}
                                className="w-5 h-5 rounded cursor-pointer overflow-hidden p-0 border border-zinc-800"
                                title="Custom Flash Color Picker"
                              />
                              <span className="text-[10px] text-zinc-400 font-mono uppercase">
                                {visuals.flashCustomColor || '#ffffff'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Flip Waveform</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Vertically invert the waveform rendering relative to the baseline</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, flipWaveform: !prev.flipWaveform }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          visuals.flipWaveform ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          visuals.flipWaveform ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Mirror Mode</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Reflect the rendering horizontally for a symmetrical, kaleidoscopic effect</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, mirrorMode: !prev.mirrorMode }))}
                          className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                            visuals.mirrorMode ? 'bg-blue-600' : 'bg-zinc-800'
                          }`}
                        >
                          <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                            visuals.mirrorMode ? 'translate-x-3.5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {visuals.mirrorMode && (
                        <div className="pt-2 border-t border-zinc-950/40 space-y-1.5 animate-fade-in">
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-zinc-400 uppercase font-semibold">Symmetry Multiplier</span>
                            <span className="text-blue-400 font-bold">{visuals.symmetryMultiplier || 1}x ({2 * (visuals.symmetryMultiplier || 1)} slices)</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            step="1"
                            value={visuals.symmetryMultiplier || 1}
                            onChange={(e) => setVisuals(prev => ({ ...prev, symmetryMultiplier: parseInt(e.target.value, 10) }))}
                            className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Color Invert on Beat</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Flip primary and secondary colors on each beat for a strobe effect</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, colorInvertOnBeat: !prev.colorInvertOnBeat }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          visuals.colorInvertOnBeat ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          visuals.colorInvertOnBeat ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">On-Beat Color Burst</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Briefly flash or explode the primary color with brightness on every detected beat</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, colorBurstOnBeat: !prev.colorBurstOnBeat }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          visuals.colorBurstOnBeat ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          visuals.colorBurstOnBeat ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Beat-Reactive Color Shift</span>
                          <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Cycle visualizer colors through a palette dynamically on each bass beat</span>
                        </div>
                        <button
                          type="button"
                          id="beat-reactive-color-shift-toggle"
                          onClick={() => setVisuals(prev => ({ ...prev, beatReactiveColorShift: !prev.beatReactiveColorShift }))}
                          className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                            visuals.beatReactiveColorShift ? 'bg-blue-600' : 'bg-zinc-800'
                          }`}
                        >
                          <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                            visuals.beatReactiveColorShift ? 'translate-x-3.5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {visuals.beatReactiveColorShift && (
                        <div className="pt-2 border-t border-zinc-950/40 space-y-1.5 animate-fade-in">
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-zinc-400 uppercase font-semibold">Shift Intensity</span>
                            <span className="text-blue-400 font-bold">{(visuals.colorShiftIntensity !== undefined ? visuals.colorShiftIntensity : 5.0).toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            id="color-shift-intensity-slider"
                            min="1.0"
                            max="20.0"
                            step="0.5"
                            value={visuals.colorShiftIntensity !== undefined ? visuals.colorShiftIntensity : 5.0}
                            onChange={(e) => setVisuals(prev => ({ ...prev, colorShiftIntensity: parseFloat(e.target.value) }))}
                            className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Cycle Colors</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Slowly rotate primary and secondary hues over time</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisuals(prev => ({ ...prev, cycleColors: !prev.cycleColors }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          visuals.cycleColors ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          visuals.cycleColors ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {visuals.cycleColors && (
                      <div className="space-y-1 p-2.5 bg-[#07070a]/40 rounded border border-zinc-950/40 mt-1 animate-in fade-in duration-200">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                          <span>COLOR CYCLE SPEED</span>
                          <span className="text-white font-semibold">{(visuals.colorCycleSpeed !== undefined ? visuals.colorCycleSpeed : 1.0).toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="8.0"
                          step="0.1"
                          value={visuals.colorCycleSpeed !== undefined ? visuals.colorCycleSpeed : 1.0}
                          onChange={(e) => setVisuals(prev => ({ ...prev, colorCycleSpeed: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="space-y-1 border-t border-zinc-850 pt-2 bg-transparent">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>GLOBAL CANVAS ROTATION</span>
                        <span className="text-white font-semibold">{visuals.canvasRotation || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={visuals.canvasRotation || 0}
                        onChange={(e) => setVisuals(prev => ({ ...prev, canvasRotation: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-zinc-500 font-mono uppercase">FFT Resolution</label>
                        <select
                          value={visuals.fftSize}
                          onChange={(e) => setVisuals(prev => ({ ...prev, fftSize: parseInt(e.target.value) }))}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-zinc-300 text-xs focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="128">32 Bins (Dense)</option>
                          <option value="256">64 Bins (Classic)</option>
                          <option value="512">128 Bins (Detailed)</option>
                          <option value="1024">256 Bins (Deep)</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60 pt-3.5 space-y-4">
                      {/* Spectrum Analyzer Toggle switch */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 font-mono uppercase">
                            Spectrum Analyzer
                          </label>
                          <p className="text-[10px] text-zinc-500 font-sans">
                            Replaces waveform wave with a frequency bar chart
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisuals(prev => ({ ...prev, spectrumAnalyzer: !prev.spectrumAnalyzer }))}
                          className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                            visuals.spectrumAnalyzer ? 'bg-blue-600' : 'bg-zinc-800'
                          }`}
                        >
                          <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                            visuals.spectrumAnalyzer ? 'translate-x-3.5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Smoothing Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>SPECTRUM SMOOTHING / TRANSITION</span>
                          <span className="text-white font-semibold">
                            {typeof visuals.smoothing === 'number' ? visuals.smoothing.toFixed(2) : '0.80'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="0.95"
                          step="0.05"
                          value={typeof visuals.smoothing === 'number' ? visuals.smoothing : 0.8}
                          onChange={(e) => setVisuals(prev => ({ ...prev, smoothing: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-650"
                        />
                        <p className="text-[9px] text-zinc-500 font-sans">
                          Controls temporal transition speed between frequency frames
                        </p>
                      </div>

                      {/* Camera Shake Intensity Slider */}
                      <div className="border-t border-zinc-800/60 pt-3.5 space-y-1.5 animate-fade-in">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>BASS CAMERA SHAKE INTENSITY</span>
                          <span className="text-blue-400 font-mono font-semibold">
                            {visuals.cameraShake ? `${visuals.cameraShake.toFixed(1)} px` : 'DISABLED'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="12.0"
                          step="0.5"
                          value={typeof visuals.cameraShake === 'number' ? visuals.cameraShake : 0}
                          onChange={(e) => setVisuals(prev => ({ ...prev, cameraShake: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-650 cursor-pointer"
                        />
                        <p className="text-[9px] text-zinc-500 font-sans leading-relaxed">
                          Slightly jitters the canvas stage viewport dynamically in sync with high-intensity peak bass beats
                        </p>
                      </div>

                      {/* Intensity-Based Continuous Shake Toggle */}
                      <div className="border-t border-zinc-800/60 pt-3.5 space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="text-left space-y-0.5">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px] uppercase tracking-wider">Intensity-Based Shake</span>
                            <span className="text-[10px] text-zinc-500 font-sans block leading-normal">Uses frequency bin levels to trigger continuous subtle canvas vibration rather than binary trigger</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, intensityBasedShake: !prev.intensityBasedShake }))}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              visuals.intensityBasedShake ? 'bg-indigo-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                visuals.intensityBasedShake ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Motion Smoothing Slider */}
                      <div className="border-t border-zinc-800/60 pt-3.5 space-y-1.5 animate-fade-in">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>MOTION SMOOTHING (INTERPOLATION)</span>
                          <span className="text-teal-400 font-mono font-semibold">
                            {visuals.motionSmoothing ? `${visuals.motionSmoothing.toFixed(2)}` : 'DISABLED'}
                          </span>
                        </div>
                        <input
                          id="motion-smoothing-slider"
                          type="range"
                          min="0.0"
                          max="0.95"
                          step="0.05"
                          value={typeof visuals.motionSmoothing === 'number' ? visuals.motionSmoothing : 0}
                          onChange={(e) => setVisuals(prev => ({ ...prev, motionSmoothing: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-650 cursor-pointer"
                        />
                        <p className="text-[9px] text-zinc-500 font-sans leading-relaxed">
                          Controls real-time frame-to-frame interpolation to reduce flickering in wave patterns
                        </p>
                      </div>

                      {/* Audio-Reactive FX Section */}
                      <div id="audio-reactive-fx-section" className="border-t border-zinc-800/60 pt-4 mt-4 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider text-left">Audio-Reactive FX</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 text-left">Extra sound-reactive canvas effects</p>
                        </div>

                        {/* Enable Camera Beat Shake Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                          <div className="text-left">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Enable Camera Beat Shake</span>
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Apply high-energy viewport screenshake translations synced directly to peak music beats</span>
                          </div>
                          <button
                            id="enable-camera-beat-shake-toggle"
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, enableCameraBeatShake: !prev.enableCameraBeatShake }))}
                            className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                              visuals.enableCameraBeatShake ? 'bg-blue-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                              visuals.enableCameraBeatShake ? 'translate-x-3.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Enable Beat Pulse Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                          <div className="text-left">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Enable Beat Pulse (Camera Shake)</span>
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Apply subtle temporary 1.03x zoom pulse to background on bass peaks</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, enableBeatPulse: !prev.enableBeatPulse }))}
                            className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                              visuals.enableBeatPulse ? 'bg-blue-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                              visuals.enableBeatPulse ? 'translate-x-3.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Reactive Text Glow Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60 mt-1">
                          <div className="text-left">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Reactive Text Glow</span>
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Words pulse and glow brighter matching middle & treble peaks</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, reactiveTextGlow: !prev.reactiveTextGlow }))}
                            className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                              visuals.reactiveTextGlow ? 'bg-blue-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                              visuals.reactiveTextGlow ? 'translate-x-3.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Video Asset Overlays Section */}
                      <div id="video-asset-overlays-section" className="border-t border-zinc-800/60 pt-4 mt-4 space-y-3 font-sans">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider text-left">Video Asset Overlays</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 text-left">Progress indicators and custom watermarks</p>
                        </div>

                        {/* Show Progress Bar Checkbox Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60">
                          <div className="text-left">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Show Progress Bar</span>
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Renders a dynamic timeline fill line at the bottom of the canvas</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, showProgressBar: !prev.showProgressBar }))}
                            className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                              visuals.showProgressBar ? 'bg-blue-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                              visuals.showProgressBar ? 'translate-x-3.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {visuals.showProgressBar && (
                          <div className="space-y-3.5 p-3.5 bg-[#07070a]/60 rounded border border-zinc-900 mt-2 text-left animate-in fade-in duration-200">
                            {/* Placement settings */}
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] text-zinc-400 font-mono uppercase mb-1">Progress Bar Edge</label>
                                <select
                                  value={visuals.progressBarEdge || 'bottom'}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, progressBarEdge: e.target.value as any }))}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                                >
                                  <option value="bottom">Bottom</option>
                                  <option value="top">Top</option>
                                  <option value="left">Left Side</option>
                                  <option value="right">Right Side</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] text-zinc-400 font-mono uppercase mb-1">Bar Style</label>
                                <select
                                  value={visuals.progressBarStyle || 'gradient'}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, progressBarStyle: e.target.value as any }))}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                                >
                                  <option value="solid">Solid Match</option>
                                  <option value="neon">Neon Glow Fade</option>
                                  <option value="gradient">Two-Color Gradient</option>
                                </select>
                              </div>
                            </div>

                            {/* Sliders: padding, thickness, scale */}
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                                  <span>MARGIN / PADDING</span>
                                  <span className="text-white font-semibold">{visuals.progressBarPadding !== undefined ? visuals.progressBarPadding : 25}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  step="1"
                                  value={visuals.progressBarPadding !== undefined ? visuals.progressBarPadding : 25}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, progressBarPadding: parseInt(e.target.value) }))}
                                  className="w-full accent-blue-600 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                                  <span>BAR THICKNESS</span>
                                  <span className="text-white font-semibold">{visuals.progressBarThickness !== undefined ? visuals.progressBarThickness : 6}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="30"
                                  step="1"
                                  value={visuals.progressBarThickness !== undefined ? visuals.progressBarThickness : 6}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, progressBarThickness: parseInt(e.target.value) }))}
                                  className="w-full accent-blue-600 cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                                  <span>BAR LENGTH / SCALE</span>
                                  <span className="text-white font-semibold">{Math.round((visuals.progressBarScale !== undefined ? visuals.progressBarScale : 1.0) * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="1.0"
                                  step="0.05"
                                  value={visuals.progressBarScale !== undefined ? visuals.progressBarScale : 1.0}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, progressBarScale: parseFloat(e.target.value) }))}
                                  className="w-full accent-blue-600 cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Color settings based on chosen style */}
                            <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-900/60 pt-2.5">
                              <div>
                                <label className="block text-[9px] text-zinc-500 font-mono mb-1">Track Color</label>
                                <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1 w-full">
                                  <input
                                    type="color"
                                    value={visuals.progressBarTrackColor || '#27272a'}
                                    onChange={(e) => setVisuals(prev => ({ ...prev, progressBarTrackColor: e.target.value }))}
                                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                                  />
                                  <span className="text-[10px] text-zinc-400 font-mono font-bold truncate">Background</span>
                                </div>
                              </div>

                              {(visuals.progressBarStyle || 'gradient') === 'gradient' ? (
                                <>
                                  <div>
                                    <label className="block text-[9px] text-zinc-500 font-mono mb-1">Gradient Start</label>
                                    <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1 w-full">
                                      <input
                                        type="color"
                                        value={visuals.progressBarGradientStart || visuals.primaryColor}
                                        onChange={(e) => setVisuals(prev => ({ ...prev, progressBarGradientStart: e.target.value }))}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                                      />
                                      <span className="text-[10px] text-zinc-400 font-mono font-bold truncate">Start Color</span>
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[9px] text-zinc-500 font-mono mb-1">Gradient End</label>
                                    <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1 w-full">
                                      <input
                                        type="color"
                                        value={visuals.progressBarGradientEnd || visuals.secondaryColor}
                                        onChange={(e) => setVisuals(prev => ({ ...prev, progressBarGradientEnd: e.target.value }))}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                                      />
                                      <span className="text-[10px] text-zinc-400 font-mono font-bold truncate">End Color</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <label className="block text-[9px] text-zinc-500 font-mono mb-1">Fill Color</label>
                                  <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-900 rounded p-1 w-full">
                                    <input
                                      type="color"
                                      value={visuals.progressBarFillColor || visuals.primaryColor}
                                      onChange={(e) => setVisuals(prev => ({ ...prev, progressBarFillColor: e.target.value }))}
                                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent animate-none"
                                    />
                                    <span className="text-[10px] text-zinc-400 font-mono font-bold truncate">Active Color</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Round Endcaps Toggle */}
                            <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2.5 bg-transparent">
                              <div>
                                <span className="font-semibold text-zinc-400 block font-sans text-[10px] uppercase">Round Endcaps</span>
                                <span className="text-[9px] text-zinc-500 block font-sans mt-0.5">Toggle round pill caps or modern sharp square caps</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setVisuals(prev => ({ ...prev, progressBarRoundCaps: prev.progressBarRoundCaps === false }))}
                                className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                                  visuals.progressBarRoundCaps !== false ? 'bg-blue-600' : 'bg-zinc-800'
                                }`}
                              >
                                <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                                  visuals.progressBarRoundCaps !== false ? 'translate-x-3.5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Built-in Brand Watermark Toggle */}
                        <div className="flex items-center justify-between p-2.5 bg-[#07070a]/80 rounded border border-zinc-950/60">
                          <div className="text-left">
                            <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Render Branding Watermark</span>
                            <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Renders a subtle, clean modern "Made with tymark" overlay in canvas margins</span>
                          </div>
                          <button
                            id="render-watermark-toggle"
                            type="button"
                            onClick={() => setVisuals(prev => ({ ...prev, renderWatermark: !prev.renderWatermark }))}
                            className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                              visuals.renderWatermark ? 'bg-blue-600' : 'bg-zinc-800'
                            }`}
                          >
                            <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                              visuals.renderWatermark ? 'translate-x-3.5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Watermark Logo Upload Slot */}
                        <div className="space-y-1.5 p-3 bg-zinc-900/30 rounded border border-zinc-850/50">
                          <label className="block text-[10px] text-zinc-400 font-mono uppercase text-left">Logo / Watermark Uploader</label>
                          
                          {visuals.watermarkUrl ? (
                            <div className="flex items-center justify-between p-2 bg-zinc-950 rounded border border-zinc-850">
                              <div className="flex items-center space-x-2 overflow-hidden mr-2">
                                <img src={visuals.watermarkUrl} className="w-8 h-8 rounded object-contain bg-zinc-900 border border-zinc-800" alt="Watermark preview" referrerPolicy="no-referrer" />
                                <span className="text-[10px] text-zinc-400 truncate">Channel Watermark Loaded</span>
                              </div>
                              <button
                                onClick={handleClearWatermark}
                                type="button"
                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-semibold px-2 py-1 rounded bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/30 hover:bg-zinc-950/50 rounded p-4 text-center group transition-colors">
                              <input
                                type="file"
                                accept="image/png"
                                onChange={handleWatermarkUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                id="watermark-file-input"
                              />
                              <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                                <span className="text-zinc-300 font-sans text-[11px] group-hover:text-zinc-200 transition-colors font-medium">Upload PNG File</span>
                                <span className="text-zinc-650 text-[9px]">Transparency support recommended</span>
                              </div>
                            </div>
                          )}

                          {visuals.watermarkUrl && (
                            <div className="space-y-2.5 pt-2 border-t border-zinc-850/50">
                              {/* Watermark Opacity Slider */}
                              <div className="space-y-1 text-left">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                                  <span>WATERMARK OPACITY</span>
                                  <span className="text-white font-semibold">
                                    {Math.round((visuals.watermarkOpacity !== undefined ? visuals.watermarkOpacity : 0.8) * 100)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="1.0"
                                  step="0.05"
                                  value={visuals.watermarkOpacity !== undefined ? visuals.watermarkOpacity : 0.8}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                                  className="w-full accent-blue-600"
                                />
                              </div>

                              {/* Watermark Scale / Size Slider */}
                              <div className="space-y-1 text-left">
                                <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                                  <span>WATERMARK SCALE / SIZE</span>
                                  <span className="text-white font-semibold">
                                    {Math.round(visuals.watermarkScale !== undefined ? visuals.watermarkScale : 100)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="200"
                                  step="5"
                                  value={visuals.watermarkScale !== undefined ? visuals.watermarkScale : 100}
                                  onChange={(e) => setVisuals(prev => ({ ...prev, watermarkScale: parseInt(e.target.value) }))}
                                  className="w-full accent-blue-600"
                                />
                              </div>

                              {/* Watermark Position Dropdown */}
                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-mono text-zinc-400 uppercase">Logo Position</label>
                                <select
                                  value={visuals.watermarkPosition || 'top-right'}
                                  onChange={(e: any) => setVisuals(prev => ({ ...prev, watermarkPosition: e.target.value }))}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-zinc-350 text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                                >
                                  <option value="top-left">Top-Left</option>
                                  <option value="top-right">Top-Right</option>
                                  <option value="bottom-left">Bottom-Left</option>
                                  <option value="bottom-right">Bottom-Right</option>
                                </select>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* TABS C: PARTICLES SET */}
            {activeTab === 'particles' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">Particle Physics Vector</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">Configure live floating elements reactive to dynamic waveform peaks.</p>
                </div>

                <div className="space-y-4">
                  {/* Selector particle type */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5 font-mono uppercase">Particle Visual Template</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'stars', name: 'Classic Stars' },
                        { id: 'bubbles', name: 'Bobbing Rings' },
                        { id: 'sparks', name: 'Combust Fire' },
                        { id: 'sakura', name: 'Cherry Sakura' },
                        { id: 'dust', name: 'Nebula Dust' },
                        { id: 'digital', name: 'Binary digital' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setParticlesSet(prev => ({ ...prev, type: item.id as ParticleType }))}
                          className={`py-2 px-1 text-center rounded text-[11px] transition-all cursor-pointer ${
                            particlesSet.type === item.id
                              ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                              : 'bg-zinc-900 border border-zinc-900 text-zinc-400 hover:bg-zinc-850'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Physics Config sliders */}
                  <div className="space-y-4 bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-xs">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Total Stars Count</span>
                          <span className="text-white font-semibold">{particlesSet.count}</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="250"
                          step="10"
                          value={particlesSet.count}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Average Velocity</span>
                          <span className="text-white font-semibold">{particlesSet.speed} px/s</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="8.0"
                          step="0.5"
                          value={particlesSet.speed}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Min Diam ({particlesSet.minSize}px)</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={particlesSet.minSize}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, minSize: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Max Diam ({particlesSet.maxSize}px)</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="25"
                          value={particlesSet.maxSize}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, maxSize: Math.max(particlesSet.minSize + 1, parseInt(e.target.value)) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Gravity Pulses ({particlesSet.gravity})</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="0.2"
                          value={particlesSet.gravity}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Wind Sway ({particlesSet.wind})</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.2"
                          value={particlesSet.wind}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, wind: parseFloat(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-850">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Beat-Reactive Pulse</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Accelerate and grow shapes on kick beats</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setParticlesSet(prev => ({ ...prev, beatReactive: !prev.beatReactive }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          particlesSet.beatReactive ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          particlesSet.beatReactive ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-850">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Particle Physics Collision</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5">Enable interactive collisions where particles bounce off walls & each other</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setParticlesSet(prev => ({ ...prev, enablePhysics: !prev.enablePhysics }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          particlesSet.enablePhysics ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          particlesSet.enablePhysics ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-mono">Particle Glow Tint</span>
                      <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
                        <input
                          type="color"
                          value={particlesSet.color}
                          onChange={(e) => setParticlesSet(prev => ({ ...prev, color: e.target.value }))}
                          className="w-6 h-6 border-0 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-[9px] text-zinc-400">{particlesSet.color.toUpperCase()}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* TABS D: BACKGROUND SETTINGS */}
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">Background Backdrop</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">Configure vector wallpaper backing or custom video elements.</p>
                </div>

                <div className="space-y-4">
                  {/* Backdrop Category Toggles */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5 font-mono uppercase">Background Format</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'color', name: 'Solid Color' },
                        { id: 'gradient', name: 'Linear Gradient' },
                        { id: 'image', name: 'Image Backdrop' },
                        { id: 'video', name: 'Video Loop Backdrop' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setBackground(prev => ({ ...prev, type: item.id as any }))}
                          className={`py-2 px-3 rounded text-left transition-all cursor-pointer ${
                            background.type === item.id
                              ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                              : 'bg-zinc-900 border border-zinc-900 text-zinc-400 hover:bg-zinc-850'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Size & Orientation Selection Block */}
                  <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-zinc-400 font-mono uppercase">Video Layout / Orientation</label>
                      <span className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-1.5 py-0.5 rounded font-mono">
                        {exportSettings.aspectRatio === '16:9' ? '1920 × 1080 px' : exportSettings.aspectRatio === '9:16' ? '1080 × 1920 px' : '1080 × 1080 px'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setExportSettings(prev => ({ ...prev, aspectRatio: '16:9' }))}
                        className={`py-2 px-2.5 rounded text-center transition-all cursor-pointer ${
                          exportSettings.aspectRatio === '16:9'
                            ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                            : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:bg-zinc-850'
                        }`}
                      >
                        <span className="block font-semibold text-[11px]">Landscape</span>
                        <span className="block text-[8px] text-zinc-550 font-mono scale-90">16:9 Cinema Wide</span>
                      </button>
                      <button
                        onClick={() => setExportSettings(prev => ({ ...prev, aspectRatio: '9:16' }))}
                        className={`py-2 px-2.5 rounded text-center transition-all cursor-pointer ${
                          exportSettings.aspectRatio === '9:16'
                            ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                            : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:bg-zinc-850'
                        }`}
                      >
                        <span className="block font-semibold text-[11px]">Portrait</span>
                        <span className="block text-[8px] text-zinc-550 font-mono scale-90">9:16 Vertical Video</span>
                      </button>
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Backdrop Specific Controllers */}
                  {background.type === 'color' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3">
                      <label className="block text-[10px] text-zinc-400 font-mono">Select Theme Backing Color</label>
                      <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-855 p-2 rounded">
                        <input
                          type="color"
                          value={background.color}
                          onChange={(e) => setBackground(prev => ({ ...prev, color: e.target.value }))}
                          className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer animate-none"
                        />
                        <div className="text-xs font-mono">
                          <p className="text-white font-semibold">HEX Tint Value</p>
                          <p className="text-zinc-500">{background.color.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {background.type === 'gradient' && (
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3.5">
                      <label className="block text-[10px] text-zinc-400 font-mono">Gradient Horizon Config</label>
                      <div className="grid grid-cols-2 gap-3.5 text-xs text-left">
                        <div>
                          <label className="block text-[9px] text-zinc-500 mb-1">Color Start</label>
                          <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-850 rounded p-1">
                            <input
                              type="color"
                              value={background.gradientStart}
                              onChange={(e) => setBackground(prev => ({ ...prev, gradientStart: e.target.value }))}
                              className="w-6 h-6 border-0 bg-transparent cursor-pointer animate-none"
                            />
                            <span className="font-mono text-[9px] text-zinc-400">{background.gradientStart.toUpperCase()}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] text-zinc-500 mb-1">Color End</label>
                          <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-855 rounded p-1">
                            <input
                              type="color"
                              value={background.gradientEnd}
                              onChange={(e) => setBackground(prev => ({ ...prev, gradientEnd: e.target.value }))}
                              className="w-6 h-6 border-0 bg-transparent cursor-pointer animate-none"
                            />
                            <span className="font-mono text-[9px] text-zinc-400">{background.gradientEnd.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(background.type === 'image' || background.type === 'video') && (
                    <div className="space-y-4">
                      {/* Unified Asset Uploader UI */}
                      <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg p-5 text-center relative group">
                        <input
                          type="file"
                          accept="image/*,video/*,video/quicktime,.mov,.mp4,.webm"
                          onChange={handleManualBgAssetUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 py-2 pointer-events-none">
                          <Upload className="w-5 h-5 text-zinc-400" />
                          <div>
                            <p className="text-xs text-white">Upload backdrop photo or looping video</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Supports PNG, JPG, WEBP, MP4, WebM, MOV</p>
                          </div>
                        </div>
                      </div>

                      {/* Display Uploaded Image Asset Status */}
                      {background.imageUrl && (
                        <div className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                          background.type === 'image' 
                            ? 'bg-blue-600/5 border-blue-500/20' 
                            : 'bg-zinc-900 border-zinc-800'
                        }`}>
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <img src={background.imageUrl} className="w-8 h-8 rounded object-cover shadow-inner shrink-0" />
                            <div className="truncate flex flex-col">
                              <span className="text-zinc-200 font-medium truncate">Backdrop Photo Linked</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Image Backdrop Layer</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {background.type !== 'image' && (
                              <button
                                onClick={() => setBackground(prev => ({ ...prev, type: 'image' }))}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] rounded transition-all cursor-pointer font-mono"
                              >
                                ACTIVATE
                              </button>
                            )}
                            <button
                              onClick={clearBackgroundImg}
                              className="bg-zinc-950 hover:bg-zinc-850 text-zinc-450 hover:text-red-400 p-1.5 rounded transition-all cursor-pointer"
                              title="Remove Backdrop Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display Uploaded Video Asset Status */}
                      {background.videoUrl && (
                        <div className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                          background.type === 'video' 
                            ? 'bg-blue-600/5 border-blue-500/20' 
                            : 'bg-zinc-900 border-zinc-800'
                        }`}>
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-850">
                              <FileVideo className={`w-4 h-4 ${background.type === 'video' ? 'text-blue-500 animate-pulse' : 'text-zinc-500'}`} />
                            </div>
                            <div className="truncate flex flex-col">
                              <span className="text-zinc-200 font-medium truncate">Looping Video Linked</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Video Backdrop Layer</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {background.type !== 'video' && (
                              <button
                                onClick={() => setBackground(prev => ({ ...prev, type: 'video' }))}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] rounded transition-all cursor-pointer font-mono"
                              >
                                ACTIVATE
                              </button>
                            )}
                            <button
                              onClick={clearBackgroundVid}
                              className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-red-400 p-1.5 rounded transition-all cursor-pointer"
                              title="Remove Backdrop Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}                  {/* Backdrop blur & filter dimmers */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-xs space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>BACKDROP FILTER BLUR</span>
                        <span className="text-white font-semibold">{background.blur} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={background.blur}
                        onChange={(e) => setBackground(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                        <span>DIMBACKDROP OPACITY / DIMMER</span>
                        <span className="text-white font-semibold">{Math.round(background.opacity * 100)} %</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={background.opacity}
                        onChange={(e) => setBackground(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Cinematic Vignette Overlay */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-bold">
                        <span>CINEMATIC VIGNETTE</span>
                        <span className="text-white font-semibold">{(background.vignette ?? 0)} %</span>
                      </div>
                      <input
                        id="cinematic-vignette-slider"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={background.vignette ?? 0}
                        onChange={(e) => setBackground(prev => ({ ...prev, vignette: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <p className="text-[9px] text-zinc-500 font-sans leading-relaxed text-left">
                        Draws a moody radial gradient overlay on top of the canvas that darkens outer corners
                      </p>
                    </div>
                  </div>

                  {/* Audio Beat-Reactive Toggles for Background */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg text-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-300 block font-sans text-[11px]">Enable Beat Reaction</span>
                        <span className="text-[10px] text-zinc-500 block font-sans mt-0.5 font-normal">Pulse / Zoom the entire background dynamically on beat</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackground(prev => ({ ...prev, enableBeatReaction: !prev.enableBeatReaction }))}
                        className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer ${
                          background.enableBeatReaction ? 'bg-blue-600' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                          background.enableBeatReaction ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {background.enableBeatReaction && (
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                        <label className="block text-[10px] text-zinc-400 font-mono uppercase font-semibold">Beat Reaction Bandwidth</label>
                        <select
                          value={background.beatReactionType || 'bass'}
                          onChange={(e) => setBackground(prev => ({ ...prev, beatReactionType: e.target.value as any }))}
                          className="w-full bg-[#0a0a0f] border border-zinc-850 rounded-lg p-2 text-zinc-300 text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                        >
                          <option value="bass">React to Bass (Low Frequencies)</option>
                          <option value="beat">React to Main Beat (Mid-High Frequencies)</option>
                        </select>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TABS F: VIDEO OVERLAY TRACK */}
            {activeTab === 'overlay' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <FileVideo className="w-4 h-4 text-pink-500" />
                    <span>Foreground Video Overlay</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                    Overlay an elegant foreground video track. Its audio is routed to the analyser so waveform heights reactive-bounce to its frequencies.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Video Uploader Container */}
                  <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-lg space-y-3">
                    <label className="block text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider">
                      Upload Foreground Video (.mp4, .webm)
                    </label>
                    
                    {!visuals.overlayVideoUrl ? (
                      <div className="relative border-2 border-dashed border-zinc-800 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-all">
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              loadOverlayVideoFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-5 h-5 text-zinc-500 mb-2" />
                        <span className="text-[11px] text-zinc-400 font-sans font-medium">Click to select video overlay</span>
                        <span className="text-[9px] text-zinc-550 font-mono mt-1">supports MP4 and WebM files</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-8 h-8 rounded bg-pink-950 flex items-center justify-center border border-pink-900">
                            <FileVideo className="w-4 h-4 text-pink-500" />
                          </div>
                          <div className="truncate">
                            <p className="text-[11px] font-medium text-white truncate">Overlay Active</p>
                            <p className="text-[9px] text-zinc-500 font-mono">Video loaded</p>
                          </div>
                        </div>
                        <button
                          onClick={clearOverlayVideo}
                          className="p-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-red-450 rounded transition-all cursor-pointer"
                          title="Remove overlay video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Positioning and Scale Controls */}
                  {visuals.overlayVideoUrl && (
                    <div className="bg-zinc-900 border border-zinc-855 p-4 rounded-lg space-y-4">
                      
                      {/* Overlay Scaling Mode */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-zinc-400 font-mono uppercase font-semibold">Overlay Scaling Mode</label>
                        <select
                          value={visuals.overlayScaleMode || 'fit'}
                          onChange={(e) => setVisuals(prev => ({ ...prev, overlayScaleMode: e.target.value as any }))}
                          className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-lg p-2 text-zinc-350 text-xs focus:outline-none focus:border-pink-500 font-medium cursor-pointer"
                        >
                          <option value="fit">Fit (Maintain Ratio)</option>
                          <option value="cover">Fill/Cover Screen</option>
                        </select>
                        <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                          Fit maintains native video ratios. Cover scales the video overlay to fully fill the canvas vertically/horizontally without leaving black gaps under portrait layout modes.
                        </p>
                      </div>

                      {/* Opacity Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Overlay Opacity</span>
                          <span className="text-white font-semibold">
                            {visuals.overlayOpacity !== undefined ? visuals.overlayOpacity : 100} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={visuals.overlayOpacity !== undefined ? visuals.overlayOpacity : 100}
                          onChange={(e) => setVisuals(prev => ({ ...prev, overlayOpacity: parseInt(e.target.value) }))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                      {/* Scale Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Overlay Scale / Size</span>
                          <span className="text-white font-semibold">
                            {visuals.overlayScale !== undefined ? visuals.overlayScale : 50} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={visuals.overlayScale !== undefined ? visuals.overlayScale : 50}
                          onChange={(e) => setVisuals(prev => ({ ...prev, overlayScale: parseInt(e.target.value) }))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                      {/* Manual Overlay X Position */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Overlay X Position</span>
                          <span className="text-white font-semibold">
                            {visuals.overlayX !== undefined ? visuals.overlayX : 50} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={visuals.overlayX !== undefined ? visuals.overlayX : 50}
                          onChange={(e) => setVisuals(prev => ({ ...prev, overlayX: parseInt(e.target.value) }))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                      {/* Manual Overlay Y Position */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span>Overlay Y Position</span>
                          <span className="text-white font-semibold">
                            {visuals.overlayY !== undefined ? visuals.overlayY : 50} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={visuals.overlayY !== undefined ? visuals.overlayY : 50}
                          onChange={(e) => setVisuals(prev => ({ ...prev, overlayY: parseInt(e.target.value) }))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />
                      </div>

                    </div>
                  )}
                                  {/* Dedicated audio controls inside the overlay track */}
                  {visuals.overlayVideoUrl && (
                    <div className="bg-zinc-900 border border-zinc-855 p-4 rounded-lg space-y-3.5 text-left">
                      <div className="text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider">
                        Overlay Audio Routing Mix
                      </div>

                      <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-900 px-3 py-2.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setVisuals(prev => ({ ...prev, overlayMuted: !prev.overlayMuted }));
                          }}
                          className={`px-2.5 py-1.5 rounded text-[10px] font-semibold font-mono tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 flex-shrink-0 ${
                            visuals.overlayMuted
                              ? 'bg-red-955 border border-red-800 text-red-400'
                              : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300'
                          }`}
                        >
                          {visuals.overlayMuted ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                              <span>MUTED</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                              <span>MUTE</span>
                            </>
                          )}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                            <span>Overlay Video Volume</span>
                            <span className="text-zinc-200 font-semibold">{visuals.overlayVolume !== undefined ? visuals.overlayVolume : 100} %</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={visuals.overlayVolume !== undefined ? visuals.overlayVolume : 100}
                            onChange={(e) => setVisuals(prev => ({ ...prev, overlayVolume: parseInt(e.target.value) }))}
                            className="w-full accent-pink-500 h-1 cursor-pointer bg-zinc-900 rounded-lg appearance-none"
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                        Muting prevents speakers from outputting overlay audio, but leaves live visual analyzer reaction/waveform heights intact!
                      </p>
                    </div>
                  )}

                  {/* Multi-Image Overlay (Stickers / Album covers) Section */}
                  <hr className="border-zinc-900 my-4" />
                  
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>Custom Image Overlays (Stickers)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 font-sans">
                      Add multiple static overlays like album art, logos, custom stickers or PNG emojis. Drag and scale them directly on-canvas!
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Add Image Button */}
                    <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-lg space-y-3">
                      <label className="block text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider">
                        Upload custom overlay PNG / JPG
                      </label>
                      <div className="relative border-2 border-dashed border-zinc-800 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAddOverlayImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-5 h-5 text-blue-500 mb-2" />
                        <span className="text-[11px] text-zinc-400 font-sans font-medium">+ Add Overlay Image</span>
                      </div>
                    </div>

                    {/* Image List Deck */}
                    {overlayImages.length > 0 && (
                      <div className="space-y-3">
                        <label className="block text-[10px] font-semibold text-zinc-400 font-mono uppercase tracking-wider">
                          Active Stickers & Overlays
                        </label>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {overlayImages.map((img) => {
                            const isSelected = selectedOverlayImageId === img.id;
                            return (
                              <div
                                key={img.id}
                                onClick={() => setSelectedOverlayImageId(img.id)}
                                className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col space-y-3 ${
                                  isSelected
                                    ? 'bg-blue-600/10 border-blue-500 text-white'
                                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:bg-zinc-850'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2.5 truncate">
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-8 h-8 rounded object-cover border border-zinc-800 bg-black/40"
                                    />
                                    <div className="truncate flex flex-col">
                                      <p className="text-[11px] font-medium text-white truncate">{img.name}</p>
                                      <p className="text-[9px] text-zinc-500 font-mono">Scale: {img.scale}% • X: {img.x}% Y: {img.y}%</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOverlayImages(prev => prev.filter(x => x.id !== img.id));
                                      if (selectedOverlayImageId === img.id) {
                                        setSelectedOverlayImageId(null);
                                      }
                                      delete overlayImageElementsRef.current[img.id];
                                    }}
                                    className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                    title="Delete Overlay"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {isSelected && (
                                  <div className="pt-2 border-t border-zinc-800/60 space-y-3 text-xs text-zinc-400">
                                    {/* Scale Slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between font-mono text-[9px]">
                                        <span>Sticker Scale size</span>
                                        <span className="text-white font-semibold">{img.scale} %</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="5"
                                        max="150"
                                        value={img.scale}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setOverlayImages(prev => prev.map(x => x.id === img.id ? { ...x, scale: val } : x));
                                        }}
                                        className="w-full accent-blue-500"
                                      />
                                    </div>

                                    {/* Opacity Slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between font-mono text-[9px]">
                                        <span>Sticker Opacity</span>
                                        <span className="text-white font-semibold">{img.opacity !== undefined ? img.opacity : 100} %</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={img.opacity !== undefined ? img.opacity : 100}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setOverlayImages(prev => prev.map(x => x.id === img.id ? { ...x, opacity: val } : x));
                                        }}
                                        className="w-full accent-blue-500"
                                      />
                                    </div>

                                    {/* Audio Beat Reaction */}
                                    <div className="space-y-2 bg-[#0c0c14]/40 p-2.5 rounded border border-zinc-800/40">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <span className="font-semibold text-zinc-300 block text-[10px]">Enable Beat Pulse</span>
                                          <span className="text-[9px] text-zinc-500 block">Sticker bounces dynamically to live audio tracks</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOverlayImages(prev => prev.map(x => x.id === img.id ? { ...x, enableBeatReaction: !x.enableBeatReaction } : x));
                                          }}
                                          className={`relative w-8 h-4.5 rounded-full transition-all cursor-pointer ${
                                            img.enableBeatReaction ? 'bg-blue-600' : 'bg-zinc-800'
                                          }`}
                                        >
                                          <span className={`absolute top-[2px] left-[2px] bg-zinc-100 rounded-full h-3.5 w-3.5 transition-all ${
                                            img.enableBeatReaction ? 'translate-x-3.5' : 'translate-x-0'
                                          }`} />
                                        </button>
                                      </div>

                                      {img.enableBeatReaction && (
                                        <div className="space-y-2 pt-1">
                                          <div>
                                            <span className="text-[9px] text-zinc-500 block font-mono mb-1">Beat reaction Bandwidth</span>
                                            <select
                                              value={img.beatReactionType || 'bass'}
                                              onChange={(e) => {
                                                const val = e.target.value as 'bass' | 'beat';
                                                setOverlayImages(prev => prev.map(x => x.id === img.id ? { ...x, beatReactionType: val } : x));
                                              }}
                                              className="w-full bg-[#0a0a0f] border border-zinc-800 rounded p-1.5 text-zinc-350 text-[10px] focus:outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                              <option value="bass">Bass Peaks (Low frequencies)</option>
                                              <option value="beat">Main Drum Beats (Mid-high frequencies)</option>
                                            </select>
                                          </div>
                                          <div>
                                            <div className="flex justify-between font-mono text-[9px]">
                                              <span>Pulse Stretch Intensity</span>
                                              <span className="text-white font-semibold">{(img.beatReactionIntensity || 1.0).toFixed(1)}x</span>
                                            </div>
                                            <input
                                              type="range"
                                              min="0.1"
                                              max="3.0"
                                              step="0.1"
                                              value={img.beatReactionIntensity || 1.0}
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setOverlayImages(prev => prev.map(x => x.id === img.id ? { ...x, beatReactionIntensity: val } : x));
                                              }}
                                              className="w-full accent-blue-500"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TABS E: VIDEO EXPORTS */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <FileVideo className="w-4 h-4 text-blue-500" />
                    <span>Real-Time Export Engine</span>
                  </h3>
                  <p className="text-[11px] text-zinc-550 mt-1 font-sans">Render interactive canvas sequences with synchronized direct audio outputs.</p>
                </div>

                <div className="space-y-4">
                  
                  {/* Selector Export Format */}
                  <div className="bg-zinc-900 border border-zinc-805 p-3.5 rounded-lg space-y-3">
                    <label className="block text-[10px] font-semibold text-zinc-400 font-mono uppercase">Output Container Suffix</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'mp4', name: '.MP4', desc: 'Universal' },
                        { id: 'mov', name: '.MOV', desc: 'Apple format' },
                        { id: 'webm', name: '.WebM', desc: 'HTML5 raw' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setExportSettings(prev => ({ ...prev, format: item.id as any }))}
                          className={`py-2 rounded text-center text-xs transition-all cursor-pointer ${
                            exportSettings.format === item.id
                              ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                              : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:bg-zinc-850'
                          }`}
                        >
                          <span className="block font-semibold text-[11px]">{item.name}</span>
                          <span className="block text-[9px] text-zinc-550 font-mono scale-90">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Layout Ratio */}
                  <div className="bg-zinc-900 border border-zinc-805 p-3.5 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-zinc-400 font-mono uppercase">Aspect framing Ratio</label>
                      <span className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-1.5 py-0.5 rounded font-mono">Canvas Frame</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '16:9', name: '16:9 Landscape', desc: 'YouTube Video' },
                        { id: '9:16', name: '9:16 Vertical', desc: 'TikTok / Reel' },
                        { id: '1:1', name: '1:1 Square', desc: 'Album Cover' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setExportSettings(prev => ({ ...prev, aspectRatio: item.id as any }))}
                          className={`py-2 rounded text-center text-xs transition-all cursor-pointer ${
                            exportSettings.aspectRatio === item.id
                              ? 'bg-blue-600/10 border border-blue-500 text-white font-medium'
                              : 'bg-zinc-950 border border-zinc-900 hover:bg-zinc-850 text-zinc-400'
                          }`}
                        >
                          <span className="block font-semibold text-[11px]">{item.name}</span>
                          <span className="block text-[8px] text-zinc-550 overflow-hidden text-ellipsis whitespace-nowrap font-mono">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Quality selectors */}
                  <div className="bg-zinc-900 border border-zinc-805 p-3.5 rounded-lg text-xs space-y-3.5">
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">Target Quality</label>
                        <select
                          value={exportSettings.resolution}
                          onChange={(e: any) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="720p">720p HD Ready</option>
                          <option value="1080p">1080p Full HD</option>
                          <option value="2160p">4K UHD Master</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-mono text-[9px] uppercase mb-1">FPS Frame pacing</label>
                        <select
                          value={exportSettings.fps}
                          onChange={(e: any) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) as any }))}
                          className="w-full bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="30">30 Frames per Sec</option>
                          <option value="60">60 Smooth Pro FPS</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* MASTER TRIGGER BUTTON */}
                  {!isExporting ? (
                    <button
                      onClick={handleStartExport}
                      className="w-full py-4 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono font-semibold tracking-wide rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2.5 cursor-pointer text-xs"
                    >
                      <Download className="w-5 h-5 shrink-0" />
                      <span>RENDER & EXPORT THE MUSIC VIDEO</span>
                    </button>
                  ) : (
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-lg p-3 text-center text-xs text-blue-400 font-mono animate-pulse">
                      Exporting clip... Rendering frames...
                    </div>
                  )}

                  {/* DOWNLOAD PACK COMPLETED SCREEN */}
                  {exportedVideoUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-4"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-sm bg-blue-600/15 flex items-center justify-center border border-blue-500/20">
                          <Check className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-white uppercase font-mono tracking-wide">Export compilation complete!</h4>
                          <p className="text-[9px] text-zinc-450 mt-0.5">Muxed output is ready for social channels</p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-zinc-950 rounded border border-zinc-900">
                        <p className="text-[9px] font-mono text-zinc-400">File Type: <span className="text-white font-semibold uppercase">{exportSettings.format} Container</span></p>
                        <p className="text-[9px] font-mono text-zinc-400 mt-1">Resolution: <span className="text-white font-semibold">{exportSettings.aspectRatio} Layout</span></p>
                      </div>

                      <a
                        href={exportedVideoUrl}
                        download={`music_video_${Date.now()}.${exportSettings.format}`}
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-xs font-semibold text-center transition-all flex items-center justify-center space-x-1.5 shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD {exportSettings.format.toUpperCase()} CHRONICLE</span>
                      </a>
                    </motion.div>
                  )}

                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer id="main-footer" className="border-t border-zinc-900 bg-zinc-950 py-3.5 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-zinc-500 font-mono gap-2.5">
        <p>Drop audio, image, or video directly into the interface window to customize.</p>
        <p>© 2026 Studio Waveform Builder • Client-Side Muxing Render</p>
      </footer>
    </div>
  );
}
