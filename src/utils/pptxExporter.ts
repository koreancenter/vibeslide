import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PptxGenJS from "pptxgenjs";
import {
  CanvasElement,
  Language,
  PresentationTheme,
  SlideData,
} from "../types";
import { getAccessibleTheme, isLightBackground, parseColor } from "./luminosity";
import { getJapaneseFallbackText } from "./translationDictionary";
import { isSafeImageUrl } from "./security";
import { getLucideIconComponent } from "../data/iconRegistry";
import {
  SVG_VIEWBOX_H,
  SVG_VIEWBOX_W,
  computeConnectorGeometry,
} from "../components/canvas/shapeRenderUtils";

export interface ExportPptxOptions {
  slides: SlideData[];
  theme: PresentationTheme;
  language: Language;
  title?: string;
  fileName?: string;
  onProgress?: (current: number, total: number, message: string) => void;
}

const SLIDE_W = 10; // 16:9 standard width in inches
const SLIDE_H = 5.625; // 16:9 standard height in inches
const PX_TO_PT = 720 / 1024; // 10in * 72pt/in = 720pt across a 1024px reference canvas

interface PptxColorResult {
  color: string;
  transparency?: number;
}

function toPptxColor(
  cssColor: string | undefined,
  fallbackHex: string = "0F172A"
): PptxColorResult {
  if (!cssColor || cssColor.trim().toLowerCase() === "transparent") {
    return { color: fallbackHex.replace("#", "").toUpperCase(), transparency: 100 };
  }
  const parsed = parseColor(cssColor);
  if (!parsed) {
    const clean = fallbackHex.replace("#", "").toUpperCase();
    return { color: /^[0-9A-F]{6}$/.test(clean) ? clean : "0F172A" };
  }
  const hex = [parsed.r, parsed.g, parsed.b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const res: PptxColorResult = { color: hex };
  if (parsed.a < 0.995) {
    res.transparency = Math.max(0, Math.min(99, Math.round((1 - parsed.a) * 100)));
  }
  return res;
}

function toSolidHex(cssColor: string | undefined, fallbackHex: string = "3B82F6"): string {
  return toPptxColor(cssColor, fallbackHex).color;
}

function resolveFontFamily(fontFamily?: string): string {
  if (!fontFamily) return "Arial";
  const first = fontFamily.split(",")[0]?.replace(/["']/g, "").trim();
  if (!first || first === "sans-serif" || first === "serif" || first === "monospace") {
    return "Arial";
  }
  return first;
}

function resolveLocalizedText(
  language: Language,
  ko: string = "",
  id: string = "",
  ja?: string
): string {
  if (language === "ko") return ko || id || "";
  if (language === "ja") return ja || getJapaneseFallbackText(ko || id) || id || ko || "";
  if (language === "id" || language === "en") return id || ko || "";
  if (!ko && !id) return "";
  return id || ko || "";
}

function resolveRawText(
  language: Language,
  ko: string = "",
  id: string = "",
  ja?: string
): string {
  if (language === "ko") return ko || id || "";
  if (language === "ja") return ja || getJapaneseFallbackText(ko || id) || id || ko || "";
  if (language === "id" || language === "en") return id || ko || "";
  if (ko && id && ko !== id) return `${ko} / ${id}`;
  return id || ko || "";
}

function resolveSpeakerNotes(slide: SlideData, language: Language): string {
  const genericNotes = (slide as SlideData & { speakerNotes?: string }).speakerNotes;
  if (language === "ko") return slide.notesKo || genericNotes || slide.notesId || slide.notesJa || "";
  if (language === "ja") return slide.notesJa || genericNotes || slide.notesKo || slide.notesId || "";
  return slide.notesId || genericNotes || slide.notesKo || slide.notesJa || "";
}

const imageCache = new Map<string, string | null>();

async function rasterizeImageToPng(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 1200;
        const h = img.naturalHeight || img.height || 675;
        const maxDim = 1920;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadImageAsDataUri(rawUrl?: string): Promise<string | null> {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || !isSafeImageUrl(trimmed)) return null;
  if (imageCache.has(trimmed)) return imageCache.get(trimmed) ?? null;

  if (trimmed.startsWith("data:image/")) {
    // Convert webp/svg data URLs to PNG so PowerPoint always opens cleanly
    if (trimmed.startsWith("data:image/png") || trimmed.startsWith("data:image/jpeg")) {
      imageCache.set(trimmed, trimmed);
      return trimmed;
    }
    const pngData = await rasterizeImageToPng(trimmed);
    imageCache.set(trimmed, pngData);
    return pngData;
  }

  let resolvedUrl = trimmed;
  if (trimmed.startsWith("/") && typeof window !== "undefined") {
    resolvedUrl = `${window.location.origin}${trimmed}`;
  }

  try {
    const response = await fetch(resolvedUrl, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const mime = blob.type.toLowerCase();
      const objectUrl = URL.createObjectURL(blob);
      try {
        if (mime === "image/png" || mime === "image/jpeg") {
          const dataUrl = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(typeof reader.result === "string" ? reader.result : null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            imageCache.set(trimmed, dataUrl);
            return dataUrl;
          }
        }
        const pngData = await rasterizeImageToPng(objectUrl);
        if (pngData) {
          imageCache.set(trimmed, pngData);
          return pngData;
        }
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
  } catch {
    // Fall back to img + canvas rasterization
  }

  const rasterFallback = await rasterizeImageToPng(resolvedUrl);
  imageCache.set(trimmed, rasterFallback);
  return rasterFallback;
}

interface ParsedChartPoint {
  label: string;
  value: number;
  displayVal: string;
}

function extractChartData(slide: SlideData, language: Language): ParsedChartPoint[] {
  const bullets = slide.bullets || [];
  const stats = slide.stats || [];

  if (bullets.length > 0) {
    return bullets.map((b, idx) => {
      const label =
        resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa) ||
        (language === "ko" ? `항목 ${idx + 1}` : `Item ${idx + 1}`);
      const rawVal = resolveLocalizedText(language, b.descKo, b.descId, b.descJa) || "";
      const match = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
      const parsedVal = match ? parseFloat(match[0]) : (idx + 1) * 20;
      return {
        label,
        value: parsedVal,
        displayVal: rawVal || `${parsedVal}%`,
      };
    });
  }

  if (stats.length > 0) {
    return stats.map((st, idx) => {
      const label =
        resolveLocalizedText(language, st.labelKo, st.labelId, st.labelJa) ||
        (language === "ko" ? `지표 ${idx + 1}` : `Metric ${idx + 1}`);
      const rawVal = st.value || "";
      const match = rawVal.match(/[-+]?[0-9]*\.?[0-9]+/);
      const parsedVal = match ? parseFloat(match[0]) : (idx + 1) * 25;
      return {
        label,
        value: parsedVal,
        displayVal: rawVal || `${parsedVal}%`,
      };
    });
  }

  return [];
}

function renderWaterfallToDataUri(
  chartData: ParsedChartPoint[],
  theme: PresentationTheme,
  fontFace: string
): string | null {
  if (chartData.length === 0 || typeof document === "undefined") return null;

  const width = 1600;
  const height = 660;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isLight = isLightBackground(theme.cardBg || theme.canvasBg);
  const textMain = isLight ? "#0f172a" : "#f8fafc";
  const textMuted = isLight ? "#475569" : "#94a3b8";
  const gridColor = isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.15)";

  ctx.clearRect(0, 0, width, height);

  let cumulative = 0;
  const bars = chartData.map((item) => {
    const start = cumulative;
    const end = cumulative + item.value;
    cumulative = end;
    return { ...item, start, end, isTotal: false };
  });

  if (bars.length > 1) {
    bars.push({
      label: "Total",
      value: cumulative,
      displayVal: cumulative.toLocaleString(),
      start: 0,
      end: cumulative,
      isTotal: true,
    });
  }

  const maxCum = Math.max(...bars.map((d) => Math.max(d.start, d.end)), 1);
  const minCum = Math.min(...bars.map((d) => Math.min(d.start, d.end)), 0);
  const range = maxCum - minCum || 1;

  const padL = 70;
  const padR = 70;
  const padT = 72;
  const padB = 110;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Gridlines
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  for (let i = 0; i <= 3; i++) {
    const y = padT + (plotH * i) / 3;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(width - padR, y);
    ctx.stroke();
  }
  ctx.restore();

  // Baseline
  const zeroY = padT + plotH - ((0 - minCum) / range) * plotH;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, zeroY);
  ctx.lineTo(width - padR, zeroY);
  ctx.stroke();

  const colW = plotW / bars.length;
  const barW = Math.min(110, colW * 0.56);

  bars.forEach((item, idx) => {
    const topVal = Math.max(item.start, item.end);
    const botVal = Math.min(item.start, item.end);
    const topY = padT + plotH - ((topVal - minCum) / range) * plotH;
    const botY = padT + plotH - ((botVal - minCum) / range) * plotH;
    const barH = Math.max(12, botY - topY);
    const x = padL + idx * colW + (colW - barW) / 2;

    const color = item.isTotal
      ? "#3B82F6"
      : item.value >= 0
      ? "#10B981"
      : "#EF4444";

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(x, topY, barW, barH, 8);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Value label
    ctx.fillStyle = textMain;
    ctx.font = `bold 24px ${fontFace}, Arial, sans-serif`;
    ctx.textAlign = "center";
    const valStr =
      item.value >= 0 && !item.isTotal ? `+${item.displayVal}` : item.displayVal;
    ctx.fillText(valStr, x + barW / 2, Math.max(30, topY - 14), colW * 0.9);

    // X-axis label
    ctx.fillStyle = item.isTotal ? color : textMain;
    ctx.font = `bold 22px ${fontFace}, Arial, sans-serif`;
    ctx.fillText(item.label.split(" (")[0], x + barW / 2, height - 56, colW * 0.92);

    ctx.fillStyle = textMuted;
    ctx.font = `18px ${fontFace}, Arial, sans-serif`;
    ctx.fillText(item.displayVal, x + barW / 2, height - 26, colW * 0.92);
  });

  return canvas.toDataURL("image/png");
}

function addFrameHeader(
  pptxSlide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  slide: SlideData,
  theme: PresentationTheme,
  language: Language,
  slideIdx: number,
  totalSlides: number,
  fontFace: string
) {
  const accentHex = toSolidHex(theme.accentColor, "3B82F6");
  const mutedHex = toSolidHex(theme.textMuted, "94A3B8");
  const cardColor = toPptxColor(theme.cardBg, "1E293B");
  const borderColor = toPptxColor(theme.borderColor, "334155");

  // Accent status dot
  pptxSlide.addShape(pptx.ShapeType.ellipse, {
    x: 0.55,
    y: 0.34,
    w: 0.09,
    h: 0.09,
    fill: { color: accentHex },
    line: { type: "none" },
  });

  // Category label
  const category = resolveRawText(language, slide.categoryKo, slide.categoryId, slide.categoryJa);
  pptxSlide.addText(category.toUpperCase(), {
    x: 0.72,
    y: 0.25,
    w: 7.4,
    h: 0.26,
    fontFace,
    fontSize: 9,
    bold: true,
    color: mutedHex,
    valign: "middle",
    margin: 0,
  });

  // Slide counter pill
  pptxSlide.addShape(pptx.ShapeType.roundRect, {
    x: 8.75,
    y: 0.26,
    w: 0.7,
    h: 0.24,
    rectRadius: 0.25,
    fill: cardColor,
    line: { color: borderColor.color, width: 0.5, transparency: borderColor.transparency },
  });
  pptxSlide.addText(`${slideIdx + 1} / ${totalSlides}`, {
    x: 8.75,
    y: 0.26,
    w: 0.7,
    h: 0.24,
    fontFace,
    fontSize: 8.5,
    color: mutedHex,
    align: "center",
    valign: "middle",
    margin: 0,
  });

  // Header divider line
  pptxSlide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 0.55,
    w: 8.9,
    h: 0.012,
    fill: borderColor,
    line: { type: "none" },
  });
}

function addFrameFooter(
  pptxSlide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  slide: SlideData,
  theme: PresentationTheme,
  fontFace: string,
  overrideColor?: string
) {
  const mutedHex = overrideColor || toSolidHex(theme.textMuted, "94A3B8");
  const borderColor = overrideColor
    ? { color: overrideColor, transparency: 70 }
    : toPptxColor(theme.borderColor, "334155");

  pptxSlide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 5.18,
    w: 8.9,
    h: 0.012,
    fill: borderColor,
    line: { type: "none" },
  });

  pptxSlide.addText(slide.docCode || "KIND-2026", {
    x: 0.55,
    y: 5.23,
    w: 4.0,
    h: 0.24,
    fontFace,
    fontSize: 8.5,
    color: mutedHex,
    valign: "middle",
    margin: 0,
  });

  pptxSlide.addText("Official Strategic Presentation", {
    x: 5.45,
    y: 5.23,
    w: 4.0,
    h: 0.24,
    fontFace,
    fontSize: 8.5,
    color: mutedHex,
    align: "right",
    valign: "middle",
    margin: 0,
  });
}

function addTitleBlock(
  pptxSlide: PptxGenJS.Slide,
  title: string,
  subtitle: string,
  theme: PresentationTheme,
  fontFace: string
): number {
  const textHex = toSolidHex(theme.textColor, "F8FAFC");
  const mutedHex = toSolidHex(theme.textMuted, "94A3B8");

  pptxSlide.addText(title || "Untitled Slide", {
    x: 0.55,
    y: 0.64,
    w: 8.9,
    h: 0.44,
    fontFace,
    fontSize: 20,
    bold: true,
    color: textHex,
    valign: "top",
    wrap: true,
    margin: 0,
  });

  if (subtitle) {
    pptxSlide.addText(subtitle, {
      x: 0.55,
      y: 1.07,
      w: 8.9,
      h: 0.34,
      fontFace,
      fontSize: 10.5,
      color: mutedHex,
      valign: "top",
      wrap: true,
      margin: 0,
    });
    return 1.48;
  }

  return 1.18;
}

function addCalloutBox(
  pptxSlide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  callout: string,
  theme: PresentationTheme,
  fontFace: string,
  y: number = 4.66
) {
  if (!callout) return;
  const accentHex = toSolidHex(theme.accentColor, "3B82F6");
  const cardColor = toPptxColor(theme.cardBg, "1E293B");
  const borderColor = toPptxColor(theme.borderColor, "334155");
  const textHex = toSolidHex(theme.textColor, "F8FAFC");

  pptxSlide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y,
    w: 8.9,
    h: 0.42,
    rectRadius: 0.08,
    fill: cardColor,
    line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
  });

  // Left accent bar
  pptxSlide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y,
    w: 0.06,
    h: 0.42,
    fill: { color: accentHex },
    line: { type: "none" },
  });

  pptxSlide.addText(callout, {
    x: 0.72,
    y,
    w: 8.6,
    h: 0.42,
    fontFace,
    fontSize: 9.5,
    bold: true,
    color: textHex,
    valign: "middle",
    wrap: true,
    margin: 2,
  });
}

async function renderOverlayElements(
  pptxSlide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  elements: CanvasElement[] | undefined,
  fontFace: string
) {
  if (!elements || elements.length === 0) return;

  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  for (const el of sorted) {
    const x = Math.max(0, (el.x / 100) * SLIDE_W);
    const y = Math.max(0, (el.y / 100) * SLIDE_H);
    const w = Math.max(0.08, (el.width / 100) * SLIDE_W);
    const h = Math.max(0.04, (el.height / 100) * SLIDE_H);
    const rotate = el.rotation || 0;
    const baseOpacity = el.style?.opacity ?? 1;

    const combineTransparency = (colorTrans?: number): number | undefined => {
      const aColor = colorTrans !== undefined ? 1 - colorTrans / 100 : 1;
      const totalAlpha = Math.max(0, Math.min(1, aColor * baseOpacity));
      if (totalAlpha >= 0.995) return undefined;
      return Math.max(0, Math.min(99, Math.round((1 - totalAlpha) * 100)));
    };

    const hasFill =
      el.style?.backgroundColor &&
      el.style.backgroundColor.trim().toLowerCase() !== "transparent";
    const fillParsed = hasFill ? toPptxColor(el.style.backgroundColor, "1E293B") : null;
    const fillOpt: PptxGenJS.ShapeFillProps | undefined = fillParsed
      ? { color: fillParsed.color, transparency: combineTransparency(fillParsed.transparency) }
      : { type: "none" };

      const effectiveStrokeW = el.style?.strokeWidth ?? el.style?.borderWidth ?? 0;
      const hasBorder = effectiveStrokeW > 0 && el.style?.borderColor;
      const borderParsed = hasBorder ? toPptxColor(el.style.borderColor, "94A3B8") : null;
      const lineOpt: PptxGenJS.ShapeLineProps | undefined = borderParsed
        ? {
            color: borderParsed.color,
            width: Math.max(0.5, effectiveStrokeW * 0.75),
            transparency: combineTransparency(borderParsed.transparency),
          }
        : { type: "none" };

    if (el.type === "text") {
      const textParsed = toPptxColor(el.style?.color, "F8FAFC");
      const weight = el.style?.fontWeight || "normal";
      const isBold = weight === "semibold" || weight === "bold" || weight === "extrabold";
      const fontSize = Math.max(7, Math.round((el.style?.fontSize || 16) * PX_TO_PT));
      const radiusPx = el.style?.borderRadius ?? 6;
      const shape = radiusPx > 0 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;

      pptxSlide.addText(el.content || " ", {
        x,
        y,
        w,
        h,
        shape,
        rectRadius: radiusPx > 0 ? Math.min(0.4, radiusPx / 60) : 0,
        fill: fillOpt,
        line: lineOpt,
        rotate,
        fontFace,
        fontSize,
        bold: isBold,
        color: textParsed.color,
        transparency: combineTransparency(textParsed.transparency),
        align: el.style?.textAlign || "left",
        valign: "middle",
        wrap: true,
        margin: 4,
      });
    } else if (el.type === "shape") {
      const variant = el.style?.shapeVariant || "rounded";
      if (variant === "line") {
        const lineColor = fillParsed || borderParsed || { color: "3B82F6" };
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x,
          y: y + h / 2 - 0.02,
          w,
          h: Math.max(0.03, Math.min(0.12, h)),
          rotate,
          fill: {
            color: lineColor.color,
            transparency: combineTransparency(lineColor.transparency),
          },
          line: { type: "none" },
        });
      } else {
        let shapeType = pptx.ShapeType.rect;
        let rectRadius = 0;
        if (variant === "circle") {
          shapeType = pptx.ShapeType.ellipse;
        } else if (variant === "pill") {
          shapeType = pptx.ShapeType.roundRect;
          rectRadius = 1;
        } else if (variant === "rounded") {
          shapeType = pptx.ShapeType.roundRect;
          rectRadius = Math.min(0.45, (el.style?.borderRadius ?? 12) / 60);
        } else if (variant === "triangle") {
          shapeType = pptx.ShapeType.triangle;
        } else if (variant === "diamond") {
          shapeType = pptx.ShapeType.diamond;
        } else if (variant === "callout") {
          shapeType = pptx.ShapeType.wedgeRoundRectCallout;
        } else if (variant === "arrow-right") {
          shapeType = pptx.ShapeType.rightArrow;
        } else if (variant === "arrow-left") {
          shapeType = pptx.ShapeType.leftArrow;
        } else if (variant === "arrow-up") {
          shapeType = pptx.ShapeType.upArrow;
        } else if (variant === "arrow-down") {
          shapeType = pptx.ShapeType.downArrow;
        } else if (variant === "arrow-bidirectional") {
          shapeType = pptx.ShapeType.leftRightArrow;
        }

        const labelText = (el.content || "").trim();
        if (labelText) {
          const textParsed = toPptxColor(el.style?.color, "FFFFFF");
          const fontSize = Math.max(7, Math.round((el.style?.fontSize || 14) * PX_TO_PT));
          pptxSlide.addText(labelText, {
            x,
            y,
            w,
            h,
            shape: shapeType,
            rectRadius,
            fill: fillOpt,
            line: lineOpt,
            rotate,
            fontFace,
            fontSize,
            bold: true,
            color: textParsed.color,
            transparency: combineTransparency(textParsed.transparency),
            align: el.style?.textAlign || "center",
            valign: "middle",
            wrap: true,
            margin: 4,
          });
        } else {
          pptxSlide.addShape(shapeType, {
            x,
            y,
            w,
            h,
            rotate,
            rectRadius,
            fill: fillOpt,
            line: lineOpt,
          });
        }
      }
    } else if (el.type === "icon") {
      const IconComp = getLucideIconComponent(el.style?.iconName || el.content);
      const iconHex = el.style?.color || "#3B82F6";
      const iconStroke = el.style?.strokeWidth || 2;
      try {
        const svgMarkup = renderToStaticMarkup(
          React.createElement(IconComp, {
            xmlns: "http://www.w3.org/2000/svg",
            width: 256,
            height: 256,
            color: iconHex,
            strokeWidth: iconStroke,
          })
        );
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
        const pngUri = await rasterizeImageToPng(svgDataUrl);
        if (pngUri) {
          pptxSlide.addImage({
            data: pngUri,
            x,
            y,
            w,
            h,
            rotate,
            transparency:
              baseOpacity < 0.995
                ? Math.max(0, Math.min(99, Math.round((1 - baseOpacity) * 100)))
                : undefined,
            sizing: { type: "contain", w, h },
          });
        }
      } catch {
        // Fallback badge shape if SVG serialization fails
        pptxSlide.addShape(pptx.ShapeType.ellipse, {
          x,
          y,
          w,
          h,
          fill: { color: toSolidHex(iconHex, "3B82F6"), transparency: 25 },
          line: { color: toSolidHex(iconHex, "3B82F6"), width: 1.5 },
        });
      }
    } else if (el.type === "connector") {
      const geom = computeConnectorGeometry(el, elements);
      const cParsed = toPptxColor(el.style?.borderColor || el.style?.color || "#3B82F6", "3B82F6");
      const cWidthPt = Math.max(1, (el.style?.strokeWidth || 3) * 0.75);
      const toInX = (vx: number) => (vx / SVG_VIEWBOX_W) * SLIDE_W;
      const toInY = (vy: number) => (vy / SVG_VIEWBOX_H) * SLIDE_H;

      const addSegment = (
        ax: number,
        ay: number,
        bx: number,
        by: number,
        startArrow: boolean,
        endArrow: boolean
      ) => {
        const sx = Math.min(ax, bx);
        const sy = Math.min(ay, by);
        const sw = Math.max(0.01, Math.abs(bx - ax));
        const sh = Math.max(0.01, Math.abs(by - ay));
        pptxSlide.addShape(pptx.ShapeType.line, {
          x: sx,
          y: sy,
          w: sw,
          h: sh,
          flipH: bx < ax,
          flipV: by < ay,
          line: {
            color: cParsed.color,
            width: cWidthPt,
            transparency: combineTransparency(cParsed.transparency),
            beginArrowType: startArrow ? "triangle" : "none",
            endArrowType: endArrow ? "triangle" : "none",
          },
        });
      };

      const hasStart = Boolean(el.connector?.arrowStart);
      const hasEnd = el.connector?.arrowEnd ?? true;
      const ix1 = toInX(geom.x1);
      const iy1 = toInY(geom.y1);
      const ix2 = toInX(geom.x2);
      const iy2 = toInY(geom.y2);

      if (geom.connectorType === "straight") {
        addSegment(ix1, iy1, ix2, iy2, hasStart, hasEnd);
      } else {
        // Parse elbow polyline vertices from SVG pathD
        const nums = geom.pathD.match(/-?[0-9]*\.?[0-9]+/g)?.map(Number) || [];
        const pts: { x: number; y: number }[] = [];
        for (let idx = 0; idx + 1 < nums.length; idx += 2) {
          pts.push({ x: toInX(nums[idx]), y: toInY(nums[idx + 1]) });
        }
        if (pts.length >= 2) {
          for (let segIdx = 0; segIdx < pts.length - 1; segIdx++) {
            addSegment(
              pts[segIdx].x,
              pts[segIdx].y,
              pts[segIdx + 1].x,
              pts[segIdx + 1].y,
              segIdx === 0 && hasStart,
              segIdx === pts.length - 2 && hasEnd
            );
          }
        } else {
          addSegment(ix1, iy1, ix2, iy2, hasStart, hasEnd);
        }
      }
    } else if (el.type === "image") {
      const dataUri = await loadImageAsDataUri(el.content);
      if (dataUri) {
        pptxSlide.addImage({
          data: dataUri,
          x,
          y,
          w,
          h,
          rotate,
          rounding: (el.style?.borderRadius ?? 0) >= 100,
          transparency:
            baseOpacity < 0.995
              ? Math.max(0, Math.min(99, Math.round((1 - baseOpacity) * 100)))
              : undefined,
          sizing: {
            type: el.style?.objectFit === "contain" ? "contain" : "cover",
            w,
            h,
          },
        });
        if (borderParsed) {
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h,
            rotate,
            fill: { type: "none" },
            line: lineOpt,
          });
        }
      } else {
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          rotate,
          rectRadius: 0.08,
          fill: { color: "1E293B", transparency: 20 },
          line: { color: "475569", width: 1 },
        });
      }
    }
  }
}

export async function exportSlidesToPptx(options: ExportPptxOptions): Promise<string> {
  const { slides, theme: rawTheme, language, title, fileName, onProgress } = options;
  if (!slides || slides.length === 0) {
    throw new Error("No slides available to export.");
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  const deckTitle = title || "AI Slide Presentation";
  pptx.title = deckTitle;
  pptx.subject = deckTitle;
  pptx.author = "AI Slide Builder";

  const baseFont = resolveFontFamily(rawTheme.fontFamily);
  pptx.theme = {
    headFontFace: baseFont,
    bodyFontFace: baseFont,
  };

  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, total, `Exporting slide ${i + 1} of ${total}...`);

    const accessibleBase = getAccessibleTheme(rawTheme, slide.customBg);
    const theme: PresentationTheme = {
      ...accessibleBase,
      accentColor: slide.customAccentColor || accessibleBase.accentColor,
      accentSecondary: slide.customAccentSecondary || accessibleBase.accentSecondary,
      badgeBg: slide.customBadgeBg || accessibleBase.badgeBg,
      badgeText: slide.customBadgeText || accessibleBase.badgeText,
    };

    const fontFace = resolveFontFamily(theme.fontFamily);
    const pptxSlide = pptx.addSlide();

    const bgColor = toPptxColor(theme.canvasBg || theme.bgColor, "0F172A");
    pptxSlide.background = { color: bgColor.color };

    const currentTitle = resolveLocalizedText(
      language,
      slide.titleKo,
      slide.titleId,
      slide.titleJa
    );
    const currentSubtitle = resolveLocalizedText(
      language,
      slide.subtitleKo,
      slide.subtitleId,
      slide.subtitleJa
    );
    const currentCallout = resolveLocalizedText(
      language,
      slide.calloutKo,
      slide.calloutId,
      slide.calloutJa
    );

    const cleanBullets = (slide.bullets || []).filter((b) => {
      const bTitle = resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa).trim();
      const bDesc = resolveLocalizedText(language, b.descKo, b.descId, b.descJa).trim();
      if (bTitle && bTitle === currentTitle.trim() && (!bDesc || bDesc === currentSubtitle.trim())) {
        return false;
      }
      return Boolean(bTitle || bDesc);
    });

    const accentHex = toSolidHex(theme.accentColor, "3B82F6");
    const accentSecHex = toSolidHex(theme.accentSecondary, "10B981");
    const textHex = toSolidHex(theme.textColor, "F8FAFC");
    const mutedHex = toSolidHex(theme.textMuted, "94A3B8");
    const cardColor = toPptxColor(theme.cardBg, "1E293B");
    const borderColor = toPptxColor(theme.borderColor, "334155");
    const badgeBgColor = toPptxColor(theme.badgeBg, "1E3A8A");
    const badgeTextHex = toSolidHex(theme.badgeText, "93C5FD");

    // ------------------------------------------------------------------
    // LAYOUT 1: COVER
    // ------------------------------------------------------------------
    if (slide.layout === "cover") {
      // Top docCode & tag pills
      const docLabel = slide.docCode || "KC-2026-KIND-001";
      const tagLabel = resolveRawText(language, slide.tagKo, slide.tagId, slide.tagJa) || "MASTER PLAN";

      pptxSlide.addText(docLabel.toUpperCase(), {
        x: 0.65,
        y: 0.52,
        w: 2.35,
        h: 0.3,
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.5,
        fill: badgeBgColor,
        line: { color: borderColor.color, width: 0.5, transparency: borderColor.transparency },
        fontFace,
        fontSize: 8.5,
        bold: true,
        color: badgeTextHex,
        align: "center",
        valign: "middle",
        margin: 2,
      });

      pptxSlide.addText(tagLabel, {
        x: 3.12,
        y: 0.52,
        w: 2.2,
        h: 0.3,
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.5,
        fill: cardColor,
        line: { color: borderColor.color, width: 0.5, transparency: borderColor.transparency },
        fontFace,
        fontSize: 8.5,
        bold: true,
        color: mutedHex,
        align: "center",
        valign: "middle",
        margin: 2,
      });

      // Accent Banner Pill
      pptxSlide.addText("OFFICIAL MASTER EXECUTION PLAN", {
        x: 0.65,
        y: 1.48,
        w: 2.7,
        h: 0.28,
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.12,
        fill: { color: accentHex },
        line: { type: "none" },
        fontFace,
        fontSize: 8,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
        margin: 2,
      });

      // Main Cover Title
      pptxSlide.addText(currentTitle || "Presentation Title", {
        x: 0.65,
        y: 1.88,
        w: 8.7,
        h: 1.45,
        fontFace,
        fontSize: 32,
        bold: true,
        color: textHex,
        valign: "top",
        wrap: true,
        margin: 0,
      });

      // Cover Subtitle
      if (currentSubtitle) {
        pptxSlide.addText(currentSubtitle, {
          x: 0.65,
          y: 3.45,
          w: 8.2,
          h: 1.0,
          fontFace,
          fontSize: 13.5,
          color: mutedHex,
          valign: "top",
          wrap: true,
          margin: 0,
        });
      }

      // Cover Footer
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.65,
        y: 4.92,
        w: 8.7,
        h: 0.012,
        fill: borderColor,
        line: { type: "none" },
      });

      pptxSlide.addText(
        resolveRawText(language, slide.categoryKo, slide.categoryId, slide.categoryJa),
        {
          x: 0.65,
          y: 4.98,
          w: 6.5,
          h: 0.28,
          fontFace,
          fontSize: 9.5,
          color: mutedHex,
          valign: "middle",
          margin: 0,
        }
      );
      pptxSlide.addText(`${i + 1} / ${total}`, {
        x: 8.15,
        y: 4.98,
        w: 1.2,
        h: 0.28,
        fontFace,
        fontSize: 9.5,
        color: mutedHex,
        align: "right",
        valign: "middle",
        margin: 0,
      });
    }
    // ------------------------------------------------------------------
    // LAYOUT 2: FULL-IMAGE
    // ------------------------------------------------------------------
    else if (slide.layout === "full-image") {
      const heroUrl =
        slide.image?.url ||
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80";
      const heroData = await loadImageAsDataUri(heroUrl);

      if (heroData) {
        pptxSlide.addImage({
          data: heroData,
          x: 0,
          y: 0,
          w: SLIDE_W,
          h: SLIDE_H,
          sizing: { type: "cover", w: SLIDE_W, h: SLIDE_H },
        });
      }

      // Contrast scrim
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
        fill: { color: "000000", transparency: heroData ? 48 : 20 },
        line: { type: "none" },
      });

      // White Header
      pptxSlide.addShape(pptx.ShapeType.ellipse, {
        x: 0.55,
        y: 0.34,
        w: 0.1,
        h: 0.1,
        fill: { color: "60A5FA" },
        line: { type: "none" },
      });
      pptxSlide.addText(
        (resolveRawText(language, slide.categoryKo, slide.categoryId, slide.categoryJa) || "FEATURED VISUAL").toUpperCase(),
        {
          x: 0.74,
          y: 0.26,
          w: 7.4,
          h: 0.26,
          fontFace,
          fontSize: 9,
          bold: true,
          color: "FFFFFF",
          valign: "middle",
          margin: 0,
        }
      );
      pptxSlide.addText(`${i + 1} / ${total}`, {
        x: 8.75,
        y: 0.26,
        w: 0.7,
        h: 0.24,
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.2,
        fill: { color: "000000", transparency: 40 },
        line: { color: "FFFFFF", width: 0.5, transparency: 70 },
        fontFace,
        fontSize: 8.5,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
        margin: 0,
      });

      // Bottom Dark Narrative Card
      const cardH = slide.image?.captionKo || slide.image?.captionId ? 1.92 : 1.66;
      const cardY = 5.02 - cardH;
      pptxSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.55,
        y: cardY,
        w: 6.8,
        h: cardH,
        rectRadius: 0.12,
        fill: { color: "000000", transparency: 38 },
        line: { color: "FFFFFF", width: 0.75, transparency: 75 },
      });

      pptxSlide.addText(currentTitle || "Visual Feature", {
        x: 0.78,
        y: cardY + 0.18,
        w: 6.35,
        h: 0.56,
        fontFace,
        fontSize: 22,
        bold: true,
        color: "FFFFFF",
        valign: "top",
        wrap: true,
        margin: 0,
      });

      pptxSlide.addText(currentSubtitle || "", {
        x: 0.78,
        y: cardY + 0.78,
        w: 6.35,
        h: 0.72,
        fontFace,
        fontSize: 10.5,
        color: "E2E8F0",
        valign: "top",
        wrap: true,
        margin: 0,
      });

      const caption = resolveLocalizedText(
        language,
        slide.image?.captionKo,
        slide.image?.captionId,
        slide.image?.captionJa
      );
      if (caption) {
        pptxSlide.addText(`✦ ${caption}`, {
          x: 0.78,
          y: cardY + 1.54,
          w: 6.35,
          h: 0.25,
          fontFace,
          fontSize: 8.5,
          color: "93C5FD",
          margin: 0,
        });
      }

      addFrameFooter(pptxSlide, pptx, slide, theme, fontFace, "CBD5E1");
    }
    // ------------------------------------------------------------------
    // STANDARD CONTENT LAYOUTS
    // ------------------------------------------------------------------
    else {
      addFrameHeader(pptxSlide, pptx, slide, theme, language, i, total, fontFace);
      const contentTop = addTitleBlock(pptxSlide, currentTitle, currentSubtitle, theme, fontFace);
      const hasCallout = Boolean(currentCallout);
      const contentBottom = hasCallout ? 4.56 : 5.06;
      const contentH = contentBottom - contentTop;

      // ----------------------------------------------------------------
      // KEY STATS
      // ----------------------------------------------------------------
      if (slide.layout === "key-stats") {
        const stats = (slide.stats && slide.stats.length > 0 ? slide.stats : []).slice(0, 4);
        if (stats.length > 0) {
          const cols = Math.min(4, Math.max(1, stats.length));
          const gap = 0.2;
          const cardW = (8.9 - gap * (cols - 1)) / cols;
          const cardH = cleanBullets.length > 0 ? Math.min(2.05, contentH * 0.6) : Math.min(2.6, contentH);

          stats.forEach((st, idx) => {
            const x = 0.55 + idx * (cardW + gap);
            const y = contentTop + (cleanBullets.length > 0 ? 0.04 : (contentH - cardH) * 0.35);

            pptxSlide.addShape(pptx.ShapeType.roundRect, {
              x,
              y,
              w: cardW,
              h: cardH,
              rectRadius: 0.1,
              fill: cardColor,
              line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
            });

            const lbl = resolveLocalizedText(language, st.labelKo, st.labelId, st.labelJa).toUpperCase();
            pptxSlide.addText(lbl, {
              x: x + 0.16,
              y: y + 0.16,
              w: cardW - 0.32,
              h: 0.3,
              fontFace,
              fontSize: 8.5,
              bold: true,
              color: mutedHex,
              valign: "top",
              margin: 0,
            });

            const unit = resolveLocalizedText(language, st.unitKo, st.unitId, st.unitJa);
            const valRuns: PptxGenJS.TextProps[] = [
              {
                text: st.value || "0",
                options: {
                  fontSize: cols >= 4 ? 22 : 26,
                  bold: true,
                  color: accentHex,
                },
              },
            ];
            if (unit) {
              valRuns.push({
                text: ` ${unit}`,
                options: {
                  fontSize: 10.5,
                  bold: true,
                  color: mutedHex,
                },
              });
            }

            pptxSlide.addText(valRuns, {
              x: x + 0.16,
              y: y + 0.52,
              w: cardW - 0.32,
              h: 0.72,
              fontFace,
              valign: "middle",
              wrap: true,
              margin: 0,
            });

            const sub = resolveLocalizedText(language, st.subKo, st.subId, st.subJa);
            if (sub) {
              pptxSlide.addText(sub, {
                x: x + 0.16,
                y: y + cardH - 0.56,
                w: cardW - 0.32,
                h: 0.44,
                fontFace,
                fontSize: 8.5,
                color: mutedHex,
                valign: "bottom",
                wrap: true,
                margin: 0,
              });
            }
          });

          // Render extra bullets row below stats if present
          if (cleanBullets.length > 0) {
            const subRowY = contentTop + cardH + 0.18;
            const subRowH = Math.max(0.75, contentBottom - subRowY);
            const bCols = Math.min(3, cleanBullets.length);
            const bW = (8.9 - gap * (bCols - 1)) / bCols;
            cleanBullets.slice(0, bCols).forEach((b, bIdx) => {
              const bx = 0.55 + bIdx * (bW + gap);
              pptxSlide.addShape(pptx.ShapeType.roundRect, {
                x: bx,
                y: subRowY,
                w: bW,
                h: subRowH,
                rectRadius: 0.08,
                fill: cardColor,
                line: { color: borderColor.color, width: 0.5, transparency: borderColor.transparency },
              });
              const bt = resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa);
              const bd = resolveLocalizedText(language, b.descKo, b.descId, b.descJa);
              pptxSlide.addText(
                [
                  { text: bt ? `${bt}\n` : "", options: { fontSize: 9.5, bold: true, color: textHex } },
                  { text: bd || "", options: { fontSize: 8.5, color: mutedHex } },
                ],
                {
                  x: bx + 0.14,
                  y: subRowY + 0.08,
                  w: bW - 0.28,
                  h: subRowH - 0.16,
                  fontFace,
                  valign: "top",
                  wrap: true,
                  margin: 0,
                }
              );
            });
          }
        }
      }
      // ----------------------------------------------------------------
      // PROCESS-3
      // ----------------------------------------------------------------
      else if (slide.layout === "process-3") {
        const stages =
          slide.processStages && slide.processStages.length > 0
            ? slide.processStages.slice(0, 3).map((st) => ({
                badge: resolveLocalizedText(language, st.badgeKo, st.badgeId) || `STAGE 0${st.stage}`,
                title: resolveLocalizedText(language, st.titleKo, st.titleId),
                desc: resolveLocalizedText(language, st.descKo, st.descId),
                bullets: language === "ko" ? st.bulletsKo : st.bulletsId,
              }))
            : cleanBullets.slice(0, 3).map((b, idx) => ({
                badge: `STEP 0${idx + 1}`,
                title: resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa),
                desc: resolveLocalizedText(language, b.descKo, b.descId, b.descJa),
                bullets: [] as string[],
              }));

        const cols = Math.max(1, stages.length);
        const gap = 0.22;
        const cardW = (8.9 - gap * (cols - 1)) / cols;
        const cardH = Math.min(3.35, contentH);

        stages.forEach((st, idx) => {
          const x = 0.55 + idx * (cardW + gap);
          const y = contentTop;

          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w: cardW,
            h: cardH,
            rectRadius: 0.1,
            fill: cardColor,
            line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
          });

          // Stage badge pill
          pptxSlide.addText(st.badge.toUpperCase(), {
            x: x + 0.18,
            y: y + 0.18,
            w: Math.min(1.5, cardW - 0.36),
            h: 0.26,
            shape: pptx.ShapeType.roundRect,
            rectRadius: 0.25,
            fill: badgeBgColor,
            line: { type: "none" },
            fontFace,
            fontSize: 8,
            bold: true,
            color: badgeTextHex,
            align: "center",
            valign: "middle",
            margin: 2,
          });

          // Stage Title
          pptxSlide.addText(st.title || "", {
            x: x + 0.18,
            y: y + 0.54,
            w: cardW - 0.36,
            h: 0.48,
            fontFace,
            fontSize: 12.5,
            bold: true,
            color: accentHex,
            valign: "top",
            wrap: true,
            margin: 0,
          });

          const bodyRuns: PptxGenJS.TextProps[] = [];
          if (st.desc) {
            bodyRuns.push({
              text: `${st.desc}${st.bullets && st.bullets.length > 0 ? "\n\n" : ""}`,
              options: { fontSize: 9.5, color: textHex },
            });
          }
          (st.bullets || []).forEach((line) => {
            bodyRuns.push({
              text: `• ${line}\n`,
              options: { fontSize: 8.8, color: mutedHex },
            });
          });

          pptxSlide.addText(bodyRuns, {
            x: x + 0.18,
            y: y + 1.06,
            w: cardW - 0.36,
            h: cardH - 1.22,
            fontFace,
            valign: "top",
            wrap: true,
            margin: 0,
          });
        });
      }
      // ----------------------------------------------------------------
      // SPLIT-INFO
      // ----------------------------------------------------------------
      else if (slide.layout === "split-info") {
        const leftW = 4.35;
        const rightW = 4.3;
        const leftX = 0.55;
        const rightX = 5.15;

        const items = cleanBullets.slice(0, 4);
        const itemGap = 0.14;
        const itemH =
          items.length > 0
            ? Math.min(1.45, (contentH - itemGap * (items.length - 1)) / items.length)
            : contentH;

        items.forEach((b, idx) => {
          const y = contentTop + idx * (itemH + itemGap);
          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x: leftX,
            y,
            w: leftW,
            h: itemH,
            rectRadius: 0.08,
            fill: cardColor,
            line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
          });

          const bTitle = resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa);
          const bDesc = resolveLocalizedText(language, b.descKo, b.descId, b.descJa);
          pptxSlide.addText(
            [
              { text: bTitle ? `${bTitle}\n` : "", options: { fontSize: 10.5, bold: true, color: accentHex } },
              { text: bDesc || "", options: { fontSize: 9.2, color: textHex } },
            ],
            {
              x: leftX + 0.16,
              y: y + 0.1,
              w: leftW - 0.32,
              h: itemH - 0.2,
              fontFace,
              valign: "middle",
              wrap: true,
              margin: 0,
            }
          );
        });

        // Right visual frame
        const visualUrl =
          slide.image?.url ||
          "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80";
        const visualData = await loadImageAsDataUri(visualUrl);

        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: rightX,
          y: contentTop,
          w: rightW,
          h: contentH,
          rectRadius: 0.1,
          fill: cardColor,
          line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
        });

        if (visualData) {
          pptxSlide.addImage({
            data: visualData,
            x: rightX + 0.04,
            y: contentTop + 0.04,
            w: rightW - 0.08,
            h: contentH - 0.08,
            sizing: { type: "cover", w: rightW - 0.08, h: contentH - 0.08 },
          });
        }

        const caption = resolveLocalizedText(
          language,
          slide.image?.captionKo,
          slide.image?.captionId,
          slide.image?.captionJa
        );
        if (caption) {
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: rightX + 0.04,
            y: contentTop + contentH - 0.44,
            w: rightW - 0.08,
            h: 0.4,
            fill: { color: "000000", transparency: 35 },
            line: { type: "none" },
          });
          pptxSlide.addText(caption, {
            x: rightX + 0.16,
            y: contentTop + contentH - 0.44,
            w: rightW - 0.32,
            h: 0.4,
            fontFace,
            fontSize: 8.5,
            color: "FFFFFF",
            valign: "middle",
            margin: 0,
          });
        }
      }
      // ----------------------------------------------------------------
      // TABLES (comparison-table, feature-matrix, delegation-table, schedule-table)
      // ----------------------------------------------------------------
      else if (
        slide.layout === "comparison-table" ||
        slide.layout === "feature-matrix" ||
        slide.layout === "delegation-table" ||
        slide.layout === "schedule-table"
      ) {
        let headers: string[] = [];
        let bodyRows: string[][] = [];

        if (slide.customTable && slide.customTable.headers.length > 0) {
          headers = slide.customTable.headers;
          bodyRows = slide.customTable.rows;
        } else if (slide.delegates && slide.delegates.length > 0) {
          headers =
            language === "ko"
              ? ["No", "대학 / 기관", "인원", "대표단", "역할"]
              : ["No", "Institution", "Count", "Delegates", "Role"];
          bodyRows = slide.delegates.map((d) => [
            String(d.no),
            resolveLocalizedText(language, d.universityKo, d.universityId),
            resolveLocalizedText(language, d.countKo, d.countId),
            resolveLocalizedText(language, d.namesKo, d.namesId),
            resolveLocalizedText(language, d.rolesKo, d.rolesId),
          ]);
        } else if (slide.schedule && slide.schedule.length > 0) {
          headers =
            language === "ko"
              ? ["일자", "시간", "일정", "장소"]
              : ["Date", "Time", "Event", "Location"];
          bodyRows = slide.schedule.map((ev) => [
            ev.date,
            ev.time,
            `${resolveLocalizedText(language, ev.titleKo, ev.titleId)} — ${resolveLocalizedText(language, ev.detailKo, ev.detailId)}`,
            resolveLocalizedText(language, ev.locationKo, ev.locationId),
          ]);
        } else if (cleanBullets.length > 0) {
          headers =
            language === "ko" ? ["항목 (Feature)", "세부 사양 / 설명"] : ["Feature", "Specification / Detail"];
          bodyRows = cleanBullets.map((b) => [
            resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa),
            resolveLocalizedText(language, b.descKo, b.descId, b.descJa),
          ]);
        }

        if (headers.length > 0) {
          const tableRows: PptxGenJS.TableRow[] = [];
          const colCount = headers.length;
          const colW = headers.map((_, colIdx) => {
            if (colCount === 2) return colIdx === 0 ? 2.7 : 6.2;
            if (colCount === 5 && headers[0] === "No") {
              return [0.6, 2.3, 1.1, 2.5, 2.4][colIdx] || 8.9 / colCount;
            }
            return 8.9 / colCount;
          });

          tableRows.push(
            headers.map((h) => ({
              text: h,
              options: {
                bold: true,
                fontSize: 9.5,
                color: badgeTextHex,
                fill: badgeBgColor,
                valign: "middle",
                margin: [5, 7, 5, 7],
              },
            }))
          );

          bodyRows.slice(0, 10).forEach((row, rIdx) => {
            const altBg =
              rIdx % 2 === 0
                ? cardColor
                : { color: bgColor.color, transparency: 0 };
            tableRows.push(
              headers.map((_, cIdx) => ({
                text: row[cIdx] ?? "",
                options: {
                  bold: cIdx === 0,
                  fontSize: 8.8,
                  color: cIdx === 0 ? accentHex : textHex,
                  fill: altBg,
                  valign: "middle",
                  margin: [4, 7, 4, 7],
                },
              }))
            );
          });

          pptxSlide.addTable(tableRows, {
            x: 0.55,
            y: contentTop,
            w: 8.9,
            colW,
            fontFace,
            border: {
              type: "solid",
              color: borderColor.color,
              pt: 0.75,
            },
          });
        }
      }
      // ----------------------------------------------------------------
      // CHARTS (chart-bar, chart-line, chart-donut, chart-waterfall)
      // ----------------------------------------------------------------
      else if (
        slide.layout === "chart-bar" ||
        slide.layout === "chart-line" ||
        slide.layout === "chart-donut" ||
        slide.layout === "chart-waterfall"
      ) {
        const chartData = extractChartData(slide, language);

        // Chart container card
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.55,
          y: contentTop,
          w: 8.9,
          h: contentH,
          rectRadius: 0.1,
          fill: cardColor,
          line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
        });

        const cx = 0.75;
        const cy = contentTop + 0.15;
        const cw = 8.5;
        const ch = contentH - 0.3;

        if (chartData.length === 0) {
          pptxSlide.addText("No chart series data available.", {
            x: cx,
            y: cy,
            w: cw,
            h: ch,
            fontFace,
            fontSize: 11,
            color: mutedHex,
            align: "center",
            valign: "middle",
          });
        } else if (slide.layout === "chart-waterfall") {
          const wfDataUri = renderWaterfallToDataUri(chartData, theme, fontFace);
          if (wfDataUri) {
            pptxSlide.addImage({
              data: wfDataUri,
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              sizing: { type: "contain", w: cw, h: ch },
            });
          }
        } else if (slide.layout === "chart-bar") {
          pptxSlide.addChart(
            pptx.ChartType.bar,
            [
              {
                name: currentTitle || "Series 1",
                labels: chartData.map((d) => d.label),
                values: chartData.map((d) => d.value),
              },
            ],
            {
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              barDir: "col",
              barGrouping: "clustered",
              chartColors: [accentHex],
              showLegend: false,
              showTitle: false,
              showValue: true,
              dataLabelColor: textHex,
              dataLabelFontFace: fontFace,
              dataLabelFontSize: 9,
              dataLabelPosition: "outEnd",
              catAxisLabelColor: mutedHex,
              catAxisLabelFontFace: fontFace,
              catAxisLabelFontSize: 9,
              catAxisLineColor: borderColor.color,
              valAxisLabelColor: mutedHex,
              valAxisLabelFontFace: fontFace,
              valAxisLabelFontSize: 8.5,
              valAxisLineShow: false,
              valGridLine: { color: borderColor.color, style: "dash", size: 0.5 },
            }
          );
        } else if (slide.layout === "chart-line") {
          pptxSlide.addChart(
            pptx.ChartType.line,
            [
              {
                name: currentTitle || "Trend",
                labels: chartData.map((d) => d.label),
                values: chartData.map((d) => d.value),
              },
            ],
            {
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              chartColors: [accentHex],
              lineSize: 3,
              lineDataSymbol: "circle",
              lineDataSymbolSize: 7,
              showLegend: false,
              showTitle: false,
              showValue: true,
              dataLabelColor: textHex,
              dataLabelFontFace: fontFace,
              dataLabelFontSize: 9,
              dataLabelPosition: "t",
              catAxisLabelColor: mutedHex,
              catAxisLabelFontFace: fontFace,
              catAxisLabelFontSize: 9,
              catAxisLineColor: borderColor.color,
              valAxisLabelColor: mutedHex,
              valAxisLabelFontFace: fontFace,
              valAxisLabelFontSize: 8.5,
              valAxisLineShow: false,
              valGridLine: { color: borderColor.color, style: "dash", size: 0.5 },
            }
          );
        } else if (slide.layout === "chart-donut") {
          const donutPalette = [
            accentHex,
            accentSecHex,
            "3B82F6",
            "F59E0B",
            "EC4899",
            "8B5CF6",
            "14B8A6",
          ];
          pptxSlide.addChart(
            pptx.ChartType.doughnut,
            [
              {
                name: currentTitle || "Breakdown",
                labels: chartData.map((d) => d.label),
                values: chartData.map((d) => Math.abs(d.value)),
              },
            ],
            {
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              holeSize: 55,
              chartColors: chartData.map((_, idx) => donutPalette[idx % donutPalette.length]),
              showLegend: true,
              legendPos: "r",
              legendColor: textHex,
              legendFontFace: fontFace,
              legendFontSize: 10,
              showPercent: true,
              showValue: false,
              showTitle: false,
              dataLabelColor: "FFFFFF",
              dataLabelFontFace: fontFace,
              dataLabelFontSize: 9,
            }
          );
        }
      }
      // ----------------------------------------------------------------
      // CARDS / OVERVIEW / ACTION ITEMS / GENERAL
      // ----------------------------------------------------------------
      else {
        const hasInlineImage = Boolean(slide.image?.url);
        const sideImageMode = hasInlineImage && cleanBullets.length <= 3 && slide.layout !== "cards-3";
        const areaW = sideImageMode ? 5.1 : 8.9;

        if (cleanBullets.length > 0) {
          const count = cleanBullets.length;
          let cols = 2;
          if (slide.layout === "cards-3") cols = Math.min(3, Math.max(1, count));
          else if (slide.layout === "cards-2") cols = Math.min(2, Math.max(1, count));
          else if (sideImageMode || count === 1) cols = 1;
          else if (count >= 5) cols = 3;
          else cols = 2;

          const rows = Math.ceil(count / cols);
          const gapX = 0.2;
          const gapY = 0.16;
          const cardW = (areaW - gapX * (cols - 1)) / cols;
          const cardH = Math.max(0.7, (contentH - gapY * (rows - 1)) / rows);

          cleanBullets.forEach((b, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const x = 0.55 + col * (cardW + gapX);
            const y = contentTop + row * (cardH + gapY);

            pptxSlide.addShape(pptx.ShapeType.roundRect, {
              x,
              y,
              w: cardW,
              h: cardH,
              rectRadius: 0.09,
              fill: cardColor,
              line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
            });

            // Subtle accent bar at top of card
            pptxSlide.addShape(pptx.ShapeType.rect, {
              x: x + 0.16,
              y: y + 0.14,
              w: 0.42,
              h: 0.04,
              fill: { color: accentHex },
              line: { type: "none" },
            });

            const bTitle = resolveLocalizedText(language, b.titleKo, b.titleId, b.titleJa);
            const bDesc = resolveLocalizedText(language, b.descKo, b.descId, b.descJa);
            const bTag = resolveLocalizedText(language, b.tagKo, b.tagId, b.tagJa);

            const runs: PptxGenJS.TextProps[] = [];
            if (bTag) {
              runs.push({
                text: `${bTag.toUpperCase()}  `,
                options: { fontSize: 7.5, bold: true, color: accentSecHex },
              });
            }
            if (bTitle) {
              runs.push({
                text: `${bTitle}\n`,
                options: {
                  fontSize: rows >= 3 ? 10.5 : 12,
                  bold: true,
                  color: textHex,
                },
              });
            }
            if (bDesc) {
              runs.push({
                text: bDesc,
                options: {
                  fontSize: rows >= 3 ? 8.8 : 9.5,
                  color: mutedHex,
                },
              });
            }

            pptxSlide.addText(runs, {
              x: x + 0.16,
              y: y + 0.24,
              w: cardW - 0.32,
              h: cardH - 0.32,
              fontFace,
              valign: "top",
              wrap: true,
              margin: 0,
            });
          });
        }

        if (hasInlineImage) {
          const imgData = await loadImageAsDataUri(slide.image?.url);
          const imgX = sideImageMode ? 5.85 : 0.55;
          const imgW = sideImageMode ? 3.6 : 8.9;
          const imgY = contentTop;
          const imgH = contentH;

          if (imgData && (sideImageMode || cleanBullets.length === 0)) {
            pptxSlide.addShape(pptx.ShapeType.roundRect, {
              x: imgX,
              y: imgY,
              w: imgW,
              h: imgH,
              rectRadius: 0.1,
              fill: cardColor,
              line: { color: borderColor.color, width: 0.75, transparency: borderColor.transparency },
            });
            pptxSlide.addImage({
              data: imgData,
              x: imgX + 0.04,
              y: imgY + 0.04,
              w: imgW - 0.08,
              h: imgH - 0.08,
              sizing: { type: "cover", w: imgW - 0.08, h: imgH - 0.08 },
            });
          }
        }
      }

      if (hasCallout) {
        addCalloutBox(pptxSlide, pptx, currentCallout, theme, fontFace, 4.66);
      }

      addFrameFooter(pptxSlide, pptx, slide, theme, fontFace);
    }

    // ------------------------------------------------------------------
    // PHASE 1 FREE-FORM OVERLAY ELEMENTS
    // ------------------------------------------------------------------
    await renderOverlayElements(pptxSlide, pptx, slide.overlayElements, fontFace);

    // ------------------------------------------------------------------
    // SPEAKER NOTES
    // ------------------------------------------------------------------
    const notes = resolveSpeakerNotes(slide, language).trim();
    if (notes) {
      pptxSlide.addNotes(notes);
    }
  }

  onProgress?.(total, total, "Packaging PowerPoint (.pptx) archive...");
  const safeBaseName = (fileName || deckTitle || "KIND_2026_Presentation")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_") || "KIND_2026_Presentation";
  const finalName = safeBaseName.endsWith(".pptx") ? safeBaseName : `${safeBaseName}.pptx`;

  await pptx.writeFile({ fileName: finalName });
  return finalName;
}
