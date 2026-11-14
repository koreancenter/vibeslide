import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalJustifyCenter,
  Palette,
  Minus,
  Plus,
  ImageOff,
  Spline,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import {
  CanvasConnectorData,
  CanvasElement,
  CanvasElementStyle,
  CanvasShapeStylePreset,
  PresentationTheme,
  SlideData,
} from "../../types";
import { OverlayAlignment, ResizeHandle, SnapGuide } from "./hooks/useCanvasInteractions";
import { getLucideIconComponent } from "../../data/iconRegistry";
import { getElementBuildInState } from "../../utils/componentAnimation";
import {
  SVG_VIEWBOX_H,
  SVG_VIEWBOX_W,
  SvgVectorShape,
  buildShapePresetStyle,
  computeConnectorGeometry,
  isSvgShapeVariant,
} from "./shapeRenderUtils";

export interface ConnectorDraftProp {
  active: boolean;
  connectorType: "straight" | "elbow";
  sourceId: string | null;
}

interface FreeFormOverlayProps {
  elements: CanvasElement[];
  slide?: SlideData;
  buildInStep?: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  theme: PresentationTheme;
  editable: boolean;
  selectedOverlayId: string | null;
  editingOverlayId: string | null;
  draftOverlayElement: CanvasElement | null;
  activeSnapGuides: SnapGuide[];
  isManipulatingOverlay: boolean;
  liveRotationAngle: number | null;
  connectorDraft?: ConnectorDraftProp | null;
  onConnectorNodeClick?: (elementId: string) => void;
  onSelectOverlay: (id: string | null) => void;
  onStartEditOverlay: (id: string | null) => void;
  onStartDrag: (e: React.PointerEvent, el: CanvasElement, canvasEl: HTMLElement | null) => void;
  onStartResize: (
    e: React.PointerEvent,
    el: CanvasElement,
    handle: ResizeHandle,
    canvasEl: HTMLElement | null
  ) => void;
  onStartRotate: (e: React.PointerEvent, el: CanvasElement, canvasEl: HTMLElement | null) => void;
  onUpdateContent: (id: string, content: string) => void;
  onUpdateStyle: (id: string, stylePatch: Partial<CanvasElementStyle>, actionName?: string) => void;
  onUpdateConnector?: (
    id: string,
    connectorPatch: Partial<CanvasConnectorData>,
    actionName?: string
  ) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onAlignElement: (id: string, alignment: OverlayAlignment) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onNudgeElement: (id: string, dxPct: number, dyPct: number) => void;
}

const RESIZE_HANDLES: {
  handle: ResizeHandle;
  positionClass: string;
  cursor: string;
  isEdge?: boolean;
}[] = [
  { handle: "nw", positionClass: "-top-1.5 -left-1.5 w-3 h-3", cursor: "nwse-resize" },
  { handle: "n", positionClass: "-top-1 left-1/2 -translate-x-1/2 w-4 h-2", cursor: "ns-resize", isEdge: true },
  { handle: "ne", positionClass: "-top-1.5 -right-1.5 w-3 h-3", cursor: "nesw-resize" },
  { handle: "e", positionClass: "top-1/2 -right-1 -translate-y-1/2 w-2 h-4", cursor: "ew-resize", isEdge: true },
  { handle: "se", positionClass: "-bottom-1.5 -right-1.5 w-3 h-3", cursor: "nwse-resize" },
  { handle: "s", positionClass: "-bottom-1 left-1/2 -translate-x-1/2 w-4 h-2", cursor: "ns-resize", isEdge: true },
  { handle: "sw", positionClass: "-bottom-1.5 -left-1.5 w-3 h-3", cursor: "nesw-resize" },
  { handle: "w", positionClass: "top-1/2 -left-1 -translate-y-1/2 w-2 h-4", cursor: "ew-resize", isEdge: true },
];

const FILL_SWATCHES = [
  "transparent",
  "#0f172a",
  "#1e293b",
  "#ffffff",
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const COLOR_SWATCHES = [
  "#ffffff",
  "#0f172a",
  "#94a3b8",
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const SHAPE_PRESETS: { id: CanvasShapeStylePreset; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "outline", label: "Outline" },
  { id: "glass", label: "Glass" },
  { id: "shadow", label: "Shadow" },
];

const OverlayImageContent: React.FC<{ element: CanvasElement }> = ({ element }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [element.content]);

  if (hasError || !element.content) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-slate-300 p-2 text-center select-none">
        <ImageOff className="w-6 h-6 text-slate-400 mb-1" />
        <span className="text-[11px] font-medium truncate max-w-full">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={element.content}
      alt="Canvas object"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setHasError(true)}
      className="w-full h-full pointer-events-none select-none"
      style={{
        objectFit: element.style.objectFit || "cover",
        borderRadius: element.style.borderRadius !== undefined ? `${element.style.borderRadius}px` : "8px",
      }}
    />
  );
};

export const FreeFormOverlay: React.FC<FreeFormOverlayProps> = ({
  elements,
  slide,
  buildInStep,
  canvasRef,
  theme,
  editable,
  selectedOverlayId,
  editingOverlayId,
  draftOverlayElement,
  activeSnapGuides,
  isManipulatingOverlay,
  liveRotationAngle,
  connectorDraft,
  onConnectorNodeClick,
  onSelectOverlay,
  onStartEditOverlay,
  onStartDrag,
  onStartResize,
  onStartRotate,
  onUpdateContent,
  onUpdateStyle,
  onUpdateConnector,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onAlignElement,
  onDuplicateElement,
  onDeleteElement,
  onNudgeElement,
}) => {
  const selectedElementRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [editingDraftText, setEditingDraftText] = useState("");
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; placeBelow: boolean } | null>(
    null
  );
  const [openSubMenu, setOpenSubMenu] = useState<"align" | "style" | null>(null);

  // Merge draft element during active pointer manipulation and sort by zIndex ascending
  const renderedElements = React.useMemo(() => {
    const merged = elements.map((el) =>
      draftOverlayElement && draftOverlayElement.id === el.id ? draftOverlayElement : el
    );
    return [...merged].sort((a, b) => a.zIndex - b.zIndex);
  }, [elements, draftOverlayElement]);

  const selectedElement = React.useMemo(
    () => renderedElements.find((el) => el.id === selectedOverlayId) || null,
    [renderedElements, selectedOverlayId]
  );

  // Close submenus when selection changes
  useEffect(() => {
    setOpenSubMenu(null);
  }, [selectedOverlayId]);

  // Focus inline textarea when entering edit mode
  useEffect(() => {
    if (!editingOverlayId) return;
    const target = elements.find((el) => el.id === editingOverlayId);
    if (target) {
      setEditingDraftText(target.content || "");
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });
    }
  }, [editingOverlayId, elements]);

  // Compute floating toolbar coordinates relative to viewport
  const updateToolbarPosition = React.useCallback(() => {
    if (
      !editable ||
      !selectedElement ||
      !selectedElementRef.current ||
      isManipulatingOverlay ||
      editingOverlayId ||
      connectorDraft?.active
    ) {
      setToolbarPos(null);
      return;
    }
    const rect = selectedElementRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && selectedElement.type !== "connector") {
      setToolbarPos(null);
      return;
    }
    const placeBelow = rect.top < 115;
    const top = placeBelow ? rect.bottom + 14 : rect.top - 14;
    const left = Math.max(220, Math.min(window.innerWidth - 220, rect.left + rect.width / 2));
    setToolbarPos({ top, left, placeBelow });
  }, [editable, selectedElement, isManipulatingOverlay, editingOverlayId, connectorDraft?.active]);

  useLayoutEffect(() => {
    updateToolbarPosition();
  }, [
    updateToolbarPosition,
    selectedElement?.x,
    selectedElement?.y,
    selectedElement?.width,
    selectedElement?.height,
    selectedElement?.rotation,
    selectedElement?.zIndex,
    selectedElement?.connector?.connectorType,
    renderedElements,
  ]);

  useEffect(() => {
    if (!editable || !selectedElement) return;
    const viewport = document.getElementById("viewport-container");
    const onScrollOrResize = () => updateToolbarPosition();

    window.addEventListener("resize", onScrollOrResize);
    viewport?.addEventListener("scroll", onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      viewport?.removeEventListener("scroll", onScrollOrResize);
    };
  }, [editable, selectedElement, updateToolbarPosition]);

  // Keyboard shortcuts when an overlay element is selected (and not typing)
  useEffect(() => {
    if (!editable || !selectedOverlayId || editingOverlayId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDeleteElement(selectedOverlayId);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onSelectOverlay(null);
        return;
      }

      if (isMod && e.key.toLowerCase() === "d") {
        if (selectedElement?.type === "connector") return;
        e.preventDefault();
        onDuplicateElement(selectedOverlayId);
        return;
      }

      if (isMod && e.key === "]") {
        e.preventDefault();
        if (e.shiftKey) onBringToFront(selectedOverlayId);
        else onBringForward(selectedOverlayId);
        return;
      }

      if (isMod && e.key === "[") {
        e.preventDefault();
        if (e.shiftKey) onSendToBack(selectedOverlayId);
        else onSendBackward(selectedOverlayId);
        return;
      }

      if (selectedElement?.type === "connector") return;

      const step = e.shiftKey ? 2 : 0.5;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNudgeElement(selectedOverlayId, -step, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNudgeElement(selectedOverlayId, step, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onNudgeElement(selectedOverlayId, 0, -step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onNudgeElement(selectedOverlayId, 0, step);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editable,
    selectedOverlayId,
    editingOverlayId,
    selectedElement?.type,
    onDeleteElement,
    onSelectOverlay,
    onDuplicateElement,
    onBringToFront,
    onBringForward,
    onSendToBack,
    onSendBackward,
    onNudgeElement,
  ]);

  const commitInlineText = (id: string) => {
    onUpdateContent(id, editingDraftText);
    onStartEditOverlay(null);
  };

  if (renderedElements.length === 0 && activeSnapGuides.length === 0) {
    return null;
  }

  const getShapeRadius = (el: CanvasElement): string => {
    if (el.style.borderRadius !== undefined) return `${el.style.borderRadius}px`;
    switch (el.style.shapeVariant) {
      case "circle":
      case "pill":
        return "9999px";
      case "rounded":
        return "14px";
      case "line":
        return "9999px";
      case "rectangle":
      default:
        return "4px";
    }
  };

  const selectedLayerRank = selectedElement
    ? renderedElements.findIndex((el) => el.id === selectedElement.id) + 1
    : 0;

  const isConnecting = Boolean(editable && connectorDraft?.active);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-[25] overflow-hidden rounded-xl">
        {/* Smart Alignment Snap Guides */}
        {editable &&
          activeSnapGuides.map((guide, i) => {
            const isCenter = guide.kind === "center";
            const color = isCenter ? "#f43f5e" : "#3b82f6";
            if (guide.orientation === "vertical") {
              return (
                <div
                  key={`v-${guide.position}-${i}`}
                  className="absolute top-0 bottom-0 pointer-events-none z-50"
                  style={{
                    left: `${guide.position}%`,
                    width: "1px",
                    borderLeft: `1.5px ${isCenter ? "solid" : "dashed"} ${color}`,
                    boxShadow: `0 0 8px ${color}80`,
                  }}
                />
              );
            }
            return (
              <div
                key={`h-${guide.position}-${i}`}
                className="absolute left-0 right-0 pointer-events-none z-50"
                style={{
                  top: `${guide.position}%`,
                  height: "1px",
                  borderTop: `1.5px ${isCenter ? "solid" : "dashed"} ${color}`,
                  boxShadow: `0 0 8px ${color}80`,
                }}
              />
            );
          })}

        {/* Rendered Free-Form Overlay Elements (Nodes & Smart Connectors) */}
        {renderedElements.map((el) => {
          const isSelected = editable && !isConnecting && el.id === selectedOverlayId;
          const isEditing = editable && el.id === editingOverlayId;

          const overlayAnim = slide
            ? getElementBuildInState(`overlay:${el.id}`, slide, buildInStep)
            : { isVisible: true, style: {}, className: "" };

          // --------------------------------------------------------------
          // SMART CONNECTOR ELEMENT
          // --------------------------------------------------------------
          if (el.type === "connector") {
            const geom = computeConnectorGeometry(el, renderedElements);
            const strokeColor = el.style.borderColor || el.style.color || theme.accentColor || "#3b82f6";
            const strokeW = Math.max(1.5, el.style.strokeWidth || 3);
            const showStart = Boolean(el.connector?.arrowStart);
            const showEnd = el.connector?.arrowEnd ?? true;
            const endMarkerId = `con-end-${el.id}`;
            const startMarkerId = `con-start-${el.id}`;
            const midLeftPct = (geom.midX / SVG_VIEWBOX_W) * 100;
            const midTopPct = (geom.midY / SVG_VIEWBOX_H) * 100;

            return (
              <React.Fragment key={el.id}>
                <svg
                  viewBox={`0 0 ${SVG_VIEWBOX_W} ${SVG_VIEWBOX_H}`}
                  preserveAspectRatio="none"
                  className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible ${overlayAnim.className}`}
                  style={{
                    ...overlayAnim.style,
                    zIndex: el.zIndex,
                    opacity: overlayAnim.isVisible ? (el.style.opacity ?? 1) : 0,
                  }}
                >
                  <defs>
                    <marker
                      id={endMarkerId}
                      viewBox="0 0 10 10"
                      refX="8.5"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 5, 0 10" fill={strokeColor} />
                    </marker>
                    <marker
                      id={startMarkerId}
                      viewBox="0 0 10 10"
                      refX="1.5"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto"
                    >
                      <polygon points="10 0, 0 5, 10 10" fill={strokeColor} />
                    </marker>
                  </defs>

                  {/* Selected Blue Highlight Halo */}
                  {isSelected && (
                    <path
                      d={geom.pathD}
                      fill="none"
                      stroke="#3b82f6"
                      strokeOpacity={0.35}
                      strokeWidth={strokeW + 8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Connector Line / Elbow Path */}
                  <path
                    d={geom.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerStart={showStart ? `url(#${startMarkerId})` : undefined}
                    markerEnd={showEnd ? `url(#${endMarkerId})` : undefined}
                  />

                  {/* Endpoint Handles when Selected */}
                  {isSelected && (
                    <>
                      <circle
                        cx={geom.x1}
                        cy={geom.y1}
                        r={5}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={2}
                      />
                      <circle
                        cx={geom.x2}
                        cy={geom.y2}
                        r={5}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={2}
                      />
                    </>
                  )}

                  {/* Wide Hit Path for Click Selection */}
                  {editable && !isConnecting && (
                    <path
                      d={geom.pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={22}
                      data-overlay-id={el.id}
                      className="pointer-events-auto cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onSelectOverlay(el.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOverlay(el.id);
                      }}
                    />
                  )}
                </svg>

                {/* Virtual Midpoint Anchor for Floating Context Toolbar */}
                {isSelected && (
                  <div
                    ref={selectedElementRef}
                    data-overlay-id={el.id}
                    className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `${midLeftPct}%`,
                      top: `${midTopPct}%`,
                      zIndex: el.zIndex,
                    }}
                  />
                )}
              </React.Fragment>
            );
          }

          // --------------------------------------------------------------
          // NODE ELEMENTS: TEXT, SHAPE (CSS / SVG), ICON, IMAGE
          // --------------------------------------------------------------
          const isLine = el.type === "shape" && el.style.shapeVariant === "line";
          const isSvgShape = el.type === "shape" && isSvgShapeVariant(el.style.shapeVariant);
          const isIcon = el.type === "icon";
          const isConnectorSource = isConnecting && connectorDraft?.sourceId === el.id;

          const boxStyle: React.CSSProperties = {
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: `${el.height}%`,
            zIndex: el.zIndex,
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: "center center",
            opacity: el.style.opacity ?? 1,
          };

          const surfaceStyle: React.CSSProperties = isSvgShape
            ? {
                backgroundColor: "transparent",
                borderColor: "transparent",
                borderWidth: "0px",
                borderStyle: "none",
                color: el.style.color ?? theme.textColor,
                fontSize: `${el.style.fontSize || 14}px`,
                fontWeight: el.style.fontWeight || "semibold",
                textAlign: el.style.textAlign || "center",
                backdropFilter: el.style.backdropFilter,
                filter:
                  el.style.boxShadow && el.style.boxShadow !== "none"
                    ? "drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35))"
                    : undefined,
              }
            : {
                backgroundColor:
                  el.style.backgroundColor ??
                  (el.type === "shape" ? theme.accentColor : "transparent"),
                borderColor: el.style.borderColor ?? "transparent",
                borderWidth: el.style.borderWidth !== undefined ? `${el.style.borderWidth}px` : "0px",
                borderStyle: el.style.borderWidth ? "solid" : "none",
                borderRadius: getShapeRadius(el),
                color: el.style.color ?? theme.textColor,
                fontSize: `${el.style.fontSize || 16}px`,
                fontWeight: el.style.fontWeight || (el.type === "text" ? "semibold" : "medium"),
                textAlign: el.style.textAlign || (el.type === "shape" ? "center" : "left"),
                boxShadow: el.style.boxShadow,
                backdropFilter: el.style.backdropFilter,
              };

          const IconComponent = isIcon
            ? getLucideIconComponent(el.style.iconName || el.content)
            : null;

          return (
            <div
              key={el.id}
              ref={isSelected ? selectedElementRef : undefined}
              data-overlay-id={el.id}
              className={`absolute ${editable ? "pointer-events-auto" : "pointer-events-none"} ${
                isConnecting
                  ? "cursor-crosshair"
                  : editable && !isEditing
                  ? "cursor-move"
                  : ""
              } ${
                isConnectorSource
                  ? "ring-2 ring-emerald-400 rounded-lg shadow-[0_0_24px_rgba(16,185,129,0.5)]"
                  : isConnecting
                  ? "hover:ring-2 hover:ring-emerald-400/80 rounded-lg"
                  : ""
              } select-none`}
              style={boxStyle}
              onPointerDown={(e) => {
                if (!editable || isEditing) return;
                if (isConnecting) {
                  e.stopPropagation();
                  e.preventDefault();
                  onConnectorNodeClick?.(el.id);
                  return;
                }
                onStartDrag(e, el, canvasRef.current);
              }}
              onClick={(e) => {
                if (!editable) return;
                e.stopPropagation();
                if (isConnecting) return;
                onSelectOverlay(el.id);
              }}
              onDoubleClick={(e) => {
                if (!editable || isConnecting) return;
                e.stopPropagation();
                if (el.type === "text" || (el.type === "shape" && !isLine)) {
                  onStartEditOverlay(el.id);
                }
              }}
            >
              {/* Element Content Surface */}
              <div
                className={`w-full h-full relative overflow-hidden flex ${overlayAnim.className} ${
                  el.type === "shape" || isIcon
                    ? "items-center justify-center p-2"
                    : el.type === "text"
                    ? "items-start p-2.5"
                    : ""
                }`}
                style={{ ...surfaceStyle, ...overlayAnim.style }}
              >
                {el.type === "image" && <OverlayImageContent element={el} />}

                {isSvgShape && el.style.shapeVariant && (
                  <div className="absolute inset-0 pointer-events-none">
                    <SvgVectorShape
                      variant={el.style.shapeVariant}
                      fill={el.style.backgroundColor || theme.accentColor || "#3b82f6"}
                      stroke={el.style.borderColor || theme.accentColor || "#3b82f6"}
                      strokeWidth={el.style.strokeWidth ?? el.style.borderWidth ?? 2}
                    />
                  </div>
                )}

                {isIcon && IconComponent && (
                  <IconComponent
                    className="w-full h-full pointer-events-none"
                    style={{ color: el.style.color || theme.accentColor || "#3b82f6" }}
                    strokeWidth={el.style.strokeWidth || 2}
                  />
                )}

                {(el.type === "text" || (el.type === "shape" && !isLine)) &&
                  (isEditing ? (
                    <textarea
                      ref={textareaRef}
                      value={editingDraftText}
                      onChange={(e) => setEditingDraftText(e.target.value)}
                      onBlur={() => commitInlineText(el.id)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
                          commitInlineText(el.id);
                        }
                      }}
                      className="relative z-10 w-full h-full bg-transparent outline-none resize-none leading-snug"
                      style={{
                        color: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        textAlign: el.style.textAlign || (el.type === "shape" ? "center" : "left"),
                      }}
                      placeholder={el.type === "text" ? "Type text..." : "Label..."}
                    />
                  ) : (
                    <div
                      className="relative z-10 w-full whitespace-pre-wrap break-words leading-snug pointer-events-none"
                      style={{
                        textAlign: el.style.textAlign || (el.type === "shape" ? "center" : "left"),
                      }}
                    >
                      {el.content || (el.type === "text" ? "Double-click to edit" : "")}
                    </div>
                  ))}
              </div>

              {/* Selection Frame, 8-Point Resize Handles, and Rotation Handle */}
              {isSelected && (
                <div
                  className={`absolute inset-0 pointer-events-none rounded-[inherit] ring-[1.5px] ${
                    isEditing ? "ring-indigo-400" : "ring-blue-500"
                  }`}
                >
                  {!isEditing && (
                    <>
                      {/* Rotation Stem + Handle */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                        <button
                          type="button"
                          aria-label="Rotate element"
                          title="Drag to rotate (Hold Shift for 15° snap)"
                          onPointerDown={(e) => onStartRotate(e, el, canvasRef.current)}
                          onClick={(e) => e.stopPropagation()}
                          className="pointer-events-auto w-5 h-5 rounded-full bg-white border-[1.5px] border-blue-600 text-blue-600 shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                        </button>
                        <div className="w-px h-2 bg-blue-500" />
                      </div>

                      {/* Live Angle Badge during rotation */}
                      {isManipulatingOverlay && liveRotationAngle !== null && (
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/95 border border-blue-500/40 text-white text-[10px] font-mono tabular-nums shadow-lg whitespace-nowrap">
                          {liveRotationAngle}°
                        </div>
                      )}

                      {/* 8-Point Resize Handles */}
                      {RESIZE_HANDLES.map(({ handle, positionClass, cursor, isEdge }) => (
                        <div
                          key={handle}
                          role="button"
                          aria-label={`Resize ${handle}`}
                          onPointerDown={(e) => onStartResize(e, el, handle, canvasRef.current)}
                          onClick={(e) => e.stopPropagation()}
                          className={`pointer-events-auto absolute ${positionClass} bg-white border-[1.5px] border-blue-600 shadow-sm hover:bg-blue-500 hover:border-white transition-colors ${
                            isEdge ? "rounded-full" : "rounded-[2px]"
                          }`}
                          style={{ cursor }}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Layering, Alignment & Style Context Toolbar (Portal) */}
      {editable &&
        selectedElement &&
        toolbarPos &&
        createPortal(
          <div
            className="fixed z-[9998] select-none pointer-events-auto animate-fadeIn"
            style={{
              top: `${toolbarPos.top}px`,
              left: `${toolbarPos.left}px`,
              transform: toolbarPos.placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center gap-0.5 bg-[#121620]/95 backdrop-blur-xl border border-white/[0.14] shadow-[0_14px_36px_rgba(0,0,0,0.65)] rounded-lg px-1.5 py-1 text-slate-200 text-xs">
              {/* Layering Controls */}
              <button
                type="button"
                onClick={() => onBringToFront(selectedElement.id)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Bring to Front (Cmd/Ctrl+Shift+])"
                aria-label="Bring to Front"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onBringForward(selectedElement.id)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Bring Forward (Cmd/Ctrl+])"
                aria-label="Bring Forward"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSendBackward(selectedElement.id)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Send Backward (Cmd/Ctrl+[)"
                aria-label="Send Backward"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSendToBack(selectedElement.id)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Send to Back (Cmd/Ctrl+Shift+[)"
                aria-label="Send to Back"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>

              <span className="px-1.5 text-[10px] font-mono tabular-nums text-slate-400">
                L{selectedLayerRank}/{renderedElements.length}
              </span>

              <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

              {/* Connector-Specific Controls */}
              {selectedElement.type === "connector" && onUpdateConnector && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConnector(
                        selectedElement.id,
                        {
                          connectorType:
                            selectedElement.connector?.connectorType === "straight"
                              ? "elbow"
                              : "straight",
                        },
                        "Toggle Connector Style"
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer whitespace-nowrap"
                    title="Switch Straight / Elbow Routing"
                  >
                    <Spline className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-medium">
                      {selectedElement.connector?.connectorType === "straight" ? "Straight" : "Elbow"}
                    </span>
                  </button>

                  {/* Arrowhead Presets */}
                  <button
                    type="button"
                    onClick={() => {
                      const start = Boolean(selectedElement.connector?.arrowStart);
                      const end = selectedElement.connector?.arrowEnd ?? true;
                      // Cycle: End -> Both -> None -> End
                      if (!start && end) {
                        onUpdateConnector(selectedElement.id, { arrowStart: true, arrowEnd: true }, "Set Both Arrows");
                      } else if (start && end) {
                        onUpdateConnector(selectedElement.id, { arrowStart: false, arrowEnd: false }, "Remove Arrows");
                      } else {
                        onUpdateConnector(selectedElement.id, { arrowStart: false, arrowEnd: true }, "Set End Arrow");
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition cursor-pointer whitespace-nowrap"
                    title="Cycle Arrowheads (End → Both ↔ None)"
                  >
                    {selectedElement.connector?.arrowStart && selectedElement.connector?.arrowEnd ? (
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                    ) : !selectedElement.connector?.arrowStart && !selectedElement.connector?.arrowEnd ? (
                      <Minus className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span className="text-[11px] font-medium">Arrows</span>
                  </button>
                </>
              )}

              {/* Alignment Popover Trigger (non-connectors) */}
              {selectedElement.type !== "connector" && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenSubMenu((m) => (m === "align" ? null : "align"))}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                      openSubMenu === "align"
                        ? "bg-blue-600/25 text-blue-300"
                        : "hover:bg-white/10 text-slate-300 hover:text-white"
                    }`}
                    title="Align to Slide"
                    aria-label="Align to Slide"
                  >
                    <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Align</span>
                  </button>

                  {openSubMenu === "align" && (
                    <div className="absolute left-0 top-full mt-2 w-44 bg-[#151921] border border-white/[0.12] rounded-lg shadow-2xl p-1.5 z-50">
                      <div className="text-[10px] text-slate-400 px-1.5 py-1 font-medium">
                        Align to Slide
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "left");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "center-h");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Center Horizontally"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "right");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "top");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Align Top"
                        >
                          <AlignStartVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "center-v");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Center Vertically"
                        >
                          <AlignCenterVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAlignElement(selectedElement.id, "bottom");
                            setOpenSubMenu(null);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                          title="Align Bottom"
                        >
                          <AlignEndVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Style Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenSubMenu((m) => (m === "style" ? null : "style"))}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer whitespace-nowrap ${
                    openSubMenu === "style"
                      ? "bg-blue-600/25 text-blue-300"
                      : "hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                  title="Style & Appearance"
                  aria-label="Style & Appearance"
                >
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-medium">Style</span>
                </button>

                {openSubMenu === "style" && (
                  <div className="absolute left-0 top-full mt-2 w-60 bg-[#151921] border border-white/[0.12] rounded-lg shadow-2xl p-2.5 z-50 space-y-2.5">
                    {/* Theme Presets for Shapes */}
                    {selectedElement.type === "shape" && (
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1.5 font-medium">
                          Theme Preset
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {SHAPE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() =>
                                onUpdateStyle(
                                  selectedElement.id,
                                  buildShapePresetStyle(
                                    preset.id,
                                    theme,
                                    selectedElement.style.shapeVariant === "line"
                                  ),
                                  `Apply Shape Preset (${preset.label})`
                                )
                              }
                              className={`px-1.5 py-1 rounded text-[10px] font-medium border cursor-pointer transition ${
                                selectedElement.style.shapePreset === preset.id
                                  ? "bg-blue-600/30 border-blue-500/60 text-white"
                                  : "bg-white/5 hover:bg-white/15 border-white/10 text-slate-300"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fill Color (Text & Shape) */}
                    {(selectedElement.type === "text" || selectedElement.type === "shape") && (
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1.5 font-medium">Fill Color</div>
                        <div className="flex flex-wrap gap-1.5">
                          {FILL_SWATCHES.map((swatch) => (
                            <button
                              key={`fill-${swatch}`}
                              type="button"
                              onClick={() =>
                                onUpdateStyle(
                                  selectedElement.id,
                                  { backgroundColor: swatch },
                                  "Change Element Fill"
                                )
                              }
                              className={`w-5 h-5 rounded border transition hover:scale-110 cursor-pointer ${
                                selectedElement.style.backgroundColor === swatch
                                  ? "border-blue-400 ring-1 ring-blue-400"
                                  : "border-white/20"
                              }`}
                              style={{
                                backgroundColor: swatch === "transparent" ? "transparent" : swatch,
                                backgroundImage:
                                  swatch === "transparent"
                                    ? "linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)"
                                    : undefined,
                              }}
                              title={swatch === "transparent" ? "Transparent" : swatch}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Primary Color (Text / Icon / Connector Line) */}
                    {selectedElement.type !== "image" && (
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1.5 font-medium">
                          {selectedElement.type === "connector"
                            ? "Line Color"
                            : selectedElement.type === "icon"
                            ? "Icon Color"
                            : "Text Color"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {COLOR_SWATCHES.map((swatch) => {
                            const activeHex =
                              selectedElement.type === "connector"
                                ? selectedElement.style.borderColor
                                : selectedElement.style.color;
                            return (
                              <button
                                key={`color-${swatch}`}
                                type="button"
                                onClick={() =>
                                  onUpdateStyle(
                                    selectedElement.id,
                                    selectedElement.type === "connector"
                                      ? { borderColor: swatch }
                                      : { color: swatch },
                                    "Change Element Color"
                                  )
                                }
                                className={`w-5 h-5 rounded-full border transition hover:scale-110 cursor-pointer ${
                                  activeHex === swatch
                                    ? "border-blue-400 ring-1 ring-blue-400"
                                    : "border-white/20"
                                }`}
                                style={{ backgroundColor: swatch }}
                                title={swatch}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Stroke Width (Shapes, Icons, Connectors) */}
                    {(selectedElement.type === "icon" ||
                      selectedElement.type === "connector" ||
                      selectedElement.type === "shape") && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                        <span className="text-[10px] text-slate-400 font-medium">Stroke</span>
                        <div className="flex items-center gap-1">
                          {(selectedElement.type === "icon"
                            ? [1.25, 1.75, 2, 3]
                            : [1.5, 2.5, 4, 6]
                          ).map((sw) => (
                            <button
                              key={sw}
                              type="button"
                              onClick={() =>
                                onUpdateStyle(
                                  selectedElement.id,
                                  { strokeWidth: sw, borderWidth: sw },
                                  "Change Stroke Width"
                                )
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums cursor-pointer ${
                                (selectedElement.style.strokeWidth ??
                                  selectedElement.style.borderWidth ??
                                  2) === sw
                                  ? "bg-blue-600 text-white"
                                  : "bg-white/5 hover:bg-white/15 text-slate-300"
                              }`}
                            >
                              {sw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Font Size (Text & Shapes) */}
                    {(selectedElement.type === "text" ||
                      (selectedElement.type === "shape" &&
                        selectedElement.style.shapeVariant !== "line")) && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                        <span className="text-[10px] text-slate-400 font-medium">Font Size</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStyle(
                                selectedElement.id,
                                { fontSize: Math.max(10, (selectedElement.style.fontSize || 16) - 2) },
                                "Decrease Font Size"
                              )
                            }
                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-mono tabular-nums w-8 text-center">
                            {selectedElement.style.fontSize || 16}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStyle(
                                selectedElement.id,
                                { fontSize: Math.min(72, (selectedElement.style.fontSize || 16) + 2) },
                                "Increase Font Size"
                              )
                            }
                            className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Opacity */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                      <span className="text-[10px] text-slate-400 font-medium">Opacity</span>
                      <div className="flex items-center gap-1">
                        {[0.4, 0.7, 1].map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() =>
                              onUpdateStyle(
                                selectedElement.id,
                                { opacity: op },
                                "Change Element Opacity"
                              )
                            }
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums cursor-pointer ${
                              (selectedElement.style.opacity ?? 1) === op
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 hover:bg-white/15 text-slate-300"
                            }`}
                          >
                            {Math.round(op * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

              {/* Duplicate (non-connector) & Delete */}
              {selectedElement.type !== "connector" && (
                <button
                  type="button"
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Duplicate (Cmd/Ctrl+D)"
                  aria-label="Duplicate Element"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeleteElement(selectedElement.id)}
                className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                title="Delete (Del / Backspace)"
                aria-label="Delete Element"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
