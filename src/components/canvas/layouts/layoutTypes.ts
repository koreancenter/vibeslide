import React from "react";
import { SlideData, Language, PresentationTheme } from "../../../types";

export interface CommonLayoutProps {
  slide: SlideData;
  theme: PresentationTheme;
  language: Language;
  getText: (ko?: string, id?: string) => string;
  getRawText: (ko?: string, id?: string) => string;
  highlightedField?: string | null;
  onCanvasElementClick?: (field: string, index?: number) => void;
  onBulletTitleChange: (idx: number, val: string) => void;
  onBulletDescChange: (idx: number, val: string) => void;
  onImageChange: () => void;
  // Interaction bindings
  selectedIndices: number[];
  selectedType: "bullet" | "stat" | null;
  draggedIndex: number | null;
  draggedType: "bullet" | "stat" | null;
  dragOverIndex: number | null;
  snappedCol: number | null;
  snappedRow: number | null;
  handleDragStart: (e: React.DragEvent, type: "bullet" | "stat", index: number) => void;
  handleDragOver: (e: React.DragEvent, type: "bullet" | "stat", index: number) => void;
  handleDrop: (e: React.DragEvent, type: "bullet" | "stat", toIndex: number) => void;
  handleDragEnd: () => void;
  handleItemClick: (e: React.MouseEvent, type: "bullet" | "stat", index: number) => void;
  cleanBullets: any[];
  buildInStep?: number;
  buildInConfig?: import("../../../types").ComponentBuildInConfig;
}
