import React, { useMemo, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import {
  ICON_CATEGORIES,
  ICON_REGISTRY,
  IconCategory,
  IconRegistryEntry,
} from "../data/iconRegistry";
import { useSlideContext } from "../context/SlideContext";
import { CanvasElement } from "../types";

interface IconStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIZE_PRESETS = [
  { id: "sm", label: "Small", widthPct: 6, heightPct: 10.67 },
  { id: "md", label: "Medium", widthPct: 9, heightPct: 16 },
  { id: "lg", label: "Large", widthPct: 13, heightPct: 23.11 },
] as const;

export const IconStudioModal: React.FC<IconStudioModalProps> = ({ isOpen, onClose }) => {
  const {
    activeSlide,
    displayedTheme,
    handleUpdateSlide,
    setSelectedOverlayId,
    triggerToast,
    language,
  } = useSlideContext();

  const isKo = language === "ko";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | IconCategory>("All");
  const [iconColor, setIconColor] = useState<string>(displayedTheme.accentColor || "#3b82f6");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [selectedSize, setSelectedSize] = useState<"sm" | "md" | "lg">("md");

  const colorSwatches = useMemo(() => {
    const base = [
      displayedTheme.accentColor || "#3b82f6",
      displayedTheme.accentSecondary || "#10b981",
      "#ffffff",
      "#0f172a",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
    ];
    return Array.from(new Set(base.map((c) => c.toLowerCase())));
  }, [displayedTheme.accentColor, displayedTheme.accentSecondary]);

  const filteredIcons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ICON_REGISTRY.filter((entry) => {
      if (activeCategory !== "All" && entry.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        entry.id.toLowerCase().includes(q) ||
        entry.label.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  if (!isOpen || !activeSlide) return null;

  const handleInsertIcon = (entry: IconRegistryEntry) => {
    const existing = activeSlide.overlayElements || [];
    const maxZ = existing.reduce((m, el) => Math.max(m, el.zIndex), 0);
    const sizeSpec = SIZE_PRESETS.find((s) => s.id === selectedSize) || SIZE_PRESETS[1];
    const offset = (existing.length % 5) * 2.5;

    const newIconEl: CanvasElement = {
      id: `ov_ico_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "icon",
      x: 45 + offset,
      y: 40 + offset,
      width: sizeSpec.widthPct,
      height: sizeSpec.heightPct,
      rotation: 0,
      zIndex: maxZ + 1,
      content: entry.id,
      style: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 12,
        color: iconColor,
        strokeWidth,
        iconName: entry.id,
        opacity: 1,
      },
    };

    handleUpdateSlide(
      {
        ...activeSlide,
        overlayElements: [...existing, newIconEl],
      },
      true,
      `Insert Icon (${entry.label})`
    );
    setSelectedOverlayId(newIconEl.id);
    triggerToast(
      isKo ? `"${entry.label}" 아이콘이 캔버스에 추가되었습니다.` : `Inserted "${entry.label}" icon.`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-[#121620] border border-white/[0.12] rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isKo ? "아이콘 에셋 스튜디오" : "Vector Icon Studio"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isKo
                  ? "색상, 선 두께, 크기를 설정한 뒤 아이콘을 클릭하여 슬라이드에 추가하세요."
                  : "Customize vector style, then click any icon to insert onto the slide."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close Icon Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Category Filter Row */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-[#0e1119] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isKo
                    ? "아이콘 검색 (예: target, revenue, cloud, workflow...)"
                    : "Search icons (e.g. target, revenue, cloud, workflow...)"
                }
                className="w-full bg-slate-950/90 border border-white/[0.1] focus:border-blue-500 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap shrink-0">
              {filteredIcons.length} {filteredIcons.length === 1 ? "icon" : "icons"}
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(["All", ...ICON_CATEGORIES] as const).map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-blue-600/25 border-blue-500/50 text-blue-200"
                      : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Vector Customization Controls */}
        <div className="px-5 py-2.5 border-b border-white/[0.08] bg-[#151921] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              {isKo ? "색상" : "Color"}
            </span>
            <div className="flex items-center gap-1.5">
              {colorSwatches.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setIconColor(hex)}
                  className={`w-5 h-5 rounded-full border transition hover:scale-110 cursor-pointer ${
                    iconColor.toLowerCase() === hex
                      ? "border-white ring-2 ring-blue-500"
                      : "border-white/25"
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
              <label
                className="w-5 h-5 rounded-full border border-white/25 overflow-hidden cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500"
                title="Custom Color"
              >
                <input
                  type="color"
                  value={iconColor.startsWith("#") ? iconColor : "#3b82f6"}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              {isKo ? "선 두께" : "Stroke"}
            </span>
            <div className="flex items-center gap-1">
              {[1.25, 1.75, 2, 2.75].map((sw) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => setStrokeWidth(sw)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono tabular-nums border cursor-pointer transition ${
                    strokeWidth === sw
                      ? "bg-blue-600/30 border-blue-500/60 text-white"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {sw}px
                </button>
              ))}
            </div>
          </div>

          {/* Default Size */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              {isKo ? "크기" : "Size"}
            </span>
            <div className="flex items-center gap-1">
              {SIZE_PRESETS.map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setSelectedSize(sz.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition ${
                    selectedSize === sz.id
                      ? "bg-blue-600/30 border-blue-500/60 text-white"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredIcons.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Search className="w-7 h-7 mb-2 opacity-40" />
              <p>{isKo ? "일치하는 아이콘이 없습니다." : "No matching icons found."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
              {filteredIcons.map((entry) => {
                const IconComp = entry.component;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    id={`btn-icon-${entry.id}`}
                    onClick={() => handleInsertIcon(entry)}
                    className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.08] border border-white/[0.07] hover:border-blue-500/50 transition cursor-pointer"
                    title={`${entry.label} (${entry.category})`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-950/60 border border-white/[0.06] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComp
                        className="w-6 h-6"
                        style={{ color: iconColor }}
                        strokeWidth={strokeWidth}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate max-w-full">
                      {entry.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
