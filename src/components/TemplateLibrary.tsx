import React, { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PersonalSlideTemplate } from "../types";
import { useSlideContext } from "../context/SlideContext";
import { renderLayoutMiniWireframe } from "./editor/wireframeHelpers";

interface TemplateLibraryProps {
  onInserted?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onInserted }) => {
  const {
    customTemplates,
    deleteCustomTemplate,
    insertSlideFromTemplate,
    language,
  } = useSlideContext();

  const isKo = language === "ko";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    customTemplates.forEach((tpl) => {
      if (tpl.category?.trim()) set.add(tpl.category.trim());
    });
    return Array.from(set);
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customTemplates.filter((tpl) => {
      if (selectedCategory !== "all" && tpl.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        tpl.name.toLowerCase().includes(q) ||
        (tpl.category || "").toLowerCase().includes(q) ||
        tpl.slide.layout.toLowerCase().includes(q)
      );
    });
  }, [customTemplates, searchQuery, selectedCategory]);

  const handleUseTemplate = (tpl: PersonalSlideTemplate) => {
    insertSlideFromTemplate(tpl);
    onInserted?.();
  };

  if (customTemplates.length === 0) {
    return (
      <div className="py-12 px-6 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.1] rounded-xl bg-[#0b0f18]">
        <BookmarkPlus className="w-8 h-8 text-blue-400/70 mb-3" />
        <h4 className="text-sm font-semibold text-white">
          {isKo ? "저장된 개인 슬라이드 템플릿이 없습니다" : "No Custom Templates Saved Yet"}
        </h4>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          {isKo
            ? "하단 슬라이드 썸네일을 우클릭한 뒤 '슬라이드를 템플릿으로 저장'을 선택하면 레이아웃과 스타일이 라이브러리에 저장됩니다."
            : "Right-click any slide thumbnail in the slide dock and select 'Save Slide as Template' to store reusable layouts, content, and styling."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isKo ? "템플릿 이름 또는 레이아웃 검색..." : "Search custom templates..."
            }
            className="w-full bg-[#0b0f18] border border-white/[0.1] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-[#0b0f18] border border-white/[0.08] rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 transition ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {isKo ? "전체" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 transition ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">
          {isKo ? "검색 조건과 일치하는 템플릿이 없습니다." : "No templates match your filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTemplates.map((tpl) => {
            const overlayCount = tpl.slide.overlayElements?.length || 0;
            const bulletCount = tpl.slide.bullets?.length || 0;
            const statCount = tpl.slide.stats?.length || 0;
            const savedDate = new Date(tpl.createdAt).toLocaleDateString();

            return (
              <div
                key={tpl.id}
                className="rounded-xl bg-[#0c1018] border border-white/[0.09] hover:border-blue-500/40 p-3.5 flex flex-col justify-between gap-3 transition"
              >
                {/* Visual Preview Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="p-2 rounded-lg bg-[#141925] border border-white/[0.06] shrink-0">
                    {renderLayoutMiniWireframe(tpl.slide.layout, true)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5
                      className="text-xs font-semibold text-white truncate"
                      title={tpl.name}
                    >
                      {tpl.name}
                    </h5>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                      <span>{tpl.slide.layout}</span>
                      {tpl.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[110px]">{tpl.category}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono tabular-nums flex items-center gap-1.5">
                      <span>{savedDate}</span>
                      {bulletCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{bulletCount} cards</span>
                        </>
                      )}
                      {statCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{statCount} stats</span>
                        </>
                      )}
                      {overlayCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{overlayCount} objects</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleUseTemplate(tpl)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/35 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isKo ? "슬라이드 삽입" : "Use Template"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCustomTemplate(tpl.id)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition cursor-pointer shrink-0"
                    title={isKo ? "템플릿 삭제" : "Delete Template"}
                    aria-label={`Delete template ${tpl.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const SaveSlideTemplateModal: React.FC = () => {
  const {
    slides,
    saveTemplateTargetIndex,
    setSaveTemplateTargetIndex,
    saveSlideAsTemplate,
    language,
  } = useSlideContext();

  const isKo = language === "ko";
  const targetSlide =
    saveTemplateTargetIndex !== null ? slides[saveTemplateTargetIndex] : null;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (targetSlide) {
      const defaultName =
        (isKo
          ? targetSlide.titleKo || targetSlide.titleId
          : targetSlide.titleId || targetSlide.titleKo) ||
        `Slide ${saveTemplateTargetIndex! + 1} Template`;
      setName(defaultName);
      setCategory(
        (isKo
          ? targetSlide.categoryKo || targetSlide.categoryId
          : targetSlide.categoryId || targetSlide.categoryKo) || "Custom"
      );
    }
  }, [targetSlide, saveTemplateTargetIndex, isKo]);

  useEffect(() => {
    if (saveTemplateTargetIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSaveTemplateTargetIndex(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveTemplateTargetIndex, setSaveTemplateTargetIndex]);

  if (saveTemplateTargetIndex === null || !targetSlide) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await saveSlideAsTemplate(saveTemplateTargetIndex, name.trim(), category.trim());
      setSaveTemplateTargetIndex(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setSaveTemplateTargetIndex(null)}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Save Slide as Template"
        className="bg-[#10141e] border border-white/[0.12] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-[#141925] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              {isKo ? "슬라이드를 템플릿으로 저장" : "Save Slide as Template"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSaveTemplateTargetIndex(null)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0f18] border border-white/[0.08]">
            <div className="p-1.5 rounded-lg bg-[#141925] shrink-0">
              {renderLayoutMiniWireframe(targetSlide.layout, true)}
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-medium text-white truncate">
                Slide #{saveTemplateTargetIndex + 1} · {targetSlide.layout}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {isKo
                    ? "레이아웃, 콘텐츠, 스타일 및 자유 개체 포함"
                    : "Includes layout, content, styling & canvas objects"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="save-template-name"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              {isKo ? "템플릿 이름" : "Template Name"}
            </label>
            <input
              id="save-template-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 KPI Scorecard"
              className="w-full bg-[#0a0d14] border border-white/[0.12] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="save-template-category"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              {isKo ? "카테고리 (선택)" : "Category (optional)"}
            </label>
            <input
              id="save-template-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Executive Summary, Financial"
              className="w-full bg-[#0a0d14] border border-white/[0.12] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-[#141925] border-t border-white/[0.08] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSaveTemplateTargetIndex(null)}
            className="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/[0.08] cursor-pointer"
          >
            {isKo ? "취소" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            {isKo ? "라이브러리에 저장" : "Save Template"}
          </button>
        </div>
      </form>
    </div>
  );
};
