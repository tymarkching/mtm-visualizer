export type VisualizerStyle =
  | 'bars'         // Frequency bars
  | 'waveform'     // Real-time waveform wave
  | 'circular'     // Circular audio wave
  | 'radial-bars'  // Radial frequency bars
  | 'retro'        // Retro spectrum/starburst
  | 'neon-tunnel'  // Tunnel effect based on frequency
  | 'laser-orbit'  // Laser lines orbiting the center
  | 'wave-matrix'  // Matrix grid of waveforms
  | 'heartbeat-ekg'// EKG electrocardiogram pulsing wave
  | 'fresnel-wave' // Beautiful overlapping interference sine wave layers
  | 'dna-helix'    // Audio-responsive rotating double helix
  | 'double-mirror-bars'       // Double-sided symmetrical mirroring bars
  | 'circular-orbit'           // Circular orbit tunnel with outer pulsing bars
  | 'radial-inside-out'        // Inside-out frequencies shooting inward
  | 'digital-vu-blocks'        // Classic retro blocky stereo stack VU meters
  | 'dna-helix-thread'         // Intertwined sine waves reacting to mid and treble
  | 'smooth-area-silhouette'   // Filled vector polygon wave with opacity gradient
  | 'floating-matrix-particles'// column particles rising to frequency thresholds
  | 'symmetrical-waveform'     // Symmetrical diamond-like pulse waveform
  | 'rounded-pill-bars'        // Modern Rounded Pill Bars with rounded caps
  | 'neon-glow-string'         // Neon Glow String Line connected via Bezier with heavy blur
  | 'floating-bubble-particles'// Floating Bubble Particles scaling with frequency
  | 'mirrored-wave-silhouette' // Mirrored Wave Shadow Silhouette symmetrical filled polygon
  | 'retro-arcade-dot-grid'    // Retro Arcade Dot Grid equalizer blocks
  | 'minimalist-pulse-dot'     // Minimalist Floating Pulse Dots (bass, mids, treble)
  | 'modern-sleek'             // Modern Sleek neon wavelines with gradient glow
  | 'frequency-spectrogram'   // Frequency Spectrogram style heatmap
  | 'cyber-laser-horizon'      // Cyber Laser Horizon lines/beam scanners
  | 'neon-geometric-ring'      // Neon Geometric Ring broken orbit layouts
  | 'retro-arcade-stack'       // 80s Retro Arcade Stack equalizer blocks
  | 'prism-laser-scanner'      // Prism Laser Scanner diagonal coordinate vector sweep
  | 'floating-wave-echo'       // Floating Wave Echo fluid bezier frames with ghost trails
  | 'digital-matrix-blocks'    // Digital Matrix Blocks vertical segments
  | 'plasma-glow-ribbon'       // Plasma Glow Ribbon bezier path with intense neon aura
  | 'concentric-dual-radials'  // Concentric Dual Radials rings for bass and midrange
  | 'shaded-mirror-silhouette' // Shaded Mirror Silhouette filled custom linear gradient;
  | 'reflected-glow-ribbon'     // Reflected Glow Ribbon continuous bezier curve with neon reflection
  | 'reflected-matrix-dots'     // Reflected Matrix Dots glowing circular dots mirrored downward
  | 'reflected-mountain-silhouette' // Reflected Mountain Silhouette filled area with flipped reflection
  | 'reflected-center-split-pins' // Reflected Center-Split Pins symmetrical outward needle tracks
  | 'reflected-radial-ring-horizon' // Reflected Radial Ring Horizon vertical splitting and mirroring floor
  | 'bouncing-circles'; // Bouncing circles reacting to frequency bins in a discrete array

export type ParticleType =
  | 'stars'
  | 'bubbles'
  | 'sparks'
  | 'sakura'
  | 'dust'
  | 'digital'
  | 'hearts'
  | 'glow-circles'
  | 'spark-stars'
  | 'snowflakes'
  | 'glowing-stars'
  | 'cyber-triangles'
  | 'floating-bubbles'
  | 'music-notes'
  | 'glitch-vectors'
  | 'swerve-plexus'
  | 'electro-storm'
  | 'liquid-gold'
  | 'quantum-snow'
  | 'hardstyle-laser'
  | 'dnb-neuro'
  | 'speedcore-glitch'
  | 'hardcore-pulse'
  | 'frenchcore-spark';

export interface VisualizerSettings {
  style: VisualizerStyle;
  activeStyles?: VisualizerStyle[];
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  glowStrength: number;
  lineThickness: number;
  sensitivity: number; // multiplier for Audio Analyser data
  horizontalScale?: number; // horizontal layout stretch scale
  verticalScale?: number; // vertical layout stretch scale
  centerScale?: number; // center scale zoom
  fftSize: number; // resolution of audio detail
  barRoundness: number; // border radius for bars
  barSpacing: number;
  spectrumAnalyzer?: boolean; // toggle to replace standard waveform with a frequency bar chart view
  smoothing?: number; // transition speed between frequency frames (0.0 to 1.0)
  cameraShake?: number; // intensity/multiplier slider for high-bass dynamic shake offsets
  placement?: 'bottom' | 'top' | 'center' | 'left' | 'right'; // baseline placement for rendering coordinates
  waveformOffsetX?: number; // manual fine-tuning horizontal offset (0-100%, default 50)
  waveformOffsetY?: number; // manual fine-tuning vertical offset (0-100%, default 50)
  useCustomWaveformColor?: boolean;
  waveformColor?: string;
  waveformGlowSpread?: number;
  colorMode?: 'solid' | 'gradient' | 'rainbow'; // spectrum color mapping models
  useCustomGradientDirection?: boolean;
  gradientDirectionAngle?: number; // 0 to 360
  canvasRotation?: number; // global stage rotation in degrees
  autoRotateCanvas?: boolean; // toggle auto rotation
  autoRotateSpeed?: number; // speed of auto rotation
  flashOnBeat?: boolean; // flash glowColor/visualizer to white on every detected beat
  flashIntensity?: number; // flash intensity (0 to 1, default 1)
  flashColorMode?: 'white' | 'custom' | 'colorA' | 'glowColor'; // option for flash color
  flashCustomColor?: string; // custom hex color for flash
  flipWaveform?: boolean; // vertically flip waveform rendering
  mirrorMode?: boolean; // reflect the visualizer horizontally to create a symmetrical/kaleidoscopic effect
  mirrorAxis?: 'horizontal' | 'vertical' | 'both'; // mirrors the waveform across the horizontal, vertical, or both axes
  symmetryColorInversion?: boolean; // alternates primary and secondary colors on mirrored segments for a high-contrast kaleidoscopic effect
  colorBurstOnBeat?: boolean; // cause the primary color to briefly flash or explode with brightness on every detected beat
  beatReactiveColorShift?: boolean; // cycle visualizer colors through a palette on each bass beat
  colorShiftIntensity?: number; // degree/speed of color shift on each beat (e.g., 5 to 60 degrees)
  symmetryMultiplier?: number; // horizontal reflection symmetry multiplier (values 1 to 8)
  mirrorOpacity?: number; // independent mirror transparency/opacity slider (0 to 100)
  colorInvertOnBeat?: boolean; // flip the primary/secondary spectrum colors on a beat-triggered basis for a strobe-like flashing effect
  cycleColors?: boolean; // slowly rotate the primary and secondary colors over time
  colorCycleInterval?: number; // interval in seconds for a full color cycle rotation
  glitchIntensity?: number; // intensity for horizontal scan-line displacement effect
  beatSensitivity?: number; // threshold sensitivity for beat detection (e.g. 1.0 to 10.0 or 0 to 1)
  reactiveTextGlow?: boolean; // link on-screen text glow to middle/high frequency audio data
  shakeIntensity?: number; // multiplier/slider for camera shake response
  speakerBassResponse?: number; // multiplier/slider for speaker woofer pulsing scale
  renderWatermark?: boolean; // render top/bottom branding watermark text "Made with Storyahe FX"
  showProgressBar?: boolean; // show dynamic track playback progress bar line at canvas bottom
  progressBarEdge?: 'bottom' | 'top' | 'left' | 'right'; // progress bar edge anchor location
  progressBarPadding?: number; // margin/padding distance from chosen edge
  progressBarThickness?: number; // line thickness/height of progress track
  progressBarScale?: number; // length scale factor of the path (0.1 to 1.0)
  progressBarStyle?: 'solid' | 'neon' | 'gradient'; // core coloring style model
  progressBarTrackColor?: string; // custom inactive track color picker
  progressBarFillColor?: string; // custom active solid track color picker
  progressBarGradientStart?: string; // custom start color for gradient model
  progressBarGradientEnd?: string; // custom end color for gradient model
  progressBarRoundCaps?: boolean; // toggle line end cap rounding
  watermarkUrl?: string | null; // uploaded logo watermark URL
  watermarkOpacity?: number; // logo watermark opacity value
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // logo watermark placement
  beatLock?: boolean; // force animations to cycle on set BPM
  beatLockBpm?: number; // BPM value for beat lock
  overlayVideoUrl?: string | null;
  overlayOpacity?: number; // 0 to 100 (default 100)
  overlayScale?: number; // 0 to 100 (default 50)
  overlayX?: number; // 0 to 100 (default 50)
  overlayY?: number; // 0 to 100 (default 50)
  overlayVolume?: number; // 0 to 100 (default 100)
  overlayMuted?: boolean; // default false
  overlayScaleMode?: 'fit' | 'cover'; // sizing Mode: fit or cover
  overlayBlendMode?: 'normal' | 'screen' | 'multiply' | 'color-dodge' | 'difference';
  overlayBeatPulse?: boolean;
  overlayPulseIntensity?: number;
  stickerFloatRotate?: boolean;
  stickerFloatSpeed?: number;
  stickerSize?: number; // independent sticker size 10 to 200 (default 40)
  stickerX?: number; // independent sticker position X (0 to 100)
  stickerY?: number; // independent sticker position Y (0 to 100)
  textAlign?: 'left' | 'center' | 'right';
  textOpacity?: number; // 0 to 100
  textBlendMode?: 'normal' | 'screen' | 'overlay' | 'multiply' | 'color-dodge';
  textBeatScale?: boolean;
  textBeatShake?: boolean;
  textRenderStyle?: 'standard' | 'neon' | 'shadow' | 'stroke' | 'retro'; // standard, neon, shadow, stroke, retro
  textShadowPreset?: 'none' | 'soft-glow' | 'hard-block' | 'neon' | 'outline';
  textGradient?: boolean;
  textGradientAngle?: 'vertical' | 'horizontal' | 'diagonal-down' | 'diagonal-up'; // text gradient direction
  textGradientStart?: string;
  textGradientEnd?: string;
  customTextInvertBlend?: boolean;
  customTextMarquee?: boolean;
  customTextScrollSpeed?: number;
  watermarkScale?: number; // scale/resize of watermark (10% to 200%, default 100%)
  watermarkX?: number; // manual X position (0 to 100)
  watermarkY?: number; // manual Y position (0 to 100)
  watermarkFontSize?: number;
  watermarkAlignment?: 'top-left' | 'bottom-center' | 'bottom-right' | 'manual';
  textWatermarkOpacity?: number;
  textWatermarkFontSize?: number;
  textWatermarkAlignment?: 'top-left' | 'bottom-center' | 'bottom-right' | 'manual';
  textWatermarkX?: number;
  textWatermarkY?: number;
  logoWatermarkOpacity?: number;
  logoWatermarkScale?: number;
  logoWatermarkAlignment?: 'top-left' | 'bottom-center' | 'bottom-right' | 'manual';
  logoWatermarkX?: number;
  logoWatermarkY?: number;
  fadeInDuration?: number; // fade in duration in seconds (0 to 10, default 0)
  fadeOutDuration?: number; // fade out duration in seconds (0 to 10, default 0)
  enableFireworks?: boolean;
  fireworksAltitude?: number;
  fireworksRadius?: number;
  fireworksSparkSize?: number;
  fireworksColorMode?: 'dynamic-rainbow' | 'match-glow' | 'solid-white';
  enableShockwaveDrop?: boolean;
  stylePositions?: { [styleId: string]: { xOffset: number; yOffset: number; verticalScale?: number; horizontalScale?: number; masterScale?: number; horizontalSpan?: number; springTension?: number; springDampening?: number } };
  styleSettings?: { [styleId: string]: { xOffset: number; yOffset: number; scale?: number; masterScale?: number; horizontalSpan?: number; springTension?: number; springDampening?: number } };
  barFrequencyCount?: number;
  glowIntensity?: number;
  glitchFrequency?: number;
  visualizerContrast?: number; // global visualizer contrast slider (0.1 to 2.0, default 1.0)
  kaleidoscope?: boolean;
  kaleidoscopeSegments?: number;
  chromaticAberration?: boolean;
  earthquakeCameraShake?: boolean;
  phosphorTrails?: number;
  clippingThreshold?: number;
  bassMapping?: 'none' | 'lineThickness' | 'glowStrength' | 'sensitivity' | 'horizontalScale' | 'verticalScale' | 'centerScale';
  midMapping?: 'none' | 'lineThickness' | 'glowStrength' | 'sensitivity' | 'horizontalScale' | 'verticalScale' | 'centerScale';
  trebleMapping?: 'none' | 'lineThickness' | 'glowStrength' | 'sensitivity' | 'horizontalScale' | 'verticalScale' | 'centerScale';
  oscillationMultiplier?: number;
  waterReflection?: boolean;
  waterRefractionScale?: number;
  waterBeatIntensityMod?: number;
  waterReflectionTint?: string;
  waterReflectionOpacity?: number;
  waterReflectionBlur?: number;
  waterRippleTexture?: boolean;
  waterDistortion?: boolean;
  waterRippleIntensity?: number;
  waterRippleSpeed?: number;
  waterReflectionDepth?: number;
  waterColorShift?: boolean;
  waterSyncToWaveform?: boolean;
  frequencyBasedColoring?: boolean;
  zoomPulse?: boolean;
  zoomPulseIntensity?: number;
  glowBloom?: boolean;
  glowBloomIntensity?: number;
  trebleSparkles?: boolean;
  trebleSparklesCount?: number;
  highResolutionPreview?: boolean;
  timeDomainMode?: boolean;
  crtScanlines?: boolean;
  strobeEffect?: boolean;
  strobeIntensity?: number;
  beatRhythmMultiplier?: number;
  motionBlurIntensity?: number;
  waveformRipple?: boolean;
}

export interface ParticleSettings {
  enabled?: boolean;
  type: ParticleType;
  count: number;
  minSize: number;
  maxSize: number;
  speed: number;
  color: string;
  gravity: number; // speed pulling down
  wind: number; // speed drift horizontally
  beatReactive: boolean; // do they burst/react on beat?
  audioReactiveGravity?: boolean; // gravity scales with audio loudness
  audioGravityMultiplier?: number; // strength of audio-reactive gravity
  isAngularBurstActive?: boolean; // jagged angular pattern on beat burst
  beatThreshold: number; // frequency index or amplitude required
  enablePhysics?: boolean; // simple canvas-based particle collisions (bouncing off each other)
  enableParticleCollisions?: boolean; // particle-to-particle collision detection based on radius
  particleLifeBehavior?: 'none' | 'bounce' | 'merge' | 'dissolve';
  collisionDamping?: number; // coefficient of restitution damping (0.1 to 1.0)
  emittingDirection?: 'float-up' | 'fall-down' | 'center-explosion' | 'spiral-vortex' | 'orbital-spiral';
  enableApexAttractor?: boolean;
  movementSpeed?: number;
  beatBurst?: boolean;
  trailLength?: number;
  lifetime?: number;
  sensitivityFloor?: number;
  audioDriveTarget?: 'sub-bass' | 'kicks' | 'vocal' | 'high-end';
  useColorPalette?: boolean;
  particleColorPalette?: string[];
  selectedPalettePreset?: string;
  colorInvertOnBeat?: boolean;
  colorBurstOnBeat?: boolean;
  beatReactiveColorShift?: boolean;
  cycleColors?: boolean;
  particleColorRandomness?: number;
  particleTwinkle?: boolean;
  orbitalSway?: boolean;
  particleGlitch?: boolean;
  straightMotionOverride?: boolean;
  chaoticWindDrift?: boolean;
  spectralRainbow?: boolean;
  alphaDissolve?: number;
  shatterEnabled?: boolean;
  shatterRadius?: number;
  shatterSpeed?: number;
}

export interface TitleOverlaySettings {
  visible: boolean;
  text: string;
  artist: string;
  fontSize: number;
  color: string;
  fontFamily: 'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Outfit' | 'Playfair Display' | string;
  position: 'center' | 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' | 'custom';
  fadeIn: boolean;
  animationStyle?: 'static' | 'pulse' | 'glow-bounce' | 'float' | 'shake';
  offsetX?: number;
  offsetY?: number;
  textStyle?: 'normal' | 'neon' | 'shadow' | 'stroke' | 'retro' | 'glass';
  colorBlend?: boolean;
  colorBlendEnd?: string;
  colorBlendMode?: 'normal' | 'screen' | 'overlay' | 'multiply' | 'color-dodge' | 'difference';
}

export interface BackgroundSettings {
  type: 'color' | 'image' | 'video' | 'gradient';
  color: string;
  gradientStart: string;
  gradientEnd: string;
  imageUrl: string | null;
  videoUrl: string | null;
  blur: number; // in pixels
  opacity: number; // background dimming / darkness
  scale?: number; // scale / zoom multiplier of the background artwork
  enableBeatReaction?: boolean;
  beatReactionType?: 'bass' | 'beat';
  vignette?: number; // 0 to 100 for cinematic vignette darken overlay
  vignettePulse?: boolean;
  vignettePulseIntensity?: number;
  parallaxSway?: number;
}

export interface OverlayImage {
  id: string;
  url: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  opacity?: number;
  aspectRatio: number;
  enableBeatReaction?: boolean;
  beatReactionType?: 'bass' | 'beat';
  beatReactionIntensity?: number;
}

export interface AudioTrack {
  name: string;
  artist: string;
  duration: number; // in seconds
  file: File | null;
  objectUrl: string | null;
  coverUrl: string | null;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FireworkRocket {
  x: number;
  y: number;
  vx?: number;
  startX: number;
  startY: number;
  targetY: number;
  speed: number;
  color: string;
  size: number;
  alpha: number;
}

export type SubtitleEffect =
  | 'static' | 'fade' | 'typewriter' | 'pop' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out'
  | 'glow' | 'blur-in' | 'flip-x' | 'flip-y' | 'bounce' | 'shake' | 'glitch' | 'wave' | 'color-shift' | 'rotate-in'
  | '3d-flip' | 'neon-pulse' | 'pixelate' | 'shatter' | 'liquid' | 'fire'
  | 'highlight-fill' | 'highlight-bounce' | 'highlight-word-pop' | 'highlight-karaoke' | 'highlight-glow-sweep';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface SubtitleSettings {
  enabled: boolean;
  lyrics: LyricLine[];
  lrcString: string; // The raw LRC text for user editing
  fontSize: number;
  color: string;
  glowColor: string;
  glowIntensity: number;
  fontFamily: 'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Outfit' | 'Playfair Display';
  effect: SubtitleEffect;
  yOffset: number; // 0 to 100 for vertical placement
  backgroundOpacity: number;
  shadowOffset: number;
  transition: 'none' | 'slide-in-from-left' | 'slide-in-from-right' | 'blur-reveal' | 'scale-pop';
  outlineEnabled: boolean;
  outlineColor: string;
  outlineThickness: number;
  align: 'left' | 'center' | 'right';
  karaokeFillColor: string;
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'gif';
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '2160p' | '1080p' | '720p';
  fps: 30 | 60;
}
