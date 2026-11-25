import React, { useState, useEffect } from "react";
import { SlideProvider, useSlideContext } from "./context/SlideContext";
import { CollabProvider } from "./context/CollabContext";
import { ModalProvider, useModalContext } from "./context/ModalContext";
import { Navbar } from "./components/Navbar";
import { SlideCanvas } from "./components/SlideCanvas";
import { SlideEditor } from "./components/SlideEditor";
import { SlideHorizontalDock } from "./components/SlideHorizontalDock";
import { CanvasInsertBar } from "./components/canvas/CanvasInsertBar";
import { AnimationTimeline } from "./components/AnimationTimeline";
import { ModalContainer } from "./components/ModalContainer";
import { PresenterView } from "./components/PresenterView";
import { useResizableSidebar } from "./utils/useResizableSidebar";
import {
  RefreshCw,
  Sparkles,
  Check,
  X,
} from "lucide-react";

function AppWorkspace() {
  const slideCtx = useSlideContext();
  const modalCtx = useModalContext();

  const {
    slides,
    activeSlideIndex,
    activeSlide,
    setActiveSlideIndex,
    handleUpdateSlide,
    handleAddSlide,
    handleDuplicateSlide,
    handleDeleteSlide,
    handleMoveSlide,
    handleSelectTemplate,
    language,
    currentTheme,
    setCurrentTheme,
    displayedTheme,
    previewTheme,
    highlightedField,
    setHighlightedField,
    hoverTransition,
    setHoverTransition,
    canvasZoom,
    setCanvasZoom,
    isAutoFit,
    setIsAutoFit,
    recalculateAutoFit,
    viewportContainerRef,
    toastMessage,
    triggerToast,
    pendingDriveUpdate,
    setPendingDriveUpdate,
    setSlidesWithHistory,
    driveSyncConfig,
    setDriveSyncConfig,
    undo,
    redo,
  } = slideCtx;

  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);

  // Resizable sidebar hook
  const {
    leftWidth,
    leftSidebarWidth,
    isDraggingLeft,
    handleLeftResizeStart,
    resetSidebarWidth,
  } = useResizableSidebar();

  const handleResetSidebarWidths = () => {
    resetSidebarWidth();
    triggerToast("에디터 너비가 기본값(380px)으로 복원되었습니다.");
  };

  // Dynamic responsive auto-fit
  useEffect(() => {
    if (!isAutoFit) return;
    recalculateAutoFit();

    if (!viewportContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (isAutoFit) {
        recalculateAutoFit();
      }
    });
    observer.observe(viewportContainerRef.current);
    return () => observer.disconnect();
  }, [isAutoFit, recalculateAutoFit, leftWidth, showLeftPanel, viewportContainerRef]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInputActive =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "F5") {
        e.preventDefault();
        modalCtx.openModal("presentation");
        return;
      }
      if (e.key === "F1") {
        e.preventDefault();
        modalCtx.openModal("shortcuts");
        return;
      }
      if ((e.key === "?" || (e.shiftKey && e.key === "/")) && !isInputActive) {
        e.preventDefault();
        modalCtx.toggleModal("shortcuts");
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

      if (isModifierPressed) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          modalCtx.toggleModal("aiPromptBar");
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          modalCtx.openModal("presentation");
          return;
        }
        if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          modalCtx.openModal("history");
          return;
        }
        if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          modalCtx.openModal("pdfExport");
          return;
        }
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            const res = redo();
            if (res) triggerToast(`[${res.action || "작업"}] 다시 실행 (Redo)`);
          } else {
            const res = undo();
            if (res) triggerToast(`[${res.action || "작업"}] 실행 취소 (Undo)`);
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          const res = redo();
          if (res) triggerToast(`[${res.action || "작업"}] 다시 실행 (Redo)`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalCtx, undo, redo, triggerToast]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0c0d10] text-gray-100 overflow-hidden font-sans select-none relative">
      {/* Top Navigation Bar */}
      <div className="no-print">
        <Navbar
          showLeftPanel={showLeftPanel}
          onToggleLeftPanel={() => setShowLeftPanel((v) => !v)}
        />
      </div>

      {/* Main 2-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden relative no-print bg-[#0b0d11]">
        {/* Left Slide Editor & Navigator Sidebar */}
        {showLeftPanel && activeSlide && (
          <SlideEditor
            slide={activeSlide}
            language={language}
            onUpdateSlide={(updated, immediate, desc) => handleUpdateSlide(updated, immediate ?? false, desc)}
            onUpdateAllSlides={(newSlides) => setSlidesWithHistory(newSlides, "AI Layout Generation", activeSlideIndex, true)}
            onSyncMarkdownToSlides={(newSlides) => setSlidesWithHistory(newSlides, "Markdown Edit", activeSlideIndex, false)}
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={setActiveSlideIndex}
            onAddSlide={() => modalCtx.openModal("addSlide")}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
            onSelectTemplate={handleSelectTemplate}
            width={leftSidebarWidth}
            theme={currentTheme}
            onUpdateTheme={setCurrentTheme}
            highlightedField={highlightedField}
            onHighlightedFieldChange={setHighlightedField}
            onHoverTransition={setHoverTransition}
          />
        )}

        {/* Resizer Splitter */}
        {showLeftPanel && activeSlide && (
          <div
            onMouseDown={handleLeftResizeStart}
            onDoubleClick={handleResetSidebarWidths}
            className={`w-1.5 hover:w-2 -ml-1 z-30 cursor-col-resize select-none flex items-center justify-center group relative transition-colors ${
              isDraggingLeft ? "bg-blue-600" : "bg-transparent hover:bg-blue-500/40"
            }`}
            title="Drag to resize panel"
          >
            <div
              className={`w-0.5 rounded-full transition-all ${
                isDraggingLeft
                  ? "bg-white h-12"
                  : "bg-white/20 group-hover:bg-blue-400 group-hover:h-8 h-4"
              }`}
            />
          </div>
        )}

        {/* Center 16:9 Interactive Slide Viewport */}
        <main className="flex-1 bg-[#090c12] flex flex-col overflow-hidden relative border-l border-white/[0.08]">
          {/* Free-Form Canvas Object Insert Toolbar */}
          <CanvasInsertBar />

          <div
            ref={viewportContainerRef}
            id="viewport-container"
            className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 relative bg-canvas-grid"
          >
            {/* Live Theme Preview Banner */}
            {previewTheme && (
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none animate-fadeIn">
                <div className="px-3 py-1 rounded-md bg-[#151921] border border-blue-500/50 shadow-xl flex items-center space-x-2 text-xs text-white">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/60"
                    style={{ backgroundColor: previewTheme.accentColor }}
                  />
                  <span>
                    Theme Preview: <strong className="text-blue-300">{previewTheme.name}</strong>
                  </span>
                </div>
              </div>
            )}

            <div
              className="w-full max-w-5xl aspect-video transition-transform duration-150 relative shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden ring-1 ring-white/10 flex items-center justify-center bg-black antialiased"
              style={{
                transform: `scale(${canvasZoom / 100})`,
                transformOrigin: "center center",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              {activeSlide && (
                <SlideCanvas
                  slide={
                    slideCtx.previewBuildInStep !== undefined &&
                    activeSlide.buildInConfig?.enabled === false
                      ? {
                          ...activeSlide,
                          buildInConfig: {
                            animation: "slide-up",
                            staggerDelay: 0.2,
                            sequenceMode: "click",
                            ...activeSlide.buildInConfig,
                            enabled: true,
                          },
                        }
                      : activeSlide
                  }
                  language={language}
                  theme={displayedTheme}
                  totalSlides={slides.length}
                  currentSlideIndex={activeSlideIndex}
                  onEditField={(field, val) =>
                    handleUpdateSlide(
                      { ...activeSlide, [field]: val },
                      false,
                      `Slide ${activeSlideIndex + 1} ${field} edit`
                    )
                  }
                  highlightedField={highlightedField}
                  buildInStep={slideCtx.previewBuildInStep}
                  previewTransition={hoverTransition}
                  onCanvasElementClick={(field, idx) => setHighlightedField(idx !== undefined ? `${field}-${idx}` : field)}
                  onUpdateSlide={(updated, pushHistory, actionName) =>
                    handleUpdateSlide(updated, pushHistory ?? false, actionName)
                  }
                  onHighlightedFieldChange={setHighlightedField}
                  onLanguageChange={slideCtx.setLanguage}
                  selectedOverlayId={slideCtx.selectedOverlayId}
                  onSelectOverlayId={slideCtx.setSelectedOverlayId}
                  connectorDraft={slideCtx.connectorDraft}
                  onSetConnectorDraft={slideCtx.setConnectorDraft}
                />
              )}
            </div>
          </div>

          {/* Collapsible Animation Timeline Studio Drawer */}
          <AnimationTimeline />

          {/* Bottom Horizontal Slide Management Dock */}
          <SlideHorizontalDock
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={setActiveSlideIndex}
            onAddSlide={() => modalCtx.openModal("addSlide")}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
            language={language}
          />
        </main>
      </div>

      {/* Floating Action Feedback Toast / PowerPoint Export Progress Toast */}
      {slideCtx.pptxExportProgress ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn pointer-events-none"
        >
          <div className="px-4 py-2 rounded-lg bg-[#151921] border border-orange-500/40 shadow-2xl text-xs font-medium text-slate-100 flex items-center space-x-3">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
            <span className="whitespace-nowrap">{slideCtx.pptxExportProgress.message}</span>
            <span className="text-[11px] font-mono tabular-nums text-orange-300 shrink-0">
              {slideCtx.pptxExportProgress.current}/{slideCtx.pptxExportProgress.total}
            </span>
          </div>
        </div>
      ) : toastMessage ? (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#151921] border border-white/[0.12] shadow-2xl text-xs font-medium text-slate-100 flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      ) : null}

      {/* Floating Pending Drive Update Banner (Prompt Mode) */}
      {pendingDriveUpdate && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown max-w-lg w-full px-4">
          <div className="bg-[#121620] border border-indigo-500/50 shadow-2xl rounded-2xl p-4 flex items-center justify-between text-xs backdrop-blur-md">
            <div>
              <div className="font-semibold text-indigo-300">Google Drive 동기화 알림</div>
              <div className="text-gray-400 mt-0.5">
                "{pendingDriveUpdate.fileName}"에 원격 수정사항이 감지되었습니다.
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <button
                onClick={() => {
                  setSlidesWithHistory(
                    pendingDriveUpdate.slides,
                    `Google Drive [${pendingDriveUpdate.fileName}] 변경사항 반영`,
                    activeSlideIndex,
                    true
                  );
                  const updatedConfig = {
                    ...driveSyncConfig,
                    lastModifiedTime: pendingDriveUpdate.modifiedTime,
                    lastSyncedAt: Date.now(),
                  };
                  setDriveSyncConfig(updatedConfig);
                  setPendingDriveUpdate(null);
                  triggerToast(`✨ "${pendingDriveUpdate.fileName}" 변경사항이 반영되었습니다.`);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>지금 반영하기</span>
              </button>
              <button
                onClick={() => setPendingDriveUpdate(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 transition text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Intranet RAG Auto-Pilot Diff & Recommendation Banner */}
      {slideCtx.showRagBanner && slideCtx.ragSuggestions.filter((s) => !s.applied).length > 0 && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown max-w-2xl w-full px-4 select-none">
          <div className="bg-[#111520]/95 border border-blue-500/50 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.85)] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs backdrop-blur-md ring-1 ring-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-white tracking-tight">
                    Latest source document data detected.
                  </span>
                  <span className="text-blue-300 font-medium">
                    {
                      new Set(
                        slideCtx.ragSuggestions.filter((s) => !s.applied).map((s) => s.slideIndex)
                      ).size
                    }{" "}
                    slides have updated metrics.
                  </span>
                </div>
                {slideCtx.ragSourceDocumentTitle && (
                  <div className="text-slate-400 text-[11px] truncate max-w-md mt-0.5">
                    출처: {slideCtx.ragSourceDocumentTitle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => modalCtx.openModal("ragDiffReview")}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md flex items-center space-x-1 cursor-pointer text-xs"
              >
                <span>Review & Apply Patch</span>
              </button>

              <button
                onClick={() => slideCtx.applyAllRagPatches()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md flex items-center space-x-1.5 cursor-pointer text-xs"
                title="Single-click batch update all fields with full Undo support"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Apply All ({slideCtx.ragSuggestions.filter((s) => !s.applied).length})
                </span>
              </button>

              <button
                onClick={() => slideCtx.dismissRagBanner()}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Presentation & Tooling Modals (Zero Props Drilling) */}
      <ModalContainer />
    </div>
  );
}

function StandalonePresenterWindow() {
  const { slides, displayedTheme, language, activeSlideIndex } = useSlideContext();
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const sessionId = params?.get("session") || "default";

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#090b10]">
      <PresenterView
        slides={slides}
        theme={displayedTheme}
        language={language}
        sessionId={sessionId}
        mode="window"
        initialIndex={activeSlideIndex}
      />
    </div>
  );
}

export default function App() {
  const isPresenterWindow =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("presenter") === "1";

  return (
    <SlideProvider>
      <CollabProvider>
        <ModalProvider>
          {isPresenterWindow ? <StandalonePresenterWindow /> : <AppWorkspace />}
        </ModalProvider>
      </CollabProvider>
    </SlideProvider>
  );
}
