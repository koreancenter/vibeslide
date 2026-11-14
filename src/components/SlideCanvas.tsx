import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { SlideData, Language, PresentationTheme, SlideTransition } from "../types";
import { getAccessibleTheme } from "../utils/luminosity";
import { getJapaneseFallbackText } from "../utils/translationDictionary";
import { InlineEditableText } from "./InlineEditableText";
import { FloatingToolbar, PolishElementCallbackParams } from "./FloatingToolbar";
import { CoverLayout } from "./canvas/CoverLayout";
import { FullImageLayout } from "./canvas/FullImageLayout";
import { SlideFrameHeader } from "./canvas/SlideFrameHeader";
import { SlideFrameFooter } from "./canvas/SlideFrameFooter";
import { CanvasOverlays } from "./canvas/CanvasOverlays";
import { FreeFormOverlay, ConnectorDraftProp } from "./canvas/FreeFormOverlay";
import { LayoutDispatcher } from "./canvas/layouts/LayoutDispatcher";
import { useCanvasInteractions } from "./canvas/hooks/useCanvasInteractions";
import { polishElementWithAi } from "../utils/api";
import { CollabCursorsOverlay } from "./canvas/CollabCursorsOverlay";
import { useCollabContext } from "../context/CollabContext";

interface SlideCanvasProps {
  slide: SlideData;
  language: Language;
  theme: PresentationTheme;
  totalSlides: number;
  currentSlideIndex: number;
  scale?: number;
  buildInStep?: number;
  onEditField?: (field: keyof SlideData, value: any) => void;
  highlightedField?: string | null;
  previewTransition?: SlideTransition | null;
  onCanvasElementClick?: (field: string, index?: number) => void;
  onUpdateSlide?: (updatedSlide: SlideData, pushHistory?: boolean, actionName?: string) => void;
  onHighlightedFieldChange?: (field: string | null) => void;
  onLanguageChange?: (lang: Language) => void;
  selectedOverlayId?: string | null;
  onSelectOverlayId?: (id: string | null) => void;
  connectorDraft?: ConnectorDraftProp | null;
  onSetConnectorDraft?: React.Dispatch<React.SetStateAction<ConnectorDraftProp | null>>;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  language,
  theme: rawTheme,
  totalSlides,
  currentSlideIndex,
  scale,
  buildInStep,
  onEditField,
  highlightedField,
  previewTransition,
  onCanvasElementClick,
  onUpdateSlide,
  onHighlightedFieldChange,
  onLanguageChange,
  selectedOverlayId,
  onSelectOverlayId,
  connectorDraft,
  onSetConnectorDraft,
}) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const collab = useCollabContext();

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !collab.broadcastCursor) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      collab.broadcastCursor(x, y, currentSlideIndex);
    }
  };

  // Canvas Drag & Selection interaction hook
  const interactions = useCanvasInteractions({
    slide,
    onUpdateSlide,
    onCanvasElementClick,
    externalSelectedOverlayId: selectedOverlayId,
    onSelectOverlayId,
  });

  useEffect(() => {
    interactions.resetSelection();
    interactions.setIsColliding(false);
  }, [slide.id]);

  const theme = useMemo(() => {
    const baseTheme = getAccessibleTheme(rawTheme, slide.customBg);
    return {
      ...baseTheme,
      accentColor: slide.customAccentColor || baseTheme.accentColor,
      accentSecondary: slide.customAccentSecondary || baseTheme.accentSecondary,
      badgeBg: slide.customBadgeBg || baseTheme.badgeBg,
      badgeText: slide.customBadgeText || baseTheme.badgeText,
    };
  }, [
    rawTheme,
    slide.customBg,
    slide.customAccentColor,
    slide.customAccentSecondary,
    slide.customBadgeBg,
    slide.customBadgeText,
  ]);

  const getText = (ko: string = "", id: string = "", ja?: string) => {
    if (language === "ko") return ko || id;
    if (language === "ja") return ja || getJapaneseFallbackText(ko || id) || id || ko;
    if (language === "id") return id || ko;
    if (language === "en") return id || ko;
    if (!ko && !id) return "";
    return id || ko;
  };

  const getRawText = (ko: string = "", id: string = "", ja?: string) => {
    if (language === "ko") return ko || id;
    if (language === "ja") return ja || getJapaneseFallbackText(ko || id) || id || ko;
    if (language === "id") return id || ko;
    if (language === "en") return id || ko;
    return `${ko} / ${id}`;
  };

  const currentTitle =
    language === "ko"
      ? (slide.titleKo || slide.titleId || "")
      : language === "ja"
      ? (slide.titleJa || getJapaneseFallbackText(slide.titleKo || slide.titleId) || slide.titleId || slide.titleKo || "")
      : (slide.titleId || slide.titleKo || "");

  const currentSubtitle =
    language === "ko"
      ? (slide.subtitleKo || slide.subtitleId || "")
      : language === "ja"
      ? (slide.subtitleJa || getJapaneseFallbackText(slide.subtitleKo || slide.subtitleId) || slide.subtitleId || slide.subtitleKo || "")
      : (slide.subtitleId || slide.subtitleKo || "");

  const cleanBullets = useMemo(() => {
    if (!slide.bullets || !Array.isArray(slide.bullets)) return [];
    return slide.bullets.filter((b) => {
      const bTitle = (
        language === "ko"
          ? (b.titleKo || b.titleId)
          : language === "ja"
          ? (b.titleJa || getJapaneseFallbackText(b.titleKo || b.titleId) || b.titleId || b.titleKo)
          : (b.titleId || b.titleKo) || ""
      ).trim();
      const bDesc = (
        language === "ko"
          ? (b.descKo || b.descId)
          : language === "ja"
          ? (b.descJa || getJapaneseFallbackText(b.descKo || b.descId) || b.descId || b.descKo)
          : (b.descId || b.descKo) || ""
      ).trim();
      const isDupTitle = bTitle && bTitle === currentTitle.trim();
      const isDupDesc = !bDesc || bDesc === currentSubtitle.trim();
      if (isDupTitle && isDupDesc) return false;
      return Boolean(bTitle || bDesc);
    });
  }, [slide.bullets, currentTitle, currentSubtitle, language]);

  const handleTitleChange = (val: string) => {
    if (onEditField) {
      if (language === "ko") onEditField("titleKo", val);
      else if (language === "ja") onEditField("titleJa", val);
      else onEditField("titleId", val);
    }
  };

  const handleSubtitleChange = (val: string) => {
    if (onEditField) {
      if (language === "ko") onEditField("subtitleKo", val);
      else if (language === "ja") onEditField("subtitleJa", val);
      else onEditField("subtitleId", val);
    }
  };

  const handleBulletTitleChange = (idx: number, val: string) => {
    if (onEditField && slide.bullets) {
      const newBullets = [...slide.bullets];
      newBullets[idx] = { ...newBullets[idx] };
      if (language === "ko") newBullets[idx].titleKo = val;
      else if (language === "ja") newBullets[idx].titleJa = val;
      else newBullets[idx].titleId = val;
      onEditField("bullets", newBullets);
    }
  };

  const handleBulletDescChange = (idx: number, val: string) => {
    if (onEditField && slide.bullets) {
      const newBullets = [...slide.bullets];
      newBullets[idx] = { ...newBullets[idx] };
      if (language === "ko") newBullets[idx].descKo = val;
      else if (language === "ja") newBullets[idx].descJa = val;
      else newBullets[idx].descId = val;
      onEditField("bullets", newBullets);
    }
  };

  const handleImageChange = () => {
    const newUrl = window.prompt("이미지 URL을 입력하거나 AI 프롬프트(Cmd+K)에서 이미지를 직접 첨부하세요:", slide.image?.url || "");
    if (newUrl && onEditField) {
      onEditField("image", {
        ...slide.image,
        url: newUrl,
        captionKo: slide.image?.captionKo || "Visual Asset",
        captionId: slide.image?.captionId || "Visual Asset",
      });
    }
  };

  // Floating toolbar commands
  const handleBold = () => document.execCommand("bold", false);
  const handleItalic = () => document.execCommand("italic", false);
  const handleAlign = (align: "left" | "center" | "right") => {
    if (align === "left") document.execCommand("justifyLeft", false);
    if (align === "center") document.execCommand("justifyCenter", false);
    if (align === "right") document.execCommand("justifyRight", false);
  };
  const handleColorChange = (color: string) => document.execCommand("foreColor", false, color);

  // Target-Specific Element Polishing with Optimistic UI Patch
  const handlePolishElement = async (params: PolishElementCallbackParams) => {
    const { selectedText, fieldType, bulletIndex, instructions, tone } = params;
    if (!selectedText || !selectedText.trim()) return;

    const isKo = language === "ko";
    const isJa = language === "ja";
    const langKey = isKo ? "Ko" : isJa ? "Ja" : "Id";

    // 1. Resolve exact target field type and index
    let resolvedFieldType = fieldType;
    let resolvedBulletIndex = bulletIndex;

    if (!resolvedFieldType || resolvedFieldType === "text") {
      const curTitle = (slide[`title${langKey}` as keyof SlideData] as string) || (slide.titleKo || slide.titleId || "");
      const curSub = (slide[`subtitle${langKey}` as keyof SlideData] as string) || (slide.subtitleKo || slide.subtitleId || "");
      if (curTitle.includes(selectedText)) {
        resolvedFieldType = "title";
      } else if (curSub.includes(selectedText)) {
        resolvedFieldType = "subtitle";
      } else if (slide.bullets) {
        slide.bullets.forEach((b, idx) => {
          const descVal = (b[`desc${langKey}` as keyof typeof b] as string) || (b.descKo || b.descId || "");
          const titleVal = (b[`title${langKey}` as keyof typeof b] as string) || (b.titleKo || b.titleId || "");
          if (descVal.includes(selectedText)) {
            resolvedFieldType = "bullet-desc";
            resolvedBulletIndex = idx;
          } else if (titleVal.includes(selectedText)) {
            resolvedFieldType = "bullet-title";
            resolvedBulletIndex = idx;
          }
        });
      }
    }

    const computeReplaced = (existing: string, replacement: string) => {
      if (selectedText && existing && existing.includes(selectedText) && selectedText.length < existing.length) {
        return existing.replace(selectedText, replacement);
      }
      return replacement;
    };

    // Optimistic UI patch:
    // Update ONLY the corresponding field in SlideData without re-rendering the full slide array!
    const applyPatch = (text: string) => {
      if (resolvedFieldType === "title") {
        const key = `title${langKey}` as keyof SlideData;
        const currentVal = (slide[key] as string) || (slide.titleKo || slide.titleId || "");
        onEditField?.(key, computeReplaced(currentVal, text));
      } else if (resolvedFieldType === "subtitle") {
        const key = `subtitle${langKey}` as keyof SlideData;
        const currentVal = (slide[key] as string) || (slide.subtitleKo || slide.subtitleId || "");
        onEditField?.(key, computeReplaced(currentVal, text));
      } else if (resolvedFieldType === "bullet-title" && resolvedBulletIndex !== undefined && slide.bullets) {
        const newBullets = [...slide.bullets];
        if (newBullets[resolvedBulletIndex]) {
          const b = { ...newBullets[resolvedBulletIndex] };
          const key = `title${langKey}` as "titleKo" | "titleId" | "titleJa";
          b[key] = computeReplaced(b[key] || "", text);
          newBullets[resolvedBulletIndex] = b;
          onEditField?.("bullets", newBullets);
        }
      } else if (resolvedFieldType === "bullet-desc" && resolvedBulletIndex !== undefined && slide.bullets) {
        const newBullets = [...slide.bullets];
        if (newBullets[resolvedBulletIndex]) {
          const b = { ...newBullets[resolvedBulletIndex] };
          const key = `desc${langKey}` as "descKo" | "descId" | "descJa";
          b[key] = computeReplaced(b[key] || "", text);
          newBullets[resolvedBulletIndex] = b;
          onEditField?.("bullets", newBullets);
        }
      } else {
        const curTitle = (slide[`title${langKey}` as keyof SlideData] as string) || (slide.titleKo || "");
        const curSub = (slide[`subtitle${langKey}` as keyof SlideData] as string) || (slide.subtitleKo || "");
        if (curTitle.includes(selectedText)) {
          const key = `title${langKey}` as keyof SlideData;
          onEditField?.(key, computeReplaced(curTitle, text));
        } else if (curSub.includes(selectedText)) {
          const key = `subtitle${langKey}` as keyof SlideData;
          onEditField?.(key, computeReplaced(curSub, text));
        }
      }
    };

    // 1. Optimistic patch immediately (applies clean trimmed version instantly)
    const optimisticDraft = selectedText.trim();
    applyPatch(optimisticDraft);

    // 2. Call backend endpoint
    const slideContext = {
      category: isKo ? slide.categoryKo : slide.categoryId,
      title: isKo ? slide.titleKo : slide.titleId,
      subtitle: isKo ? slide.subtitleKo : slide.subtitleId,
      layout: slide.layout,
    };

    try {
      const revisedText = await polishElementWithAi({
        selectedText,
        fieldType: resolvedFieldType,
        slideContext,
        instructions,
        tone: tone || "quiet-luxury",
      });

      if (revisedText && revisedText.trim() && revisedText.trim() !== optimisticDraft) {
        applyPatch(revisedText.trim());
      }
    } catch (err: any) {
      console.warn("AI polish element notice:", err?.message || err);
    }
  };

  const transitionToPlay = previewTransition || slide.transition || "fade";

  const variants = {
    fade: { opacity: [0, 1], scale: 1, x: 0, rotateY: 0, clipPath: "inset(0 0% 0 0)" },
    "slide-in": { opacity: [0, 1], x: [-60, 0], scale: 1, rotateY: 0, clipPath: "inset(0 0% 0 0)" },
    wipe: { opacity: [0, 1], clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], scale: 1, x: 0, rotateY: 0 },
    zoom: { opacity: [0, 1], scale: [0.94, 1], x: 0, rotateY: 0, clipPath: "inset(0 0% 0 0)" },
    flip: { opacity: [0, 1], rotateY: [90, 0], scale: 1, x: 0, clipPath: "inset(0 0% 0 0)" },
    none: { opacity: 1, scale: 1, x: 0, rotateY: 0, clipPath: "inset(0 0% 0 0)" },
  };

  const getTransitionProps = () => {
    if (transitionToPlay === "none") return { duration: 0 };
    return { duration: 0.35, ease: "easeInOut" };
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleCanvasMouseMove}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest("[data-overlay-id]")) {
          if (connectorDraft?.active && onSetConnectorDraft) {
            onSetConnectorDraft(null);
          }
          if (interactions.selectedOverlayId) {
            interactions.setSelectedOverlayId(null);
          }
          if (interactions.editingOverlayId) {
            interactions.setEditingOverlayId(null);
          }
        }
      }}
      className="relative w-full h-full font-sans overflow-hidden group/canvas"
      style={{ perspective: "1000px" }}
      onDragOver={(e) => {
        if (interactions.draggedIndex !== null) {
          const colliding = interactions.checkCollision(e.clientX, e.clientY);
          if (colliding !== interactions.isColliding) {
            interactions.setIsColliding(colliding);
          }
          if (colliding) {
            interactions.setDragOverIndex(null);
            interactions.setSnappedCol(null);
            interactions.setSnappedRow(null);
          }
        }
      }}
    >
      {/* Floating Formatting Toolbar with AI Polish */}
      <FloatingToolbar
        onBold={handleBold}
        onItalic={handleItalic}
        onAlign={handleAlign}
        onColorChange={handleColorChange}
        onPolishElement={handlePolishElement}
      />

      {/* Background (Solid or Image) */}
      <div
        className="absolute inset-0 transition-colors"
        style={{
          backgroundColor: slide.customBg || theme.canvasBg,
          backgroundImage: slide.customBg ? "none" : theme.backgroundImage,
        }}
      />

      <motion.div
        key={`${slide.id}-${transitionToPlay}`}
        animate="animate"
        variants={{
          animate: variants[transitionToPlay] || variants.fade,
        }}
        transition={getTransitionProps()}
        className="w-full h-full relative"
      >
        {/* Render Cover Layout */}
        {slide.layout === "cover" && (
          <CoverLayout
            slide={slide}
            theme={theme}
            totalSlides={totalSlides}
            currentSlideIndex={currentSlideIndex}
            currentTitle={currentTitle}
            currentSubtitle={currentSubtitle}
            onTitleChange={handleTitleChange}
            onSubtitleChange={handleSubtitleChange}
            highlightedField={highlightedField}
            onCanvasElementClick={onCanvasElementClick}
            getRawText={getRawText}
            language={language}
            onLanguageChange={onLanguageChange}
          />
        )}

        {/* Render Full-Image Layout */}
        {slide.layout === "full-image" && (
          <FullImageLayout
            slide={slide}
            theme={theme}
            totalSlides={totalSlides}
            currentSlideIndex={currentSlideIndex}
            currentTitle={currentTitle}
            currentSubtitle={currentSubtitle}
            onTitleChange={handleTitleChange}
            onSubtitleChange={handleSubtitleChange}
            onImageChange={handleImageChange}
            highlightedField={highlightedField}
            onCanvasElementClick={onCanvasElementClick}
            getRawText={getRawText}
            getText={getText}
          />
        )}

        {/* Render Other Layouts via Strategy Dispatcher */}
        {slide.layout !== "cover" && slide.layout !== "full-image" && (
          <div
            className="w-full aspect-video rounded-xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl select-text"
            style={{
              backgroundColor: theme.canvasBg,
              color: theme.textColor,
              borderColor: theme.borderColor,
              borderWidth: 1,
            }}
          >
            {/* Header */}
            <SlideFrameHeader
              slide={slide}
              theme={theme}
              totalSlides={totalSlides}
              currentSlideIndex={currentSlideIndex}
              onImageChange={handleImageChange}
              getRawText={getRawText}
            />

            {/* Main Title & Subtitle */}
            <div className="my-3 space-y-1.5">
              <div
                className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer ${
                  highlightedField === "title"
                    ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
                    : "hover:bg-black/[0.03]"
                }`}
                onClick={() => onCanvasElementClick?.("title")}
                data-collision-zone="static"
              >
                <InlineEditableText
                  value={currentTitle}
                  onChange={handleTitleChange}
                  tag="h2"
                  className="text-xl sm:text-2xl font-bold tracking-tight mb-1"
                  fieldType="title"
                />
              </div>
              <div
                className={`transition-all duration-150 rounded-lg p-1 -m-1 cursor-pointer ${
                  highlightedField === "subtitle"
                    ? "ring-1.5 ring-blue-500/90 bg-blue-500/[0.08]"
                    : "hover:bg-black/[0.03]"
                }`}
                onClick={() => onCanvasElementClick?.("subtitle")}
                data-collision-zone="static"
              >
                <InlineEditableText
                  value={currentSubtitle}
                  onChange={handleSubtitleChange}
                  tag="p"
                  className="text-xs sm:text-sm opacity-80"
                  placeholder="Enter subtitle..."
                  fieldType="subtitle"
                />
              </div>
            </div>

            {/* Modular Content Body */}
            <div className="flex-1 flex flex-col justify-center my-2 overflow-hidden">
              <LayoutDispatcher
                slide={slide}
                theme={theme}
                language={language}
                getText={getText}
                getRawText={getRawText}
                highlightedField={highlightedField}
                onCanvasElementClick={onCanvasElementClick}
                onBulletTitleChange={handleBulletTitleChange}
                onBulletDescChange={handleBulletDescChange}
                onImageChange={handleImageChange}
                selectedIndices={interactions.selectedIndices}
                selectedType={interactions.selectedType}
                draggedIndex={interactions.draggedIndex}
                draggedType={interactions.draggedType}
                dragOverIndex={interactions.dragOverIndex}
                snappedCol={interactions.snappedCol}
                snappedRow={interactions.snappedRow}
                handleDragStart={interactions.handleDragStart}
                handleDragOver={interactions.handleDragOver}
                handleDrop={interactions.handleDrop}
                handleDragEnd={interactions.handleDragEnd}
                handleItemClick={interactions.handleItemClick}
                cleanBullets={cleanBullets}
                buildInStep={buildInStep}
                buildInConfig={slide.buildInConfig}
              />
            </div>

            {/* Footer */}
            <SlideFrameFooter slide={slide} theme={theme} />
          </div>
        )}

        {/* Free-Form Canvas Overlay Layer (on top of active preset layout) */}
        <FreeFormOverlay
          elements={slide.overlayElements || []}
          canvasRef={canvasRef}
          theme={theme}
          editable={Boolean(onUpdateSlide)}
          selectedOverlayId={interactions.selectedOverlayId}
          editingOverlayId={interactions.editingOverlayId}
          draftOverlayElement={interactions.draftOverlayElement}
          activeSnapGuides={interactions.activeSnapGuides}
          isManipulatingOverlay={interactions.isManipulatingOverlay}
          liveRotationAngle={interactions.liveRotationAngle}
          connectorDraft={connectorDraft}
          onConnectorNodeClick={(elementId) => {
            if (!connectorDraft?.active || !onSetConnectorDraft) return;
            if (!connectorDraft.sourceId) {
              onSetConnectorDraft({ ...connectorDraft, sourceId: elementId });
            } else if (connectorDraft.sourceId === elementId) {
              onSetConnectorDraft({ ...connectorDraft, sourceId: null });
            } else {
              interactions.createSmartConnector(
                connectorDraft.sourceId,
                elementId,
                connectorDraft.connectorType,
                theme.accentColor || "#3b82f6"
              );
              onSetConnectorDraft(null);
            }
          }}
          onSelectOverlay={interactions.setSelectedOverlayId}
          onStartEditOverlay={interactions.setEditingOverlayId}
          onStartDrag={interactions.startOverlayDrag}
          onStartResize={interactions.startOverlayResize}
          onStartRotate={interactions.startOverlayRotate}
          onUpdateContent={interactions.updateOverlayContent}
          onUpdateStyle={interactions.updateOverlayStyle}
          onUpdateConnector={interactions.updateOverlayConnector}
          onBringToFront={interactions.bringOverlayToFront}
          onSendToBack={interactions.sendOverlayToBack}
          onBringForward={interactions.bringOverlayForward}
          onSendBackward={interactions.sendOverlayBackward}
          onAlignElement={interactions.alignOverlayElement}
          onDuplicateElement={interactions.duplicateOverlayElement}
          onDeleteElement={interactions.deleteOverlayElement}
          onNudgeElement={interactions.nudgeOverlayElement}
        />
      </motion.div>

      {/* Collaboration Live Peer Cursors Overlay */}
      <CollabCursorsOverlay currentSlideIndex={currentSlideIndex} />

      {/* Canvas Overlays (Grid & Collision) */}
      <CanvasOverlays
        slide={slide}
        draggedIndex={interactions.draggedIndex}
        snappedCol={interactions.snappedCol}
        snappedRow={interactions.snappedRow}
        isColliding={interactions.isColliding}
      />
    </div>
  );
};
