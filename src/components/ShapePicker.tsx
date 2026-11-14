import React, { useState } from "react";
import { X } from "lucide-react";
import {
  CanvasShapeStylePreset,
  CanvasShapeVariant,
  PresentationTheme,
} from "../types";
import {
  buildShapePresetStyle,
  SvgVectorShape,
} from "./canvas/shapeRenderUtils";

interface ShapePickerProps {
  theme: PresentationTheme;
  isKo?: boolean;
  onSelectShape: (variant: CanvasShapeVariant, preset: CanvasShapeStylePreset) => void;
  onClose: () => void;
}

const SHAPE_ITEMS: {
  variant: CanvasShapeVariant;
  label: string;
  labelKo: string;
  group: "basic" | "arrows";
}[] = [
  { variant: "rectangle", label: "Rectangle", labelKo: "사각형", group: "basic" },
  { variant: "rounded", label: "Rounded", labelKo: "둥근 사각형", group: "basic" },
  { variant: "circle", label: "Circle / Ellipse", labelKo: "원 / 타원", group: "basic" },
  { variant: "triangle", label: "Triangle", labelKo: "삼각형", group: "basic" },
  { variant: "diamond", label: "Diamond", labelKo: "마름모", group: "basic" },
  { variant: "callout", label: "Callout Bubble", labelKo: "말풍선", group: "basic" },
  { variant: "pill", label: "Badge Pill", labelKo: "캡슐 배지", group: "basic" },
  { variant: "line", label: "Accent Line", labelKo: "구분선", group: "basic" },
  { variant: "arrow-right", label: "Arrow Right", labelKo: "오른쪽 화살표", group: "arrows" },
  { variant: "arrow-left", label: "Arrow Left", labelKo: "왼쪽 화살표", group: "arrows" },
  { variant: "arrow-up", label: "Arrow Up", labelKo: "위쪽 화살표", group: "arrows" },
  { variant: "arrow-down", label: "Arrow Down", labelKo: "아래쪽 화살표", group: "arrows" },
  {
    variant: "arrow-bidirectional",
    label: "Two-Way Arrow",
    labelKo: "양방향 화살표",
    group: "arrows",
  },
];

const PRESETS: { id: CanvasShapeStylePreset; label: string; labelKo: string }[] = [
  { id: "solid", label: "Solid Fill", labelKo: "솔리드" },
  { id: "outline", label: "Outline Only", labelKo: "윤곽선" },
  { id: "glass", label: "Glassmorphism", labelKo: "글래스" },
  { id: "shadow", label: "Soft Shadow", labelKo: "소프트 섀도우" },
];

export const ShapePicker: React.FC<ShapePickerProps> = ({
  theme,
  isKo = false,
  onSelectShape,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<CanvasShapeStylePreset>("solid");

  const previewStyle = buildShapePresetStyle(selectedPreset, theme, false);
  const previewFill =
    previewStyle.backgroundColor && previewStyle.backgroundColor !== "transparent"
      ? previewStyle.backgroundColor
      : "transparent";
  const previewStroke = previewStyle.borderColor || theme.accentColor || "#3b82f6";
  const previewStrokeWidth = previewStyle.strokeWidth ?? 2;

  const basicShapes = SHAPE_ITEMS.filter((s) => s.group === "basic");
  const arrowShapes = SHAPE_ITEMS.filter((s) => s.group === "arrows");

  return (
    <div
      className="absolute left-0 top-full mt-1.5 w-[340px] bg-[#151921] border border-white/[0.12] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.75)] p-3 z-50 space-y-3 text-slate-200 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            {isKo ? "벡터 도형 라이브러리" : "Vector Shape Library"}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/25"
            style={{ backgroundColor: theme.accentColor }}
            title={`Theme Accent: ${theme.name}`}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Close shape library"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Theme-Adaptive Style Presets */}
      <div>
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          {isKo ? "테마 연동 스타일 프리셋" : "Theme Style Preset"}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((preset) => {
            const st = buildShapePresetStyle(preset.id, theme, false);
            const active = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border text-center transition cursor-pointer ${
                  active
                    ? "bg-blue-600/20 border-blue-500/60 text-white"
                    : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-300"
                }`}
              >
                <span
                  className="w-6 h-4 rounded-[3px] block"
                  style={{
                    backgroundColor: st.backgroundColor,
                    border: `${st.borderWidth || 1}px solid ${st.borderColor || "transparent"}`,
                    boxShadow: st.boxShadow,
                    backdropFilter: st.backdropFilter,
                  }}
                />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap">
                  {isKo ? preset.labelKo : preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Geometric & Callout Shapes */}
      <div>
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          {isKo ? "기본 도형 & 말풍선" : "Shapes & Callouts"}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {basicShapes.map((item) => (
            <button
              key={item.variant}
              type="button"
              id={`btn-shape-${item.variant}`}
              onClick={() => onSelectShape(item.variant, selectedPreset)}
              className="group flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.06] hover:border-blue-500/40 transition cursor-pointer"
              title={isKo ? item.labelKo : item.label}
            >
              <div className="w-7 h-6 flex items-center justify-center">
                <SvgVectorShape
                  variant={item.variant}
                  fill={previewFill}
                  stroke={previewStroke}
                  strokeWidth={previewStrokeWidth}
                  className="w-full h-full group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[10px] text-slate-300 group-hover:text-white truncate max-w-full">
                {isKo ? item.labelKo : item.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Block Arrows */}
      <div>
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          {isKo ? "블록 화살표" : "Block Arrows"}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {arrowShapes.map((item) => (
            <button
              key={item.variant}
              type="button"
              id={`btn-shape-${item.variant}`}
              onClick={() => onSelectShape(item.variant, selectedPreset)}
              className="group flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.06] hover:border-blue-500/40 transition cursor-pointer"
              title={isKo ? item.labelKo : item.label}
            >
              <div className="w-6 h-5 flex items-center justify-center">
                <SvgVectorShape
                  variant={item.variant}
                  fill={previewFill}
                  stroke={previewStroke}
                  strokeWidth={previewStrokeWidth}
                  className="w-full h-full group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-white truncate max-w-full">
                {item.variant === "arrow-bidirectional"
                  ? "2-Way"
                  : item.variant.replace("arrow-", "")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
