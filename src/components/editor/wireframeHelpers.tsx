import React from "react";
import { SlideLayout, SlideTransition } from "../../types";
import {
  FileText,
  BarChart3,
  Sparkles,
  Building2,
  Plus,
} from "lucide-react";

export interface LayoutOptionItem {
  id: SlideLayout;
  label: string;
  category: "Text-Heavy" | "Image-Heavy" | "Data & Structure";
  isTextHeavy?: boolean;
  isImageHeavy?: boolean;
}

export const SLIDE_LAYOUT_OPTIONS: LayoutOptionItem[] = [
  // Text-Heavy group
  { id: "general", label: "General", category: "Text-Heavy", isTextHeavy: true },
  { id: "cards-2", label: "Cards: 2 Columns", category: "Text-Heavy", isTextHeavy: true },
  { id: "cards-3", label: "Cards: 3 Columns", category: "Text-Heavy", isTextHeavy: true },
  { id: "overview", label: "Overview Summary", category: "Text-Heavy", isTextHeavy: true },
  { id: "action-items", label: "Action Items", category: "Text-Heavy", isTextHeavy: true },

  // Image-Heavy group
  { id: "full-image", label: "Full Image", category: "Image-Heavy", isImageHeavy: true },
  { id: "split-info", label: "Split Info", category: "Image-Heavy", isImageHeavy: true },

  // Data & Structure group
  { id: "cover", label: "Cover Slide", category: "Data & Structure" },
  { id: "key-stats", label: "Key Stats & Metrics", category: "Data & Structure" },
  { id: "process-3", label: "3-Step Process Flow", category: "Data & Structure" },
  { id: "delegation-table", label: "Delegation Table", category: "Data & Structure" },
  { id: "schedule-table", label: "Schedule Table", category: "Data & Structure" },
];

export interface TransitionOptionItem {
  id: SlideTransition;
  label: string;
}

export const SLIDE_TRANSITION_OPTIONS: TransitionOptionItem[] = [
  { id: "fade", label: "Fade" },
  { id: "slide-in", label: "Slide-In" },
  { id: "wipe", label: "Wipe" },
  { id: "zoom", label: "Zoom" },
  { id: "flip", label: "Flip 3D" },
  { id: "none", label: "None" },
];

export const renderLayoutMiniWireframe = (layoutId: SlideLayout, large = false) => {
  const innerClass = large ? "bg-current/15 border border-current/30 rounded" : "bg-current/10 border border-current/20 rounded-sm";
  const sizeClass = large ? "w-14 h-10 p-1.5 border border-current/35 rounded-md shrink-0 opacity-100 shadow-sm transition-all duration-200" : "";
  
  switch (layoutId) {
    case "general":
      return large ? (
        <div className={`flex flex-col gap-1 justify-center ${sizeClass}`}>
          <div className="w-3/4 h-1.5 bg-current/55 rounded-sm" />
          <div className="w-1/2 h-1 bg-current/35 rounded-sm" />
          <div className={`w-full h-2.5 ${innerClass}`} />
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] border border-current/20 rounded-sm p-[2px] shrink-0 opacity-60">
          <div className="w-3/4 h-[2px] bg-current/40 rounded-[1px]" />
          <div className="w-1/2 h-[1px] bg-current/25" />
          <div className={`w-full h-[5px] ${innerClass}`} />
        </div>
      );
    case "cards-2":
      return large ? (
        <div className={`flex flex-col gap-1 ${sizeClass}`}>
          <div className="w-1/2 h-1.5 bg-current/55 rounded-sm" />
          <div className="flex gap-1 flex-1">
            <div className={`flex-1 h-full ${innerClass}`} />
            <div className={`flex-1 h-full ${innerClass}`} />
          </div>
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] border border-current/20 rounded-sm p-[2px] shrink-0 opacity-60">
          <div className="w-1/2 h-[2px] bg-current/40 rounded-[1px]" />
          <div className="flex gap-[1.5px] flex-1">
            <div className={`flex-1 ${innerClass}`} />
            <div className={`flex-1 ${innerClass}`} />
          </div>
        </div>
      );
    case "cards-3":
      return large ? (
        <div className={`flex flex-col gap-1 ${sizeClass}`}>
          <div className="w-1/3 h-1.5 bg-current/55 rounded-sm" />
          <div className="flex gap-1 flex-1">
            <div className={`flex-1 h-full ${innerClass}`} />
            <div className={`flex-1 h-full ${innerClass}`} />
            <div className={`flex-1 h-full ${innerClass}`} />
          </div>
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] border border-current/20 rounded-sm p-[2px] shrink-0 opacity-60">
          <div className="w-1/3 h-[2px] bg-current/40 rounded-[1px]" />
          <div className="flex gap-[1px] flex-1">
            <div className={`flex-1 ${innerClass}`} />
            <div className={`flex-1 ${innerClass}`} />
            <div className={`flex-1 ${innerClass}`} />
          </div>
        </div>
      );
    case "overview":
      return large ? (
        <div className={`flex flex-col gap-1.5 ${sizeClass}`}>
          <div className="w-[45%] h-1.5 bg-current/55 rounded-sm" />
          <div className={`w-full h-3 ${innerClass}`} />
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] border border-current/20 rounded-sm p-[2px] shrink-0 opacity-60">
          <div className="w-1/2 h-[2px] bg-current/40 rounded-[1px]" />
          <div className={`w-full h-[6px] ${innerClass}`} />
        </div>
      );
    case "action-items":
      return large ? (
        <div className={`flex flex-col gap-1 justify-center ${sizeClass}`}>
          <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-current/55 rounded-full shrink-0" /><div className="w-full h-1 bg-current/25 rounded-sm" /></div>
          <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-current/55 rounded-full shrink-0" /><div className="w-full h-1 bg-current/25 rounded-sm" /></div>
          <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-current/55 rounded-full shrink-0" /><div className="w-[70%] h-1 bg-current/25 rounded-sm" /></div>
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] border border-current/20 rounded-sm p-[2px] shrink-0 opacity-60 justify-center">
          <div className="flex items-center gap-[2px]"><div className="w-[2px] h-[2px] bg-current/40 rounded-full shrink-0" /><div className="w-3 h-[1px] bg-current/20" /></div>
          <div className="flex items-center gap-[2px]"><div className="w-[2px] h-[2px] bg-current/40 rounded-full shrink-0" /><div className="w-4 h-[1px] bg-current/20" /></div>
          <div className="flex items-center gap-[2px]"><div className="w-[2px] h-[2px] bg-current/40 rounded-full shrink-0" /><div className="w-2 h-[1px] bg-current/20" /></div>
        </div>
      );
    case "full-image":
      return large ? (
        <div className={`flex items-center justify-center bg-current/[0.04] ${sizeClass}`}>
          <div className="w-full h-full bg-current/15 border border-dashed border-current/40 rounded flex items-center justify-center">
            <div className="w-4 h-2.5 bg-current/35 rounded-sm" />
          </div>
        </div>
      ) : (
        <div className="w-5 h-4 border border-current/20 rounded-sm p-[1px] shrink-0 opacity-60 flex items-center justify-center">
          <div className="w-full h-full bg-current/10 border border-dashed border-current/30 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1 bg-current/30 rounded-[1px]" />
          </div>
        </div>
      );
    case "split-info":
      return large ? (
        <div className={`flex gap-1.5 ${sizeClass}`}>
          <div className="flex-1 bg-current/15 border border-dashed border-current/40 rounded flex items-center justify-center">
            <div className="w-3.5 h-2 bg-current/25 rounded-sm" />
          </div>
          <div className="flex-1 flex flex-col gap-1 justify-center">
            <div className="w-full h-1 bg-current/40 rounded-sm" />
            <div className="w-[75%] h-1 bg-current/25 rounded-sm" />
          </div>
        </div>
      ) : (
        <div className="w-5 h-4 flex gap-[1.5px] border border-current/20 rounded-sm p-[1.5px] shrink-0 opacity-60">
          <div className="flex-1 bg-current/10 border border-dashed border-current/30 rounded-[1px] flex items-center justify-center">
            <div className="w-1 h-[2px] bg-current/20 rounded-[1px]" />
          </div>
          <div className="flex-1 flex flex-col gap-[1px] justify-center">
            <div className="w-full h-[1px] bg-current/30" />
            <div className="w-2/3 h-[1px] bg-current/20" />
          </div>
        </div>
      );
    case "cover":
      return large ? (
        <div className={`flex flex-col gap-1 items-center justify-center bg-current/[0.04] ${sizeClass}`}>
          <div className="w-full h-2 bg-current/55 rounded-sm" />
          <div className="w-[60%] h-1 bg-current/30 rounded-sm" />
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1.5px] items-center justify-center border border-current/20 rounded-sm p-[1.5px] shrink-0 opacity-60 bg-current/5">
          <div className="w-3/4 h-[2px] bg-current/50 rounded-[1px]" />
          <div className="w-1/2 h-[1px] bg-current/30" />
        </div>
      );
    case "key-stats":
      return large ? (
        <div className={`flex flex-col gap-1 justify-center items-center bg-current/[0.04] ${sizeClass}`}>
          <div className="text-[11px] leading-none font-black text-current/85">99%</div>
          <div className="w-full h-1 bg-current/25 rounded-sm" />
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1px] border border-current/20 rounded-sm p-[1.5px] shrink-0 opacity-60 justify-center items-center bg-current/[0.03]">
          <div className="text-[5px] leading-none font-black text-current/70 scale-90 -translate-y-[0.5px]">99</div>
          <div className="w-3/4 h-[0.5px] bg-current/20" />
        </div>
      );
    case "process-3":
      return large ? (
        <div className={`flex gap-1.5 items-center justify-center ${sizeClass}`}>
          <div className="w-2 h-2 bg-current/45 rounded-full" />
          <div className="w-1.5 h-0.5 bg-current/25 rounded-sm" />
          <div className="w-2 h-2 bg-current/55 rounded-full" />
          <div className="w-1.5 h-0.5 bg-current/25 rounded-sm" />
          <div className="w-2 h-2 bg-current/45 rounded-full" />
        </div>
      ) : (
        <div className="w-5 h-4 flex gap-[1px] border border-current/20 rounded-sm p-[1.5px] shrink-0 opacity-60 items-center justify-center">
          <div className="w-[3px] h-[3px] bg-current/30 rounded-full" />
          <div className="w-[2px] h-[0.5px] bg-current/20" />
          <div className="w-[3px] h-[3px] bg-current/40 rounded-full" />
          <div className="w-[2px] h-[0.5px] bg-current/20" />
          <div className="w-[3px] h-[3px] bg-current/30 rounded-full" />
        </div>
      );
    case "delegation-table":
    case "schedule-table":
    case "comparison-table":
    case "feature-matrix":
      return large ? (
        <div className={`flex flex-col gap-1 justify-between ${sizeClass}`}>
          <div className="flex gap-1"><div className="flex-1 h-2 bg-current/45 rounded-sm" /><div className="flex-1 h-2 bg-current/45 rounded-sm" /><div className="flex-1 h-2 bg-current/45 rounded-sm" /></div>
          <div className="flex gap-1"><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /></div>
          <div className="flex gap-1"><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /><div className="flex-1 h-1.5 bg-current/20 rounded-sm" /></div>
        </div>
      ) : (
        <div className="w-5 h-4 flex flex-col gap-[1px] border border-current/20 rounded-sm p-[1.5px] shrink-0 opacity-60 justify-between">
          <div className="flex gap-[1px]"><div className="flex-1 h-[1.5px] bg-current/40 rounded-[0.5px]" /><div className="flex-1 h-[1.5px] bg-current/40 rounded-[0.5px]" /><div className="flex-1 h-[1.5px] bg-current/40 rounded-[0.5px]" /></div>
          <div className="flex gap-[1px]"><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /></div>
          <div className="flex gap-[1px]"><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /><div className="flex-1 h-[1px] bg-current/15 rounded-[0.5px]" /></div>
        </div>
      );
    default:
      return null;
  }
};

export const renderTemplateMiniWireframe = (tmplId: string) => {
  const sizeClass = "w-14 h-10 p-1.5 border border-current/35 rounded-md shrink-0 opacity-100 shadow-sm transition-all duration-200 bg-[#161618]";
  
  switch (tmplId) {
    case "project-proposal":
      return (
        <div className={`flex flex-col justify-between ${sizeClass}`}>
          <div className="flex items-center justify-between">
            <div className="w-3.5 h-1 bg-indigo-400/80 rounded-full" />
            <FileText className="w-2.5 h-2.5 opacity-60 text-indigo-400" />
          </div>
          <div className="w-8 h-1.5 bg-current/60 rounded-xs" />
          <div className="flex gap-1">
            <div className="flex-1 h-2 bg-current/15 border border-current/25 rounded-xs" />
            <div className="flex-1 h-2 bg-current/15 border border-current/25 rounded-xs" />
          </div>
        </div>
      );
    case "quarterly-report":
      return (
        <div className={`flex flex-col justify-between ${sizeClass}`}>
          <div className="flex items-center justify-between">
            <div className="w-3.5 h-1 bg-amber-400/80 rounded-full" />
            <BarChart3 className="w-2.5 h-2.5 opacity-60 text-amber-400" />
          </div>
          <div className="w-7 h-1.5 bg-current/60 rounded-xs" />
          <div className="flex items-end justify-between gap-1 h-2.5 px-0.5">
            <div className="w-1.5 h-1.5 bg-current/30 rounded-xs" />
            <div className="w-1.5 h-2 bg-current/50 rounded-xs" />
            <div className="w-1.5 h-2.5 bg-current/80 rounded-xs" />
            <div className="w-1.5 h-1.5 bg-current/40 rounded-xs" />
          </div>
        </div>
      );
    case "team-pitch":
      return (
        <div className={`flex flex-col justify-between ${sizeClass}`}>
          <div className="flex items-center justify-between">
            <div className="w-3.5 h-1 bg-purple-400/80 rounded-full" />
            <Sparkles className="w-2.5 h-2.5 opacity-60 text-purple-400" />
          </div>
          <div className="w-8 h-1.5 bg-current/60 rounded-xs" />
          <div className="flex gap-1">
            <div className="w-3 h-2 bg-purple-400/30 rounded-xs" />
            <div className="flex-1 h-2 bg-current/15 border border-current/25 rounded-xs" />
          </div>
        </div>
      );
    case "korean-corporate":
      return (
        <div className={`flex flex-col justify-between ${sizeClass}`}>
          <div className="flex items-center justify-between">
            <div className="w-4 h-1 bg-sky-400/80 rounded-full" />
            <Building2 className="w-2.5 h-2.5 opacity-60 text-sky-400" />
          </div>
          <div className="w-8 h-1.5 bg-current/60 rounded-xs" />
          <div className="flex gap-0.5">
            <div className="flex-1 h-2 bg-current/20 rounded-xs" />
            <div className="flex-1 h-2 bg-current/20 rounded-xs" />
            <div className="flex-1 h-2 bg-current/20 rounded-xs" />
          </div>
        </div>
      );
    case "blank":
    default:
      return (
        <div className={`flex flex-col items-center justify-center border-dashed ${sizeClass}`}>
          <Plus className="w-3.5 h-3.5 opacity-60 text-emerald-400" />
          <div className="w-5 h-0.5 bg-current/30 rounded-full mt-0.5" />
        </div>
      );
  }
};
