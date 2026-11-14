import React from "react";
import { motion } from "motion/react";
import { Check, GripVertical } from "lucide-react";
import { CommonLayoutProps } from "./layoutTypes";
import { getBuildInItemState } from "../../../utils/componentAnimation";

export const ProcessLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
  language,
  getText,
  buildInStep,
  buildInConfig,
  selectedIndices,
  selectedType,
  draggedIndex,
  draggedType,
  dragOverIndex,
  snappedCol,
  snappedRow,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleItemClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full items-stretch">
      {(slide.bullets || []).slice(0, 3).map((b: any, bIdx: number) => {
        const bTitle = b.titleJa && language === "ja" ? b.titleJa : getText(b.titleKo, b.titleId);
        const bDesc = b.descJa && language === "ja" ? b.descJa : getText(b.descKo, b.descId);

        const isDragged = draggedType === "bullet" && draggedIndex === bIdx;
        const isActiveDrop = dragOverIndex === bIdx && draggedIndex !== bIdx && draggedType === "bullet";
        const isValidDropTarget = draggedType === "bullet" && draggedIndex !== bIdx;
        const isSelected = selectedType === "bullet" && selectedIndices.includes(bIdx);
        const buildInState = getBuildInItemState(
          bIdx,
          buildInStep,
          buildInConfig || slide.buildInConfig,
          slide,
          `bullet:${bIdx}`
        );

        return (
          <motion.div
            key={b.id || `bullet-${bIdx}`}
            layout
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            draggable
            onDragStart={(e) => handleDragStart(e, "bullet", bIdx)}
            onDragOver={(e) => handleDragOver(e, "bullet", bIdx)}
            onDrop={(e) => handleDrop(e, "bullet", bIdx)}
            onDragEnd={handleDragEnd}
            onClick={(e) => handleItemClick(e, "bullet", bIdx)}
            className={`p-4 rounded-xl border flex flex-col relative text-left group transition-all duration-200 cursor-pointer ${buildInState.className} ${
              isSelected
                ? "ring-2 ring-violet-500 bg-violet-500/[0.04] shadow-[0_0_15px_rgba(139,92,246,0.2)] border-violet-500/50"
                : ""
            } ${
              isDragged ? "opacity-35 scale-95" : "hover:scale-[1.01]"
            } ${
              isActiveDrop
                ? snappedCol || snappedRow
                  ? "ring-4 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20 scale-[1.04]"
                  : "ring-4 ring-indigo-500/30 shadow-lg z-10 scale-[1.03]"
                : isValidDropTarget
                ? "border-dashed animate-pulse"
                : ""
            }`}
            style={{
              ...buildInState.style,
              backgroundColor: isActiveDrop
                ? snappedCol || snappedRow
                  ? "rgba(59, 130, 246, 0.12)"
                  : "rgba(99, 102, 241, 0.08)"
                : isValidDropTarget
                ? "rgba(99, 102, 241, 0.03)"
                : isSelected
                ? "rgba(139, 92, 246, 0.06)"
                : theme.cardBg,
              borderColor: isActiveDrop
                ? snappedCol || snappedRow
                  ? "rgb(59, 130, 246)"
                  : "rgb(99, 102, 241)"
                : isValidDropTarget
                ? "rgba(99, 102, 241, 0.6)"
                : isSelected
                ? "rgb(139, 92, 246)"
                : theme.borderColor,
            }}
          >
            {isSelected && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-md z-30">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
              <div className="opacity-0 group-hover:opacity-100 transition duration-150 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <GripVertical className="w-3 h-3" />
              </div>
              <div
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
              >
                Step 0{bIdx + 1}
              </div>
            </div>
            <div className="font-bold text-xs sm:text-sm mt-3.5 mb-1 text-left" style={{ color: theme.accentColor }}>
              {bTitle}
            </div>
            <div className="text-[11px] sm:text-xs opacity-80 leading-relaxed text-left">{bDesc}</div>
          </motion.div>
        );
      })}
    </div>
  );
};
