import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Layers,
  MousePointerClick,
  Play,
  Square,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useSlideContext } from "../context/SlideContext";
import {
  ElementAnimationEffect,
  ElementAnimationTrigger,
} from "../types";
import {
  SlideAnimationTrack,
  applyTrackOrderToSlide,
  buildSlideAnimationSchedule,
  updateTrackAnimationInSlide,
} from "../utils/componentAnimation";

const EFFECT_OPTIONS: { id: ElementAnimationEffect; label: string; labelKo: string }[] = [
  { id: "fade", label: "Fade", labelKo: "페이드" },
  { id: "slideUp", label: "Slide Up", labelKo: "위로 슬라이드" },
  { id: "slideLeft", label: "Slide Left", labelKo: "왼쪽 슬라이드" },
  { id: "zoomIn", label: "Zoom In", labelKo: "확대 등장" },
  { id: "bounce", label: "Bounce", labelKo: "바운스" },
];

const TRIGGER_OPTIONS: {
  id: ElementAnimationTrigger;
  label: string;
  labelKo: string;
  barClass: string;
  badgeClass: string;
}[] = [
  {
    id: "onClick",
    label: "On Click",
    labelKo: "클릭 시",
    barClass: "bg-blue-500/85 border-blue-400 text-white",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  {
    id: "withPrevious",
    label: "With Prev",
    labelKo: "이전과 함께",
    barClass: "bg-emerald-500/85 border-emerald-400 text-slate-950",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  {
    id: "afterPrevious",
    label: "After Prev",
    labelKo: "이전 다음",
    barClass: "bg-amber-500/85 border-amber-400 text-slate-950",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
];

export const AnimationTimeline: React.FC = () => {
  const {
    activeSlide,
    language,
    handleUpdateSlide,
    isAnimationTimelineOpen,
    setIsAnimationTimelineOpen,
    previewBuildInStep,
    setPreviewBuildInStep,
    setSelectedOverlayId,
    setHighlightedField,
  } = useSlideContext();

  const isKo = language === "ko";
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadMs, setPlayheadMs] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = useMemo(
    () => buildSlideAnimationSchedule(activeSlide, language),
    [activeSlide, language]
  );

  const tracks = schedule.tracks;

  // Keep selected track valid
  useEffect(() => {
    if (tracks.length === 0) {
      setSelectedTrackId(null);
      return;
    }
    if (!selectedTrackId || !tracks.some((t) => t.id === selectedTrackId)) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [tracks, selectedTrackId]);

  const stopPreview = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setIsPlaying(false);
    setPlayheadMs(0);
    setPreviewBuildInStep(undefined);
  }, [setPreviewBuildInStep]);

  useEffect(() => {
    stopPreview();
  }, [activeSlide?.id, stopPreview]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (!activeSlide) return null;

  const isBuildInEnabled = activeSlide.buildInConfig?.enabled !== false;
  const selectedTrack: SlideAnimationTrack | null =
    tracks.find((t) => t.id === selectedTrackId) || null;

  // Ruler scale (min 2400ms so bars have comfortable visual breathing room)
  const scaleMaxMs = Math.max(2400, Math.ceil((schedule.totalDurationMs + 400) / 500) * 500);
  const tickMarks: number[] = [];
  for (let ms = 0; ms <= scaleMaxMs; ms += 500) {
    tickMarks.push(ms);
  }

  const handlePlayPreview = () => {
    if (isPlaying) {
      stopPreview();
      return;
    }
    if (tracks.length === 0) return;

    // Ensure timeline is temporarily previewing even if user kept buildInConfig.enabled false, or honor enabled
    setIsPlaying(true);
    setPlayheadMs(0);
    setPreviewBuildInStep(0);

    const totalMs = Math.max(800, schedule.totalDurationMs + 300);
    const startTs = performance.now();

    const stepEntries: [number, number][] = [];
    schedule.stepStartTimesMs.forEach((stepTimeMs, stepNum) => {
      stepEntries.push([stepNum, stepTimeMs]);
    });
    stepEntries.sort((a, b) => a[0] - b[0]);

    const tick = (now: number) => {
      const elapsed = now - startTs;
      setPlayheadMs(Math.min(elapsed, totalMs));

      let activeStep = 0;
      for (let i = 0; i < stepEntries.length; i += 1) {
        const [stepNum, stepTimeMs] = stepEntries[i];
        if (elapsed >= stepTimeMs) {
          activeStep = stepNum;
        }
      }
      setPreviewBuildInStep(activeStep);

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPreviewBuildInStep(schedule.totalSteps);
        resetTimerRef.current = setTimeout(() => {
          setIsPlaying(false);
          setPlayheadMs(0);
          setPreviewBuildInStep(undefined);
        }, 650);
      }
    };

    // Wait 1 frame at step 0 so hidden initial transform mounts cleanly before transitioning
    requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(tick);
    });
  };

  const handleTrackSelect = (track: SlideAnimationTrack) => {
    setSelectedTrackId(track.id);
    if (track.kind === "overlay" && track.overlayId) {
      setSelectedOverlayId(track.overlayId);
      setHighlightedField(null);
    } else if (track.kind === "bullet" && track.slotIndex !== undefined) {
      setSelectedOverlayId(null);
      setHighlightedField(`bullets-${track.slotIndex}`);
    } else if (track.kind === "stat" && track.slotIndex !== undefined) {
      setSelectedOverlayId(null);
      setHighlightedField(`stats-${track.slotIndex}`);
    } else if (track.kind === "image") {
      setSelectedOverlayId(null);
      setHighlightedField("image");
    }
  };

  const handleToggleBuildIn = () => {
    const currentCfg = activeSlide.buildInConfig || {
      enabled: true,
      animation: "slide-up" as const,
      staggerDelay: 0.2,
      sequenceMode: "click" as const,
    };
    handleUpdateSlide(
      {
        ...activeSlide,
        buildInConfig: {
          ...currentCfg,
          enabled: !isBuildInEnabled,
        },
      },
      true,
      isBuildInEnabled ? "Disable Slide Animations" : "Enable Slide Animations"
    );
  };

  const handleUpdateSelectedTrack = (
    patch: Partial<{
      trigger: ElementAnimationTrigger;
      effect: ElementAnimationEffect;
      duration: number;
      delay: number;
    }>,
    actionLabel: string
  ) => {
    if (!selectedTrack) return;
    const updatedSlide = updateTrackAnimationInSlide(activeSlide, selectedTrack.id, patch);
    handleUpdateSlide(updatedSlide, true, actionLabel);
  };

  const reorderTracks = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const ids = tracks.map((t) => t.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const nextIds = [...ids];
    const [moved] = nextIds.splice(fromIdx, 1);
    nextIds.splice(toIdx, 0, moved);

    const updatedSlide = applyTrackOrderToSlide(activeSlide, nextIds);
    handleUpdateSlide(updatedSlide, true, "Reorder Animation Timeline");
  };

  const moveTrackStep = (trackId: string, dir: -1 | 1) => {
    const ids = tracks.map((t) => t.id);
    const idx = ids.indexOf(trackId);
    const nextIdx = idx + dir;
    if (idx === -1 || nextIdx < 0 || nextIdx >= ids.length) return;
    reorderTracks(trackId, ids[nextIdx]);
  };

  return (
    <section
      aria-label="Animation Timeline Studio"
      className="bg-[#0c0e14] border-t border-white/[0.08] text-xs text-slate-300 shrink-0 select-none z-20"
    >
      {/* Top Studio Header Bar (Always visible; acts as drawer toggle when collapsed) */}
      <div className="h-9 px-3 flex items-center justify-between gap-2 bg-[#0e1118]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            id="btn-toggle-animation-timeline"
            onClick={() => setIsAnimationTimelineOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/[0.06] text-slate-200 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {isAnimationTimelineOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-violet-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
            )}
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-semibold">
              {isKo ? "애니메이션 타임라인" : "Animation Timeline"}
            </span>
          </button>

          <span className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
            {tracks.length} {tracks.length === 1 ? "item" : "items"} · {schedule.totalSteps}{" "}
            {schedule.totalSteps === 1 ? "click" : "clicks"} ·{" "}
            {(schedule.totalDurationMs / 1000).toFixed(2)}s
          </span>

          {previewBuildInStep !== undefined && (
            <span className="px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/40 text-violet-200 text-[10px] font-mono tabular-nums whitespace-nowrap shrink-0">
              Preview Step {previewBuildInStep}/{schedule.totalSteps}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAnimationTimelineOpen && (
            <button
              type="button"
              onClick={handleToggleBuildIn}
              role="switch"
              aria-checked={isBuildInEnabled}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] cursor-pointer whitespace-nowrap shrink-0"
              title="Enable or disable build-in animations for this slide"
            >
              <span className="text-slate-400">{isKo ? "빌드인" : "Build-In"}</span>
              <span
                className={`font-semibold ${
                  isBuildInEnabled ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {isBuildInEnabled ? "ON" : "OFF"}
              </span>
            </button>
          )}

          <button
            type="button"
            id="btn-preview-slide-animations"
            disabled={tracks.length === 0}
            onClick={handlePlayPreview}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 ${
              isPlaying
                ? "bg-rose-600/25 hover:bg-rose-600/35 border-rose-500/50 text-rose-200"
                : "bg-violet-600/25 hover:bg-violet-600/35 border-violet-500/50 text-violet-100"
            }`}
            title={
              isKo
                ? "전체화면 전환 없이 캔버스에서 바로 슬라이드 애니메이션 미리보기"
                : "Play animation sequence directly inside SlideCanvas"
            }
          >
            {isPlaying ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>{isKo ? "미리보기 중지" : "Stop Preview"}</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>{isKo ? "슬라이드 애니메이션 미리보기" : "Preview Slide Animations"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Timeline Studio Drawer */}
      {isAnimationTimelineOpen && (
        <div className="h-64 flex flex-col border-t border-white/[0.08] bg-[#0b0d13]">
          {/* Active Track Inspector Strip */}
          <div className="px-3 py-1.5 border-b border-white/[0.08] bg-[#121620] flex flex-wrap items-center justify-between gap-2 shrink-0">
            {selectedTrack ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-white truncate max-w-[180px]">
                    {selectedTrack.label}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    ({selectedTrack.subtitle})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Trigger */}
                  <div className="flex items-center gap-1 bg-slate-950/70 border border-white/[0.08] rounded-md p-0.5">
                    <MousePointerClick className="w-3 h-3 text-slate-400 ml-1" />
                    {TRIGGER_OPTIONS.map((opt, i) => {
                      const isFirstTrack = tracks[0]?.id === selectedTrack.id;
                      const disabled = isFirstTrack && opt.id !== "onClick";
                      const active = selectedTrack.animation.trigger === opt.id;
                      return (
                        <button
                          key={`${opt.id}-${i}`}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            handleUpdateSelectedTrack(
                              { trigger: opt.id },
                              `Set Trigger (${opt.label})`
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed ${
                            active
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {isKo ? opt.labelKo : opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Effect */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Effect</span>
                    <select
                      aria-label="Animation Effect"
                      value={selectedTrack.animation.effect}
                      onChange={(e) =>
                        handleUpdateSelectedTrack(
                          { effect: e.target.value as ElementAnimationEffect },
                          `Set Effect (${e.target.value})`
                        )
                      }
                      className="bg-slate-950 border border-white/[0.12] rounded-md px-2 py-0.5 text-[11px] text-slate-100 outline-none focus:border-violet-500 cursor-pointer"
                    >
                      {EFFECT_OPTIONS.map((ef) => (
                        <option key={ef.id} value={ef.id}>
                          {isKo ? ef.labelKo : ef.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration (ms) */}
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Dur</span>
                    <input
                      type="number"
                      min={100}
                      max={3000}
                      step={50}
                      value={selectedTrack.animation.duration}
                      onChange={(e) =>
                        handleUpdateSelectedTrack(
                          {
                            duration: Math.max(
                              100,
                              Math.min(3000, Number(e.target.value) || 400)
                            ),
                          },
                          "Adjust Animation Duration"
                        )
                      }
                      className="w-14 bg-slate-950 border border-white/[0.12] rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-white outline-none focus:border-violet-500"
                    />
                    <span>ms</span>
                  </label>

                  {/* Delay (ms) */}
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                    <span>Delay</span>
                    <input
                      type="number"
                      min={0}
                      max={3000}
                      step={50}
                      value={selectedTrack.animation.delay}
                      onChange={(e) =>
                        handleUpdateSelectedTrack(
                          {
                            delay: Math.max(0, Math.min(3000, Number(e.target.value) || 0)),
                          },
                          "Adjust Animation Delay"
                        )
                      }
                      className="w-14 bg-slate-950 border border-white/[0.12] rounded px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-white outline-none focus:border-violet-500"
                    />
                    <span>ms</span>
                  </label>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-slate-400">
                {isKo
                  ? "이 슬라이드에 애니메이션 가능한 카드, 지표 또는 자유 개체가 없습니다."
                  : "Add cards, stats, or canvas elements on this slide to animate them."}
              </span>
            )}
          </div>

          {/* Synchronized Timeline Grid (Tracks + Visual Duration/Delay Bars) */}
          {tracks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Layers className="w-6 h-6 mb-1.5 opacity-40" />
              <span>
                {isKo
                  ? "슬라이드에 도형, 아이콘, 텍스트 또는 카드를 추가하면 타임라인이 생성됩니다."
                  : "No animatable layout slots or overlay elements on this slide yet."}
              </span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
              {/* Ruler Header Row */}
              <div className="sticky top-0 z-20 flex bg-[#10131c] border-b border-white/[0.08] text-[10px] text-slate-400 font-mono">
                <div className="w-72 sm:w-80 shrink-0 px-3 py-1 border-r border-white/[0.08] flex items-center justify-between">
                  <span className="font-sans font-medium text-slate-300">
                    {isKo ? "등장 순서 (드래그 정렬)" : "Build Order (Drag to Reorder)"}
                  </span>
                  <span className="text-[10px] text-slate-500">Step</span>
                </div>
                <div className="flex-1 relative h-6 overflow-hidden">
                  {tickMarks.map((ms) => {
                    const leftPct = (ms / scaleMaxMs) * 100;
                    return (
                      <div
                        key={ms}
                        className="absolute top-0 bottom-0 border-l border-white/[0.08] pl-1 flex items-center tabular-nums"
                        style={{ left: `${leftPct}%` }}
                      >
                        {(ms / 1000).toFixed(1)}s
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracks Container with Live Playhead */}
              <div className="relative divide-y divide-white/[0.05]">
                {tracks.map((track, idx) => {
                  const isSelected = track.id === selectedTrackId;
                  const isDragging = draggedTrackId === track.id;
                  const isDragTarget =
                    dragOverTrackId === track.id && draggedTrackId !== track.id;
                  const trigMeta =
                    TRIGGER_OPTIONS.find((t) => t.id === track.animation.trigger) ||
                    TRIGGER_OPTIONS[0];

                  const delayMs = track.animation.delay;
                  const delayStartMs = Math.max(0, track.startMs - delayMs);
                  const delayLeftPct = (delayStartMs / scaleMaxMs) * 100;
                  const delayWidthPct = (delayMs / scaleMaxMs) * 100;
                  const barLeftPct = (track.startMs / scaleMaxMs) * 100;
                  const barWidthPct = Math.max(
                    2.5,
                    (track.animation.duration / scaleMaxMs) * 100
                  );

                  return (
                    <div
                      key={track.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTrackId(track.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", track.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverTrackId !== track.id) {
                          setDragOverTrackId(track.id);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const src = draggedTrackId || e.dataTransfer.getData("text/plain");
                        if (src) reorderTracks(src, track.id);
                        setDraggedTrackId(null);
                        setDragOverTrackId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedTrackId(null);
                        setDragOverTrackId(null);
                      }}
                      onClick={() => handleTrackSelect(track)}
                      className={`flex items-center h-9 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-violet-500/[0.12]"
                          : "hover:bg-white/[0.03]"
                      } ${isDragging ? "opacity-40" : ""} ${
                        isDragTarget ? "border-t-2 border-t-blue-400 bg-blue-500/10" : ""
                      }`}
                    >
                      {/* Left Track Metadata & Reorder Controls */}
                      <div className="w-72 sm:w-80 shrink-0 px-2.5 h-full border-r border-white/[0.08] flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-slate-500 hover:text-slate-200 cursor-grab active:cursor-grabbing shrink-0"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 tabular-nums ${trigMeta.badgeClass}`}
                            title={trigMeta.label}
                          >
                            {track.animation.trigger === "onClick"
                              ? `C${track.stepIndex}`
                              : "↳"}
                          </span>
                          <span className="text-[11px] font-medium text-slate-200 truncate">
                            {track.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTrackStep(track.id, -1);
                            }}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            title="Move earlier"
                            aria-label="Move animation step earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === tracks.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveTrackStep(track.id, 1);
                            }}
                            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            title="Move later"
                            aria-label="Move animation step later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right Visual Duration & Delay Timeline Lane */}
                      <div className="flex-1 h-full relative overflow-hidden">
                        {/* Vertical Gridlines */}
                        {tickMarks.map((ms) => (
                          <div
                            key={ms}
                            className="absolute top-0 bottom-0 border-l border-white/[0.04] pointer-events-none"
                            style={{ left: `${(ms / scaleMaxMs) * 100}%` }}
                          />
                        ))}

                        {/* Delay Lead-In Bar */}
                        {delayMs > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-l border border-dashed border-slate-500/60 bg-slate-600/20 pointer-events-none"
                            style={{
                              left: `${delayLeftPct}%`,
                              width: `${delayWidthPct}%`,
                            }}
                            title={`Delay: ${delayMs}ms`}
                          />
                        )}

                        {/* Duration Bar */}
                        <div
                          className={`absolute top-1.5 bottom-1.5 rounded-md border px-2 flex items-center justify-between text-[10px] font-medium shadow-sm overflow-hidden whitespace-nowrap ${trigMeta.barClass} ${
                            isSelected ? "ring-1 ring-white/80" : ""
                          }`}
                          style={{
                            left: `${barLeftPct}%`,
                            width: `${barWidthPct}%`,
                          }}
                          title={`${track.label} • ${trigMeta.label} • ${track.animation.effect} (${track.animation.duration}ms, +${track.animation.delay}ms delay)`}
                        >
                          <span className="truncate">{track.animation.effect}</span>
                          <span className="ml-1.5 font-mono tabular-nums opacity-85 text-[9px] shrink-0">
                            {track.animation.duration}ms
                          </span>
                        </div>

                        {/* Live Playhead Needle */}
                        {isPlaying && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)] pointer-events-none z-10"
                            style={{ left: `${(playheadMs / scaleMaxMs) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
