import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, MotionConfig } from "motion/react";
import {
  ArrowRight,
  Loader2,
  X,
  Cpu,
  Wand2,
  CheckCircle2,
  Paperclip,
  UploadCloud,
  Trash2,
  Undo2,
  RotateCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useSlideContext } from "../context/SlideContext";
import { useModalContext } from "../context/ModalContext";
import { aiSlideAssist, aiGenerateNextSlide, AttachedImagePayload } from "../utils/api";
import { loadAiModelConfig, saveAiModelConfig, TONE_PRESETS } from "../utils/aiModelConfig";
import { detectLayoutMorphCommand, morphSlideToLayout } from "../utils/slideMorpher";
import { AiTonePreset, SlideData } from "../types";

interface AttachedImageItem {
  file?: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  name: string;
  sizeFormatted: string;
}

type ScopeType = "current-slide" | "highlighted-block" | "next-slide";

interface LastExecutionRecord {
  prompt: string;
  scope: ScopeType;
  tone: AiTonePreset;
  baseSlide: SlideData;
  baseSlideIndex: number;
  attachedPayload: AttachedImagePayload | null;
  highlightedFieldSnapshot: string | null;
}

export const AiPromptCommandBar: React.FC = () => {
  const slideCtx = useSlideContext();
  const modalCtx = useModalContext();

  const isOpen = modalCtx.isModalOpen("aiPromptBar");

  const [promptInput, setPromptInput] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<AiTonePreset>("quiet-luxury");
  const [targetScope, setTargetScope] = useState<ScopeType>("current-slide");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>("");

  const [isDocked, setIsDocked] = useState<boolean>(false);
  const [lastExecution, setLastExecution] = useState<LastExecutionRecord | null>(null);
  const [lastResultSummary, setLastResultSummary] = useState<string>("");
  const [hasUnrevertedAiEdit, setHasUnrevertedAiEdit] = useState<boolean>(false);

  const [attachedImage, setAttachedImage] = useState<AttachedImageItem | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [aiConfig, setAiConfig] = useState(loadAiModelConfig());

  const focusInputSoon = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const cfg = loadAiModelConfig();
      setAiConfig(cfg);
      setSelectedTone(cfg.tone || "quiet-luxury");
      setPromptInput("");
      setProgressStep("");
      setAttachedImage(null);
      setIsDraggingOver(false);
      setIsDocked(false);
      setLastResultSummary("");
      setHasUnrevertedAiEdit(false);

      if (slideCtx.highlightedField) {
        setTargetScope("highlighted-block");
      } else {
        setTargetScope("current-slide");
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (slideCtx.highlightedField && targetScope === "current-slide") {
      setTargetScope("highlighted-block");
    } else if (!slideCtx.highlightedField && targetScope === "highlighted-block") {
      setTargetScope("current-slide");
    }
  }, [isOpen, slideCtx.highlightedField]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        e.preventDefault();
        e.stopPropagation();
        modalCtx.closeModal("aiPromptBar");
      }
    };
    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [isOpen, isProcessing, modalCtx]);

  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        slideCtx.triggerToast("이미지 파일만 첨부할 수 있습니다.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        slideCtx.triggerToast("20MB 이하의 이미지 파일만 첨부 가능합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

        setAttachedImage({
          file,
          previewUrl: result,
          base64: result,
          mimeType: file.type,
          name: file.name,
          sizeFormatted: sizeStr,
        });

        if (!promptInput.trim()) {
          setPromptInput("이 이미지를 분석하여 슬라이드에 배치하고 내용을 업데이트해줘");
        }
        slideCtx.triggerToast(`"${file.name}" 이미지가 첨부되었습니다.`);
        focusInputSoon();
      };
      reader.readAsDataURL(file);
    },
    [promptInput, slideCtx, focusInputSoon]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [isOpen, processImageFile]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleToneSelect = (tone: AiTonePreset) => {
    setSelectedTone(tone);
    const updated = { ...aiConfig, tone };
    setAiConfig(updated);
    saveAiModelConfig(updated);
  };

  const runInstruction = async (params: {
    instruction: string;
    scope: ScopeType;
    tone: AiTonePreset;
    attachedPayload: AttachedImagePayload | null;
    baseSlideOverride?: SlideData;
    baseSlideIndexOverride?: number;
    highlightedFieldOverride?: string | null;
    isRetry?: boolean;
  }) => {
    const {
      instruction,
      scope,
      tone,
      attachedPayload,
      baseSlideOverride,
      baseSlideIndexOverride,
      highlightedFieldOverride,
      isRetry = false,
    } = params;

    if (!instruction.trim() || isProcessing) return;

    const activeSlideSnapshot = baseSlideOverride || slideCtx.activeSlide;
    const activeIndexSnapshot =
      baseSlideIndexOverride !== undefined ? baseSlideIndexOverride : slideCtx.activeSlideIndex;
    const highlightedSnapshot =
      highlightedFieldOverride !== undefined ? highlightedFieldOverride : slideCtx.highlightedField;

    setIsDocked(true);
    setPromptInput("");
    setAttachedImage(null);
    setIsProcessing(true);
    setLastResultSummary("");
    setProgressStep(
      attachedPayload
        ? "이미지 분석 및 슬라이드 반영 중..."
        : isRetry
        ? "다시 실행하는 중..."
        : "슬라이드를 업데이트하는 중..."
    );
    focusInputSoon();

    setLastExecution({
      prompt: instruction,
      scope,
      tone,
      baseSlide: activeSlideSnapshot,
      baseSlideIndex: activeIndexSnapshot,
      attachedPayload,
      highlightedFieldSnapshot: highlightedSnapshot,
    });

    try {
      if (scope === "next-slide") {
        setProgressStep("다음 슬라이드를 생성하는 중...");
        const newSlide = await aiGenerateNextSlide(
          activeSlideSnapshot,
          instruction,
          tone,
          aiConfig,
          attachedPayload,
          slideCtx.constitution
        );

        if (newSlide) {
          const insertIdx = activeIndexSnapshot + 1;
          const updatedSlides = [...slideCtx.slides];
          updatedSlides.splice(insertIdx, 0, newSlide);
          slideCtx.setSlidesWithHistory(
            updatedSlides,
            `AI 다음 슬라이드 생성: ${instruction.slice(0, 20)}`,
            insertIdx,
            true
          );
          const msg = `"${newSlide.titleKo || "새 슬라이드"}" 추가 완료`;
          setLastResultSummary(msg);
          setHasUnrevertedAiEdit(true);
          slideCtx.triggerToast(msg);
        }
      } else {
        const morphCheck = detectLayoutMorphCommand(instruction);
        if (morphCheck.matched && morphCheck.targetLayout) {
          setProgressStep(`${morphCheck.actionDescription || "레이아웃 변환"} 적용 중...`);
        }

        const isBlockUpdate = scope === "highlighted-block" && highlightedSnapshot;
        const actionType = isBlockUpdate ? "in-context-partial-update" : "universal-command";

        const fullInstructions = isBlockUpdate
          ? `Modify specifically the highlighted block "${highlightedSnapshot}". User instruction: ${instruction}. Preserve other fields intact.`
          : instruction;

        const baseSlideForAssist =
          morphCheck.matched && morphCheck.targetLayout
            ? morphSlideToLayout(activeSlideSnapshot, morphCheck.targetLayout)
            : activeSlideSnapshot;

        const updated = await aiSlideAssist(
          actionType,
          baseSlideForAssist,
          fullInstructions,
          tone,
          aiConfig,
          attachedPayload,
          slideCtx.constitution
        );

        if (updated) {
          let finalSlide = updated;
          if (morphCheck.matched && morphCheck.targetLayout && finalSlide.layout !== morphCheck.targetLayout) {
            finalSlide = morphSlideToLayout(finalSlide, morphCheck.targetLayout);
          }

          if (isRetry && activeIndexSnapshot !== slideCtx.activeSlideIndex) {
            slideCtx.updateSingleSlide(
              activeIndexSnapshot,
              finalSlide,
              `AI 재시도: ${instruction.slice(0, 25)}`,
              true
            );
          } else {
            slideCtx.handleUpdateSlide(finalSlide, true, `AI 수정: ${instruction.slice(0, 25)}`);
          }

          const msg = morphCheck.matched
            ? `${morphCheck.actionDescription} 완료`
            : attachedPayload
            ? "이미지 반영 완료"
            : "슬라이드 업데이트 완료";
          setLastResultSummary(msg);
          setHasUnrevertedAiEdit(true);
          slideCtx.triggerToast(msg);
        }
      }
    } catch (err: any) {
      console.error("AI Command execution error:", err);
      const fallbackMorph = detectLayoutMorphCommand(instruction);
      if (fallbackMorph.matched && fallbackMorph.targetLayout) {
        const locallyMorphed = morphSlideToLayout(activeSlideSnapshot, fallbackMorph.targetLayout);
        slideCtx.handleUpdateSlide(locallyMorphed, true, `레이아웃 변환: ${fallbackMorph.actionDescription}`);
        const msg = `${fallbackMorph.actionDescription} 반영 완료`;
        setLastResultSummary(msg);
        setHasUnrevertedAiEdit(true);
        slideCtx.triggerToast(msg);
      } else {
        setLastResultSummary("처리 중 오류가 발생했습니다");
        slideCtx.triggerToast(`AI 처리 실패: ${err?.message || "오류가 발생했습니다."}`);
      }
    } finally {
      setIsProcessing(false);
      setProgressStep("");
      focusInputSoon();
    }
  };

  const handleExecutePrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activePrompt =
      promptInput.trim() ||
      (attachedImage ? "첨부된 이미지를 분석하여 슬라이드에 배치하고 내용을 업데이트해줘." : "");
    if (!activePrompt || isProcessing) return;

    const attachedPayload: AttachedImagePayload | null = attachedImage
      ? {
          data: attachedImage.base64,
          mimeType: attachedImage.mimeType,
          name: attachedImage.name,
          size: attachedImage.file?.size,
        }
      : null;

    await runInstruction({
      instruction: activePrompt,
      scope: targetScope,
      tone: selectedTone,
      attachedPayload,
    });
  };

  const handleRunQuickChip = async (instruction: string, forcedScope?: ScopeType) => {
    if (isProcessing) return;
    const effectiveScope = forcedScope || targetScope;
    if (forcedScope) {
      setTargetScope(forcedScope);
    }

    const attachedPayload: AttachedImagePayload | null = attachedImage
      ? {
          data: attachedImage.base64,
          mimeType: attachedImage.mimeType,
          name: attachedImage.name,
          size: attachedImage.file?.size,
        }
      : null;

    await runInstruction({
      instruction,
      scope: effectiveScope,
      tone: selectedTone,
      attachedPayload,
    });
  };

  const handleInlineUndo = () => {
    if (isProcessing || !slideCtx.canUndo) return;
    slideCtx.handleManualUndo();
    setHasUnrevertedAiEdit(false);
    setLastResultSummary("이전 상태로 복원됨");
    focusInputSoon();
  };

  const handleInlineRetry = async () => {
    if (isProcessing || !lastExecution) return;
    if (hasUnrevertedAiEdit && slideCtx.canUndo) {
      slideCtx.undo();
      setHasUnrevertedAiEdit(false);
    }
    await runInstruction({
      instruction: lastExecution.prompt,
      scope: lastExecution.scope,
      tone: lastExecution.tone,
      attachedPayload: lastExecution.attachedPayload,
      baseSlideOverride: lastExecution.baseSlide,
      baseSlideIndexOverride: lastExecution.baseSlideIndex,
      highlightedFieldOverride: lastExecution.highlightedFieldSnapshot,
      isRetry: true,
    });
  };

  const handleTogglePresets = () => {
    setIsDocked((prev) => !prev);
    focusInputSoon();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center px-4 ${
          isDocked ? "justify-end pb-6" : "justify-start pt-14 sm:pt-20 pb-6"
        }`}
      >
        <motion.div
          layout
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={`pointer-events-auto bg-[#101520]/95 backdrop-blur-md border border-sky-400/25 rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans relative ${
            isDocked ? "max-w-3xl" : "max-w-2xl"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isDraggingOver && (
            <div className="absolute inset-0 z-30 bg-[#0d1422]/95 border-2 border-dashed border-sky-400 rounded-2xl flex flex-col items-center justify-center text-white pointer-events-none p-5">
              <UploadCloud className="w-8 h-8 text-sky-400 mb-2" />
              <p className="text-sm font-semibold text-white">이미지를 여기에 드롭하세요</p>
            </div>
          )}

          {/* Expanded Header: No left icon, no subtitle, no badges */}
          {!isDocked && (
            <div className="px-6 py-3.5 bg-[#141b29] border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-sm font-semibold text-white tracking-tight">
                AI 명령어 프롬프트
              </span>

              <div className="flex items-center space-x-1.5 shrink-0">
                {lastExecution && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDocked(true);
                      focusInputSoon();
                    }}
                    className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 flex items-center space-x-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>축소</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    modalCtx.closeModal("aiPromptBar");
                    modalCtx.openModal("aiSettings");
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 flex items-center space-x-1 transition cursor-pointer whitespace-nowrap"
                >
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>{aiConfig.provider === "local-ollama" ? "로컬 모델" : "제미나이 클라우드"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => modalCtx.closeModal("aiPromptBar")}
                  disabled={isProcessing}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-40"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Inline Progress Strip when docked */}
          {isDocked && isProcessing && (
            <div className="px-4 py-1.5 bg-sky-500/10 border-b border-sky-400/20 flex items-center space-x-2 text-xs text-sky-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
              <span className="truncate">{progressStep}</span>
            </div>
          )}

          {/* Prompt Input Form */}
          <form
            onSubmit={handleExecutePrompt}
            className={isDocked ? "p-2.5 bg-[#0b101b]" : "p-5 border-b border-white/[0.08] bg-[#0b101b]"}
          >
            <div className="relative flex items-center">
              {isProcessing ? (
                <Loader2 className="absolute left-3.5 w-4 h-4 text-sky-400 animate-spin pointer-events-none" />
              ) : (
                <Wand2 className="absolute left-3.5 w-4 h-4 text-sky-400 pointer-events-none" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                readOnly={isProcessing}
                placeholder={
                  isDocked
                    ? "후속 수정 지시 입력..."
                    : attachedImage
                    ? "첨부 이미지와 함께 실행할 지시사항 입력..."
                    : "슬라이드 수정 또는 생성 내용을 입력하세요..."
                }
                className={`w-full pl-10 pr-28 ${
                  isDocked ? "py-2.5 text-xs sm:text-sm" : "py-3 text-sm"
                } bg-white/[0.04] border border-white/10 focus:border-sky-400 rounded-xl text-white placeholder-slate-400 focus:outline-none transition font-sans ${
                  isProcessing ? "opacity-70 cursor-wait" : ""
                }`}
              />

              <div className="absolute right-1.5 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    attachedImage
                      ? "text-sky-300 bg-sky-500/20 border border-sky-400/40"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label="이미지 첨부"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={(!promptInput.trim() && !attachedImage) || isProcessing}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center space-x-1 transition disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessing ? "적용 중" : "실행"}</span>
                </button>
              </div>
            </div>

            {attachedImage && (
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img
                    src={attachedImage.previewUrl}
                    alt="첨부 이미지"
                    className="w-8 h-8 object-cover rounded-lg border border-white/15 shrink-0"
                  />
                  <span className="truncate">{attachedImage.name}</span>
                  <span className="text-[11px] font-mono text-sky-300 tabular-nums shrink-0">
                    {attachedImage.sizeFormatted}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  aria-label="첨부 이미지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {!isDocked && (
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="text-slate-400 text-[11px]">적용 대상</span>
                <button
                  type="button"
                  onClick={() => setTargetScope("current-slide")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap tabular-nums ${
                    targetScope === "current-slide"
                      ? "bg-sky-500/20 text-sky-200 border border-sky-400/50"
                      : "bg-white/[0.04] text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  현재 슬라이드 {slideCtx.activeSlideIndex + 1}
                </button>

                {slideCtx.highlightedField && (
                  <button
                    type="button"
                    onClick={() => setTargetScope("highlighted-block")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                      targetScope === "highlighted-block"
                        ? "bg-sky-500/20 text-sky-200 border border-sky-400/50"
                        : "bg-white/[0.04] text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    선택 블록 {slideCtx.highlightedField}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTargetScope("next-slide")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                    targetScope === "next-slide"
                      ? "bg-sky-500/20 text-sky-200 border border-sky-400/50"
                      : "bg-white/[0.04] text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  다음 슬라이드 생성
                </button>
              </div>
            )}
          </form>

          {/* Docked Compact Action Controls Bar */}
          {isDocked && (
            <div className="px-4 py-2 bg-[#141b29] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 min-w-0 text-slate-400">
                <span className="font-mono text-sky-300 tabular-nums whitespace-nowrap">
                  슬라이드 {slideCtx.activeSlideIndex + 1}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[220px] sm:max-w-[300px] text-slate-300">
                  {isProcessing
                    ? "실행 중..."
                    : lastResultSummary || (lastExecution ? `최근: ${lastExecution.prompt}` : "편집 대기 중")}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleInlineUndo}
                  disabled={isProcessing || !slideCtx.canUndo}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-35 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>되돌리기</span>
                </button>

                <button
                  type="button"
                  onClick={handleInlineRetry}
                  disabled={isProcessing || !lastExecution}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-35 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>재시도</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePresets}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-200 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <ChevronUp className="w-3 h-3" />
                  <span>프리셋</span>
                </button>

                <button
                  type="button"
                  onClick={() => modalCtx.closeModal("aiPromptBar")}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 disabled:opacity-40 transition cursor-pointer whitespace-nowrap"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {/* Expanded Mode: Presets */}
          {!isDocked && (
            <>
              {isProcessing && (
                <div className="px-5 py-2.5 bg-sky-500/10 border-b border-sky-400/20 flex items-center space-x-2 text-xs text-sky-200">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>{progressStep}</span>
                </div>
              )}

              <div className="p-5 border-b border-white/[0.08] bg-[#101520]">
                <div className="text-xs font-medium text-sky-300 mb-2.5">어조 선택</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TONE_PRESETS.map((t) => {
                    const isActive = selectedTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleToneSelect(t.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isActive
                            ? "bg-sky-500/15 border-sky-400/60 text-white"
                            : "bg-[#0b101b] border-white/10 hover:border-sky-400/30 text-slate-300"
                        }`}
                      >
                        <span className="text-xs font-medium truncate">{t.labelKo}</span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 bg-[#0e131e] overflow-y-auto max-h-[210px] space-y-2.5">
                <div className="text-xs font-medium text-sky-300">
                  {attachedImage ? "이미지 빠른 작업" : "빠른 작업"}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {attachedImage ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "첨부된 이미지를 분석하여 슬라이드 우측에 분할 배치하고, 핵심 포인트를 3대 요약 불릿으로 도출해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        우측 분할 및 핵심 요약
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "첨부된 이미지를 전면 배경 히어로 슬라이드로 전환하고 타이틀을 부여해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        전면 배경 히어로 전환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "이미지 속 다이어그램과 수치를 분석하여 핵심 지표 카드와 동기화해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        이미지 수치 지표 추출
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "첨부된 이미지를 바탕으로 후속 실행 슬라이드를 새로 생성해줘",
                            "next-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        이미지 기반 다음 슬라이드 생성
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          modalCtx.closeModal("aiPromptBar");
                          modalCtx.openModal("ragDiffReview");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-200 text-xs transition cursor-pointer"
                      >
                        참조 문서 비교 검토
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "현재 슬라이드의 수치 데이터를 도넛 그래프로 변환해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        도넛 그래프로 변환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "데이터를 막대 차트로 변환하여 항목별 크기를 시각화해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        막대 그래프로 변환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "추세를 보여주는 꺾은선 그래프로 변환해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        꺾은선 그래프로 변환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "현재 내용을 비교 대조 테이블로 변환해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        비교 테이블로 변환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "현재 내용을 3단계 실행 프로세스 구조로 재배치해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        3단계 프로세스 배치
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "슬라이드에서 가장 중요한 4대 핵심 수치를 추출해 지표 카드로 변환해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        핵심 지표 카드로 변환
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "공식 협약 및 정상 회담에 걸맞은 격식체로 문장을 정제해줘",
                            "current-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        공식 격식체로 정제
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRunQuickChip(
                            "현재 슬라이드의 후속 실행 로드맵 슬라이드를 다음 장으로 생성해줘",
                            "next-slide"
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#141b29] hover:bg-sky-500/15 border border-white/10 hover:border-sky-400/40 text-slate-200 text-xs transition cursor-pointer"
                      >
                        다음 슬라이드 생성
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="px-5 py-2.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                <span>실행 시 하단 바 모드로 자동 축소됩니다</span>
                {slideCtx.canUndo && (
                  <button
                    type="button"
                    onClick={handleInlineUndo}
                    className="text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer transition"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>되돌리기</span>
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </MotionConfig>
  );
};
