import {
  VisualizerSettings,
  ParticleSettings,
  TitleOverlaySettings,
  BackgroundSettings,
} from '../types';

let activeSettings: VisualizerSettings | null = null;
let activeYPercent: number = 50;
let hueRotation: number = 0;
let lastTimeColorCycle: number = Date.now();

// State for scrolling Frequency Spectrogram heatmap history
let spectrogramHistory: Uint8Array[] = [];
const MAX_SPECTROGRAM_HISTORY = 60;

// State for scrolling Floating Wave Echo ghost trail frames
let floatingWaveHistory: { path: { x: number; y: number }[]; opacity: number; yShift: number }[] = [];

// Cached offscreen canvas for Mirror Mode horizontal reflection to prevent frame-by-frame allocation overhead
let mirrorOffscreenCanvas: HTMLCanvasElement | null = null;
let mirrorOffscreenCtx: CanvasRenderingContext2D | null = null;
let mirrorOffscreenCanvasY: HTMLCanvasElement | null = null;
let mirrorOffscreenCtxY: CanvasRenderingContext2D | null = null;

// Cached offscreen canvases for symmetry color inversion to prevent frame-by-frame allocation overhead
let mirrorInvertedOffscreenCanvas: HTMLCanvasElement | null = null;
let mirrorInvertedOffscreenCtx: CanvasRenderingContext2D | null = null;
let mirrorInvertedOffscreenCanvasY: HTMLCanvasElement | null = null;
let mirrorInvertedOffscreenCtxY: CanvasRenderingContext2D | null = null;

// Dedicated offscreen canvas for isolating visualizer drawing from main canvas background/videos/text
let visualizerWavesCanvas: HTMLCanvasElement | null = null;

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  strength: number;
  color: string;
}
export const activeShockwaves: Shockwave[] = [];
let lastShockwaveTime = 0;

interface BouncingCircleState {
  currentY: number;
  velocity: number;
  currentOpacity: number;
}
const bouncingCirclesCache: { [key: number]: BouncingCircleState } = {};

interface PhysicsState {
  current: Float32Array;
  velocity: Float32Array;
}
const stylePhysicsCache: { [styleId: string]: PhysicsState } = {};

export interface RenderParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  angle: number;
  spin: number;
  history?: { x: number; y: number }[];
  baseVx?: number;
  baseVy?: number;
  baseSize?: number;
  hue?: number;
  burstFlash?: number;
  radius?: number;
  velocityOffset?: number;
  speed?: number;
}

// Color conversion helpers
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r = l;
  let g = l;
  let b = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1 / 3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function shiftHexColorHue(hex: string, degreeOffset: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Convert RGB to HSL
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = (h * 360 + degreeOffset) % 360;
  if (h < 0) h += 360;

  return hslToHex(h, s * 100, l * 100);
}

export function swapPrimarySecondaryPixels(
  data: Uint8ClampedArray,
  len: number,
  primaryColorHex: string,
  secondaryColorHex: string
) {
  const rgbP = hexToRgb(primaryColorHex) || { r: 255, g: 0, b: 0 };
  const rgbS = hexToRgb(secondaryColorHex) || { r: 0, g: 0, b: 255 };

  const pR = rgbP.r, pG = rgbP.g, pB = rgbP.b;
  const sR = rgbS.r, sG = rgbS.g, sB = rgbS.b;
  
  const denP = pR * pR + pG * pG + pB * pB || 1;
  const denS = sR * sR + sG * sG + sB * sB || 1;

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Dot product scalar projections
    const factorP = (r * pR + g * pG + b * pB) / denP;
    const factorS = (r * sR + g * sG + b * sB) / denS;

    // Projection vectors
    const projR = factorP * pR + factorS * sR;
    const projG = factorP * pG + factorS * sG;
    const projB = factorP * pB + factorS * sB;

    // Residual (unrelated color component)
    const resR = r - projR;
    const resG = g - projG;
    const resB = b - projB;

    // Swapped projections + residual
    let newR = factorP * sR + factorS * pR + resR;
    let newG = factorP * sG + factorS * pG + resG;
    let newB = factorP * sB + factorS * pB + resB;

    // Clamp
    if (newR < 0) newR = 0; else if (newR > 255) newR = 255;
    if (newG < 0) newG = 0; else if (newG > 255) newG = 255;
    if (newB < 0) newB = 0; else if (newB > 255) newB = 255;

    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
}

// Initialize particles pool
export function initParticles(settings: ParticleSettings, width: number, height: number): RenderParticle[] {
  const particles: RenderParticle[] = [];
  const count = settings.count;
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(settings, width, height, true));
  }
  return particles;
}

// Create a single particle
export function createParticle(
  settings: ParticleSettings,
  width: number,
  height: number,
  randomY = false
): RenderParticle {
  const size = settings.minSize + Math.random() * (settings.maxSize - settings.minSize);
  const dir = settings.emittingDirection || 'float-up';
  
  // Starting positions based on gravity and direction
  let x = Math.random() * width;
  let y = 0;
  let radiusVal = 0;
  const angle = (Math.random() * Math.PI * 2);
  const centerX = width / 2;
  const centerY = height / 2;
  
  if (dir === 'spiral-vortex') {
    radiusVal = randomY ? Math.random() * (Math.min(width, height) * 0.45) : 0;
    x = centerX + Math.cos(angle) * radiusVal;
    y = centerY + Math.sin(angle) * radiusVal;
  } else if (randomY) {
    y = Math.random() * height;
  } else {
    if (dir === 'fall-down') {
      y = -10;
    } else if (dir === 'center-explosion') {
      x = width / 2;
      y = height / 2;
    } else { // float-up
      y = height + 10;
    }
  }

  // Velocity
  const baseSpeed = settings.speed;
  let vx = Math.cos(angle) * (baseSpeed * 0.5) + settings.wind;
  let vy = Math.sin(angle) * (baseSpeed * 0.5) + settings.gravity;

  // Let direction steer velocity
  if (dir === 'fall-down') {
    vy = Math.abs(vy) || (baseSpeed * 0.5);
  } else if (dir === 'float-up') {
    vy = -Math.abs(vy) || (-baseSpeed * 0.5);
  } else if (dir === 'center-explosion') {
    const explosionSpeed = (0.3 + Math.random() * 0.8) * baseSpeed;
    vx = Math.cos(angle) * explosionSpeed + settings.wind;
    vy = Math.sin(angle) * explosionSpeed + settings.gravity;
  } else if (dir === 'spiral-vortex') {
    vx = 0;
    vy = 0;
  }

  // Preserve legacy types' special speeds if direction is default/implicit
  if (!settings.emittingDirection) {
    if (settings.type === 'sparks') {
      vy = -baseSpeed * (0.5 + Math.random() * 1.5) + settings.gravity;
      vx = (Math.random() - 0.5) * baseSpeed * 2 + settings.wind;
    } else if (settings.type === 'bubbles') {
      vy = -baseSpeed * (0.2 + Math.random() * 0.8) + settings.gravity;
      vx = Math.sin(Math.random() * Math.PI) * 0.5 + settings.wind;
    }
  }

  // Lifespan
  const maxLife = settings.lifetime
    ? Math.round(settings.lifetime * 60)
    : (50 + Math.random() * 100);

  return {
    x,
    y,
    vx,
    vy,
    size,
    color: settings.color,
    alpha: 0.1 + Math.random() * 0.8,
    life: maxLife,
    maxLife,
    angle: dir === 'spiral-vortex' ? angle : Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.05,
    history: [],
    baseVx: vx,
    baseVy: vy,
    baseSize: size,
    hue: Math.random() * 360,
    burstFlash: 0,
    radius: radiusVal,
    velocityOffset: (0.4 + Math.random() * 0.8) * Math.max(0.5, baseSpeed),
    speed: baseSpeed
  };
}

// Update particle motions and react to beat
export function updateParticles(
  particles: RenderParticle[],
  settings: ParticleSettings,
  width: number,
  height: number,
  isBeat: boolean,
  bassIntensity: number,
  overallVolume: number = 1.0,
  analyserData?: Uint8Array,
  enableShockwaveDrop?: boolean
): RenderParticle[] {
  const result: RenderParticle[] = [];

  const beatReactivePulseEnabled = !!settings.beatReactive;
  const audioReactiveParticleBurstEnabled = !!settings.beatBurst;
  const particlePhysicsCollisionEnabled = !!settings.enablePhysics;

  const floor = settings.sensitivityFloor !== undefined ? settings.sensitivityFloor : 0.0;
  const dynamicVolume = floor + (1.0 - floor) * overallVolume;

  // Update active independent shockwaves
  for (let i = activeShockwaves.length - 1; i >= 0; i--) {
    const sw = activeShockwaves[i];
    sw.radius += sw.speed;
    if (sw.radius > sw.maxRadius) {
      activeShockwaves.splice(i, 1);
    }
  }

  // Trigger shockwave with threshold > 245 inside analyserData-cooldown of 1200ms
  if (enableShockwaveDrop && analyserData) {
    let peakValue = 0;
    for (let idx = 0; idx < analyserData.length; idx++) {
      if (analyserData[idx] > peakValue) {
        peakValue = analyserData[idx];
      }
    }
    if (peakValue > 245) {
      const now = Date.now();
      if (now - lastShockwaveTime > 1200) {
        lastShockwaveTime = now;
        activeShockwaves.push({
          x: width / 2,
          y: height / 2,
          radius: 10,
          maxRadius: Math.sqrt(width * width + height * height) * 0.55,
          speed: 10,
          strength: 40,
          color: settings.color || '#00ffff'
        });
      }
    }
  }

  for (let p of particles) {
    // Decrement life proportionally to the movement speed multiplier so particles travel the full distance before fading out
    p.life -= Math.max(0.005, dynamicVolume);

    // Update dynamic colors and bursts
    if (settings.colorBurstOnBeat) {
      if (isBeat) {
        p.burstFlash = 1.0;
      } else {
        p.burstFlash = (p.burstFlash || 0) * 0.92;
        if (p.burstFlash < 0.01) p.burstFlash = 0;
      }
    } else {
      p.burstFlash = 0;
    }

    let hueDelta = 0;
    if (settings.cycleColors) {
      hueDelta += 0.5;
    }
    if (settings.beatReactiveColorShift && isBeat) {
      hueDelta += 24;
    }
    if (hueDelta > 0) {
      p.hue = ((p.hue || 0) + hueDelta) % 360;
    }

    // Resolve baseline properties
    const baseVx = p.baseVx !== undefined ? p.baseVx : p.vx;
    const baseVy = p.baseVy !== undefined ? p.baseVy : p.vy;
    const baseSize = p.baseSize !== undefined ? p.baseSize : p.size;

    // SECTION 2: RE-AMPLIFYING THE TOGGLE INTERACTION EFFECTS
    // 1. Beat-Reactive Pulse: When beatReactivePulse is true AND a kick/bass beat is actively detected,
    // apply a pronounced, immediate velocity burst and radius expansion factor to the particles.
    // The pulse must feel sharp and instantaneous, decaying smoothly back down using linear interpolation (lerp).
    // 3. Toggle Off Behavior: If either toggle is turned off, ensure the particle behavior instantly falls back to a clean, smooth, un-reactive state.
    if (beatReactivePulseEnabled) {
      if (isBeat) {
        // Immediate, sharp velocity burst and expansion
        const intensityScale = Math.max(0.5, bassIntensity); // make it pronounced
        p.vx = baseVx * (1.6 + intensityScale * 1.8);
        p.vy = baseVy * (1.6 + intensityScale * 1.8);
        p.size = Math.min(settings.maxSize * 2.8, baseSize * (1.4 + intensityScale * 0.4));
      } else {
        // Smoothly decay back to standard baseline using linear interpolation (lerp) with 0.08 dampening factor
        p.vx = p.vx + (baseVx - p.vx) * 0.08;
        p.vy = p.vy + (baseVy - p.vy) * 0.08;
        p.size = p.size + (baseSize - p.size) * 0.08;
      }
    } else {
      // Toggle off: instantly fall back to a clean, smooth, un-reactive state
      p.vx = baseVx;
      p.vy = baseVy;
      p.size = baseSize;
    }

    // Apply winds & gravity
    p.vx += settings.wind * 0.01;
    p.vy += settings.gravity * 0.01;

    // Decoloration or drift friction depending on particle type
    if (settings.type === 'sakura') {
      // Wind-swept sway
      p.vx += Math.sin(p.life * 0.05) * 0.05;
    } else if (settings.type === 'bubbles' || settings.type === 'floating-bubbles') {
      // Bobbing wobble
      p.vx += Math.sin(p.life * 0.1) * 0.08;
    }

    // Record history before position changes
    if (!p.history) {
      p.history = [];
    }
    const trailLen = settings.trailLength !== undefined ? settings.trailLength : 0;
    if (trailLen > 0) {
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > trailLen) {
        p.history.shift();
      }
    } else if (p.history.length > 0) {
      p.history = [];
    }

    const speedFactor = settings.movementSpeed !== undefined ? settings.movementSpeed : 1.0;
    // Map non-linearly for pristine slow-drift base scaling
    const scaleMultiplier = speedFactor < 1.0
      ? Math.pow(speedFactor, 1.8) // smooth curved drop towards 0 for graceful cinematic floats
      : speedFactor;

    // SECTION 2: RE-AMPLIFYING THE TOGGLE INTERACTION EFFECTS
    // 2. Audio-Reactive Particle Burst: When audioReactiveParticleBurst is true, look directly at the real-time sub-bass frequency thresholds.
    // Scale the particle burst count or instantaneous velocity vector dramatically during high-energy transients so that intense parts of the music feel completely distinct from quiet parts.
    // 3. Toggle Off Behavior: If either toggle is turned off, ensure the particle behavior instantly falls back to a clean, smooth, un-reactive state.
    let burstSpeedMult = 1.0;
    if (audioReactiveParticleBurstEnabled) {
      // Look directly at real-time sub-bass frequency threshold (bassIntensity represents this).
      // Scale velocity vector dramatically during high-energy transients
      if (bassIntensity > 0.4) {
        burstSpeedMult = 1.0 + Math.pow(bassIntensity, 2.8) * 8.0;
      } else {
        burstSpeedMult = 1.0 + bassIntensity * 1.0;
      }
    }

    // Apply Shockwave Drop outward push if active
    if (activeShockwaves.length > 0) {
      for (const sw of activeShockwaves) {
        const dx = p.x - sw.x;
        const dy = p.y - sw.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const shellWidth = 40;
        if (Math.abs(dist - sw.radius) < shellWidth && dist > 0.1) {
          const pushAngle = Math.atan2(dy, dx);
          const pushAmt = sw.strength * (1.0 - Math.abs(dist - sw.radius) / shellWidth);
          p.vx += Math.cos(pushAngle) * pushAmt * 0.15;
          p.vy += Math.sin(pushAngle) * pushAmt * 0.15;
        }
      }
    }

    // Apply Waveform Apex Attractor dynamic pull
    if (settings.enableApexAttractor && analyserData && analyserData.length > 0 && bassIntensity > 0.4) {
      const sampleCount = 32;
      let nearestX = p.x;
      let nearestY = p.y;
      let minDist = Infinity;
      for (let s = 0; s < sampleCount; s++) {
        const idx = Math.floor((s / sampleCount) * analyserData.length);
        const amp = (analyserData[idx] - 128) / 128; // -1 to 1
        const nodeX = (s / (sampleCount - 1)) * width;
        const nodeY = (height / 2) + amp * (height * 0.35);

        const dx = nodeX - p.x;
        const dy = nodeY - p.y;
        const distance = dx * dx + dy * dy;
        if (distance < minDist) {
          minDist = distance;
          nearestX = nodeX;
          nearestY = nodeY;
        }
      }
      const attractForce = 0.08 * bassIntensity;
      p.vx += (nearestX - p.x) * attractForce - p.vx * 0.1;
      p.vy += (nearestY - p.y) * attractForce - p.vy * 0.1;
    }

    // SECTION 1: ENVELOPE-BASED VELOCITY SCALING (THE FADE-OUT FIX)
    // The base movement speed of the particles must be directly multiplied by this live dynamicVolume coefficient.
    // This guarantees that if the music slows down, softens, or fades to silence, the particles automatically lose momentum and come to an absolute, complete stop.
    // (Or gracefully slide at the Sensitivity Floor baseline if configured).
    const dynamicBaseSpeedMultiplier = scaleMultiplier * dynamicVolume;

    if (settings.emittingDirection === 'spiral-vortex') {
      const angleStep = (p.speed || settings.speed || 1) * 0.02 * dynamicBaseSpeedMultiplier * burstSpeedMult;
      p.angle += angleStep;
      const radStep = (p.velocityOffset || 1) * dynamicBaseSpeedMultiplier * burstSpeedMult;
      p.radius = (p.radius ?? 0) + radStep;
      p.x = width / 2 + Math.cos(p.angle) * p.radius;
      p.y = height / 2 + Math.sin(p.angle) * p.radius;
    } else {
      p.x += p.vx * dynamicBaseSpeedMultiplier * burstSpeedMult;
      p.y += p.vy * dynamicBaseSpeedMultiplier * burstSpeedMult;
    }
    p.angle += p.spin;

    // Apply physics boundary bounces (bouncing off walls)
    if (particlePhysicsCollisionEnabled) {
      const bMultiplier = 0.85; // coefficient of restitution with walls
      if (p.x - p.size < 0) {
        p.x = p.size;
        p.vx = -p.vx * bMultiplier;
      } else if (p.x + p.size > width) {
        p.x = width - p.size;
        p.vx = -p.vx * bMultiplier;
      }

      if (p.y - p.size < 0) {
        p.y = p.size;
        p.vy = -p.vy * bMultiplier;
      } else if (p.y + p.size > height) {
        p.y = height - p.size;
        p.vy = -p.vy * bMultiplier;
      }
    }

    // Fade out as life ends
    p.alpha = Math.max(0, (p.life / p.maxLife) * 0.8);

    // Filter out dead or off-screen particles, spawn replacements
    const isOffScreen =
      p.x < -100 || p.x > width + 100 || p.y < -100 || p.y > height + 100;

    if (p.life > 0 && !isOffScreen) {
      result.push(p);
    } else {
      result.push(createParticle(settings, width, height, false));
    }
  }

  // Adjust count if settings changed
  while (result.length < settings.count) {
    result.push(createParticle(settings, width, height, true));
  }
  if (result.length > settings.count) {
    result.length = settings.count;
  }

  // If particle physics is enabled, resolve particle-to-particle collisions
  if (particlePhysicsCollisionEnabled && result.length > 1) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const p1 = result[i];
        const p2 = result[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.size + p2.size;

        if (dist < minDist && dist > 0.05) {
          // Resolve overlap (nudge)
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const m1 = p1.size || 1;
          const m2 = p2.size || 1;
          const totalMass = m1 + m2;

          p1.x -= nx * overlap * (m2 / totalMass);
          p1.y -= ny * overlap * (m2 / totalMass);
          p2.x += nx * overlap * (m1 / totalMass);
          p2.y += ny * overlap * (m1 / totalMass);

          // Calculate elastic velocities
          const rvx = p2.vx - p1.vx;
          const rvy = p2.vy - p1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          // Only bounce if they are moving towards each other
          if (velAlongNormal < 0) {
            const restitution = 0.9; // highly elastic bouncy collisions
            const impulse = -(1 + restitution) * velAlongNormal / (1 / m1 + 1 / m2);

            p1.vx -= nx * (impulse / m1);
            p1.vy -= ny * (impulse / m1);
            p2.vx += nx * (impulse / m2);
            p2.vy += ny * (impulse / m2);
          }
        }
      }
    }

    // Keep particles inside viewport borders after resolving collisions too
    for (let p of result) {
      if (p.x - p.size < 0) { p.x = p.size; p.vx = -p.vx * 0.85; }
      else if (p.x + p.size > width) { p.x = width - p.size; p.vx = -p.vx * 0.85; }
      
      if (p.y - p.size < 0) { p.y = p.size; p.vy = -p.vy * 0.85; }
      else if (p.y + p.size > height) { p.y = height - p.size; p.vy = -p.vy * 0.85; }
    }
  }

  return result;
}

// DRAW BACKGROUND
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BackgroundSettings,
  bgImgElement: HTMLImageElement | null,
  bgVidElement: HTMLVideoElement | null,
  beatIntensity?: number,
  enableBeatPulse?: boolean
) {
  ctx.save();

  if (enableBeatPulse && beatIntensity && beatIntensity > 0) {
    const scaleMultiplier = 1.0 + 0.03 * beatIntensity;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scaleMultiplier, scaleMultiplier);
    ctx.translate(-width / 2, -height / 2);
  }
  
  if (settings.type === 'color') {
    ctx.fillStyle = settings.color;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.type === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, settings.gradientStart);
    gradient.addColorStop(1, settings.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.type === 'image' && bgImgElement && bgImgElement.complete) {
    // Center cover fit
    const imgRatio = bgImgElement.width / bgImgElement.height;
    const canvasRatio = width / height;
    let dWidth = width;
    let dHeight = height;
    let dx = 0;
    let dy = 0;

    if (imgRatio > canvasRatio) {
      dWidth = height * imgRatio;
      dx = (width - dWidth) / 2;
    } else {
      dHeight = width / imgRatio;
      dy = (height - dHeight) / 2;
    }

    if (settings.blur > 0) {
      ctx.filter = `blur(${settings.blur}px)`;
    }
    
    ctx.drawImage(bgImgElement, dx, dy, dWidth, dHeight);
    
    // Dim Overlay
    ctx.filter = 'none';
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - settings.opacity})`;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.type === 'video' && bgVidElement) {
    if (bgVidElement.paused) {
      bgVidElement.play().catch(() => {});
    }
    // Video covering
    const vidRatio = bgVidElement.videoWidth / bgVidElement.videoHeight;
    const canvasRatio = width / height;
    let dWidth = width;
    let dHeight = height;
    let dx = 0;
    let dy = 0;

    if (vidRatio > canvasRatio) {
      dWidth = height * vidRatio;
      dx = (width - dWidth) / 2;
    } else {
      dHeight = width / vidRatio;
      dy = (height - dHeight) / 2;
    }

    if (settings.blur > 0) {
      ctx.filter = `blur(${settings.blur}px)`;
    }

    ctx.drawImage(bgVidElement, dx, dy, dWidth, dHeight);

    // Dim Overlay
    ctx.filter = 'none';
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - settings.opacity})`;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Fallback beautiful soft dark gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#020205');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

// DRAW PARTICLES COLOR HELPERS
function lerpColor(c1: string, c2: string, ratio: number): string {
  try {
    const hex1 = c1.replace('#', '');
    const r1 = parseInt(hex1.substring(0, 2), 16) || 0;
    const g1 = parseInt(hex1.substring(2, 4), 16) || 0;
    const b1 = parseInt(hex1.substring(4, 6), 16) || 0;

    const hex2 = c2.replace('#', '');
    const r2 = parseInt(hex2.substring(0, 2), 16) || 0;
    const g2 = parseInt(hex2.substring(2, 4), 16) || 0;
    const b2 = parseInt(hex2.substring(4, 6), 16) || 0;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    const rs = r.toString(16).padStart(2, '0');
    const gs = g.toString(16).padStart(2, '0');
    const bs = b.toString(16).padStart(2, '0');

    return `#${rs}${gs}${bs}`;
  } catch (e) {
    return c1;
  }
}

// DRAW PARTICLES
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: RenderParticle[],
  settings: ParticleSettings,
  isBeat: boolean,
  beatIntensity: number,
  globalVisuals?: any
) {
  ctx.save();

  const canvasW = ctx.canvas?.width || 800;

  for (const p of particles) {
    // SECTION 2: LINKING PARTICLE FIELD TO GLOBAL COLOR MODES
    let baseColor = p.color || settings.color || '#ff007f';

    if (globalVisuals) {
      const mode = globalVisuals.colorMode || 'solid';
      if (mode === 'rainbow') {
        baseColor = `hsl(${p.hue || 0}, 100%, 60%)`;
      } else if (mode === 'gradient') {
        let colorA = globalVisuals.primaryColor || '#ff007f';
        let colorB = globalVisuals.secondaryColor || '#00ffff';
        
        // Strobe effect: instantly swap colorA and colorB on each beat
        if (settings.colorInvertOnBeat && isBeat) {
          const temp = colorA;
          colorA = colorB;
          colorB = temp;
        }
        
        const xRatio = Math.max(0, Math.min(1, p.x / canvasW));
        baseColor = lerpColor(colorA, colorB, xRatio);
      } else {
        // solid color mode
        baseColor = settings.color || '#ff007f';
      }
    }

    // Overriding if Cycle Particle Colors or Beat-Reactive Particle Color Shift is enabled
    if (settings.cycleColors || settings.beatReactiveColorShift) {
      baseColor = `hsl(${p.hue || 0}, 100%, 60%)`;
    }

    // SECTION 3: PROCESSING COMBINED INTERACTIVE EFFECT STATES (Color Burst on Beat)
    let finalColor = baseColor;
    let finalAlpha = p.alpha;
    
    // Dynamic luminescence glow for Color Burst On Beat
    let glowOnBurst = false;
    if (settings.colorBurstOnBeat && p.burstFlash && p.burstFlash > 0) {
      if (baseColor.startsWith('#')) {
        finalColor = lerpColor(baseColor, '#ffffff', p.burstFlash);
      } else {
        // HSL or other color format
        if (p.burstFlash > 0.8) {
          finalColor = '#ffffff';
        }
      }
      finalAlpha = Math.max(p.alpha, p.burstFlash);
      glowOnBurst = true;
    }

    const trailLenValue = settings.trailLength !== undefined ? settings.trailLength : 0;
    if (trailLenValue > 0 && p.history && p.history.length > 0 && 
        (settings.type === 'stars' || settings.type === 'sparks' || settings.type === 'spark-stars')) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = [...p.history, { x: p.x, y: p.y }];
      for (let i = 0; i < pts.length - 1; i++) {
        const pStart = pts[i];
        const pEnd = pts[i + 1];
        
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        
        const ratio = (i + 1) / pts.length;
        ctx.globalAlpha = finalAlpha * ratio;
        ctx.strokeStyle = finalColor;
        ctx.lineWidth = p.size * ratio * 0.9;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.globalAlpha = finalAlpha;
    
    // Setup shadow blur if bursting
    if (glowOnBurst && p.burstFlash) {
      ctx.shadowBlur = p.burstFlash * 25;
      ctx.shadowColor = '#ffffff';
    } else {
      ctx.shadowBlur = 0;
    }
    
    // Base style representation
    if (settings.type === 'stars') {
      ctx.fillStyle = finalColor;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (settings.type === 'bubbles') {
      ctx.strokeStyle = finalColor;
      ctx.lineWidth = p.size * 0.15;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (settings.type === 'sparks') {
      ctx.fillStyle = finalColor;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 2);
    } else if (settings.type === 'sakura') {
      ctx.fillStyle = finalColor;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-p.size, -p.size, -p.size * 2, p.size / 2, 0, p.size * 1.5);
      ctx.bezierCurveTo(p.size * 2, p.size / 2, p.size, -p.size, 0, 0);
      ctx.fill();
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else if (settings.type === 'dust') {
      ctx.fillStyle = finalColor;
      if (!glowOnBurst) {
        ctx.shadowBlur = isBeat ? 15 : 5;
        ctx.shadowColor = finalColor;
      }
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (settings.type === 'digital') {
      ctx.fillStyle = finalColor;
      ctx.font = `${p.size * 1.5}px monospace`;
      const char = String.fromCharCode(48 + Math.floor(Math.random() * 2)); // 0 or 1
      ctx.fillText(char, p.x, p.y);
    } else if (settings.type === 'hearts') {
      ctx.save();
      ctx.fillStyle = finalColor;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      const hSize = p.size * 1.2;
      ctx.moveTo(0, hSize / 4);
      ctx.bezierCurveTo(-hSize, -hSize * 0.7, -hSize * 1.5, hSize * 0.2, 0, hSize * 1.3);
      ctx.bezierCurveTo(hSize * 1.5, hSize * 0.2, hSize, -hSize * 0.7, 0, hSize / 4);
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'glow-circles') {
      ctx.save();
      ctx.beginPath();
      if (!glowOnBurst) {
        ctx.shadowBlur = (isBeat ? (p.size * 3) : (p.size * 1.5));
        ctx.shadowColor = finalColor;
      }
      ctx.fillStyle = finalColor;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'spark-stars') {
      ctx.save();
      ctx.fillStyle = finalColor;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      const spikes = 5;
      const outerRadius = p.size * 1.6;
      const innerRadius = p.size * 0.7;
      let rot = (Math.PI / 2) * 3;
      let cx = 0, cy = 0;
      let sx = cx, sy = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        sx = cx + Math.cos(rot) * outerRadius;
        sy = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(sx, sy);
        rot += step;

        sx = cx + Math.cos(rot) * innerRadius;
        sy = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(sx, sy);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      if (!glowOnBurst) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = finalColor;
      }
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'snowflakes') {
      ctx.save();
      ctx.strokeStyle = finalColor;
      ctx.lineWidth = Math.max(1, p.size * 0.2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, p.size * 1.3);
        ctx.moveTo(0, p.size * 0.5);
        ctx.lineTo(-p.size * 0.35, p.size * 0.85);
        ctx.moveTo(0, p.size * 0.5);
        ctx.lineTo(p.size * 0.35, p.size * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    } else if (settings.type === 'glowing-stars') {
      ctx.save();
      ctx.fillStyle = finalColor;
      if (!glowOnBurst) {
        ctx.shadowBlur = isBeat ? 25 : 12;
        ctx.shadowColor = finalColor;
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 2.0);
      ctx.quadraticCurveTo(0, 0, p.size * 2.0, 0);
      ctx.quadraticCurveTo(0, 0, 0, p.size * 2.0);
      ctx.quadraticCurveTo(0, 0, -p.size * 2.0, 0);
      ctx.quadraticCurveTo(0, 0, 0, -p.size * 2.0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'cyber-triangles') {
      ctx.save();
      ctx.strokeStyle = finalColor;
      ctx.lineWidth = Math.max(1, p.size * 0.15);
      if (!glowOnBurst) {
        ctx.shadowBlur = isBeat ? 15 : 5;
        ctx.shadowColor = finalColor;
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      const r = p.size * 1.5;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else if (settings.type === 'floating-bubbles') {
      ctx.save();
      ctx.strokeStyle = finalColor;
      ctx.lineWidth = Math.max(1.5, p.size * 0.12);
      if (!glowOnBurst) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = finalColor;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = finalAlpha * 0.6;
      ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'music-notes') {
      ctx.save();
      ctx.fillStyle = finalColor;
      if (!glowOnBurst) {
        ctx.shadowBlur = isBeat ? 12 : 4;
        ctx.shadowColor = finalColor;
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.3, p.size * 0.5, p.size * 0.45, p.size * 0.3, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(0, -p.size * 0.8, p.size * 0.12, p.size * 1.3);
      ctx.beginPath();
      ctx.moveTo(p.size * 0.12, -p.size * 0.8);
      ctx.bezierCurveTo(p.size * 0.7, -p.size * 0.5, p.size * 0.7, -p.size * 0.2, p.size * 0.75, 0);
      ctx.bezierCurveTo(p.size * 0.5, -p.size * 0.2, p.size * 0.4, -p.size * 0.4, p.size * 0.12, -p.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (settings.type === 'glitch-vectors') {
      ctx.save();
      const isHighEndTrigger = isBeat && (settings.audioDriveTarget === 'high-end' || Math.random() > 0.4);
      let alphaMultiplier = 1.0;
      if (isHighEndTrigger) {
        alphaMultiplier = Math.random() > 0.15 ? Math.random() * 1.25 : 0.05;
      }
      ctx.globalAlpha = finalAlpha * alphaMultiplier;

      const w = 1 + Math.floor((p.size || 4) % 8); // width 1px to 8px
      const h = 1;
      let xOffset = 0;
      if (isHighEndTrigger && Math.random() > 0.5) {
        xOffset = (Math.random() - 0.5) * 12;
      }

      ctx.fillStyle = finalColor;
      ctx.fillRect(p.x - w / 2 + xOffset, p.y - h / 2, w, h);
      ctx.restore();
    }
  }

  // Render clean, transparent expanding shockwave rings
  if (activeShockwaves.length > 0) {
    ctx.save();
    for (const sw of activeShockwaves) {
      const ratio = sw.radius / sw.maxRadius;
      const alpha = Math.max(0, 0.7 * (1.0 - ratio));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * (1.0 - ratio) + 1;
      ctx.globalAlpha = alpha;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

// DRAW VISUALIZER INTERACTIVE STYLES
export function drawVisualizer(
  mainCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  incomingSettings: VisualizerSettings,
  analyserData: Uint8Array,
  waveformData: Uint8Array,
  beatIntensity: number
) {
  if (!visualizerWavesCanvas) {
    visualizerWavesCanvas = document.createElement('canvas');
  }
  if (visualizerWavesCanvas.width !== width || visualizerWavesCanvas.height !== height) {
    visualizerWavesCanvas.width = width;
    visualizerWavesCanvas.height = height;
  }
  const ctx = visualizerWavesCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  let settings = incomingSettings;
  const isPortrait = height > width;

  // 1 & 2. Aspect Ratio Detection & Portrait Dynamic Resampling
  let activeAnalyserData = analyserData;
  let activeWaveformData = waveformData;

  if (isPortrait) {
    const targetSize = 64; // down to 64 optimized bins
    const resampledAnalyser = new Uint8Array(targetSize);
    const resampledWaveform = new Uint8Array(targetSize);
    const binSize = analyserData.length / targetSize;
    
    for (let i = 0; i < targetSize; i++) {
      const startIdx = Math.floor(i * binSize);
      const endIdx = Math.ceil((i + 1) * binSize);
      let sumAnalyser = 0;
      let sumWaveform = 0;
      let count = 0;
      for (let j = startIdx; j < endIdx && j < analyserData.length; j++) {
        sumAnalyser += analyserData[j];
        sumWaveform += waveformData[j];
        count++;
      }
      resampledAnalyser[i] = count > 0 ? sumAnalyser / count : 128;
      resampledWaveform[i] = count > 0 ? sumWaveform / count : 128;
    }
    activeAnalyserData = resampledAnalyser;
    activeWaveformData = resampledWaveform;
    
    // 3. Responsive Spacing Calculation
    const suggestedSpacing = Math.max(1, Math.min(settings.barSpacing !== undefined ? settings.barSpacing : 4, Math.floor(width / 120)));
    const suggestedBarCount = settings.barFrequencyCount !== undefined
      ? Math.min(settings.barFrequencyCount, 48)
      : 32;
    // Cap barSpacing to make sure totalSpacing of barCount doesn't exceed 40% of the canvas width
    const maxAllowedSpacing = Math.max(1, Math.floor((width * 0.4) / suggestedBarCount));
    
    settings = {
      ...settings,
      barSpacing: Math.min(suggestedSpacing, maxAllowedSpacing),
      barFrequencyCount: suggestedBarCount,
      lineThickness: Math.max(0.1, Math.min(settings.lineThickness || 2, 2)),
    };
  }

  analyserData = activeAnalyserData;
  waveformData = activeWaveformData;
  const dataLen = analyserData.length;
  const isWebm = true;

  // Manage spectrogram history
  if (settings.style === 'frequency-spectrogram' || (settings.activeStyles && settings.activeStyles.includes('frequency-spectrogram'))) {
    spectrogramHistory.push(new Uint8Array(analyserData));
    if (spectrogramHistory.length > MAX_SPECTROGRAM_HISTORY) {
      spectrogramHistory.shift();
    }
  } else if (spectrogramHistory.length > 0) {
    // Release spectrogram history memory when not active
    spectrogramHistory = [];
  }

  // Manage floating wave echo history memory release
  if (settings.style !== 'floating-wave-echo' && (!settings.activeStyles || !settings.activeStyles.includes('floating-wave-echo')) && floatingWaveHistory.length > 0) {
    floatingWaveHistory = [];
  }

  let appliedHueShift = false;

  if (settings.cycleColors) {
    const now = Date.now();
    let delta = (now - lastTimeColorCycle) / 1000;
    if (delta < 0 || delta > 1) {
      delta = 0.016; // fallback to ~60fps frame delta if tab suspended/first frame
    }
    lastTimeColorCycle = now;

    // Default speed is 1.0 (corresponds to shifting 25 degrees/sec)
    const speed = settings.colorCycleSpeed !== undefined ? settings.colorCycleSpeed : 1.0;
    hueRotation = (hueRotation + delta * 25 * speed) % 360;
    appliedHueShift = true;
  } else {
    lastTimeColorCycle = Date.now();
  }

  // Handle beat-reactive color shift increment
  if (settings.beatReactiveColorShift && beatIntensity > 0.05) {
    const intensity = settings.colorShiftIntensity !== undefined ? settings.colorShiftIntensity : 5.0;
    // Increment hueRotation based on beat intensity and slider intensity multiplier
    hueRotation = (hueRotation + beatIntensity * intensity * 15) % 360;
    appliedHueShift = true;
  }

  if (appliedHueShift) {
    settings = {
      ...settings,
      primaryColor: shiftHexColorHue(settings.primaryColor, hueRotation),
      secondaryColor: shiftHexColorHue(settings.secondaryColor, hueRotation),
    };
  }

  // Handle strobe-like beat color inversion
  if (settings.colorInvertOnBeat && beatIntensity > 0.1) {
    const temp = settings.primaryColor;
    settings = {
      ...settings,
      primaryColor: settings.secondaryColor,
      secondaryColor: temp,
    };
  }

  // Handle on-beat color bursting/exploding with brightness
  if (settings.colorBurstOnBeat && beatIntensity > 0.05) {
    const rgb = hexToRgb(settings.primaryColor);
    if (rgb) {
      const factor = Math.min(1.0, beatIntensity * 0.95);
      const r = Math.round(rgb.r + (255 - rgb.r) * factor);
      const g = Math.round(rgb.g + (255 - rgb.g) * factor);
      const b = Math.round(rgb.b + (255 - rgb.b) * factor);
      const toHexVal = (val: number) => {
        const hex = val.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      settings = {
        ...settings,
        primaryColor: `#${toHexVal(r)}${toHexVal(g)}${toHexVal(b)}`,
      };
    }
  }

  ctx.save();

  // Save settings in module scope
  activeSettings = settings;

  // Apply visualizer-wide bloom filter
  if (settings.glowIntensity !== undefined && settings.glowIntensity > 0) {
    ctx.filter = `drop-shadow(0 0 ${settings.glowIntensity}px ${settings.glowColor || settings.primaryColor || '#00ffcc'}) brightness(${(1 + settings.glowIntensity * 0.05).toFixed(2)})`;
  } else {
    ctx.filter = 'none';
  }

  const primaryRGB = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
  const secondaryRGB = hexToRgb(settings.secondaryColor) || { r: 255, g: 0, b: 128 };

  // Glow Setup
  if (settings.glowStrength > 0 || (settings.flashOnBeat && beatIntensity > 0)) {
    const baseGlow = settings.glowStrength || 0;
    const flashIntensityVal = settings.flashIntensity !== undefined ? settings.flashIntensity : 0.8;

    if (settings.flashOnBeat && beatIntensity > 0) {
      // Amplified dynamic shadow blur on beat, scaled by flashIntensityVal
      ctx.shadowBlur = baseGlow + beatIntensity * 40 * flashIntensityVal;

      // Select dynamic target color
      const flashColorMode = settings.flashColorMode || 'white';
      const flashCustomColor = settings.flashCustomColor || '#ffffff';

      let targetColor = '#ffffff';
      if (flashColorMode === 'white') {
        targetColor = '#ffffff';
      } else if (flashColorMode === 'custom') {
        targetColor = flashCustomColor;
      } else if (flashColorMode === 'colorA') {
        targetColor = settings.primaryColor;
      } else if (flashColorMode === 'glowColor') {
        targetColor = settings.glowColor || settings.primaryColor || '#00ffcc';
      }

      // Blend from base glow color (or primary color as fallback) to target color
      const startColor = settings.glowColor || settings.primaryColor || '#00ffcc';
      const startRGB = hexToRgb(startColor) || { r: 0, g: 255, b: 200 };
      const targetRGB = hexToRgb(targetColor) || { r: 255, g: 255, b: 255 };

      // Calculate final blend factor
      const blendFactor = Math.min(1.0, beatIntensity * flashIntensityVal);

      const r = Math.round(startRGB.r + (targetRGB.r - startRGB.r) * blendFactor);
      const g = Math.round(startRGB.g + (targetRGB.g - startRGB.g) * blendFactor);
      const b = Math.round(startRGB.b + (targetRGB.b - startRGB.b) * blendFactor);

      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    } else {
      ctx.shadowBlur = settings.glowStrength;
      ctx.shadowColor = settings.glowColor;
    }
  }

  // Color selection configuration
  const mode = settings.colorMode || 'gradient';
  let activeStyleColor: string | CanvasGradient;

  if (mode === 'solid') {
    activeStyleColor = settings.primaryColor;
  } else if (mode === 'rainbow') {
    const rainbowGrad = ctx.createLinearGradient(0, 0, width, 0);
    rainbowGrad.addColorStop(0, 'hsl(0, 100%, 55%)');
    rainbowGrad.addColorStop(0.2, 'hsl(35, 100%, 55%)');
    rainbowGrad.addColorStop(0.4, 'hsl(60, 100%, 55%)');
    rainbowGrad.addColorStop(0.6, 'hsl(125, 100%, 55%)');
    rainbowGrad.addColorStop(0.8, 'hsl(215, 100%, 55%)');
    rainbowGrad.addColorStop(1.0, 'hsl(280, 100%, 55%)');
    activeStyleColor = rainbowGrad;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, settings.primaryColor);
    gradient.addColorStop(0.5, settings.secondaryColor);
    gradient.addColorStop(1, settings.primaryColor);
    activeStyleColor = gradient;
  }

  ctx.strokeStyle = activeStyleColor;
  ctx.fillStyle = activeStyleColor;
  ctx.lineWidth = settings.lineThickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // DRAW ACCORDING TO VISUALIZER STYLE
  const placement = settings.placement || 'bottom';
  const originalWidth = width;
  const originalHeight = height;

  const currentSettingsState = settings;
  const stylesToDraw = currentSettingsState.activeStyles && currentSettingsState.activeStyles.length > 0
    ? currentSettingsState.activeStyles
    : [currentSettingsState.style];

  // Capture original raw waveform data statically prior to the loop to resolve block shadow TDZ compilation issues
  const outerRawWaveformData = waveformData;

  stylesToDraw.forEach((styleId) => {
    ctx.save();

    const styleSetting = currentSettingsState.styleSettings?.[styleId];
    const stylePosition = currentSettingsState.stylePositions?.[styleId];

    // Retrieve physics parameters (tension default 0.1, dampening / friction default 0.8)
    const styleSpringTension = styleSetting?.springTension !== undefined ? styleSetting.springTension : (stylePosition?.springTension !== undefined ? stylePosition.springTension : 0.1);
    const styleSpringDampening = styleSetting?.springDampening !== undefined ? styleSetting.springDampening : (stylePosition?.springDampening !== undefined ? stylePosition.springDampening : 0.8);

    // Dynamic point transition smoothing using continuous Hooke's Law physics solver
    const rawWaveTemp = outerRawWaveformData;
    const dataLenVal = rawWaveTemp.length;
    if (!stylePhysicsCache[styleId] || stylePhysicsCache[styleId].current.length !== dataLenVal) {
      const initialArray = new Float32Array(dataLenVal);
      for (let i = 0; i < dataLenVal; i++) {
        initialArray[i] = rawWaveTemp[i];
      }
      stylePhysicsCache[styleId] = {
        current: initialArray,
        velocity: new Float32Array(dataLenVal)
      };
    }

    const cacheObj = stylePhysicsCache[styleId];
    const smoothedWave = new Uint8Array(dataLenVal);

    for (let i = 0; i < dataLenVal; i++) {
      const target = rawWaveTemp[i];
      const current = cacheObj.current[i];
      let velocity = cacheObj.velocity[i];

      // Hooke's Law Spring force combined with dampening friction resistance
      const displacement = target - current;
      const force = displacement * styleSpringTension;
      velocity = (velocity + force) * (1 - styleSpringDampening);

      const nextCurrent = current + velocity;

      cacheObj.current[i] = nextCurrent;
      cacheObj.velocity[i] = velocity;

      smoothedWave[i] = Math.max(0, Math.min(255, Math.round(nextCurrent)));
    }

    // Shadow waveformData with physics-smoothed data so all drawings inherit it seamlessly
    const waveformData = smoothedWave;

    let width = originalWidth;
    let height = originalHeight;

    const styleScale = styleSetting?.scale !== undefined 
      ? styleSetting.scale 
      : (stylePosition?.verticalScale !== undefined ? stylePosition.verticalScale : currentSettingsState.sensitivity);

    const styleThickness = stylePosition?.horizontalScale !== undefined 
      ? stylePosition.horizontalScale 
      : currentSettingsState.lineThickness;
    
    // Local shadowed settings variable protects each style iteration
    // Maps sensitivity to the style-specific verticalScale automatically
    const settings = {
      ...currentSettingsState,
      style: styleId,
      sensitivity: styleScale,
      lineThickness: styleThickness
    };
    
    activeSettings = settings;
    ctx.lineWidth = settings.lineThickness;

    // Draw-space transformations for side placements
    if (placement === 'left') {
      ctx.translate(0, originalHeight);
      ctx.rotate(-Math.PI / 2);
      width = originalHeight;
      height = originalWidth;
    } else if (placement === 'right') {
      ctx.translate(originalWidth, 0);
      ctx.rotate(Math.PI / 2);
      width = originalHeight;
      height = originalWidth;
    }

    // Dynamic layout coordinates based on vertical and horizontal shifts from sliders
    const xOffset = styleSetting?.xOffset !== undefined ? styleSetting.xOffset : (stylePosition?.xOffset !== undefined ? stylePosition.xOffset : undefined);
    const yOffset = styleSetting?.yOffset !== undefined ? styleSetting.yOffset : (stylePosition?.yOffset !== undefined ? stylePosition.yOffset : undefined);

    const xPercent = xOffset !== undefined ? xOffset : 50;
    const defaultYPercent = placement === 'top' ? 25 : placement === 'bottom' ? 75 : 50;
    const yPercent = yOffset !== undefined ? yOffset : defaultYPercent;
    activeYPercent = yPercent;

    let centerX = width * (xPercent / 100);
    let centerY = height * (yPercent / 100);
    let midY = height * (yPercent / 100);

    // Vertically invert the rendered waveform relative to the center baseline / active baseline coordinate
    if (settings.flipWaveform) {
      ctx.translate(0, midY);
      ctx.scale(1, -1);
      ctx.translate(0, -midY);
    }

    ctx.strokeStyle = activeStyleColor;
    ctx.fillStyle = activeStyleColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Retrieve Master Global Scale and Total Horizontal Span config
    const styleMasterScale = styleSetting?.masterScale !== undefined ? styleSetting.masterScale : (stylePosition?.masterScale !== undefined ? stylePosition.masterScale : 100);
    const styleHorizontalSpan = styleSetting?.horizontalSpan !== undefined ? styleSetting.horizontalSpan : (stylePosition?.horizontalSpan !== undefined ? stylePosition.horizontalSpan : 100);

    const masterScaleFactor = styleMasterScale / 100;
    const horizontalSpanFactor = styleHorizontalSpan / 100;

    if (masterScaleFactor !== 1.0 || horizontalSpanFactor !== 1.0) {
      ctx.translate(centerX, centerY);
      ctx.scale(masterScaleFactor * horizontalSpanFactor, masterScaleFactor);
      ctx.translate(-centerX, -centerY);
    }

    if (settings.style === 'waveform') {
    if (settings.spectrumAnalyzer) {
      // Replaces standard waveform with a frequency-domain bar chart view
      const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
        ? Math.min(settings.barFrequencyCount, dataLen)
        : Math.min(64, dataLen);
      const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 4;
      const totalSpacing = spacing * (barCount - 1);
      const originalBarWidth = (width - totalSpacing) / barCount;
      const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
      const barWidth = originalBarWidth * multiplier;
      const step = barWidth + spacing;
      const totalWidth = barCount * barWidth + (barCount - 1) * spacing;
      const startX = (width - totalWidth) / 2;
      const radius = settings.barRoundness !== undefined ? settings.barRoundness : 3;

      for (let i = 0; i < barCount; i++) {
        // Logarithmic scale mapping to show low and mid frequencies cleanly
        const idx = Math.floor(Math.pow(i / barCount, 1.3) * (dataLen * 0.75));
        const value = analyserData[idx] || 0;
        const barHeight = (value / 255) * (height * 0.65) * settings.sensitivity + 4;

        const x = startX + i * step;
        
        let y = midY - barHeight;
        if (yPercent < 40) {
          y = midY;
        } else if (placement === 'center') {
          y = midY - barHeight / 2;
        }

        ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / barCount);
        
        ctx.beginPath();
        if (radius > 0) {
          if (yPercent < 40) {
            ctx.roundRect(x, y, barWidth, barHeight, [0, 0, radius, radius]);
          } else {
            ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
          }
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    } else {
      // Smooth flowing bezier wave path with density matched exactly to barFrequencyCount
      const densityPoints = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
        ? settings.barFrequencyCount
        : dataLen;

      // Ensure lineWidth perfectly matches the slider settings, supporting sub-pixel thickness
      ctx.lineWidth = settings.lineThickness !== undefined ? settings.lineThickness : 2;

      ctx.beginPath();
      const sliceWidth = width / densityPoints;
      let x = 0;

      for (let i = 0; i < densityPoints; i++) {
        // Map to original data length indices evenly
        const idx = Math.min(dataLen - 1, Math.floor((i / densityPoints) * dataLen));
        const prevIdx = Math.max(0, Math.min(dataLen - 1, Math.floor(((i - 1) / densityPoints) * dataLen)));

        // wave value is normalized around 128 (for 8-bit unsigned integer)
        const v = waveformData[idx] / 128.0; 
        const y = (v * (height / 3)) * settings.sensitivity + midY - (height / 6);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = x - sliceWidth;
          const prevV = waveformData[prevIdx] / 128.0;
          const prevY = (prevV * (height / 3)) * settings.sensitivity + midY - (height / 6);
          ctx.bezierCurveTo(prevX + sliceWidth / 2, prevY, prevX + sliceWidth / 2, y, x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
    }

  } else if (settings.style === 'bars') {
    // Traditional frequency visualizer bars
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(64, dataLen);
    const totalBars = barCount;
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 4;
    const originalBarWidth = (width / totalBars) * 0.8;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const computedBarWidth = originalBarWidth * multiplier;
    const step = computedBarWidth + spacing;
    const totalWidth = totalBars * computedBarWidth + (totalBars - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const radius = settings.barRoundness;

    const maxIdx = Math.floor(dataLen * 0.65);
    for (let i = 0; i < totalBars; i++) {
      const idx = Math.floor(Math.pow(i / totalBars, 1.2) * maxIdx);
      const rawValue = analyserData[idx] || 0;
      // High-Frequency Equalization Gain
      const value = Math.min(255, rawValue * (1 + (i / totalBars) * 1.5));
      const barHeight = (value / 255) * (height * 0.6) * settings.sensitivity + 4;

      const x = startX + i * step;
      
      let y = midY - barHeight;
      if (yPercent < 40) {
        y = midY;
      } else if (placement === 'center') {
        y = midY - barHeight / 2;
      }

      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / totalBars);
      
      // Draw nicely rounded bar rectangles
      ctx.beginPath();
      if (radius > 0) {
        if (yPercent < 40) {
          ctx.roundRect(x, y, computedBarWidth, barHeight, [0, 0, radius, radius]);
        } else {
          ctx.roundRect(x, y, computedBarWidth, barHeight, [radius, radius, 0, 0]);
        }
      } else {
        ctx.rect(x, y, computedBarWidth, barHeight);
      }
      ctx.fill();
    }

  } else if (settings.style === 'circular') {
    // Glowing pulsating circle of lines matching frequency details
    const baseRadius = Math.min(width, height) * 0.18 * (1 + beatIntensity * 0.15);

    ctx.beginPath();
    const pointsCount = Math.min(128, dataLen);
    
    for (let i = 0; i < pointsCount; i++) {
      const idx = Math.floor((i / pointsCount) * (dataLen * 0.5));
      const val = analyserData[idx] || 0;
      const waveVal = (waveformData[idx] - 128) / 128; // -1.0 to 1.0

      const radiusOffset = (val / 255) * 120 * settings.sensitivity + (waveVal * 15);
      const angle = (i / pointsCount) * Math.PI * 2;
      const r = baseRadius + radiusOffset;

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Subtle center cover glowing disc
    ctx.fillStyle = `rgba(${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}, 0.1)`;
    ctx.fill();

  } else if (settings.style === 'radial-bars') {
    // Beautiful bar lines pointing outwards in circular star configuration
    const baseRadius = Math.min(width, height) * 0.15;
    const itemSlots = Math.min(80, dataLen);

    for (let i = 0; i < itemSlots; i++) {
      const idx = Math.floor((i / itemSlots) * (dataLen * 0.6));
      const val = analyserData[idx] || 0;
      const len = (val / 255) * 180 * settings.sensitivity;

      const angle = (i / itemSlots) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const xStart = centerX + cos * baseRadius;
      const yStart = centerY + sin * baseRadius;
      
      const xEnd = centerX + cos * (baseRadius + len);
      const yEnd = centerY + sin * (baseRadius + len);

      ctx.strokeStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / itemSlots);
      ctx.lineWidth = settings.lineThickness;
      
      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();
    }

  } else if (settings.style === 'retro') {
    // VHS Retro grids and sound wave reflection
    const gridY = midY; // Ensure BOTH the top and bottom rendering loops strictly inherit the exact same Global Baseline positioning

    const mode = settings.colorMode || 'gradient';
    
    // Share exact same Resolution Density variable for the loops
    const numBars = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : 50;

    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 4;
    const totalSpacing = spacing * (numBars - 1);
    const originalBarW = (width - totalSpacing) / numBars;

    // Share exact same Thickness/Thinness inputs
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const barW = Math.max(1, originalBarW * multiplier);
    const step = barW + spacing;
    const totalWidth = numBars * barW + (numBars - 1) * spacing;
    const startX = (width - totalWidth) / 2;

    const glowStrength = settings.glowStrength !== undefined ? settings.glowStrength : 12;

    // Save state before rendering the retro visualizer wave elements
    ctx.save();

    // 1. TOP Loop (Main waveform going UP from the baseline)
    for (let i = 0; i < numBars; i++) {
      // Symmetric sound wave output
      const rawIdx = Math.abs(i - numBars / 2);
      const ratio = rawIdx / (numBars / 2); // 0.0 at center (bass), 1.0 at outer edges (treble)
      const dataIdx = Math.floor(ratio * (dataLen * 0.5));
      const val = analyserData[dataIdx] || 0;
      const barH = (val / 255) * 150 * settings.sensitivity;

      // Dynamically resolve bar color based on selected Color Mode
      const barColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, ratio);
      const xPos = startX + i * step;

      // Render Main Bar with custom Glow & Alpha
      ctx.save();
      if (glowStrength > 0) {
        ctx.shadowBlur = glowStrength;
        ctx.shadowColor = settings.glowColor || barColor;
      }
      ctx.globalAlpha = 0.4 + (val / 255) * 0.6;
      ctx.fillStyle = barColor;

      ctx.fillRect(xPos, gridY - barH, barW, barH);
      ctx.restore();
    }

    // 2. BOTTOM Loop (Reflection waveform going DOWN from the baseline)
    for (let i = 0; i < numBars; i++) {
      const rawIdx = Math.abs(i - numBars / 2);
      const ratio = rawIdx / (numBars / 2);
      const dataIdx = Math.floor(ratio * (dataLen * 0.5));
      const val = analyserData[dataIdx] || 0;
      const barH = (val / 255) * 150 * settings.sensitivity;

      const barColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, ratio);
      const xPos = startX + i * step;

      // Render Reflection Wave with dynamic colors matching the main bar and adjusted opacity
      ctx.save();
      if (glowStrength > 0) {
        ctx.shadowBlur = Math.floor(glowStrength * 0.5); // softer shadow for reflections
        ctx.shadowColor = settings.glowColor || barColor;
      }
      ctx.globalAlpha = (val / 255) * 0.3;
      ctx.fillStyle = barColor;

      ctx.fillRect(xPos, gridY, barW, barH * 0.5);
      ctx.restore();
    }

    ctx.restore(); // Restore context back to its original state

    // Render Grid Baseline dynamically styled with color schemes and Thickness/Thinness slider lineThickness
    ctx.save();
    let baselineColor = '#ff007f'; // default classic retro magenta/pink
    if (mode === 'solid') {
      baselineColor = settings.primaryColor;
    } else if (mode === 'gradient') {
      baselineColor = settings.secondaryColor || settings.primaryColor;
    } else if (mode === 'rainbow') {
      baselineColor = 'hsl(300, 100%, 55%)'; // Vibrant magenta endpoint
    }

    const gridGlowStrength = settings.glowStrength !== undefined ? settings.glowStrength : 12;
    if (gridGlowStrength > 0) {
      ctx.shadowBlur = gridGlowStrength;
      ctx.shadowColor = settings.glowColor || baselineColor;
    }

    ctx.strokeStyle = baselineColor;
    ctx.lineWidth = settings.lineThickness !== undefined ? settings.lineThickness : 4;
    ctx.beginPath();
    ctx.moveTo(0, gridY);
    ctx.lineTo(width, gridY);
    ctx.stroke();
    ctx.restore();

  } else if (settings.style === 'neon-tunnel') {
    // Zooming square structures reflecting music levels
    const maxSquares = 6;
    
    for (let i = 0; i < maxSquares; i++) {
      // Frequency bin
      const fIdx = Math.floor((i / maxSquares) * (dataLen * 0.3));
      const rawVal = analyserData[fIdx] || 0;
      
      // Base zooming progress offset
      const progress = ((Date.now() / 1500) % 1) + (i / maxSquares);
      const modProgress = progress % 1;
      
      const maxW = Math.max(width, height) * 0.8;
      const sqSize = maxW * modProgress * (1 + (rawVal / 255) * 0.25 * settings.sensitivity);
      
      ctx.strokeStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, modProgress);
      ctx.lineWidth = (1 - modProgress) * 5 + 1;
      ctx.globalAlpha = (1 - modProgress) * 0.7;

      ctx.beginPath();
      // Centered rectangle
      ctx.rect(centerX - sqSize / 2, centerY - sqSize / 2, sqSize, sqSize);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

  } else if (settings.style === 'laser-orbit') {
    // Fast rotating space-laser paths modulated by current frequencies
    const numLasers = 8;
    const timeAngle = (Date.now() / 2000) * Math.PI;

    for (let i = 0; i < numLasers; i++) {
      const idx = Math.floor((i / numLasers) * (dataLen * 0.4));
      const val = analyserData[idx] || 0;
      const magnitude = (val / 255) * 300 * settings.sensitivity + 50;

      const baseAngle = (i / numLasers) * Math.PI * 2 + timeAngle;
      
      ctx.strokeStyle = getDynamicColor(settings.secondaryColor, '#00ffff', i / numLasers);
      ctx.lineWidth = 3 + (val / 255) * 5;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const xEnd = centerX + Math.cos(baseAngle) * magnitude;
      const yEnd = centerY + Math.sin(baseAngle) * magnitude;
      
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();
      
      // Laser tip point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, 4 + (val / 255) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (settings.style === 'wave-matrix') {
    // Joy Division mountain-style visualizer curves layout
    const rows = 12;
    const rowPoints = 40;
    
    let startY = midY - height * 0.25;
    let endY = midY + height * 0.3;
    if (yPercent < 40) {
      startY = midY - height * 0.15;
      endY = midY + height * 0.2;
    } else if (yPercent > 65) {
      startY = midY - height * 0.25;
      endY = midY + height * 0.15;
    }
    
    const stepY = (endY - startY) / rows;

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      
      // Audio trigger index offset for this specific landscape row
      const valIdxOffset = Math.floor((r / rows) * (dataLen * 0.4));
      
      const yRow = startY + r * stepY;
      const stepX = width / rowPoints;

      // Draw curve across
      for (let i = 0; i <= rowPoints; i++) {
        // Bell curve weight to keep middle peaks high and side margins flat
        const x = i * stepX;
        const normDistFromCenter = Math.abs((i / rowPoints) - 0.5) * 2; // 0 in center, 1 at edges
        const bellWeight = Math.max(0, 1 - Math.pow(normDistFromCenter, 1.6));

        // Frequency modulation
        const dataIndex = Math.floor((i / rowPoints) * (dataLen * 0.3)) + valIdxOffset;
        const rawF = analyserData[dataIndex % dataLen] || 0;
        
        const displacement = (rawF / 255) * 120 * bellWeight * settings.sensitivity;
        const y = yRow - displacement;

        if (i === 0) {
          ctx.moveTo(x, yRow);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(width, yRow);
      
      // Fill background of this mountain slice to cover previous layers (dense overlapping effect!)
      ctx.fillStyle = '#06060c';
      ctx.fill();

      // Stroke color
      ctx.strokeStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, r / rows);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

  } else if (settings.style === 'heartbeat-ekg') {
    // 1. Draw thin cyan/green neon cardiogram ambient background grid
    ctx.save();
    ctx.shadowBlur = 0; // Disable shadow for background grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Plot the main EKG cardiogram line
    ctx.beginPath();
    const sliceWidth = width / dataLen;
    let currentX = 0;

    for (let i = 0; i < dataLen; i++) {
      // Base quiet line resting at center
      const rawV = (waveformData[i] - 128) / 128.0; // -1 to 1
      
      // High-intensity electrostatic spiky deformation
      let deformation = rawV * (height * 0.28) * settings.sensitivity;
      
      // Pin/pinch near margins to make it look like a continuous flat monitoring line that spikes in the center
      const normX = i / dataLen;
      const marginPinch = Math.sin(normX * Math.PI); // 0 at edges, 1 in middle

      // Add sudden heartbeat QRS-like sharp spikes at beat intervals
      let spike = 0;
      if (beatIntensity > 0.1) {
        // Create repeating QRS complex spikes using wave math
        const spikePosition = (normX * 10 - (Date.now() / 250) % 10);
        const wrappedSpike = (spikePosition + 10) % 10;
        if (wrappedSpike < 0.6) {
          // Sharp QRS pattern: minor dip, major spike, minor dip, minor peak
          const t = wrappedSpike / 0.6;
          if (t < 0.2) spike = -1.5; // Q-wave (dip)
          else if (t < 0.5) spike = 5.0; // R-wave (massive sharp spike)
          else if (t < 0.7) spike = -2.5; // S-wave (deep dip)
          else spike = 1.0; // T-wave (small rise)
          spike *= beatIntensity * 25.0 * settings.sensitivity;
        }
      }

      const y = midY + (deformation * marginPinch) + spike;
      
      if (i === 0) {
        ctx.moveTo(currentX, y);
      } else {
        ctx.lineTo(currentX, y);
      }
      currentX += sliceWidth;
    }

    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness + 1;
    ctx.stroke();

    // 3. Draw a glowing scan dot tracking the leading edge of the active pulse wave in real time
    const activeIndex = Math.floor((Date.now() / 15) % dataLen);
    const dotX = activeIndex * sliceWidth;
    const dotValue = (waveformData[activeIndex] - 128) / 128.0;
    const dotY = midY + dotValue * (height * 0.2) * settings.sensitivity;

    ctx.beginPath();
    ctx.arc(dotX, dotY, 6 + beatIntensity * 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = settings.primaryColor;
    ctx.fill();

    // Small pulsating neon heart icon in top-right corner to reinforce style mood
    const heartX = width - 60;
    const heartY = yPercent < 40 ? height - 60 : 60;
    const heartSize = 12 + beatIntensity * 8;
    ctx.beginPath();
    ctx.moveTo(heartX, heartY + heartSize / 4);
    ctx.bezierCurveTo(heartX, heartY, heartX - heartSize / 2, heartY, heartX - heartSize / 2, heartY + heartSize / 2);
    ctx.bezierCurveTo(heartX - heartSize / 2, heartY + heartSize, heartX, heartY + heartSize * 1.3, heartX, heartY + heartSize * 1.6);
    ctx.bezierCurveTo(heartX, heartY + heartSize * 1.3, heartX + heartSize / 2, heartY + heartSize, heartX + heartSize / 2, heartY + heartSize / 2);
    ctx.bezierCurveTo(heartX + heartSize / 2, heartY, heartX, heartY, heartX, heartY + heartSize / 4);
    ctx.closePath();
    ctx.fillStyle = settings.secondaryColor;
    ctx.fill();

  } else if (settings.style === 'fresnel-wave') {
    // 3 overlapping fluid interference waves driven by distinct energy bins
    // Extract multi-band frequency energies
    let lowEnergy = 0;
    const lowLimit = Math.floor(dataLen * 0.15) || 4;
    for (let i = 0; i < lowLimit; i++) lowEnergy += analyserData[i];
    const lowNormal = lowEnergy / lowLimit / 255;

    let midEnergy = 0;
    const midLimit = Math.floor(dataLen * 0.55);
    for (let i = lowLimit; i < midLimit; i++) midEnergy += analyserData[i];
    const midNormal = midEnergy / (midLimit - lowLimit) / 255;

    let highEnergy = 0;
    for (let i = midLimit; i < dataLen; i++) highEnergy += analyserData[i];
    const highNormal = highEnergy / (dataLen - midLimit) / 255;

    const timeSec = Date.now() * 0.001;

    // Wave 1: Bass / Primary Color (Slow, thick, majestic background flow)
    ctx.save();
    ctx.beginPath();
    const phase1 = timeSec * 1.8;
    const amp1 = lowNormal * (height * 0.28) * settings.sensitivity + 12;
    for (let x = 0; x <= width; x += 12) {
      // Pinch ends of the wave to keep the stage border neat
      const pinch = Math.sin(x * Math.PI / width);
      const y = midY + Math.sin(x * 0.003 + phase1) * amp1 * pinch;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness * 2.5;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.restore();

    // Wave 2: Midrange / Secondary Color (Medium speed, detailed phase)
    ctx.save();
    ctx.beginPath();
    const phase2 = -timeSec * 2.5;
    const amp2 = midNormal * (height * 0.2) * settings.sensitivity + 8;
    for (let x = 0; x <= width; x += 8) {
      const pinch = Math.sin(x * Math.PI / width);
      // Double frequency modulation for interference pattern
      const y = midY + Math.sin(x * 0.009 + phase2) * Math.cos(x * 0.003 + phase2 * 0.5) * amp2 * pinch;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = settings.secondaryColor;
    ctx.lineWidth = settings.lineThickness * 1.5;
    ctx.globalAlpha = 0.75;
    ctx.stroke();
    ctx.restore();

    // Wave 3: Treble / Glow Color (Fast, wireframe-thin ripple)
    ctx.save();
    ctx.beginPath();
    const phase3 = timeSec * 4.5;
    const amp3 = highNormal * (height * 0.12) * settings.sensitivity + 4;
    for (let x = 0; x <= width; x += 4) {
      const pinch = Math.sin(x * Math.PI / width);
      const y = midY + Math.sin(x * 0.025 + phase3) * amp3 * pinch;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = settings.glowColor || '#ffffff';
    ctx.lineWidth = settings.lineThickness * 0.7;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();

  } else if (settings.style === 'dna-helix') {
    // Elegant rotating Double Helix ladder wave representation
    const totalRungs = 28;
    const stepX = width / (totalRungs + 1);
    const timeRot = Date.now() * 0.0016;

    // Collect base strand paths for drawing smooth outer spiraling ribbons
    const ribbonAPoints: {x: number, y: number}[] = [];
    const ribbonBPoints: {x: number, y: number}[] = [];

    for (let i = 0; i <= totalRungs; i++) {
      const x = (i + 1) * stepX;
      
      // Match local frequency bins for progressive wave size
      const frequencyIndex = Math.floor((i / totalRungs) * (dataLen * 0.55));
      const val = analyserData[frequencyIndex] || 0;
      const baseAmplitude = 35 + (val / 255) * (height * 0.22) * settings.sensitivity;
      
      // Spatial twisting factor + temporal rotation + beat peak stretch
      const angle = (i * 0.42) + timeRot + (beatIntensity * 0.4);
      
      const yOffset = Math.sin(angle) * baseAmplitude;
      const zOffset = Math.cos(angle); // Represents depth projection (-1 to +1)

      const y1 = midY + yOffset;
      const y2 = midY - yOffset;

      ribbonAPoints.push({ x, y: y1 });
      ribbonBPoints.push({ x, y: y2 });

      // Draw ladder rungs (connections between double strands)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.lineWidth = settings.lineThickness / 2;
      // Give 3D alpha cues matching sine rotation depth
      ctx.globalAlpha = 0.25 + Math.abs(zOffset) * 0.55;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.stroke();

      // Draw shiny atom joints (nucleobase nodes)
      // Joint A
      ctx.beginPath();
      const dotRadiusA = Math.max(0.5, settings.lineThickness * 1.5 + zOffset * 2.5);
      ctx.arc(x, y1, dotRadiusA, 0, Math.PI * 2);
      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / totalRungs);
      ctx.shadowBlur = dotRadiusA * 1.5;
      ctx.shadowColor = settings.primaryColor;
      ctx.fill();

      // Joint B
      ctx.beginPath();
      const dotRadiusB = Math.max(0.5, settings.lineThickness * 1.5 - zOffset * 2.5);
      ctx.arc(x, y2, dotRadiusB, 0, Math.PI * 2);
      ctx.fillStyle = getDynamicColor(settings.secondaryColor, settings.primaryColor, i / totalRungs);
      ctx.shadowBlur = dotRadiusB * 1.5;
      ctx.shadowColor = settings.secondaryColor;
      ctx.fill();
      ctx.restore();
    }

    // Connect and stroke the main helicoid strands
    ctx.save();
    ctx.lineWidth = settings.lineThickness * 1.5;
    
    ctx.beginPath();
    ribbonAPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = settings.primaryColor;
    ctx.stroke();

    ctx.beginPath();
    ribbonBPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = settings.secondaryColor;
    ctx.stroke();
    ctx.restore();

  } else if (settings.style === 'double-mirror-bars') {
    // Symmetrically upward/downward mirroring frequency bar graphs
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(64, dataLen);
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 4;
    const totalSpacing = spacing * (barCount - 1);
    const originalBarWidth = (width - totalSpacing) / barCount;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const barWidth = originalBarWidth * multiplier;
    const step = barWidth + spacing;
    const totalWidth = barCount * barWidth + (barCount - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const radius = settings.barRoundness !== undefined ? settings.barRoundness : 3;

    for (let i = 0; i < barCount; i++) {
       const idx = Math.floor(Math.pow(i / barCount, 1.3) * (dataLen * 0.7));
       const value = analyserData[idx] || 0;
       const barHeight = (value / 255) * (height * 0.35) * settings.sensitivity + 2;

       const x = startX + i * step;
      
      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / barCount);
      
      // Top mirror bar
      ctx.beginPath();
      if (radius > 0) {
        ctx.roundRect(x, midY - barHeight, barWidth, barHeight, [radius, radius, 0, 0]);
      } else {
        ctx.rect(x, midY - barHeight, barWidth, barHeight);
      }
      ctx.fill();

      // Bottom mirror bar
      ctx.beginPath();
      if (radius > 0) {
        ctx.roundRect(x, midY, barWidth, barHeight, [0, 0, radius, radius]);
      } else {
        ctx.rect(x, midY, barWidth, barHeight);
      }
      ctx.fill();
    }

  } else if (settings.style === 'circular-orbit') {
    // Elegant central orbit ring where frequencies explode outwards
    const baseRadius = Math.min(width, height) * 0.16 * (1 + beatIntensity * 0.1);
    const pointsCount = Math.min(128, dataLen);
    const timeRot = Date.now() * 0.0005;

    // Center circular framework
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < pointsCount; i++) {
      const idx = Math.floor((i / pointsCount) * (dataLen * 0.6));
      const val = analyserData[idx] || 0;
      const barHeight = (val / 255) * 110 * settings.sensitivity;

      const angle = (i / pointsCount) * Math.PI * 2 + timeRot;
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / pointsCount);
      ctx.lineWidth = settings.lineThickness + 1;
      ctx.stroke();
    }

  } else if (settings.style === 'radial-inside-out') {
    // Symmetrical circle frequency blades targeting inwards
    const outerRadius = Math.min(width, height) * 0.38;
    const pointsCount = Math.min(128, dataLen);
    const timeRot = -Date.now() * 0.0003;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = settings.secondaryColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.22;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < pointsCount; i++) {
      const idx = Math.floor((i / pointsCount) * (dataLen * 0.6));
      const val = analyserData[idx] || 0;
      const maxInnerHeight = outerRadius * 0.85;
      const barHeight = Math.min(maxInnerHeight, (val / 255) * outerRadius * settings.sensitivity);

      const angle = (i / pointsCount) * Math.PI * 2 + timeRot;
      const x1 = centerX + Math.cos(angle) * outerRadius;
      const y1 = centerY + Math.sin(angle) * outerRadius;
      const x2 = centerX + Math.cos(angle) * (outerRadius - barHeight);
      const y2 = centerY + Math.sin(angle) * (outerRadius - barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = getDynamicColor(settings.secondaryColor, settings.primaryColor, i / pointsCount);
      ctx.lineWidth = settings.lineThickness;
      ctx.stroke();
    }

    // Epicenter dynamic pulsar
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6 + beatIntensity * 8, 0, Math.PI * 2);
    ctx.fillStyle = settings.primaryColor;
    ctx.fill();

  } else if (settings.style === 'digital-vu-blocks') {
    // Segmented, blocky vertical stack indicators like retro hifi stereos
    const colCount = Math.min(32, dataLen);
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 6;
    const totalSpacing = spacing * (colCount - 1);
    const originalColWidth = (width - totalSpacing) / colCount;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const colWidth = originalColWidth * multiplier;
    const step = colWidth + spacing;
    const totalWidth = colCount * colWidth + (colCount - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const blockRows = 12; 
    const blockHeight = Math.max(1.5, (height * 0.45) / blockRows - 2.5);

    let drawOffsetMid = midY - height * 0.15;
    const drawDownwards = yPercent < 40;

    for (let i = 0; i < colCount; i++) {
      const idx = Math.floor((i / colCount) * (dataLen * 0.6));
      const val = analyserData[idx] || 0;
      const activeRows = Math.floor((val / 255) * blockRows * settings.sensitivity);

      const x = startX + i * step;

      for (let r = 0; r < blockRows; r++) {
        const segmentActive = r < activeRows;
        
        let y = 0;
        if (drawDownwards) {
          y = drawOffsetMid + r * (blockHeight + 2.5);
        } else {
          y = (drawOffsetMid + height * 0.35) - r * (blockHeight + 2.5);
        }

        ctx.fillStyle = segmentActive 
          ? (r > blockRows * 0.8 ? '#ef4444' : r > blockRows * 0.5 ? '#f59e0b' : '#10b981')
          : 'rgba(255, 255, 255, 0.05)';

        ctx.beginPath();
        ctx.rect(x, y, colWidth, blockHeight);
        ctx.fill();
      }
    }

  } else if (settings.style === 'dna-helix-thread') {
    // Elegant twin intertwined active sine ribbons representing high and low
    const pointsCount = 40;
    const stepX = width / (pointsCount - 1);
    const timeSec = Date.now() * 0.0022;

    ctx.save();
    for (let i = 0; i < pointsCount; i++) {
      const x = i * stepX;
      
      const freqIdx = Math.floor((i / pointsCount) * (dataLen * 0.5));
      const val = analyserData[freqIdx] || 0;
      const amplitude = 15 + (val / 255) * (height * 0.22) * settings.sensitivity;

      const angle = (i * 0.3) + timeSec;
      const y1 = midY + Math.sin(angle) * amplitude;
      const y2 = midY - Math.sin(angle) * amplitude;

      const alpha = 0.3 + 0.7 * Math.abs(Math.cos(angle));

      // Connected rungs
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Strand point A
      ctx.beginPath();
      ctx.arc(x, y1, settings.lineThickness + 2, 0, Math.PI * 2);
      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / pointsCount);
      ctx.fill();

      // Strand point B
      ctx.beginPath();
      ctx.arc(x, y2, settings.lineThickness + 2, 0, Math.PI * 2);
      ctx.fillStyle = getDynamicColor(settings.secondaryColor, settings.primaryColor, i / pointsCount);
      ctx.fill();
    }
    ctx.restore();

  } else if (settings.style === 'smooth-area-silhouette') {
    // Solid filled opacity-gradient vector waves with outline
    const sliceWidth = width / dataLen;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, midY);

    for (let i = 0; i < dataLen; i++) {
      const v = waveformData[i] / 128.0; 
      const y = (v * (height * 0.28)) * settings.sensitivity + midY - (height * 0.14);
      ctx.lineTo(i * sliceWidth, y);
    }
    
    ctx.lineTo(width, midY);
    ctx.closePath();

    let fillStyle: string | CanvasGradient;
    const mode = settings.colorMode || 'gradient';
    if (mode === 'solid') {
      fillStyle = `rgba(${hexToRgb(settings.primaryColor)?.r || 0}, ${hexToRgb(settings.primaryColor)?.g || 255}, ${hexToRgb(settings.primaryColor)?.b || 200}, 0.35)`;
    } else if (mode === 'rainbow') {
      const rainbowFillGrad = ctx.createLinearGradient(0, midY - 120, 0, midY + 120);
      rainbowFillGrad.addColorStop(0, 'hsla(0, 100%, 55%, 0.35)');
      rainbowFillGrad.addColorStop(0.2, 'hsla(35, 100%, 55%, 0.35)');
      rainbowFillGrad.addColorStop(0.4, 'hsla(60, 100%, 55%, 0.35)');
      rainbowFillGrad.addColorStop(0.6, 'hsla(125, 100%, 55%, 0.35)');
      rainbowFillGrad.addColorStop(0.8, 'hsla(215, 100%, 55%, 0.35)');
      rainbowFillGrad.addColorStop(1.0, 'hsla(280, 100%, 55%, 0.0)');
      fillStyle = rainbowFillGrad;
    } else {
      const fillGrad = ctx.createLinearGradient(0, midY - 120, 0, midY + 120);
      fillGrad.addColorStop(0, `rgba(${hexToRgb(settings.primaryColor)?.r || 0}, ${hexToRgb(settings.primaryColor)?.g || 255}, ${hexToRgb(settings.primaryColor)?.b || 200}, 0.35)`);
      fillGrad.addColorStop(1, `rgba(${hexToRgb(settings.secondaryColor)?.r || 255}, ${hexToRgb(settings.secondaryColor)?.g || 0}, ${hexToRgb(settings.secondaryColor)?.b || 128}, 0.0)`);
      fillStyle = fillGrad;
    }
    
    ctx.fillStyle = fillStyle;
    ctx.fill();

    // Sinuous top stroke
    ctx.beginPath();
    for (let i = 0; i < dataLen; i++) {
      const v = waveformData[i] / 128.0; 
      const y = (v * (height * 0.28)) * settings.sensitivity + midY - (height * 0.14);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceWidth, y);
    }
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness + 1;
    ctx.stroke();
    ctx.restore();

  } else if (settings.style === 'floating-matrix-particles') {
    // Floating glowing dust columns rising based on frequency peaks
    const colCount = Math.min(40, dataLen);
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 5;
    const totalSpacing = spacing * (colCount - 1);
    const colWidth = (width - totalSpacing) / colCount;

    ctx.save();
    for (let i = 0; i < colCount; i++) {
      const idx = Math.floor((i / colCount) * (dataLen * 0.5));
      const val = analyserData[idx] || 0;
      const heightLimit = (val / 255) * (height * 0.44) * settings.sensitivity;

      const x = i * (colWidth + spacing) + colWidth / 2;
      const particlesNum = 6;

      for (let p = 0; p < particlesNum; p++) {
        const ratio = p / (particlesNum - 1);
        const yOffset = ratio * heightLimit;
        
        let y = 0;
        if (yPercent < 40) {
          y = midY + yOffset;
        } else {
          y = midY - yOffset;
        }

        const size = Math.max(0.1, (settings.lineThickness * 1.5) * (1 - ratio * 0.45) + beatIntensity * 2.5);
        const alpha = (1 - ratio * 0.75) * (val / 255);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / colCount);
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
    }
    ctx.restore();
  } else if (settings.style === 'rounded-pill-bars') {
    // Modern Rounded Pill Bars with rounded caps
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(48, dataLen);
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 6;
    const totalSpacing = spacing * (barCount - 1);
    const originalBarWidth = (width - totalSpacing) / barCount;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const barWidth = originalBarWidth * multiplier;
    const step = barWidth + spacing;
    const totalWidth = barCount * barWidth + (barCount - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const radius = barWidth / 2;

    ctx.save();
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor(Math.pow(i / barCount, 1.3) * (dataLen * 0.7));
      const value = analyserData[idx] || 0;
      const barHeight = (value / 255) * (height * 0.6) * settings.sensitivity + 4;

      const x = startX + i * step;
      
      let y = midY - barHeight;
      if (yPercent < 40) {
        y = midY;
      } else if (placement === 'center') {
        y = midY - barHeight / 2;
      }

      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / barCount);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, radius);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }
    ctx.restore();

  } else if (settings.style === 'neon-glow-string') {
    // Neon Glow String Line connected via Bezier with heavy blur
    const pointsCount = Math.min(32, dataLen);
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const idx = Math.floor((i / pointsCount) * (dataLen * 0.5));
      const val = analyserData[idx] || 0;
      const displacement = (val / 255) * (height * 0.35) * settings.sensitivity;
      
      let y = midY - displacement;
      if (yPercent < 40) {
        y = midY + displacement;
      } else if (placement === 'center') {
        y = midY - (i % 2 === 0 ? displacement : -displacement) * 0.4;
      }
      
      const x = (i / (pointsCount - 1)) * width;
      points.push({ x, y });
    }

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = settings.glowColor || settings.primaryColor;
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness + 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const next = points[i + 1];
      ctx.bezierCurveTo(
        p.x + (next.x - p.x) / 3, p.y,
        p.x + 2 * (next.x - p.x) / 3, next.y,
        next.x, next.y
      );
    }
    ctx.stroke();
    ctx.restore();

  } else if (settings.style === 'floating-bubble-particles') {
    // Floating Bubble Particles scaling with frequency
    const bubbleCount = Math.min(30, dataLen);
    const timeScale = Date.now() * 0.001;
    const yTravelRange = height * 0.85;

    for (let i = 0; i < bubbleCount; i++) {
      const idx = Math.floor((i / bubbleCount) * (dataLen * 0.4));
      const val = analyserData[idx] || 0;
      const size = Math.max(3, (val / 255) * 18 * settings.sensitivity + 2 + beatIntensity * 3.5);

      const xBase = (i / (bubbleCount - 1)) * (width - 40) + 20;
      const bubbleSpeed = 0.4 + (i % 5) * 0.1 + (val / 255) * 1.3;
      const progress = (timeScale * bubbleSpeed + (i * 0.17)) % 1.0;

      let y = 0;
      if (yPercent < 40) {
        y = midY + progress * yTravelRange;
      } else if (yPercent > 65) {
        y = midY - progress * yTravelRange;
      } else {
        y = midY - (progress - 0.5) * yTravelRange;
      }

      const sway = Math.sin(timeScale * 2 + i) * 15;
      const fx = xBase + sway;

      ctx.save();
      ctx.beginPath();
      ctx.arc(fx, y, size, 0, Math.PI * 2);
      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / bubbleCount);
      ctx.globalAlpha = (0.2 + (1.0 - progress) * 0.6) * (val / 255 * 0.85 + 0.15);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(fx, y, size, 0, Math.PI * 2);
      ctx.strokeStyle = settings.primaryColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = (0.3 + (1.0 - progress) * 0.5);
      ctx.stroke();
      ctx.restore();
    }

  } else if (settings.style === 'mirrored-wave-silhouette') {
    // Mirrored Wave Shadow Silhouette symmetrical filled polygon
    ctx.save();
    const step = Math.max(1, Math.floor(dataLen / 100));
    const points: { x: number; yTop: number; yBottom: number }[] = [];

    for (let i = 0; i < dataLen; i += step) {
      const val = analyserData[i] || 0;
      const hVal = (val / 255) * (height * 0.28) * settings.sensitivity + 2;
      const x = (i / (dataLen - 1)) * width;
      points.push({ x, yTop: midY - hVal, yBottom: midY + hVal });
    }

    if (points.length > 0) {
      const rgb1 = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
      const rgb2 = hexToRgb(settings.secondaryColor) || { r: 255, g: 0, b: 128 };
      
      const gradient = ctx.createLinearGradient(0, midY - height * 0.3, 0, midY + height * 0.3);
      gradient.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.35)`);
      gradient.addColorStop(0.5, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.1)`);
      gradient.addColorStop(1, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.35)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yTop);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yTop);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(points[i].x, points[i].yBottom);
      }
      ctx.closePath();
      ctx.fill();

      // Top edge stroke
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yTop);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yTop);
      }
      ctx.strokeStyle = settings.primaryColor;
      ctx.lineWidth = settings.lineThickness;
      ctx.stroke();

      // Bottom edge stroke
      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].yBottom);
      for (let i = points.length - 2; i >= 0; i--) {
        ctx.lineTo(points[i].x, points[i].yBottom);
      }
      ctx.strokeStyle = settings.secondaryColor;
      ctx.lineWidth = settings.lineThickness;
      ctx.stroke();
    }
    ctx.restore();

  } else if (settings.style === 'retro-arcade-dot-grid') {
    // Retro Arcade Dot Grid equalizer blocks
    const colCount = Math.min(24, dataLen);
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 8;
    const totalSpacing = spacing * (colCount - 1);
    const colWidth = (width - totalSpacing) / colCount;

    const dotRows = 12;
    const dotSize = Math.max(3, colWidth - 2);

    ctx.save();
    for (let i = 0; i < colCount; i++) {
      const idx = Math.floor((i / colCount) * (dataLen * 0.6));
      const val = analyserData[idx] || 0;
      const activeRows = Math.floor((val / 255) * dotRows * settings.sensitivity);

      const x = i * (colWidth + spacing) + colWidth / 2;

      for (let r = 0; r < dotRows; r++) {
        const yOffset = r * (dotSize + 4);
        let y = 0;
        if (yPercent < 40) {
          y = midY + yOffset;
        } else if (yPercent > 65) {
          y = midY - yOffset;
        } else {
          y = midY - dotRows * (dotSize + 4) / 2 + yOffset;
        }

        const isActive = r < activeRows;

        ctx.beginPath();
        if (isActive) {
          ctx.fillStyle = r > dotRows * 0.8
            ? '#ef4444' // red caps
            : r > dotRows * 0.5
              ? '#fbbf24' // yellow middle
              : getDynamicColor(settings.primaryColor, settings.secondaryColor, i / colCount);
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.05;
        }

        ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

  } else if (settings.style === 'minimalist-pulse-dot') {
    // Minimalist Floating Pulse Dots (bass, mids, treble)
    ctx.save();
    const bands = [
      { label: 'BASS', start: 0, end: Math.max(1, Math.floor(dataLen * 0.05)) || 2, x: width * 0.2, color: settings.primaryColor },
      { label: 'LOW-MID', start: Math.max(1, Math.floor(dataLen * 0.05)) || 2, end: Math.max(2, Math.floor(dataLen * 0.18)) || 7, x: width * 0.4, color: settings.primaryColor },
      { label: 'HIGH-MID', start: Math.max(2, Math.floor(dataLen * 0.18)) || 7, end: Math.max(3, Math.floor(dataLen * 0.45)) || 17, x: width * 0.6, color: settings.secondaryColor },
      { label: 'TREBLE', start: Math.max(3, Math.floor(dataLen * 0.45)) || 17, end: Math.max(4, Math.floor(dataLen * 0.8)) || 30, x: width * 0.8, color: settings.secondaryColor }
    ];

    const timeSec = Date.now() * 0.001;

    bands.forEach((band, index) => {
      let sum = 0;
      const count = band.end - band.start;
      for (let i = band.start; i < band.end; i++) {
        sum += analyserData[i] || 0;
      }
      const avg = count > 0 ? sum / count : 0;
      const intensity = (avg / 255) * settings.sensitivity;

      const floatY = Math.sin(timeSec * 1.5 + index * 1.2) * 20;
      const orbY = midY + floatY;

      const baseRadius = 24 + beatIntensity * 4;
      const scale = 1 + intensity * 2.2;
      const activeRadius = baseRadius * scale;

      // Pulse glow gradient
      ctx.beginPath();
      const radialGrad = ctx.createRadialGradient(band.x, orbY, 1, band.x, orbY, activeRadius);
      const rgb = hexToRgb(band.color) || { r: 0, g: 255, b: 200 };
      radialGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
      radialGrad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
      radialGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = radialGrad;
      ctx.arc(band.x, orbY, activeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core anchor dot
      ctx.beginPath();
      ctx.arc(band.x, orbY, 6 + intensity * 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.95;
      ctx.fill();

      // Small glowing label
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(band.label, band.x, orbY + 45 + floatY * 0.15);
    });
    ctx.restore();
  } else if (settings.style === 'modern-sleek') {
    // Ultra-thin, smooth anti-aliased frequency neon lines with a subtle gradient glow.
    const steps = Math.min(128, dataLen);
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i < steps; i++) {
      // Smooth frequency indexing
      const idx = Math.floor(Math.pow(i / steps, 1.3) * (dataLen * 0.7));
      const val = analyserData[idx] || 0;
      const magnitude = (val / 255) * (height * 0.3) * settings.sensitivity;
      
      const x = (i / (steps - 1)) * width;
      let y = midY - magnitude;
      
      if (yPercent < 40) {
        y = midY + magnitude;
      } else if (placement === 'center') {
        y = midY - magnitude / 2;
      }
      points.push({ x, y });
    }
    
    ctx.save();
    
    // Subtle gradient glow
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, settings.primaryColor);
    grad.addColorStop(0.5, settings.secondaryColor || settings.primaryColor);
    grad.addColorStop(1, '#ffffff');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.0; // ultra-thin
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 8;
    ctx.shadowColor = settings.glowColor || settings.primaryColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.stroke();
    
    // Symmetrical mirror line
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (height - points[i].y + height - points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, height - points[i].y, xc, yc);
    }
    ctx.strokeStyle = settings.secondaryColor;
    ctx.lineWidth = 0.5; // even thinnner mirror line
    ctx.stroke();
    
    ctx.restore();
  } else if (settings.style === 'frequency-spectrogram') {
    const historyCount = spectrogramHistory.length;
    if (historyCount > 0) {
      const colCount = Math.min(80, dataLen);
      const cellW = width / colCount;
      
      const maxSpectrogramH = height * 0.45 * settings.sensitivity;
      const cellH = maxSpectrogramH / MAX_SPECTROGRAM_HISTORY;

      ctx.save();
      // Disable shadow blur for performance during high density cell rendering
      ctx.shadowBlur = 0; 

      for (let h = 0; h < historyCount; h++) {
        // ageRatio: 0.0 (oldest) to 1.0 (newest)
        const ageRatio = h / Math.max(1, historyCount - 1);
        const ageFade = Math.pow(ageRatio, 1.4); // exponential tail fade

        // Newest frames are drawn right at midY, older frames push away
        const yOffset = (historyCount - 1 - h) * cellH;

        for (let i = 0; i < colCount; i++) {
          const freqRatio = i / (colCount - 1);
          // Read from active audible frequencies (lower-mid 70% bounds)
          const dataIdx = Math.floor(freqRatio * (dataLen * 0.7));
          const val = spectrogramHistory[h][dataIdx] || 0;
          const ampRatio = val / 255;

          if (ampRatio < 0.02) continue; // skip near-silent pixels to save CPU cycles

          let cellColor = '';
          const opacity = ampRatio * ageFade;

          if (settings.colorMode === 'solid') {
            cellColor = settings.primaryColor;
          } else if (settings.colorMode === 'gradient') {
            // Dynamic Volume Amplitude gradient mapping
            cellColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, ampRatio);
          } else { // 'rainbow'
            // Classic science/thermal heatmap: low volume = dark purple-blue, high volume = hot yellow-red
            const hue = (1.0 - ampRatio) * 260;
            cellColor = `hsl(${Math.round(hue)}, 100%, ${Math.round(35 + ampRatio * 35)}%)`;
          }

          ctx.fillStyle = cellColor;
          ctx.globalAlpha = opacity;

          const drawW = Math.max(1, cellW - 0.5);
          const drawH = Math.max(1, cellH - 0.5);
          const x = i * cellW;

          if (placement === 'bottom') {
            const y = midY - yOffset - drawH;
            ctx.fillRect(x, y, drawW, drawH);
          } else if (placement === 'top') {
            const y = midY + yOffset;
            ctx.fillRect(x, y, drawW, drawH);
          } else {
            // Symmetrical double-mirrored waterfall cascade
            const yTop = midY - yOffset - drawH;
            const yBottom = midY + yOffset;
            ctx.fillRect(x, yTop, drawW, drawH);
            ctx.fillRect(x, yBottom, drawW, drawH);
          }
        }
      }
      ctx.restore();
    }
  } else if (settings.style === 'cyber-laser-horizon') {
    // Cyber Laser Horizon
    const startBin = Math.floor(dataLen * 0.35);
    const endBin = Math.floor(dataLen * 0.85);
    let midHighSum = 0;
    let count = 0;
    for (let i = startBin; i < endBin; i++) {
      midHighSum += analyserData[i] || 0;
      count++;
    }
    const midHighIntensity = (midHighSum / (count || 1)) / 255;

    ctx.save();
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 15;
    ctx.lineCap = 'round';

    const numLasers = 10;
    for (let i = 0; i < numLasers; i++) {
      const laserRatio = i / (numLasers - 1);
      const verticalOffset = (laserRatio - 0.5) * (height * 0.5);
      const currentY = midY + verticalOffset;

      const strokeW = 0.5 + midHighIntensity * (settings.lineThickness || 2) * 2.5;
      const alpha = 0.2 + midHighIntensity * 0.8;

      ctx.lineWidth = strokeW;
      const laserColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, laserRatio);
      ctx.strokeStyle = colorToRgba(laserColor, alpha);
      ctx.shadowColor = laserColor;

      ctx.beginPath();
      ctx.moveTo(centerX - width * 0.45, currentY);
      ctx.lineTo(centerX + width * 0.45, currentY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX, midY);
      ctx.lineTo(centerX + (laserRatio - 0.5) * width * 1.2, currentY);
      ctx.strokeStyle = colorToRgba(laserColor, alpha * 0.4);
      ctx.stroke();
    }
    ctx.restore();

  } else if (settings.style === 'neon-geometric-ring') {
    // Neon Geometric Ring
    const bassBins = Math.max(1, Math.floor(dataLen * 0.08));
    let bassSum = 0;
    for (let i = 0; i < bassBins; i++) {
      bassSum += analyserData[i] || 0;
    }
    const subBassFactor = bassSum / (bassBins * 255.0);

    ctx.save();
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 12;
    ctx.lineWidth = settings.lineThickness;

    const numRings = 5;
    const maxRadius = Math.min(width, height) * 0.4;
    const timeSec = Date.now() / 1000;

    for (let r = 1; r <= numRings; r++) {
      const ringRatio = r / numRings;
      const ringColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, ringRatio);
      ctx.strokeStyle = ringColor;
      ctx.shadowColor = ringColor;

      const baseRadius = maxRadius * ringRatio;
      const dynamicRadius = baseRadius + subBassFactor * 45;

      const segments = 4 + r * 2;
      const angleStep = (Math.PI * 2) / segments;
      const rotationOffset = timeSec * (r % 2 === 0 ? 0.4 : -0.4) * (1 + subBassFactor * 2);

      for (let s = 0; s < segments; s++) {
        const startAng = s * angleStep + rotationOffset;
        const dashArcLen = angleStep * 0.55;
        const endAng = startAng + dashArcLen;

        ctx.beginPath();
        ctx.arc(centerX, centerY, dynamicRadius, startAng, endAng);
        ctx.stroke();

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        const tickLength = 5 * ringRatio;
        const cos = Math.cos(startAng);
        const sin = Math.sin(startAng);
        ctx.beginPath();
        ctx.moveTo(centerX + cos * (dynamicRadius - tickLength), centerY + sin * (dynamicRadius - tickLength));
        ctx.lineTo(centerX + cos * (dynamicRadius + tickLength), centerY + sin * (dynamicRadius + tickLength));
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();

  } else if (settings.style === 'retro-arcade-stack') {
    // Retro Arcade Stack
    const numColumns = Math.min(32, dataLen);
    const gapX = settings.barSpacing !== undefined ? settings.barSpacing : 4;
    const totalSpacing = gapX * (numColumns - 1);
    const originalDrawW = (width - totalSpacing) / numColumns;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const drawW = originalDrawW * multiplier;
    const step = drawW + gapX;
    const totalWidth = numColumns * drawW + (numColumns - 1) * gapX;
    const startX = (width - totalWidth) / 2;

    ctx.save();
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 10;

    for (let c = 0; c < numColumns; c++) {
      const colRatio = c / (numColumns - 1);
      const freqIdx = Math.floor(colRatio * (dataLen * 0.75));
      const val = analyserData[freqIdx] || 0;
      const magnitude = (val / 255.0) * (height * 0.55) * settings.sensitivity;

      const x = startX + c * step;
      const numBlocks = 12;
      const blockH = Math.max(2, (height * 0.4) / numBlocks);
      const gapY = blockH * 0.25;
      const finalBlockH = blockH - gapY;

      const activeBlocks = Math.round((magnitude / (height * 0.5)) * numBlocks);

      for (let b = 0; b < numBlocks; b++) {
        const blockY = midY - (b * blockH);
        const isActive = b < activeBlocks;

        if (isActive) {
          const blockRatio = b / (numBlocks - 1);
          let blockColor = '';
          if (settings.colorMode === 'solid') {
            blockColor = settings.primaryColor;
          } else if (settings.colorMode === 'gradient') {
            blockColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, blockRatio);
          } else {
            blockColor = blockRatio < 0.4
              ? '#10b981'
              : blockRatio < 0.75
                ? '#eab308'
                : '#ef4444';
          }

          ctx.fillStyle = blockColor;
          ctx.shadowColor = blockColor;
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'transparent';
          ctx.globalAlpha = 0.05;
        }

        ctx.fillRect(x, blockY - finalBlockH, drawW, finalBlockH);
      }
    }
    ctx.restore();

  } else if (settings.style === 'prism-laser-scanner') {
    // Prism Laser Scanner
    const timeSec = Date.now() / 1000;
    const isTransient = beatIntensity > 0.22;

    ctx.save();
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 15;
    ctx.lineWidth = settings.lineThickness;

    const leftX = 0;
    const leftY = 0;
    const rightX = width;
    const rightY = 0;

    const numLaserBeams = 12;
    for (let i = 0; i < numLaserBeams; i++) {
      const laserRatio = i / (numLaserBeams - 1);
      const sweepAngle = Math.sin(timeSec * 0.8 + laserRatio * Math.PI) * 0.48 + 0.5;

      const targetX = width * sweepAngle;
      const targetY = height * 0.9;

      const baseColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, laserRatio);

      const drawBeams = (anchorX: number, anchorY: number) => {
        if (isTransient) {
          ctx.strokeStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(anchorX - 3, anchorY);
          ctx.lineTo(targetX - 7 * (laserRatio - 0.5), targetY);
          ctx.stroke();

          ctx.strokeStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          ctx.strokeStyle = '#3b82f6';
          ctx.shadowColor = '#3b82f6';
          ctx.beginPath();
          ctx.moveTo(anchorX + 3, anchorY);
          ctx.lineTo(targetX + 7 * (laserRatio - 0.5), targetY);
          ctx.stroke();
        } else {
          ctx.strokeStyle = baseColor;
          ctx.shadowColor = baseColor;
          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
        }
      };

      drawBeams(leftX, leftY);
      drawBeams(rightX, rightY);
    }
    ctx.restore();

  } else if (settings.style === 'floating-wave-echo') {
    // Floating Wave Echo
    const steps = Math.min(64, dataLen);
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < steps; i++) {
      const idx = Math.floor((i / steps) * dataLen * 0.8);
      const val = waveformData[idx] || 128;
      const amp = (val - 128) / 128;
      const magnitude = amp * (height * 0.28) * settings.sensitivity;

      const x = (i / (steps - 1)) * width;
      const y = midY + magnitude;
      points.push({ x, y });
    }

    if (points.length > 0) {
      floatingWaveHistory.push({
        path: points,
        opacity: 0.5,
        yShift: 0
      });
    }

    if (floatingWaveHistory.length > 8) {
      floatingWaveHistory.shift();
    }

    ctx.save();
    ctx.shadowBlur = 0;

    for (let h = 0; h < floatingWaveHistory.length - 1; h++) {
      const frame = floatingWaveHistory[h];
      frame.opacity *= 0.90;
      frame.yShift -= 2.5;

      if (frame.opacity < 0.05) continue;

      ctx.save();
      const trailColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, h / floatingWaveHistory.length);
      ctx.fillStyle = colorToRgba(trailColor, frame.opacity * 0.3);
      ctx.strokeStyle = colorToRgba(trailColor, frame.opacity * 0.5);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(frame.path[0].x, frame.path[0].y + frame.yShift);
      for (let i = 0; i < frame.path.length - 1; i++) {
        const xc = (frame.path[i].x + frame.path[i + 1].x) / 2;
        const yc = (frame.path[i].y + frame.path[i + 1].y) / 2 + frame.yShift;
        ctx.quadraticCurveTo(frame.path[i].x, frame.path[i].y + frame.yShift, xc, yc);
      }
      ctx.lineTo(width, midY + frame.yShift);
      ctx.lineTo(0, midY + frame.yShift);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const currentTrailColor = settings.primaryColor;
    ctx.fillStyle = colorToRgba(currentTrailColor, 0.45);
    ctx.strokeStyle = currentTrailColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength : 12;
    ctx.shadowColor = currentTrailColor;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(width, midY);
    ctx.lineTo(0, midY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (settings.style === 'digital-matrix-blocks') {
    // Digital Matrix Blocks vertical segments
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(48, dataLen);
    const totalBars = barCount;
    const spacing = settings.barSpacing !== undefined ? settings.barSpacing : 4;
    const totalSpacing = spacing * (totalBars - 1);
    const originalBarWidth = (width - totalSpacing) / totalBars;
    const multiplier = (settings.lineThickness !== undefined ? settings.lineThickness : 3) / 3;
    const computedBarWidth = originalBarWidth * multiplier;
    const step = computedBarWidth + spacing;
    const totalWidth = totalBars * computedBarWidth + (totalBars - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    
    const blockHeight = Math.max(2, computedBarWidth * 0.82); // Height of each block segment
    const blockGap = Math.max(1, computedBarWidth * 0.35); // Gap between each block segment
    
    const maxIdx = Math.floor(dataLen * 0.65);
    for (let i = 0; i < totalBars; i++) {
      const idx = Math.floor(Math.pow(i / totalBars, 1.2) * maxIdx);
      const rawValue = analyserData[idx] || 0;
      // High-Frequency Equalization Gain
      const value = Math.min(255, rawValue * (1 + (i / totalBars) * 1.5));
      const barHeight = (value / 255) * (height * 0.65) * settings.sensitivity + 4;
      
      const x = startX + i * step;
      const numberOfBlocks = Math.max(1, Math.floor(barHeight / (blockHeight + blockGap)));
      
      ctx.fillStyle = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / totalBars);
      
      for (let b = 0; b < numberOfBlocks; b++) {
        const blockY = midY - (b * (blockHeight + blockGap)) - blockHeight;
        ctx.beginPath();
        ctx.rect(x, blockY, computedBarWidth, blockHeight);
        ctx.fill();
      }
    }

  } else if (settings.style === 'plasma-glow-ribbon') {
    // Plasma Glow Ribbon bezier path with intense neon aura
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = settings.primaryColor;
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness * 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    const sliceWidth = width / (dataLen - 1);
    
    // Points array for easier bezier calculation
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < dataLen; i++) {
      const v = waveformData[i] / 128.0; 
      const y = (v * (height / 3.3)) * settings.sensitivity + midY - (height / 6.6);
      points.push({ x: i * sliceWidth, y });
    }
    
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // Curve through last point
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
      ctx.stroke();
    }
    ctx.restore();

  } else if (settings.style === 'concentric-dual-radials') {
    // Concentric Dual Radials rings for bass and midrange
    ctx.save();
    
    // 1. Calculate Bass (outer ring) and Vocal (inner ring) averages
    let bassSum = 0;
    let bassCount = 0;
    const bassLimit = Math.floor(dataLen * 0.15);
    for (let i = 0; i < bassLimit; i++) {
      bassSum += analyserData[i] || 0;
      bassCount++;
    }
    const avgBass = bassCount > 0 ? (bassSum / bassCount) / 255 : 0;
    
    let vocalSum = 0;
    let vocalCount = 0;
    const vocalStart = Math.floor(dataLen * 0.15);
    const vocalEnd = Math.floor(dataLen * 0.55);
    for (let i = vocalStart; i < vocalEnd; i++) {
      vocalSum += analyserData[i] || 0;
      vocalCount++;
    }
    const avgVocal = vocalCount > 0 ? (vocalSum / vocalCount) / 255 : 0;
    
    // Radii calculation
    const baseInnerRadius = Math.min(width, height) * 0.15;
    const baseOuterRadius = Math.min(width, height) * 0.28;
    
    const innerRadius = baseInnerRadius + avgVocal * (Math.min(width, height) * 0.12) * settings.sensitivity;
    const outerRadius = baseOuterRadius + avgBass * (Math.min(width, height) * 0.18) * settings.sensitivity;
    
    const ptsCount = 120;
    
    // Inner Ring (Vocal)
    ctx.strokeStyle = settings.secondaryColor;
    ctx.lineWidth = settings.lineThickness;
    ctx.shadowBlur = settings.glowStrength || 10;
    ctx.shadowColor = settings.secondaryColor;
    ctx.beginPath();
    for (let i = 0; i <= ptsCount; i++) {
      const angle = (i / ptsCount) * Math.PI * 2;
      // Add a beautiful audio-reactive micro-jitter to ring vertices using waveform lookup
      const waveIdx = Math.floor((i / ptsCount) * dataLen * 0.3) + vocalStart;
      const waveVal = (waveformData[waveIdx % dataLen] || 128) - 128;
      const radJitter = (waveVal / 128) * 12 * settings.sensitivity * avgVocal;
      
      const r = innerRadius + radJitter;
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Outer Ring (Bass)
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness * 1.3;
    ctx.shadowColor = settings.primaryColor;
    ctx.beginPath();
    for (let i = 0; i <= ptsCount; i++) {
      const angle = (i / ptsCount) * Math.PI * 2;
      const waveIdx = Math.floor((i / ptsCount) * dataLen * 0.2);
      const waveVal = (waveformData[waveIdx % dataLen] || 128) - 128;
      const radJitter = (waveVal / 128) * 22 * settings.sensitivity * avgBass;
      
      const r = outerRadius + radJitter;
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();

  } else if (settings.style === 'shaded-mirror-silhouette') {
    // Shaded Mirror Silhouette filled custom linear gradient
    ctx.save();
    const step = Math.max(1, Math.floor(dataLen / 120));
    const points: { x: number; yTop: number; yBottom: number }[] = [];
    
    for (let i = 0; i < dataLen; i += step) {
      const val = waveformData[i] || 128;
      const hVal = ((val - 128) / 128) * (height * 0.28) * settings.sensitivity;
      const x = (i / (dataLen - 1)) * width;
      points.push({ x, yTop: midY - hVal, yBottom: midY + hVal });
    }
    
    if (points.length > 0) {
      const rgb1 = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
      const rgb2 = hexToRgb(settings.secondaryColor) || { r: 255, g: 0, b: 128 };
      
      const gradient = ctx.createLinearGradient(0, midY - height * 0.35, 0, midY + height * 0.35);
      gradient.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.40)`);
      gradient.addColorStop(0.5, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.15)`);
      gradient.addColorStop(1, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.40)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yTop);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yTop);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(points[i].x, points[i].yBottom);
      }
      ctx.closePath();
      ctx.fill();
      
      // Draw subtle glowing outlines
      ctx.strokeStyle = `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.8)`;
      ctx.lineWidth = settings.lineThickness;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yTop);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yTop);
      }
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.8)`;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yBottom);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yBottom);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (settings.style === 'reflected-glow-ribbon') {
    // Reflected Glow Ribbon: draw active curvy path, then its vertical mirror with gradient alpha
    ctx.save();
    
    // Points array for bezier curve
    const points: { x: number; yOffset: number }[] = [];
    const sliceWidth = width / (dataLen - 1);
    for (let i = 0; i < dataLen; i++) {
      const v = waveformData[i] / 128.0; 
      const yOffset = (v - 1.0) * (height * 0.25) * settings.sensitivity;
      points.push({ x: i * sliceWidth, yOffset });
    }

    if (points.length > 0) {
      // 1. Draw top glowing ribbon
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = settings.primaryColor;
      ctx.strokeStyle = settings.primaryColor;
      ctx.lineWidth = settings.lineThickness * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, midY + points[0].yOffset);
      for (let i = 0; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (midY + points[i].yOffset + midY + points[i + 1].yOffset) / 2;
        ctx.quadraticCurveTo(points[i].x, midY + points[i].yOffset, xc, yc);
      }
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        midY + points[points.length - 2].yOffset,
        points[points.length - 1].x,
        midY + points[points.length - 1].yOffset
      );
      ctx.stroke();
      ctx.restore();

      // 2. Draw inverted mirror counterpart with fading transparency gradient
      ctx.save();
      // No extreme neon shadow blur on reflection, just smooth fade
      ctx.lineWidth = settings.lineThickness * 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const reflexGrad = ctx.createLinearGradient(0, midY, 0, height);
      const rgb = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
      reflexGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);
      reflexGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);
      ctx.strokeStyle = reflexGrad;

      ctx.beginPath();
      // Invert Y offset by multiplying by -1
      ctx.moveTo(points[0].x, midY - points[0].yOffset);
      for (let i = 0; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (midY - points[i].yOffset + midY - points[i + 1].yOffset) / 2;
        ctx.quadraticCurveTo(points[i].x, midY - points[i].yOffset, xc, yc);
      }
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        midY - points[points.length - 2].yOffset,
        points[points.length - 1].x,
        midY - points[points.length - 1].yOffset
      );
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

  } else if (settings.style === 'reflected-matrix-dots') {
    // Reflected Matrix Dots: Rows of discrete vertical dots, mirrored downwards with fading opacity
    ctx.save();
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(48, dataLen);
    
    const totalBars = barCount;
    const computedBarWidth = (width / totalBars) * 0.8;
    const spacing = (width / totalBars) * 0.2;
    
    const dotRadius = Math.max(1.5, computedBarWidth * 0.45);
    const dotGap = Math.max(2, computedBarWidth * 0.4);
    
    const rgbPrimary = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
    const rgbSecondary = hexToRgb(settings.secondaryColor) || { r: 255, g: 0, b: 128 };

    const maxIdx = Math.floor(dataLen * 0.65);
    for (let i = 0; i < totalBars; i++) {
      const idx = Math.floor(Math.pow(i / totalBars, 1.2) * maxIdx);
      const rawValue = analyserData[idx] || 0;
      // High-Frequency Equalization Gain
      const value = Math.min(255, rawValue * (1 + (i / totalBars) * 1.5));
      const barHeight = (value / 255) * (height * 0.45) * settings.sensitivity + 4;
      
      const x = i * (computedBarWidth + spacing) + computedBarWidth / 2;
      const dotCount = Math.max(1, Math.floor(barHeight / (dotRadius * 2 + dotGap)));
      
      const interpolationRatio = i / totalBars;
      const r = Math.round(rgbPrimary.r + (rgbSecondary.r - rgbPrimary.r) * interpolationRatio);
      const g = Math.round(rgbPrimary.g + (rgbSecondary.g - rgbPrimary.g) * interpolationRatio);
      const b = Math.round(rgbPrimary.b + (rgbSecondary.b - rgbPrimary.b) * interpolationRatio);

      // Top dots (above baseline)
      for (let dotIdx = 0; dotIdx < dotCount; dotIdx++) {
        const y = midY - (dotIdx * (dotRadius * 2 + dotGap)) - dotRadius;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.shadowBlur = settings.glowStrength || 8;
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
      }

      // Bottom reflected dots (below baseline) with progressively decreasing opacity
      for (let dotIdx = 0; dotIdx < dotCount; dotIdx++) {
        const y = midY + (dotIdx * (dotRadius * 2 + dotGap)) + dotRadius;
        const opacity = Math.max(0, 0.6 * (1.0 - dotIdx / dotCount));
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.shadowBlur = 0; // No shadow for reflections to maintain clean aesthetics
        ctx.fill();
      }
    }
    ctx.restore();

  } else if (settings.style === 'reflected-mountain-silhouette') {
    // Reflected Mountain Silhouette: Filled area silhouette gradient, with a flipped 0.35 opacity reflection below
    ctx.save();
    const step = Math.max(1, Math.floor(dataLen / 120));
    const points: { x: number; yTopOffset: number }[] = [];
    
    for (let i = 0; i < dataLen; i += step) {
      const val = waveformData[i] || 128;
      const yOffset = ((val - 128) / 128) * (height * 0.3) * settings.sensitivity;
      const x = (i / (dataLen - 1)) * width;
      points.push({ x, yTopOffset: yOffset });
    }
    
    if (points.length > 0) {
      const rgb1 = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
      const rgb2 = hexToRgb(settings.secondaryColor) || { r: 255, g: 0, b: 128 };
      
      // 1. Draw top mountain structure
      const topGrad = ctx.createLinearGradient(0, midY - height * 0.35, 0, midY);
      topGrad.addColorStop(0, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.75)`);
      topGrad.addColorStop(1, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.1)`);
      
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, midY - points[i].yTopOffset);
      }
      ctx.lineTo(width, midY);
      ctx.closePath();
      ctx.fill();

      // Subtle mountain top line
      ctx.strokeStyle = settings.primaryColor;
      ctx.lineWidth = settings.lineThickness;
      ctx.beginPath();
      ctx.moveTo(points[0].x, midY - points[0].yTopOffset);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, midY - points[i].yTopOffset);
      }
      ctx.stroke();

      // 2. Draw mirrored bottom mountain reflection with fixed translucent opacity 0.35
      const bottomGrad = ctx.createLinearGradient(0, midY, 0, midY + height * 0.35);
      bottomGrad.addColorStop(0, `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.35)`);
      bottomGrad.addColorStop(1, `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, 0.0)`);
      
      ctx.fillStyle = bottomGrad;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      for (let i = 0; i < points.length; i++) {
        // Mirrored below horizontal axis: midY + yTopOffset
        ctx.lineTo(points[i].x, midY + points[i].yTopOffset);
      }
      ctx.lineTo(width, midY);
      ctx.closePath();
      ctx.fill();

      // Mirrored mountain bottom line with 0.35 opacity
      ctx.strokeStyle = `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, 0.35)`;
      ctx.lineWidth = settings.lineThickness;
      ctx.beginPath();
      ctx.moveTo(points[0].x, midY + points[0].yTopOffset);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, midY + points[i].yTopOffset);
      }
      ctx.stroke();
    }
    ctx.restore();

  } else if (settings.style === 'reflected-center-split-pins') {
    // Reflected Center-Split Pins: dynamic high-density lines shooting upward and downward symmetrically with a reflection alpha mask on the bottom half
    ctx.save();
    
    const pinCount = Math.min(120, dataLen);
    const totalBars = pinCount;
    const computedBarWidth = (width / totalBars) * 0.8;
    const spacing = (width / totalBars) * 0.2;
    
    const maxIdx = Math.floor(dataLen * 0.65);
    // Draw the pins
    for (let i = 0; i < totalBars; i++) {
      const idx = Math.floor(Math.pow(i / totalBars, 1.2) * maxIdx);
      const rawValue = analyserData[idx] || 0;
      // High-Frequency Equalization Gain
      const value = Math.min(255, rawValue * (1 + (i / totalBars) * 1.5));
      const pinLength = (value / 255) * (height * 0.35) * settings.sensitivity + 2;
      const x = i * (computedBarWidth + spacing) + computedBarWidth / 2;
      
      const pinColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / totalBars);
      
      // Top pins (glowing pins shooting upward)
      ctx.beginPath();
      ctx.moveTo(x, midY);
      ctx.lineTo(x, midY - pinLength);
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = Math.max(1.0, computedBarWidth);
      ctx.shadowBlur = settings.glowStrength || 4;
      ctx.shadowColor = pinColor;
      ctx.stroke();
      
      // Bottom pins (mirrored downward)
      ctx.beginPath();
      ctx.moveTo(x, midY);
      ctx.lineTo(x, midY + pinLength);
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = Math.max(1.0, computedBarWidth);
      ctx.shadowBlur = 0; // Disable shadow on mirror reflection
      ctx.stroke();
    }
    
    // Layer a secondary full-width alpha mask over the lower half
    const alphaMaskGrad = ctx.createLinearGradient(0, midY, 0, height);
    // Mask color blending into dark studio background
    alphaMaskGrad.addColorStop(0, 'rgba(10, 10, 15, 0.25)');
    alphaMaskGrad.addColorStop(0.5, 'rgba(10, 10, 15, 0.65)');
    alphaMaskGrad.addColorStop(1, 'rgba(10, 10, 15, 0.95)');
    
    ctx.fillStyle = alphaMaskGrad;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.rect(0, midY, width, height - midY);
    ctx.fill();
    
    ctx.restore();

  } else if (settings.style === 'reflected-radial-ring-horizon') {
    // Reflected Radial Ring Horizon: Radial ring centered at baseline, top half normal, bottom half clipped and mirrored down
    ctx.save();
    
    // 1. Calculate overall midrange volume
    let waveSum = 0;
    const waveLimit = Math.floor(dataLen * 0.6);
    for (let i = 0; i < waveLimit; i++) {
      waveSum += analyserData[i] || 0;
    }
    const volumeCoeff = (waveSum / Math.max(1, waveLimit)) / 255;
    
    const baseRadius = Math.min(width, height) * 0.22;
    const activeRadius = baseRadius + volumeCoeff * (Math.min(width, height) * 0.12) * settings.sensitivity;
    
    const ptsCount = 180;
    const ringPoints: { x: number; y: number }[] = [];
    
    // Build the radial coordinate ring points
    for (let i = 0; i <= ptsCount; i++) {
      const angle = (i / ptsCount) * Math.PI * 2;
      // Get waveform coordinate offset to create dynamic bumpy radial lines
      const waveIdx = Math.floor((i / ptsCount) * dataLen * 0.4);
      const waveValue = (waveformData[waveIdx % dataLen] || 128) - 128;
      const offsetRadius = (waveValue / 128) * 35 * settings.sensitivity * (0.3 + 0.7 * volumeCoeff);
      
      const r = activeRadius + offsetRadius;
      const px = centerX + Math.cos(angle) * r;
      const py = midY + Math.sin(angle) * r; // Centered precisely on the baseline horizon (midY)
      ringPoints.push({ x: px, y: py });
    }
    
    // Draw Top Half (y <= midY)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, midY);
    ctx.clip(); // Limit drawing strictly to the upper horizon
    
    ctx.beginPath();
    ctx.moveTo(ringPoints[0].x, ringPoints[0].y);
    for (let i = 1; i < ringPoints.length; i++) {
      ctx.lineTo(ringPoints[i].x, ringPoints[i].y);
    }
    ctx.strokeStyle = settings.primaryColor;
    ctx.lineWidth = settings.lineThickness * 1.2;
    ctx.shadowBlur = settings.glowStrength || 15;
    ctx.shadowColor = settings.primaryColor;
    ctx.stroke();
    ctx.restore();
    
    // Draw Bottom Half (which is a mirrored counterpart reflecting straight down into floor boundary)
    // To mirror the top half straight down below midY:
    // If a top point has y = midY - dy, its mirrored point has yRef = midY + dy.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, midY, width, height - midY);
    ctx.clip(); // Limit drawing strictly to the lower horizon
    
    ctx.beginPath();
    const firstPointYDiff = ringPoints[0].y - midY;
    ctx.moveTo(ringPoints[0].x, midY - firstPointYDiff);
    for (let i = 1; i < ringPoints.length; i++) {
      const yDiff = ringPoints[i].y - midY;
      ctx.lineTo(ringPoints[i].x, midY - yDiff);
    }
    
    // Gradient reflection stroke
    const reflectionGrad = ctx.createLinearGradient(0, midY, 0, height);
    const rgb = hexToRgb(settings.primaryColor) || { r: 0, g: 255, b: 200 };
    reflectionGrad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);
    reflectionGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.0)`);
    
    ctx.strokeStyle = reflectionGrad;
    ctx.lineWidth = settings.lineThickness;
    ctx.shadowBlur = 0; // Disable shadow on bottom reflection
    ctx.stroke();
    ctx.restore();
    
    // Draw elegant baseline horizon wire
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    
    ctx.restore();
  } else if (settings.style === 'bouncing-circles') {
    // Discrete Circle Array bouncing UP/DOWN to frequency bins
    const barCount = settings.barFrequencyCount !== undefined && settings.barFrequencyCount > 0
      ? Math.min(settings.barFrequencyCount, dataLen)
      : Math.min(64, dataLen);
    const totalCircles = barCount;
    const step = (width - 40) / totalCircles;
    const startX = 20 + step / 2;

    const baseThicknessMultiplier = settings.lineThickness !== undefined ? settings.lineThickness : 2;
    const circleRadius = Math.max(1, baseThicknessMultiplier * 2.5);

    const maxIdx = Math.floor(dataLen * 0.65);
    const baselineY = midY;
    const isTopAligned = yPercent < 40;

    for (let i = 0; i < totalCircles; i++) {
      const idx = Math.floor(Math.pow(i / totalCircles, 1.1) * maxIdx);
      const rawValue = analyserData[idx] || 0;
      const value = Math.min(255, rawValue * (1 + (i / totalCircles) * 1.5));
      const targetHeight = (value / 255) * (height * 0.4) * settings.sensitivity;

      let targetY = baselineY - targetHeight;
      if (isTopAligned) {
        targetY = baselineY + targetHeight;
      }

      if (!bouncingCirclesCache[i]) {
        bouncingCirclesCache[i] = {
          currentY: baselineY,
          velocity: 0,
          currentOpacity: 0.0
        };
      }
      const state = bouncingCirclesCache[i];

      // Determine movement compared to baseline
      const targetDisplacement = targetHeight;
      const currentDisplacement = Math.abs(state.currentY - baselineY);

      const springStiffness = 0.16; // Elastic spring stiffness
      const springDamping = 0.82;   // Physical damping/friction multiplier

      if (targetDisplacement > currentDisplacement) {
        // High-energy snap response on sudden audio/frequency volume peaks
        const diffY = targetY - state.currentY;
        state.velocity += diffY * 0.38; // Rapidly accelerate up
        state.currentY += state.velocity;
        state.currentOpacity = Math.min(1.0, state.currentOpacity + 0.35);
      } else {
        // Fluid spring-damping harmonic oscillation to drop down and bounce settling transitions
        const forceY = (targetY - state.currentY) * springStiffness;
        state.velocity = (state.velocity + forceY) * springDamping;
        state.currentY += state.velocity;
        
        // Solid fluid decay on opacity to prevent trail clutter and maintain a responsive look
        state.currentOpacity = Math.max(0, state.currentOpacity * 0.90 - 0.015);
      }

      const circleColor = getDynamicColor(settings.primaryColor, settings.secondaryColor, i / totalCircles);
      const x = startX + i * step;

      const drawCircle = (cX: number, cY: number, r: number, alpha: number, col: string) => {
        if (alpha <= 0) return;
        ctx.beginPath();
        ctx.arc(cX, cY, r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = settings.glowColor || col;
        ctx.shadowBlur = settings.glowStrength !== undefined ? settings.glowStrength * 3 : 15;
        ctx.fill();
        ctx.restore();
      };

      // Render main circle
      drawCircle(x, state.currentY, circleRadius, state.currentOpacity, circleColor);

      // Render vertical symmetrical pair when Mirror Mode is active
      if (settings.mirrorMode) {
        const mirroredY = baselineY + (baselineY - state.currentY);
        drawCircle(x, mirroredY, circleRadius, state.currentOpacity, circleColor);
      }
    }
  }

    ctx.restore();
  });

  ctx.restore();

  // Apply Mirror Mode if enabled to reflect the visualizer
  if (settings.mirrorMode) {
    const axis = settings.mirrorAxis || 'vertical';
    const symmetry = Math.max(1, Math.min(8, settings.symmetryMultiplier || 1));

    // 1. Mirror across vertical axis (horizontal reflection left/right)
    if (axis === 'vertical' || axis === 'both') {
      const segmentWidth = Math.floor(width / (2 * symmetry));
      if (segmentWidth > 0) {
        if (!mirrorOffscreenCanvas) {
          mirrorOffscreenCanvas = document.createElement('canvas');
        }
        if (mirrorOffscreenCanvas.width !== segmentWidth || mirrorOffscreenCanvas.height !== height) {
          mirrorOffscreenCanvas.width = segmentWidth;
          mirrorOffscreenCanvas.height = height;
        }
        mirrorOffscreenCtx = mirrorOffscreenCanvas.getContext('2d');
        if (mirrorOffscreenCtx) {
          mirrorOffscreenCtx.clearRect(0, 0, segmentWidth, height);
          mirrorOffscreenCtx.drawImage(ctx.canvas, 0, 0, segmentWidth, height, 0, 0, segmentWidth, height);
          
          if (settings.symmetryColorInversion) {
            if (!mirrorInvertedOffscreenCanvas) {
              mirrorInvertedOffscreenCanvas = document.createElement('canvas');
            }
            if (mirrorInvertedOffscreenCanvas.width !== segmentWidth || mirrorInvertedOffscreenCanvas.height !== height) {
              mirrorInvertedOffscreenCanvas.width = segmentWidth;
              mirrorInvertedOffscreenCanvas.height = height;
            }
            mirrorInvertedOffscreenCtx = mirrorInvertedOffscreenCanvas.getContext('2d');
            if (mirrorInvertedOffscreenCtx) {
              mirrorInvertedOffscreenCtx.clearRect(0, 0, segmentWidth, height);
              mirrorInvertedOffscreenCtx.drawImage(mirrorOffscreenCanvas, 0, 0, segmentWidth, height, 0, 0, segmentWidth, height);
              const imgData = mirrorInvertedOffscreenCtx.getImageData(0, 0, segmentWidth, height);
              swapPrimarySecondaryPixels(imgData.data, imgData.data.length, settings.primaryColor, settings.secondaryColor);
              mirrorInvertedOffscreenCtx.putImageData(imgData, 0, 0);
            }
          }

          // Clear the canvas to the right of the first segment
          ctx.clearRect(segmentWidth, 0, width - segmentWidth, height);
          
          // Populate the remaining segments across the canvas with alternating orientations
          ctx.save();
          if (settings.mirrorOpacity !== undefined) {
            ctx.globalAlpha = settings.mirrorOpacity / 100;
          }
          for (let i = 1; i < 2 * symmetry; i++) {
            const x = i * segmentWidth;
            if (i % 2 === 0) {
              // Draw normal
              ctx.drawImage(mirrorOffscreenCanvas, 0, 0, segmentWidth, height, x, 0, segmentWidth, height);
            } else {
              // Draw mirrored (and color-inverted if enabled)
              const sourceCanvas = settings.symmetryColorInversion && mirrorInvertedOffscreenCanvas
                ? mirrorInvertedOffscreenCanvas
                : mirrorOffscreenCanvas;
              ctx.save();
              ctx.translate(x + segmentWidth, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(sourceCanvas, 0, 0, segmentWidth, height, 0, 0, segmentWidth, height);
              ctx.restore();
            }
          }
          ctx.restore();
        }
      }
    }

    // 2. Mirror across horizontal axis (vertical reflection top/bottom)
    if (axis === 'horizontal' || axis === 'both') {
      const segmentHeight = Math.floor(height / (2 * symmetry));
      if (segmentHeight > 0) {
        if (!mirrorOffscreenCanvasY) {
          mirrorOffscreenCanvasY = document.createElement('canvas');
        }
        if (mirrorOffscreenCanvasY.width !== width || mirrorOffscreenCanvasY.height !== segmentHeight) {
          mirrorOffscreenCanvasY.width = width;
          mirrorOffscreenCanvasY.height = segmentHeight;
        }
        mirrorOffscreenCtxY = mirrorOffscreenCanvasY.getContext('2d');
        if (mirrorOffscreenCtxY) {
          mirrorOffscreenCtxY.clearRect(0, 0, width, segmentHeight);
          mirrorOffscreenCtxY.drawImage(ctx.canvas, 0, 0, width, segmentHeight, 0, 0, width, segmentHeight);
          
          if (settings.symmetryColorInversion) {
            if (!mirrorInvertedOffscreenCanvasY) {
              mirrorInvertedOffscreenCanvasY = document.createElement('canvas');
            }
            if (mirrorInvertedOffscreenCanvasY.width !== width || mirrorInvertedOffscreenCanvasY.height !== segmentHeight) {
              mirrorInvertedOffscreenCanvasY.width = width;
              mirrorInvertedOffscreenCanvasY.height = segmentHeight;
            }
            mirrorInvertedOffscreenCtxY = mirrorInvertedOffscreenCanvasY.getContext('2d');
            if (mirrorInvertedOffscreenCtxY) {
              mirrorInvertedOffscreenCtxY.clearRect(0, 0, width, segmentHeight);
              mirrorInvertedOffscreenCtxY.drawImage(mirrorOffscreenCanvasY, 0, 0, width, segmentHeight, 0, 0, width, segmentHeight);
              const imgData = mirrorInvertedOffscreenCtxY.getImageData(0, 0, width, segmentHeight);
              swapPrimarySecondaryPixels(imgData.data, imgData.data.length, settings.primaryColor, settings.secondaryColor);
              mirrorInvertedOffscreenCtxY.putImageData(imgData, 0, 0);
            }
          }

          // Clear the canvas below the first segment
          ctx.clearRect(0, segmentHeight, width, height - segmentHeight);
          
          // Populate the remaining segments down the canvas with alternating orientations
          ctx.save();
          if (settings.mirrorOpacity !== undefined) {
            ctx.globalAlpha = settings.mirrorOpacity / 100;
          }
          for (let i = 1; i < 2 * symmetry; i++) {
            const y = i * segmentHeight;
            if (i % 2 === 0) {
              // Draw normal
              ctx.drawImage(mirrorOffscreenCanvasY, 0, 0, width, segmentHeight, 0, y, width, segmentHeight);
            } else {
              // Draw mirrored vertically (and color-inverted if enabled)
              const sourceCanvas = settings.symmetryColorInversion && mirrorInvertedOffscreenCanvasY
                ? mirrorInvertedOffscreenCanvasY
                : mirrorOffscreenCanvasY;
              ctx.save();
              ctx.translate(0, y + segmentHeight);
              ctx.scale(1, -1);
              ctx.drawImage(sourceCanvas, 0, 0, width, segmentHeight, 0, 0, width, segmentHeight);
              ctx.restore();
            }
          }
          ctx.restore();
        }
      }
    }
  }

  // Periodic digital glitch distortion synced with high-frequency audio bands
  if (settings.glitchFrequency && settings.glitchFrequency > 0) {
    // Calculate average high/treble frequencies to trigger distortion
    let highFreqSum = 0;
    const highFreqStart = Math.floor(dataLen * 0.7);
    let highFreqCount = 0;
    for (let i = highFreqStart; i < dataLen; i++) {
      highFreqSum += analyserData[i] || 0;
      highFreqCount++;
    }
    const avgHighFreq = highFreqSum / (highFreqCount || 1);

    // Filter threshold: glitch spikes are sync'd to prominent treble hits
    const rawThreshold = 30; // base floor
    if (avgHighFreq > rawThreshold) {
      // Periodic trigger chance scales with glitchFrequency slider
      const glitchChance = (settings.glitchFrequency / 100) * ((avgHighFreq - rawThreshold) / (255 - rawThreshold)) * 0.5;
      if (Math.random() < glitchChance) {
        ctx.save();
        
        // Horizontal slicing displacements (slice whole lines and drift horizontally)
        const numSlices = Math.floor(3 + Math.random() * 6);
        for (let i = 0; i < numSlices; i++) {
          const sy = Math.random() * height;
          const sh = 4 + Math.random() * 25; // height of the glitch slice
          const dispX = (Math.random() - 0.5) * 45 * (settings.glitchFrequency / 20); // horizontal displacement

          ctx.drawImage(ctx.canvas, 0, sy, width, sh, dispX, sy, width, sh);
        }

        // Draw digital block or static elements occasionally
        if (Math.random() < 0.3) {
          ctx.fillStyle = Math.random() > 0.5 ? settings.primaryColor : settings.secondaryColor;
          ctx.globalAlpha = 0.15 + Math.random() * 0.25;
          ctx.fillRect(
            Math.random() * width * 0.8,
            Math.random() * height * 0.8,
            80 + Math.random() * 200,
            1 + Math.random() * 8
          );
        }

        ctx.restore();
      }
    }
  }

  // Copy the completed visualizer from offscreen canvas onto the main canvas with global offset translation
  const defaultXPercentForOffset = 50;
  const placementForOffset = settings.placement || 'bottom';
  const defaultYPercentForOffset = placementForOffset === 'top' ? 25 : placementForOffset === 'bottom' ? 75 : 50;

  const xPercentForOffset = settings.waveformOffsetX !== undefined ? settings.waveformOffsetX : 50;
  const yPercentForOffset = settings.waveformOffsetY !== undefined ? settings.waveformOffsetY : defaultYPercentForOffset;

  const shiftX = width * (xPercentForOffset - defaultXPercentForOffset) / 100;
  const shiftY = height * (yPercentForOffset - defaultYPercentForOffset) / 100;

  mainCtx.save();
  mainCtx.translate(shiftX, shiftY);

  // Apply MAX LINE WIDTH / HORIZONTAL SCALE (Slider 2) centered on the canvas width
  const hScale = settings.horizontalScale !== undefined ? settings.horizontalScale : 1.0;
  if (hScale !== 1.0) {
    mainCtx.translate(width / 2, 0);
    mainCtx.scale(hScale, 1.0);
    mainCtx.translate(-width / 2, 0);
  }

  mainCtx.drawImage(visualizerWavesCanvas, 0, 0);
  mainCtx.restore();
}

// DRAW TEXT OVERLAYS
export function drawTitleOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: TitleOverlaySettings,
  audioDuration: number,
  currentTime: number,
  visualsSettings?: VisualizerSettings,
  analyserData?: Uint8Array
) {
  if (!settings.visible || (!settings.text && !settings.artist)) return;

  ctx.save();
  ctx.fillStyle = settings.color;
  
  // Font select setup
  const fontObj: Record<string, string> = {
    'Inter': 'Inter, sans-serif',
    'Space Grotesk': '"Space Grotesk", sans-serif',
    'JetBrains Mono': '"JetBrains Mono", monospace',
    'Outfit': 'Outfit, sans-serif',
    'Playfair Display': '"Playfair Display", serif'
  };

  const selectedFont = fontObj[settings.fontFamily] || 'Inter, sans-serif';

  // Title Size
  const mainSize = settings.fontSize;
  const subtitleSize = Math.max(14, mainSize * 0.45);

  let x = width / 2;
  let y = height / 2;
  let align: CanvasTextAlign = 'center';

  if (settings.position === 'center') {
    align = 'center';
    x = width / 2;
    y = height / 2 - mainSize * 0.2;
  } else if (settings.position === 'top-left') {
    align = 'left';
    x = 40;
    y = 60 + mainSize;
  } else if (settings.position === 'top-right') {
    align = 'right';
    x = width - 40;
    y = 60 + mainSize;
  } else if (settings.position === 'bottom-left') {
    align = 'left';
    x = 40;
    y = height - 100;
  } else if (settings.position === 'bottom-right') {
    align = 'right';
    x = width - 40;
    y = height - 100;
  }

  // Reactive text transformation/scaling
  let glowMultiplier = 0;
  if (visualsSettings?.reactiveTextGlow && analyserData && analyserData.length > 0) {
    // Look at middle/high frequencies (indices from 30% to 90% of spectrum)
    const startIdx = Math.floor(analyserData.length * 0.3);
    const endIdx = Math.floor(analyserData.length * 0.9);
    let sum = 0;
    let count = 0;
    for (let i = startIdx; i < endIdx; i++) {
      sum += analyserData[i];
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    glowMultiplier = avg / 255; // 0.0 to 1.0
  }

  if (glowMultiplier > 0) {
    const scale = 1.0 + glowMultiplier * 0.08;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  }

  // Draw Title Text
  ctx.textAlign = align;
  ctx.font = `600 ${mainSize}px ${selectedFont}`;
  
  // Shadows for maximum overlay legibility over complex background art
  if (glowMultiplier > 0) {
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = 8 + glowMultiplier * 25;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
  }
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  if (settings.text) {
    ctx.fillText(settings.text.toUpperCase(), x, y);
  }

  // Draw Artist Text
  if (settings.artist) {
    ctx.font = `400 ${subtitleSize}px ${selectedFont}`;
    ctx.fillStyle = `rgba(${hexToRgb(settings.color)?.r || 255}, ${hexToRgb(settings.color)?.g || 255}, ${hexToRgb(settings.color)?.b || 255}, 0.8)`;
    ctx.fillText(settings.artist, x, y + mainSize * 0.9);
  }

  // Draw dynamic progress clock below center text if duration is parsed
  if (audioDuration > 0 && settings.position === 'center') {
    const minC = Math.floor(currentTime / 60);
    const secC = Math.floor(currentTime % 60).toString().padStart(2, '0');
    const minTot = Math.floor(audioDuration / 60);
    const secTot = Math.floor(audioDuration % 60).toString().padStart(2, '0');
    
    ctx.font = `500 12px "JetBrains Mono", monospace`;
    ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
    ctx.fillText(`${minC}:${secC} / ${minTot}:${secTot}`, x, y + mainSize * 1.5);
  }

  ctx.restore();
}

// Blend colors based on linear ratio and advanced color modes
function getDynamicColor(color1: string, color2: string, ratio: number): string {
  const mode = activeSettings?.colorMode || 'gradient';
  if (mode === 'solid') {
    return color1;
  } else if (mode === 'rainbow') {
    // Low frequencies (ratio near 0.0) mapping through typical hues up to high (near 1.0)
    const hue = Math.floor(ratio * 280);
    return `hsl(${hue}, 100%, 55%)`;
  }

  const c1 = hexToRgb(color1) || { r: 0, g: 0, b: 0 };
  const c2 = hexToRgb(color2) || { r: 255, g: 255, b: 255 };

  const r = Math.floor(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.floor(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.floor(c1.b + (c2.b - c1.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

// Convert any hex, rgb, or hsl color to its translucent rgba version
function colorToRgba(colorStr: string, alpha: number): string {
  if (colorStr.startsWith('#')) {
    const rgb = hexToRgb(colorStr) || { r: 0, g: 255, b: 200 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  if (colorStr.startsWith('rgb(')) {
    const matches = colorStr.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${alpha})`;
    }
  }
  if (colorStr.startsWith('hsl(')) {
    return colorStr.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  }
  return colorStr;
}

// DRAW PROGRESS BAR
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  visualsSettings: VisualizerSettings,
  audioDuration: number,
  currentTime: number
) {
  if (!visualsSettings.showProgressBar) return;

  const edge = visualsSettings.progressBarEdge || 'bottom';
  const marginPadding = visualsSettings.progressBarPadding !== undefined ? visualsSettings.progressBarPadding : 25;
  const thickness = visualsSettings.progressBarThickness !== undefined ? visualsSettings.progressBarThickness : 6;
  const scale = visualsSettings.progressBarScale !== undefined ? visualsSettings.progressBarScale : 1.0;
  const style = visualsSettings.progressBarStyle || 'gradient';
  const roundCaps = visualsSettings.progressBarRoundCaps !== undefined ? visualsSettings.progressBarRoundCaps : true;

  const trackColor = visualsSettings.progressBarTrackColor || 'rgba(255, 255, 255, 0.15)';
  const fillColor = visualsSettings.progressBarFillColor || visualsSettings.primaryColor;
  const gradStart = visualsSettings.progressBarGradientStart || visualsSettings.primaryColor;
  const gradEnd = visualsSettings.progressBarGradientEnd || visualsSettings.secondaryColor || visualsSettings.primaryColor;

  const percentage = audioDuration > 0 ? Math.max(0, Math.min(1.0, currentTime / audioDuration)) : 0;

  ctx.save();
  ctx.lineWidth = thickness;
  ctx.lineCap = roundCaps ? 'round' : 'square';

  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  let activeEndX = 0;
  let activeEndY = 0;

  const isHorizontal = edge === 'bottom' || edge === 'top';

  if (isHorizontal) {
    const barWidth = width * scale;
    startX = (width - barWidth) / 2;
    endX = (width + barWidth) / 2;
    startY = edge === 'bottom' ? height - marginPadding : marginPadding;
    endY = startY;

    activeEndX = startX + barWidth * percentage;
    activeEndY = startY;
  } else {
    // Vertical - left or right edge, counting from bottom (0%) to top (100%)
    const barHeight = height * scale;
    startX = edge === 'left' ? marginPadding : width - marginPadding;
    endX = startX;
    
    // Bottom point is 0% start, top point is 100% end
    startY = (height + barHeight) / 2;
    endY = (height - barHeight) / 2;

    activeEndX = startX;
    activeEndY = startY + (endY - startY) * percentage;
  }

  // 1. Draw Inactive Track Line
  ctx.strokeStyle = trackColor;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 2. Draw Active Track Line
  if (percentage > 0) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(activeEndX, activeEndY);

    // Determine paint color / gradient
    if (style === 'gradient') {
      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, gradStart);
      grad.addColorStop(1, gradEnd);
      ctx.strokeStyle = grad;
    } else if (style === 'neon') {
      ctx.strokeStyle = fillColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = fillColor;
    } else {
      ctx.strokeStyle = fillColor;
    }

    ctx.stroke();
  }

  ctx.restore();
}

// DRAW WATERMARK
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: VisualizerSettings,
  logoImgElement: HTMLImageElement | null
) {
  if (!settings.watermarkUrl || !logoImgElement || !logoImgElement.complete) return;

  ctx.save();
  
  const opacity = settings.logoWatermarkOpacity !== undefined ? settings.logoWatermarkOpacity : (settings.watermarkOpacity !== undefined ? settings.watermarkOpacity : 0.8);
  ctx.globalAlpha = opacity;

  const maxDim = 120;
  const imgWidth = logoImgElement.width;
  const imgHeight = logoImgElement.height;
  let dstWidth = maxDim;
  let dstHeight = maxDim;

  if (imgWidth > imgHeight) {
    dstWidth = maxDim;
    dstHeight = (imgHeight / imgWidth) * maxDim;
  } else {
    dstHeight = maxDim;
    dstWidth = (imgWidth / imgHeight) * maxDim;
  }

  const scaleVal = settings.logoWatermarkScale !== undefined ? settings.logoWatermarkScale : (settings.watermarkScale !== undefined ? settings.watermarkScale : 100);
  const scale = scaleVal / 100;
  dstWidth *= scale;
  dstHeight *= scale;

  const padding = 45;
  let x = padding;
  let y = padding;

  const align = settings.logoWatermarkAlignment || 'top-right';

  if (align === 'manual') {
    const xPct = settings.logoWatermarkX !== undefined ? settings.logoWatermarkX : (settings.watermarkX !== undefined ? settings.watermarkX : 90);
    const yPct = settings.logoWatermarkY !== undefined ? settings.logoWatermarkY : (settings.watermarkY !== undefined ? settings.watermarkY : 10);
    x = (xPct / 100) * width - dstWidth / 2;
    y = (yPct / 100) * height - dstHeight / 2;
  } else if (align === 'bottom-center') {
    x = width / 2 - dstWidth / 2;
    y = height - dstHeight - padding;
    if (settings.showProgressBar) {
      y -= 15;
    }
  } else if (align === 'top-left') {
    x = padding;
    y = padding;
  } else if (align === 'bottom-right') {
    x = width - dstWidth - padding;
    y = height - dstHeight - padding;
    if (settings.showProgressBar) {
      y -= 15;
    }
  } else {
    // Check watermarkPosition for fallback or legacy setups
    const pos = settings.watermarkPosition || 'top-right';
    if (pos === 'top-left') {
      x = padding;
      y = padding;
    } else if (pos === 'top-right') {
      x = width - dstWidth - padding;
      y = padding;
    } else if (pos === 'bottom-left') {
      x = padding;
      y = height - dstHeight - padding;
      if (settings.showProgressBar) {
        y -= 15;
      }
    } else if (pos === 'bottom-right') {
      x = width - dstWidth - padding;
      y = height - dstHeight - padding;
      if (settings.showProgressBar) {
        y -= 15;
      }
    }
  }

  ctx.drawImage(logoImgElement, x, y, dstWidth, dstHeight);
  ctx.restore();
}
