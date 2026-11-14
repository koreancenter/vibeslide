import React, { useState, useEffect, useRef } from "react";
import { X, UploadCloud, FileText, Loader2, Trash2 } from "lucide-react";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import {
  DesignConstitution,
  DEFAULT_DESIGN_CONSTITUTION,
  processConstitutionReferenceFile,
} from "../utils/constitution";

export const ConstitutionModal: React.FC = () => {
  const modalCtx = useModalContext();
  const slideCtx = useSlideContext();

  const isOpen = modalCtx.isModalOpen("constitution");

  const [localConstitution, setLocalConstitution] = useState<DesignConstitution>(
    slideCtx.constitution || DEFAULT_DESIGN_CONSTITUTION
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConstitution(slideCtx.constitution || DEFAULT_DESIGN_CONSTITUTION);
      setIsDragging(false);
      setIsExtracting(false);
      setExtractError(null);
    }
  }, [isOpen, slideCtx.constitution]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        modalCtx.closeModal("constitution");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, modalCtx]);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File) => {
    setExtractError(null);
    setIsExtracting(true);
    try {
      const result = await processConstitutionReferenceFile(file);
      setLocalConstitution((prev) => ({
        ...prev,
        rulesText: result.rulesText || prev.rulesText,
        attachedFileName: result.fileName || file.name,
      }));
      slideCtx.triggerToast(`"${file.name}"에서 스타일 규칙이 추출되었습니다.`);
    } catch (err: any) {
      const msg = err?.message || "파일에서 스타일 규칙을 추출하는 중 오류가 발생했습니다.";
      setExtractError(msg);
      slideCtx.triggerToast(msg);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleSave = () => {
    slideCtx.updateConstitution({
      enabled: localConstitution.enabled,
      rulesText: localConstitution.rulesText.trim(),
      attachedFileName: localConstitution.attachedFileName,
    });
    slideCtx.triggerToast(
      localConstitution.enabled
        ? "디자인 헌법이 저장 및 적용되었습니다."
        : "디자인 헌법이 비활성화되었습니다."
    );
    modalCtx.closeModal("constitution");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => modalCtx.closeModal("constitution")}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 bg-[#141b29] border-b border-white/[0.08] flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white tracking-tight truncate">
            디자인 헌법
          </h3>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                setLocalConstitution((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              role="switch"
              aria-checked={localConstitution.enabled}
              className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
            >
              <span>{localConstitution.enabled ? "활성" : "해제"}</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  localConstitution.enabled ? "bg-sky-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    localConstitution.enabled ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => modalCtx.closeModal("constitution")}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: Flat dropzone + single clean textarea (No box-in-box) */}
        <div className="p-6 space-y-5">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.pdf,text/plain,text/markdown,application/json,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`rounded-xl border border-dashed px-4 py-3.5 transition cursor-pointer flex items-center justify-between gap-3 ${
                isDragging
                  ? "border-sky-400 bg-sky-500/10"
                  : "border-sky-400/30 bg-[#0b101b] hover:border-sky-400/60"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                {isExtracting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-sky-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {isExtracting
                      ? "문서에서 스타일 규칙 추출 중..."
                      : "스타일 가이드 문서를 드롭하거나 클릭해 첨부"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    .txt, .md, .json, .pdf 지원
                  </div>
                </div>
              </div>

              <span className="text-xs font-medium text-sky-300 whitespace-nowrap shrink-0">
                파일 선택
              </span>
            </div>

            {localConstitution.attachedFileName && (
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{localConstitution.attachedFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalConstitution((prev) => ({ ...prev, attachedFileName: undefined }))
                  }
                  className="text-slate-400 hover:text-rose-300 p-1 rounded transition cursor-pointer shrink-0"
                  title="첨부 파일 제거"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {extractError && (
              <p className="mt-2 text-xs text-rose-400">{extractError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="constitution-rules-textarea"
                className="text-xs font-medium text-sky-300"
              >
                어조 및 스타일 지침
              </label>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                {localConstitution.rulesText.length}자
              </span>
            </div>
            <textarea
              id="constitution-rules-textarea"
              rows={8}
              value={localConstitution.rulesText}
              onChange={(e) =>
                setLocalConstitution((prev) => ({ ...prev, rulesText: e.target.value }))
              }
              placeholder="원하는 어조, 문체 규칙, 금지 표현 등을 자유롭게 입력하세요..."
              className="w-full px-3.5 py-3 bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none leading-relaxed font-sans resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={() => modalCtx.closeModal("constitution")}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isExtracting}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition cursor-pointer whitespace-nowrap shrink-0"
          >
            저장 및 적용
          </button>
        </div>
      </div>
    </div>
  );
};
