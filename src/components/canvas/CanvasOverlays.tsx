import React from "react";
import { SlideData } from "../../types";
import {
  RotateCcw,
  RefreshCw,
  Check,
  Ban,
  AlertTriangle,
} from "lucide-react";

interface CanvasOverlaysProps {
  slide: SlideData;
  isRedesigning?: boolean;
  showRedesignBar?: boolean;
  onAiRedesign?: () => void;
  onUndoRedesign?: () => void;
  onConfirmRedesign?: () => void;
  highlightedField?: string | null;
  aiInstruction?: string;
  isAiProcessing?: boolean;
  onAiInstructionChange?: (val: string) => void;
  onInContextAiSubmit?: (e: React.FormEvent) => void;
  selectedIndices?: number[];
  selectedType?: "bullet" | "stat" | null;
  onDeselect?: () => void;
  onNudgeOrder?: (dir: "up" | "down") => void;
  onResetPosition?: () => void;
  draggedIndex: number | null;
  snappedCol: number | null;
  snappedRow: number | null;
  isColliding?: boolean;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = ({
  slide,
  isRedesigning = false,
  showRedesignBar = false,
  onAiRedesign,
  onUndoRedesign,
  onConfirmRedesign,
  draggedIndex,
  snappedCol,
  snappedRow,
  isColliding,
}) => {
  return (
    <>
      {/* Floating Redesign Control Bar (Undo/Redo/Regen) */}
      {showRedesignBar && (
        <div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-45 bg-[#151921]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-violet-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-3 text-xs animate-fadeIn text-white font-sans pointer-events-auto"
          data-collision-zone="static"
        >
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span className="font-semibold text-violet-300">레이아웃 추천 적용</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center space-x-2">
            {onUndoRedesign && (
              <button
                type="button"
                onClick={onUndoRedesign}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>이전 디자인으로 원복</span>
              </button>
            )}
            {onAiRedesign && (
              <button
                type="button"
                onClick={onAiRedesign}
                disabled={isRedesigning}
                className="px-2.5 py-1 rounded bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 hover:text-white border border-violet-500/20 transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>다시 생성</span>
              </button>
            )}
            {onConfirmRedesign && (
              <button
                type="button"
                onClick={onConfirmRedesign}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center space-x-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>적용 완료</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logical Invisible Design Grid Overlay (lights up when elements align near it) */}
      {draggedIndex !== null && (
        <div className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300">
          {/* 11 Vertical Grid Lines (creating a 12-column layout) */}
          {Array.from({ length: 11 }).map((_, i) => {
            const colIdx = i + 1;
            const isSnapped = snappedCol === colIdx;
            return (
              <div
                key={`col-${colIdx}`}
                className="absolute top-0 bottom-0 border-l transition-all duration-100"
                style={{
                  left: `${(colIdx / 12) * 100}%`,
                  borderColor: isSnapped ? "rgb(59, 130, 246)" : "rgba(99, 102, 241, 0.05)",
                  borderStyle: isSnapped ? "solid" : "dashed",
                  boxShadow: isSnapped ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
                  opacity: isSnapped ? 0.9 : 0.3,
                  borderWidth: isSnapped ? "1.5px" : "1px",
                }}
              />
            );
          })}

          {/* 5 Horizontal Grid Lines (creating a 6-row layout) */}
          {Array.from({ length: 5 }).map((_, j) => {
            const rowIdx = j + 1;
            const isSnapped = snappedRow === rowIdx;
            return (
              <div
                key={`row-${rowIdx}`}
                className="absolute left-0 right-0 border-t transition-all duration-100"
                style={{
                  top: `${(rowIdx / 6) * 100}%`,
                  borderColor: isSnapped ? "rgb(59, 130, 246)" : "rgba(99, 102, 241, 0.05)",
                  borderStyle: isSnapped ? "solid" : "dashed",
                  boxShadow: isSnapped ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
                  opacity: isSnapped ? 0.9 : 0.3,
                  borderWidth: isSnapped ? "1.5px" : "1px",
                }}
              />
            );
          })}
          {/* Collision Warning UI */}
          {isColliding && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-[1px] animate-pulse pointer-events-none border-4 border-red-500/30 rounded-xl z-50">
              <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center space-x-2 font-bold transform scale-110">
                <Ban className="w-5 h-5" />
                <span>정적 요소와 겹침 (Collision)</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
