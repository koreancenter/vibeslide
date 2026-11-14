import type React from "react";
import {
  ComponentAnimationType,
  ComponentBuildInConfig,
  ElementAnimationConfig,
  ElementAnimationEffect,
  ElementAnimationTrigger,
  Language,
  SlideData,
} from "../types";

export interface BuildInItemState {
  isVisible: boolean;
  style: React.CSSProperties;
  className: string;
}

export interface SlideAnimationTrack {
  id: string; // "bullet:<idx>" | "stat:<idx>" | "image:main" | "overlay:<id>"
  kind: "bullet" | "stat" | "image" | "overlay";
  slotIndex?: number;
  overlayId?: string;
  label: string;
  subtitle: string;
  animation: ElementAnimationConfig;
  stepIndex: number; // 1-based click group
  startMs: number;
  endMs: number;
  groupOffsetMs: number;
}

export interface SlideAnimationSchedule {
  tracks: SlideAnimationTrack[];
  totalSteps: number;
  totalDurationMs: number;
  stepStartTimesMs: Map<number, number>;
}

const CLICK_GROUP_GAP_MS = 250;

export function mapLegacyAnimationToEffect(
  type?: ComponentAnimationType
): ElementAnimationEffect {
  switch (type) {
    case "fade":
      return "fade";
    case "slide-right":
      return "slideLeft";
    case "zoom-in":
      return "zoomIn";
    case "flip-up":
      return "bounce";
    case "slide-up":
    default:
      return "slideUp";
  }
}

function getDefaultAnimation(
  index: number,
  slideConfig?: ComponentBuildInConfig
): ElementAnimationConfig {
  const effect = mapLegacyAnimationToEffect(slideConfig?.animation);
  const isAuto = slideConfig?.sequenceMode === "auto";
  const staggerMs = Math.round((slideConfig?.staggerDelay ?? 0.2) * 1000);
  const trigger: ElementAnimationTrigger =
    isAuto && index > 0 ? "afterPrevious" : "onClick";

  return {
    trigger,
    effect,
    duration: 420,
    delay: isAuto && index > 0 ? Math.min(800, staggerMs) : 0,
    order: index,
  };
}

function resolveBulletLabel(slide: SlideData, idx: number, language: Language): string {
  const b = slide.bullets?.[idx];
  if (!b) return `Item ${idx + 1}`;
  if (language === "ko") return b.titleKo || b.titleId || b.descKo || `항목 ${idx + 1}`;
  if (language === "ja") return b.titleJa || b.titleKo || b.titleId || `項目 ${idx + 1}`;
  return b.titleId || b.titleKo || b.descId || `Item ${idx + 1}`;
}

function resolveStatLabel(slide: SlideData, idx: number, language: Language): string {
  const st = slide.stats?.[idx];
  if (!st) return `Stat ${idx + 1}`;
  const lbl =
    language === "ko"
      ? st.labelKo || st.labelId
      : language === "ja"
      ? st.labelJa || st.labelKo || st.labelId
      : st.labelId || st.labelKo;
  return lbl ? `${lbl} (${st.value})` : st.value || `Metric ${idx + 1}`;
}

/**
 * Discovers all layout slots and overlayElements on a slide and calculates
 * their chronological animation schedule.
 */
export function buildSlideAnimationSchedule(
  slide: SlideData | undefined | null,
  language: Language = "en",
  configOverride?: ComponentBuildInConfig
): SlideAnimationSchedule {
  if (!slide) {
    return {
      tracks: [],
      totalSteps: 0,
      totalDurationMs: 0,
      stepStartTimesMs: new Map(),
    };
  }

  const effectiveConfig = configOverride || slide.buildInConfig;
  const rawTracks: Omit<
    SlideAnimationTrack,
    "stepIndex" | "startMs" | "endMs" | "groupOffsetMs"
  >[] = [];

  let naturalOrder = 0;

  if (slide.layout === "key-stats" && slide.stats && slide.stats.length > 0) {
    slide.stats.slice(0, 4).forEach((st, sIdx) => {
      const defaults = getDefaultAnimation(naturalOrder, effectiveConfig);
      rawTracks.push({
        id: `stat:${sIdx}`,
        kind: "stat",
        slotIndex: sIdx,
        label: resolveStatLabel(slide, sIdx, language),
        subtitle: `Stat Card #${sIdx + 1}`,
        animation: {
          ...defaults,
          ...st.animation,
          order: st.animation?.order ?? naturalOrder,
        },
      });
      naturalOrder += 1;
    });
  } else if (
    slide.layout !== "cover" &&
    slide.layout !== "full-image" &&
    slide.bullets &&
    slide.bullets.length > 0
  ) {
    const bulletSlice =
      slide.layout === "process-3" ? slide.bullets.slice(0, 3) : slide.bullets;
    bulletSlice.forEach((b, bIdx) => {
      const defaults = getDefaultAnimation(naturalOrder, effectiveConfig);
      rawTracks.push({
        id: `bullet:${bIdx}`,
        kind: "bullet",
        slotIndex: bIdx,
        label: resolveBulletLabel(slide, bIdx, language),
        subtitle:
          slide.layout === "process-3"
            ? `Process Step #${bIdx + 1}`
            : `Layout Card #${bIdx + 1}`,
        animation: {
          ...defaults,
          ...b.animation,
          order: b.animation?.order ?? naturalOrder,
        },
      });
      naturalOrder += 1;
    });
  }

  if (
    (slide.layout === "split-info" || slide.image?.animation) &&
    slide.layout !== "cover" &&
    slide.layout !== "full-image"
  ) {
    const defaults = getDefaultAnimation(naturalOrder, effectiveConfig);
    rawTracks.push({
      id: "image:main",
      kind: "image",
      label:
        (language === "ko"
          ? slide.image?.captionKo
          : slide.image?.captionId) || "Visual Image Slot",
      subtitle: "Layout Image",
      animation: {
        ...defaults,
        trigger: slide.image?.animation?.trigger || "withPrevious",
        ...slide.image?.animation,
        order: slide.image?.animation?.order ?? naturalOrder,
      },
    });
    naturalOrder += 1;
  }

  if (slide.overlayElements && slide.overlayElements.length > 0) {
    slide.overlayElements.forEach((el) => {
      const defaults = getDefaultAnimation(naturalOrder, effectiveConfig);
      let label = el.content?.trim() || "";
      let subtitle = "Canvas Object";

      if (el.type === "text") {
        label = label || "Text Box";
        subtitle = "Free-Form Text";
      } else if (el.type === "shape") {
        const variant = el.style?.shapeVariant || "shape";
        label = label || `Shape (${variant})`;
        subtitle = `Vector Shape • ${variant}`;
      } else if (el.type === "icon") {
        label = `Icon: ${el.style?.iconName || label || "symbol"}`;
        subtitle = "Vector Icon";
      } else if (el.type === "connector") {
        label = `Connector (${el.connector?.connectorType || "elbow"})`;
        subtitle = "Smart Connector";
      } else if (el.type === "image") {
        label = "Canvas Image";
        subtitle = "Overlay Image";
      }

      rawTracks.push({
        id: `overlay:${el.id}`,
        kind: "overlay",
        overlayId: el.id,
        label: label.length > 34 ? `${label.slice(0, 34)}…` : label,
        subtitle,
        animation: {
          ...defaults,
          ...el.animation,
          order: el.animation?.order ?? naturalOrder,
        },
      });
      naturalOrder += 1;
    });
  }

  // Sort chronologically by order
  const sortedRaw = [...rawTracks].sort(
    (a, b) => (a.animation.order ?? 0) - (b.animation.order ?? 0)
  );

  const tracks: SlideAnimationTrack[] = [];
  const stepStartTimesMs = new Map<number, number>();
  let currentStep = 0;
  let currentGroupStartMs = 0;
  let currentGroupMaxEndMs = 0;

  sortedRaw.forEach((item, idx) => {
    const duration = Math.max(100, item.animation.duration || 400);
    const delay = Math.max(0, item.animation.delay || 0);
    const trigger: ElementAnimationTrigger =
      idx === 0 && item.animation.trigger !== "onClick"
        ? "onClick"
        : item.animation.trigger || "onClick";

    let startMs = 0;
    let groupOffsetMs = delay;

    if (idx === 0 || trigger === "onClick") {
      currentStep += 1;
      currentGroupStartMs = idx === 0 ? 0 : currentGroupMaxEndMs + CLICK_GROUP_GAP_MS;
      stepStartTimesMs.set(currentStep, currentGroupStartMs);
      startMs = currentGroupStartMs + delay;
      groupOffsetMs = delay;
    } else if (trigger === "withPrevious") {
      const prev = tracks[idx - 1];
      startMs = prev.startMs + delay;
      groupOffsetMs = prev.groupOffsetMs + delay;
    } else {
      // afterPrevious
      const prev = tracks[idx - 1];
      startMs = prev.endMs + delay;
      groupOffsetMs = prev.groupOffsetMs + prev.animation.duration + delay;
    }

    const endMs = startMs + duration;
    currentGroupMaxEndMs = Math.max(currentGroupMaxEndMs, endMs);

    tracks.push({
      ...item,
      animation: {
        ...item.animation,
        trigger: idx === 0 ? "onClick" : trigger,
        duration,
        delay,
        order: idx,
      },
      stepIndex: currentStep,
      startMs,
      endMs,
      groupOffsetMs,
    });
  });

  const totalDurationMs = tracks.reduce((max, t) => Math.max(max, t.endMs), 0);

  return {
    tracks,
    totalSteps: currentStep,
    totalDurationMs,
    stepStartTimesMs,
  };
}

/**
 * Updates animation order on all slide slots and overlayElements to match orderedTrackIds.
 */
export function applyTrackOrderToSlide(
  slide: SlideData,
  orderedTrackIds: string[]
): SlideData {
  const schedule = buildSlideAnimationSchedule(slide);
  const existingMap = new Map(schedule.tracks.map((t) => [t.id, t.animation]));
  const orderMap = new Map<string, number>();
  orderedTrackIds.forEach((id, idx) => orderMap.set(id, idx));

  const nextBullets = slide.bullets?.map((b, idx) => {
    const id = `bullet:${idx}`;
    if (!orderMap.has(id) && !existingMap.has(id)) return b;
    const base = b.animation || existingMap.get(id) || getDefaultAnimation(idx, slide.buildInConfig);
    return {
      ...b,
      animation: {
        ...base,
        order: orderMap.get(id) ?? base.order ?? idx,
      },
    };
  });

  const nextStats = slide.stats?.map((st, idx) => {
    const id = `stat:${idx}`;
    if (!orderMap.has(id) && !existingMap.has(id)) return st;
    const base = st.animation || existingMap.get(id) || getDefaultAnimation(idx, slide.buildInConfig);
    return {
      ...st,
      animation: {
        ...base,
        order: orderMap.get(id) ?? base.order ?? idx,
      },
    };
  });

  const nextImage = slide.image
    ? orderMap.has("image:main") || existingMap.has("image:main")
      ? {
          ...slide.image,
          animation: {
            ...(slide.image.animation ||
              existingMap.get("image:main") ||
              getDefaultAnimation(0, slide.buildInConfig)),
            order: orderMap.get("image:main") ?? slide.image.animation?.order ?? 0,
          },
        }
      : slide.image
    : undefined;

  const nextOverlays = slide.overlayElements?.map((el, idx) => {
    const id = `overlay:${el.id}`;
    const base = el.animation || existingMap.get(id) || getDefaultAnimation(idx, slide.buildInConfig);
    return {
      ...el,
      animation: {
        ...base,
        order: orderMap.get(id) ?? base.order ?? idx,
      },
    };
  });

  return {
    ...slide,
    bullets: nextBullets,
    stats: nextStats,
    image: nextImage,
    overlayElements: nextOverlays,
  };
}

/**
 * Updates animation properties (trigger, effect, duration, delay) on a single track.
 */
export function updateTrackAnimationInSlide(
  slide: SlideData,
  trackId: string,
  patch: Partial<ElementAnimationConfig>
): SlideData {
  const schedule = buildSlideAnimationSchedule(slide);
  const track = schedule.tracks.find((t) => t.id === trackId);
  if (!track) return slide;

  const nextAnim: ElementAnimationConfig = {
    ...track.animation,
    ...patch,
  };

  if (track.kind === "bullet" && track.slotIndex !== undefined && slide.bullets) {
    const bullets = slide.bullets.map((b, idx) =>
      idx === track.slotIndex ? { ...b, animation: nextAnim } : b
    );
    return { ...slide, bullets };
  }

  if (track.kind === "stat" && track.slotIndex !== undefined && slide.stats) {
    const stats = slide.stats.map((st, idx) =>
      idx === track.slotIndex ? { ...st, animation: nextAnim } : st
    );
    return { ...slide, stats };
  }

  if (track.kind === "image" && slide.image) {
    return {
      ...slide,
      image: {
        ...slide.image,
        animation: nextAnim,
      },
    };
  }

  if (track.kind === "overlay" && track.overlayId && slide.overlayElements) {
    const overlayElements = slide.overlayElements.map((el) =>
      el.id === track.overlayId ? { ...el, animation: nextAnim } : el
    );
    return { ...slide, overlayElements };
  }

  return slide;
}

function getEffectStateStyles(
  isVisible: boolean,
  effect: ElementAnimationEffect,
  durationMs: number,
  delayMs: number
): BuildInItemState {
  if (effect === "bounce") {
    if (!isVisible) {
      return {
        isVisible: false,
        style: {
          opacity: 0,
          transform: "scale(0.78) translateY(14px)",
          pointerEvents: "none",
        },
        className: "pointer-events-none select-none",
      };
    }
    return {
      isVisible: true,
      style: {
        animationDuration: `${durationMs}ms`,
        animationDelay: `${delayMs}ms`,
        pointerEvents: "auto",
      },
      className: "animate-build-bounce",
    };
  }

  let hiddenTransform = "translateY(18px)";
  if (effect === "slideLeft") hiddenTransform = "translateX(28px)";
  else if (effect === "zoomIn") hiddenTransform = "scale(0.86)";
  else if (effect === "fade") hiddenTransform = "none";

  const easing = "cubic-bezier(0.16, 1, 0.3, 1)";
  return {
    isVisible,
    style: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "none" : hiddenTransform,
      transition: `opacity ${durationMs}ms ${easing} ${delayMs}ms, transform ${durationMs}ms ${easing} ${delayMs}ms`,
      pointerEvents: isVisible ? "auto" : "none",
    },
    className: isVisible ? "animate-in-build" : "pointer-events-none select-none",
  };
}

/**
 * Computes live animation visibility/styles for any named slot or overlay element track.
 */
export function getElementBuildInState(
  trackId: string,
  slide: SlideData,
  buildInStep?: number,
  configOverride?: ComponentBuildInConfig
): BuildInItemState {
  const effectiveConfig = configOverride || slide.buildInConfig;

  if (buildInStep === undefined || (effectiveConfig && effectiveConfig.enabled === false)) {
    return {
      isVisible: true,
      style: {
        transition: "opacity 0.25s ease, transform 0.25s ease",
      },
      className: "",
    };
  }

  const schedule = buildSlideAnimationSchedule(slide, "en", effectiveConfig);
  const track = schedule.tracks.find((t) => t.id === trackId);
  if (!track) {
    return {
      isVisible: true,
      style: {},
      className: "",
    };
  }

  const isVisible = track.stepIndex <= buildInStep;
  return getEffectStateStyles(
    isVisible,
    track.animation.effect,
    track.animation.duration,
    track.groupOffsetMs
  );
}

/**
 * Backwards-compatible slot helper used by layout components.
 * When `slide` and `trackId` are passed, uses per-slot ElementAnimationConfig.
 */
export function getBuildInItemState(
  itemIndex: number,
  buildInStep?: number,
  config?: ComponentBuildInConfig,
  slide?: SlideData,
  trackId?: string
): BuildInItemState {
  if (slide && trackId) {
    return getElementBuildInState(trackId, slide, buildInStep, config);
  }

  if (buildInStep === undefined || (config && config.enabled === false)) {
    return {
      isVisible: true,
      style: {
        transition: "opacity 0.3s ease, transform 0.3s ease",
      },
      className: "",
    };
  }

  const isVisible = itemIndex + 1 <= buildInStep;
  const effect = mapLegacyAnimationToEffect(config?.animation);
  return getEffectStateStyles(isVisible, effect, 380, 0);
}
