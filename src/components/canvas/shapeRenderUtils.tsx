import React from "react";
import {
  CanvasAnchorSide,
  CanvasConnectorType,
  CanvasElement,
  CanvasElementStyle,
  CanvasShapeStylePreset,
  CanvasShapeVariant,
  PresentationTheme,
} from "../../types";
import { isLightBackground } from "../../utils/luminosity";

export const SVG_VIEWBOX_W = 1000;
export const SVG_VIEWBOX_H = 562.5;

export function isSvgShapeVariant(variant?: CanvasShapeVariant): boolean {
  return (
    variant === "triangle" ||
    variant === "diamond" ||
    variant === "callout" ||
    variant === "arrow-right" ||
    variant === "arrow-left" ||
    variant === "arrow-up" ||
    variant === "arrow-down" ||
    variant === "arrow-bidirectional"
  );
}

/**
 * Generates theme-adaptive style attributes for a shape preset.
 */
export function buildShapePresetStyle(
  preset: CanvasShapeStylePreset,
  theme: PresentationTheme,
  isLine = false
): Partial<CanvasElementStyle> {
  const accent = theme.accentColor || "#3b82f6";
  const accentSecondary = theme.accentSecondary || "#10b981";
  const isLightTheme = isLightBackground(theme.canvasBg || "#0f172a");

  if (isLine) {
    switch (preset) {
      case "outline":
        return {
          shapePreset: preset,
          backgroundColor: accentSecondary,
          borderColor: accentSecondary,
          borderWidth: 0,
          strokeWidth: 2,
          boxShadow: "none",
          backdropFilter: undefined,
          opacity: 0.85,
        };
      case "glass":
        return {
          shapePreset: preset,
          backgroundColor: isLightTheme ? "rgba(15,23,42,0.28)" : "rgba(255,255,255,0.45)",
          borderColor: "transparent",
          borderWidth: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          backdropFilter: "blur(8px)",
          opacity: 1,
        };
      case "shadow":
        return {
          shapePreset: preset,
          backgroundColor: accent,
          borderColor: accent,
          borderWidth: 0,
          boxShadow: `0 6px 16px ${accent}66`,
          backdropFilter: undefined,
          opacity: 1,
        };
      case "solid":
      default:
        return {
          shapePreset: "solid",
          backgroundColor: accent,
          borderColor: accent,
          borderWidth: 0,
          boxShadow: "none",
          backdropFilter: undefined,
          opacity: 1,
        };
    }
  }

  switch (preset) {
    case "solid":
      return {
        shapePreset: "solid",
        backgroundColor: accent,
        borderColor: accentSecondary,
        borderWidth: 1.5,
        strokeWidth: 1.5,
        color: isLightBackground(accent) ? "#0f172a" : "#ffffff",
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.25)",
        backdropFilter: undefined,
        opacity: 1,
      };
    case "outline":
      return {
        shapePreset: "outline",
        backgroundColor: "transparent",
        borderColor: accent,
        borderWidth: 2.5,
        strokeWidth: 2.5,
        color: isLightTheme ? "#0f172a" : "#f8fafc",
        boxShadow: "none",
        backdropFilter: undefined,
        opacity: 1,
      };
    case "glass":
      return {
        shapePreset: "glass",
        backgroundColor: isLightTheme ? `${accent}24` : `${accent}2e`,
        borderColor: isLightTheme ? "rgba(15, 23, 42, 0.24)" : "rgba(255, 255, 255, 0.34)",
        borderWidth: 1.5,
        strokeWidth: 1.5,
        color: isLightTheme ? "#0f172a" : "#ffffff",
        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.28)",
        backdropFilter: "blur(12px)",
        opacity: 1,
      };
    case "shadow":
      return {
        shapePreset: "shadow",
        backgroundColor: isLightTheme ? "#ffffff" : "#161d2f",
        borderColor: `${accent}88`,
        borderWidth: 1.5,
        strokeWidth: 1.5,
        color: isLightTheme ? "#0f172a" : "#f8fafc",
        boxShadow: `0 18px 40px -6px rgba(0, 0, 0, 0.55), 0 0 0 1px ${accent}33`,
        backdropFilter: undefined,
        opacity: 1,
      };
  }
}

interface SvgVectorShapeProps {
  variant: CanvasShapeVariant;
  fill: string;
  stroke: string;
  strokeWidth: number;
  className?: string;
}

/**
 * Renders scalable SVG geometry for geometric, callout, and block arrow variants.
 */
export const SvgVectorShape: React.FC<SvgVectorShapeProps> = ({
  variant,
  fill,
  stroke,
  strokeWidth,
  className = "w-full h-full",
}) => {
  const commonProps = {
    fill: fill === "transparent" ? "none" : fill,
    stroke: strokeWidth > 0 ? stroke : "none",
    strokeWidth,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {variant === "rectangle" && (
        <rect x="2" y="2" width="96" height="96" rx="3" {...commonProps} />
      )}
      {variant === "rounded" && (
        <rect x="2" y="2" width="96" height="96" rx="18" {...commonProps} />
      )}
      {variant === "circle" && (
        <ellipse cx="50" cy="50" rx="48" ry="48" {...commonProps} />
      )}
      {variant === "pill" && (
        <rect x="2" y="20" width="96" height="60" rx="30" {...commonProps} />
      )}
      {variant === "line" && (
        <line
          x1="4"
          y1="50"
          x2="96"
          y2="50"
          stroke={stroke !== "transparent" ? stroke : fill}
          strokeWidth={Math.max(3, strokeWidth || 3)}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {variant === "triangle" && (
        <polygon points="50,4 96,95 4,95" {...commonProps} />
      )}
      {variant === "diamond" && (
        <polygon points="50,3 97,50 50,97 3,50" {...commonProps} />
      )}
      {variant === "callout" && (
        <path
          d="M 10,4 H 90 Q 97,4 97,13 V 67 Q 97,76 90,76 H 38 L 19,96 L 24,76 H 10 Q 3,76 3,67 V 13 Q 3,4 10,4 Z"
          {...commonProps}
        />
      )}
      {variant === "arrow-right" && (
        <polygon points="3,28 60,28 60,6 97,50 60,94 60,72 3,72" {...commonProps} />
      )}
      {variant === "arrow-left" && (
        <polygon points="97,28 40,28 40,6 3,50 40,94 40,72 97,72" {...commonProps} />
      )}
      {variant === "arrow-up" && (
        <polygon points="50,3 94,40 72,40 72,97 28,97 28,40 6,40" {...commonProps} />
      )}
      {variant === "arrow-down" && (
        <polygon points="28,3 72,3 72,60 94,60 50,97 6,60 28,60" {...commonProps} />
      )}
      {variant === "arrow-bidirectional" && (
        <polygon
          points="3,50 28,10 28,31 72,31 72,10 97,50 72,90 72,69 28,69 28,90"
          {...commonProps}
        />
      )}
    </svg>
  );
};

export interface ComputedConnectorGeometry {
  valid: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  pathD: string;
  connectorType: CanvasConnectorType;
  /** Bounds in slide percentage 0..100 */
  boundsPct: { x: number; y: number; width: number; height: number };
}

function getAnchorCoords(
  el: CanvasElement,
  side: Exclude<CanvasAnchorSide, "auto">
): { x: number; y: number } {
  const left = (el.x / 100) * SVG_VIEWBOX_W;
  const top = (el.y / 100) * SVG_VIEWBOX_H;
  const w = (el.width / 100) * SVG_VIEWBOX_W;
  const h = (el.height / 100) * SVG_VIEWBOX_H;

  switch (side) {
    case "top":
      return { x: left + w / 2, y: top };
    case "right":
      return { x: left + w, y: top + h / 2 };
    case "bottom":
      return { x: left + w / 2, y: top + h };
    case "left":
      return { x: left, y: top + h / 2 };
  }
}

/**
 * Resolves live connector endpoints and SVG path in 1000 x 562.5 coordinate space.
 * Supports dynamic tracking of connected CanvasElement nodes during drag/resize.
 */
export function computeConnectorGeometry(
  connectorEl: CanvasElement,
  elements: CanvasElement[]
): ComputedConnectorGeometry {
  const cfg = connectorEl.connector;
  const connectorType: CanvasConnectorType = cfg?.connectorType || "elbow";

  const sourceEl = cfg?.sourceId ? elements.find((e) => e.id === cfg.sourceId) : undefined;
  const targetEl = cfg?.targetId ? elements.find((e) => e.id === cfg.targetId) : undefined;

  let x1 = (connectorEl.x / 100) * SVG_VIEWBOX_W;
  let y1 = (connectorEl.y / 100) * SVG_VIEWBOX_H;
  let x2 = ((connectorEl.x + connectorEl.width) / 100) * SVG_VIEWBOX_W;
  let y2 = ((connectorEl.y + connectorEl.height) / 100) * SVG_VIEWBOX_H;

  let sSide: Exclude<CanvasAnchorSide, "auto"> = "right";
  let tSide: Exclude<CanvasAnchorSide, "auto"> = "left";
  let horizontalDominant = true;

  if (sourceEl && targetEl) {
    const sCx = (sourceEl.x + sourceEl.width / 2) * (SVG_VIEWBOX_W / 100);
    const sCy = (sourceEl.y + sourceEl.height / 2) * (SVG_VIEWBOX_H / 100);
    const tCx = (targetEl.x + targetEl.width / 2) * (SVG_VIEWBOX_W / 100);
    const tCy = (targetEl.y + targetEl.height / 2) * (SVG_VIEWBOX_H / 100);

    const dx = tCx - sCx;
    const dy = tCy - sCy;
    horizontalDominant = Math.abs(dx) >= Math.abs(dy);

    if (cfg?.sourceAnchor && cfg.sourceAnchor !== "auto") {
      sSide = cfg.sourceAnchor;
    } else if (horizontalDominant) {
      sSide = dx >= 0 ? "right" : "left";
    } else {
      sSide = dy >= 0 ? "bottom" : "top";
    }

    if (cfg?.targetAnchor && cfg.targetAnchor !== "auto") {
      tSide = cfg.targetAnchor;
    } else if (horizontalDominant) {
      tSide = dx >= 0 ? "left" : "right";
    } else {
      tSide = dy >= 0 ? "top" : "bottom";
    }

    const p1 = getAnchorCoords(sourceEl, sSide);
    const p2 = getAnchorCoords(targetEl, tSide);
    x1 = p1.x;
    y1 = p1.y;
    x2 = p2.x;
    y2 = p2.y;
  }

  let pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  let midX = (x1 + x2) / 2;
  let midY = (y1 + y2) / 2;

  if (connectorType === "elbow") {
    const exitHorizontal = sSide === "left" || sSide === "right";
    const enterHorizontal = tSide === "left" || tSide === "right";

    if (exitHorizontal && enterHorizontal) {
      const bendX = (x1 + x2) / 2;
      pathD = `M ${x1} ${y1} L ${bendX} ${y1} L ${bendX} ${y2} L ${x2} ${y2}`;
      midX = bendX;
      midY = (y1 + y2) / 2;
    } else if (!exitHorizontal && !enterHorizontal) {
      const bendY = (y1 + y2) / 2;
      pathD = `M ${x1} ${y1} L ${x1} ${bendY} L ${x2} ${bendY} L ${x2} ${y2}`;
      midX = (x1 + x2) / 2;
      midY = bendY;
    } else if (exitHorizontal) {
      pathD = `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
      midX = x2;
      midY = y1;
    } else {
      pathD = `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
      midX = x1;
      midY = y2;
    }
  }

  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);

  return {
    valid: Boolean(sourceEl && targetEl) || !cfg,
    x1,
    y1,
    x2,
    y2,
    midX,
    midY,
    pathD,
    connectorType,
    boundsPct: {
      x: (minX / SVG_VIEWBOX_W) * 100,
      y: (minY / SVG_VIEWBOX_H) * 100,
      width: Math.max(1.5, ((maxX - minX) / SVG_VIEWBOX_W) * 100),
      height: Math.max(1.5, ((maxY - minY) / SVG_VIEWBOX_H) * 100),
    },
  };
}
