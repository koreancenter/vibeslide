import React from "react";
import { SlideData, Language, PresentationTheme } from "../types";
import { SlideCanvas } from "./SlideCanvas";

interface PrintViewProps {
  slides: SlideData[];
  language: Language;
  theme: PresentationTheme;
}

export const PrintView: React.FC<PrintViewProps> = ({
  slides,
  language,
  theme,
}) => {
  return (
    <div className="print-only hidden">
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className="w-[100vw] h-[100vh] flex items-center justify-center p-8 page-break-after-always"
          style={{
            pageBreakAfter: "always",
            breakAfter: "page",
          }}
        >
          <div className="w-full aspect-video max-w-6xl shadow-none">
            <SlideCanvas
              slide={slide}
              language={language}
              theme={theme}
              totalSlides={slides.length}
              currentSlideIndex={idx}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
