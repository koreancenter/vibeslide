import React from "react";
import { motion } from "motion/react";
import { Check, GripVertical, Camera } from "lucide-react";
import { InlineEditableText } from "../../InlineEditableText";
import { CommonLayoutProps } from "./layoutTypes";
import { getBuildInItemState } from "../../../utils/componentAnimation";

export const SplitInfoLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
  language,
  getText,
  buildInStep,
  buildInConfig,
  highlightedField,
  onCanvasElementClick,
  onBulletTitleChange,
  onBulletDescChange,
  onImageChange,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full items-center">
      <div className="flex flex-col justify-center space-y-2.5 overflow-y-auto">
        {slide.bullets && slide.bullets.length > 0 ? (
          slide.bullets.map((b, idx) => {
            const bulletTitle = b.titleJa && language === "ja" ? b.titleJa : getText(b.titleKo, b.titleId);
            const bulletDesc = b.descJa && language === "ja" ? b.descJa : getText(b.descKo, b.descId);
            const isSelected = selectedType === "bullet" && selectedIndices.includes(idx);
            const buildInState = getBuildInItemState(idx, buildInStep, buildInConfig || slide.buildInConfig);

            return (
              <motion.div
                key={b.id || `bullet-${idx}`}
                layout
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                draggable
                onDragStart={(e) => handleDragStart(e, "bullet", idx)}
                onDragOver={(e) => handleDragOver(e, "bullet", idx)}
                onDrop={(e) => handleDrop(e, "bullet", idx)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleItemClick(e, "bullet", idx)}
                className={`p-3 rounded-lg border cursor-pointer relative group flex items-start transition-all duration-200 ${buildInState.className} ${
                  isSelected
                    ? "ring-2 ring-violet-500 bg-violet-500/[0.04] shadow-[0_0_15px_rgba(139,92,246,0.2)] border-violet-500/50"
                    : highlightedField === `bullets-${idx}`
                    ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
                    : "hover:bg-white/[0.03]"
                } ${
                  draggedType === "bullet" && draggedIndex === idx
                    ? "opacity-35 scale-95"
                    : "hover:scale-[1.01]"
                } ${
                  dragOverIndex === idx && draggedIndex !== idx && draggedType === "bullet"
                    ? snappedCol || snappedRow
                      ? "ring-4 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20 scale-[1.04]"
                      : "ring-4 ring-indigo-500/30 shadow-md z-10 scale-[1.02]"
                    : draggedType === "bullet" && draggedIndex !== idx
                    ? "border-dashed animate-pulse"
                    : ""
                }`}
                style={{
                  ...buildInState.style,
                  backgroundColor:
                    dragOverIndex === idx && draggedIndex !== idx && draggedType === "bullet"
                      ? snappedCol || snappedRow
                        ? "rgba(59, 130, 246, 0.12)"
                        : "rgba(99, 102, 241, 0.08)"
                      : draggedType === "bullet" && draggedIndex !== idx
                      ? "rgba(99, 102, 241, 0.03)"
                      : isSelected
                      ? "rgba(139, 92, 246, 0.06)"
                      : theme.cardBg,
                  borderColor:
                    dragOverIndex === idx && draggedIndex !== idx && draggedType === "bullet"
                      ? snappedCol || snappedRow
                        ? "rgb(59, 130, 246)"
                        : "rgb(99, 102, 241)"
                      : draggedType === "bullet" && draggedIndex !== idx
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
                <div className="mr-2 mt-0.5 opacity-0 group-hover:opacity-100 transition duration-150 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center shrink-0">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div
                  className="flex-1 min-w-0 text-left"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InlineEditableText
                    value={bulletTitle}
                    onChange={(val) => onBulletTitleChange(idx, val)}
                    tag="div"
                    className="font-semibold text-xs sm:text-sm mb-0.5 text-left"
                    placeholder="Key point"
                    fieldType="bullet-title"
                    fieldIndex={idx}
                  />
                  <InlineEditableText
                    value={bulletDesc}
                    onChange={(val) => onBulletDescChange(idx, val)}
                    tag="div"
                    className="text-xs opacity-80 leading-relaxed text-left"
                    placeholder="Point details..."
                    fieldType="bullet-desc"
                    fieldIndex={idx}
                  />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-xs opacity-70 italic">Add bullet points or description in the editor...</div>
        )}
      </div>

      {/* Right Column: Visual Image Asset */}
      <div
        className={`relative group w-full h-full min-h-[160px] rounded-xl overflow-hidden border shadow-md flex items-end p-3 cursor-pointer transition-all duration-150 ${
          highlightedField === "image" ? "ring-2 ring-blue-500/90" : ""
        }`}
        style={{ borderColor: theme.borderColor }}
        onClick={() => onCanvasElementClick?.("image")}
        data-collision-zone="static"
      >
        <img
          src={
            slide.image?.url ||
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
          }
          alt="Split Asset"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20">
          <button
            id="btn-change-image-split"
            onClick={(e) => {
              e.stopPropagation();
              onImageChange();
            }}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition flex items-center justify-center cursor-pointer"
            title="Change Image"
            aria-label="Change Image"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="relative z-10 text-white text-xs font-medium truncate">
          {slide.image?.captionKo ? getText(slide.image.captionKo, slide.image.captionId) : "Visual Documentation"}
        </div>
      </div>
    </div>
  );
};
