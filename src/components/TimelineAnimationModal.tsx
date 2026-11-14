import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Sparkles,
  MoveUp,
  MoveRight,
  Maximize2,
  RotateCw,
  Check,
} from "lucide-react";
import { useSlideContext } from "../context/SlideContext";
import { ComponentAnimationType, ComponentBuildInConfig } from "../types";
import { SlideCanvas } from "./SlideCanvas";

interface TimelineAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANIMATION_PRESETS: {
  type: ComponentAnimationType;
  label: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    type: "slide-up",
    label: "위로 슬라이드",
    desc: "아래에서 위로 부드럽게 떠오르는 등장 효과",
    icon: MoveUp,
  },
  {
    type: "fade",
    label: "부드러운 페이드",
    desc: "은은하게 서서히 나타나는 불투명도 전환",
    icon: Sparkles,
  },
  {
    type: "slide-right",
    label: "오른쪽 슬라이드",
    desc: "왼쪽에서 오른쪽으로 들어오는 수평 전환",
    icon: MoveRight,
  },
  {
    type: "zoom-in",
    label: "확대 등장",
    desc: "약간의 확대와 함께 입체감 있게 등장",
    icon: Maximize2,
  },
  {
    type: "flip-up",
    label: "입체 뒤집기",
    desc: "원근감을 가진 카드 회전 등장",
    icon: RotateCw,
  },
];

export const TimelineAnimationModal: React.FC<TimelineAnimationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeSlide,
    activeSlideIndex,
    slides,
    currentTheme,
    language,
    handleUpdateSlide,
    setSlidesWithHistory,
    triggerToast,
  } = useSlideContext();

  const currentConfig: ComponentBuildInConfig = activeSlide?.buildInConfig || {
    enabled: true,
    animation: "slide-up",
    staggerDelay: 0.2,
    sequenceMode: "click",
  };

  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [animation, setAnimation] = useState<ComponentAnimationType>(currentConfig.animation);
  const [staggerDelay, setStaggerDelay] = useState(currentConfig.staggerDelay);
  const [sequenceMode, setSequenceMode] = useState<"auto" | "click">(currentConfig.sequenceMode);

  const totalItems = activeSlide?.bullets?.length || activeSlide?.stats?.length || 3;
  const [previewStep, setPreviewStep] = useState(totalItems);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (activeSlide?.buildInConfig) {
      setEnabled(activeSlide.buildInConfig.enabled);
      setAnimation(activeSlide.buildInConfig.animation);
      setStaggerDelay(activeSlide.buildInConfig.staggerDelay);
      setSequenceMode(activeSlide.buildInConfig.sequenceMode);
    }
  }, [activeSlide?.id]);

  if (!isOpen || !activeSlide) return null;

  const playSequencePreview = () => {
    setIsPlayingPreview(true);
    setPreviewStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setPreviewStep(step);
      if (step >= totalItems) {
        clearInterval(interval);
        setIsPlayingPreview(false);
      }
    }, staggerDelay * 1000 + 350);
  };

  const handleSaveActiveSlide = () => {
    const updatedSlide = {
      ...activeSlide,
      buildInConfig: {
        enabled,
        animation,
        staggerDelay,
        sequenceMode,
      },
    };
    handleUpdateSlide(updatedSlide, true, "슬라이드 컴포넌트 애니메이션 타임라인 설정");
    triggerToast("현재 슬라이드의 애니메이션 설정이 저장되었습니다.");
    onClose();
  };

  const handleApplyToAllSlides = () => {
    const newConfig: ComponentBuildInConfig = {
      enabled,
      animation,
      staggerDelay,
      sequenceMode,
    };
    const updatedSlides = slides.map((s) => ({
      ...s,
      buildInConfig: newConfig,
    }));
    setSlidesWithHistory(updatedSlides, "전체 슬라이드 컴포넌트 애니메이션 일괄 적용", activeSlideIndex, true);
    triggerToast(`전체 ${slides.length}개 슬라이드에 애니메이션이 일괄 적용되었습니다.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#101520] border border-sky-400/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141b29]">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            요소 등장 애니메이션 타임라인
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body (No box-in-box) */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-5">
              {/* Flat Enable Row */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-white">순차 등장 애니메이션 사용</span>
                <button
                  type="button"
                  onClick={() => setEnabled((prev) => !prev)}
                  role="switch"
                  aria-checked={enabled}
                  className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer"
                >
                  <span>{enabled ? "활성" : "해제"}</span>
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      enabled ? "bg-sky-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        enabled ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              </div>

              {/* Animation Preset Selector (flat divide list) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-sky-300 block">등장 모션 스타일</label>
                <div className="divide-y divide-white/[0.06]">
                  {ANIMATION_PRESETS.map((preset) => {
                    const isSelected = animation === preset.type;
                    const Icon = preset.icon;

                    return (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => setAnimation(preset.type)}
                        className={`w-full py-2.5 px-2 text-left transition flex items-center justify-between cursor-pointer rounded-lg ${
                          isSelected
                            ? "bg-sky-500/15 text-sky-100"
                            : "text-slate-300 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-sky-400" : "text-slate-400"
                            }`}
                          />
                          <div>
                            <div className="text-xs font-medium text-white">{preset.label}</div>
                            <div className="text-[11px] text-slate-400">{preset.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stagger Delay Slider */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-sky-300">요소 간 간격 지연시간</span>
                  <span className="font-mono text-sky-300 font-semibold tabular-nums">{staggerDelay}초</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={staggerDelay}
                  onChange={(e) => setStaggerDelay(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>빠름 0.1초</span>
                  <span>기본 0.2초</span>
                  <span>느림 0.8초</span>
                </div>
              </div>

              {/* Sequence Trigger Mode */}
              <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                <label className="text-xs font-medium text-sky-300 block">진행 제어 방식</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSequenceMode("click")}
                    className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer ${
                      sequenceMode === "click"
                        ? "bg-sky-500/15 border-sky-400/60 text-white font-medium"
                        : "bg-[#0b101b] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    클릭 / 스페이스 진행
                  </button>
                  <button
                    type="button"
                    onClick={() => setSequenceMode("auto")}
                    className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer ${
                      sequenceMode === "auto"
                        ? "bg-sky-500/15 border-sky-400/60 text-white font-medium"
                        : "bg-[#0b101b] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    진입 시 자동 연속 재생
                  </button>
                </div>
              </div>
            </div>

            {/* Right Live Preview Canvas */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-sky-300">시퀀스 미리보기</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewStep((prev) => Math.max(0, prev - 1))}
                    disabled={previewStep <= 0}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 text-[11px] text-slate-300 font-mono transition cursor-pointer"
                  >
                    - 단계
                  </button>
                  <span className="text-[11px] font-mono text-sky-300 px-1 tabular-nums">
                    {previewStep} / {totalItems}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewStep((prev) => Math.min(totalItems, prev + 1))}
                    disabled={previewStep >= totalItems}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 disabled:opacity-30 text-[11px] text-slate-300 font-mono transition cursor-pointer"
                  >
                    + 단계
                  </button>
                  <button
                    type="button"
                    onClick={playSequencePreview}
                    disabled={isPlayingPreview}
                    className="px-3 py-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>재생</span>
                  </button>
                </div>
              </div>

              <div className="w-full aspect-video rounded-xl border border-white/10 overflow-hidden bg-black relative">
                <SlideCanvas
                  slide={{
                    ...activeSlide,
                    buildInConfig: {
                      enabled,
                      animation,
                      staggerDelay,
                      sequenceMode,
                    },
                  }}
                  language={language}
                  theme={currentTheme}
                  totalSlides={slides.length}
                  currentSlideIndex={activeSlideIndex}
                  buildInStep={previewStep}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                발표 모드에서 스페이스바 또는 오른쪽 방향키를 누를 때마다 각 요소가 순차적으로 나타납니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141b29] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleApplyToAllSlides}
            className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/10 text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap"
          >
            전체 슬라이드에 적용
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveActiveSlide}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
