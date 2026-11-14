import React, { useState } from "react";
import { SlideData, SlideLayout, SlideTransition } from "../../types";
import { slidesToMarkdown, parseMarkdownToSlides } from "../../utils/markdownParser";
import { analyzeSlideLayout } from "../../utils/autoLayout";
import { recommendTransition } from "../../utils/smartTransition";
import { extractColorsFromImageUrl, ExtractedPalette } from "../../utils/colorExtractor";
import { PRESENTATION_TEMPLATES } from "../../data/templates";
import {
  SLIDE_LAYOUT_OPTIONS,
  SLIDE_TRANSITION_OPTIONS,
  renderLayoutMiniWireframe,
  renderTemplateMiniWireframe,
} from "./wireframeHelpers";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutTemplate,
  Layers,
  BarChart3,
  Table,
  Palette,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Wand2,
  RefreshCw,
  Check,
  RotateCcw,
  Camera,
  Film,
} from "lucide-react";

interface StyleInspectorPaneProps {
  slide: SlideData;
  slides: SlideData[];
  activeSlideIndex: number;
  theme?: any;
  language: "ko" | "id";
  onUpdateSlide?: (updatedSlide: SlideData, pushHistory?: boolean, actionName?: string) => void;
  onUpdateAllSlides?: (slides: SlideData[]) => void;
  onUpdateTheme?: (theme: any) => void;
  onHoverTransition?: (transition: SlideTransition | null) => void;
  onSelectTemplate?: (templateSlides: SlideData[], templateName?: string) => void;
  onSyncMarkdownToSlides?: (slides: SlideData[]) => void;
}

export const StyleInspectorPane: React.FC<StyleInspectorPaneProps> = ({
  slide,
  slides,
  activeSlideIndex,
  theme,
  language,
  onUpdateSlide,
  onUpdateAllSlides,
  onUpdateTheme,
  onHoverTransition,
  onSelectTemplate,
  onSyncMarkdownToSlides,
}) => {
  const [openSection, setOpenSection] = useState<"templates" | "layout" | "charts" | "tables" | "palette" | "animation" | null>("layout");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [palette, setPalette] = useState<ExtractedPalette | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const currentLayout = slide?.layout || "general";
  const prevSlide = activeSlideIndex > 0 ? slides[activeSlideIndex - 1] : null;
  const recommendation = recommendTransition(prevSlide, slide);

  const handleLayoutChange = (newLayout: SlideLayout) => {
    if (onUpdateSlide && slide) {
      onUpdateSlide(
        {
          ...slide,
          layout: newLayout,
        },
        true,
        `Change Layout to ${newLayout}`
      );
    }
  };

  const handleAutoSelectLayout = () => {
    const analysis = analyzeSlideLayout(slide);
    if (analysis && analysis.recommendedLayout) {
      handleLayoutChange(analysis.recommendedLayout);
    }
  };

  const handleInsertTemplate = (templateMd: string, recommendedLayout: SlideLayout) => {
    const text = slidesToMarkdown(slides);
    const slideBlocks = text.split(/(?:^|\n)\s*---\s*(?:\n|$)/);
    slideBlocks[activeSlideIndex] = templateMd.trim();
    const newMarkdown = slideBlocks.join("\n\n---\n\n");

    const parsed = parseMarkdownToSlides(newMarkdown);
    const updatedSlides = slides.map((s, idx) => {
      if (idx === activeSlideIndex) {
        const p = parsed[idx] || {};
        return {
          ...s,
          ...p,
          layout: recommendedLayout,
          id: s.id,
        } as SlideData;
      }
      return s;
    });

    if (onUpdateAllSlides) {
      onUpdateAllSlides(updatedSlides);
    } else if (onSyncMarkdownToSlides) {
      onSyncMarkdownToSlides(updatedSlides);
    }
  };

  const handleTransitionChange = (newTransition: SlideTransition) => {
    if (onUpdateSlide) {
      onUpdateSlide(
        { ...slide, transition: newTransition },
        true,
        `Change Transition to ${newTransition}`
      );
    }
  };

  const handleExtractPalette = async () => {
    if (!slide?.image?.url) return;
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const extracted = await extractColorsFromImageUrl(slide.image.url);
      setPalette(extracted);
    } catch (err: any) {
      console.error(err);
      setExtractionError("이미지 색상을 추출하는 과정에서 오류가 발생했습니다. CORS 제한 또는 파일 형식을 확인해 주세요.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyAccentsToSlide = () => {
    if (!palette || !onUpdateSlide || !slide) return;
    onUpdateSlide(
      {
        ...slide,
        customAccentColor: palette.suggestedAccents.accentColor,
        customAccentSecondary: palette.suggestedAccents.accentSecondary,
        customBadgeBg: palette.suggestedAccents.badgeBg,
        customBadgeText: palette.suggestedAccents.badgeText,
      },
      true,
      "Apply custom extracted accent colors to slide"
    );
  };

  const handleApplyAccentsGlobally = () => {
    if (!palette || !theme || !onUpdateTheme) return;
    onUpdateTheme({
      ...theme,
      accentColor: palette.suggestedAccents.accentColor,
      accentSecondary: palette.suggestedAccents.accentSecondary,
      badgeBg: palette.suggestedAccents.badgeBg,
      badgeText: palette.suggestedAccents.badgeText,
      borderHighlight: palette.suggestedAccents.accentColor,
    });
  };

  const handleResetAccents = () => {
    if (!onUpdateSlide || !slide) return;
    onUpdateSlide(
      {
        ...slide,
        customAccentColor: undefined,
        customAccentSecondary: undefined,
        customBadgeBg: undefined,
        customBadgeText: undefined,
        customBg: undefined,
      },
      true,
      "Reset slide styles"
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0e1117] select-none">
      {/* 0. TEMPLATE PRESETS GALLERY ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "templates" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "templates" ? null : "templates"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <LayoutTemplate className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">템플릿 갤러리</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "templates" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "templates" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
                    <span>추천 프레젠테이션 프리셋</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-0.5">
                    {PRESENTATION_TEMPLATES.map((tmpl, index) => {
                      const isSelected = selectedTemplateId === tmpl.id;
                      return (
                        <div key={tmpl.id} className="relative group flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id);
                              if (onSelectTemplate) {
                                onSelectTemplate(tmpl.slides, tmpl.nameKo);
                              } else if (onUpdateAllSlides) {
                                onUpdateAllSlides(tmpl.slides);
                              }
                            }}
                            className={`p-1 rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                              isSelected
                                ? "bg-indigo-500/20 border-indigo-400 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                : "bg-transparent border-[#2d2d2d] text-neutral-400 hover:border-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/5"
                            }`}
                          >
                            {renderTemplateMiniWireframe(tmpl.id)}
                          </button>

                          <span className="text-[9.5px] text-neutral-400 group-hover:text-indigo-300 mt-1 truncate max-w-[58px] text-center font-medium leading-tight">
                            {tmpl.nameKo.split(" (")[0]}
                          </span>

                          <div
                            className={`absolute top-full mt-1.5 hidden group-hover:flex flex-col z-50 pointer-events-none ${
                              index % 4 === 0
                                ? "left-0 items-start"
                                : index % 4 === 3
                                ? "right-0 items-end"
                                : "left-1/2 -translate-x-1/2 items-center"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 bg-[#1b1b1d] border-l border-t border-neutral-700/80 rotate-45 translate-y-[4px] z-10 ${
                                index % 4 === 0
                                  ? "ml-6"
                                  : index % 4 === 3
                                  ? "mr-6"
                                  : ""
                              }`}
                            />
                            <div className="w-56 p-2.5 bg-[#1b1b1d] text-neutral-100 rounded-lg border border-neutral-700/80 shadow-2xl backdrop-blur-md relative z-0">
                              <div className="flex items-center justify-between gap-1.5 border-b border-neutral-800 pb-1.5 mb-1.5">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    tmpl.id === "project-proposal" ? "bg-indigo-400" :
                                    tmpl.id === "quarterly-report" ? "bg-amber-400" :
                                    tmpl.id === "team-pitch" ? "bg-purple-400" :
                                    tmpl.id === "korean-corporate" ? "bg-sky-400" : "bg-emerald-400"
                                  }`} />
                                  <span className="text-[11px] font-bold text-white truncate">
                                    {tmpl.nameKo.split(" (")[0]}
                                  </span>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded font-mono font-semibold shrink-0">
                                  {tmpl.slides.length}장
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-300 leading-relaxed break-keep font-normal">
                                {language === "ko" ? tmpl.descriptionKo : tmpl.descriptionId}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 1. LAYOUT TEMPLATE ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "layout" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "layout" ? null : "layout"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold">레이아웃 템플릿</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "layout" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "layout" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 custom-scrollbar">
                {/* Category: Text-Heavy */}
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500/80 shadow-[0_0_6px_rgba(14,165,233,0.4)]" />
                    <span>텍스트 위주 (Text-Heavy)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-0.5">
                    {SLIDE_LAYOUT_OPTIONS.filter((o) => o.category === "Text-Heavy").map((opt) => {
                      const isSelected = currentLayout === opt.id;
                      return (
                        <div key={opt.id} className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleLayoutChange(opt.id)}
                            className={`p-1 rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                              isSelected
                                ? "bg-sky-500/20 border-sky-400 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                                : "bg-transparent border-[#2d2d2d] text-sky-400/70 hover:border-sky-400 hover:text-sky-400 hover:bg-sky-400/5"
                            }`}
                          >
                            {renderLayoutMiniWireframe(opt.id, true)}
                          </button>
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                            <div className="bg-[#1e1e1f] text-neutral-100 text-[10px] py-1 px-2 rounded border border-neutral-700/80 shadow-xl whitespace-nowrap font-semibold">
                              {opt.label}
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#1e1e1f] border-r border-b border-neutral-700/80 rotate-45 -translate-y-[4px]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category: Image-Heavy */}
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                    <span>이미지 중심 (Image-Heavy)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-0.5">
                    {SLIDE_LAYOUT_OPTIONS.filter((o) => o.category === "Image-Heavy").map((opt) => {
                      const isSelected = currentLayout === opt.id;
                      return (
                        <div key={opt.id} className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleLayoutChange(opt.id)}
                            className={`p-1 rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                              isSelected
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                                : "bg-transparent border-[#2d2d2d] text-emerald-400/70 hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/5"
                            }`}
                          >
                            {renderLayoutMiniWireframe(opt.id, true)}
                          </button>
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                            <div className="bg-[#1e1e1f] text-neutral-100 text-[10px] py-1 px-2 rounded border border-neutral-700/80 shadow-xl whitespace-nowrap font-semibold">
                              {opt.label}
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#1e1e1f] border-r border-b border-neutral-700/80 rotate-45 -translate-y-[4px]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category: Data & Structure */}
                <div className="space-y-2">
                  <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                    <span>데이터 및 구조 (Data & Structure)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-0.5">
                    {SLIDE_LAYOUT_OPTIONS.filter((o) => o.category === "Data & Structure").map((opt) => {
                      const isSelected = currentLayout === opt.id;
                      return (
                        <div key={opt.id} className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleLayoutChange(opt.id)}
                            className={`p-1 rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                                : "bg-transparent border-[#2d2d2d] text-amber-400/70 hover:border-amber-400 hover:text-amber-400 hover:bg-amber-400/5"
                            }`}
                          >
                            {renderLayoutMiniWireframe(opt.id, true)}
                          </button>
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                            <div className="bg-[#1e1e1f] text-neutral-100 text-[10px] py-1 px-2 rounded border border-neutral-700/80 shadow-xl whitespace-nowrap font-semibold">
                              {opt.label}
                            </div>
                            <div className="w-1.5 h-1.5 bg-[#1e1e1f] border-r border-b border-neutral-700/80 rotate-45 -translate-y-[4px]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoSelectLayout}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/40 hover:border-indigo-500/60 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-[0.98] mt-2 shadow-[0_2px_8px_rgba(99,102,241,0.08)]"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>AI 레이아웃 최적 추천 적용</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. CHART & GRAPH GALLERY ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "charts" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "charts" ? null : "charts"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">차트 & 그래프 갤러리</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "charts" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "charts" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2 custom-scrollbar">
                <div className="grid grid-cols-4 gap-2 px-0.5">
                  {[
                    {
                      id: "chart-bar",
                      title: "막대 그래프 (Bar Chart)",
                      desc: "항목별 독립된 수치를 한눈에 직관적으로 비교",
                      md: `# 2026 한-인니 주요 산업 비교\n## 양국 핵심 제조 분야 생산성 점수 (Scale 1-100)\n- 철강 산업 (Steel Industry): 85\n- 석유 화학 (Petrochemical): 72\n- 반도체/디스플레이 (Semiconductor): 94\n- 자동차 생산 (Automotive): 68`,
                    },
                    {
                      id: "chart-line",
                      title: "선 그래프 (Line Chart)",
                      desc: "연도별, 분기별 주요 트렌드의 흐름과 시계열 분석",
                      md: `# 연도별 양자 협력 프로젝트 추이\n## 2021년부터 2026년까지의 누적 합의 건수\n- 2021년도 (Year 2021): 12\n- 2022년도 (Year 2022): 24\n- 2023년도 (Year 2023): 45\n- 2024년도 (Year 2024): 67\n- 2025년도 (Year 2025): 89\n- 2026년도 (목표치) (Year 2026): 120`,
                    },
                    {
                      id: "chart-donut",
                      title: "도넛 차트 (Donut Chart)",
                      desc: "전체 구성 대비 각 기관/항목별 지분 및 분할 비율 시각화",
                      md: `# 2026 합의 기금 투자 지분 분할\n## 기관별 분담 비율 및 총 예산 구성안\n- B2B 대학 펀드 (University Fund): 35\n- B2G 지자체 매칭 (Government Matching): 30\n- 금융권 협력 투자 (Financial Cooperation): 20\n- 민간 기업 후원 (Private Sponsoring): 15`,
                    },
                    {
                      id: "chart-waterfall",
                      title: "워터폴 차트 (Waterfall Chart)",
                      desc: "초기 자본부터 단계별 추가 유치 및 증감의 흐름 추적",
                      md: `# 합의 기금 연쇄 예산 누적 증가세\n## 초기 유치 자본금부터 각 단계별 추가 유치 현황 (단위: 억 원)\n- 초기 자본금 (Initial Capital): 100\n- 1차 매칭 펀드 (Primary Matching): 50\n- 2차 매칭 펀드 (Secondary Matching): 30\n- 운영 차입금 (Operating Loans): -20\n- 해외 투자 유치 (Foreign Investment): 40`,
                    },
                  ].map((item) => {
                    const isSelected = currentLayout === item.id;
                    return (
                      <div key={item.id} className="relative group flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleInsertTemplate(item.md, item.id as SlideLayout)}
                          className={`p-1 rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                              : "bg-transparent border-[#2d2d2d] text-amber-400/70 hover:border-amber-400 hover:text-amber-400 hover:bg-amber-400/5"
                          }`}
                        >
                          {renderLayoutMiniWireframe(item.id as SlideLayout, true)}
                        </button>
                        <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                          <div className="bg-[#1e1e1f] text-neutral-100 text-[10px] py-1 px-2 rounded border border-neutral-700/80 shadow-xl whitespace-nowrap font-semibold">
                            {item.title}
                          </div>
                          <div className="w-1.5 h-1.5 bg-[#1e1e1f] border-r border-b border-neutral-700/80 rotate-45 -translate-y-[4px]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. TABLE TEMPLATE GALLERY ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "tables" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "tables" ? null : "tables"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold">표 템플릿 갤러리</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "tables" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "tables" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2 custom-scrollbar">
                <div className="grid grid-cols-3 gap-2 px-0.5">
                  {[
                    {
                      id: "comparison-table",
                      title: "단순 비교표 (Comparison)",
                      desc: "양자 비교 분석에 특화된 정밀 컬럼 데이터 그리드",
                      md: `# 한-인니 핵심 지표 비교 분석표\n## 양국의 경제, 개발, 보급률에 관한 비교 통계\n| 구분 (Metric) | 대한민국 (South Korea) | 인도네시아 (Indonesia) |\n| :--- | :---: | :---: |\n| 인구 규모 (Population) | 5,100만 명 | 2억 7,800만 명 |\n| GDP 규모 (Nominal GDP) | 1.71조 USD | 1.37조 USD |\n| 청년 비율 (Youth Ratio) | 15.2% | 27.6% |\n| 디지털 보급률 (Internet) | 98.0% | 73.7% |\n| 국토 면적 (Land Area) | 10만 ㎢ | 190만 ㎢ |`,
                    },
                    {
                      id: "feature-matrix",
                      title: "기능 체크리스트 (Feature Matrix)",
                      desc: "등급, 기능, 솔루션 범위를 다단계 체크 기호(O, X)로 시각화",
                      md: `# 솔루션 등급별 기능 비교 매트릭스\n## 라이선스 등급에 따른 서비스 가치 및 접근 범위 정의\n| 핵심 제공 기능 (Core Features) | 베이직 (Basic) | 프로 (Pro) | 엔터프라이즈 (Enterprise) |\n| :--- | :---: | :---: |\n| 실시간 캔버스 편집 (Canvas Sync) | O | O | O |\n| PDF 내보내기 및 인쇄 (PDF Export) | O | O | O |\n| AI 자동 번역 (Dual Translation) | X | O | O |\n| 구글 드라이브 구름 동기화 (Drive Cloud) | X | X | O |\n| 1대1 전담 기술 컨설팅 (Support) | X | X | O |`,
                    },
                    {
                      id: "schedule-table",
                      title: "타임라인 일정표 (Schedule)",
                      desc: "시간대와 일정명, 세부 설명과 장소까지 유연하게 다루는 세로형 타임 테이블",
                      md: `# 1차 방한 대표단 공식 일정표\n## 6박 8일 서울 및 중부권 주요 공식 학술 일정\n| 일자 (Date) | 시간 (Time) | 일정명 (Agenda) | 세부 설명 (Details) | 장소 (Location) |\n| :--- | :--- | :--- | :--- | :--- |\n| 10/17(토) | 20:00 ~ | 자카르타 출국 | CGK 공항 집결 및 출국 수속 (기내 1박) | CGK 공항 |\n| 10/18(일) | 06:00 ~ | 인천공항 입국 | 입국 절차 완료 후 서울 숙소 이동 및 휴식 | 인천공항 / 호텔 |\n| 10/19(월) | 09:30 ~ 12:00 | 서울과학기술대 방문 | 글로벌 공동 학위 협정 수여식 및 예방 | 서울과기대 |\n| 10/20(화) | 14:00 ~ 17:00 | 고려대학교 예방 | 스마트 교육 시스템 시연 및 학술 세미나 | 고려대학교 |`,
                    },
                  ].map((item) => {
                    const isSelected = currentLayout === item.id;
                    return (
                      <div key={item.id} className="relative group flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleInsertTemplate(item.md, item.id as SlideLayout)}
                          className={`p-1 w-full rounded-lg transition-all duration-200 cursor-pointer border flex items-center justify-center ${
                            isSelected
                              ? "bg-sky-500/20 border-sky-400 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                              : "bg-transparent border-[#2d2d2d] text-sky-400/70 hover:border-sky-400 hover:text-sky-400 hover:bg-sky-400/5"
                          }`}
                        >
                          {renderLayoutMiniWireframe(item.id as SlideLayout, true)}
                        </button>
                        <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                          <div className="bg-[#1e1e1f] text-neutral-100 text-[10px] py-1 px-2 rounded border border-neutral-700/80 shadow-xl whitespace-nowrap font-semibold">
                            {item.title}
                          </div>
                          <div className="w-1.5 h-1.5 bg-[#1e1e1f] border-r border-b border-neutral-700/80 rotate-45 -translate-y-[4px]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. COLOR PALETTE EXTRACTION ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "palette" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "palette" ? null : "palette"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">색상 팔레트 추출</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "palette" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "palette" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 custom-scrollbar">
                {slide?.image?.url ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-transparent border border-[#2d2d2d]">
                      <div className="relative group overflow-hidden rounded-md border border-neutral-700/50 shrink-0">
                        <img
                          src={slide.image.url}
                          alt="Active Slide Thumb"
                          className="w-16 h-12 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-neutral-400 font-mono truncate mb-1.5">
                          {slide.image.captionKo || "현재 슬라이드 이미지"}
                        </p>
                        <button
                          type="button"
                          onClick={handleExtractPalette}
                          disabled={isExtracting}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 disabled:opacity-50 text-white text-[10px] font-semibold rounded flex items-center space-x-1 transition cursor-pointer shadow-sm active:scale-95"
                        >
                          {isExtracting ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                          ) : (
                            <Palette className="w-3 h-3 text-sky-400" />
                          )}
                          <span>{isExtracting ? "색상 분석 중..." : "고유 색상 추출"}</span>
                        </button>
                      </div>
                    </div>

                    {extractionError && (
                      <p className="text-[10px] text-red-400 bg-red-950/20 p-2.5 rounded border border-red-900/40 font-mono">
                        ⚠️ {extractionError}
                      </p>
                    )}

                    {palette && (
                      <div className="space-y-4 p-3.5 rounded-xl bg-[#1d1d1e] border border-[#29292a] animate-in fade-in duration-200 shadow-md">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-400 block mb-2 uppercase font-mono tracking-wide">
                            추출된 대표 고유 색상
                          </span>
                          <div className="flex items-center gap-2">
                            {palette.dominantColors.map((color, cIdx) => (
                              <div key={color + cIdx} className="group relative flex flex-col items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(color);
                                    if (onUpdateSlide) {
                                      onUpdateSlide(
                                        {
                                          ...slide,
                                          customAccentColor: color,
                                        },
                                        true,
                                        `Set accent color to ${color}`
                                      );
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full border border-white/10 shadow-inner hover:scale-110 active:scale-90 transition-all duration-150 cursor-pointer flex items-center justify-center text-white"
                                  style={{ backgroundColor: color }}
                                  title={`클릭하여 복사 및 주악센트로 설정: ${color}`}
                                >
                                  {slide.customAccentColor === color && (
                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                  )}
                                </button>
                                <span className="text-[8px] font-mono mt-1 text-neutral-400 select-all">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-[#29292a]">
                          <span className="text-[9px] font-bold text-neutral-400 block uppercase font-mono tracking-wide">
                            추천 테마 조합
                          </span>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-[#141414] border border-neutral-800/80 flex flex-col justify-between">
                              <span className="text-[8px] text-neutral-500 block mb-1 font-medium">주 강조색 (Primary)</span>
                              <div className="flex items-center space-x-1.5">
                                <div className="w-3.5 h-3.5 rounded border border-white/5 shrink-0 shadow-sm" style={{ backgroundColor: palette.suggestedAccents.accentColor }} />
                                <span className="text-[10px] font-mono text-neutral-300 font-medium">{palette.suggestedAccents.accentColor}</span>
                              </div>
                            </div>

                            <div className="p-2 rounded-lg bg-[#141414] border border-neutral-800/80 flex flex-col justify-between">
                              <span className="text-[8px] text-neutral-500 block mb-1 font-medium">보조 강조색 (Secondary)</span>
                              <div className="flex items-center space-x-1.5">
                                <div className="w-3.5 h-3.5 rounded border border-white/5 shrink-0 shadow-sm" style={{ backgroundColor: palette.suggestedAccents.accentSecondary }} />
                                <span className="text-[10px] font-mono text-neutral-300 font-medium">{palette.suggestedAccents.accentSecondary}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[#141414] border border-neutral-800/80 flex items-center justify-between">
                            <span className="text-[8px] text-neutral-500 block font-medium">배지 조화 시각 프리뷰</span>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/5 shadow-sm"
                              style={{
                                backgroundColor: palette.suggestedAccents.badgeBg,
                                color: palette.suggestedAccents.badgeText,
                              }}
                            >
                              PREVIEW BADGE
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1.5">
                            <button
                              type="button"
                              onClick={handleApplyAccentsToSlide}
                              className="w-full py-1.5 px-3 bg-[#0e639c]/95 hover:bg-[#0e639c] border border-blue-500/20 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-[0.98] shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 text-blue-300" />
                              <span>이 슬라이드에만 추천 악센트 적용</span>
                            </button>

                            {onUpdateTheme && theme && (
                              <button
                                type="button"
                                onClick={handleApplyAccentsGlobally}
                                className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-[11px] font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-[0.98]"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                <span>전체 슬라이드 공통 테마로 적용</span>
                              </button>
                            )}

                            {(slide.customAccentColor || slide.customAccentSecondary || slide.customBg) && (
                              <button
                                type="button"
                                onClick={handleResetAccents}
                                className="w-full py-1 px-3 hover:bg-red-950/20 hover:text-red-300 border border-transparent text-neutral-400 text-[10px] font-semibold rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>스타일 초기화 (테마 복원)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#2d2d2d] bg-transparent text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#181818] flex items-center justify-center mx-auto border border-[#29292a] text-neutral-500">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-relaxed px-2 font-sans">
                      현재 슬라이드에 이미지가 없습니다.<br />
                      슬라이드 상단 이미지 추가 버튼 또는 내용 편집기에서 이미지를 삽입해 주세요.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. ANIMATION & TRANSITION ACCORDION */}
      <div className={`flex flex-col border-b border-white/[0.08] overflow-hidden ${openSection === "animation" ? "flex-1 min-h-0" : "shrink-0"}`}>
        <button
          type="button"
          onClick={() => setOpenSection((prev) => (prev === "animation" ? null : "animation"))}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left transition-colors cursor-pointer bg-[#11141c] text-slate-300 hover:text-white border-b border-white/[0.06]"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold">애니메이션 & 트랜지션</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-[180ms] ease-linear ${openSection === "animation" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {openSection === "animation" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: { duration: 0.18, ease: "linear" } }}
              transition={{ duration: 0.18, ease: "linear" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 custom-scrollbar">
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/20 to-neutral-950/40 border border-indigo-500/25 space-y-3 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-neutral-400 font-medium">컨텐츠 분석 추천 효과:</div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-xs font-bold text-white capitalize">{recommendation.recommendedTransition}</span>
                        <span className="text-[8px] px-1.5 py-[1px] bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 rounded font-semibold font-mono uppercase tracking-wide shadow-sm">
                          RECOMMENDED
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-300 bg-[#141414] p-2.5 rounded-lg border border-neutral-800/80 leading-relaxed font-sans">
                    {language === "ko" ? recommendation.reasonKo : recommendation.reasonId}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleTransitionChange(recommendation.recommendedTransition)}
                    disabled={slide.transition === recommendation.recommendedTransition}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 disabled:hover:bg-indigo-600 border border-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-200" />
                    <span>{slide.transition === recommendation.recommendedTransition ? "추천 효과 적용 완료" : "추천 효과 즉시 적용"}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                    수동 효과 선택 (마우스 오버 시 미리보기)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SLIDE_TRANSITION_OPTIONS.map((opt) => {
                      const isCurrent = slide.transition === opt.id || (!slide.transition && opt.id === "fade");
                      const isRecommended = recommendation.recommendedTransition === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleTransitionChange(opt.id)}
                          onMouseEnter={() => onHoverTransition?.(opt.id)}
                          onMouseLeave={() => onHoverTransition?.(null)}
                          className={`py-2 px-1 text-center text-[10px] rounded-lg border transition-all cursor-pointer relative ${
                            isCurrent
                              ? "bg-[#6366f1]/20 border-[#6366f1] text-white font-semibold shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                              : "bg-transparent border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isRecommended && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-2 ring-[#1d1d1e]" title="AI 추천 효과" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
