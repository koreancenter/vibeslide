import React, { useState, useEffect } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PRESENTATION_THEMES } from "../data/themes";
import { fetchAiThemeRecommendation } from "../utils/api";
import { PresentationTheme, SlideData } from "../types";

interface ThemeRecommendation {
  themeId: string;
  score: number;
  fitDescriptionKo: string;
}

interface RecommendationAnalysis {
  recommendedThemeId: string;
  rationaleKo: string;
  themeRecommendations: ThemeRecommendation[];
}

interface AiThemeRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlide: SlideData | null;
  currentTheme: PresentationTheme;
  onThemeChange: (theme: PresentationTheme) => void;
}

export const AiThemeRecommenderModal: React.FC<AiThemeRecommenderModalProps> = ({
  isOpen,
  onClose,
  activeSlide,
  currentTheme,
  onThemeChange,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RecommendationAnalysis | null>(null);
  const [originalTheme, setOriginalTheme] = useState<PresentationTheme>(currentTheme);
  const [activePreviewId, setActivePreviewId] = useState<string>(currentTheme.id);

  useEffect(() => {
    if (isOpen) {
      setOriginalTheme(currentTheme);
      setActivePreviewId(currentTheme.id);
      setAnalysis(null);
      triggerAnalysis();
    }
  }, [isOpen, activeSlide?.id]);

  const triggerAnalysis = async () => {
    if (!activeSlide) return;
    setIsAnalyzing(true);
    try {
      const result = await fetchAiThemeRecommendation(activeSlide, PRESENTATION_THEMES);
      setAnalysis(result);

      if (result && result.recommendedThemeId) {
        const recommended = PRESENTATION_THEMES.find((t) => t.id === result.recommendedThemeId);
        if (recommended) {
          onThemeChange(recommended);
          setActivePreviewId(recommended.id);
        }
      }
    } catch (err) {
      console.error("Theme recommendation analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectThemeForPreview = (themeId: string) => {
    const selected = PRESENTATION_THEMES.find((t) => t.id === themeId);
    if (selected) {
      onThemeChange(selected);
      setActivePreviewId(themeId);
    }
  };

  const handleCancelAndRestore = () => {
    onThemeChange(originalTheme);
    onClose();
  };

  const handleApplyToEntirePresentation = () => {
    onClose();
  };

  const handleApplyAsSlideOverride = () => {
    if (activeSlide) {
      activeSlide.themeOverride = activePreviewId;
    }
    onThemeChange(originalTheme);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleCancelAndRestore}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="w-full max-w-xl bg-[#101520] border border-sky-400/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 relative z-10 max-h-[90vh] font-sans"
          >
            {/* Header: No left icon, no subtitle, no badges */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
              <h3 className="font-semibold text-sm text-white tracking-tight">
                디자인 테마 추천
              </h3>
              <button
                type="button"
                onClick={handleCancelAndRestore}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (No box-in-box) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {activeSlide && (
                <div className="pb-3 border-b border-white/[0.08] text-xs text-slate-300 truncate">
                  슬라이드 {activeSlide.slideNumber} · {activeSlide.titleKo || "제목 없음"}
                </div>
              )}

              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                  <p className="text-xs font-medium text-slate-300">슬라이드 맥락 분석 중...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-5">
                  <div className="pb-4 border-b border-white/[0.08]">
                    <div className="text-xs font-medium text-sky-300 mb-1.5">추천 의견</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysis.rationaleKo}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-sky-300">
                      추천 테마 목록
                    </label>

                    <div className="divide-y divide-white/[0.06]">
                      {PRESENTATION_THEMES.map((theme) => {
                        const recInfo = analysis.themeRecommendations.find(
                          (r) => r.themeId === theme.id
                        );
                        const score = recInfo?.score || 60;
                        const desc = recInfo?.fitDescriptionKo || theme.description;
                        const isSelected = activePreviewId === theme.id;

                        return (
                          <button
                            type="button"
                            key={theme.id}
                            onClick={() => handleSelectThemeForPreview(theme.id)}
                            className={`w-full py-3 px-2.5 rounded-lg text-left transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-sky-500/15 text-white"
                                : "hover:bg-white/[0.04] text-slate-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3 truncate max-w-[78%]">
                              <div className="flex items-center space-x-1 shrink-0">
                                <span
                                  className="w-3 h-3 rounded-sm border border-white/10"
                                  style={{ backgroundColor: theme.canvasBg }}
                                />
                                <span
                                  className="w-3 h-3 rounded-sm border border-white/10"
                                  style={{ backgroundColor: theme.accentColor }}
                                />
                                <span
                                  className="w-3 h-3 rounded-sm border border-white/10"
                                  style={{ backgroundColor: theme.accentSecondary }}
                                />
                              </div>

                              <div className="truncate">
                                <div className="text-xs font-medium text-white truncate">
                                  {theme.name}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {desc}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-xs font-mono text-sky-300 tabular-nums">
                                {score}점
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <p className="text-xs text-slate-300">추천 내역을 불러오지 못했습니다.</p>
                  <button
                    type="button"
                    onClick={triggerAnalysis}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-xs font-semibold text-slate-950 transition cursor-pointer"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelAndRestore}
                className="px-3.5 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-slate-300 transition cursor-pointer"
              >
                취소 및 복원
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleApplyAsSlideOverride}
                  disabled={isAnalyzing}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-xs font-medium text-slate-200 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  현재 슬라이드만 적용
                </button>
                <button
                  type="button"
                  onClick={handleApplyToEntirePresentation}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>전체 적용</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
