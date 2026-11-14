import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Languages,
  Palette,
  Sparkles,
  Loader2,
  X,
  Check,
  Send,
} from "lucide-react";

export interface PolishElementCallbackParams {
  selectedText: string;
  fieldType: string;
  bulletIndex?: number;
  instructions: string;
  tone?: string;
}

interface FloatingToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onAlign: (align: "left" | "center" | "right") => void;
  onColorChange: (color: string) => void;
  onTranslate?: () => void;
  onPolishElement?: (params: PolishElementCallbackParams) => Promise<void> | void;
  currentTone?: string;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onBold,
  onItalic,
  onAlign,
  onColorChange,
  onTranslate,
  onPolishElement,
  currentTone = "quiet-luxury",
}) => {
  const [position, setPosition] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // AI Polish Inline Input Bar State
  const [isAiPolishOpen, setIsAiPolishOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [selectedTone, setSelectedTone] = useState(currentTone);
  const [targetInfo, setTargetInfo] = useState<{
    selectedText: string;
    fieldType: string;
    bulletIndex?: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when AI Polish bar opens
  useEffect(() => {
    if (isAiPolishOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isAiPolishOpen]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Do not collapse toolbar position if user is actively interacting with the AI Polish inline input
      if (isAiPolishOpen) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setPosition(null);
        setShowColorPicker(false);
        setTargetInfo(null);
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setPosition(null);
        setShowColorPicker(false);
        setTargetInfo(null);
        return;
      }

      // Verify that selection is inside the slide canvas or an inline editable element
      const anchor = selection.anchorNode;
      const anchorEl = anchor instanceof HTMLElement ? anchor : anchor?.parentElement;
      const isInsideCanvas = Boolean(
        anchorEl?.closest("#viewport-container") ||
        anchorEl?.closest(".group\\/canvas") ||
        anchorEl?.isContentEditable ||
        anchorEl?.getAttribute("contenteditable") === "true" ||
        anchorEl?.closest("[data-field-type]")
      );

      if (!isInsideCanvas) {
        setPosition(null);
        setShowColorPicker(false);
        setTargetInfo(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setPosition(null);
        return;
      }

      // Detect fieldType and bulletIndex from DOM annotations
      const fieldEl = anchorEl?.closest("[data-field-type]");
      let detectedField = fieldEl?.getAttribute("data-field-type") || "text";
      const indexAttr = fieldEl?.getAttribute("data-field-index");
      const detectedBulletIndex =
        indexAttr !== null && indexAttr !== undefined ? parseInt(indexAttr, 10) : undefined;

      // Fallback heuristics if data-field-type attribute wasn't directly found
      if (detectedField === "text") {
        if (anchorEl?.closest("h1, h2")) detectedField = "title";
        else if (anchorEl?.closest("p")) detectedField = "subtitle";
      }

      setTargetInfo({
        selectedText,
        fieldType: detectedField,
        bulletIndex: detectedBulletIndex,
      });

      // Positioning logic: prefer placing above selection, flip below if too close to viewport top
      const placeAbove = rect.top > 80;
      const top = placeAbove ? rect.top - 10 : rect.bottom + 10;
      const left = Math.max(180, Math.min(window.innerWidth - 180, rect.left + rect.width / 2));

      setPosition({ top, left, placeAbove });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isAiPolishOpen]);

  // Handle Escape key to cancel AI Polish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAiPolishOpen) {
        handleCloseAiPolish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAiPolishOpen]);

  const handleOpenAiPolish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPicker(false);
    setIsAiPolishOpen(true);
  };

  const handleCloseAiPolish = () => {
    setIsAiPolishOpen(false);
    setIsPolishing(false);
    setInstructions("");
    // Clear selection
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // Ignore
    }
    setPosition(null);
  };

  const handleApplyPreset = (presetText: string) => {
    setInstructions(presetText);
    inputRef.current?.focus();
  };

  const handleSubmitPolish = async (customInst?: string) => {
    if (!targetInfo || !onPolishElement || isPolishing) return;

    const finalInstructions =
      (typeof customInst === "string" ? customInst : instructions).trim() ||
      "Make it executive-ready, crisp, high-impact, and clear.";

    setIsPolishing(true);

    try {
      await onPolishElement({
        selectedText: targetInfo.selectedText,
        fieldType: targetInfo.fieldType,
        bulletIndex: targetInfo.bulletIndex,
        instructions: finalInstructions,
        tone: selectedTone,
      });
    } finally {
      setIsPolishing(false);
      handleCloseAiPolish();
    }
  };

  if (!position) return null;

  const colors = ["#ffffff", "#000000", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const getFieldBadgeLabel = () => {
    if (!targetInfo) return "선택 텍스트";
    if (targetInfo.fieldType === "title") return "제목 (Title)";
    if (targetInfo.fieldType === "subtitle") return "부제목 (Subtitle)";
    if (targetInfo.fieldType === "bullet-title") {
      return `불릿 제목 ${targetInfo.bulletIndex !== undefined ? `#${targetInfo.bulletIndex + 1}` : ""}`;
    }
    if (targetInfo.fieldType === "bullet-desc") {
      return `불릿 설명 ${targetInfo.bulletIndex !== undefined ? `#${targetInfo.bulletIndex + 1}` : ""}`;
    }
    return "요소 텍스트";
  };

  return createPortal(
    <div
      className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: position.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
      onMouseDown={(e) => {
        // Prevent clicking inside toolbar from losing cursor selection
        e.stopPropagation();
      }}
    >
      {/* 1. COMPACT INLINE AI POLISH INPUT BAR */}
      {isAiPolishOpen ? (
        <div
          className="bg-[#0f141d]/95 backdrop-blur-xl border border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-xl p-3 text-slate-200 text-xs w-[360px] sm:w-[420px] transition-all duration-150 ring-1 ring-violet-500/20"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/30">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="font-semibold text-slate-100 text-xs tracking-tight">AI Polish Element</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-500/15 border border-violet-500/30 text-violet-300">
                {getFieldBadgeLabel()}
              </span>
            </div>

            <button
              onClick={handleCloseAiPolish}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/10 transition cursor-pointer"
              title="닫기 (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected Quote Preview */}
          {targetInfo?.selectedText && (
            <div className="mb-2 px-2 py-1 rounded bg-slate-900/60 border border-white/[0.06] text-[11px] text-slate-300 italic truncate border-l-2 border-l-violet-400">
              "{targetInfo.selectedText}"
            </div>
          )}

          {/* Compact Inline Input */}
          <div className="relative flex items-center mb-2">
            <input
              ref={inputRef}
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitPolish();
                }
              }}
              placeholder="요청사항 (예: 더 간결하게, 임원 보고 어조로, 수치 강조)..."
              disabled={isPolishing}
              className="w-full bg-slate-950/80 border border-white/[0.12] focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/50 rounded-lg pl-3 pr-20 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
            />
            <button
              onClick={() => handleSubmitPolish()}
              disabled={isPolishing}
              className="absolute right-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-md text-[11px] flex items-center space-x-1 transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Enter 키로 다듬기 실행"
            >
              {isPolishing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>정제 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-violet-200" />
                  <span>다듬기</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {[
              { label: "더 간결하게", inst: "핵심만 남기고 가장 간결하고 명확하게 압축하세요." },
              { label: "임원 보고용", inst: "격식 있는 C-레벨 임원 및 외교 브리핑 어조로 다듬으세요." },
              { label: "설득력 강화", inst: "임팩트와 청중 설득력을 극대화하여 표현하세요." },
              { label: "실행 중심", inst: "명확한 액션 아이템과 실행 중심의 능동적 표현으로 변경하세요." },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleApplyPreset(preset.inst)}
                disabled={isPolishing}
                className="px-2 py-0.5 rounded text-[10px] bg-white/[0.05] hover:bg-violet-500/20 text-slate-300 hover:text-violet-200 border border-white/[0.08] hover:border-violet-500/40 transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Tone Selector & Footer info */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.08] text-[10px] text-slate-400">
            <div className="flex items-center space-x-1">
              <span className="text-slate-500">어조:</span>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                disabled={isPolishing}
                className="bg-slate-900 border border-white/[0.1] rounded px-1.5 py-0.5 text-slate-200 text-[10px] outline-none cursor-pointer focus:border-violet-500"
              >
                <option value="quiet-luxury">Quiet Luxury</option>
                <option value="consulting">McKinsey Consulting</option>
                <option value="startup-pitch">Startup Pitch</option>
                <option value="academic">Academic & Diploma</option>
              </select>
            </div>

            <span className="text-slate-500">Enter 키로 적용 · Esc로 닫기</span>
          </div>
        </div>
      ) : (
        /* 2. STANDARD FLOATING FORMATTING TOOLBAR */
        <div className="flex items-center space-x-1 bg-[#151921]/95 backdrop-blur-md border border-white/[0.12] shadow-2xl rounded-lg px-2 py-1 text-slate-200 text-xs">
          {/* AI POLISH BUTTON (Lucide: Sparkles) */}
          <button
            onClick={handleOpenAiPolish}
            className="flex items-center space-x-1.5 px-2.5 py-1 whitespace-nowrap bg-gradient-to-r from-violet-600/25 to-indigo-600/25 hover:from-violet-600/40 hover:to-indigo-600/40 text-violet-200 hover:text-white border border-violet-500/40 hover:border-violet-400/60 rounded-md transition font-medium cursor-pointer shadow-sm group"
            title="AI Polish (선택 텍스트 고도화)"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400 group-hover:rotate-12 transition-transform duration-200" strokeWidth={1.75} />
            <span className="font-semibold text-[11px] tracking-tight">AI Polish</span>
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* Bold & Italic */}
          <button
            onClick={onBold}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="굵게 (Bold)"
          >
            <Bold className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={onItalic}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="기울임 (Italic)"
          >
            <Italic className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* Alignments */}
          <button
            onClick={() => onAlign("left")}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="좌측 정렬"
          >
            <AlignLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onAlign("center")}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="가운데 정렬"
          >
            <AlignCenter className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onAlign("right")}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="우측 정렬"
          >
            <AlignRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* Color Picker */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer flex items-center space-x-1"
              title="텍스트 색상"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-[#151921] border border-white/[0.12] p-1.5 rounded-md shadow-xl flex space-x-1 z-50">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onColorChange(c);
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Translate Button */}
          {onTranslate && (
            <>
              <div className="w-px h-4 bg-white/[0.1] mx-0.5" />
              <button
                onClick={onTranslate}
                className="flex items-center space-x-1 px-2.5 py-1 whitespace-nowrap bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded transition font-medium cursor-pointer"
                title="번역"
              >
                <Languages className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>번역</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};
