import React from "react";
import { SlideData, PresentationTheme, Language } from "../../types";
import { InlineEditableText } from "../InlineEditableText";
import { ShieldCheck } from "lucide-react";

interface CoverLayoutProps {
  slide: SlideData;
  theme: PresentationTheme;
  totalSlides: number;
  currentSlideIndex: number;
  currentTitle: string;
  currentSubtitle: string;
  onTitleChange: (val: string) => void;
  onSubtitleChange: (val: string) => void;
  highlightedField?: string | null;
  onCanvasElementClick?: (field: string) => void;
  getRawText: (ko?: string, id?: string) => string;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const CoverLayout: React.FC<CoverLayoutProps> = ({
  slide,
  theme,
  totalSlides,
  currentSlideIndex,
  currentTitle,
  currentSubtitle,
  onTitleChange,
  onSubtitleChange,
  highlightedField,
  onCanvasElementClick,
  getRawText,
  language = "en",
  onLanguageChange,
}) => {
  const logoUrl = slide.brandWatermark?.logoUrl ?? theme.brandLogoUrl;
  const logoPos = slide.brandWatermark?.logoPosition ?? theme.brandLogoPosition ?? "top-right";
  const hideOnTitle =
    Boolean(slide.brandWatermark?.hideOnTitleSlide) ||
    Boolean(theme.hideLogoOnTitleSlide) ||
    logoPos === "hidden-on-title";
  const hasTopLeftLogo = Boolean(logoUrl && !hideOnTitle && logoPos === "top-left");

  return (
    <div
      className="w-full aspect-video rounded-xl p-8 sm:p-12 flex flex-col justify-center relative overflow-hidden shadow-2xl select-text"
      style={{
        backgroundColor: theme.canvasBg,
        color: theme.textColor,
        borderColor: theme.borderColor,
        borderWidth: 1,
      }}
    >
      <div className="flex items-center justify-between z-10">
        <div className={`flex items-center space-x-2 ${hasTopLeftLogo ? "pl-28 sm:pl-32" : ""}`}>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5"
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.badgeText,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {slide.docCode || "KC-2026-KIND-001"}
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: theme.cardBg,
              color: theme.textMuted,
              border: `1px solid ${theme.borderColor}`,
            }}
          >
            {getRawText(slide.tagKo, slide.tagId)}
          </span>
        </div>

        {/* Intro Screen Language Selector */}
        <div className="flex items-center space-x-3 z-20">
          <div
            className="flex items-center p-0.5 rounded-lg border backdrop-blur-md shadow-sm select-none"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
          >
            <button
              type="button"
              id="intro-lang-en"
              onClick={(e) => {
                e.stopPropagation();
                onLanguageChange?.("en");
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer font-medium ${
                language === "en"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="English"
              aria-label="Select English"
            >
              English
            </button>
            <button
              type="button"
              id="intro-lang-ko"
              onClick={(e) => {
                e.stopPropagation();
                onLanguageChange?.("ko");
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer font-medium ${
                language === "ko"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="한국어"
              aria-label="한국어 선택"
            >
              한국어
            </button>
            <button
              type="button"
              id="intro-lang-ja"
              onClick={(e) => {
                e.stopPropagation();
                onLanguageChange?.("ja");
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer font-medium ${
                language === "ja"
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="日本語"
              aria-label="日本語を選択"
            >
              日本語
            </button>
          </div>
        </div>
      </div>

      <div className="my-auto z-10 max-w-4xl">
        <div className="inline-block mb-3">
          <span
            className="text-xs font-extrabold px-3 py-1 rounded tracking-widest uppercase text-white shadow-sm"
            style={{ backgroundColor: theme.accentColor }}
          >
            Official Master Execution Plan
          </span>
        </div>
        <div
          className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer ${
            highlightedField === "title"
              ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
              : "hover:bg-white/[0.04]"
          }`}
          onClick={() => onCanvasElementClick?.("title")}
          data-collision-zone="static"
        >
          <InlineEditableText
            value={currentTitle}
            onChange={onTitleChange}
            tag="h1"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4"
            placeholder="Enter slide title..."
            fieldType="title"
          />
        </div>
        <div
          className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer mt-2 ${
            highlightedField === "subtitle"
              ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
              : "hover:bg-white/[0.04]"
          }`}
          onClick={() => onCanvasElementClick?.("subtitle")}
          data-collision-zone="static"
        >
          <InlineEditableText
            value={currentSubtitle}
            onChange={onSubtitleChange}
            tag="div"
            className="text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-3xl opacity-90"
            placeholder="Enter subtitle or executive summary..."
            fieldType="subtitle"
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between pt-4 border-t z-10 text-xs font-medium"
        style={{ borderColor: theme.borderColor, color: theme.textMuted }}
      >
        <div>{getRawText(slide.categoryKo, slide.categoryId)}</div>
        <div className="font-mono">
          {currentSlideIndex + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
};
