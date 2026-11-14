import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Mic,
  Clock,
  CircleDot,
  RotateCcw,
  Sparkles,
  Layers,
  MoveRight,
  RotateCw,
  Ban,
  Check,
  ListOrdered,
  MonitorPlay,
  Columns2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SlideData, Language, PresentationTheme, SlideTransition } from "../types";
import { SlideCanvas } from "./SlideCanvas";
import { PresenterView } from "./PresenterView";
import { getJapaneseFallbackText } from "../utils/translationDictionary";
import { buildSlideAnimationSchedule } from "../utils/componentAnimation";
import {
  createPresenterSenderId,
  openPresenterBroadcastChannel,
  PresenterSyncMessage,
} from "../utils/presenterChannel";

export type TransitionEffect = SlideTransition;

interface TransitionOption {
  id: TransitionEffect;
  nameEn: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
}

const TRANSITION_OPTIONS: TransitionOption[] = [
  {
    id: "fade",
    nameEn: "Fade",
    desc: "Soft opacity cross-fade",
    icon: Sparkles,
  },
  {
    id: "slide-in",
    nameEn: "Slide-In",
    desc: "Directional horizontal slide push",
    icon: MoveRight,
  },
  {
    id: "wipe",
    nameEn: "Wipe",
    desc: "Horizontal CSS reveal wipe",
    icon: Layers,
  },
  {
    id: "zoom",
    nameEn: "Zoom In",
    desc: "Dynamic scale and smooth fade-in",
    icon: Maximize2,
  },
  {
    id: "flip",
    nameEn: "Flip 3D",
    desc: "Dimensional perspective card flip",
    icon: RotateCw,
  },
  {
    id: "none",
    nameEn: "None",
    desc: "Instant cut with zero delay",
    icon: Ban,
  },
];

interface PresentationModeProps {
  slides: SlideData[];
  initialIndex: number;
  language: Language;
  theme: PresentationTheme;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  slides,
  initialIndex,
  language,
  theme,
  onClose,
  onLanguageChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<number>(1);
  const [showNotes, setShowNotes] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ xPct: 50, yPct: 50 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [transitionDropdownOpen, setTransitionDropdownOpen] = useState(false);

  // Dual-screen Presenter View states
  const [splitPresenterOpen, setSplitPresenterOpen] = useState(false);
  const [windowPresenterOpen, setWindowPresenterOpen] = useState(false);
  const [teleprompterActiveInSplit, setTeleprompterActiveInSplit] = useState(false);

  const sessionIdRef = useRef<string>(`pres_${Date.now()}`);
  const senderIdRef = useRef<string>(createPresenterSenderId("audience"));
  const channelRef = useRef<BroadcastChannel | null>(null);
  const presenterWindowRef = useRef<Window | null>(null);

  // Transition effect with localStorage persistence
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>(() => {
    try {
      const saved = localStorage.getItem("kind_2026_presentation_transition");
      if (saved && ["fade", "slide-in", "wipe", "zoom", "flip", "none"].includes(saved)) {
        return saved as TransitionEffect;
      }
    } catch {
      // ignore
    }
    return "fade";
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const slideStageRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save transition preference
  useEffect(() => {
    try {
      localStorage.setItem("kind_2026_presentation_transition", transitionEffect);
    } catch {
      // ignore
    }
  }, [transitionEffect]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTransitionDropdownOpen(false);
      }
    };
    if (transitionDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [transitionDropdownOpen]);

  const currentSlide = slides[currentIndex] || slides[0];
  const totalBuildInItems = React.useMemo(
    () => buildSlideAnimationSchedule(currentSlide, language).totalSteps,
    [currentSlide, language]
  );

  const [buildInStep, setBuildInStep] = useState<number>(0);
  const [buildInEnabled, setBuildInEnabled] = useState<boolean>(true);
  const slideBuildInActive =
    buildInEnabled && currentSlide?.buildInConfig?.enabled !== false && totalBuildInItems > 0;

  // Reset build-in step on slide index change, and auto-play if sequenceMode === "auto"
  useEffect(() => {
    setBuildInStep(0);
    if (
      buildInEnabled &&
      currentSlide?.buildInConfig?.enabled !== false &&
      currentSlide?.buildInConfig?.sequenceMode === "auto" &&
      totalBuildInItems > 0
    ) {
      const delayMs = Math.max(150, (currentSlide.buildInConfig.staggerDelay || 0.25) * 1000 + 250);
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        setBuildInStep(step);
        if (step >= totalBuildInItems) {
          clearInterval(timer);
        }
      }, delayMs);
      return () => clearInterval(timer);
    }
  }, [
    currentIndex,
    buildInEnabled,
    totalBuildInItems,
    currentSlide?.buildInConfig?.enabled,
    currentSlide?.buildInConfig?.sequenceMode,
    currentSlide?.buildInConfig?.staggerDelay,
  ]);

  // Step-wise and slide navigation with direction tracking
  const handleNext = useCallback(() => {
    if (slideBuildInActive && buildInStep < totalBuildInItems) {
      setBuildInStep((prev) => prev + 1);
    } else if (currentIndex < slides.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [slideBuildInActive, buildInStep, totalBuildInItems, currentIndex, slides.length]);

  const handlePrev = useCallback(() => {
    if (slideBuildInActive && buildInStep > 0) {
      setBuildInStep((prev) => prev - 1);
    } else if (currentIndex > 0) {
      const prevSlide = slides[currentIndex - 1];
      const prevItems = prevSlide?.bullets?.length || prevSlide?.stats?.length || 0;
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      if (buildInEnabled && prevSlide?.buildInConfig?.enabled !== false) {
        setBuildInStep(prevItems);
      }
    }
  }, [slideBuildInActive, buildInStep, currentIndex, slides, buildInEnabled]);

  const handleGotoSlide = useCallback(
    (targetIdx: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, targetIdx));
      if (clamped === currentIndex) return;
      setDirection(clamped > currentIndex ? 1 : -1);
      setCurrentIndex(clamped);
    },
    [currentIndex, slides.length]
  );

  // Latest state ref for BroadcastChannel responder
  const latestStateRef = useRef({
    currentIndex,
    buildInStep,
    buildInEnabled,
    language,
    themeId: theme.id,
    secondsElapsed,
    timerRunning,
    slides,
    laserActive,
    laserPos,
  });

  useEffect(() => {
    latestStateRef.current = {
      currentIndex,
      buildInStep,
      buildInEnabled,
      language,
      themeId: theme.id,
      secondsElapsed,
      timerRunning,
      slides,
      laserActive,
      laserPos,
    };
  }, [
    currentIndex,
    buildInStep,
    buildInEnabled,
    language,
    theme.id,
    secondsElapsed,
    timerRunning,
    slides,
    laserActive,
    laserPos,
  ]);

  const navActionsRef = useRef({
    handleNext,
    handlePrev,
    handleGotoSlide,
  });
  useEffect(() => {
    navActionsRef.current = { handleNext, handlePrev, handleGotoSlide };
  }, [handleNext, handlePrev, handleGotoSlide]);

  // Open & listen on BroadcastChannel
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const channel = openPresenterBroadcastChannel(sessionId);
    channelRef.current = channel;
    if (!channel) return;

    const handleMessage = (event: MessageEvent<PresenterSyncMessage>) => {
      const msg = event.data;
      if (!msg || msg.senderId === senderIdRef.current) return;
      if (msg.sessionId && msg.sessionId !== sessionId) return;

      if (msg.type === "SYNC_REQUEST") {
        const s = latestStateRef.current;
        channel.postMessage({
          type: "STATE_SYNC",
          senderId: senderIdRef.current,
          sessionId,
          currentIndex: s.currentIndex,
          buildInStep: s.buildInStep,
          buildInEnabled: s.buildInEnabled,
          language: s.language,
          themeId: s.themeId,
          secondsElapsed: s.secondsElapsed,
          timerRunning: s.timerRunning,
          slides: s.slides,
        } satisfies PresenterSyncMessage);
        channel.postMessage({
          type: "LASER_SYNC",
          senderId: senderIdRef.current,
          sessionId,
          active: s.laserActive,
          xPct: s.laserPos.xPct,
          yPct: s.laserPos.yPct,
        } satisfies PresenterSyncMessage);
      } else if (msg.type === "COMMAND") {
        switch (msg.action) {
          case "next":
            navActionsRef.current.handleNext();
            break;
          case "prev":
            navActionsRef.current.handlePrev();
            break;
          case "goto":
            if (typeof msg.targetIndex === "number") {
              navActionsRef.current.handleGotoSlide(msg.targetIndex);
            }
            break;
          case "reset-timer":
            setSecondsElapsed(0);
            break;
          case "toggle-timer":
            setTimerRunning((prev) => !prev);
            break;
          case "toggle-buildin":
            setBuildInEnabled((prev) => !prev);
            break;
          case "toggle-laser":
            setLaserActive((prev) => !prev);
            break;
          case "close-presenter":
            setSplitPresenterOpen(false);
            break;
        }
      } else if (msg.type === "LASER_SYNC") {
        setLaserActive(msg.active);
        setLaserPos({ xPct: msg.xPct, yPct: msg.yPct });
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Broadcast state updates whenever presentation state changes
  useEffect(() => {
    channelRef.current?.postMessage({
      type: "STATE_SYNC",
      senderId: senderIdRef.current,
      sessionId: sessionIdRef.current,
      currentIndex,
      buildInStep,
      buildInEnabled,
      language,
      themeId: theme.id,
      secondsElapsed,
      timerRunning,
      slides,
    } satisfies PresenterSyncMessage);
  }, [currentIndex, buildInStep, buildInEnabled, language, theme.id, timerRunning, slides]);

  // Broadcast laser active toggle
  useEffect(() => {
    channelRef.current?.postMessage({
      type: "LASER_SYNC",
      senderId: senderIdRef.current,
      sessionId: sessionIdRef.current,
      active: laserActive,
      xPct: laserPos.xPct,
      yPct: laserPos.yPct,
    } satisfies PresenterSyncMessage);
  }, [laserActive]);

  // Track if secondary presenter window closes
  useEffect(() => {
    if (!windowPresenterOpen) return;
    const interval = setInterval(() => {
      if (!presenterWindowRef.current || presenterWindowRef.current.closed) {
        presenterWindowRef.current = null;
        setWindowPresenterOpen(false);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [windowPresenterOpen]);

  // Close secondary window on PresentationMode exit
  useEffect(() => {
    return () => {
      if (presenterWindowRef.current && !presenterWindowRef.current.closed) {
        try {
          presenterWindowRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleLaunchPresenterWindow = () => {
    if (splitPresenterOpen) {
      setSplitPresenterOpen(false);
      return;
    }

    if (presenterWindowRef.current && !presenterWindowRef.current.closed) {
      presenterWindowRef.current.focus();
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("presenter", "1");
      url.searchParams.set("session", sessionIdRef.current);
      url.searchParams.set("slideIndex", String(currentIndex));
      url.searchParams.set("lang", language);
      url.searchParams.set("theme", theme.id);

      const popup = window.open(
        url.toString(),
        "kind_presenter_view",
        "width=1360,height=840,menubar=no,toolbar=no,location=no,status=no"
      );

      if (popup && !popup.closed) {
        presenterWindowRef.current = popup;
        setWindowPresenterOpen(true);
        return;
      }
    } catch {
      // Blocked by iframe sandbox -> fall back to split-screen mode
    }

    setSplitPresenterOpen(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        // When Teleprompter is active in Split-Screen Presenter View, Spacebar controls Play/Pause
        if (splitPresenterOpen && teleprompterActiveInSplit) {
          return;
        }
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key.toLowerCase() === "n") {
        setShowNotes((prev) => !prev);
      } else if (e.key.toLowerCase() === "l") {
        setLaserActive((prev) => !prev);
      } else if (e.key.toLowerCase() === "t") {
        setTransitionDropdownOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === "b") {
        setBuildInEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose, splitPresenterOpen, teleprompterActiveInSplit]);

  // Timer effect
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserActive || !slideStageRef.current) return;
    const rect = slideStageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLaserPos({ xPct, yPct });
    channelRef.current?.postMessage({
      type: "LASER_SYNC",
      senderId: senderIdRef.current,
      sessionId: sessionIdRef.current,
      active: true,
      xPct,
      yPct,
    } satisfies PresenterSyncMessage);
  };

  // Prioritize slide-specific transition effect if configured, otherwise presentation default
  const effectiveTransition: SlideTransition = currentSlide.transition || transitionEffect || "fade";
  const currentTransition =
    TRANSITION_OPTIONS.find((t) => t.id === effectiveTransition) || TRANSITION_OPTIONS[0];
  const TransitionIcon = currentTransition.icon;

  // Animation variants based on transition effect
  const getVariants = (effect: TransitionEffect) => {
    switch (effect) {
      case "slide-in":
        return {
          initial: (dir: number) => ({
            x: dir > 0 ? "100%" : "-100%",
            opacity: 0.85,
          }),
          animate: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
          },
          exit: (dir: number) => ({
            x: dir > 0 ? "-100%" : "100%",
            opacity: 0.85,
            transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          }),
        };

      case "wipe":
        return {
          initial: (dir: number) => ({
            clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
            opacity: 1,
          }),
          animate: {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
          },
          exit: (dir: number) => ({
            clipPath: dir > 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
            opacity: 0.9,
            transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
          }),
        };

      case "zoom":
        return {
          initial: { scale: 0.88, opacity: 0 },
          animate: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.32, ease: "easeOut" },
          },
          exit: {
            scale: 1.08,
            opacity: 0,
            transition: { duration: 0.25, ease: "easeIn" },
          },
        };

      case "flip":
        return {
          initial: (dir: number) => ({
            rotateY: dir > 0 ? 80 : -80,
            opacity: 0,
            scale: 0.9,
          }),
          animate: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          },
          exit: (dir: number) => ({
            rotateY: dir > 0 ? -80 : 80,
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          }),
        };

      case "none":
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1, transition: { duration: 0 } },
          exit: { opacity: 1, transition: { duration: 0 } },
        };

      case "fade":
      default:
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: { duration: 0.32, ease: "easeInOut" },
          },
          exit: {
            opacity: 0,
            transition: { duration: 0.25, ease: "easeInOut" },
          },
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Floating Controls Bar */}
      <div className="h-12 px-4 sm:px-6 flex items-center justify-between bg-[#151921]/90 backdrop-blur-md border-b border-white/[0.08] z-50 shrink-0 gap-2">
        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-300 min-w-0">
          <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono tabular-nums shadow-xs shrink-0">
            {currentIndex + 1} / {slides.length}
          </span>
          <span className="truncate max-w-sm hidden md:inline text-slate-200">
            {language === "ko"
              ? currentSlide.titleKo
              : language === "ja"
              ? currentSlide.titleJa || getJapaneseFallbackText(currentSlide.titleKo || currentSlide.titleId)
              : currentSlide.titleId || currentSlide.titleKo}
          </span>
        </div>

        {/* Center tools: Language switch & Timer & Transition Selector */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {/* Language Switch */}
          <div className="hidden sm:flex items-center bg-[#11141c] rounded-lg p-0.5 border border-white/[0.08] text-[11px] font-mono">
            {(["en", "ko", "ja", "id", "dual"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                id={`btn-pres-lang-${lang}`}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-1 rounded transition cursor-pointer uppercase ${
                  language === lang
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
                title={`${lang.toUpperCase()} Language View`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Slide Transition Effect Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="btn-pres-transition"
              onClick={() => setTransitionDropdownOpen(!transitionDropdownOpen)}
              className={`p-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center space-x-1 ${
                transitionDropdownOpen
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-200 ring-1 ring-blue-500/30"
                  : "bg-[#11141c] hover:bg-white/5 text-slate-200 border-white/[0.08]"
              }`}
              title={`Transition Effect: ${currentTransition.nameEn} (T)`}
              aria-label={`Transition Effect: ${currentTransition.nameEn}`}
            >
              <TransitionIcon className="w-4 h-4 text-blue-400" />
            </button>

            {transitionDropdownOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 w-64 bg-[#151921] border border-white/[0.12] rounded-xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-md">
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/[0.08] pb-1.5 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Slide Transitions
                    </span>
                  </div>
                  <kbd className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono border border-white/[0.08]">
                    T
                  </kbd>
                </div>

                <div className="space-y-1">
                  {TRANSITION_OPTIONS.map((opt) => {
                    const isSelected = effectiveTransition === opt.id;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTransitionEffect(opt.id);
                          setTransitionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition group cursor-pointer ${
                          isSelected
                            ? "bg-blue-600/20 border border-blue-500/30 text-blue-200 font-semibold"
                            : "hover:bg-white/5 text-slate-300 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 pr-2">
                          <div
                            className={`p-1.5 rounded-lg transition ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-[#11141c] text-slate-400 group-hover:text-white group-hover:bg-white/5"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-200 group-hover:text-white">
                                {opt.nameEn}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {opt.desc}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stopwatch */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#11141c] border border-white/[0.08] font-mono text-xs tabular-nums text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>{formatTime(secondsElapsed)}</span>
            <button
              type="button"
              id="btn-pres-timer-reset"
              onClick={() => setSecondsElapsed(0)}
              className="text-slate-500 hover:text-slate-300 p-0.5 transition cursor-pointer"
              title="Reset Stopwatch"
              aria-label="Reset Stopwatch"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>

          {/* Component Build-In Step Tracker & Toggle (B) */}
          {totalBuildInItems > 0 && (
            <button
              type="button"
              id="btn-pres-buildin"
              onClick={() => setBuildInEnabled(!buildInEnabled)}
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono tabular-nums transition cursor-pointer ${
                buildInEnabled
                  ? "bg-violet-600/25 border-violet-500/50 text-violet-200 ring-1 ring-violet-500/30"
                  : "bg-[#11141c] border-white/[0.08] text-slate-400 hover:text-white"
              }`}
              title={`Component Build-In Sequence: ${buildInEnabled ? "Active" : "Disabled"} (B)`}
              aria-label="Toggle Component Build-In"
            >
              <ListOrdered className="w-3.5 h-3.5 text-violet-400" />
              <span>
                {buildInEnabled ? `Step ${buildInStep}/${totalBuildInItems}` : "Steps Off"}
              </span>
            </button>
          )}
        </div>

        {/* Right Tools: Presenter View, Split Screen, Laser, Notes & Exit */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            id="btn-pres-presenter-view"
            onClick={handleLaunchPresenterWindow}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              windowPresenterOpen || splitPresenterOpen
                ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                : "bg-[#11141c] border-white/[0.08] text-slate-200 hover:text-white hover:bg-white/5"
            }`}
            title="Open Synchronized Presenter View Window (falls back to Split-Screen if popups are blocked)"
          >
            <MonitorPlay className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Presenter View</span>
          </button>

          <button
            type="button"
            id="btn-pres-split-view"
            onClick={() => setSplitPresenterOpen((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs flex items-center transition cursor-pointer ${
              splitPresenterOpen
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-[#11141c] border-white/[0.08] text-slate-400 hover:text-white"
            }`}
            title="Toggle Split-Screen Presenter View"
            aria-label="Toggle Split-Screen Presenter View"
          >
            <Columns2 className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            id="btn-pres-laser"
            onClick={() => setLaserActive(!laserActive)}
            className={`p-1.5 rounded-lg border text-xs flex items-center transition cursor-pointer ${
              laserActive
                ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/50"
                : "bg-[#11141c] border-white/[0.08] text-slate-400 hover:text-white"
            }`}
            title="Laser Pointer (L)"
            aria-label="Laser Pointer"
          >
            <CircleDot className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            id="btn-pres-notes"
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded-lg border text-xs flex items-center transition cursor-pointer ${
              showNotes
                ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                : "bg-[#11141c] border-white/[0.08] text-slate-400 hover:text-white"
            }`}
            title="Quick Notes Drawer (N)"
            aria-label="Quick Notes Drawer"
          >
            <Mic className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            id="btn-pres-exit"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#11141c] hover:bg-white/10 border border-white/[0.08] text-slate-300 hover:text-white transition cursor-pointer"
            title="Exit Presentation (ESC)"
            aria-label="Exit Presentation"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main Presentation Stage (Full Audience Screen OR Split Audience + Presenter View) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Audience Display Pane */}
        <div
          className={`${
            splitPresenterOpen ? "lg:w-[40%] border-b lg:border-b-0 lg:border-r border-white/[0.1] p-4" : "flex-1 p-4 sm:p-8"
          } flex flex-col items-center justify-center relative overflow-hidden bg-black`}
        >
          {splitPresenterOpen && (
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Audience Window
              </span>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                Slide {currentIndex + 1}/{slides.length}
              </span>
            </div>
          )}

          <div
            ref={slideStageRef}
            onMouseMove={handleStageMouseMove}
            className={`w-full ${
              splitPresenterOpen ? "max-w-2xl" : "max-w-6xl max-h-[85vh]"
            } aspect-video flex items-center justify-center shadow-2xl relative overflow-hidden rounded-2xl border border-gray-800/60 bg-black/40 ${
              laserActive ? "cursor-crosshair" : ""
            }`}
            style={{ perspective: "1200px" }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide.id || currentIndex}
                custom={direction}
                variants={getVariants(effectiveTransition)}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                <SlideCanvas
                  slide={currentSlide}
                  language={language}
                  theme={theme}
                  totalSlides={slides.length}
                  currentSlideIndex={currentIndex}
                  buildInStep={slideBuildInActive ? buildInStep : undefined}
                />
              </motion.div>
            </AnimatePresence>

            {/* Synchronized Percentage-Based Laser Pointer Overlay */}
            {laserActive && (
              <div
                className="absolute pointer-events-none z-[100] w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-red-500 shadow-[0_0_15px_6px_rgba(239,68,68,0.85)] transition-[left,top] duration-75 ease-out"
                style={{
                  left: `${laserPos.xPct}%`,
                  top: `${laserPos.yPct}%`,
                }}
              />
            )}
          </div>

          {!splitPresenterOpen && (
            <>
              <button
                type="button"
                id="btn-pres-prev-slide"
                onClick={handlePrev}
                disabled={currentIndex === 0 && (!slideBuildInActive || buildInStep === 0)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur disabled:opacity-0 transition z-40 cursor-pointer"
                title="Previous (Left Arrow / Backspace)"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                id="btn-pres-next-slide"
                onClick={handleNext}
                disabled={
                  currentIndex === slides.length - 1 &&
                  (!slideBuildInActive || buildInStep >= totalBuildInItems)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur disabled:opacity-0 transition z-40 cursor-pointer"
                title="Next (Right Arrow / Space / Enter)"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Synchronized Split-Screen Presenter View Pane */}
        {splitPresenterOpen && (
          <div className="flex-1 lg:w-[60%] h-full overflow-hidden">
            <PresenterView
              slides={slides}
              theme={theme}
              language={language}
              sessionId={sessionIdRef.current}
              mode="split"
              initialIndex={currentIndex}
              initialBuildInStep={buildInStep}
              initialBuildInEnabled={buildInEnabled}
              initialSecondsElapsed={secondsElapsed}
              initialTimerRunning={timerRunning}
              initialLaserActive={laserActive}
              onClose={() => setSplitPresenterOpen(false)}
              onTeleprompterActiveChange={setTeleprompterActiveInSplit}
            />
          </div>
        )}
      </div>

      {/* Quick Presenter Notes Overlay Drawer */}
      {showNotes && !splitPresenterOpen && (
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/95 border-t border-purple-800/60 backdrop-blur p-4 z-50 text-slate-200 max-h-48 overflow-y-auto">
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div className="space-y-1 flex-1 pr-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5" />
                <span>Presenter Notes (Slide {currentIndex + 1})</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-300">
                {language === "ko"
                  ? currentSlide.notesKo || currentSlide.notesId || "No presenter notes recorded for this slide."
                  : language === "ja"
                  ? currentSlide.notesJa || getJapaneseFallbackText(currentSlide.notesKo || currentSlide.notesId) || "No presenter notes recorded for this slide."
                  : currentSlide.notesId || currentSlide.notesKo || "No presenter notes recorded for this slide."}
              </p>
            </div>
            <button
              type="button"
              id="btn-close-notes"
              onClick={() => setShowNotes(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Close Notes"
              aria-label="Close Notes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
