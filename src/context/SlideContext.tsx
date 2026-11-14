import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  SlideData,
  Language,
  PresentationTheme,
  SlideLayout,
  SlideTransition,
  DriveSyncConfig,
  SlideImage,
  RagPatchSuggestion,
  DesignConstitution,
} from "../types";
import { loadDesignConstitution, saveDesignConstitution } from "../utils/constitution";
import { INITIAL_SLIDES } from "../data/initialSlides";
import { PRESENTATION_THEMES } from "../data/themes";
import { useSlideHistory } from "../utils/useSlideHistory";
import {
  loadDriveSyncConfig,
  saveDriveSyncConfig,
  fetchDriveFileMetadata,
  fetchDriveFileContent,
  parseAndSyncSlideContent,
  addDriveSyncLog,
} from "../utils/googleDriveSync";
import { fetchAiAutoLayout, fetchRagAutoPilotDiff } from "../utils/api";
import { analyzeSlideLayout } from "../utils/autoLayout";
import {
  applyRagPatchToSlides,
  applyBatchRagPatches,
  runLocalRagDiff,
  SAMPLE_INTRANET_DOCUMENTS,
} from "../utils/ragDiffEngine";
import { exportSlidesToPptx } from "../utils/pptxExporter";

const getStoredSlides = (): SlideData[] => {
  if (typeof window === "undefined") return INITIAL_SLIDES;
  const saved = localStorage.getItem("kind_2026_slides");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to load saved slides from localStorage:", e);
    }
  }
  return INITIAL_SLIDES;
};

export interface SlideContextType {
  // Slides data & navigation
  slides: SlideData[];
  activeSlideIndex: number;
  activeSlide: SlideData;
  setActiveSlideIndex: (index: number | ((prev: number) => number)) => void;
  updateSingleSlide: (index: number, slide: SlideData, desc?: string, immediate?: boolean) => void;
  handleUpdateSlide: (updatedSlide: SlideData, immediate?: boolean, actionDesc?: string) => void;
  setSlidesWithHistory: (
    newSlidesOrUpdater: SlideData[] | ((prev: SlideData[]) => SlideData[]),
    actionDesc?: string,
    newActiveIndex?: number,
    immediate?: boolean
  ) => void;

  // History
  undo: () => { action?: string } | null;
  redo: () => { action?: string } | null;
  canUndo: boolean;
  canRedo: boolean;
  pastCount: number;
  futureCount: number;
  lastActionMessage: string | null;
  historyTimeline: any[];
  jumpToHistoryIndex: (index: number) => void;
  clearHistory: () => void;
  handleManualUndo: () => void;
  handleManualRedo: () => void;

  // Slide CRUD Operations
  handleAddSlide: (layout?: SlideLayout) => void;
  handleDuplicateSlide: (index: number) => void;
  handleDeleteSlide: (index: number) => void;
  handleMoveSlide: (fromIndex: number, toIndex: number) => void;
  handleLayoutChange: (newLayout: SlideLayout) => void;
  handleTransitionChange: (newTransition: SlideTransition) => void;
  handleAutoSelectLayout: () => void;
  handleApplyTransitionToAll: () => void;
  handleApplySuggestion: (slide: SlideData) => Promise<void>;
  handleApplySlideImage: (image: SlideImage, targetLayout?: SlideLayout) => void;
  handleRemoveSlideImage: () => void;
  handleSelectTemplate: (templateSlides: SlideData[], templateName: string) => void;
  handleResetDeck: () => void;
  handleExportJson: () => void;
  handleExportPptx: () => Promise<void>;
  pptxExportProgress: { current: number; total: number; message: string } | null;
  handleImportJson: (importedSlides: SlideData[]) => void;
  handleShare: () => void;
  handlePrint: () => void;

  // Language & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  currentTheme: PresentationTheme;
  setCurrentTheme: (theme: PresentationTheme) => void;
  previewTheme: PresentationTheme | null;
  setPreviewTheme: (theme: PresentationTheme | null) => void;
  displayedTheme: PresentationTheme;

  // Viewport & Canvas Controls
  canvasZoom: number;
  setCanvasZoom: React.Dispatch<React.SetStateAction<number>>;
  isAutoFit: boolean;
  setIsAutoFit: (val: boolean) => void;
  recalculateAutoFit: () => void;
  viewportContainerRef: React.RefObject<HTMLDivElement | null>;
  highlightedField: string | null;
  setHighlightedField: (field: string | null) => void;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  hoverTransition: SlideTransition | null;
  setHoverTransition: (t: SlideTransition | null) => void;

  // Auto-save & Toast
  saveStatus: "saved" | "saving" | "error";
  lastSavedAt: Date;
  toastMessage: string | null;
  triggerToast: (msg: string) => void;

  // Google Drive Sync
  driveSyncConfig: DriveSyncConfig;
  setDriveSyncConfig: (cfg: DriveSyncConfig) => void;
  isSyncingDrive: boolean;
  handleManualDriveSync: () => Promise<void>;
  pendingDriveUpdate: {
    slides: SlideData[];
    fileName: string;
    modifiedTime: string;
  } | null;
  setPendingDriveUpdate: React.Dispatch<
    React.SetStateAction<{
      slides: SlideData[];
      fileName: string;
      modifiedTime: string;
    } | null>
  >;

  // Intranet RAG Auto-Pilot Diff
  ragSuggestions: RagPatchSuggestion[];
  isAnalyzingRag: boolean;
  ragSourceDocumentTitle: string | null;
  runRagAutoPilot: (sourceContent: string, docTitle?: string) => Promise<RagPatchSuggestion[]>;
  applySingleRagPatch: (patch: RagPatchSuggestion) => void;
  applyAllRagPatches: () => void;
  dismissRagBanner: () => void;
  clearRagSuggestions: () => void;
  showRagBanner: boolean;
  setShowRagBanner: (show: boolean) => void;

  // Enterprise Design Constitution & Brand Governance
  constitution: DesignConstitution;
  setConstitution: React.Dispatch<React.SetStateAction<DesignConstitution>>;
  updateConstitution: (updates: Partial<DesignConstitution>) => void;
}

const SlideContext = createContext<SlideContextType | undefined>(undefined);

export function detectSystemLanguage(): Language {
  if (typeof window === "undefined" || !navigator) return "en";

  try {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam && ["en", "ko", "ja", "id", "dual", "both"].includes(langParam)) {
      return langParam as Language;
    }
  } catch {
    // Ignore URL search params error
  }

  // Detect user's browser or operating system language
  const navLangs = navigator.languages || [navigator.language || ""];
  for (const l of navLangs) {
    if (!l) continue;
    const lower = l.toLowerCase();
    if (lower.startsWith("ko")) return "ko";
    if (lower.startsWith("ja")) return "ja";
    if (lower.startsWith("id") || lower.startsWith("in")) return "id";
    if (lower.startsWith("en")) return "en";
  }

  // Fallback default is English
  return "en";
}

export const SlideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    updateSingleSlide,
    setSlidesWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    lastActionMessage,
    historyTimeline,
    jumpToHistoryIndex,
    clearHistory,
  } = useSlideHistory(getStoredSlides(), 0);

  const [language, setLanguage] = useState<Language>(() => detectSystemLanguage());
  const [currentTheme, setCurrentTheme] = useState<PresentationTheme>(PRESENTATION_THEMES[0]);
  const [previewTheme, setPreviewTheme] = useState<PresentationTheme | null>(null);

  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [hoverTransition, setHoverTransition] = useState<SlideTransition | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pptxExportProgress, setPptxExportProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const isExportingPptxRef = useRef<boolean>(false);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date>(new Date());
  const isFirstRender = useRef<boolean>(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [driveSyncConfig, setDriveSyncConfig] = useState<DriveSyncConfig>(() => loadDriveSyncConfig());
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [pendingDriveUpdate, setPendingDriveUpdate] = useState<{
    slides: SlideData[];
    fileName: string;
    modifiedTime: string;
  } | null>(null);

  // Intranet RAG Auto-Pilot Diff State
  const [ragSuggestions, setRagSuggestions] = useState<RagPatchSuggestion[]>([]);
  const [isAnalyzingRag, setIsAnalyzingRag] = useState<boolean>(false);
  const [ragSourceDocumentTitle, setRagSourceDocumentTitle] = useState<string | null>(null);
  const [showRagBanner, setShowRagBanner] = useState<boolean>(false);

  // Enterprise Design Constitution State & Persistence
  const [constitution, setConstitution] = useState<DesignConstitution>(() => loadDesignConstitution());

  const updateConstitution = useCallback((updates: Partial<DesignConstitution>) => {
    setConstitution((prev) => {
      const next = { ...prev, ...updates };
      saveDesignConstitution(next);
      return next;
    });
  }, []);

  useEffect(() => {
    saveDesignConstitution(constitution);
  }, [constitution]);

  const displayedTheme = previewTheme || currentTheme;
  const activeSlide = slides[activeSlideIndex] || slides[0];

  useEffect(() => {
    setSelectedOverlayId(null);
  }, [activeSlide?.id]);

  const triggerToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // URL parameters and automatic browser/OS language adjustment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slideIdxParam = params.get("slideIndex");
    const langParam = params.get("lang");

    if (slideIdxParam) {
      const idx = parseInt(slideIdxParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < slides.length) {
        setActiveSlideIndex(idx);
      }
    }

    if (langParam && ["en", "ko", "ja", "id", "dual", "both"].includes(langParam)) {
      setLanguage(langParam as Language);
    } else {
      setLanguage(detectSystemLanguage());
    }

    // Automatically adjust display language when browser/OS language changes
    const handleSystemLanguageChange = () => {
      const currentParam = new URLSearchParams(window.location.search).get("lang");
      if (!currentParam) {
        setLanguage(detectSystemLanguage());
      }
    };

    window.addEventListener("languagechange", handleSystemLanguageChange);

    const themeParam = params.get("theme");
    if (themeParam) {
      const foundTheme = PRESENTATION_THEMES.find((t) => t.id === themeParam);
      if (foundTheme) {
        setCurrentTheme(foundTheme);
      }
    }

    return () => {
      window.removeEventListener("languagechange", handleSystemLanguageChange);
    };
  }, [slides.length]);

  // Auto-fit calculation
  const recalculateAutoFit = useCallback(() => {
    if (!viewportContainerRef.current) return;
    const { clientWidth, clientHeight } = viewportContainerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const paddingX = 48;
    const paddingY = 80;
    const availableWidth = Math.max(200, clientWidth - paddingX);
    const availableHeight = Math.max(150, clientHeight - paddingY);

    const baseW = 1024;
    const baseH = 576;

    const scaleX = availableWidth / baseW;
    const scaleY = availableHeight / baseH;
    const fitScale = Math.min(scaleX, scaleY);

    const computedZoom = Math.max(50, Math.min(130, Math.round(fitScale * 100)));
    setCanvasZoom(computedZoom);
  }, []);

  // LocalStorage auto-save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("kind_2026_slides", JSON.stringify(slides));
        setSaveStatus("saved");
        setLastSavedAt(new Date());
      } catch (e) {
        console.warn("LocalStorage save limit exceeded:", e);
        setSaveStatus("error");
      }
    }, 450);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [slides]);

  // Slide CRUD Actions
  const handleUpdateSlide = useCallback(
    (updatedSlide: SlideData, immediate = false, actionDesc?: string) => {
      const desc = actionDesc || `슬라이드 ${activeSlideIndex + 1} 내용 수정`;
      updateSingleSlide(activeSlideIndex, updatedSlide, desc, immediate);
    },
    [activeSlideIndex, updateSingleSlide]
  );

  const handleAddSlide = useCallback(
    (layout: SlideLayout = "cards-3") => {
      const newSlideNumber = slides.length + 1;
      const newSlide: SlideData = {
        id: `slide_${Date.now()}`,
        slideNumber: newSlideNumber,
        layout,
        categoryKo: "신규 섹션",
        categoryId: "Bagian Baru",
        tagKo: "KIND 2026",
        tagId: "KIND 2026",
        titleKo: "새로운 슬라이드 제목",
        titleId: "Judul Slide Baru",
        subtitleKo: "슬라이드의 핵심 메시지와 세부 실행 방안을 기술하세요.",
        subtitleId: "Jelaskan pesan utama dan rencana eksekusi detail slide.",
        bullets: [
          {
            id: `b1_${Date.now()}`,
            titleKo: "핵심 실행 항목 1",
            titleId: "Poin Eksekusi Utama 1",
            descKo: "상세 실행 방안 및 협력 대학·기관과의 연계 사항입니다.",
            descId: "Rencana eksekusi detail dan keterkaitan dengan mitra kampus/lembaga.",
          },
          {
            id: `b2_${Date.now()}`,
            titleKo: "핵심 실행 항목 2",
            titleId: "Poin Eksekusi Utama 2",
            descKo: "기대 효과 및 비자·장학 제도와의 결합 모델입니다.",
            descId: "Dampak yang diharapkan dan integrasi skema visa & beasiswa.",
          },
        ],
        notesKo: "새로 추가된 슬라이드에 대한 발표자 노트입니다.",
        notesId: "Catatan presenter untuk slide yang baru ditambahkan.",
      };

      const targetIdx = slides.length;
      setSlidesWithHistory((prev) => [...prev, newSlide], `새 슬라이드 추가 (#${newSlideNumber})`, targetIdx, true);
      triggerToast(`새 슬라이드가 추가되었습니다 (총 ${newSlideNumber}장)`);
    },
    [slides.length, setSlidesWithHistory, triggerToast]
  );

  const handleDuplicateSlide = useCallback(
    (index: number) => {
      const source = slides[index];
      if (!source) return;
      const duplicated: SlideData = {
        ...source,
        id: `slide_${Date.now()}`,
        titleKo: `${source.titleKo} (복사본)`,
        titleId: `${source.titleId} (Salinan)`,
        overlayElements: source.overlayElements
          ? source.overlayElements.map((el, idx) => ({
              ...el,
              id: `ov_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
              style: { ...el.style },
            }))
          : undefined,
      };
      const next = [...slides];
      next.splice(index + 1, 0, duplicated);
      setSlidesWithHistory(next, `슬라이드 ${index + 1} 복제`, index + 1, true);
      triggerToast(`슬라이드 ${index + 1}이(가) 복제되었습니다.`);
    },
    [slides, setSlidesWithHistory, triggerToast]
  );

  const handleDeleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;
      const targetTitle = slides[index]?.titleKo || `슬라이드 ${index + 1}`;
      const next = slides.filter((_, i) => i !== index);
      const nextIdx = index >= next.length ? next.length - 1 : index;
      setSlidesWithHistory(next, `슬라이드 삭제 (${targetTitle})`, nextIdx, true);
      triggerToast(`슬라이드가 삭제되었습니다.`);
    },
    [slides, setSlidesWithHistory, triggerToast]
  );

  const handleMoveSlide = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= slides.length) return;
      const next = [...slides];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setSlidesWithHistory(next, `슬라이드 순서 이동 (${fromIndex + 1} → ${toIndex + 1})`, toIndex, true);
      triggerToast("Slide order updated.");
    },
    [slides, setSlidesWithHistory, triggerToast]
  );

  const handleLayoutChange = useCallback(
    (newLayout: SlideLayout) => {
      if (activeSlide) {
        handleUpdateSlide({ ...activeSlide, layout: newLayout }, true, `Change Layout to ${newLayout}`);
      }
    },
    [activeSlide, handleUpdateSlide]
  );

  const handleTransitionChange = useCallback(
    (newTransition: SlideTransition) => {
      if (activeSlide) {
        handleUpdateSlide({ ...activeSlide, transition: newTransition }, true, `Change Transition to ${newTransition}`);
      }
    },
    [activeSlide, handleUpdateSlide]
  );

  const handleAutoSelectLayout = useCallback(() => {
    if (activeSlide) {
      const analysis = analyzeSlideLayout(activeSlide);
      if (analysis && analysis.recommendedLayout) {
        handleLayoutChange(analysis.recommendedLayout);
        triggerToast(`✨ AI가 '${analysis.recommendedLayout}' 레이아웃을 추천 및 적용했습니다.`);
      }
    }
  }, [activeSlide, handleLayoutChange, triggerToast]);

  const handleApplyTransitionToAll = useCallback(() => {
    if (activeSlide) {
      const currentTransition = activeSlide.transition || "fade";
      const updated = slides.map((s) => ({
        ...s,
        transition: currentTransition,
      }));
      setSlidesWithHistory(updated, `Apply '${currentTransition}' Transition to All`, activeSlideIndex, true);
      triggerToast(`✨ 모든 슬라이드에 '${currentTransition}' 전환 효과를 적용했습니다.`);
    }
  }, [activeSlide, slides, activeSlideIndex, setSlidesWithHistory, triggerToast]);

  const handleApplySuggestion = useCallback(
    async (targetSlide: SlideData) => {
      triggerToast("AI analyzing optimal layout...");
      try {
        let analysis = await fetchAiAutoLayout(targetSlide);
        if (!analysis || !analysis.recommendedLayout) {
          analysis = analyzeSlideLayout(targetSlide);
        }
        if (analysis && analysis.recommendedLayout) {
          const updated = { ...targetSlide, layout: analysis.recommendedLayout };
          handleUpdateSlide(updated, true, "AI Layout Applied");
          triggerToast("AI recommended layout applied successfully!");
        }
      } catch (e) {
        const fallback = analyzeSlideLayout(targetSlide);
        const updated = { ...targetSlide, layout: fallback.recommendedLayout };
        handleUpdateSlide(updated, true, "AI Layout Applied");
        triggerToast("AI recommended layout applied successfully!");
      }
    },
    [handleUpdateSlide, triggerToast]
  );

  const handleApplySlideImage = useCallback(
    (image: SlideImage, targetLayout?: SlideLayout) => {
      if (!activeSlide) return;
      const updated: SlideData = {
        ...activeSlide,
        image,
        layout: targetLayout || activeSlide.layout,
      };
      handleUpdateSlide(updated, true, "Apply Visual Asset");
      triggerToast("Visual asset applied to slide successfully.");
    },
    [activeSlide, handleUpdateSlide, triggerToast]
  );

  const handleRemoveSlideImage = useCallback(() => {
    if (!activeSlide) return;
    const updated: SlideData = {
      ...activeSlide,
      image: undefined,
    };
    handleUpdateSlide(updated, true, "Remove Visual Asset");
    triggerToast("Visual asset removed from slide.");
  }, [activeSlide, handleUpdateSlide, triggerToast]);

  const handleSelectTemplate = useCallback(
    (templateSlides: SlideData[], templateName: string) => {
      setSlidesWithHistory(templateSlides, `Apply ${templateName} template`, 0, true);
      localStorage.removeItem("kind_2026_slides");
      triggerToast(`Template "${templateName}" applied (${templateSlides.length} slides).`);
    },
    [setSlidesWithHistory, triggerToast]
  );

  const handleResetDeck = useCallback(() => {
    setSlidesWithHistory(INITIAL_SLIDES, "Reset to Master Plan", 0, true);
    localStorage.removeItem("kind_2026_slides");
    triggerToast("Reset to master plan template.");
  }, [setSlidesWithHistory, triggerToast]);

  const handleExportJson = useCallback(() => {
    const jsonStr = JSON.stringify(slides, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KIND_2026_Master_Plan_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [slides]);

  const handleExportPptx = useCallback(async () => {
    if (isExportingPptxRef.current || slides.length === 0) return;
    isExportingPptxRef.current = true;
    setPptxExportProgress({
      current: 0,
      total: slides.length,
      message: "Preparing PowerPoint (.pptx)...",
    });

    try {
      const coverTitle =
        (language === "ko"
          ? slides[0]?.titleKo || slides[0]?.titleId
          : slides[0]?.titleId || slides[0]?.titleKo) || "Presentation";
      const fileName = `Presentation_${new Date().toISOString().slice(0, 10)}.pptx`;
      const exportedFileName = await exportSlidesToPptx({
        slides,
        theme: displayedTheme,
        language,
        title: coverTitle,
        fileName,
        onProgress: (current, total, message) => {
          setPptxExportProgress({ current, total, message });
        },
      });
      triggerToast(`PowerPoint exported: ${exportedFileName}`);
    } catch (err: any) {
      console.error("PPTX export error:", err);
      triggerToast(`PowerPoint export failed: ${err?.message || "Unexpected error"}`);
    } finally {
      isExportingPptxRef.current = false;
      setPptxExportProgress(null);
    }
  }, [slides, displayedTheme, language, triggerToast]);

  const handleImportJson = useCallback(
    (importedSlides: SlideData[]) => {
      setSlidesWithHistory(importedSlides, "Import Slides JSON", 0, true);
      triggerToast(`Successfully loaded ${importedSlides.length} slides.`);
    },
    [setSlidesWithHistory, triggerToast]
  );

  const handleShare = useCallback(() => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?slideIndex=${activeSlideIndex}&lang=${language}&theme=${currentTheme.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      triggerToast("✨ 공유 링크가 클립보드에 복사되었습니다.");
    });
  }, [activeSlideIndex, language, currentTheme.id, triggerToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleManualUndo = useCallback(() => {
    const res = undo();
    if (res) triggerToast(`[${res.action || "작업"}] 실행 취소 (Undo)`);
  }, [undo, triggerToast]);

  const handleManualRedo = useCallback(() => {
    const res = redo();
    if (res) triggerToast(`[${res.action || "작업"}] 다시 실행 (Redo)`);
  }, [redo, triggerToast]);

  // Google Drive Manual Sync
  const handleManualDriveSync = useCallback(async () => {
    if (!driveSyncConfig.fileId || !driveSyncConfig.accessToken) return;

    setIsSyncingDrive(true);
    try {
      const meta = await fetchDriveFileMetadata(driveSyncConfig.fileId, driveSyncConfig.accessToken);
      const content = await fetchDriveFileContent(
        driveSyncConfig.fileId,
        driveSyncConfig.accessToken,
        driveSyncConfig.fileMimeType || undefined
      );

      const { slides: parsedSlides, message } = await parseAndSyncSlideContent(
        content,
        driveSyncConfig.fileName || meta.name,
        slides
      );

      setSlidesWithHistory(parsedSlides, `Google Drive [${meta.name}] 동기화`, activeSlideIndex, true);
      const updatedConfig: DriveSyncConfig = {
        ...driveSyncConfig,
        lastModifiedTime: meta.modifiedTime,
        lastSyncedAt: Date.now(),
      };
      setDriveSyncConfig(updatedConfig);
      saveDriveSyncConfig(updatedConfig);
      triggerToast(`✨ Google Drive "${meta.name}" 동기화 완료 (${parsedSlides.length}개 슬라이드)`);

      addDriveSyncLog({
        fileName: meta.name,
        changeDetected: true,
        message: `수동 동기화 완료: ${message}`,
        status: "success",
        slidesCount: parsedSlides.length,
      });
    } catch (err: any) {
      console.error("Manual Drive Sync error:", err);
      triggerToast(`⚠️ Google Drive 동기화 실패: ${err?.message || "오류 발생"}`);
      addDriveSyncLog({
        fileName: driveSyncConfig.fileName || "Drive 파일",
        changeDetected: false,
        message: `동기화 실패: ${err?.message || "네트워크 오류"}`,
        status: "error",
      });
    } finally {
      setIsSyncingDrive(false);
    }
  }, [driveSyncConfig, slides, activeSlideIndex, setSlidesWithHistory, triggerToast]);

  // Background Google Drive Auto-polling loop
  useEffect(() => {
    if (
      !driveSyncConfig.isConnected ||
      !driveSyncConfig.fileId ||
      !driveSyncConfig.accessToken ||
      !driveSyncConfig.autoSync
    ) {
      return;
    }

    const intervalMs = Math.max(5, driveSyncConfig.intervalSeconds || 10) * 1000;
    const interval = setInterval(async () => {
      if (driveSyncConfig.tokenExpiresAt && Date.now() > driveSyncConfig.tokenExpiresAt) {
        return;
      }

      try {
        const meta = await fetchDriveFileMetadata(driveSyncConfig.fileId!, driveSyncConfig.accessToken!);
        if (meta.modifiedTime && meta.modifiedTime !== driveSyncConfig.lastModifiedTime) {
          setIsSyncingDrive(true);
          const content = await fetchDriveFileContent(
            driveSyncConfig.fileId!,
            driveSyncConfig.accessToken!,
            driveSyncConfig.fileMimeType || undefined
          );

          const { slides: parsedSlides, message } = await parseAndSyncSlideContent(
            content,
            driveSyncConfig.fileName || meta.name,
            slides
          );

          if (driveSyncConfig.syncMode === "prompt") {
            setPendingDriveUpdate({
              slides: parsedSlides,
              fileName: driveSyncConfig.fileName || meta.name,
              modifiedTime: meta.modifiedTime,
            });
            triggerToast(`🔔 Google Drive "${meta.name}"에 새로운 변경사항이 있습니다.`);
          } else {
            setSlidesWithHistory(
              parsedSlides,
              `Google Drive [${meta.name}] 자동 업데이트`,
              activeSlideIndex,
              true
            );
            triggerToast(`⚡ Google Drive "${meta.name}" 수정사항이 실시간 반영되었습니다.`);

            const updatedConfig: DriveSyncConfig = {
              ...driveSyncConfig,
              lastModifiedTime: meta.modifiedTime,
              lastSyncedAt: Date.now(),
            };
            setDriveSyncConfig(updatedConfig);
            saveDriveSyncConfig(updatedConfig);
          }

          addDriveSyncLog({
            fileName: meta.name,
            changeDetected: true,
            message: `자동 감지 동기화 (${driveSyncConfig.syncMode}): ${message}`,
            status: "success",
            slidesCount: parsedSlides.length,
          });

          // Run RAG Auto-Pilot diff in background
          runRagAutoPilot(content, meta.name).catch((err) =>
            console.warn("Background RAG diff on Drive poll notice:", err)
          );
        }
      } catch (err: any) {
        console.warn("Drive auto-polling error:", err);
      } finally {
        setIsSyncingDrive(false);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [driveSyncConfig, slides, activeSlideIndex, setSlidesWithHistory, triggerToast]);

  // RAG Auto-Pilot Engine Functions
  const runRagAutoPilot = useCallback(
    async (sourceContent: string, docTitle?: string): Promise<RagPatchSuggestion[]> => {
      if (!sourceContent) return [];
      setIsAnalyzingRag(true);
      const title = docTitle || "Reference Document";
      setRagSourceDocumentTitle(title);
      try {
        const data = await fetchRagAutoPilotDiff(slides, sourceContent, title);
        const patches: RagPatchSuggestion[] = data.suggestions || [];
        setRagSuggestions(patches);
        if (patches.length > 0) {
          setShowRagBanner(true);
          const affectedCount = new Set(patches.map((p) => p.slideIndex)).size;
          triggerToast(`🔔 RAG Auto-Pilot: ${affectedCount}개 슬라이드에 대한 최신 데이터 패치 감지`);
        } else {
          setShowRagBanner(false);
          triggerToast("✨ RAG Auto-Pilot: 모든 슬라이드 메트릭이 최신 문서와 일치합니다.");
        }
        return patches;
      } catch (err: any) {
        console.warn("RAG Auto-Pilot notice (using deterministic fallback):", err);
        const fallback = runLocalRagDiff(slides, sourceContent);
        setRagSuggestions(fallback);
        if (fallback.length > 0) {
          setShowRagBanner(true);
          const affectedCount = new Set(fallback.map((p) => p.slideIndex)).size;
          triggerToast(`🔔 RAG Auto-Pilot: ${affectedCount}개 슬라이드에 대한 최신 데이터 패치 감지 (오프라인)`);
        }
        return fallback;
      } finally {
        setIsAnalyzingRag(false);
      }
    },
    [slides, triggerToast]
  );

  const applySingleRagPatch = useCallback(
    (patch: RagPatchSuggestion) => {
      const updatedSlides = applyRagPatchToSlides(slides, patch);
      setSlidesWithHistory(
        updatedSlides,
        `RAG Auto-Pilot: 슬라이드 ${patch.slideIndex + 1} [${patch.targetField}] 패치`,
        patch.slideIndex,
        true
      );
      setRagSuggestions((prev) =>
        prev.map((s) =>
          s.id === patch.id || (s.slideIndex === patch.slideIndex && s.targetField === patch.targetField)
            ? { ...s, applied: true }
            : s
        )
      );
      triggerToast(`✨ 슬라이드 ${patch.slideIndex + 1} (${patch.targetField}) 필드가 업데이트되었습니다.`);
    },
    [slides, setSlidesWithHistory, triggerToast]
  );

  const applyAllRagPatches = useCallback(() => {
    const unapplied = ragSuggestions.filter((s) => !s.applied);
    if (unapplied.length === 0) return;

    const updatedSlides = applyBatchRagPatches(slides, unapplied);
    const affectedCount = new Set(unapplied.map((p) => p.slideIndex)).size;
    const firstTargetSlide = unapplied[0]?.slideIndex ?? activeSlideIndex;

    setSlidesWithHistory(
      updatedSlides,
      `RAG Auto-Pilot: ${unapplied.length}개 최신 수치 일괄 패치`,
      firstTargetSlide,
      true
    );

    setRagSuggestions((prev) => prev.map((s) => ({ ...s, applied: true })));
    setShowRagBanner(false);
    triggerToast(
      `✨ ${affectedCount}개 슬라이드(${unapplied.length}개 필드)가 최신 문서 데이터로 일괄 갱신되었습니다. (Ctrl+Z 취소 가능)`
    );
  }, [ragSuggestions, slides, activeSlideIndex, setSlidesWithHistory, triggerToast]);

  const dismissRagBanner = useCallback(() => {
    setShowRagBanner(false);
  }, []);

  const clearRagSuggestions = useCallback(() => {
    setRagSuggestions([]);
    setShowRagBanner(false);
    setRagSourceDocumentTitle(null);
  }, []);

  // Initial Background RAG Auto-Pilot Check against Intranet Master Document (runs once on startup)
  const hasRunInitialRagRef = useRef<boolean>(false);
  useEffect(() => {
    if (hasRunInitialRagRef.current) return;
    hasRunInitialRagRef.current = true;

    const timer = setTimeout(() => {
      if (!driveSyncConfig.isConnected && ragSuggestions.length === 0) {
        const defaultDoc = SAMPLE_INTRANET_DOCUMENTS[0];
        const localPatches = runLocalRagDiff(slides, defaultDoc.content).map((s, i) => ({
          id: `rag-patch-${s.slideIndex}-${i}-${Date.now()}`,
          ...s,
        }));
        if (localPatches.length > 0) {
          setRagSourceDocumentTitle(defaultDoc.title);
          setRagSuggestions(localPatches);
          setShowRagBanner(true);
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: SlideContextType = {
    slides,
    activeSlideIndex,
    activeSlide,
    setActiveSlideIndex,
    updateSingleSlide,
    handleUpdateSlide,
    setSlidesWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    lastActionMessage,
    historyTimeline,
    jumpToHistoryIndex,
    clearHistory,
    handleManualUndo,
    handleManualRedo,
    handleAddSlide,
    handleDuplicateSlide,
    handleDeleteSlide,
    handleMoveSlide,
    handleLayoutChange,
    handleTransitionChange,
    handleAutoSelectLayout,
    handleApplyTransitionToAll,
    handleApplySuggestion,
    handleApplySlideImage,
    handleRemoveSlideImage,
    handleSelectTemplate,
    handleResetDeck,
    handleExportJson,
    handleExportPptx,
    pptxExportProgress,
    handleImportJson,
    handleShare,
    handlePrint,
    language,
    setLanguage,
    currentTheme,
    setCurrentTheme,
    previewTheme,
    setPreviewTheme,
    displayedTheme,
    canvasZoom,
    setCanvasZoom,
    isAutoFit,
    setIsAutoFit,
    recalculateAutoFit,
    viewportContainerRef,
    highlightedField,
    setHighlightedField,
    selectedOverlayId,
    setSelectedOverlayId,
    hoverTransition,
    setHoverTransition,
    saveStatus,
    lastSavedAt,
    toastMessage,
    triggerToast,
    driveSyncConfig,
    setDriveSyncConfig,
    isSyncingDrive,
    handleManualDriveSync,
    pendingDriveUpdate,
    setPendingDriveUpdate,
    ragSuggestions,
    isAnalyzingRag,
    ragSourceDocumentTitle,
    runRagAutoPilot,
    applySingleRagPatch,
    applyAllRagPatches,
    dismissRagBanner,
    clearRagSuggestions,
    showRagBanner,
    setShowRagBanner,
    constitution,
    setConstitution,
    updateConstitution,
  };

  return <SlideContext.Provider value={value}>{children}</SlideContext.Provider>;
};

export const useSlideContext = () => {
  const context = useContext(SlideContext);
  if (context === undefined) {
    throw new Error("useSlideContext must be used within a SlideProvider");
  }
  return context;
};
