export interface GoogleFontOption {
  family: string;
  category: "sans" | "serif" | "display" | "mono";
  weights: string;
  note?: string;
}

export const CURATED_GOOGLE_FONTS: GoogleFontOption[] = [
  { family: "Plus Jakarta Sans", category: "sans", weights: "400;500;600;700;800", note: "Modern Geometric Sans" },
  { family: "DM Sans", category: "sans", weights: "400;500;600;700", note: "Clean Executive Sans" },
  { family: "Manrope", category: "sans", weights: "400;500;600;700;800", note: "Crisp Corporate UI" },
  { family: "Outfit", category: "display", weights: "400;500;600;700;800", note: "Bold Geometric Display" },
  { family: "Public Sans", category: "sans", weights: "400;500;600;700", note: "Neutral Institutional" },
  { family: "IBM Plex Sans", category: "sans", weights: "400;500;600;700", note: "Enterprise Technical" },
  { family: "Montserrat", category: "display", weights: "400;500;600;700;800", note: "High-Impact Headings" },
  { family: "Poppins", category: "sans", weights: "400;500;600;700", note: "Friendly Geometric" },
  { family: "Bricolage Grotesque", category: "display", weights: "500;600;700;800", note: "Expressive Editorial" },
  { family: "Playfair Display", category: "serif", weights: "500;600;700;800", note: "Luxury Executive Serif" },
  { family: "Fraunces", category: "serif", weights: "500;600;700", note: "Soft Editorial Serif" },
  { family: "Lora", category: "serif", weights: "400;500;600;700", note: "Readable Report Serif" },
  { family: "Source Serif 4", category: "serif", weights: "400;600;700", note: "Annual Report Serif" },
  { family: "Oswald", category: "display", weights: "500;600;700", note: "Condensed Headline" },
  { family: "Archivo", category: "display", weights: "500;600;700;800", note: "Sharp Industrial Sans" },
  { family: "Noto Sans KR", category: "sans", weights: "400;500;700", note: "Korean + Latin Sans" },
  { family: "Noto Serif KR", category: "serif", weights: "400;600;700", note: "Korean + Latin Serif" },
  { family: "JetBrains Mono", category: "mono", weights: "400;500;700", note: "Tabular Data Mono" },
];

const loadedFonts = new Set<string>();

export function normalizeGoogleFontName(fontName?: string): string {
  if (!fontName) return "";
  return fontName.split(",")[0].replace(/["']/g, "").trim();
}

export function loadGoogleFont(fontName?: string): void {
  if (typeof document === "undefined" || !fontName) return;
  const clean = normalizeGoogleFontName(fontName);
  if (!clean) return;

  const systemFonts = new Set([
    "sans-serif",
    "serif",
    "monospace",
    "system-ui",
    "arial",
    "helvetica",
    "georgia",
    "times new roman",
  ]);
  if (systemFonts.has(clean.toLowerCase())) return;
  if (loadedFonts.has(clean)) return;

  const existing = document.querySelector(
    `link[data-google-font="${CSS.escape(clean)}"]`
  );
  if (existing) {
    loadedFonts.add(clean);
    return;
  }

  const preset = CURATED_GOOGLE_FONTS.find(
    (f) => f.family.toLowerCase() === clean.toLowerCase()
  );
  const weights = preset?.weights || "400;500;600;700";
  const encodedFamily = encodeURIComponent(clean).replace(/%20/g, "+");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights}&display=swap`;
  link.setAttribute("data-google-font", clean);
  document.head.appendChild(link);
  loadedFonts.add(clean);
}

export function formatCssFontFamily(fontName?: string, fallback: string = "sans-serif"): string {
  const clean = normalizeGoogleFontName(fontName);
  if (!clean) return fallback;
  return `'${clean}', ${fallback}`;
}
