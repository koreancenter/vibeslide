import React, { useState, useEffect, useCallback } from "react";

export const BASE_LEFT_WIDTH = 380;
export const MIN_LEFT_WIDTH = 340;
export const MAX_LEFT_WIDTH = 600;

export function useResizableSidebar(storageKey: string = "kind_2026_left_width") {
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {
      // ignore
    }
    return BASE_LEFT_WIDTH;
  });

  const [isDraggingLeft, setIsDraggingLeft] = useState<boolean>(false);

  const leftSidebarWidth = Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, leftWidth));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(leftWidth));
    } catch (e) {
      // ignore
    }
  }, [leftWidth, storageKey]);

  const resetSidebarWidth = useCallback(() => {
    setLeftWidth(BASE_LEFT_WIDTH);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
  }, [storageKey]);

  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, startWidth + diff));
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingLeft(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return {
    leftWidth,
    leftSidebarWidth,
    isDraggingLeft,
    handleLeftResizeStart,
    resetSidebarWidth,
  };
}
