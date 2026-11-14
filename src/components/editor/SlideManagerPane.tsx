import React, { useState } from "react";
import { SlideData } from "../../types";
import { Plus, Trash2, Copy, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SlideManagerPaneProps {
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide?: (fromIndex: number, toIndex: number) => void;
}

export const SlideManagerPane: React.FC<SlideManagerPaneProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  return (
    <div className="flex-1 flex flex-col p-3.5 overflow-hidden bg-[#0e1117] space-y-3 select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
          전체 슬라이드 ({slides.length})
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onAddSlide}
            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 rounded-md transition flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
            title="슬라이드 추가"
            aria-label="슬라이드 추가"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
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
            title="선택된 슬라이드 삭제"
            aria-label="선택된 슬라이드 삭제"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <motion.div layout className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {slides.map((s, idx) => {
              const isActive = idx === activeSlideIndex;
              const isDragOver = dragOverIdx === idx;
              const isBeingDragged = draggedIdx === idx;

              return (
                <motion.div
                  key={s.id || `idx-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -30 }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
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
                  className={`group flex items-center justify-between py-2.5 px-3 rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing select-none relative ${
                    isBeingDragged ? "opacity-30 border-dashed border-white/20" : ""
                  } ${
                    isDragOver && !isBeingDragged
                      ? "border-blue-500 bg-blue-500/10 scale-[1.01] shadow-sm"
                      : isActive
                      ? "bg-blue-600/10 border-blue-500/80 text-white shadow-sm ring-1 ring-blue-500/30"
                      : "bg-[#151921] border-white/[0.08] hover:border-white/20 text-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Slide Number */}
                    <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isActive ? "bg-blue-600 text-white" : "bg-white/[0.06] text-slate-400"
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Slide Title */}
                    <div className="truncate text-xs font-medium">
                      {s.titleKo || s.titleId || `Slide ${idx + 1}`}
                    </div>
                  </div>

                  {/* Drag Handle & Quick Actions Overlay on Hover */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity duration-150">
                      <button
                        type="button"
                        onClick={() => onDuplicateSlide(idx)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                        title="복사"
                        aria-label="슬라이드 복사"
                      >
                        <Copy className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5">
                      <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="mt-1 text-[11px] text-slate-500 text-center leading-relaxed font-sans">
        드래그하여 슬라이드 순서를 변경할 수 있습니다.
      </div>
    </div>
  );
};
