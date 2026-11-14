import React, { useState, useRef, useEffect } from "react";
import {
  Type,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Layers,
  X,
} from "lucide-react";
import { CanvasElement, CanvasShapeVariant } from "../../types";
import { useSlideContext } from "../../context/SlideContext";

const LOCAL_VISUAL_PRESETS = [
  { label: "Strategic Abstract", url: "/assets/aistudio/image_0b70fffe.png" },
  { label: "Executive Visual", url: "/assets/aistudio/image_5a5a04f4.png" },
  { label: "Architecture Frame", url: "/assets/aistudio/image_696882c7.png" },
  { label: "Data Visual", url: "/assets/aistudio/image_790b36ed.png" },
];

export const CanvasInsertBar: React.FC = () => {
  const {
    activeSlide,
    displayedTheme,
    handleUpdateSlide,
    selectedOverlayId,
    setSelectedOverlayId,
    triggerToast,
    language,
  } = useSlideContext();

  const [openMenu, setOpenMenu] = useState<"shape" | "image" | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isKo = language === "ko";

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!activeSlide) return null;

  const existingElements = activeSlide.overlayElements || [];

  const getNextZIndex = () => {
    const maxZ = existingElements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    return maxZ + 1;
  };

  const insertElement = (newEl: CanvasElement, actionDesc: string) => {
    const updatedSlide = {
      ...activeSlide,
      overlayElements: [...existingElements, newEl],
    };
    handleUpdateSlide(updatedSlide, true, actionDesc);
    setSelectedOverlayId(newEl.id);
    setOpenMenu(null);
  };

  const handleAddTextBox = () => {
    const offset = (existingElements.length % 5) * 2.5;
    const el: CanvasElement = {
      id: `ov_txt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "text",
      x: 12 + offset,
      y: 18 + offset,
      width: 34,
      height: 16,
      rotation: 0,
      zIndex: getNextZIndex(),
      content: isKo ? "자유 텍스트 상자 (더블클릭하여 편집)" : "Free-form text (double-click to edit)",
      style: {
        backgroundColor: "rgba(15, 23, 42, 0.82)",
        borderColor: displayedTheme.accentColor || "#3b82f6",
        borderWidth: 1,
        borderRadius: 8,
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "semibold",
        textAlign: "left",
        opacity: 1,
      },
    };
    insertElement(el, "Insert Free-form Text Box");
    triggerToast(isKo ? "텍스트 상자가 캔버스에 추가되었습니다." : "Text box added to canvas.");
  };

  const handleAddShape = (variant: CanvasShapeVariant) => {
    const offset = (existingElements.length % 5) * 2.5;
    const isLine = variant === "line";
    const isCircle = variant === "circle";
    const isPill = variant === "pill";

    const el: CanvasElement = {
      id: `ov_shp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "shape",
      x: 34 + offset,
      y: 34 + offset,
      width: isLine ? 32 : isCircle ? 16 : isPill ? 24 : 24,
      height: isLine ? 1.5 : isCircle ? 28 : isPill ? 9 : 22,
      rotation: 0,
      zIndex: getNextZIndex(),
      content: isPill ? (isKo ? "핵심 포인트" : "Key Highlight") : "",
      style: {
        backgroundColor: isLine
          ? displayedTheme.accentColor || "#3b82f6"
          : `${displayedTheme.accentColor || "#3b82f6"}26`,
        borderColor: displayedTheme.accentColor || "#3b82f6",
        borderWidth: isLine ? 0 : 2,
        borderRadius: isCircle || isPill ? 9999 : variant === "rounded" ? 14 : 4,
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "semibold",
        textAlign: "center",
        shapeVariant: variant,
        opacity: 1,
      },
    };
    insertElement(el, `Insert Shape (${variant})`);
    triggerToast(isKo ? "도형이 캔버스에 추가되었습니다." : "Shape added to canvas.");
  };

  const handleAddImageUrl = (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const offset = (existingElements.length % 5) * 2.5;
    const el: CanvasElement = {
      id: `ov_img_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "image",
      x: 56 - offset,
      y: 22 + offset,
      width: 30,
      height: 36,
      rotation: 0,
      zIndex: getNextZIndex(),
      content: cleanUrl,
      style: {
        backgroundColor: "transparent",
        borderColor: "rgba(255,255,255,0.18)",
        borderWidth: 1,
        borderRadius: 10,
        objectFit: "cover",
        opacity: 1,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      },
    };
    insertElement(el, "Insert Free-form Image");
    setImageUrlInput("");
    triggerToast(isKo ? "이미지가 캔버스에 추가되었습니다." : "Image added to canvas.");
  };

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        handleAddImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      ref={barRef}
      className="h-9 bg-[#0c0e14] border-b border-white/[0.08] px-3 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none z-20"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadImageFile}
        className="hidden"
      />

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-slate-400 mr-1 whitespace-nowrap shrink-0">
          {isKo ? "자유 개체 추가" : "Insert"}
        </span>

        {/* Insert Text Box */}
        <button
          type="button"
          id="btn-insert-overlay-text"
          onClick={handleAddTextBox}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-200 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
          title={isKo ? "자유 텍스트 상자 추가" : "Insert Free-Form Text Box"}
        >
          <Type className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium">{isKo ? "텍스트" : "Text Box"}</span>
        </button>

        {/* Insert Shape Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="btn-insert-overlay-shape"
            onClick={() => setOpenMenu((m) => (m === "shape" ? null : "shape"))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer whitespace-nowrap shrink-0 ${
              openMenu === "shape"
                ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                : "bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] text-slate-200 hover:text-white"
            }`}
            title={isKo ? "도형 추가" : "Insert Shape"}
          >
            <Square className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium">{isKo ? "도형" : "Shape"}</span>
          </button>

          {openMenu === "shape" && (
            <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#151921] border border-white/[0.12] rounded-lg shadow-2xl p-1.5 z-50 space-y-0.5">
              <button
                type="button"
                onClick={() => handleAddShape("rectangle")}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Square className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rectangle</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddShape("rounded")}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Square className="w-3.5 h-3.5 text-blue-400 rounded" />
                <span>Rounded Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddShape("circle")}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Circle</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddShape("pill")}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>Label Callout</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddShape("line")}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Minus className="w-3.5 h-3.5 text-rose-400" />
                <span>Accent Line</span>
              </button>
            </div>
          )}
        </div>

        {/* Insert Image Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="btn-insert-overlay-image"
            onClick={() => setOpenMenu((m) => (m === "image" ? null : "image"))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer whitespace-nowrap shrink-0 ${
              openMenu === "image"
                ? "bg-blue-600/20 border-blue-500/40 text-blue-200"
                : "bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] text-slate-200 hover:text-white"
            }`}
            title={isKo ? "이미지 추가" : "Insert Free-Form Image"}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">{isKo ? "이미지" : "Image"}</span>
          </button>

          {openMenu === "image" && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#151921] border border-white/[0.12] rounded-lg shadow-2xl p-3 z-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-200">
                  {isKo ? "캔버스 이미지 추가" : "Insert Image Object"}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isKo ? "파일 업로드..." : "Upload from Device..."}</span>
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddImageUrl(imageUrlInput);
                }}
                className="flex items-center gap-1"
              >
                <div className="relative flex-1">
                  <LinkIcon className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950/80 border border-white/[0.1] rounded-md pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!imageUrlInput.trim()}
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-[11px] font-medium cursor-pointer"
                >
                  Add
                </button>
              </form>

              <div className="pt-1 border-t border-white/[0.08]">
                <div className="text-[10px] text-slate-400 mb-1.5">
                  {isKo ? "로컬 에셋 프리셋" : "Quick Assets"}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {LOCAL_VISUAL_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => handleAddImageUrl(preset.url)}
                      className="text-left p-1.5 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] text-slate-300 hover:text-white truncate cursor-pointer transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: clean unboxed object metadata & deselect */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
        {existingElements.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono tabular-nums">
              {existingElements.length} {existingElements.length === 1 ? "object" : "objects"}
            </span>
          </div>
        )}
        {selectedOverlayId && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setSelectedOverlayId(null)}
              className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
            >
              {isKo ? "선택 해제" : "Deselect"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
