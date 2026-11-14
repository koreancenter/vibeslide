import React, { useState, useEffect, useRef, useCallback } from "react";
import { SlideData } from "../../types";
import { parseMarkdownToSlides, slidesToMarkdown } from "../../utils/markdownParser";
import { useSlideContext } from "../../context/SlideContext";
import {
  Wand2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface MarkdownPaneProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onUpdateAllSlides?: (slides: SlideData[]) => void;
  onSyncMarkdownToSlides?: (slides: SlideData[]) => void;
  highlightedField?: string | null;
  onHighlightedFieldChange?: (field: string | null) => void;
}


export const MarkdownPane: React.FC<MarkdownPaneProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onUpdateAllSlides,
  onSyncMarkdownToSlides,
  highlightedField,
  onHighlightedFieldChange,
}) => {
  const { constitution } = useSlideContext();
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "warning" | "error">("info");


  // Sync slides into rawMarkdown when not actively focused
  useEffect(() => {
    if (!isFocused && slides && slides.length > 0) {
      const md = slidesToMarkdown(slides);
      if (md !== rawMarkdown) {
        setRawMarkdown(md);
      }
    }
  }, [slides, isFocused]);

  // Debounced sync from rawMarkdown back to slides (300ms)
  useEffect(() => {
    if (isFocused && onSyncMarkdownToSlides) {
      const handler = setTimeout(() => {
        const parsed = parseMarkdownToSlides(rawMarkdown);
        const mergedSlides = parsed.map((p, i) => {
          const existing = slides[i] || {};
          const structureChanged =
            existing.titleKo !== p.titleKo ||
            existing.subtitleKo !== p.subtitleKo ||
            existing.bullets?.length !== p.bullets?.length ||
            Boolean(existing.customTable) !== Boolean(p.customTable) ||
            Boolean(existing.image) !== Boolean(p.image);

          return {
            ...existing,
            ...p,
            layout: structureChanged ? p.layout : (existing.layout || p.layout),
            id: existing.id || p.id,
          } as SlideData;
        });
        onSyncMarkdownToSlides(mergedSlides);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [rawMarkdown, isFocused]);

  // Listen to highlightedField updates from parent (Canvas click-to-sync)
  useEffect(() => {
    if (!highlightedField || !textareaRef.current) return;
    if (isFocused) return;
    const ta = textareaRef.current;
    const text = ta.value;

    const slideBlocks = text.split(/(?:^|\n)\s*---\s*(?:\n|$)/);
    let slideStartIndex = 0;
    for (let i = 0; i < activeSlideIndex; i++) {
      if (slideBlocks[i] !== undefined) {
        const separatorMatch = text.slice(slideStartIndex).match(/(?:^|\n)\s*---\s*(?:\n|$)/);
        const sepLength = separatorMatch ? separatorMatch[0].length : 4;
        slideStartIndex += slideBlocks[i].length + sepLength;
      }
    }

    const currentSlideText = slideBlocks[activeSlideIndex] || "";
    let localIndex = -1;

    if (highlightedField === "title") {
      const match = currentSlideText.match(/(?:^|\n)#\s+/);
      if (match && match.index !== undefined) {
        localIndex = match.index + (match[0].startsWith("\n") ? 1 : 0);
      }
    } else if (highlightedField === "subtitle") {
      const match = currentSlideText.match(/(?:^|\n)##\s+/);
      if (match && match.index !== undefined) {
        localIndex = match.index + (match[0].startsWith("\n") ? 1 : 0);
      }
    } else if (highlightedField.startsWith("bullets-")) {
      const bulletIdx = parseInt(highlightedField.split("-")[1], 10);
      const regex = /(?:^|\n)[-*]\s+/g;
      let match;
      let count = 0;
      while ((match = regex.exec(currentSlideText)) !== null) {
        if (count === bulletIdx) {
          localIndex = match.index + (match[0].startsWith("\n") ? 1 : 0);
          break;
        }
        count++;
      }
    } else if (highlightedField === "image") {
      const match = currentSlideText.match(/(?:^|\n)(?:!\[|http|\S+\.(?:png|jpg|jpeg|gif|svg))/);
      if (match && match.index !== undefined) {
        localIndex = match.index + (match[0].startsWith("\n") ? 1 : 0);
      }
    }

    if (localIndex !== -1) {
      const globalIndex = slideStartIndex + localIndex;
      const textBefore = text.substring(0, globalIndex);
      const lineNum = textBefore.split("\n").length;
      setActiveLine(lineNum);

      // Scroll textarea smoothly without stealing focus from the slide canvas
      const lineOffsetHeight = 24;
      const estimatedScrollTop = (lineNum - 4) * lineOffsetHeight;
      ta.scrollTop = Math.max(0, estimatedScrollTop);
      if (lineGutterRef.current) {
        lineGutterRef.current.scrollTop = ta.scrollTop;
      }

      // Only set selection if focus is already inside this editor
      if (document.activeElement === ta) {
        ta.setSelectionRange(globalIndex, globalIndex + 1);
      }
    }
  }, [highlightedField, activeSlideIndex]);

  const syncCursorPosition = useCallback((ta: HTMLTextAreaElement | null) => {
    if (!ta) return;

    // Sync active slide with cursor line
    const pos = ta.selectionStart;
    const textBefore = ta.value.substring(0, pos);
    const sections = textBefore.split(/\n\s*---\s*\n/);
    const targetIdx = Math.min(sections.length - 1, slides.length - 1);
    if (targetIdx >= 0 && targetIdx !== activeSlideIndex && onSelectSlide) {
      onSelectSlide(targetIdx);
    }

    // Gutter active line highlight
    const currentLineNum = textBefore.split("\n").length;
    setActiveLine(currentLineNum);

    // Bidirectional canvas highlighting sync
    const currentLineText = textBefore.split("\n").pop() || "";
    let field: string | null = null;
    if (currentLineText.trim().startsWith("# ")) {
      field = "title";
    } else if (currentLineText.trim().startsWith("## ")) {
      field = "subtitle";
    } else if (currentLineText.trim().startsWith("- ") || currentLineText.trim().startsWith("* ")) {
      const activeSlideTextBeforeCursor = sections[sections.length - 1] || "";
      const bulletsCount = (activeSlideTextBeforeCursor.match(/^[-*]\s+/gm) || []).length;
      if (bulletsCount > 0) {
        field = `bullets-${bulletsCount - 1}`;
      }
    } else if (
      currentLineText.includes("http") ||
      currentLineText.includes("![") ||
      currentLineText.includes(".png") ||
      currentLineText.includes(".jpg")
    ) {
      field = "image";
    }
    onHighlightedFieldChange?.(field);

  }, [slides.length, activeSlideIndex, onSelectSlide, onHighlightedFieldChange]);

  const handleGutterLineClick = (lineNum: number) => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const lines = ta.value.split("\n");
    let charIndex = 0;
    for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    ta.focus();
    ta.setSelectionRange(charIndex, charIndex);
    setActiveLine(lineNum);
    syncCursorPosition(ta);
  };

  const handleGenerateAiSlides = async () => {
    if (!rawMarkdown.trim()) return;
    setIsGenerating(true);
    setStatusMessage("AI가 텍스트를 분석하고 최적 레이아웃을 생성 중입니다...");
    setStatusType("info");

    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: rawMarkdown, constitution }),
      });

      const data = await response.json();

      if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
        if (onUpdateAllSlides) {
          onUpdateAllSlides(data.slides);
        }

        if (data.isFallback) {
          setStatusMessage(`할당량 초과로 일반 파싱 모드로 ${data.slides.length}개의 슬라이드가 생성되었습니다.`);
          setStatusType("warning");
        } else {
          setStatusMessage(`성공적으로 ${data.slides.length}개의 AI 슬라이드가 자동 생성되었습니다!`);
          setStatusType("info");
        }
        setTimeout(() => {
          setStatusMessage("");
          setStatusType("info");
        }, 5000);
      } else {
        setStatusMessage("슬라이드 생성 실패: 올바른 응답을 받지 못했습니다.");
        setStatusType("error");
      }
    } catch (err: any) {
      setStatusMessage("오류 발생: " + (err?.message || "AI 파싱 실패"));
      setStatusType("error");
    } finally {
      setIsGenerating(false);
    }
  };

  const lineCount = rawMarkdown.split("\n").length || 1;

  return (
    <>
      {/* Notion-like Raw Textarea Editor with Inline Bubble Menu and Line Gutter */}
      <div className="flex-1 flex flex-col p-3.5 overflow-hidden relative bg-transparent">
        <div className="flex-1 flex overflow-hidden relative bg-[#0e1117]/60 border border-white/[0.08] rounded-lg">
          {/* Line Numbers Gutter */}
          <div
            ref={lineGutterRef}
            className="w-10 shrink-0 bg-transparent border-r border-white/[0.06] py-3 text-right pr-2 select-none text-[10px] text-slate-500 font-mono overflow-hidden h-full"
          >
            {Array.from({ length: lineCount }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                onClick={() => handleGutterLineClick(num)}
                className={`h-6 flex items-center justify-end font-semibold cursor-pointer select-none ${
                  num === activeLine
                    ? "text-blue-400 bg-blue-500/10 font-bold border-r-2 border-blue-500 -mr-[9px] pr-[7px]"
                    : "hover:text-slate-400"
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={rawMarkdown}
            onChange={(e) => {
              setRawMarkdown(e.target.value);
              syncCursorPosition(e.target);
            }}
            onSelect={(e) => syncCursorPosition(e.currentTarget)}
            onKeyDown={() => {
              setTimeout(() => {
                if (textareaRef.current) {
                  syncCursorPosition(textareaRef.current);
                }
              }, 0);
            }}
            onKeyUp={(e) => syncCursorPosition(e.currentTarget)}
            onClick={(e) => syncCursorPosition(e.currentTarget)}
            onMouseDown={() => {
              setTimeout(() => {
                if (textareaRef.current) {
                  syncCursorPosition(textareaRef.current);
                }
              }, 0);
            }}
            onMouseUp={(e) => syncCursorPosition(e.currentTarget)}
            onScroll={(e) => {
              if (lineGutterRef.current) {
                lineGutterRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            onFocus={(e) => {
              setIsFocused(true);
              syncCursorPosition(e.currentTarget);
            }}
            onBlur={() => {
              setIsFocused(false);
              onHighlightedFieldChange?.(null);
              if (onSyncMarkdownToSlides) {
                const parsed = parseMarkdownToSlides(rawMarkdown);
                const mergedSlides = parsed.map((p, i) => {
                  const existing = slides[i] || {};
                  const structureChanged =
                    existing.titleKo !== p.titleKo ||
                    existing.subtitleKo !== p.subtitleKo ||
                    existing.bullets?.length !== p.bullets?.length ||
                    Boolean(existing.customTable) !== Boolean(p.customTable) ||
                    Boolean(existing.image) !== Boolean(p.image);

                  return {
                    ...existing,
                    ...p,
                    layout: structureChanged ? p.layout : (existing.layout || p.layout),
                    id: existing.id || p.id,
                  } as SlideData;
                });
                onSyncMarkdownToSlides(mergedSlides);
              }
            }}
            placeholder={`# Slide Title\n## Subtitle description\n- Bullet point 1\n- Bullet point 2\n\n---\n\n# Next Slide Title...`}
            className="flex-1 w-full bg-transparent p-3 pl-3 text-xs text-slate-200 font-mono leading-6 resize-none custom-scrollbar focus:outline-none"
            spellCheck={false}
          />
        </div>


      </div>

      {/* AI Parse & Auto Layout Button */}
      <div className="p-3.5 bg-transparent border-t border-white/[0.08] space-y-2">
        {statusMessage && (
          <div
            className={`text-[11px] px-3 py-2 rounded-lg flex items-center space-x-2 border shadow-sm ${
              statusType === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : statusType === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-blue-500/10 border-blue-500/25 text-blue-200"
            }`}
          >
            {isGenerating && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
            {statusType === "warning" && !isGenerating && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        <button
          type="button"
          id="btn-generate-ai-slides"
          onClick={handleGenerateAiSlides}
          disabled={isGenerating || !rawMarkdown.trim()}
          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Generate AI Layout"
          aria-label="Generate AI Layout"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>AI 슬라이드 생성 및 업데이트</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
