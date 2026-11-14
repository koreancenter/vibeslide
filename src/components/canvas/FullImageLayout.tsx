import React from "react";
import { SlideData, PresentationTheme } from "../../types";
import { InlineEditableText } from "../InlineEditableText";
import { Camera } from "lucide-react";

interface FullImageLayoutProps {
  slide: SlideData;
  theme: PresentationTheme;
  totalSlides: number;
  currentSlideIndex: number;
  currentTitle: string;
  currentSubtitle: string;
  onTitleChange: (val: string) => void;
  onSubtitleChange: (val: string) => void;
  onImageChange: () => void;
  highlightedField?: string | null;
  onCanvasElementClick?: (field: string) => void;
  getRawText: (ko?: string, id?: string) => string;
  getText: (ko?: string, id?: string) => string;
}

export const FullImageLayout: React.FC<FullImageLayoutProps> = ({
  slide,
  theme,
  totalSlides,
  currentSlideIndex,
  currentTitle,
  currentSubtitle,
  onTitleChange,
  onSubtitleChange,
  onImageChange,
  highlightedField,
  onCanvasElementClick,
  getRawText,
  getText,
}) => {
  return (
    <div
      className={`w-full aspect-video rounded-xl relative overflow-hidden shadow-2xl select-text flex flex-col justify-between p-6 sm:p-8 border transition-all duration-300 ${
        highlightedField === "image"
          ? "ring-4 ring-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.5)] scale-[0.99]"
          : ""
      }`}
      style={{
        borderColor: theme.borderColor,
        backgroundColor: theme.canvasBg,
        color: "#ffffff",
      }}
      onClick={() => onCanvasElementClick?.("image")}
    >
      {/* Background Image */}
      <img
        src={
          slide.image?.url ||
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"
        }
        alt="Hero Visual"
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      {/* Dark gradient overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between pb-3 border-b border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-xs font-bold tracking-wide uppercase text-white/90">
            {getRawText(slide.categoryKo, slide.categoryId) || "Featured Visual"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="btn-change-image-full"
            onClick={(e) => {
              e.stopPropagation();
              onImageChange();
            }}
            className="p-2 rounded bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/30 backdrop-blur-sm transition cursor-pointer"
            title="Change Image"
            aria-label="Change Image"
          >
            <Camera className="w-4 h-4" />
          </button>
          <div className="text-xs font-mono px-2 py-1 rounded bg-black/60 border border-white/20 text-white/80">
            {currentSlideIndex + 1} / {totalSlides}
          </div>
        </div>
      </div>

      {/* Bottom Card */}
      <div
        className="relative z-10 mt-auto max-w-2xl bg-black/60 backdrop-blur-sm p-5 rounded-lg border border-white/20"
        onClick={(e) => e.stopPropagation()}
        data-collision-zone="static"
      >
        <div
          className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer ${
            highlightedField === "title"
              ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
              : "hover:bg-white/[0.06]"
          }`}
          onClick={() => onCanvasElementClick?.("title")}
        >
          <InlineEditableText
            value={currentTitle}
            onChange={onTitleChange}
            tag="h2"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2"
            placeholder="Enter slide title..."
            fieldType="title"
          />
        </div>
        <div
          className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer mt-2 ${
            highlightedField === "subtitle"
              ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
              : "hover:bg-white/[0.06]"
          }`}
          onClick={() => onCanvasElementClick?.("subtitle")}
        >
          <InlineEditableText
            value={currentSubtitle}
            onChange={onSubtitleChange}
            tag="p"
            className="text-xs sm:text-sm text-gray-200 leading-relaxed"
            placeholder="Enter visual narrative or subtitle..."
            fieldType="subtitle"
          />
        </div>
        {slide.image?.captionKo && (
          <div className="mt-3 text-[11px] text-blue-300 font-mono flex items-center space-x-1.5">
            <span>✦</span>
            <span>{getText(slide.image.captionKo, slide.image.captionId)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/20 text-[11px] text-white/70">
        <span>{slide.docCode || "VISUAL-2026"}</span>
        <span>Official Strategic Presentation</span>
      </div>
    </div>
  );
};
