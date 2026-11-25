import React, { useEffect, useState } from "react";
import { Bookmark, LayoutGrid, Plus, X } from "lucide-react";
import { SlideLayout } from "../types";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import {
  SLIDE_LAYOUT_OPTIONS,
  renderLayoutMiniWireframe,
} from "./editor/wireframeHelpers";
import { TemplateLibrary } from "./TemplateLibrary";

export const AddSlideModal: React.FC = () => {
  const modalCtx = useModalContext();
  const { handleAddSlide, customTemplates, language } = useSlideContext();

  const isOpen = modalCtx.isModalOpen("addSlide");
  const isKo = language === "ko";
  const [activeTab, setActiveTab] = useState<"layouts" | "templates">("layouts");

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        modalCtx.closeModal("addSlide");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, modalCtx]);

  if (!isOpen) return null;

  const handleInsertLayout = (layout: SlideLayout) => {
    handleAddSlide(layout);
    modalCtx.closeModal("addSlide");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => modalCtx.closeModal("addSlide")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add New Slide"
        className="bg-[#10141e] border border-white/[0.1] rounded-2xl w-full max-w-4xl max-h-[86vh] shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Tab Switcher */}
        <div className="px-6 py-4 bg-[#141925] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-base font-semibold text-white tracking-tight whitespace-nowrap">
              {isKo ? "새 슬라이드 추가" : "Add New Slide"}
            </h2>

            <div className="flex items-center gap-1 p-1 bg-[#0a0d14] border border-white/[0.08] rounded-lg">
              <button
                type="button"
                id="tab-add-slide-layouts"
                onClick={() => setActiveTab("layouts")}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "layouts"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isKo ? "표준 레이아웃" : "Standard Layouts"}</span>
              </button>

              <button
                type="button"
                id="tab-add-slide-templates"
                onClick={() => setActiveTab("templates")}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "templates"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {isKo
                    ? `내 템플릿 (${customTemplates.length})`
                    : `My Templates (${customTemplates.length})`}
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => modalCtx.closeModal("addSlide")}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close Add Slide Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "layouts" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {isKo
                    ? "새 슬라이드에 적용할 기본 16:9 레이아웃 구조를 선택하세요."
                    : "Select a preset 16:9 slide layout to insert into your deck."}
                </p>
                <button
                  type="button"
                  onClick={() => handleInsertLayout("cards-3")}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isKo ? "빠른 빈 슬라이드" : "Quick Blank Slide"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {SLIDE_LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleInsertLayout(opt.id)}
                    className="text-left p-3 rounded-xl bg-[#0c1018] hover:bg-[#131926] border border-white/[0.08] hover:border-blue-500/50 transition cursor-pointer flex flex-col gap-2.5 group"
                  >
                    <div className="w-full py-2 rounded-lg bg-[#141925] border border-white/[0.05] flex items-center justify-center group-hover:border-blue-500/30 transition">
                      {renderLayoutMiniWireframe(opt.id, true)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 group-hover:text-blue-300 truncate">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {opt.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <TemplateLibrary onInserted={() => modalCtx.closeModal("addSlide")} />
          )}
        </div>
      </div>
    </div>
  );
};
