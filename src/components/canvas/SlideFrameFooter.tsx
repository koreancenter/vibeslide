import React from "react";
import { SlideData, PresentationTheme } from "../../types";

interface SlideFrameFooterProps {
  slide: SlideData;
  theme: PresentationTheme;
}

export const SlideFrameFooter: React.FC<SlideFrameFooterProps> = ({ slide, theme }) => {
  return (
    <div
      className="flex items-center justify-between pt-2 border-t text-[11px]"
      style={{ borderColor: theme.borderColor, color: theme.textMuted }}
    >
      <span>{slide.docCode || "KIND-2026"}</span>
      <span>Official Strategic Presentation</span>
    </div>
  );
};
