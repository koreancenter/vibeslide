import React, { useState, useRef, useEffect, useCallback } from "react";
import { CanvasElement, CanvasElementStyle, SlideData } from "../../../types";
import { INITIAL_SLIDES } from "../../../data/initialSlides";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export type OverlayAlignment = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

export interface SnapGuide {
  orientation: "vertical" | "horizontal";
  position: number; // percentage 0-100
  kind: "center" | "edge";
}

interface PointerSession {
  mode: "drag" | "resize" | "rotate";
  pointerId: number;
  elementId: string;
  handle?: ResizeHandle;
  startClientX: number;
  startClientY: number;
  canvasRect: DOMRect;
  initialElement: CanvasElement;
  otherElements: CanvasElement[];
  latestElement: CanvasElement;
  hasMoved: boolean;
}

interface UseCanvasInteractionsProps {
  slide: SlideData;
  onUpdateSlide?: (updatedSlide: SlideData, pushHistory?: boolean, actionName?: string) => void;
  onCanvasElementClick?: (field: string, index?: number) => void;
  externalSelectedOverlayId?: string | null;
  onSelectOverlayId?: (id: string | null) => void;
}

const SNAP_THRESHOLD_PCT = 1.25;
const MIN_WIDTH_PX = 24;
const MIN_HEIGHT_PX = 18;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function roundPct(val: number): number {
  return Math.round(val * 100) / 100;
}

function normalizeZOrder(elements: CanvasElement[]): CanvasElement[] {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const zMap = new Map<string, number>();
  sorted.forEach((el, idx) => {
    zMap.set(el.id, idx + 1);
  });
  return elements.map((el) => ({
    ...el,
    zIndex: zMap.get(el.id) ?? el.zIndex,
  }));
}

export function useCanvasInteractions({
  slide,
  onUpdateSlide,
  onCanvasElementClick,
  externalSelectedOverlayId,
  onSelectOverlayId,
}: UseCanvasInteractionsProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<"bullet" | "stat" | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<"bullet" | "stat" | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [snappedCol, setSnappedCol] = useState<number | null>(null);
  const [snappedRow, setSnappedRow] = useState<number | null>(null);
  const [isColliding, setIsColliding] = useState<boolean>(false);

  const autoScrollRequestRef = useRef<number | null>(null);
  const lastDragPosRef = useRef<{ x: number; y: number } | null>(null);

  // Free-form Overlay Interaction State
  const [internalSelectedOverlayId, setInternalSelectedOverlayId] = useState<string | null>(null);
  const selectedOverlayId =
    externalSelectedOverlayId !== undefined ? externalSelectedOverlayId : internalSelectedOverlayId;

  const setSelectedOverlayId = useCallback(
    (id: string | null) => {
      setInternalSelectedOverlayId(id);
      onSelectOverlayId?.(id);
    },
    [onSelectOverlayId]
  );

  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [draftOverlayElement, setDraftOverlayElement] = useState<CanvasElement | null>(null);
  const [activeSnapGuides, setActiveSnapGuides] = useState<SnapGuide[]>([]);
  const [isManipulatingOverlay, setIsManipulatingOverlay] = useState<boolean>(false);
  const [liveRotationAngle, setLiveRotationAngle] = useState<number | null>(null);

  const pointerSessionRef = useRef<PointerSession | null>(null);
  const slideRef = useRef<SlideData>(slide);
  slideRef.current = slide;
  const onUpdateSlideRef = useRef(onUpdateSlide);
  onUpdateSlideRef.current = onUpdateSlide;

  // Clear selection if selected overlay element was removed (e.g. Undo or remote delete)
  useEffect(() => {
    if (!selectedOverlayId) return;
    const exists = (slide.overlayElements || []).some((el) => el.id === selectedOverlayId);
    if (!exists) {
      setSelectedOverlayId(null);
      setEditingOverlayId(null);
    }
  }, [slide.overlayElements, selectedOverlayId, setSelectedOverlayId]);

  const startAutoScrollLoop = () => {
    if (autoScrollRequestRef.current) return;

    const tick = () => {
      if (!lastDragPosRef.current) {
        autoScrollRequestRef.current = requestAnimationFrame(tick);
        return;
      }

      const { x, y } = lastDragPosRef.current;
      const threshold = 100;
      const maxSpeed = 16;

      const viewport = document.getElementById("viewport-container");
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        let scrollX = 0;
        let scrollY = 0;

        if (y < rect.top + threshold) {
          const ratio = Math.max(0, 1 - (y - rect.top) / threshold);
          scrollY = -maxSpeed * ratio;
        } else if (y > rect.bottom - threshold) {
          const ratio = Math.max(0, 1 - (rect.bottom - y) / threshold);
          scrollY = maxSpeed * ratio;
        }

        if (x < rect.left + threshold) {
          const ratio = Math.max(0, 1 - (x - rect.left) / threshold);
          scrollX = -maxSpeed * ratio;
        } else if (x > rect.right - threshold) {
          const ratio = Math.max(0, 1 - (rect.right - x) / threshold);
          scrollX = maxSpeed * ratio;
        }

        if (scrollX !== 0 || scrollY !== 0) {
          viewport.scrollBy(scrollX, scrollY);
        }
      }

      autoScrollRequestRef.current = requestAnimationFrame(tick);
    };

    autoScrollRequestRef.current = requestAnimationFrame(tick);
  };

  const stopAutoScrollLoop = () => {
    if (autoScrollRequestRef.current) {
      cancelAnimationFrame(autoScrollRequestRef.current);
      autoScrollRequestRef.current = null;
    }
    lastDragPosRef.current = null;
  };

  const reorderMultiple = (
    items: any[],
    selIndices: number[],
    draggedIdx: number,
    targetIdx: number
  ): { updatedItems: any[]; newDraggedIdx: number; newSelectedIndices: number[] } => {
    const N = items.length;
    if (N === 0) return { updatedItems: items, newDraggedIdx: draggedIdx, newSelectedIndices: selIndices };

    let shift = targetIdx - draggedIdx;

    let newPositions = selIndices.map((idx) => idx + shift);
    let minNewPos = Math.min(...newPositions);
    let maxNewPos = Math.max(...newPositions);

    if (minNewPos < 0) {
      shift = shift - minNewPos;
    } else if (maxNewPos >= N) {
      shift = shift - (maxNewPos - (N - 1));
    }

    const finalPositions = selIndices.map((idx) => idx + shift);
    const finalPositionsSet = new Set(finalPositions);
    const updatedItems = new Array(N);

    selIndices.forEach((origIdx, i) => {
      const newIdx = finalPositions[i];
      updatedItems[newIdx] = items[origIdx];
    });

    const unselectedItems: any[] = [];
    items.forEach((item, idx) => {
      if (!selIndices.includes(idx)) {
        unselectedItems.push(item);
      }
    });

    let unselectedPtr = 0;
    for (let i = 0; i < N; i++) {
      if (!finalPositionsSet.has(i)) {
        updatedItems[i] = unselectedItems[unselectedPtr++];
      }
    }

    const newDraggedIdx = draggedIdx + shift;
    const newSelectedIndices = selIndices.map((idx) => idx + shift);

    return { updatedItems, newDraggedIdx, newSelectedIndices };
  };

  const handleItemClick = (e: React.MouseEvent, type: "bullet" | "stat", index: number) => {
    if (e.shiftKey) {
      e.stopPropagation();
      e.preventDefault();

      if (selectedType !== type) {
        setSelectedType(type);
        setSelectedIndices([index]);
      } else {
        if (selectedIndices.includes(index)) {
          const updated = selectedIndices.filter((i) => i !== index);
          setSelectedIndices(updated);
          if (updated.length === 0) {
            setSelectedType(null);
          }
        } else {
          setSelectedIndices([...selectedIndices, index].sort((a, b) => a - b));
        }
      }
    } else {
      if (selectedIndices.length > 0 && !selectedIndices.includes(index)) {
        setSelectedIndices([]);
        setSelectedType(null);
      }

      if (type === "bullet") {
        onCanvasElementClick?.("bullets", index);
      } else {
        onCanvasElementClick?.("stats", index);
      }
    }
  };

  const handleResetPosition = () => {
    if (!onUpdateSlide || !selectedType) return;

    const initialSlide = INITIAL_SLIDES.find((s) => s.id === slide.id);
    if (!initialSlide) return;

    if (selectedType === "bullet" && slide.bullets && initialSlide.bullets) {
      const idToIndex = new Map<string, number>();
      initialSlide.bullets.forEach((b, idx) => {
        idToIndex.set(b.id, idx);
      });

      const getOriginalIndex = (b: any) => {
        if (idToIndex.has(b.id)) return idToIndex.get(b.id)!;
        const foundIdx = initialSlide.bullets!.findIndex(
          (initB) =>
            initB.titleKo === b.titleKo ||
            initB.titleId === b.titleId ||
            initB.descKo === b.descKo ||
            initB.descId === b.descId
        );
        return foundIdx !== -1 ? foundIdx : 9999;
      };

      const sortedBullets = [...slide.bullets].sort((a, b) => {
        return getOriginalIndex(a) - getOriginalIndex(b);
      });

      onUpdateSlide(
        {
          ...slide,
          bullets: sortedBullets,
        },
        true,
        "Reset Bullets Positions to Default Flow"
      );

      setSelectedIndices([]);
      setSelectedType(null);
    } else if (selectedType === "stat" && slide.stats && initialSlide.stats) {
      const getOriginalStatIndex = (st: any) => {
        const foundIdx = initialSlide.stats!.findIndex(
          (initSt) =>
            initSt.labelKo === st.labelKo ||
            initSt.labelId === st.labelId ||
            initSt.value === st.value
        );
        return foundIdx !== -1 ? foundIdx : 9999;
      };

      const sortedStats = [...slide.stats].sort((a, b) => {
        return getOriginalStatIndex(a) - getOriginalStatIndex(b);
      });

      onUpdateSlide(
        {
          ...slide,
          stats: sortedStats,
        },
        true,
        "Reset Stats Positions to Default Flow"
      );

      setSelectedIndices([]);
      setSelectedType(null);
    }
  };

  const handleNudgeOrder = (direction: "up" | "down") => {
    if (!onUpdateSlide || selectedIndices.length === 0 || !selectedType) return;

    const isBullet = selectedType === "bullet";
    const items = isBullet ? slide.bullets : slide.stats;
    if (!items || items.length === 0) return;

    const N = items.length;
    const shift = direction === "up" ? -1 : 1;

    const minIdx = Math.min(...selectedIndices);
    const maxIdx = Math.max(...selectedIndices);
    if (direction === "up" && minIdx === 0) return;
    if (direction === "down" && maxIdx === N - 1) return;

    const sortedSel = [...selectedIndices].sort((a, b) => (direction === "up" ? a - b : b - a));
    const updatedItems = [...items];
    const newSelectedIndices = [...selectedIndices];

    sortedSel.forEach((idx) => {
      const targetIdx = idx + shift;
      const temp = updatedItems[targetIdx];
      updatedItems[targetIdx] = updatedItems[idx];
      updatedItems[idx] = temp;

      const selPos = newSelectedIndices.indexOf(idx);
      if (selPos !== -1) {
        newSelectedIndices[selPos] = targetIdx;
      }
    });

    onUpdateSlide(
      {
        ...slide,
        [isBullet ? "bullets" : "stats"]: updatedItems,
      },
      true,
      direction === "up" ? "Move Items Up" : "Move Items Down"
    );

    setSelectedIndices(newSelectedIndices.sort((a, b) => a - b));
  };

  const checkCollision = (clientX: number, clientY: number) => {
    const staticElements = document.querySelectorAll('[data-collision-zone="static"]');
    for (let i = 0; i < staticElements.length; i++) {
      const rect = staticElements[i].getBoundingClientRect();
      const buffer = 4;
      if (
        clientX >= rect.left - buffer &&
        clientX <= rect.right + buffer &&
        clientY >= rect.top - buffer &&
        clientY <= rect.bottom + buffer
      ) {
        return true;
      }
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent, type: "bullet" | "stat", index: number) => {
    let currentSelected = [...selectedIndices];
    if (selectedType !== type || !selectedIndices.includes(index)) {
      currentSelected = [index];
      setSelectedIndices([index]);
      setSelectedType(type);
    }

    setDraggedIndex(index);
    setDraggedType(type);
    setDragOverIndex(null);
    lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    e.dataTransfer.setData("text/plain", JSON.stringify(currentSelected));
    e.dataTransfer.effectAllowed = "move";
    startAutoScrollLoop();
  };

  const handleDragOver = (e: React.DragEvent, type: "bullet" | "stat", index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    lastDragPosRef.current = { x: e.clientX, y: e.clientY };

    const colliding = checkCollision(e.clientX, e.clientY);
    setIsColliding(colliding);

    if (colliding) {
      setDragOverIndex(null);
      setSnappedCol(null);
      setSnappedRow(null);
      return;
    }

    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }

    const canvasElement = document.querySelector(".group\\/canvas") as HTMLElement;
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const colWidth = rect.width / 12;
      let bestCol: number | null = null;
      let minColDist = 28;
      for (let i = 1; i <= 11; i++) {
        const colX = i * colWidth;
        const dist = Math.abs(cursorX - colX);
        if (dist < minColDist) {
          minColDist = dist;
          bestCol = i;
        }
      }

      const rowHeight = rect.height / 6;
      let bestRow: number | null = null;
      let minRowDist = 28;
      for (let j = 1; j <= 5; j++) {
        const rowY = j * rowHeight;
        const dist = Math.abs(cursorY - rowY);
        if (dist < minRowDist) {
          minRowDist = dist;
          bestRow = j;
        }
      }

      setSnappedCol(bestCol);
      setSnappedRow(bestRow);
    }

    if (draggedIndex === null || draggedType !== type || draggedIndex === index) {
      return;
    }

    const currentSelected = selectedIndices.includes(draggedIndex) ? selectedIndices : [draggedIndex];

    if (type === "bullet" && slide.bullets && onUpdateSlide) {
      const { updatedItems, newDraggedIdx, newSelectedIndices } = reorderMultiple(
        slide.bullets,
        currentSelected,
        draggedIndex,
        index
      );

      if (newDraggedIdx !== draggedIndex) {
        setDraggedIndex(newDraggedIdx);
        setSelectedIndices(newSelectedIndices);
        onUpdateSlide(
          {
            ...slide,
            bullets: updatedItems,
          },
          false,
          "Reorder Bullets (Live)"
        );
      }
    } else if (type === "stat" && slide.stats && onUpdateSlide) {
      const { updatedItems, newDraggedIdx, newSelectedIndices } = reorderMultiple(
        slide.stats,
        currentSelected,
        draggedIndex,
        index
      );

      if (newDraggedIdx !== draggedIndex) {
        setDraggedIndex(newDraggedIdx);
        setSelectedIndices(newSelectedIndices);
        onUpdateSlide(
          {
            ...slide,
            stats: updatedItems,
          },
          false,
          "Reorder Stats (Live)"
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent, type: "bullet" | "stat", _toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setIsColliding(false);
    stopAutoScrollLoop();

    if (draggedIndex !== null && onUpdateSlide) {
      onUpdateSlide(
        {
          ...slide,
        },
        true,
        type === "bullet" ? "Reorder Bullets" : "Reorder Stats"
      );
    }
    setDraggedIndex(null);
    setDraggedType(null);
  };

  const handleDragEnd = () => {
    stopAutoScrollLoop();
    setIsColliding(false);
    if (draggedIndex !== null && onUpdateSlide) {
      onUpdateSlide(
        {
          ...slide,
        },
        true,
        draggedType === "bullet" ? "Reorder Bullets" : "Reorder Stats"
      );
    }
    setDraggedIndex(null);
    setDraggedType(null);
    setDragOverIndex(null);
  };

  const resetSelection = useCallback(() => {
    setSelectedIndices([]);
    setSelectedType(null);
    setSelectedOverlayId(null);
    setEditingOverlayId(null);
    setDraftOverlayElement(null);
    setActiveSnapGuides([]);
    setLiveRotationAngle(null);
  }, [setSelectedOverlayId]);

  // =========================================================================
  // Free-Form Overlay Manipulation (Drag, 8-Point Resize, Rotate, Snap)
  // =========================================================================

  const computeSnappedDrag = (
    rawX: number,
    rawY: number,
    width: number,
    height: number,
    otherElements: CanvasElement[],
    disableSnap: boolean
  ): { x: number; y: number; guides: SnapGuide[] } => {
    const clampedX = clamp(rawX, -width + 5, 95);
    const clampedY = clamp(rawY, -height + 5, 95);

    if (disableSnap) {
      return { x: roundPct(clampedX), y: roundPct(clampedY), guides: [] };
    }

    // Build X snap candidates
    const xTargets: { pos: number; kind: "center" | "edge" }[] = [
      { pos: 50, kind: "center" },
      { pos: 0, kind: "edge" },
      { pos: 100, kind: "edge" },
    ];
    const yTargets: { pos: number; kind: "center" | "edge" }[] = [
      { pos: 50, kind: "center" },
      { pos: 0, kind: "edge" },
      { pos: 100, kind: "edge" },
    ];

    for (const other of otherElements) {
      xTargets.push(
        { pos: other.x, kind: "edge" },
        { pos: other.x + other.width / 2, kind: "center" },
        { pos: other.x + other.width, kind: "edge" }
      );
      yTargets.push(
        { pos: other.y, kind: "edge" },
        { pos: other.y + other.height / 2, kind: "center" },
        { pos: other.y + other.height, kind: "edge" }
      );
    }

    // Check element's left, centerX, right against xTargets
    const xAnchors = [
      { offset: 0, val: clampedX },
      { offset: width / 2, val: clampedX + width / 2 },
      { offset: width, val: clampedX + width },
    ];

    let bestX = clampedX;
    let minXDist = SNAP_THRESHOLD_PCT;
    for (const anchor of xAnchors) {
      for (const target of xTargets) {
        const dist = Math.abs(anchor.val - target.pos);
        if (dist < minXDist) {
          minXDist = dist;
          bestX = target.pos - anchor.offset;
        }
      }
    }

    // Check element's top, centerY, bottom against yTargets
    const yAnchors = [
      { offset: 0, val: clampedY },
      { offset: height / 2, val: clampedY + height / 2 },
      { offset: height, val: clampedY + height },
    ];

    let bestY = clampedY;
    let minYDist = SNAP_THRESHOLD_PCT;
    for (const anchor of yAnchors) {
      for (const target of yTargets) {
        const dist = Math.abs(anchor.val - target.pos);
        if (dist < minYDist) {
          minYDist = dist;
          bestY = target.pos - anchor.offset;
        }
      }
    }

    const finalX = roundPct(bestX);
    const finalY = roundPct(bestY);
    const guides: SnapGuide[] = [];
    const seenV = new Set<string>();
    const seenH = new Set<string>();

    const snappedXAnchors = [finalX, finalX + width / 2, finalX + width];
    for (const target of xTargets) {
      if (snappedXAnchors.some((a) => Math.abs(a - target.pos) < 0.08)) {
        const key = `${target.pos.toFixed(2)}-${target.kind}`;
        if (!seenV.has(key)) {
          seenV.add(key);
          guides.push({ orientation: "vertical", position: target.pos, kind: target.kind });
        }
      }
    }

    const snappedYAnchors = [finalY, finalY + height / 2, finalY + height];
    for (const target of yTargets) {
      if (snappedYAnchors.some((a) => Math.abs(a - target.pos) < 0.08)) {
        const key = `${target.pos.toFixed(2)}-${target.kind}`;
        if (!seenH.has(key)) {
          seenH.add(key);
          guides.push({ orientation: "horizontal", position: target.pos, kind: target.kind });
        }
      }
    }

    return { x: finalX, y: finalY, guides };
  };

  const attachWindowPointerListeners = useCallback(() => {
    const handlePointerMove = (ev: PointerEvent) => {
      const session = pointerSessionRef.current;
      if (!session || ev.pointerId !== session.pointerId) return;

      const { canvasRect, initialElement, mode, handle } = session;
      if (canvasRect.width <= 0 || canvasRect.height <= 0) return;

      const dxPx = ev.clientX - session.startClientX;
      const dyPx = ev.clientY - session.startClientY;

      if (!session.hasMoved && Math.hypot(dxPx, dyPx) > 2) {
        session.hasMoved = true;
      }

      if (mode === "drag") {
        const dxPct = (dxPx / canvasRect.width) * 100;
        const dyPct = (dyPx / canvasRect.height) * 100;
        const rawX = initialElement.x + dxPct;
        const rawY = initialElement.y + dyPct;

        const { x, y, guides } = computeSnappedDrag(
          rawX,
          rawY,
          initialElement.width,
          initialElement.height,
          session.otherElements,
          ev.altKey
        );

        const nextEl: CanvasElement = { ...initialElement, x, y };
        session.latestElement = nextEl;
        setDraftOverlayElement(nextEl);
        setActiveSnapGuides(guides);
      } else if (mode === "resize" && handle) {
        const W = canvasRect.width;
        const H = canvasRect.height;
        const rad = ((initialElement.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Project screen delta into element's local rotated pixel space
        const localDxPx = dxPx * cos + dyPx * sin;
        const localDyPx = -dxPx * sin + dyPx * cos;

        const initWPx = (initialElement.width / 100) * W;
        const initHPx = (initialElement.height / 100) * H;
        const initCxPx = ((initialElement.x + initialElement.width / 2) / 100) * W;
        const initCyPx = ((initialElement.y + initialElement.height / 2) / 100) * H;

        let newWPx = initWPx;
        let newHPx = initHPx;
        let localShiftX = 0;
        let localShiftY = 0;

        const hasE = handle.includes("e");
        const hasW = handle.includes("w");
        const hasS = handle.includes("s");
        const hasN = handle.includes("n");

        if (hasE) {
          newWPx = Math.max(MIN_WIDTH_PX, initWPx + localDxPx);
          localShiftX = (newWPx - initWPx) / 2;
        } else if (hasW) {
          newWPx = Math.max(MIN_WIDTH_PX, initWPx - localDxPx);
          localShiftX = -(newWPx - initWPx) / 2;
        }

        if (hasS) {
          newHPx = Math.max(MIN_HEIGHT_PX, initHPx + localDyPx);
          localShiftY = (newHPx - initHPx) / 2;
        } else if (hasN) {
          newHPx = Math.max(MIN_HEIGHT_PX, initHPx - localDyPx);
          localShiftY = -(newHPx - initHPx) / 2;
        }

        // Preserve aspect ratio when holding Shift on corner handles
        if (ev.shiftKey && (hasE || hasW) && (hasN || hasS)) {
          const aspect = initWPx / Math.max(1, initHPx);
          if (Math.abs(newWPx - initWPx) / initWPx >= Math.abs(newHPx - initHPx) / initHPx) {
            newHPx = Math.max(MIN_HEIGHT_PX, newWPx / aspect);
            localShiftY = hasS ? (newHPx - initHPx) / 2 : -(newHPx - initHPx) / 2;
          } else {
            newWPx = Math.max(MIN_WIDTH_PX, newHPx * aspect);
            localShiftX = hasE ? (newWPx - initWPx) / 2 : -(newWPx - initWPx) / 2;
          }
        }

        // Rotate local center shift back to screen space
        const screenShiftX = localShiftX * cos - localShiftY * sin;
        const screenShiftY = localShiftX * sin + localShiftY * cos;

        const newCxPx = initCxPx + screenShiftX;
        const newCyPx = initCyPx + screenShiftY;

        const nextEl: CanvasElement = {
          ...initialElement,
          x: roundPct(((newCxPx - newWPx / 2) / W) * 100),
          y: roundPct(((newCyPx - newHPx / 2) / H) * 100),
          width: roundPct((newWPx / W) * 100),
          height: roundPct((newHPx / H) * 100),
        };

        session.latestElement = nextEl;
        setDraftOverlayElement(nextEl);
      } else if (mode === "rotate") {
        const cx =
          canvasRect.left + ((initialElement.x + initialElement.width / 2) / 100) * canvasRect.width;
        const cy =
          canvasRect.top + ((initialElement.y + initialElement.height / 2) / 100) * canvasRect.height;

        let angleDeg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        // Normalize to [-180, 180]
        while (angleDeg > 180) angleDeg -= 360;
        while (angleDeg <= -180) angleDeg += 360;

        if (ev.shiftKey) {
          angleDeg = Math.round(angleDeg / 15) * 15;
        } else {
          // Gentle magnetic snap to cardinal angles
          for (const cardinal of [0, 90, -90, 180, -180]) {
            if (Math.abs(angleDeg - cardinal) <= 3) {
              angleDeg = cardinal === -180 ? 180 : cardinal;
              break;
            }
          }
        }

        const roundedAngle = Math.round(angleDeg);
        const nextEl: CanvasElement = {
          ...initialElement,
          rotation: roundedAngle,
        };
        session.latestElement = nextEl;
        setDraftOverlayElement(nextEl);
        setLiveRotationAngle(roundedAngle);
      }
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const session = pointerSessionRef.current;
      if (!session || ev.pointerId !== session.pointerId) return;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      pointerSessionRef.current = null;
      setIsManipulatingOverlay(false);
      setActiveSnapGuides([]);
      setLiveRotationAngle(null);
      setDraftOverlayElement(null);

      if (session.hasMoved && onUpdateSlideRef.current) {
        const currentSlide = slideRef.current;
        const currentOverlay = currentSlide.overlayElements || [];
        const updatedOverlay = currentOverlay.map((el) =>
          el.id === session.elementId ? session.latestElement : el
        );

        const actionLabel =
          session.mode === "drag"
            ? "Move Overlay Element"
            : session.mode === "resize"
            ? "Resize Overlay Element"
            : "Rotate Overlay Element";

        onUpdateSlideRef.current(
          {
            ...currentSlide,
            overlayElements: updatedOverlay,
          },
          true,
          actionLabel
        );
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }, []);

  const startOverlayDrag = useCallback(
    (e: React.PointerEvent, element: CanvasElement, canvasEl: HTMLElement | null) => {
      if (!onUpdateSlide || !canvasEl || e.button !== 0) return;
      e.stopPropagation();

      setSelectedOverlayId(element.id);
      if (editingOverlayId && editingOverlayId !== element.id) {
        setEditingOverlayId(null);
      }

      const canvasRect = canvasEl.getBoundingClientRect();
      const otherElements = (slide.overlayElements || []).filter((el) => el.id !== element.id);

      pointerSessionRef.current = {
        mode: "drag",
        pointerId: e.pointerId,
        elementId: element.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        canvasRect,
        initialElement: element,
        otherElements,
        latestElement: element,
        hasMoved: false,
      };

      setIsManipulatingOverlay(true);
      attachWindowPointerListeners();
    },
    [onUpdateSlide, slide.overlayElements, editingOverlayId, setSelectedOverlayId, attachWindowPointerListeners]
  );

  const startOverlayResize = useCallback(
    (
      e: React.PointerEvent,
      element: CanvasElement,
      handle: ResizeHandle,
      canvasEl: HTMLElement | null
    ) => {
      if (!onUpdateSlide || !canvasEl || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      setSelectedOverlayId(element.id);
      setEditingOverlayId(null);

      const canvasRect = canvasEl.getBoundingClientRect();

      pointerSessionRef.current = {
        mode: "resize",
        pointerId: e.pointerId,
        elementId: element.id,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        canvasRect,
        initialElement: element,
        otherElements: [],
        latestElement: element,
        hasMoved: false,
      };

      setIsManipulatingOverlay(true);
      attachWindowPointerListeners();
    },
    [onUpdateSlide, setSelectedOverlayId, attachWindowPointerListeners]
  );

  const startOverlayRotate = useCallback(
    (e: React.PointerEvent, element: CanvasElement, canvasEl: HTMLElement | null) => {
      if (!onUpdateSlide || !canvasEl || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      setSelectedOverlayId(element.id);
      setEditingOverlayId(null);

      const canvasRect = canvasEl.getBoundingClientRect();

      pointerSessionRef.current = {
        mode: "rotate",
        pointerId: e.pointerId,
        elementId: element.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        canvasRect,
        initialElement: element,
        otherElements: [],
        latestElement: element,
        hasMoved: false,
      };

      setIsManipulatingOverlay(true);
      setLiveRotationAngle(element.rotation || 0);
      attachWindowPointerListeners();
    },
    [onUpdateSlide, setSelectedOverlayId, attachWindowPointerListeners]
  );

  // Commit overlay helper
  const commitOverlayElements = useCallback(
    (nextElements: CanvasElement[], actionName: string, pushHistory = true) => {
      if (!onUpdateSlide) return;
      onUpdateSlide(
        {
          ...slideRef.current,
          overlayElements: nextElements,
        },
        pushHistory,
        actionName
      );
    },
    [onUpdateSlide]
  );

  const updateOverlayContent = useCallback(
    (id: string, content: string) => {
      const current = slideRef.current.overlayElements || [];
      const target = current.find((el) => el.id === id);
      if (!target || target.content === content) return;
      const next = current.map((el) => (el.id === id ? { ...el, content } : el));
      commitOverlayElements(next, "Edit Overlay Text", true);
    },
    [commitOverlayElements]
  );

  const updateOverlayStyle = useCallback(
    (id: string, stylePatch: Partial<CanvasElementStyle>, actionName = "Style Overlay Element") => {
      const current = slideRef.current.overlayElements || [];
      const next = current.map((el) =>
        el.id === id ? { ...el, style: { ...el.style, ...stylePatch } } : el
      );
      commitOverlayElements(next, actionName, true);
    },
    [commitOverlayElements]
  );

  // Layering actions
  const bringOverlayToFront = useCallback(
    (id: string) => {
      const current = normalizeZOrder(slideRef.current.overlayElements || []);
      const maxZ = current.reduce((m, el) => Math.max(m, el.zIndex), 0);
      const next = normalizeZOrder(
        current.map((el) => (el.id === id ? { ...el, zIndex: maxZ + 1 } : el))
      );
      commitOverlayElements(next, "Bring Element to Front", true);
    },
    [commitOverlayElements]
  );

  const sendOverlayToBack = useCallback(
    (id: string) => {
      const current = normalizeZOrder(slideRef.current.overlayElements || []);
      const next = normalizeZOrder(
        current.map((el) => (el.id === id ? { ...el, zIndex: 0 } : el))
      );
      commitOverlayElements(next, "Send Element to Back", true);
    },
    [commitOverlayElements]
  );

  const bringOverlayForward = useCallback(
    (id: string) => {
      const sorted = [...normalizeZOrder(slideRef.current.overlayElements || [])].sort(
        (a, b) => a.zIndex - b.zIndex
      );
      const idx = sorted.findIndex((el) => el.id === id);
      if (idx === -1 || idx === sorted.length - 1) return;
      const above = sorted[idx + 1];
      const target = sorted[idx];
      const next = sorted.map((el) => {
        if (el.id === target.id) return { ...el, zIndex: above.zIndex };
        if (el.id === above.id) return { ...el, zIndex: target.zIndex };
        return el;
      });
      commitOverlayElements(next, "Bring Element Forward", true);
    },
    [commitOverlayElements]
  );

  const sendOverlayBackward = useCallback(
    (id: string) => {
      const sorted = [...normalizeZOrder(slideRef.current.overlayElements || [])].sort(
        (a, b) => a.zIndex - b.zIndex
      );
      const idx = sorted.findIndex((el) => el.id === id);
      if (idx <= 0) return;
      const below = sorted[idx - 1];
      const target = sorted[idx];
      const next = sorted.map((el) => {
        if (el.id === target.id) return { ...el, zIndex: below.zIndex };
        if (el.id === below.id) return { ...el, zIndex: target.zIndex };
        return el;
      });
      commitOverlayElements(next, "Send Element Backward", true);
    },
    [commitOverlayElements]
  );

  // Alignment relative to slide frame
  const alignOverlayElement = useCallback(
    (id: string, alignment: OverlayAlignment) => {
      const current = slideRef.current.overlayElements || [];
      const next = current.map((el) => {
        if (el.id !== id) return el;
        switch (alignment) {
          case "left":
            return { ...el, x: 4 };
          case "center-h":
            return { ...el, x: roundPct(50 - el.width / 2) };
          case "right":
            return { ...el, x: roundPct(96 - el.width) };
          case "top":
            return { ...el, y: 6 };
          case "center-v":
            return { ...el, y: roundPct(50 - el.height / 2) };
          case "bottom":
            return { ...el, y: roundPct(94 - el.height) };
          default:
            return el;
        }
      });
      commitOverlayElements(next, `Align Element (${alignment})`, true);
    },
    [commitOverlayElements]
  );

  const duplicateOverlayElement = useCallback(
    (id: string) => {
      const current = slideRef.current.overlayElements || [];
      const source = current.find((el) => el.id === id);
      if (!source) return;
      const maxZ = current.reduce((m, el) => Math.max(m, el.zIndex), 0);
      const cloned: CanvasElement = {
        ...source,
        id: `ov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: roundPct(clamp(source.x + 3, 0, 100 - source.width)),
        y: roundPct(clamp(source.y + 3, 0, 100 - source.height)),
        zIndex: maxZ + 1,
        style: { ...source.style },
      };
      const next = normalizeZOrder([...current, cloned]);
      commitOverlayElements(next, "Duplicate Overlay Element", true);
      setSelectedOverlayId(cloned.id);
    },
    [commitOverlayElements, setSelectedOverlayId]
  );

  const deleteOverlayElement = useCallback(
    (id: string) => {
      const current = slideRef.current.overlayElements || [];
      const next = normalizeZOrder(current.filter((el) => el.id !== id));
      commitOverlayElements(next, "Delete Overlay Element", true);
      if (selectedOverlayId === id) {
        setSelectedOverlayId(null);
      }
      if (editingOverlayId === id) {
        setEditingOverlayId(null);
      }
    },
    [commitOverlayElements, selectedOverlayId, editingOverlayId, setSelectedOverlayId]
  );

  const nudgeOverlayElement = useCallback(
    (id: string, dxPct: number, dyPct: number) => {
      const current = slideRef.current.overlayElements || [];
      const next = current.map((el) => {
        if (el.id !== id) return el;
        return {
          ...el,
          x: roundPct(clamp(el.x + dxPct, -el.width + 5, 95)),
          y: roundPct(clamp(el.y + dyPct, -el.height + 5, 95)),
        };
      });
      commitOverlayElements(next, "Nudge Overlay Element", true);
    },
    [commitOverlayElements]
  );

  return {
    selectedIndices,
    selectedType,
    setSelectedIndices,
    setSelectedType,
    resetSelection,
    draggedIndex,
    draggedType,
    dragOverIndex,
    snappedCol,
    snappedRow,
    isColliding,
    setIsColliding,
    setDragOverIndex,
    setSnappedCol,
    setSnappedRow,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleItemClick,
    handleResetPosition,
    handleNudgeOrder,
    checkCollision,
    // Free-form Overlay API
    selectedOverlayId,
    setSelectedOverlayId,
    editingOverlayId,
    setEditingOverlayId,
    draftOverlayElement,
    activeSnapGuides,
    isManipulatingOverlay,
    liveRotationAngle,
    startOverlayDrag,
    startOverlayResize,
    startOverlayRotate,
    updateOverlayContent,
    updateOverlayStyle,
    bringOverlayToFront,
    sendOverlayToBack,
    bringOverlayForward,
    sendOverlayBackward,
    alignOverlayElement,
    duplicateOverlayElement,
    deleteOverlayElement,
    nudgeOverlayElement,
  };
}

