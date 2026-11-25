import {
  BrandKit,
  PersonalSlideTemplate,
  PresentationTheme,
  SlideData,
} from "../types";
import { getAccessibleTextColor, getContrastRatio, isLightBackground } from "./luminosity";
import { loadGoogleFont } from "./googleFonts";

const BRAND_KITS_STORAGE_KEY = "kind_2026_brand_kits_v1";
const ACTIVE_BRAND_KIT_KEY = "kind_2026_active_brand_kit_id_v1";
const CUSTOM_TEMPLATES_STORAGE_KEY = "kind_2026_custom_templates_v1";

export const STARTER_BRAND_KITS: Omit<BrandKit, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Apex Corporate Navy",
    primaryColor: "#1E40AF",
    secondaryColor: "#0EA5E9",
    accentColor: "#F59E0B",
    headingFont: "Outfit",
    bodyFont: "Plus Jakarta Sans",
    logoUrl: "",
    logoPosition: "top-right",
    hideLogoOnTitleSlide: true,
    surfaceMode: "light",
  },
  {
    name: "Obsidian Executive",
    primaryColor: "#6366F1",
    secondaryColor: "#38BDF8",
    accentColor: "#10B981",
    headingFont: "Manrope",
    bodyFont: "DM Sans",
    logoUrl: "",
    logoPosition: "bottom-right",
    hideLogoOnTitleSlide: false,
    surfaceMode: "dark",
  },
];

export function loadLocalBrandKits(): BrandKit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BRAND_KITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalBrandKits(kits: BrandKit[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRAND_KITS_STORAGE_KEY, JSON.stringify(kits));
  } catch (e) {
    console.warn("Failed to save brand kits to localStorage:", e);
  }
}

export function getActiveBrandKitId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_BRAND_KIT_KEY);
  } catch {
    return null;
  }
}

export function setActiveBrandKitId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ACTIVE_BRAND_KIT_KEY, id);
    else localStorage.removeItem(ACTIVE_BRAND_KIT_KEY);
  } catch {
    // ignore
  }
}

export function loadLocalCustomTemplates(): PersonalSlideTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomTemplates(templates: PersonalSlideTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn("Failed to save custom templates to localStorage:", e);
  }
}

function mergeById<T extends { id: string; updatedAt?: number; createdAt?: number }>(
  localItems: T[],
  remoteItems: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of remoteItems) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of localItems) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const localTs = item.updatedAt ?? item.createdAt ?? 0;
      const remoteTs = existing.updatedAt ?? existing.createdAt ?? 0;
      if (localTs >= remoteTs) {
        map.set(item.id, item);
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0)
  );
}

export async function syncBrandKitsWithBackend(): Promise<BrandKit[]> {
  const local = loadLocalBrandKits();
  try {
    const res = await fetch("/api/brand-kits");
    if (!res.ok) return local;
    const data = await res.json();
    const remote: BrandKit[] = Array.isArray(data?.brandKits) ? data.brandKits : [];
    const merged = mergeById(local, remote);
    saveLocalBrandKits(merged);

    // Push any local-only kits to backend so server stays synchronized
    const remoteIds = new Set(remote.map((r) => r.id));
    for (const kit of local) {
      if (!remoteIds.has(kit.id)) {
        fetch("/api/brand-kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kit),
        }).catch(() => {});
      }
    }
    return merged;
  } catch {
    return local;
  }
}

export async function persistBrandKit(kit: BrandKit): Promise<BrandKit[]> {
  const existing = loadLocalBrandKits();
  const idx = existing.findIndex((k) => k.id === kit.id);
  const next =
    idx >= 0
      ? existing.map((k) => (k.id === kit.id ? kit : k))
      : [kit, ...existing];
  saveLocalBrandKits(next);

  try {
    const res = await fetch("/api/brand-kits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kit),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.brandKits)) {
        const merged = mergeById(next, data.brandKits);
        saveLocalBrandKits(merged);
        return merged;
      }
    }
  } catch {
    // Offline fallback already saved to localStorage
  }
  return next;
}

export async function removeBrandKit(id: string): Promise<BrandKit[]> {
  const next = loadLocalBrandKits().filter((k) => k.id !== id);
  saveLocalBrandKits(next);
  if (getActiveBrandKitId() === id) {
    setActiveBrandKitId(null);
  }
  try {
    await fetch(`/api/brand-kits/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {
    // ignore
  }
  return next;
}

export async function syncCustomTemplatesWithBackend(): Promise<PersonalSlideTemplate[]> {
  const local = loadLocalCustomTemplates();
  try {
    const res = await fetch("/api/custom-templates");
    if (!res.ok) return local;
    const data = await res.json();
    const remote: PersonalSlideTemplate[] = Array.isArray(data?.templates)
      ? data.templates
      : [];
    const merged = mergeById(local, remote);
    saveLocalCustomTemplates(merged);

    const remoteIds = new Set(remote.map((r) => r.id));
    for (const tpl of local) {
      if (!remoteIds.has(tpl.id)) {
        fetch("/api/custom-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tpl),
        }).catch(() => {});
      }
    }
    return merged;
  } catch {
    return local;
  }
}

export async function persistCustomTemplate(
  template: PersonalSlideTemplate
): Promise<PersonalSlideTemplate[]> {
  const existing = loadLocalCustomTemplates();
  const idx = existing.findIndex((t) => t.id === template.id);
  const next =
    idx >= 0
      ? existing.map((t) => (t.id === template.id ? template : t))
      : [template, ...existing];
  saveLocalCustomTemplates(next);

  try {
    const res = await fetch("/api/custom-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.templates)) {
        const merged = mergeById(next, data.templates);
        saveLocalCustomTemplates(merged);
        return merged;
      }
    }
  } catch {
    // localStorage fallback preserved
  }
  return next;
}

export async function removeCustomTemplate(
  id: string
): Promise<PersonalSlideTemplate[]> {
  const next = loadLocalCustomTemplates().filter((t) => t.id !== id);
  saveLocalCustomTemplates(next);
  try {
    await fetch(`/api/custom-templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch {
    // ignore
  }
  return next;
}

/**
 * Strips deck-specific IDs and preserves full slide layout, content, styling,
 * overlay elements, and animations for reusable template storage.
 */
export function buildTemplateFromSlide(
  slide: SlideData,
  name: string,
  category?: string
): PersonalSlideTemplate {
  const clonedSlide: SlideData = JSON.parse(JSON.stringify(slide));
  return {
    id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || slide.titleKo || slide.titleId || "Untitled Slide Template",
    category: category?.trim() || slide.categoryId || slide.categoryKo || "Custom",
    description: slide.subtitleId || slide.subtitleKo || "",
    slide: clonedSlide,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Instantiates a fresh SlideData from a saved PersonalSlideTemplate with
 * newly generated IDs for the slide, bullets, and overlayElements/connectors.
 */
export function instantiateSlideFromTemplate(
  template: PersonalSlideTemplate,
  nextSlideNumber: number
): SlideData {
  const baseTs = Date.now();
  const src: SlideData = JSON.parse(JSON.stringify(template.slide));

  const overlayIdMap = new Map<string, string>();
  const rawOverlays = src.overlayElements || [];
  rawOverlays.forEach((el, idx) => {
    overlayIdMap.set(
      el.id,
      `ov_${baseTs}_${idx}_${Math.random().toString(36).slice(2, 6)}`
    );
  });

  return {
    ...src,
    id: `slide_${baseTs}_${Math.random().toString(36).slice(2, 5)}`,
    slideNumber: nextSlideNumber,
    bullets: src.bullets?.map((b, idx) => ({
      ...b,
      id: `b_${baseTs}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    })),
    overlayElements: src.overlayElements
      ? src.overlayElements.map((el) => ({
          ...el,
          id: overlayIdMap.get(el.id) || el.id,
          connector: el.connector
            ? {
                ...el.connector,
                sourceId: overlayIdMap.get(el.connector.sourceId) || el.connector.sourceId,
                targetId: overlayIdMap.get(el.connector.targetId) || el.connector.targetId,
              }
            : undefined,
        }))
      : undefined,
  };
}

/**
 * Converts a BrandKit into a WCAG-safe PresentationTheme merged cleanly
 * with the user's current theme or light/dark surface preference.
 */
export function buildThemeFromBrandKit(
  baseTheme: PresentationTheme,
  kit: BrandKit
): PresentationTheme {
  loadGoogleFont(kit.headingFont);
  loadGoogleFont(kit.bodyFont);

  const surfaceMode =
    kit.surfaceMode || (isLightBackground(baseTheme.canvasBg) ? "light" : "dark");
  const isLight = surfaceMode === "light";

  const canvasBg = isLight ? "#ffffff" : "#0b1120";
  const cardBg = isLight ? "#f8fafc" : "#151d2e";
  const textColor = getAccessibleTextColor(canvasBg, "#0f172a", "#f8fafc");
  const textMuted = isLight ? "#475569" : "#94a3b8";
  const borderColor = isLight ? "#e2e8f0" : "#273449";

  // Pick readable badge foreground against primaryColor
  const badgeBg = kit.primaryColor || baseTheme.accentColor;
  const whiteContrast = getContrastRatio("#ffffff", badgeBg);
  const darkContrast = getContrastRatio("#0f172a", badgeBg);
  const badgeText = whiteContrast >= darkContrast ? "#ffffff" : "#0f172a";

  return {
    ...baseTheme,
    id: `brand-${kit.id}`,
    name: kit.name,
    description: `${kit.headingFont} / ${kit.bodyFont} corporate brand theme`,
    bgColor: isLight ? kit.secondaryColor || "#0f172a" : "#090d16",
    canvasBg,
    cardBg,
    textColor,
    textMuted,
    accentColor: kit.primaryColor || baseTheme.accentColor,
    accentSecondary: kit.accentColor || kit.secondaryColor || baseTheme.accentSecondary,
    borderColor,
    badgeBg,
    badgeText,
    fontFamily: kit.bodyFont,
    headingFont: kit.headingFont,
    bodyFont: kit.bodyFont,
    brandKitId: kit.id,
    brandPrimaryColor: kit.primaryColor,
    brandSecondaryColor: kit.secondaryColor,
    brandLogoUrl: kit.logoUrl || undefined,
    brandLogoPosition: kit.logoPosition,
    hideLogoOnTitleSlide:
      Boolean(kit.hideLogoOnTitleSlide) || kit.logoPosition === "hidden-on-title",
  };
}
