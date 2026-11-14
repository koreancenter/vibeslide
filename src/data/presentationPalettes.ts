/**
 * Presentation redesign palettes and heuristic layout selection logic
 */

export interface RedesignPalette {
  name: string;
  customBg: string;
  customAccentColor: string;
  customAccentSecondary: string;
  customBadgeBg: string;
  customBadgeText: string;
}

export const REDESIGN_PALETTES: RedesignPalette[] = [
  {
    name: "Midnight Slate",
    customBg: "#0f172a",
    customAccentColor: "#38bdf8",
    customAccentSecondary: "#818cf8",
    customBadgeBg: "#1e293b",
    customBadgeText: "#38bdf8",
  },
  {
    name: "Diplomatic Navy",
    customBg: "#0a192f",
    customAccentColor: "#64ffda",
    customAccentSecondary: "#00b4d8",
    customBadgeBg: "#112240",
    customBadgeText: "#64ffda",
  },
  {
    name: "Emerald Bilateral",
    customBg: "#022c22",
    customAccentColor: "#34d399",
    customAccentSecondary: "#10b981",
    customBadgeBg: "#064e3b",
    customBadgeText: "#a7f3d0",
  },
  {
    name: "Indigo Royal",
    customBg: "#1e1b4b",
    customAccentColor: "#a78bfa",
    customAccentSecondary: "#c084fc",
    customBadgeBg: "#312e81",
    customBadgeText: "#ede9fe",
  },
  {
    name: "Dark Amber Executive",
    customBg: "#18181b",
    customAccentColor: "#f59e0b",
    customAccentSecondary: "#fbbf24",
    customBadgeBg: "#27272a",
    customBadgeText: "#fef3c7",
  },
  {
    name: "Nordic Oceanic",
    customBg: "#082f49",
    customAccentColor: "#06b6d4",
    customAccentSecondary: "#38bdf8",
    customBadgeBg: "#0c4a6e",
    customBadgeText: "#e0f2fe",
  },
  {
    name: "Modern Executive Pearl",
    customBg: "#f8fafc",
    customAccentColor: "#2563eb",
    customAccentSecondary: "#4f46e5",
    customBadgeBg: "#eff6ff",
    customBadgeText: "#1d4ed8",
  },
  {
    name: "Crimson Rose Luxury",
    customBg: "#1c1917",
    customAccentColor: "#f43f5e",
    customAccentSecondary: "#fb7185",
    customBadgeBg: "#292524",
    customBadgeText: "#ffe4e6",
  },
];

export function getSmartRedesign(slide: any, triedLayouts: string[] = []) {
  const currentLayout = slide?.layout || "general";
  const allLayouts = [
    "overview",
    "cards-3",
    "cards-2",
    "split-info",
    "key-stats",
    "full-image",
    "delegation-table",
    "schedule-table",
    "action-items",
    "process-3",
    "general",
  ];

  const untried = allLayouts.filter((l) => l !== currentLayout && !triedLayouts.includes(l));
  const pool = untried.length > 0 ? untried : allLayouts.filter((l) => l !== currentLayout);

  let chosenLayout = pool[Math.floor(Math.random() * pool.length)] || "cards-3";

  const hasStats = Array.isArray(slide?.stats) && slide.stats.length >= 2;
  const hasImage = !!slide?.image?.url;
  const bulletCount = Array.isArray(slide?.bullets) ? slide.bullets.length : 0;
  const isTableData = Array.isArray(slide?.delegates) || Array.isArray(slide?.timeline);

  if (isTableData && pool.includes("delegation-table") && Array.isArray(slide?.delegates)) {
    chosenLayout = "delegation-table";
  } else if (isTableData && pool.includes("schedule-table") && Array.isArray(slide?.timeline)) {
    chosenLayout = "schedule-table";
  } else if (hasStats && pool.includes("key-stats")) {
    chosenLayout = "key-stats";
  } else if (hasImage && pool.includes("full-image") && bulletCount <= 2) {
    chosenLayout = "full-image";
  } else if (hasImage && pool.includes("split-info")) {
    chosenLayout = "split-info";
  } else if (bulletCount === 3 && pool.includes("cards-3")) {
    chosenLayout = "cards-3";
  } else if (bulletCount === 3 && pool.includes("process-3")) {
    chosenLayout = "process-3";
  } else if (bulletCount === 2 && pool.includes("cards-2")) {
    chosenLayout = "cards-2";
  }

  const currentBg = (slide?.customBg || "").toLowerCase();
  const availablePalettes = REDESIGN_PALETTES.filter((p) => p.customBg.toLowerCase() !== currentBg);
  const palette = availablePalettes[Math.floor(Math.random() * availablePalettes.length)] || REDESIGN_PALETTES[0];

  return {
    layout: chosenLayout,
    customBg: palette.customBg,
    customAccentColor: palette.customAccentColor,
    customAccentSecondary: palette.customAccentSecondary,
    customBadgeBg: palette.customBadgeBg,
    customBadgeText: palette.customBadgeText,
  };
}
