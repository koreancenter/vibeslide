import React, { useState, useRef, useEffect } from "react";
import { SlideData } from "../types";
import { Plus, Trash2, Copy, GripVertical, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { renderLayoutMiniWireframe } from "./editor/wireframeHelpers";
import { getJapaneseFallbackText } from "../utils/translationDictionary";

export interface SlideHorizontalDockProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide?: (fromIndex: number, toIndex: number) => void;
  language?: string;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const SlideHorizontalDock: React.FC<SlideHorizontalDockProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  language = "en",
  onToggleCollapse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const activeThumbRef = useRef<HTMLDivElement | null>(null);
  const isKo = language === "ko";

  // Automatically scroll active card into view when activeSlideIndex changes
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [activeSlideIndex, isCollapsed]);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (onToggleCollapse) onToggleCollapse(nextState);
  };

  if (isCollapsed) {
    return (
      <div className="h-8 bg-[#0c0e14] border-t border-white/[0.08] px-3 flex items-center justify-between text-xs text-slate-400 shrink-0 select-none z-20">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium text-[11px] tracking-wide">
            {isKo ? "슬라이드 관리" : "Slide Management"} ({slides.length})
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300">
            #{activeSlideIndex + 1}
          </span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onAddSlide}
            className="p-1 hover:bg-white/[0.08] rounded text-slate-300 hover:text-blue-400 transition cursor-pointer"
            title={isKo ? "슬라이드 추가" : "Add Slide"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer text-[11px]"
            title={isKo ? "독 펼치기" : "Expand Dock"}
          >
            <span>{isKo ? "펼치기" : "Show Dock"}</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0e14]/95 backdrop-blur-md border-t border-white/[0.08] px-3.5 pt-2 pb-2.5 flex flex-col shrink-0 select-none z-20 transition-all">
      {/* Top Header of Dock */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold tracking-wide text-slate-200">
              {isKo ? "슬라이드 관리" : "Slide Management"}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md">
            <span className="text-blue-400 font-semibold">{activeSlideIndex + 1}</span>
            <span>/</span>
            <span>{slides.length}</span>
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {isKo ? "· 드래그하여 순서 변경" : "· Drag to reorder"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onAddSlide}
            className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-md transition text-xs font-medium flex items-center space-x-1 cursor-pointer active:scale-95 shadow-sm"
            title={isKo ? "슬라이드 추가" : "Add Slide"}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden xs:inline">{isKo ? "슬라이드 추가" : "Add Slide"}</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicateSlide(activeSlideIndex)}
            className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white rounded-md transition flex items-center justify-center cursor-pointer active:scale-95"
            title={isKo ? "현재 슬라이드 복제" : "Duplicate Active Slide"}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (slides.length > 1) {
                onDeleteSlide(activeSlideIndex);
              }
            }}
            disabled={slides.length <= 1}
            className={`p-1.5 rounded-md transition flex items-center justify-center border shadow-sm active:scale-95 ${
              slides.length > 1
                ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"
                : "bg-white/[0.02] border-white/[0.05] text-slate-600 cursor-not-allowed opacity-40"
            }`}
            title={isKo ? "현재 슬라이드 삭제" : "Delete Active Slide"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-white/[0.1] mx-0.5" />

          <button
            type="button"
            onClick={handleToggle}
            className="p-1 hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 rounded-md transition cursor-pointer"
            title={isKo ? "독 접기" : "Collapse Dock"}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="overflow-x-auto custom-scrollbar pb-1">
        <motion.div layout className="flex items-center space-x-2.5 min-w-max py-0.5 px-0.5">
          <AnimatePresence initial={false} mode="popLayout">
            {slides.map((s, idx) => {
              const isActive = idx === activeSlideIndex;
              const isDragOver = dragOverIdx === idx;
              const isBeingDragged = draggedIdx === idx;
              const displayTitle = isKo
                ? (s.titleKo || s.titleId || `슬라이드 ${idx + 1}`)
                : language === "ja"
                ? (s.titleJa || getJapaneseFallbackText(s.titleKo || s.titleId) || `スライド ${idx + 1}`)
                : (s.titleId || s.titleKo || `Slide ${idx + 1}`);

              return (
                <motion.div
                  key={s.id || `dock-slide-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 10 }}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  ref={isActive ? activeThumbRef : null}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedIdx(idx);
                    e.dataTransfer.setData("text/plain", idx.toString());
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverIdx !== idx) setDragOverIdx(idx);
                  }}
                  onDragLeave={() => {
                    if (dragOverIdx === idx) setDragOverIdx(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIdx(null);
                    setDraggedIdx(null);
                    const sourceIndexStr = e.dataTransfer.getData("text/plain");
                    if (sourceIndexStr) {
                      const sourceIndex = parseInt(sourceIndexStr, 10);
                      if (sourceIndex !== idx && onMoveSlide) {
                        onMoveSlide(sourceIndex, idx);
                      }
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onClick={() => onSelectSlide(idx)}
                  className={`group relative w-36 h-[5.25rem] rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing flex flex-col justify-between p-2 shrink-0 ${
                    isBeingDragged ? "opacity-30 border-dashed border-white/20" : ""
                  } ${
                    isDragOver && !isBeingDragged
                      ? "border-blue-500 bg-blue-500/15 scale-[1.03] shadow-md ring-1 ring-blue-500"
                      : isActive
                      ? "bg-[#141824] border-blue-500 text-white shadow-md ring-1 ring-blue-500/50"
                      : "bg-[#11141c] border-white/[0.08] hover:border-white/20 hover:bg-[#151922] text-slate-300"
                  }`}
                >
                  {/* Card Top Row: Number, Layout Wireframe, Quick Actions */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          isActive ? "bg-blue-600 text-white" : "bg-white/[0.08] text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="opacity-80 scale-90 origin-left">
                        {renderLayoutMiniWireframe(s.layout, false)}
                      </div>
                    </div>

                    {/* Quick Card Actions on Hover */}
                    <div
                      className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onDuplicateSlide(idx)}
                        className="p-1 rounded hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
                        title={isKo ? "복제" : "Duplicate"}
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      {slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteSlide(idx)}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer"
                          title={isKo ? "삭제" : "Delete"}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <div className="text-slate-500 p-0.5">
                        <GripVertical className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Row: Title */}
                  <div className="w-full pt-1">
                    <div
                      className={`text-[11px] font-medium truncate leading-tight ${
                        isActive ? "text-blue-200" : "text-slate-300"
                      }`}
                      title={displayTitle}
                    >
                      {displayTitle}
                    </div>
                  </div>

                  {/* Active highlight bar indicator */}
                  {isActive && (
                    <div className="absolute -bottom-px left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add Slide End-Card */}
          <button
            type="button"
            onClick={onAddSlide}
            className="w-20 h-[5.25rem] rounded-lg border border-dashed border-white/15 hover:border-blue-400/60 bg-white/[0.02] hover:bg-blue-500/10 flex flex-col items-center justify-center text-slate-400 hover:text-blue-300 transition-all cursor-pointer group shrink-0 active:scale-95 space-y-1"
            title={isKo ? "새 슬라이드 추가" : "Add New Slide"}
          >
            <div className="w-6 h-6 rounded-full bg-white/[0.06] group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-300" />
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-300">
              {isKo ? "추가" : "Add"}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
