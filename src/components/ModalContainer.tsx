import React, { Suspense } from "react";
import { PrintView } from "./PrintView";
import { useSlideContext } from "../context/SlideContext";
import { useModalContext } from "../context/ModalContext";
import { SlideData } from "../types";

const GoogleDriveSyncModal = React.lazy(() =>
  import("./GoogleDriveSyncModal").then((m) => ({ default: m.GoogleDriveSyncModal }))
);
const PresentationMode = React.lazy(() =>
  import("./PresentationMode").then((m) => ({ default: m.PresentationMode }))
);
const BatchTranslateModal = React.lazy(() =>
  import("./BatchTranslateModal").then((m) => ({ default: m.BatchTranslateModal }))
);
const HistoryModal = React.lazy(() =>
  import("./HistoryModal").then((m) => ({ default: m.HistoryModal }))
);
const KeyboardShortcutsModal = React.lazy(() =>
  import("./KeyboardShortcutsModal").then((m) => ({ default: m.KeyboardShortcutsModal }))
);
const PdfExportModal = React.lazy(() =>
  import("./PdfExportModal").then((m) => ({ default: m.PdfExportModal }))
);
const AiThemeRecommenderModal = React.lazy(() =>
  import("./AiThemeRecommenderModal").then((m) => ({ default: m.AiThemeRecommenderModal }))
);
const AiImportModal = React.lazy(() =>
  import("./AiImportModal").then((m) => ({ default: m.AiImportModal }))
);
const AiPromptCommandBar = React.lazy(() =>
  import("./AiPromptCommandBar").then((m) => ({ default: m.AiPromptCommandBar }))
);
const AiSettingsModal = React.lazy(() =>
  import("./AiSettingsModal").then((m) => ({ default: m.AiSettingsModal }))
);
const RagDiffReviewModal = React.lazy(() =>
  import("./RagDiffReviewModal").then((m) => ({ default: m.RagDiffReviewModal }))
);
const ConstitutionModal = React.lazy(() =>
  import("./ConstitutionModal").then((m) => ({ default: m.ConstitutionModal }))
);
const CollabModal = React.lazy(() =>
  import("./CollabModal").then((m) => ({ default: m.CollabModal }))
);
const WebPublishModal = React.lazy(() =>
  import("./WebPublishModal").then((m) => ({ default: m.WebPublishModal }))
);
const TimelineAnimationModal = React.lazy(() =>
  import("./TimelineAnimationModal").then((m) => ({ default: m.TimelineAnimationModal }))
);

export const ModalContainer: React.FC = () => {
  const slideCtx = useSlideContext();
  const modalCtx = useModalContext();

  const {
    slides,
    activeSlideIndex,
    activeSlide,
    language,
    currentTheme,
    setCurrentTheme,
    setLanguage,
    setSlidesWithHistory,
    handleUpdateSlide,
    triggerToast,
    driveSyncConfig,
    setDriveSyncConfig,
    isSyncingDrive,
    handleManualDriveSync,
    historyTimeline,
    canUndo,
    canRedo,
    handleManualUndo,
    handleManualRedo,
    jumpToHistoryIndex,
    clearHistory,
    handlePrint,
  } = slideCtx;

  const { isModalOpen, closeModal } = modalCtx;

  return (
    <Suspense fallback={null}>
      {/* Modal: Google Drive Real-Time Sync & Source Config */}
      {isModalOpen("drive") && (
        <GoogleDriveSyncModal
          isOpen={isModalOpen("drive")}
          onClose={() => closeModal("drive")}
          syncConfig={driveSyncConfig}
          onUpdateSyncConfig={setDriveSyncConfig}
          currentSlides={slides}
          onApplySyncedSlides={(newSlides, sourceFileName) => {
            setSlidesWithHistory(newSlides, `Google Drive [${sourceFileName}] 연동 동기화`, 0, true);
            triggerToast(`✨ Google Drive "${sourceFileName}" 내용으로 ${newSlides.length}개 슬라이드가 연동되었습니다.`);
          }}
          language={language}
          onManualSyncTrigger={handleManualDriveSync}
          isSyncingNow={isSyncingDrive}
        />
      )}

      {/* Modal: Fullscreen 16:9 Presentation Mode */}
      {isModalOpen("presentation") && (
        <PresentationMode
          slides={slides}
          initialIndex={activeSlideIndex}
          language={language}
          theme={currentTheme}
          onClose={() => closeModal("presentation")}
          onLanguageChange={setLanguage}
        />
      )}

      {/* Modal: Deck-wide Batch Translation with Gemini */}
      {isModalOpen("batchTranslate") && (
        <BatchTranslateModal
          isOpen={isModalOpen("batchTranslate")}
          onClose={() => closeModal("batchTranslate")}
          slides={slides}
          onUpdateSlides={(newSlides) =>
            setSlidesWithHistory(newSlides, "전체 슬라이드 AI 자동 번역", activeSlideIndex, true)
          }
        />
      )}

      {/* Modal: Undo / Redo History Timeline Manager */}
      {isModalOpen("history") && (
        <HistoryModal
          isOpen={isModalOpen("history")}
          onClose={() => closeModal("history")}
          timeline={historyTimeline}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleManualUndo}
          onRedo={handleManualRedo}
          onJumpToPastIndex={jumpToHistoryIndex}
          onClearHistory={clearHistory}
        />
      )}

      {/* Modal: Keyboard Shortcuts Cheat Sheet */}
      {isModalOpen("shortcuts") && (
        <KeyboardShortcutsModal
          isOpen={isModalOpen("shortcuts")}
          onClose={() => closeModal("shortcuts")}
        />
      )}

      {/* Modal: AI Document Import & Upgrade */}
      {isModalOpen("aiImport") && (
        <AiImportModal
          isOpen={isModalOpen("aiImport")}
          onClose={() => closeModal("aiImport")}
          onImportUpgradedSlides={(newSlides: SlideData[]) => {
            setSlidesWithHistory(newSlides, "AI 문서 변환 및 슬라이드 생성", 0, true);
            triggerToast(`✨ AI가 ${newSlides.length}장의 16:9 슬라이드를 생성했습니다.`);
          }}
        />
      )}

      {/* Modal: High-Fidelity 16:9 PDF Export */}
      {isModalOpen("pdfExport") && (
        <PdfExportModal
          isOpen={isModalOpen("pdfExport")}
          onClose={() => closeModal("pdfExport")}
          slides={slides}
          currentSlideIndex={activeSlideIndex}
          currentLanguage={language}
          currentTheme={currentTheme}
          onTriggerNativePrint={handlePrint}
        />
      )}

      {/* Modal: AI Theme Recommender */}
      {isModalOpen("themeRecommender") && (
        <AiThemeRecommenderModal
          isOpen={isModalOpen("themeRecommender")}
          onClose={() => closeModal("themeRecommender")}
          activeSlide={activeSlide}
          currentTheme={currentTheme}
          onThemeChange={(newTheme) => {
            setCurrentTheme(newTheme);
            triggerToast(`🎨 전체 디자인 테마가 "${newTheme.name}"(으)로 변경되었습니다.`);
          }}
        />
      )}

      {/* Modal: Universal AI Prompt Command Bar (Cmd+K) */}
      {isModalOpen("aiPromptBar") && <AiPromptCommandBar />}

      {/* Modal: AI Engine & Provider Settings (Gemini Cloud / Local Ollama / Offline) */}
      {isModalOpen("aiSettings") && <AiSettingsModal />}

      {/* Modal: Enterprise Design Constitution & Brand Governance */}
      {isModalOpen("constitution") && <ConstitutionModal />}

      {/* Modal: Intranet RAG Auto-Pilot Diff & Recommendation Review */}
      {isModalOpen("ragDiffReview") && (
        <RagDiffReviewModal
          isOpen={isModalOpen("ragDiffReview")}
          onClose={() => closeModal("ragDiffReview")}
          suggestions={slideCtx.ragSuggestions}
          slides={slides}
          sourceDocumentTitle={slideCtx.ragSourceDocumentTitle}
          onApplySinglePatch={slideCtx.applySingleRagPatch}
          onApplyAllPatches={() => {
            slideCtx.applyAllRagPatches();
            closeModal("ragDiffReview");
          }}
          onRunDiffWithDocument={async (content, title) => {
            await slideCtx.runRagAutoPilot(content, title);
          }}
          isAnalyzing={slideCtx.isAnalyzingRag}
        />
      )}

      {/* Modal: Real-time Multi-User Collaboration & Cursors */}
      {isModalOpen("collab") && (
        <CollabModal isOpen={isModalOpen("collab")} onClose={() => closeModal("collab")} />
      )}

      {/* Modal: One-Click Web Publishing & Interactive Embed */}
      {isModalOpen("webPublish") && (
        <WebPublishModal isOpen={isModalOpen("webPublish")} onClose={() => closeModal("webPublish")} />
      )}

      {/* Modal: Slide Component Animation & Transition Timeline */}
      {isModalOpen("timelineAnimation") && (
        <TimelineAnimationModal
          isOpen={isModalOpen("timelineAnimation")}
          onClose={() => closeModal("timelineAnimation")}
        />
      )}

      {/* Hidden Print View for 16:9 PDF Export */}
      <PrintView slides={slides} language={language} theme={currentTheme} />
    </Suspense>
  );
};
