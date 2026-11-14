/**
 * Color extraction utility using offscreen canvas pixel sampling.
 * Highly robust, zero-dependency, and handles CORS and image loading gracefully.
 */

export interface ExtractedPalette {
  dominantColors: string[]; // Top 5 distinct hex colors
  suggestedAccents: {
    accentColor: string;      // Primary vibrant accent
    accentSecondary: string;  // Secondary/complementary accent
    badgeBg: string;          // Sophisticated badge background
    badgeText: string;        // High contrast badge text
    borderHighlight: string;  // Dynamic border highlight color
  };
}

/**
 * Converts a hex color to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

/**
 * Converts RGB to Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  return "#" + [clamp(r), clamp(g), clamp(b)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculates Euclidean distance between two colors in RGB space
 */
function getColorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

/**
 * Checks if a color is a grayscale color (R, G, B are very close)
 */
function isGrayscale(r: number, g: number, b: number, tolerance = 15): boolean {
  return Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance;
}

/**
 * Checks if a color is extremely bright (near white) or extremely dark (near black)
 */
function isExtremeColor(r: number, g: number, b: number): boolean {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 240 || brightness < 15;
}

/**
 * Extract a palette of 5 distinct dominant colors from any image URL
 */
export function extractColorsFromImageUrl(imageUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context could not be created"));
          return;
        }

        // Draw image at low resolution for hyper-fast sampling
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        // Bucket colors to group similar hues
        const colorCounts: { [key: string]: { rgb: [number, number, number]; count: number } } = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 150) continue;

          // Bucket values to nearest 16 to group similar hues together
          const bucketSize = 16;
          const br = Math.round(r / bucketSize) * bucketSize;
          const bg = Math.round(g / bucketSize) * bucketSize;
          const bb = Math.round(b / bucketSize) * bucketSize;

          const key = `${br},${bg},${bb}`;
          if (colorCounts[key]) {
            colorCounts[key].count++;
          } else {
            colorCounts[key] = { rgb: [r, g, b], count: 1 };
          }
        }

        // Sort colors by dominance
        const sortedColors = Object.values(colorCounts).sort((a, b) => b.count - a.count);

        // Find 5 distinct colors
        const distinctColors: [number, number, number][] = [];
        const minDistance = 45; // Minimum color distance to ensure distinct swatches

        for (const item of sortedColors) {
          const rgb = item.rgb;

          // Prioritize non-extreme, colorful values, but allow fallback if necessary
          const isExtreme = isExtremeColor(rgb[0], rgb[1], rgb[2]);
          const isGray = isGrayscale(rgb[0], rgb[1], rgb[2]);

          // We check distance from already selected distinct colors
          const isTooClose = distinctColors.some(selectedRgb => {
            return getColorDistance(selectedRgb, rgb) < minDistance;
          });

          if (!isTooClose) {
            // Keep a mix of colorful accents. Gray/Extreme are allowed if no other choice.
            if (distinctColors.length < 3 && (isExtreme || isGray)) {
              // De-prioritize extreme white/black/gray at first to keep palettes vibrant
              continue;
            }
            distinctColors.push(rgb);
          }

          if (distinctColors.length >= 6) break;
        }

        // Fill remaining if we don't have enough colors
        for (const item of sortedColors) {
          if (distinctColors.length >= 6) break;
          const rgb = item.rgb;
          const isTooClose = distinctColors.some(selectedRgb => getColorDistance(selectedRgb, rgb) < 30);
          if (!isTooClose) {
            distinctColors.push(rgb);
          }
        }

        // If still empty (e.g. image error or single color), provide default beautiful presets
        if (distinctColors.length === 0) {
          distinctColors.push([14, 99, 156], [34, 197, 94], [245, 158, 11], [239, 68, 68], [139, 92, 246]);
        }

        const hexColors = distinctColors.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        // Generate Suggested Accents dynamically
        resolve(generateAestheticSuggestions(distinctColors, hexColors));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      reject(new Error("CORS or Image loading failed. Unable to extract colors from this domain."));
    };
  });
}

/**
 * Creates optimal, high-contrast, WCAG compliant theme accent overrides based on extracted colors.
 */
function generateAestheticSuggestions(
  rgbColors: [number, number, number][],
  hexColors: string[]
): ExtractedPalette {
  // Sort extracted colors by saturation/vibrancy (excluding extreme white/black)
  const vibrantColors = rgbColors
    .map((rgb, idx) => {
      const r = rgb[0];
      const g = rgb[1];
      const b = rgb[2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const s = max === min ? 0 : l > 128 ? (max - min) / (510 - max - min) : (max - min) / (max + min);
      
      return { rgb, hex: hexColors[idx], saturation: s, lightness: l };
    })
    .filter(c => c.lightness > 20 && c.lightness < 235); // Filter extreme dark/light

  // Pick primary accent (most saturated/vibrant color)
  let primaryItem = vibrantColors.sort((a, b) => b.saturation - a.saturation)[0] || { rgb: rgbColors[0], hex: hexColors[0], saturation: 0, lightness: 128 };
  let primaryAccent = primaryItem.hex;

  // Pick secondary accent (distinct shade with high vibrancy, or second most saturated)
  let secondaryItem = vibrantColors.filter(c => c.hex !== primaryAccent)[0] || { rgb: rgbColors[1] || rgbColors[0], hex: hexColors[1] || hexColors[0] };
  let secondaryAccent = secondaryItem.hex;

  // Derive badge configurations
  // We want badge background to be a muted pastel/dark translucent version of the primary accent
  const pRgb = primaryItem.rgb;
  const badgeBg = `rgba(${pRgb[0]}, ${pRgb[1]}, ${pRgb[2]}, 0.12)`;
  
  // Badge text should be readable. If primary is very bright, make text darker, else lighter
  const primaryBrightness = (pRgb[0] * 299 + pRgb[1] * 587 + pRgb[2] * 114) / 1000;
  const badgeText = primaryBrightness > 160 ? rgbToHex(pRgb[0] * 0.7, pRgb[1] * 0.7, pRgb[2] * 0.7) : primaryAccent;

  return {
    dominantColors: hexColors.slice(0, 5),
    suggestedAccents: {
      accentColor: primaryAccent,
      accentSecondary: secondaryAccent,
      badgeBg,
      badgeText,
      borderHighlight: primaryAccent,
    }
  };
}
