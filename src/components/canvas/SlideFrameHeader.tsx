import React from "react";
import { SlideData, PresentationTheme } from "../../types";
import { Camera } from "lucide-react";

interface SlideFrameHeaderProps {
  slide: SlideData;
  theme: PresentationTheme;
  totalSlides: number;
  currentSlideIndex: number;
  onImageChange: () => void;
  getRawText: (ko?: string, id?: string) => string;
}

export const SlideFrameHeader: React.FC<SlideFrameHeaderProps> = ({
  slide,
  theme,
  totalSlides,
  currentSlideIndex,
  onImageChange,
  getRawText,
}) => {
  const logoUrl = slide.brandWatermark?.logoUrl ?? theme.brandLogoUrl;
  const logoPos = slide.brandWatermark?.logoPosition ?? theme.brandLogoPosition ?? "top-right";
  const hasTopLeftLogo = Boolean(logoUrl && logoPos === "top-left");

  return (
    <div
      className="flex items-center justify-between pb-3 border-b"
      style={{ borderColor: theme.borderColor }}
    >
      <div className={`flex items-center space-x-2 ${hasTopLeftLogo ? "pl-28 sm:pl-32" : ""}`}>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.accentColor }}
        />
        <span
          className="text-xs font-bold tracking-wide uppercase opacity-80"
          style={{ color: theme.textMuted }}
        >
          {getRawText(slide.categoryKo, slide.categoryId)}
        </span>
      </div>
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          id="btn-open-canvas-image-tool"
          onClick={onImageChange}
          className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          title="Visual Asset Studio"
          aria-label="Visual Asset Studio"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
        <div
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: theme.cardBg, color: theme.textMuted }}
        >
          {currentSlideIndex + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
};
