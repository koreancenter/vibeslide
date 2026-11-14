import React from "react";
import { SlideData, SlideLayout, SlideTransition, PresentationTheme } from "../types";
import {
  LayoutOptionItem,
  SLIDE_LAYOUT_OPTIONS,
  TransitionOptionItem,
  SLIDE_TRANSITION_OPTIONS,
  renderLayoutMiniWireframe,
  renderTemplateMiniWireframe,
} from "./editor/wireframeHelpers";
import { MarkdownPane } from "./editor/MarkdownPane";
import { FileText } from "lucide-react";

export type { LayoutOptionItem, TransitionOptionItem };
export {
  SLIDE_LAYOUT_OPTIONS,
  SLIDE_TRANSITION_OPTIONS,
  renderLayoutMiniWireframe,
  renderTemplateMiniWireframe,
};

export interface SlideEditorProps {
  slide: SlideData;
  language: string;
  onUpdateSlide?: (updated: SlideData, immediate?: boolean, actionDesc?: string) => void;
  onUpdateAllSlides?: (slides: SlideData[]) => void;
  onSyncMarkdownToSlides?: (slides: SlideData[]) => void;
  slides: SlideData[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide?: () => void;
  onDuplicateSlide?: (index: number) => void;
  onDeleteSlide?: (index: number) => void;
  onMoveSlide?: (fromIndex: number, toIndex: number) => void;
  onSelectTemplate?: (slides: SlideData[], templateName: string) => void;
  width?: number;
  theme?: PresentationTheme;
  onUpdateTheme?: (theme: PresentationTheme) => void;
  highlightedField?: string | null;
  onHighlightedFieldChange?: (field: string | null) => void;
  onHoverTransition?: (transition: SlideTransition | null) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  language,
  onUpdateAllSlides,
  onSyncMarkdownToSlides,
  slides,
  activeSlideIndex,
  onSelectSlide,
  width,
  highlightedField,
  onHighlightedFieldChange,
}) => {
  const isKo = language === "ko";

  return (
    <aside
      className="h-full bg-[#0b0d11] text-slate-300 border-r border-white/[0.08] flex flex-col shrink-0 overflow-hidden select-none font-sans"
      style={{ width: width !== undefined ? `${width}px` : "384px" }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between bg-transparent border-b border-white/[0.08] px-3.5 h-10 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            {isKo ? "슬라이드 내용 편집" : "Content Editor"}
          </span>
        </div>

        {/* Slide count indicator */}
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-300"
          title="Active Slide Index"
        >
          #{activeSlideIndex + 1}/{slides.length}
        </span>
      </div>

      {/* Full-Height Content Editor */}
      <MarkdownPane
        slides={slides}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={onSelectSlide}
        onUpdateAllSlides={onUpdateAllSlides}
        onSyncMarkdownToSlides={onSyncMarkdownToSlides}
        highlightedField={highlightedField}
        onHighlightedFieldChange={onHighlightedFieldChange}
      />
    </aside>
  );
};
