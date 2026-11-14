import React, { useState, useRef } from "react";
import { Download, Printer, AlertCircle, X, Loader2 } from "lucide-react";
import { SlideData, Language, PresentationTheme } from "../types";
import { SlideCanvas } from "./SlideCanvas";
import {
  exportSlidesToPdf,
  parseSlideRange,
  PdfExportOptions,
} from "../utils/pdfExport";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideData[];
  currentSlideIndex: number;
  currentLanguage: Language;
  currentTheme: PresentationTheme;
  onTriggerNativePrint: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  currentSlideIndex,
  currentLanguage,
  currentTheme,
  onTriggerNativePrint,
}) => {
  const [fileName, setFileName] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `프레젠테이션_${today}`;
  });
  const [format, setFormat] = useState<"16:9" | "a4-landscape" | "letter-landscape">("16:9");
  const [exportLanguage, setExportLanguage] = useState<Language>(currentLanguage);
  const [qualityScale, setQualityScale] = useState<number>(2);
  const [slideRange, setSlideRange] = useState<"all" | "current" | "custom">("all");
  const [customRangeText, setCustomRangeText] = useState<string>("1-5");
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const renderContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const targetIndices = parseSlideRange(
    slideRange,
    slides.length,
    currentSlideIndex,
    customRangeText
  );
  const selectedSlides = targetIndices.map((idx) => ({
    slide: slides[idx],
    index: idx,
  }));

  const handleExportPdf = async () => {
    if (!renderContainerRef.current) return;
    setIsExporting(true);
    setErrorMsg(null);
    setProgress({ current: 0, total: selectedSlides.length, statusText: "슬라이드 준비 중..." });

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const options: PdfExportOptions = {
        fileName,
        format,
        language: exportLanguage,
        qualityScale,
        slideRange,
        customRangeText,
        includeNotes,
        theme: currentTheme,
        onProgress: (current, total, statusText) => {
          setProgress({ current, total, statusText });
        },
      };

      await exportSlidesToPdf(renderContainerRef.current, selectedSlides, options);
      setIsExporting(false);
      onClose();
    } catch (err: any) {
      console.error("PDF Export failed:", err);
      setErrorMsg(err?.message || "PDF 내보내기 중 오류가 발생했습니다.");
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={() => !isExporting && onClose()}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
          <h3 className="text-sm font-semibold text-white tracking-tight">PDF 파일로 내보내기</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (No box-in-box) */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Name */}
          <div className="space-y-1.5">
            <label className="font-medium text-sky-300 block">파일 이름</label>
            <div className="flex items-center bg-[#0b101b] border border-white/10 focus-within:border-sky-400 rounded-xl px-3.5 py-2 text-white">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="파일명 입력"
                className="w-full bg-transparent outline-none text-xs text-white"
                disabled={isExporting}
              />
              <span className="text-slate-500 font-mono">.pdf</span>
            </div>
          </div>

          {/* Page Format */}
          <div className="space-y-2">
            <label className="font-medium text-sky-300 block">페이지 규격</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("16:9")}
                disabled={isExporting}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === "16:9"
                    ? "bg-sky-500/15 border-sky-400/60 text-white"
                    : "bg-[#0b101b] hover:border-sky-400/30 border-white/10 text-slate-400"
                }`}
              >
                <div className="font-medium text-white">16:9 와이드스크린</div>
                <div className="text-[11px] text-slate-400 mt-1">297 × 167 mm</div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("a4-landscape")}
                disabled={isExporting}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === "a4-landscape"
                    ? "bg-sky-500/15 border-sky-400/60 text-white"
                    : "bg-[#0b101b] hover:border-sky-400/30 border-white/10 text-slate-400"
                }`}
              >
                <div className="font-medium text-white">A4 가로형</div>
                <div className="text-[11px] text-slate-400 mt-1">297 × 210 mm</div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("letter-landscape")}
                disabled={isExporting}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  format === "letter-landscape"
                    ? "bg-sky-500/15 border-sky-400/60 text-white"
                    : "bg-[#0b101b] hover:border-sky-400/30 border-white/10 text-slate-400"
                }`}
              >
                <div className="font-medium text-white">레터 가로형</div>
                <div className="text-[11px] text-slate-400 mt-1">279.4 × 215.9 mm</div>
              </button>
            </div>
          </div>

          {/* Slide Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sky-300">내보낼 슬라이드 범위</label>
              <span className="text-sky-300 font-mono tabular-nums">{selectedSlides.length}장 선택됨</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSlideRange("all")}
                disabled={isExporting}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                  slideRange === "all"
                    ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                    : "bg-[#0b101b] hover:border-sky-400/30 text-slate-300 border-white/10"
                }`}
              >
                전체 (1~{slides.length})
              </button>

              <button
                type="button"
                onClick={() => setSlideRange("current")}
                disabled={isExporting}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                  slideRange === "current"
                    ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                    : "bg-[#0b101b] hover:border-sky-400/30 text-slate-300 border-white/10"
                }`}
              >
                현재 슬라이드 ({currentSlideIndex + 1})
              </button>

              <button
                type="button"
                onClick={() => setSlideRange("custom")}
                disabled={isExporting}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                  slideRange === "custom"
                    ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                    : "bg-[#0b101b] hover:border-sky-400/30 text-slate-300 border-white/10"
                }`}
              >
                직접 지정
              </button>
            </div>

            {slideRange === "custom" && (
              <input
                type="text"
                value={customRangeText}
                onChange={(e) => setCustomRangeText(e.target.value)}
                placeholder="예: 1-3, 5, 7-10"
                className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none text-xs font-mono"
                disabled={isExporting}
              />
            )}
          </div>

          {/* Language & Resolution Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-medium text-sky-300 block">출력 언어</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "en", label: "영어" },
                  { id: "ko", label: "한국어" },
                  { id: "id", label: "인니어" },
                  { id: "both", label: "이중" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExportLanguage(opt.id as Language)}
                    disabled={isExporting}
                    className={`py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      exportLanguage === opt.id
                        ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                        : "bg-[#0b101b] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-sky-300 block">출력 해상도</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQualityScale(2)}
                  disabled={isExporting}
                  className={`py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    qualityScale === 2
                      ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                      : "bg-[#0b101b] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  고화질 2배
                </button>
                <button
                  type="button"
                  onClick={() => setQualityScale(3)}
                  disabled={isExporting}
                  className={`py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    qualityScale === 3
                      ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                      : "bg-[#0b101b] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  초고화질 3배
                </button>
              </div>
            </div>
          </div>

          {/* Flat Speaker Notes Row */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="font-medium text-white">발표자 노트 포함</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                각 슬라이드 뒤에 발표 대본 페이지를 함께 출력합니다.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                disabled={isExporting}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
            </label>
          </div>

          {isExporting && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-medium text-sky-300">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>{progress.statusText}</span>
                </span>
                <span className="tabular-nums">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-[#0b101b] rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-sky-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141b29] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTriggerNativePrint();
            }}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>브라우저 인쇄</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl hover:bg-white/10 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || selectedSlides.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF 다운로드</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Off-Screen Rendering Canvas for 16:9 PDF Capture */}
      <div
        ref={renderContainerRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1920px",
          height: "auto",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {selectedSlides.map(({ slide, index }) => (
          <div
            key={`pdf-render-${slide.id}-${index}`}
            data-pdf-slide="true"
            style={{
              width: "1920px",
              height: "1080px",
              overflow: "hidden",
              marginBottom: "40px",
            }}
          >
            <SlideCanvas
              slide={slide}
              language={exportLanguage}
              theme={currentTheme}
              totalSlides={slides.length}
              currentSlideIndex={index}
              scale={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
