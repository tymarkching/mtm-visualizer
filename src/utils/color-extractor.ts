/**
 * Color extraction utility to analyze dominant colors from background images.
 */

export function extractDominantColors(imageSrc: string, numColors: number = 4): Promise<string[]> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(['#ff007f', '#7f00ff', '#00ffff', '#ffaa00']);
      return;
    }

    const img = new Image();
    // Configure cross-origin to prevent tainted canvas errors on remote URLs
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#ff007f', '#7f00ff', '#00ffff', '#ffaa00']);
          return;
        }

        // Small dimensions to speed up processing and naturally smooth minor high-frequency noise
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        const colors: { r: number; g: number; b: number; count: number }[] = [];
        // Threshold for distinct colors (Euclidean distance in RGB space)
        // High enough to guarantee distinct colors, low enough to detect subtle color differences
        const distanceThreshold = 40; 

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Ignore highly transparent or almost fully black/dark gray backdrop noise
          if (a < 180 || (r < 12 && g < 12 && b < 12)) {
            continue;
          }

          // Group colors into slightly broader bins to coalesce nearby shades
          const roundedR = Math.round(r / 6) * 6;
          const roundedG = Math.round(g / 6) * 6;
          const roundedB = Math.round(b / 6) * 6;

          let matched = false;
          for (const item of colors) {
            const dr = item.r - roundedR;
            const dg = item.g - roundedG;
            const db = item.b - roundedB;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist < distanceThreshold) {
              // Smoothly blend the running average
              item.r = (item.r * item.count + roundedR) / (item.count + 1);
              item.g = (item.g * item.count + roundedG) / (item.count + 1);
              item.b = (item.b * item.count + roundedB) / (item.count + 1);
              item.count++;
              matched = true;
              break;
            }
          }

          if (!matched) {
            colors.push({ r: roundedR, g: roundedG, b: roundedB, count: 1 });
          }
        }

        // Sort found colors by prevalence (count) descending
        colors.sort((a, b) => b.count - a.count);

        const toHex = (val: number) => {
          const clamped = Math.max(0, Math.min(255, Math.round(val)));
          const hex = clamped.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };

        const result: string[] = [];
        for (let j = 0; j < Math.min(numColors, colors.length); j++) {
          result.push(`#${toHex(colors[j].r)}${toHex(colors[j].g)}${toHex(colors[j].b)}`);
        }

        // Define fallback palette of gorgeous visualizer neon colors
        const fallbacks = ['#ff007f', '#00ffff', '#7f00ff', '#ffaa00'];
        while (result.length < numColors) {
          const fb = fallbacks[result.length] || '#ffffff';
          result.push(fb);
        }

        resolve(result);
      } catch (err) {
        console.warn("Dynamic dominant color extraction failed, returning default palette:", err);
        resolve(['#ff007f', '#7f00ff', '#00ffff', '#ffaa00']);
      }
    };

    img.onerror = () => {
      console.warn("Failed to load background image for color extraction.");
      resolve(['#ff007f', '#7f00ff', '#00ffff', '#ffaa00']);
    };

    img.src = imageSrc;
  });
}
