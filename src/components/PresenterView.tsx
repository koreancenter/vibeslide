import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CircleDot,
  ListOrdered,
  Mic,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  ScrollText,
  X,
} from "lucide-react";
import { Language, PresentationTheme, SlideData } from "../types";
import { SlideCanvas } from "./SlideCanvas";
import { PRESENTATION_THEMES } from "../data/themes";
import { getJapaneseFallbackText } from "../utils/translationDictionary";
import {
  createPresenterSenderId,
  openPresenterBroadcastChannel,
  PresenterCommandAction,
  PresenterSyncMessage,
} from "../utils/presenterChannel";

interface ScaledSlideFrameProps {
  slide: SlideData;
  language: Language;
  theme: PresentationTheme;
  totalSlides: number;
  slideIndex: number;
  buildInStep?: number;
  laserActive?: boolean;
  laserPos?: { xPct: number; yPct: number };
  onLaserMove?: (xPct: number, yPct: number) => void;
  onLaserLeave?: () => void;
}

const ScaledSlideFrame: React.FC<ScaledSlideFrameProps> = ({
  slide,
  language,
  theme,
  totalSlides,
  slideIndex,
  buildInStep,
  laserActive = false,
  laserPos,
  onLaserMove,
  onLaserLeave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / 1024);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserActive || !onLaserMove || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onLaserMove(xPct, yPct);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={onLaserLeave}
      className={`w-full aspect-video relative overflow-hidden rounded-lg bg-black ${
        laserActive && onLaserMove ? "cursor-crosshair" : ""
      }`}
    >
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{
          width: "1024px",
          height: "576px",
          transform: `scale(${scale})`,
        }}
      >
        <SlideCanvas
          slide={slide}
          language={language}
          theme={theme}
          totalSlides={totalSlides}
          currentSlideIndex={slideIndex}
          buildInStep={buildInStep}
        />
      </div>

      {laserActive && laserPos && (
        <div
          className="absolute pointer-events-none z-40 w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.85)]"
          style={{
            left: `${laserPos.xPct}%`,
            top: `${laserPos.yPct}%`,
          }}
        />
      )}
    </div>
  );
};

export interface PresenterViewProps {
  slides: SlideData[];
  theme: PresentationTheme;
  language: Language;
  sessionId?: string;
  mode?: "window" | "split";
  initialIndex?: number;
  initialBuildInStep?: number;
  initialBuildInEnabled?: boolean;
  initialSecondsElapsed?: number;
  initialTimerRunning?: boolean;
  initialLaserActive?: boolean;
  onClose?: () => void;
  onTeleprompterActiveChange?: (active: boolean) => void;
}

const FONT_SIZE_STORAGE_KEY = "kind_presenter_notes_font_size";
const WPM_STORAGE_KEY = "kind_presenter_teleprompter_wpm";

function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export const PresenterView: React.FC<PresenterViewProps> = ({
  slides: initialSlides,
  theme: initialTheme,
  language: initialLanguage,
  sessionId = "default",
  mode = "window",
  initialIndex = 0,
  initialBuildInStep = 0,
  initialBuildInEnabled = true,
  initialSecondsElapsed = 0,
  initialTimerRunning = true,
  initialLaserActive = false,
  onClose,
  onTeleprompterActiveChange,
}) => {
  const senderIdRef = useRef<string>(createPresenterSenderId("presenter"));
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [slides, setSlides] = useState<SlideData[]>(initialSlides);
  const [theme, setTheme] = useState<PresentationTheme>(initialTheme);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [buildInStep, setBuildInStep] = useState<number>(initialBuildInStep);
  const [buildInEnabled, setBuildInEnabled] = useState<boolean>(initialBuildInEnabled);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(initialSecondsElapsed);
  const [timerRunning, setTimerRunning] = useState<boolean>(initialTimerRunning);
  const [laserActive, setLaserActive] = useState<boolean>(initialLaserActive);
  const [laserPos, setLaserPos] = useState<{ xPct: number; yPct: number }>({ xPct: 50, yPct: 50 });
  const [isSyncedWithAudience, setIsSyncedWithAudience] = useState<boolean>(mode === "split");

  // Keep props updated in split-screen mode
  useEffect(() => {
    setSlides(initialSlides);
  }, [initialSlides]);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  // Live wall-clock time
  const [wallClock, setWallClock] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setWallClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Local fallback elapsed timer tick (smoothed by periodic STATE_SYNC from Audience)
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Notes typography & Teleprompter state
  const [notesFontSize, setNotesFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : 22;
      return !isNaN(parsed) ? Math.max(14, Math.min(44, parsed)) : 22;
    } catch {
      return 22;
    }
  });

  const [teleprompterMode, setTeleprompterMode] = useState<boolean>(false);
  const [teleprompterPlaying, setTeleprompterPlaying] = useState<boolean>(false);
  const [teleprompterWpm, setTeleprompterWpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(WPM_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : 140;
      return !isNaN(parsed) ? Math.max(60, Math.min(300, parsed)) : 140;
    } catch {
      return 140;
    }
  });

  const notesViewportRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(notesFontSize));
    } catch {
      // ignore
    }
  }, [notesFontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(WPM_STORAGE_KEY, String(teleprompterWpm));
    } catch {
      // ignore
    }
  }, [teleprompterWpm]);

  useEffect(() => {
    onTeleprompterActiveChange?.(teleprompterMode);
    if (!teleprompterMode) {
      setTeleprompterPlaying(false);
    }
  }, [teleprompterMode, onTeleprompterActiveChange]);

  // Setup BroadcastChannel connection
  useEffect(() => {
    const channel = openPresenterBroadcastChannel(sessionId);
    channelRef.current = channel;
    if (!channel) return;

    const handleMessage = (event: MessageEvent<PresenterSyncMessage>) => {
      const msg = event.data;
      if (!msg || msg.senderId === senderIdRef.current) return;
      if (msg.sessionId && sessionId && msg.sessionId !== sessionId) return;

      if (msg.type === "STATE_SYNC") {
        setIsSyncedWithAudience(true);
        setCurrentIndex(msg.currentIndex);
        setBuildInStep(msg.buildInStep);
        setBuildInEnabled(msg.buildInEnabled);
        setLanguage(msg.language);
        setSecondsElapsed(msg.secondsElapsed);
        setTimerRunning(msg.timerRunning);
        if (msg.slides && msg.slides.length > 0) {
          setSlides(msg.slides);
        }
        if (msg.themeId) {
          const matched = PRESENTATION_THEMES.find((t) => t.id === msg.themeId);
          if (matched) setTheme(matched);
        }
      } else if (msg.type === "LASER_SYNC") {
        setLaserActive(msg.active);
        setLaserPos({ xPct: msg.xPct, yPct: msg.yPct });
      }
    };

    channel.addEventListener("message", handleMessage);

    // Ask audience window for initial state handshake
    channel.postMessage({
      type: "SYNC_REQUEST",
      senderId: senderIdRef.current,
      sessionId,
    } satisfies PresenterSyncMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [sessionId]);

  const sendCommand = useCallback(
    (action: PresenterCommandAction, targetIndex?: number) => {
      channelRef.current?.postMessage({
        type: "COMMAND",
        senderId: senderIdRef.current,
        sessionId,
        action,
        targetIndex,
      } satisfies PresenterSyncMessage);
    },
    [sessionId]
  );

  const handleBroadcastLaserMove = useCallback(
    (xPct: number, yPct: number) => {
      setLaserPos({ xPct, yPct });
      channelRef.current?.postMessage({
        type: "LASER_SYNC",
        senderId: senderIdRef.current,
        sessionId,
        active: true,
        xPct,
        yPct,
      } satisfies PresenterSyncMessage);
    },
    [sessionId]
  );

  const currentSlide = slides[currentIndex] || slides[0];
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null;
  const totalBuildInItems =
    currentSlide?.bullets?.length || currentSlide?.stats?.length || 0;
  const slideBuildInActive =
    buildInEnabled && currentSlide?.buildInConfig?.enabled !== false && totalBuildInItems > 0;

  const speakerNotes = useMemo(() => {
    if (!currentSlide) return "";
    if (language === "ko") {
      return currentSlide.notesKo || currentSlide.notesId || "";
    }
    if (language === "ja") {
      return (
        currentSlide.notesJa ||
        getJapaneseFallbackText(currentSlide.notesKo || currentSlide.notesId) ||
        currentSlide.notesId ||
        currentSlide.notesKo ||
        ""
      );
    }
    return currentSlide.notesId || currentSlide.notesKo || "";
  }, [currentSlide, language]);

  const wordCount = useMemo(() => countWords(speakerNotes), [speakerNotes]);
  const estSeconds = wordCount > 0 ? Math.max(3, Math.round((wordCount / teleprompterWpm) * 60)) : 0;

  // Reset teleprompter scroll when slide changes
  useEffect(() => {
    scrollPosRef.current = 0;
    if (notesViewportRef.current) {
      notesViewportRef.current.scrollTop = 0;
    }
  }, [currentIndex]);

  // Smooth auto-scroll animation loop for Teleprompter mode
  useEffect(() => {
    if (!teleprompterMode || !teleprompterPlaying) {
      lastFrameTimeRef.current = null;
      return;
    }

    let rafId = 0;

    const tick = (now: number) => {
      const el = notesViewportRef.current;
      if (!el) return;

      if (lastFrameTimeRef.current !== null) {
        const dtSec = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
        const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
        if (maxScroll > 0) {
          // Estimate duration based on WPM & word count, with comfortable fallback for CJK/short text
          const effectiveWords = Math.max(wordCount, Math.round(speakerNotes.length / 4));
          const durationSec = Math.max(4, (effectiveWords / teleprompterWpm) * 60);
          const pxPerSec = maxScroll / durationSec;
          scrollPosRef.current = Math.min(maxScroll, scrollPosRef.current + pxPerSec * dtSec);
          el.scrollTop = scrollPosRef.current;

          if (scrollPosRef.current >= maxScroll) {
            setTeleprompterPlaying(false);
            lastFrameTimeRef.current = null;
            return;
          }
        }
      }

      lastFrameTimeRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    if (notesViewportRef.current) {
      scrollPosRef.current = notesViewportRef.current.scrollTop;
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      lastFrameTimeRef.current = null;
    };
  }, [teleprompterMode, teleprompterPlaying, teleprompterWpm, wordCount, speakerNotes.length]);

  const handleResetTeleprompter = () => {
    scrollPosRef.current = 0;
    if (notesViewportRef.current) {
      notesViewportRef.current.scrollTop = 0;
    }
  };

  // Keyboard shortcuts inside PresenterView
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (targetTag === "input" && (e.target as HTMLInputElement).type !== "range") return;

      if (e.key === " " || e.code === "Space") {
        if (teleprompterMode) {
          e.preventDefault();
          e.stopPropagation();
          setTeleprompterPlaying((prev) => !prev);
        } else if (mode === "window") {
          e.preventDefault();
          sendCommand("next");
        }
      } else if (mode === "window") {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "Enter") {
          e.preventDefault();
          sendCommand("next");
        } else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") {
          e.preventDefault();
          sendCommand("prev");
        } else if (e.key.toLowerCase() === "l") {
          sendCommand("toggle-laser");
        } else if (e.key === "Escape") {
          if (onClose) onClose();
          else window.close();
        }
      }
    };

    // Capture phase in split mode ensures Spacebar controls teleprompter before PresentationMode
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [teleprompterMode, mode, sendCommand, onClose]);

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rem = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const handleCloseAction = () => {
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  const slideTitle = currentSlide
    ? language === "ko"
      ? currentSlide.titleKo || currentSlide.titleId
      : language === "ja"
      ? currentSlide.titleJa || getJapaneseFallbackText(currentSlide.titleKo || currentSlide.titleId) || currentSlide.titleId
      : currentSlide.titleId || currentSlide.titleKo
    : "";

  const nextSlideTitle = nextSlide
    ? language === "ko"
      ? nextSlide.titleKo || nextSlide.titleId
      : language === "ja"
      ? nextSlide.titleJa || getJapaneseFallbackText(nextSlide.titleKo || nextSlide.titleId) || nextSlide.titleId
      : nextSlide.titleId || nextSlide.titleKo
    : "";

  return (
    <div className="w-full h-full bg-[#090b10] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Bar: Elapsed Timer, Wall-Clock Time, Slide Navigation */}
      <header className="h-13 px-4 flex items-center justify-between bg-[#111520] border-b border-white/[0.08] shrink-0 gap-3">
        {/* Left: Mode badge + Current Slide Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-600/15 border border-blue-500/30 shrink-0">
            <MonitorPlay className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-200 whitespace-nowrap">
              Presenter View
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSyncedWithAudience ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
              title={isSyncedWithAudience ? "Synchronized via BroadcastChannel" : "Waiting for audience sync"}
            />
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              id="btn-presenter-prev"
              onClick={() => sendCommand("prev")}
              disabled={currentIndex === 0 && (!slideBuildInActive || buildInStep === 0)}
              className="p-1.5 rounded-md bg-[#171c2b] hover:bg-white/10 border border-white/[0.08] text-slate-200 disabled:opacity-30 transition cursor-pointer"
              title="Previous Slide / Step"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 py-1 rounded-md bg-[#171c2b] border border-white/[0.08] text-xs font-mono tabular-nums text-slate-200 whitespace-nowrap">
              {currentIndex + 1} / {slides.length}
            </div>
            <button
              type="button"
              id="btn-presenter-next"
              onClick={() => sendCommand("next")}
              disabled={
                currentIndex >= slides.length - 1 &&
                (!slideBuildInActive || buildInStep >= totalBuildInItems)
              }
              className="p-1.5 rounded-md bg-[#171c2b] hover:bg-white/10 border border-white/[0.08] text-slate-200 disabled:opacity-30 transition cursor-pointer"
              title="Next Slide / Step"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {totalBuildInItems > 0 && (
            <button
              type="button"
              onClick={() => sendCommand("toggle-buildin")}
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-mono tabular-nums transition cursor-pointer shrink-0 ${
                buildInEnabled
                  ? "bg-violet-600/20 border-violet-500/40 text-violet-200"
                  : "bg-[#171c2b] border-white/[0.08] text-slate-400 hover:text-white"
              }`}
              title="Toggle Build-In Steps"
            >
              <ListOrdered className="w-3.5 h-3.5 text-violet-400" />
              <span className="whitespace-nowrap">
                {buildInEnabled ? `Step ${buildInStep}/${totalBuildInItems}` : "Steps Off"}
              </span>
            </button>
          )}
        </div>

        {/* Center: Elapsed Timer + Live Wall Clock */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#171c2b] border border-white/[0.08]">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold hidden sm:inline">
              Elapsed
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-emerald-300">
              {formatDuration(secondsElapsed)}
            </span>
            <button
              type="button"
              id="btn-presenter-timer-toggle"
              onClick={() => sendCommand("toggle-timer")}
              className="p-0.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title={timerRunning ? "Pause Timer" : "Resume Timer"}
              aria-label={timerRunning ? "Pause Timer" : "Resume Timer"}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              id="btn-presenter-timer-reset"
              onClick={() => sendCommand("reset-timer")}
              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#171c2b] border border-white/[0.08]">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-mono text-sm font-semibold tabular-nums text-slate-100 whitespace-nowrap">
              {wallClock}
            </span>
          </div>
        </div>

        {/* Right: Laser Pointer + Close */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            id="btn-presenter-laser"
            onClick={() => sendCommand("toggle-laser")}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              laserActive
                ? "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-500/40"
                : "bg-[#171c2b] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/5"
            }`}
            title="Toggle Synchronized Laser Pointer (L)"
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laser</span>
          </button>

          <button
            type="button"
            id="btn-presenter-close"
            onClick={handleCloseAction}
            className="px-2.5 py-1 rounded-md bg-[#171c2b] hover:bg-white/10 border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1 transition cursor-pointer whitespace-nowrap"
            title={mode === "split" ? "Close Split Presenter View" : "Close Presenter Window"}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mode === "split" ? "Close Split" : "Close"}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Presenter Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANEL: Live Current Slide + Next Slide Thumbnail */}
        <section className="lg:w-[54%] flex flex-col p-4 gap-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto bg-[#0b0e15]">
          {/* Current Slide Live View */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 whitespace-nowrap">
                  Current Slide
                </span>
                <span className="text-xs text-slate-400 truncate">{slideTitle}</span>
              </div>
              {laserActive && (
                <span className="text-[10px] font-medium text-rose-300 whitespace-nowrap">
                  Move cursor over slide to point
                </span>
              )}
            </div>

            <div className="rounded-xl p-1.5 bg-[#121622] border border-white/[0.1] shadow-2xl">
              {currentSlide && (
                <ScaledSlideFrame
                  slide={currentSlide}
                  language={language}
                  theme={theme}
                  totalSlides={slides.length}
                  slideIndex={currentIndex}
                  buildInStep={slideBuildInActive ? buildInStep : undefined}
                  laserActive={laserActive}
                  laserPos={laserPos}
                  onLaserMove={handleBroadcastLaserMove}
                />
              )}
            </div>
          </div>

          {/* Next Slide Preview Thumbnail */}
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Next Slide
              </span>
              {nextSlide && (
                <span className="text-xs text-slate-400 truncate max-w-md">{nextSlideTitle}</span>
              )}
            </div>

            {nextSlide ? (
              <div
                role="button"
                tabIndex={0}
                id="btn-presenter-next-thumb"
                onClick={() => sendCommand("goto", currentIndex + 1)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    sendCommand("goto", currentIndex + 1);
                  }
                }}
                className="w-full max-w-md text-left rounded-xl p-1.5 bg-[#121622] hover:border-blue-500/50 border border-white/[0.08] transition cursor-pointer group relative focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                title="Click to jump to next slide"
                aria-label={`Jump to next slide (${currentIndex + 2})`}
              >
                <div className="opacity-90 group-hover:opacity-100 transition-opacity">
                  <ScaledSlideFrame
                    slide={nextSlide}
                    language={language}
                    theme={theme}
                    totalSlides={slides.length}
                    slideIndex={currentIndex + 1}
                  />
                </div>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 border border-white/15 text-[10px] font-mono tabular-nums text-slate-200">
                  Slide {currentIndex + 2}
                </span>
              </div>
            ) : (
              <div className="w-full max-w-md aspect-video rounded-xl bg-[#121622] border border-dashed border-white/[0.12] flex flex-col items-center justify-center text-slate-500 text-xs">
                <span className="font-semibold text-slate-300">End of Presentation</span>
                <span className="text-[11px] mt-1">Final slide reached</span>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Speaker Notes & Auto-Scrolling Teleprompter */}
        <section className="lg:w-[46%] flex flex-col bg-[#0d1018] overflow-hidden">
          {/* Speaker Notes Toolbar */}
          <div className="px-4 py-3 border-b border-white/[0.08] bg-[#111520] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-purple-400 shrink-0" />
              <h2 className="text-sm font-semibold text-slate-100 whitespace-nowrap">
                Speaker Notes
              </h2>
              {wordCount > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                  {wordCount}w · ~{estSeconds}s
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Font Size Controls A- / A+ */}
              <div className="flex items-center bg-[#171c2b] border border-white/[0.08] rounded-md p-0.5">
                <button
                  type="button"
                  id="btn-notes-font-dec"
                  onClick={() => setNotesFontSize((s) => Math.max(14, s - 2))}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap"
                  title="Decrease Speaker Notes Font Size"
                  aria-label="Decrease Font Size"
                >
                  A-
                </button>
                <span className="px-1.5 text-[11px] font-mono tabular-nums text-slate-400">
                  {notesFontSize}
                </span>
                <button
                  type="button"
                  id="btn-notes-font-inc"
                  onClick={() => setNotesFontSize((s) => Math.min(44, s + 2))}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer whitespace-nowrap"
                  title="Increase Speaker Notes Font Size"
                  aria-label="Increase Font Size"
                >
                  A+
                </button>
              </div>

              {/* Teleprompter Toggle */}
              <button
                type="button"
                id="btn-toggle-teleprompter"
                onClick={() => setTeleprompterMode((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
                  teleprompterMode
                    ? "bg-emerald-600/25 border-emerald-500/50 text-emerald-200"
                    : "bg-[#171c2b] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/5"
                }`}
                title="Switch between static notes and auto-scrolling Teleprompter"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Teleprompter</span>
              </button>
            </div>
          </div>

          {/* Teleprompter Speed & Playback Controls */}
          {teleprompterMode && (
            <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#131826] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-teleprompter-play"
                  onClick={() => setTeleprompterPlaying((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
                    teleprompterPlaying
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                  title="Play / Pause Teleprompter (Spacebar)"
                >
                  {teleprompterPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-teleprompter-reset"
                  onClick={handleResetTeleprompter}
                  className="p-1.5 rounded-md bg-[#1a2030] hover:bg-white/10 border border-white/[0.08] text-slate-300 hover:text-white transition cursor-pointer"
                  title="Reset Scroll to Top"
                  aria-label="Reset Scroll to Top"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline whitespace-nowrap">
                  Space: Play/Pause
                </span>
              </div>

              {/* WPM Speed Slider */}
              <div className="flex items-center space-x-2.5 flex-1 max-w-xs min-w-[180px]">
                <label
                  htmlFor="teleprompter-wpm-slider"
                  className="text-[11px] font-semibold text-slate-400 whitespace-nowrap"
                >
                  Speed
                </label>
                <input
                  id="teleprompter-wpm-slider"
                  type="range"
                  min={60}
                  max={300}
                  step={5}
                  value={teleprompterWpm}
                  onChange={(e) => setTeleprompterWpm(Number(e.target.value))}
                  className="flex-1 accent-emerald-400 cursor-pointer"
                  aria-label="Teleprompter Speed in Words Per Minute"
                />
                <span className="text-xs font-mono font-bold tabular-nums text-emerald-300 w-16 text-right whitespace-nowrap">
                  {teleprompterWpm} WPM
                </span>
              </div>
            </div>
          )}

          {/* Notes / Teleprompter Content Viewport */}
          <div className="relative flex-1 overflow-hidden">
            {/* Teleprompter reading band */}
            {teleprompterMode && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-[22%] h-20 border-y border-emerald-400/25 bg-emerald-500/[0.05] z-10"
              />
            )}

            <div
              ref={notesViewportRef}
              onWheel={() => {
                if (notesViewportRef.current) {
                  scrollPosRef.current = notesViewportRef.current.scrollTop;
                }
              }}
              className="w-full h-full overflow-y-auto px-6 sm:px-8 py-6 select-text scroll-auto"
            >
              {teleprompterMode && <div className="h-[22%]" />}

              {speakerNotes ? (
                <p
                  className="whitespace-pre-line font-normal tracking-normal text-slate-100 leading-relaxed transition-[font-size] duration-150"
                  style={{ fontSize: `${notesFontSize}px`, lineHeight: 1.65 }}
                >
                  {speakerNotes}
                </p>
              ) : (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-slate-500">
                  <Mic className="w-6 h-6 mb-2 opacity-40" />
                  <p className="text-sm font-medium text-slate-400">
                    No speaker notes for Slide {currentIndex + 1}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Add notes in the Slide Editor to view them here during presentation.
                  </p>
                </div>
              )}

              {teleprompterMode && <div className="h-[55%]" />}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
