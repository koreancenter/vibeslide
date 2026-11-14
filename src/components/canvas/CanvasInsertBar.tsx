import React, { useState, useRef, useEffect } from "react";
import {
  Type,
  Square,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Layers,
  X,
  Sparkles,
  GitCommitHorizontal,
  Spline,
  Minus,
} from "lucide-react";
import {
  CanvasConnectorType,
  CanvasElement,
  CanvasShapeStylePreset,
  CanvasShapeVariant,
} from "../../types";
import { useSlideContext } from "../../context/SlideContext";
import { useModalContext } from "../../context/ModalContext";
import { ShapePicker } from "../ShapePicker";
import { buildShapePresetStyle } from "./shapeRenderUtils";

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
    connectorDraft,
    setConnectorDraft,
    triggerToast,
    language,
  } = useSlideContext();
  const { openModal } = useModalContext();

  const [openMenu, setOpenMenu] = useState<"shape" | "image" | "connector" | null>(null);
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

  useEffect(() => {
    if (!connectorDraft?.active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectorDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connectorDraft?.active, setConnectorDraft]);

  if (!activeSlide) return null;

  const existingElements = activeSlide.overlayElements || [];
  const connectableCount = existingElements.filter((el) => el.type !== "connector").length;

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
    setConnectorDraft(null);
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

  const handleAddShape = (variant: CanvasShapeVariant, preset: CanvasShapeStylePreset) => {
    setConnectorDraft(null);
    const offset = (existingElements.length % 5) * 2.5;
    const isLine = variant === "line";
    const isCircle = variant === "circle";
    const isDiamond = variant === "diamond";
    const isTriangle = variant === "triangle";
    const isPill = variant === "pill";
    const isVerticalArrow = variant === "arrow-up" || variant === "arrow-down";
    const isHorizontalArrow =
      variant === "arrow-right" || variant === "arrow-left" || variant === "arrow-bidirectional";

    let width = 22;
    let height = 22;
    if (isLine) {
      width = 32;
      height = 2.5;
    } else if (isCircle || isDiamond || isTriangle) {
      width = 16;
      height = 28;
    } else if (isPill) {
      width = 24;
      height = 9;
    } else if (isHorizontalArrow) {
      width = 22;
      height = 14;
    } else if (isVerticalArrow) {
      width = 11;
      height = 28;
    } else if (variant === "callout") {
      width = 26;
      height = 22;
    }

    const presetStyle = buildShapePresetStyle(preset, displayedTheme, isLine);

    const el: CanvasElement = {
      id: `ov_shp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: "shape",
      x: 34 + offset,
      y: 34 + offset,
      width,
      height,
      rotation: 0,
      zIndex: getNextZIndex(),
      content: isPill ? (isKo ? "핵심 포인트" : "Key Highlight") : "",
      style: {
        borderRadius:
          isCircle || isPill ? 9999 : variant === "rounded" ? 14 : 4,
        fontSize: 13,
        fontWeight: "semibold",
        textAlign: "center",
        shapeVariant: variant,
        ...presetStyle,
      },
    };
    insertElement(el, `Insert Shape (${variant}, ${preset})`);
    triggerToast(isKo ? "도형이 캔버스에 추가되었습니다." : "Shape added to canvas.");
  };

  const handleStartConnectorMode = (connectorType: CanvasConnectorType) => {
    setOpenMenu(null);
    if (connectableCount < 2) {
      triggerToast(
        isKo
          ? "연결선을 그리려면 캔버스에 최소 2개의 개체(도형/아이콘/텍스트)를 추가하세요."
          : "Add at least 2 elements (shapes, icons, or boxes) on the canvas to connect them."
      );
      return;
    }
    setSelectedOverlayId(null);
    setConnectorDraft({
      active: true,
      connectorType,
      sourceId: null,
    });
  };

  const handleAddImageUrl = (url: string) => {
    setConnectorDraft(null);
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
          {isKo ? "자유 개체" : "Insert"}
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

        {/* Vector Shape Library */}
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
            title={isKo ? "벡터 도형 라이브러리" : "Vector Shape Library"}
          >
            <Square className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium">{isKo ? "도형" : "Shapes"}</span>
          </button>

          {openMenu === "shape" && (
            <ShapePicker
              theme={displayedTheme}
              isKo={isKo}
              onSelectShape={handleAddShape}
              onClose={() => setOpenMenu(null)}
            />
          )}
        </div>

        {/* Searchable Vector Icon Studio */}
        <button
          type="button"
          id="btn-insert-overlay-icon"
          onClick={() => {
            setOpenMenu(null);
            setConnectorDraft(null);
            openModal("iconStudio");
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-200 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
          title={isKo ? "벡터 아이콘 스튜디오 열기" : "Open Vector Icon Studio"}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium">{isKo ? "아이콘" : "Icons"}</span>
        </button>

        {/* Smart Connectors */}
        <div className="relative">
          <button
            type="button"
            id="btn-insert-overlay-connector"
            onClick={() => {
              if (connectorDraft?.active) {
                setConnectorDraft(null);
              } else {
                setOpenMenu((m) => (m === "connector" ? null : "connector"));
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer whitespace-nowrap shrink-0 ${
              connectorDraft?.active || openMenu === "connector"
                ? "bg-emerald-600/20 border-emerald-500/45 text-emerald-200"
                : "bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] text-slate-200 hover:text-white"
            }`}
            title={isKo ? "두 개체를 연결하는 스마트 커넥터" : "Draw Smart Connector between 2 elements"}
          >
            <GitCommitHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">
              {connectorDraft?.active
                ? isKo
                  ? "연결 취소"
                  : "Cancel Link"
                : isKo
                ? "연결선"
                : "Connector"}
            </span>
          </button>

          {openMenu === "connector" && (
            <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#151921] border border-white/[0.12] rounded-lg shadow-2xl p-1.5 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] font-medium text-slate-400">
                {isKo ? "스마트 커넥터 유형 선택" : "Connect Two Canvas Elements"}
              </div>
              <button
                type="button"
                id="btn-connector-straight"
                onClick={() => handleStartConnectorMode("straight")}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Minus className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="font-medium">{isKo ? "직선 커넥터" : "Straight Arrow"}</div>
                  <div className="text-[10px] text-slate-400">Direct node-to-node link</div>
                </div>
              </button>
              <button
                type="button"
                id="btn-connector-elbow"
                onClick={() => handleStartConnectorMode("elbow")}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 text-slate-200 flex items-center gap-2 cursor-pointer text-[11px]"
              >
                <Spline className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="font-medium">{isKo ? "꺾은선(엘보) 커넥터" : "Elbow Orthogonal"}</div>
                  <div className="text-[10px] text-slate-400">Clean 90° flowchart route</div>
                </div>
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
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
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

        {/* Active Smart Connector Instruction Chip */}
        {connectorDraft?.active && (
          <div className="ml-2 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-2 whitespace-nowrap shrink-0 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {connectorDraft.sourceId
                ? isKo
                  ? "연결할 대상 개체를 클릭하세요"
                  : "Click target element to connect"
                : isKo
                ? "시작 개체를 클릭하세요"
                : "Click source element on canvas"}
            </span>
            <button
              type="button"
              onClick={() =>
                setConnectorDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        connectorType: prev.connectorType === "straight" ? "elbow" : "straight",
                      }
                    : null
                )
              }
              className="px-1.5 py-0.2 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white cursor-pointer"
              title="Switch connector routing"
            >
              {connectorDraft.connectorType === "straight" ? "Straight" : "Elbow"}
            </button>
          </div>
        )}
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
