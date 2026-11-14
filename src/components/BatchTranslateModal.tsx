import React, { useState } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { SlideData } from "../types";
import { translateSlideWithAi } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";

interface BatchTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideData[];
  onUpdateSlides: (newSlides: SlideData[]) => void;
}

export const BatchTranslateModal: React.FC<BatchTranslateModalProps> = ({
  isOpen,
  onClose,
  slides,
  onUpdateSlides,
}) => {
  const [targetLang, setTargetLang] = useState<"id" | "ko">("id");
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlideTitle, setCurrentSlideTitle] = useState("");
  const [completed, setCompleted] = useState(false);

  const startBatchTranslation = async () => {
    setIsTranslating(true);
    setProgress(0);
    setCompleted(false);

    const updatedSlides = [...slides];
    const total = slides.length;

    for (let i = 0; i < total; i++) {
      const slide = updatedSlides[i];
      setCurrentSlideTitle(slide.titleKo || `슬라이드 ${i + 1}`);

      try {
        const translated = await translateSlideWithAi(slide, targetLang);
        updatedSlides[i] = translated;
      } catch (err) {
        console.warn(`Slide ${i + 1} translation failed, keeping original:`, err);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    onUpdateSlides(updatedSlides);
    setIsTranslating(false);
    setCompleted(true);
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
            onClick={!isTranslating ? onClose : undefined}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="w-full max-w-lg bg-[#101520] border border-sky-400/20 rounded-2xl shadow-2xl overflow-hidden text-slate-200 relative z-10 font-sans"
          >
            {/* Header: No left icon, no subtitle, no badges */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
              <h3 className="font-semibold text-sm text-white tracking-tight">
                전체 슬라이드 자동 번역
              </h3>
              {!isTranslating && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body (No box-in-box) */}
            <div className="p-6 space-y-5 text-xs">
              <p className="text-slate-300 leading-relaxed">
                전체 {slides.length}장의 슬라이드 제목, 본문, 표 데이터, 발표자 노트를 일괄 번역합니다.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-sky-300">
                  번역 대상 언어
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetLang("id")}
                    disabled={isTranslating}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      targetLang === "id"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] border-white/10 text-slate-300 hover:border-sky-400/30"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                      <span>한국어 → 인도네시아어</span>
                      {targetLang === "id" && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      인도네시아어 본문 생성
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetLang("ko")}
                    disabled={isTranslating}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      targetLang === "ko"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] border-white/10 text-slate-300 hover:border-sky-400/30"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                      <span>인도네시아어 → 한국어</span>
                      {targetLang === "ko" && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      한국어 본문 생성
                    </span>
                  </button>
                </div>
              </div>

              {isTranslating && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-sky-300 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>번역 중 ({progress}%)</span>
                    </span>
                    <span className="text-slate-400 truncate max-w-[200px]">{currentSlideTitle}</span>
                  </div>
                  <div className="w-full bg-[#0b101b] rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-sky-400 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {completed && (
                <div className="text-sky-300 text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4 text-sky-400" />
                  <span>총 {slides.length}개 슬라이드 번역이 완료되었습니다.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-end space-x-2">
              {!completed ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isTranslating}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={startBatchTranslation}
                    disabled={isTranslating}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isTranslating ? "번역 중..." : `번역 시작 (${slides.length}장)`}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition cursor-pointer"
                >
                  확인
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
