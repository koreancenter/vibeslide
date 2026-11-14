import { useState, useRef, useCallback, useEffect } from "react";
import { SlideData, HistorySnapshot } from "../types";

const MAX_HISTORY_LENGTH = 60;
const TYPING_DEBOUNCE_MS = 600;

function cloneSlides(slides: SlideData[]): SlideData[] {
  try {
    return JSON.parse(JSON.stringify(slides));
  } catch {
    return [...slides];
  }
}

export interface UseSlideHistoryReturn {
  slides: SlideData[];
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number | ((prev: number) => number)) => void;
  updateSingleSlide: (slideIndex: number, updatedSlide: SlideData, actionDesc?: string, immediate?: boolean) => void;
  setSlidesWithHistory: (
    newSlidesOrUpdater: SlideData[] | ((prev: SlideData[]) => SlideData[]),
    actionDesc?: string,
    newActiveIndex?: number,
    immediate?: boolean
  ) => void;
  undo: () => { action?: string } | null;
  redo: () => { action?: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  pastCount: number;
  futureCount: number;
  lastActionMessage: string | null;
  historyTimeline: {
    id: string;
    action: string;
    timestamp: number;
    isCurrent: boolean;
    isPast: boolean;
    slideCount: number;
  }[];
  jumpToHistoryIndex: (index: number) => void;
  clearHistory: () => void;
}

export function useSlideHistory(
  initialSlides: SlideData[],
  initialActiveIndex = 0
): UseSlideHistoryReturn {
  const [slides, setSlides] = useState<SlideData[]>(initialSlides);
  const [activeSlideIndex, setActiveSlideIndexState] = useState<number>(initialActiveIndex);

  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0); // Triggers re-renders when history stacks change
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Baseline snapshot before a series of continuous debounced changes (e.g. typing)
  const baselineSnapshotRef = useRef<HistorySnapshot>({
    slides: cloneSlides(initialSlides),
    activeSlideIndex: initialActiveIndex,
    actionDescription: "초기 마스터 플랜 로드",
    timestamp: Date.now(),
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update active slide index helper
  const setActiveSlideIndex = useCallback((indexOrUpdater: number | ((prev: number) => number)) => {
    setActiveSlideIndexState((prev) => {
      const nextIndex = typeof indexOrUpdater === "function" ? indexOrUpdater(prev) : indexOrUpdater;
      baselineSnapshotRef.current.activeSlideIndex = nextIndex;
      return nextIndex;
    });
  }, []);

  // Flush any pending text edit into the past stack
  const flushPendingChanges = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const baseline = baselineSnapshotRef.current;
    const currentSlidesJson = JSON.stringify(slides);
    const baselineSlidesJson = JSON.stringify(baseline.slides);

    if (currentSlidesJson !== baselineSlidesJson) {
      // Push baseline to past
      pastRef.current = [
        ...pastRef.current.slice(-(MAX_HISTORY_LENGTH - 1)),
        {
          slides: cloneSlides(baseline.slides),
          activeSlideIndex: baseline.activeSlideIndex,
          actionDescription: baseline.actionDescription || "슬라이드 텍스트 수정",
          timestamp: baseline.timestamp,
        },
      ];
      futureRef.current = []; // Clear redo stack on new change

      // Update baseline to current
      baselineSnapshotRef.current = {
        slides: cloneSlides(slides),
        activeSlideIndex,
        actionDescription: "슬라이드 텍스트 수정 완료",
        timestamp: Date.now(),
      };
      setHistoryVersion((v) => v + 1);
    }
  }, [slides, activeSlideIndex]);

  // Set slides with discrete or debounced history tracking
  const setSlidesWithHistory = useCallback(
    (
      newSlidesOrUpdater: SlideData[] | ((prev: SlideData[]) => SlideData[]),
      actionDesc = "슬라이드 변경",
      newActiveIndex?: number,
      immediate = true
    ) => {
      if (immediate) {
        // 1. Flush any prior typing baseline
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        setSlides((prevSlides) => {
          const nextSlides =
            typeof newSlidesOrUpdater === "function"
              ? newSlidesOrUpdater(prevSlides)
              : newSlidesOrUpdater;

          // Record previous state in past
          pastRef.current = [
            ...pastRef.current.slice(-(MAX_HISTORY_LENGTH - 1)),
            {
              slides: cloneSlides(prevSlides),
              activeSlideIndex,
              actionDescription: actionDesc,
              timestamp: Date.now(),
            },
          ];
          futureRef.current = []; // Clear future on new action

          const targetIndex = newActiveIndex !== undefined ? newActiveIndex : activeSlideIndex;
          if (newActiveIndex !== undefined) {
            setActiveSlideIndexState(newActiveIndex);
          }

          baselineSnapshotRef.current = {
            slides: cloneSlides(nextSlides),
            activeSlideIndex: targetIndex,
            actionDescription: actionDesc,
            timestamp: Date.now(),
          };

          setHistoryVersion((v) => v + 1);
          return nextSlides;
        });
      } else {
        // Debounced update for continuous typing
        setSlides((prevSlides) => {
          const nextSlides =
            typeof newSlidesOrUpdater === "function"
              ? newSlidesOrUpdater(prevSlides)
              : newSlidesOrUpdater;

          if (newActiveIndex !== undefined) {
            setActiveSlideIndexState(newActiveIndex);
          }

          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            flushPendingChanges();
          }, TYPING_DEBOUNCE_MS);

          return nextSlides;
        });
      }
    },
    [activeSlideIndex, flushPendingChanges]
  );

  // Update a single slide
  const updateSingleSlide = useCallback(
    (
      slideIndex: number,
      updatedSlide: SlideData,
      actionDesc = `슬라이드 ${slideIndex + 1} 내용 수정`,
      immediate = false
    ) => {
      setSlidesWithHistory(
        (prev) => {
          const next = [...prev];
          next[slideIndex] = updatedSlide;
          return next;
        },
        actionDesc,
        slideIndex,
        immediate
      );
    },
    [setSlidesWithHistory]
  );

  // UNDO
  const undo = useCallback((): { action?: string } | null => {
    // If there is an in-progress debounced text change that hasn't been committed,
    // we should commit or revert to the baseline
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentSlidesJson = JSON.stringify(slides);
    const baselineSlidesJson = JSON.stringify(baselineSnapshotRef.current.slides);

    // If current differs from baseline (user was actively typing)
    if (currentSlidesJson !== baselineSlidesJson) {
      // Revert current to baseline as step 1
      futureRef.current = [
        ...futureRef.current,
        {
          slides: cloneSlides(slides),
          activeSlideIndex,
          actionDescription: "입력 중이던 텍스트",
          timestamp: Date.now(),
        },
      ];
      setSlides(cloneSlides(baselineSnapshotRef.current.slides));
      setActiveSlideIndexState(baselineSnapshotRef.current.activeSlideIndex);
      setLastActionMessage("입력 중이던 텍스트를 실행 취소했습니다.");
      setHistoryVersion((v) => v + 1);
      return { action: "입력 중이던 텍스트 실행 취소" };
    }

    if (pastRef.current.length === 0) {
      return null;
    }

    const prevSnapshot = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    // Push current to future
    futureRef.current = [
      ...futureRef.current,
      {
        slides: cloneSlides(slides),
        activeSlideIndex,
        actionDescription: prevSnapshot.actionDescription || "이전 상태",
        timestamp: Date.now(),
      },
    ];

    setSlides(cloneSlides(prevSnapshot.slides));
    if (prevSnapshot.activeSlideIndex < prevSnapshot.slides.length) {
      setActiveSlideIndexState(prevSnapshot.activeSlideIndex);
    } else {
      setActiveSlideIndexState(Math.max(0, prevSnapshot.slides.length - 1));
    }

    baselineSnapshotRef.current = {
      slides: cloneSlides(prevSnapshot.slides),
      activeSlideIndex: prevSnapshot.activeSlideIndex,
      actionDescription: prevSnapshot.actionDescription,
      timestamp: Date.now(),
    };

    const actionText = prevSnapshot.actionDescription
      ? `[${prevSnapshot.actionDescription}] 실행 취소 (Undo)`
      : "실행 취소 (Undo) 완료";
    setLastActionMessage(actionText);
    setHistoryVersion((v) => v + 1);

    return { action: prevSnapshot.actionDescription };
  }, [slides, activeSlideIndex]);

  // REDO
  const redo = useCallback((): { action?: string } | null => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (futureRef.current.length === 0) {
      return null;
    }

    const nextSnapshot = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);

    // Push current to past
    pastRef.current = [
      ...pastRef.current,
      {
        slides: cloneSlides(slides),
        activeSlideIndex,
        actionDescription: nextSnapshot.actionDescription || "다시 실행된 상태",
        timestamp: Date.now(),
      },
    ];

    setSlides(cloneSlides(nextSnapshot.slides));
    if (nextSnapshot.activeSlideIndex < nextSnapshot.slides.length) {
      setActiveSlideIndexState(nextSnapshot.activeSlideIndex);
    } else {
      setActiveSlideIndexState(Math.max(0, nextSnapshot.slides.length - 1));
    }

    baselineSnapshotRef.current = {
      slides: cloneSlides(nextSnapshot.slides),
      activeSlideIndex: nextSnapshot.activeSlideIndex,
      actionDescription: nextSnapshot.actionDescription,
      timestamp: Date.now(),
    };

    const actionText = nextSnapshot.actionDescription
      ? `[${nextSnapshot.actionDescription}] 다시 실행 (Redo)`
      : "다시 실행 (Redo) 완료";
    setLastActionMessage(actionText);
    setHistoryVersion((v) => v + 1);

    return { action: nextSnapshot.actionDescription };
  }, [slides, activeSlideIndex]);

  // Jump to specific point in timeline
  const jumpToHistoryIndex = useCallback(
    (targetPastIndex: number) => {
      // Flush first
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (targetPastIndex < 0 || targetPastIndex >= pastRef.current.length) return;

      const targetSnapshot = pastRef.current[targetPastIndex];
      const remainingPast = pastRef.current.slice(0, targetPastIndex);
      const movingToFuture = [
        ...pastRef.current.slice(targetPastIndex + 1),
        {
          slides: cloneSlides(slides),
          activeSlideIndex,
          actionDescription: "현재 시점",
          timestamp: Date.now(),
        },
      ];

      pastRef.current = remainingPast;
      futureRef.current = [...movingToFuture, ...futureRef.current];

      setSlides(cloneSlides(targetSnapshot.slides));
      setActiveSlideIndexState(
        Math.min(targetSnapshot.activeSlideIndex, targetSnapshot.slides.length - 1)
      );

      baselineSnapshotRef.current = {
        slides: cloneSlides(targetSnapshot.slides),
        activeSlideIndex: targetSnapshot.activeSlideIndex,
        actionDescription: targetSnapshot.actionDescription,
        timestamp: Date.now(),
      };

      setLastActionMessage(`과거 시점 [${targetSnapshot.actionDescription}]으로 복원되었습니다.`);
      setHistoryVersion((v) => v + 1);
    },
    [slides, activeSlideIndex]
  );

  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    baselineSnapshotRef.current = {
      slides: cloneSlides(slides),
      activeSlideIndex,
      actionDescription: "기록 초기화됨",
      timestamp: Date.now(),
    };
    setHistoryVersion((v) => v + 1);
  }, [slides, activeSlideIndex]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Construct structured timeline for visualization & history modal
  const historyTimeline = [
    ...pastRef.current.map((item, idx) => ({
      id: `past_${idx}_${item.timestamp}`,
      action: item.actionDescription || `작업 #${idx + 1}`,
      timestamp: item.timestamp,
      isCurrent: false,
      isPast: true,
      slideCount: item.slides.length,
    })),
    {
      id: `current_${Date.now()}`,
      action: "현재 상태 (Present)",
      timestamp: Date.now(),
      isCurrent: true,
      isPast: false,
      slideCount: slides.length,
    },
    ...[...futureRef.current].reverse().map((item, idx) => ({
      id: `future_${idx}_${item.timestamp}`,
      action: item.actionDescription || `다시 실행 가능 #${idx + 1}`,
      timestamp: item.timestamp,
      isCurrent: false,
      isPast: false,
      slideCount: item.slides.length,
    })),
  ];

  return {
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    updateSingleSlide,
    setSlidesWithHistory,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    pastCount: pastRef.current.length,
    futureCount: futureRef.current.length,
    lastActionMessage,
    historyTimeline,
    jumpToHistoryIndex,
    clearHistory,
  };
}
