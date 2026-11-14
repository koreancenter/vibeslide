import React, { useState } from "react";
import { X, ArrowRight, Check, FileText, Sparkles } from "lucide-react";
import { RagPatchSuggestion, SlideData } from "../types";
import { SAMPLE_INTRANET_DOCUMENTS } from "../utils/ragDiffEngine";

interface RagDiffReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: RagPatchSuggestion[];
  slides: SlideData[];
  sourceDocumentTitle: string | null;
  onApplySinglePatch: (patch: RagPatchSuggestion) => void;
  onApplyAllPatches: () => void;
  onRunDiffWithDocument?: (content: string, title: string) => Promise<void>;
  isAnalyzing?: boolean;
}

export const RagDiffReviewModal: React.FC<RagDiffReviewModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  slides,
  sourceDocumentTitle,
  onApplySinglePatch,
  onApplyAllPatches,
  onRunDiffWithDocument,
  isAnalyzing = false,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(SAMPLE_INTRANET_DOCUMENTS[0].id);
  const [customText, setCustomText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"review" | "source">("review");

  if (!isOpen) return null;

  const affectedSlideIndices = Array.from(new Set(suggestions.map((s) => s.slideIndex)));
  const unappliedCount = suggestions.filter((s) => !s.applied).length;

  const handleTestPreset = async (doc: typeof SAMPLE_INTRANET_DOCUMENTS[0]) => {
    setSelectedDocId(doc.id);
    if (onRunDiffWithDocument) {
      await onRunDiffWithDocument(doc.content, doc.title);
    }
  };

  const handleRunCustomDiff = async () => {
    if (!customText.trim() || !onRunDiffWithDocument) return;
    await onRunDiffWithDocument(customText, "사용자 입력 참조 문서");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] bg-[#101520] border border-sky-400/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 antialiased font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            참조 문서 비교 분석
          </h2>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "review" ? "source" : "review")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === "source"
                  ? "bg-sky-500 text-slate-950 font-semibold"
                  : "bg-white/[0.06] hover:bg-white/10 text-slate-300"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{activeTab === "source" ? "패치 검토로 돌아가기" : "참조 문서 변경"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body (No box-in-box) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === "source" ? (
            <div className="space-y-6 animate-fadeIn divide-y divide-white/[0.08]">
              {/* Preset Document List */}
              <div className="pb-5 space-y-3">
                <div className="text-xs font-medium text-sky-300">
                  인트라넷 참조 문서 선택
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SAMPLE_INTRANET_DOCUMENTS.map((doc) => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => handleTestPreset(doc)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        selectedDocId === doc.id
                          ? "bg-sky-500/15 border-sky-400/60 text-white"
                          : "bg-[#0b101b] border-white/10 hover:border-sky-400/30"
                      }`}
                    >
                      <div className="text-xs font-medium text-slate-100 line-clamp-1 mb-1">
                        {doc.title}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {doc.snippet}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text Input */}
              <div className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-sky-300">
                    참조 텍스트 직접 입력
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {customText.length}자
                  </span>
                </div>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="최신 예산 협약, 변경된 마일스톤, 참여 기관 수치 등을 붙여넣으세요..."
                  className="w-full h-32 px-3.5 py-2.5 bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleRunCustomDiff}
                  disabled={!customText.trim() || isAnalyzing}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? "분석 중..." : "비교 분석 실행"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <div className="text-sm font-medium text-slate-200">
                    모든 슬라이드가 최신 참조 문서와 일치합니다
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    업데이트가 필요한 수치 차이가 발견되지 않았습니다. 상단의 참조 문서 변경 버튼으로 다른 문서를 비교할 수 있습니다.
                  </p>
                </div>
              ) : (
                <>
                  {/* Flat Summary Strip */}
                  <div className="pb-3 border-b border-white/[0.08] flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      {sourceDocumentTitle ? `${sourceDocumentTitle} · ` : ""}
                      총 {affectedSlideIndices.length}개 슬라이드에서 {suggestions.length}건의 변경 제안 감지
                    </span>
                    <span className="text-sky-300 font-mono tabular-nums">
                      미반영 {unappliedCount}건
                    </span>
                  </div>

                  {/* Flat Divide List of Suggestions (No box-in-box) */}
                  <div className="divide-y divide-white/[0.08]">
                    {suggestions.map((suggestion, idx) => {
                      const slide = slides[suggestion.slideIndex];
                      const slideTitle = slide
                        ? slide.titleKo || slide.titleId
                        : `슬라이드 ${suggestion.slideIndex + 1}`;

                      return (
                        <div
                          key={suggestion.id || `sugg-${idx}`}
                          className={`py-4 space-y-3 transition ${
                            suggestion.applied ? "opacity-55" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white">
                              슬라이드 {suggestion.slideIndex + 1} · {slideTitle}
                            </span>
                            <span className="text-[11px] font-mono text-sky-300">
                              {suggestion.targetField}
                            </span>
                          </div>

                          {/* Flat Diff Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                            <div className="sm:col-span-5">
                              <div className="text-[11px] text-slate-400 mb-1">현재 값</div>
                              <div className="text-xs font-mono text-slate-400 line-through bg-[#0b101b] px-3 py-2 rounded-lg border border-white/10 break-all">
                                {suggestion.oldValue || "비어 있음"}
                              </div>
                            </div>

                            <div className="sm:col-span-1 flex justify-center text-sky-400 pt-4">
                              <ArrowRight className="w-4 h-4" />
                            </div>

                            <div className="sm:col-span-5">
                              <div className="text-[11px] text-sky-300 mb-1">참조 문서 값</div>
                              <div className="text-xs font-mono text-sky-200 font-semibold bg-sky-500/10 px-3 py-2 rounded-lg border border-sky-400/30 break-all">
                                {suggestion.newValue}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-400 leading-relaxed">
                              {suggestion.rationale}
                            </span>

                            <button
                              type="button"
                              onClick={() => onApplySinglePatch(suggestion)}
                              disabled={suggestion.applied}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center space-x-1.5 cursor-pointer ${
                                suggestion.applied
                                  ? "bg-white/[0.06] text-slate-400 cursor-default"
                                  : "bg-sky-500 hover:bg-sky-400 text-slate-950"
                              }`}
                            >
                              {suggestion.applied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>반영 완료</span>
                                </>
                              ) : (
                                <span>패치 적용</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-end space-x-2.5 bg-[#141b29] text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 transition cursor-pointer font-medium"
          >
            닫기
          </button>
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={onApplyAllPatches}
              disabled={unappliedCount === 0}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>전체 패치 반영 ({unappliedCount}건)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
