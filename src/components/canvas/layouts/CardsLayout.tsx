import React from "react";
import { motion } from "motion/react";
import { Check, GripVertical, Camera } from "lucide-react";
import { InlineEditableText } from "../../InlineEditableText";
import { isSafeImageUrl } from "../../../utils/security";
import { CommonLayoutProps } from "./layoutTypes";
import { getBuildInItemState } from "../../../utils/componentAnimation";

export const CardsLayout: React.FC<CommonLayoutProps> = ({
  slide,
  theme,
  language,
  getText,
  getRawText,
  highlightedField,
  onCanvasElementClick,
  onBulletTitleChange,
  onBulletDescChange,
  onImageChange,
  cleanBullets,
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
  if (cleanBullets.length > 0) {
    return (
      <div
        className={`grid gap-3 ${
          slide.layout === "cards-2"
            ? "grid-cols-1 sm:grid-cols-2"
            : slide.layout === "general"
            ? "grid-cols-1 max-w-3xl mx-auto w-full"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {cleanBullets.map((b, idx) => {
          const bulletTitle = b.titleJa && language === "ja" ? b.titleJa : getText(b.titleKo, b.titleId);
          const bulletDesc = b.descJa && language === "ja" ? b.descJa : getText(b.descKo, b.descId);
          const originalIdx = slide.bullets ? slide.bullets.indexOf(b) : idx;
          const isDragged = draggedType === "bullet" && draggedIndex === originalIdx;
          const isActiveDrop = dragOverIndex === originalIdx && draggedIndex !== originalIdx && draggedType === "bullet";
          const isValidDropTarget = draggedType === "bullet" && draggedIndex !== originalIdx;
          const isSelected = selectedType === "bullet" && selectedIndices.includes(originalIdx);
          const buildInState = getBuildInItemState(idx, buildInStep, buildInConfig || slide.buildInConfig);

          return (
            <motion.div
              key={b.id || `bullet-${idx}`}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              draggable
              onDragStart={(e) => handleDragStart(e, "bullet", originalIdx)}
              onDragOver={(e) => handleDragOver(e, "bullet", originalIdx)}
              onDrop={(e) => handleDrop(e, "bullet", originalIdx)}
              onDragEnd={handleDragEnd}
              onClick={(e) => handleItemClick(e, "bullet", originalIdx)}
              className={`p-3.5 rounded-lg border flex flex-row items-start cursor-pointer relative group transition-all duration-200 ${buildInState.className} ${
                isSelected
                  ? "ring-2 ring-violet-500 bg-violet-500/[0.04] shadow-[0_0_15px_rgba(139,92,246,0.2)] border-violet-500/50"
                  : highlightedField === `bullets-${originalIdx}`
                  ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
                  : "hover:bg-white/[0.03]"
              } ${isDragged ? "opacity-35 scale-95" : "hover:scale-[1.01]"} ${
                isActiveDrop
                  ? snappedCol || snappedRow
                    ? "ring-4 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20 scale-[1.04]"
                    : "ring-4 ring-indigo-500/30 shadow-md z-10 scale-[1.02]"
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
              <div className="mr-2 mt-0.5 opacity-0 group-hover:opacity-100 transition duration-150 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <div
                className="flex-1 min-w-0 text-left"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {bulletTitle && (
                  <InlineEditableText
                    value={bulletTitle}
                    onChange={(val) => onBulletTitleChange(originalIdx, val)}
                    tag="div"
                    className="font-semibold text-xs sm:text-sm mb-1 text-left"
                    placeholder="Card title"
                    fieldType="bullet-title"
                    fieldIndex={originalIdx}
                  />
                )}
                {bulletDesc && (
                  <InlineEditableText
                    value={bulletDesc}
                    onChange={(val) => onBulletDescChange(originalIdx, val)}
                    tag="div"
                    className="text-xs opacity-80 leading-relaxed text-left"
                    placeholder="Card description"
                    fieldType="bullet-desc"
                    fieldIndex={originalIdx}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (slide.calloutKo || slide.notesKo) {
    return (
      <div className="flex flex-col justify-center space-y-3 max-w-3xl mx-auto w-full py-2">
        {slide.calloutKo && (
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs sm:text-sm leading-relaxed text-blue-100">
            {getRawText(slide.calloutKo, slide.calloutId)}
          </div>
        )}
        {slide.notesKo && (
          <div className="text-xs sm:text-sm leading-relaxed opacity-85 whitespace-pre-line px-1">
            {getRawText(slide.notesKo, slide.notesId)}
          </div>
        )}
      </div>
    );
  }

  if (slide.image && isSafeImageUrl(slide.image.url)) {
    return (
      <div
        className={`relative group w-full h-full min-h-[160px] rounded-xl overflow-hidden border shadow-md flex items-end p-3 cursor-pointer transition-all duration-150 ${
          highlightedField === "image" ? "ring-2 ring-blue-500/90" : ""
        }`}
        style={{ borderColor: theme.borderColor }}
        onClick={() => onCanvasElementClick?.("image")}
        data-collision-zone="static"
      >
        <img
          src={slide.image.url}
          alt="Visual Asset"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20">
          <button
            id="btn-change-image-card"
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
        <div className="relative z-10 text-white text-xs font-semibold">
          {getText(slide.image.captionKo, slide.image.captionId)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full min-h-[160px] flex items-center justify-center text-center opacity-60 text-xs border-2 border-dashed rounded-xl cursor-text transition-colors hover:bg-white/5"
      style={{ borderColor: theme.borderColor, color: theme.textColor }}
    >
      Click to enter content or use markdown editor.
    </div>
  );
};
