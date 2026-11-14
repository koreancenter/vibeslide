import React, { useState, useRef } from "react";
import { X, Upload, ArrowRight, Loader2 } from "lucide-react";
import { SlideData } from "../types";
import { useSlideContext } from "../context/SlideContext";

interface AiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportUpgradedSlides: (slides: SlideData[]) => void;
}

export const AiImportModal: React.FC<AiImportModalProps> = ({
  isOpen,
  onClose,
  onImportUpgradedSlides,
}) => {
  const { constitution } = useSlideContext();
  const [rawText, setRawText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProcessUpgrade = async () => {
    if (!rawText.trim()) {
      setStatusMsg("가져올 문서 내용이나 발표 개요를 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    setStatusMsg("문서를 분석하여 16:9 슬라이드 구조로 변환하는 중입니다...");

    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: rawText, constitution }),
      });
      const data = await response.json();

      if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
        onImportUpgradedSlides(data.slides);
        setStatusMsg(`${data.slides.length}개의 슬라이드로 변환 완료되었습니다.`);
        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1000);
      } else {
        setStatusMsg("슬라이드 생성에 실패했습니다.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      setStatusMsg("오류 발생: " + (err?.message || "변환 실패"));
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 bg-[#141b29] border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            문서 가져오기 및 슬라이드 변환
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (No box-in-box) */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-300">원본 텍스트 입력 또는 파일 첨부</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>파일 선택 (.txt, .md)</span>
            </button>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="기존 발표 개요, 보고서 요약, 회의록 텍스트를 붙여넣으세요..."
            rows={9}
            className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {statusMsg && (
            <div className="text-xs text-sky-300 flex items-center space-x-2">
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />}
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex justify-end items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 text-xs font-medium transition cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleProcessUpgrade}
            disabled={isProcessing || !rawText.trim()}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span>슬라이드 생성</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
