import React from "react";
import { motion } from "motion/react";
import { Check, GripVertical } from "lucide-react";
import { CommonLayoutProps } from "./layoutTypes";
import { getBuildInItemState } from "../../../utils/componentAnimation";

export const KeyStatsLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {(slide.stats || []).slice(0, 4).map((st: any, sIdx: number) => {
        const isDragged = draggedType === "stat" && draggedIndex === sIdx;
        const isActiveDrop = dragOverIndex === sIdx && draggedIndex !== sIdx && draggedType === "stat";
        const isValidDropTarget = draggedType === "stat" && draggedIndex !== sIdx;
        const isSelected = selectedType === "stat" && selectedIndices.includes(sIdx);
        const buildInState = getBuildInItemState(
          sIdx,
          buildInStep,
          buildInConfig || slide.buildInConfig,
          slide,
          `stat:${sIdx}`
        );

        return (
          <motion.div
            key={`stat-${st.value}-${st.labelKo || sIdx}`}
            layout
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            draggable
            onDragStart={(e) => handleDragStart(e, "stat", sIdx)}
            onDragOver={(e) => handleDragOver(e, "stat", sIdx)}
            onDrop={(e) => handleDrop(e, "stat", sIdx)}
            onDragEnd={handleDragEnd}
            onClick={(e) => handleItemClick(e, "stat", sIdx)}
            className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm text-left relative group transition-all duration-200 cursor-pointer ${buildInState.className} ${
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
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-150 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: theme.accentColor }}>
              {st.value}
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase mt-1 opacity-90">
                {getText(st.labelKo, st.labelId)}
              </div>
              {st.subKo && (
                <div className="text-[10px] opacity-75 mt-0.5">
                  {getText(st.subKo, st.subId)}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
