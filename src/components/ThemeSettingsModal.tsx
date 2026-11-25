import React, { useEffect, useState } from "react";
import { Check, Layers, Palette, Sparkles, UserCheck, X } from "lucide-react";
import { PresentationTheme } from "../types";
import { PRESENTATION_THEMES } from "../data/themes";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import { useAuthContext } from "../context/AuthContext";
import { formatCssFontFamily, loadGoogleFont } from "../utils/googleFonts";
import { isLightBackground } from "../utils/luminosity";

const SEASON_ORDER = [
  "korean-spring",
  "korean-summer",
  "korean-autumn",
  "korean-winter",
  "black-and-white",
];

function getSeasonSubtitle(themeId: string): string {
  switch (themeId) {
    case "korean-spring":
      return "봄 · 벚꽃과 새싹 연두";
    case "korean-summer":
      return "여름 · 동해 바다와 청죽";
    case "korean-autumn":
      return "가을 · 설악 단풍과 은행잎";
    case "korean-winter":
      return "겨울 · 설야와 푸른 서리";
    case "black-and-white":
      return "수묵 · 백과 흑 모노크롬";
    default:
      return "";
  }
}

export const ThemeSettingsModal: React.FC = () => {
  const modalCtx = useModalContext();
  const {
    slides,
    activeSlide,
    activeSlideIndex,
    currentTheme,
    setCurrentTheme,
    setPreviewTheme,
    setSlidesWithHistory,
    triggerToast,
    language,
  } = useSlideContext();
  const { user, isAuthenticated, updateProfile } = useAuthContext();

  const isOpen = modalCtx.isModalOpen("themeSettings");
  const isKo = language === "ko";

  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentTheme.id);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedThemeId(activeSlide?.themeOverride || currentTheme.id);
    for (const t of PRESENTATION_THEMES) {
      if (t.headingFont) loadGoogleFont(t.headingFont);
      if (t.bodyFont) loadGoogleFont(t.bodyFont);
    }
    return () => {
      setPreviewTheme(null);
    };
  }, [isOpen, currentTheme.id, activeSlide?.themeOverride, setPreviewTheme]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPreviewTheme(null);
        modalCtx.closeModal("themeSettings");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, modalCtx, setPreviewTheme]);

  if (!isOpen) return null;

  const seasonalThemes = SEASON_ORDER.map((id) =>
    PRESENTATION_THEMES.find((t) => t.id === id)
  ).filter((t): t is PresentationTheme => Boolean(t));

  const classicThemes = PRESENTATION_THEMES.filter(
    (t) => !SEASON_ORDER.includes(t.id)
  );

  const selectedTheme =
    PRESENTATION_THEMES.find((t) => t.id === selectedThemeId) || currentTheme;

  const handleApplyToWholeDeck = (themeToApply: PresentationTheme) => {
    setPreviewTheme(null);
    setSelectedThemeId(themeToApply.id);
    setCurrentTheme(themeToApply);

    const hasPerSlideOverrides = slides.some(
      (s) => s.themeOverride || s.customBg || s.customAccentColor
    );
    if (hasPerSlideOverrides) {
      const cleaned = slides.map((s) => ({
        ...s,
        themeOverride: undefined,
        customBg: undefined,
        customAccentColor: undefined,
        customAccentSecondary: undefined,
        customBadgeBg: undefined,
        customBadgeText: undefined,
      }));
      setSlidesWithHistory(
        cleaned,
        `테마 적용: ${themeToApply.name}`,
        activeSlideIndex,
        true
      );
    }

    triggerToast(`"${themeToApply.name}" 테마가 전체 슬라이드에 적용되었습니다.`);
  };

  const handleApplyToCurrentSlideOnly = (themeToApply: PresentationTheme) => {
    if (!activeSlide) return;
    setPreviewTheme(null);
    setSelectedThemeId(themeToApply.id);
    const updated = slides.map((s, idx) =>
      idx === activeSlideIndex
        ? {
            ...s,
            themeOverride: themeToApply.id,
            customBg: undefined,
            customAccentColor: undefined,
            customAccentSecondary: undefined,
            customBadgeBg: undefined,
            customBadgeText: undefined,
          }
        : s
    );
    setSlidesWithHistory(
      updated,
      `슬라이드 ${activeSlideIndex + 1} 테마 변경: ${themeToApply.name}`,
      activeSlideIndex,
      true
    );
    triggerToast(
      `슬라이드 #${activeSlideIndex + 1}에 "${themeToApply.name}" 테마가 적용되었습니다.`
    );
  };

  const handleSavePreferredToAccount = async () => {
    if (!isAuthenticated) {
      modalCtx.openModal("auth");
      return;
    }
    const updated = await updateProfile({ preferredThemeId: selectedTheme.id });
    if (updated) {
      triggerToast(`"${selectedTheme.name}" 테마를 내 계정의 기본 테마로 저장했습니다.`);
    }
  };

  const renderThemeCard = (theme: PresentationTheme, isFeaturedSeasonal: boolean) => {
    const isGlobalActive = currentTheme.id === theme.id && !activeSlide?.themeOverride;
    const isSlideOverrideActive = activeSlide?.themeOverride === theme.id;
    const isSelected = selectedThemeId === theme.id;
    const isLight = isLightBackground(theme.canvasBg);
    const headingCss = theme.headingFont
      ? formatCssFontFamily(theme.headingFont, "sans-serif")
      : undefined;
    const bodyCss = theme.bodyFont
      ? formatCssFontFamily(theme.bodyFont, "sans-serif")
      : undefined;
    const motifText = isFeaturedSeasonal
      ? getSeasonSubtitle(theme.id)
      : isLight
      ? "Light Mode"
      : "Dark Mode";

    return (
      <div
        key={theme.id}
        onMouseEnter={() => setPreviewTheme(theme)}
        onMouseLeave={() => setPreviewTheme(null)}
        onClick={() => handleApplyToWholeDeck(theme)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleApplyToWholeDeck(theme);
          }
        }}
        className={`group text-left rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden flex flex-col ${
          isSelected || isGlobalActive || isSlideOverrideActive
            ? "border-blue-500 ring-1 ring-blue-500/40 bg-[#151c2c]"
            : "border-white/[0.08] hover:border-white/25 bg-[#0c1018]"
        }`}
      >
        {/* 16:9 Live Miniature Canvas Preview */}
        <div
          className="w-full aspect-video p-3 flex flex-col justify-between relative overflow-hidden border-b border-white/[0.08]"
          style={{
            backgroundColor: theme.canvasBg,
            backgroundImage: theme.backgroundImage || "none",
            color: theme.textColor,
            fontFamily: bodyCss,
          }}
        >
          {/* Top Accent Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.accentSecondary})`,
            }}
          />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span
              className="text-[10px] font-semibold tracking-tight truncate"
              style={{ color: theme.accentColor }}
            >
              {motifText}
            </span>
            {(isGlobalActive || isSlideOverrideActive) && (
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.accentColor, color: "#ffffff" }}
                title="Active Theme"
              >
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="space-y-1 my-auto">
            <div
              className="text-xs font-bold leading-tight truncate"
              style={{
                color: theme.textColor,
                fontFamily: headingCss,
              }}
            >
              {theme.name.split(" (")[0]}
            </div>
            <div
              className="text-[10px] leading-snug line-clamp-1 opacity-85"
              style={{ color: theme.textMuted }}
            >
              대한민국의 사계절과 여백의 미
            </div>
          </div>

          {/* Mini Cards Strip */}
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className="rounded px-2 py-1 border text-[9px] font-semibold truncate"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              <span style={{ color: theme.accentColor }}>●</span> 주요 지표
            </div>
            <div
              className="rounded px-2 py-1 border text-[9px] font-semibold truncate"
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.borderColor,
                color: theme.badgeText,
              }}
            >
              핵심 요약
            </div>
          </div>
        </div>

        {/* Metadata Area (No pills, clean typographic hierarchy) */}
        <div className="p-3 flex-1 flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-white truncate">
                {theme.name}
              </h3>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {isLight ? "Light" : "Dark"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {theme.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            {/* Palette Swatch Trio */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded border border-white/15"
                style={{ backgroundColor: theme.canvasBg }}
                title="Canvas Background"
              />
              <span
                className="w-3.5 h-3.5 rounded border border-white/15"
                style={{ backgroundColor: theme.accentColor }}
                title="Primary Accent"
              />
              <span
                className="w-3.5 h-3.5 rounded border border-white/15"
                style={{ backgroundColor: theme.accentSecondary }}
                title="Secondary Accent"
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyToCurrentSlideOnly(theme);
              }}
              className="text-[11px] text-slate-300 hover:text-blue-300 font-medium cursor-pointer whitespace-nowrap"
              title="현재 보고 있는 슬라이드에만 적용"
            >
              현재 슬라이드만
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => {
        setPreviewTheme(null);
        modalCtx.closeModal("themeSettings");
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isKo ? "테마 설정" : "Theme Settings"}
        className="bg-[#10141e] border border-white/[0.12] rounded-2xl w-full max-w-5xl max-h-[88vh] shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141925] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Palette className="w-4 h-4 text-sky-400 shrink-0" />
            <h2 className="text-base font-semibold text-white tracking-tight truncate">
              {isKo
                ? "테마 설정 · 한국의 사계 & Black & White"
                : "Theme Settings · Korean Four Seasons & Monochrome"}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPreviewTheme(null);
                modalCtx.closeModal("themeSettings");
                modalCtx.openModal("brandKit");
              }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              브랜드 키트 커스텀
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewTheme(null);
                modalCtx.closeModal("themeSettings");
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              aria-label="Close Theme Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar">
          {/* Section 1: Korean Four Seasons + Black & White */}
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>한국의 사계(봄·여름·가을·겨울) & Black & White</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  카드를 클릭하면 전체 덱에 즉시 적용되며, 마우스를 올리면 실시간 캔버스 미리보기가 동작합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {seasonalThemes.map((t) => renderThemeCard(t, true))}
            </div>
          </section>

          {/* Section 2: Classic Presentation Themes */}
          <section className="space-y-3.5 pt-5 border-t border-white/[0.08]">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>클래식 비즈니스 테마</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                공식 보고서, 외교·산업 협약, 임원 브리핑에 적합한 기본 테마입니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {classicThemes.map((t) => renderThemeCard(t, false))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141925] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded border border-white/20 shrink-0"
              style={{ backgroundColor: selectedTheme.accentColor }}
            />
            <span className="truncate">
              선택된 테마: <strong className="text-white">{selectedTheme.name}</strong>
            </span>
            {activeSlide?.themeOverride && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-sky-300 whitespace-nowrap">
                  슬라이드 #{activeSlideIndex + 1} 개별 테마 적용됨
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSavePreferredToAccount}
              className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isAuthenticated && user
                  ? `${user.displayName} 계정에 기본 테마 저장`
                  : "로그인 후 내 계정에 저장"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyToWholeDeck(selectedTheme)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>전체 슬라이드 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
