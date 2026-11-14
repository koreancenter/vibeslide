import React, { useState, useRef } from "react";
import { SlideData } from "../../../types";
import { INITIAL_SLIDES } from "../../../data/initialSlides";

interface UseCanvasInteractionsProps {
  slide: SlideData;
  onUpdateSlide?: (updatedSlide: SlideData, pushHistory?: boolean, actionName?: string) => void;
  onCanvasElementClick?: (field: string, index?: number) => void;
}

export function useCanvasInteractions({
  slide,
  onUpdateSlide,
  onCanvasElementClick,
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

  const handleDrop = (e: React.DragEvent, type: "bullet" | "stat", toIndex: number) => {
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

  const resetSelection = () => {
    setSelectedIndices([]);
    setSelectedType(null);
  };

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
  };
}
