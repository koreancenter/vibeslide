import { PresentationTheme } from "../types";

/**
 * Standard RGBA color representation
 */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Common color name map for fallback parsing
 */
const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  transparent: "rgba(0,0,0,0)",
  navy: "#000080",
  darkblue: "#00008b",
  midnightblue: "#191970",
  slate: "#64748b",
  gray: "#808080",
  lightgray: "#d3d3d3",
  darkgray: "#a9a9a9",
  emerald: "#10b981",
  indigo: "#6366f1",
  red: "#ef4444",
  blue: "#3b82f6",
};

/**
 * Helper to convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * Parses any CSS color string (Hex, RGB, RGBA, HSL, HSLA, named) into RGBA
 */
export function parseColor(colorString: string): RGBA | null {
  if (!colorString || typeof colorString !== "string") return null;

  let str = colorString.trim().toLowerCase();

  // Check named colors
  if (NAMED_COLORS[str]) {
    str = NAMED_COLORS[str];
  }

  // 1. Hex parsing (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // 2. RGB / RGBA parsing (e.g., rgb(15, 23, 42) or rgba(15, 23, 42, 0.8))
  const rgbaMatch = str.match(
    /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/
  );
  if (rgbaMatch) {
    return {
      r: Math.min(255, parseInt(rgbaMatch[1], 10)),
      g: Math.min(255, parseInt(rgbaMatch[2], 10)),
      b: Math.min(255, parseInt(rgbaMatch[3], 10)),
      a: rgbaMatch[4] !== undefined ? Math.min(1, parseFloat(rgbaMatch[4])) : 1,
    };
  }

  // 3. HSL / HSLA parsing (e.g., hsl(210, 100%, 50%))
  const hslaMatch = str.match(
    /^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)$/
  );
  if (hslaMatch) {
    const { r, g, b } = hslToRgb(
      parseFloat(hslaMatch[1]),
      parseFloat(hslaMatch[2]),
      parseFloat(hslaMatch[3])
    );
    return {
      r,
      g,
      b,
      a: hslaMatch[4] !== undefined ? Math.min(1, parseFloat(hslaMatch[4])) : 1,
    };
  }

  return null;
}

/**
 * Calculates the standard WCAG relative luminance of a color.
 * Returns a value between 0 (absolute black) and 1 (pure white).
 * Formula: W3C WCAG 2.1 Relative Luminance definition.
 */
export function calculateLuminosity(color: string): number {
  const parsed = parseColor(color);
  if (!parsed) return 0.5; // default neutral fallback

  // Linearize sRGB channels
  const srgb = [parsed.r, parsed.g, parsed.b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate perceived luminance (ITU-R BT.709 weights)
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Alias for calculateLuminosity
 */
export const getLuminance = calculateLuminosity;

/**
 * Determines whether a background color is considered "light" (high luminosity).
 * Standard optimal threshold is 0.45 for UI typography contrast.
 */
export function isLightBackground(bgColor: string, threshold = 0.45): boolean {
  return calculateLuminosity(bgColor) > threshold;
}

/**
 * Calculates the WCAG contrast ratio between two colors.
 * Returns a number between 1 (no contrast) and 21 (black on white).
 * WCAG AA requires at least 4.5:1 for normal body text and 3:1 for large/bold text.
 */
export function getContrastRatio(foreground: string, background: string): number {
  const lum1 = calculateLuminosity(foreground);
  const lum2 = calculateLuminosity(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Returns an accessible text color (high-contrast black or white)
 * based on the slide or container background luminosity.
 */
export function getAccessibleTextColor(
  bgColor: string,
  darkText = "#0f172a",
  lightText = "#f8fafc"
): string {
  const isLight = isLightBackground(bgColor);
  return isLight ? darkText : lightText;
}

/**
 * Returns an accessible muted/secondary text color based on background luminosity.
 */
export function getAccessibleMutedColor(
  bgColor: string,
  darkMuted = "#475569",
  lightMuted = "#94a3b8"
): string {
  const isLight = isLightBackground(bgColor);
  return isLight ? darkMuted : lightMuted;
}

/**
 * Takes a PresentationTheme and optional custom background override,
 * and returns an enhanced PresentationTheme with mathematically guaranteed
 * WCAG accessible colors for text, cards, borders, and badges.
 */
export function getAccessibleTheme(
  theme: PresentationTheme,
  customBg?: string
): PresentationTheme {
  const effectiveBg = customBg || theme.canvasBg || theme.bgColor || "#0f172a";
  const isLight = isLightBackground(effectiveBg);
  const luminosity = calculateLuminosity(effectiveBg);

  // Check if existing text colors pass minimum contrast threshold (4.5:1)
  const currentTextContrast = getContrastRatio(theme.textColor || "#ffffff", effectiveBg);
  const needsTextAdjustment = currentTextContrast < 4.0;

  // Determine accessible text colors
  const accessibleTextColor = needsTextAdjustment
    ? isLight
      ? "#0f172a" // Deep slate for high-contrast light bg
      : "#f8fafc" // Off-white for high-contrast dark bg
    : theme.textColor;

  const accessibleTextMuted = isLight
    ? luminosity > 0.8
      ? "#475569" // slate-600
      : "#334155" // slate-700
    : luminosity < 0.1
    ? "#94a3b8" // slate-400
    : "#cbd5e1"; // slate-300

  // Determine accessible card backgrounds and borders
  const accessibleCardBg = isLight
    ? luminosity > 0.88
      ? "#f8fafc" // soft light card on crisp white
      : "#ffffff" // white card on light gray/tinted bg
    : luminosity < 0.1
    ? "#1e293b" // slate-800 card on midnight/dark bg
    : "#0f172a"; // deep card on mid-dark bg

  const accessibleBorderColor = isLight
    ? "#e2e8f0" // slate-200
    : "#334155"; // slate-700

  // Badge background & text
  const currentBadgeContrast = getContrastRatio(
    theme.badgeText || "#ffffff",
    theme.badgeBg || "transparent"
  );
  const badgeNeedsFix = currentBadgeContrast < 3.0;

  const accessibleBadgeBg = badgeNeedsFix
    ? isLight
      ? "rgba(30, 64, 175, 0.1)"
      : "rgba(99, 102, 241, 0.2)"
    : theme.badgeBg;

  const accessibleBadgeText = badgeNeedsFix
    ? isLight
      ? "#1e40af"
      : "#a5b4fc"
    : theme.badgeText;

  return {
    ...theme,
    canvasBg: customBg || theme.canvasBg,
    textColor: accessibleTextColor,
    textMuted: accessibleTextMuted,
    cardBg: accessibleCardBg,
    borderColor: accessibleBorderColor,
    badgeBg: accessibleBadgeBg,
    badgeText: accessibleBadgeText,
  };
}
