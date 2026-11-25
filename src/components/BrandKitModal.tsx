import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Image as ImageIcon,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { BrandKit, BrandLogoPosition } from "../types";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import {
  CURATED_GOOGLE_FONTS,
  formatCssFontFamily,
  loadGoogleFont,
} from "../utils/googleFonts";
import { STARTER_BRAND_KITS } from "../utils/corporateAssetsStore";

const POSITION_OPTIONS: {
  id: BrandLogoPosition;
  label: string;
  labelKo: string;
}[] = [
  { id: "top-left", label: "Top-Left", labelKo: "좌측 상단" },
  { id: "top-right", label: "Top-Right", labelKo: "우측 상단" },
  { id: "bottom-right", label: "Bottom-Right", labelKo: "우측 하단" },
  { id: "hidden-on-title", label: "Hidden on Title Slides", labelKo: "표지 숨김" },
];

function createEmptyDraft(base?: Partial<BrandKit>): BrandKit {
  const now = Date.now();
  return {
    id: base?.id || "",
    name: base?.name || "Corporate Brand Kit",
    primaryColor: base?.primaryColor || "#1E40AF",
    secondaryColor: base?.secondaryColor || "#0EA5E9",
    accentColor: base?.accentColor || "#F59E0B",
    headingFont: base?.headingFont || "Outfit",
    bodyFont: base?.bodyFont || "Plus Jakarta Sans",
    logoUrl: base?.logoUrl || "",
    logoPosition: base?.logoPosition || "top-right",
    hideLogoOnTitleSlide: base?.hideLogoOnTitleSlide ?? true,
    surfaceMode: base?.surfaceMode || "dark",
    createdAt: base?.createdAt || now,
    updatedAt: now,
  };
}

export const BrandKitModal: React.FC = () => {
  const modalCtx = useModalContext();
  const {
    brandKits,
    activeBrandKitId,
    saveBrandKit,
    deleteBrandKit,
    applyBrandKitToDeck,
    clearBrandKitFromDeck,
    language,
    triggerToast,
  } = useSlideContext();

  const isOpen = modalCtx.isModalOpen("brandKit");
  const isKo = language === "ko";

  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BrandKit>(() => createEmptyDraft());
  const [previewSlideType, setPreviewSlideType] = useState<"content" | "title">("content");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const preferred =
      brandKits.find((k) => k.id === activeBrandKitId) || brandKits[0] || null;
    if (preferred) {
      setSelectedKitId(preferred.id);
      setDraft({ ...preferred });
    } else {
      setSelectedKitId(null);
      setDraft(createEmptyDraft(STARTER_BRAND_KITS[0]));
    }
  }, [isOpen, brandKits, activeBrandKitId]);

  useEffect(() => {
    if (!isOpen) return;
    if (draft.headingFont) loadGoogleFont(draft.headingFont);
    if (draft.bodyFont) loadGoogleFont(draft.bodyFont);
  }, [isOpen, draft.headingFont, draft.bodyFont]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        modalCtx.closeModal("brandKit");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, modalCtx]);

  if (!isOpen) return null;

  const handleSelectKit = (kit: BrandKit) => {
    setSelectedKitId(kit.id);
    setDraft({ ...kit });
  };

  const handleCreateNew = () => {
    setSelectedKitId(null);
    setDraft(
      createEmptyDraft({
        name: `Brand Kit ${brandKits.length + 1}`,
      })
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setDraft((prev) => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveKitOnly = async () => {
    if (!draft.name.trim()) {
      triggerToast(isKo ? "브랜드 키트 이름을 입력하세요." : "Please enter a Brand Kit name.");
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveBrandKit(draft);
      setSelectedKitId(saved.id);
      setDraft(saved);
      triggerToast(
        isKo
          ? `"${saved.name}" 브랜드 키트가 저장되었습니다.`
          : `Saved Brand Kit "${saved.name}".`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToDeck = async () => {
    if (!draft.name.trim()) {
      triggerToast(isKo ? "브랜드 키트 이름을 입력하세요." : "Please enter a Brand Kit name.");
      return;
    }
    setIsSaving(true);
    try {
      await applyBrandKitToDeck(draft);
      modalCtx.closeModal("brandKit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKit = async (id: string, name: string) => {
    await deleteBrandKit(id);
    if (selectedKitId === id) {
      setSelectedKitId(null);
      setDraft(createEmptyDraft());
    }
    triggerToast(isKo ? `"${name}" 브랜드 키트가 삭제되었습니다.` : `Deleted Brand Kit "${name}".`);
  };

  const isLightPreview = draft.surfaceMode === "light";
  const effectiveHideOnTitle =
    Boolean(draft.hideLogoOnTitleSlide) || draft.logoPosition === "hidden-on-title";
  const showLogoInPreview =
    Boolean(draft.logoUrl?.trim()) &&
    !(previewSlideType === "title" && effectiveHideOnTitle);

  const previewCornerPosition =
    draft.logoPosition === "hidden-on-title" ? "top-right" : draft.logoPosition;

  const logoPositionClass =
    previewCornerPosition === "top-left"
      ? "top-3 left-3.5"
      : previewCornerPosition === "bottom-right"
      ? "bottom-3 right-3.5"
      : "top-3 right-3.5";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => modalCtx.closeModal("brandKit")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Brand Kit Manager"
        className="bg-[#10141e] border border-white/[0.1] rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141925] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white tracking-tight truncate">
              {isKo ? "브랜드 키트 관리자" : "Brand Kit Manager"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {isKo
                ? "기업 컬러, Google 폰트, 로고 워터마크를 저장하고 전체 덱에 일괄 적용합니다."
                : "Configure corporate colors, Google Fonts, and logo watermarks for consistent decks."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => modalCtx.closeModal("brandKit")}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close Brand Kit Manager"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 2-Pane Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Rail: Saved Brand Kits */}
          <aside className="w-full md:w-64 bg-[#0c1018] border-b md:border-b-0 md:border-r border-white/[0.08] p-4 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
            <button
              type="button"
              id="btn-new-brand-kit"
              onClick={handleCreateNew}
              className="w-full py-2 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-blue-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isKo ? "새 브랜드 키트" : "New Brand Kit"}</span>
            </button>

            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-400 px-1">
                {isKo ? `저장된 키트 (${brandKits.length})` : `Saved Kits (${brandKits.length})`}
              </div>

              {brandKits.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-slate-400 leading-relaxed">
                  {isKo
                    ? "저장된 브랜드 키트가 없습니다. 오른쪽에서 설정 후 저장하세요."
                    : "No saved kits yet. Configure your kit on the right and save."}
                </div>
              ) : (
                brandKits.map((kit) => {
                  const isSelected = selectedKitId === kit.id;
                  const isApplied = activeBrandKitId === kit.id;
                  return (
                    <div
                      key={kit.id}
                      onClick={() => handleSelectKit(kit)}
                      className={`group p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500/60 text-white"
                          : "bg-[#121722] border-white/[0.07] hover:border-white/20 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">{kit.name}</span>
                          {isApplied && (
                            <span className="text-[10px] text-emerald-400 font-medium shrink-0">
                              · Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: kit.primaryColor }}
                            title={`Primary: ${kit.primaryColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: kit.secondaryColor }}
                            title={`Secondary: ${kit.secondaryColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-sm border border-white/20"
                            style={{ backgroundColor: kit.accentColor }}
                            title={`Accent: ${kit.accentColor}`}
                          />
                          <span className="text-[10px] text-slate-400 truncate ml-1">
                            {kit.headingFont}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKit(kit.id, kit.name);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer shrink-0"
                        title={isKo ? "삭제" : "Delete Brand Kit"}
                        aria-label={`Delete ${kit.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Starters */}
            <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
              <div className="text-[11px] font-medium text-slate-400 px-1">
                {isKo ? "스타터 프리셋" : "Starter Presets"}
              </div>
              {STARTER_BRAND_KITS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setSelectedKitId(null);
                    setDraft(createEmptyDraft(preset));
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] text-slate-300 truncate">{preset.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right Form & Live Preview */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Kit Name & Surface Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="brand-kit-name-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  {isKo ? "브랜드 키트 이름" : "Brand Kit Name"}
                </label>
                <input
                  id="brand-kit-name-input"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Global Enterprise 2026"
                  className="w-full bg-[#0a0d14] border border-white/[0.12] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isKo ? "캔버스 바탕" : "Slide Surface"}
                </span>
                <div className="flex items-center gap-1 p-1 bg-[#0a0d14] border border-white/[0.1] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, surfaceMode: "dark" }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                      draft.surfaceMode !== "light"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, surfaceMode: "light" }))}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                      draft.surfaceMode === "light"
                        ? "bg-white text-slate-900"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>

            {/* Color Tokens: Primary / Secondary / Accent */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>{isKo ? "브랜드 컬러 토큰 (Hex)" : "Brand Color Tokens"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { key: "primaryColor", label: isKo ? "Primary 컬러" : "Primary Color" },
                    { key: "secondaryColor", label: isKo ? "Secondary 컬러" : "Secondary Color" },
                    { key: "accentColor", label: isKo ? "Accent 컬러" : "Accent Color" },
                  ] as const
                ).map((item) => {
                  const val = draft[item.key];
                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#0b0f18] border border-white/[0.08] space-y-2"
                    >
                      <span className="text-[11px] font-medium text-slate-400 block">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          aria-label={item.label}
                          value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : "#1E40AF"}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.key]: e.target.value.toUpperCase(),
                            }))
                          }
                          className="w-8 h-8 rounded border border-white/15 bg-transparent cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, [item.key]: e.target.value }))
                          }
                          placeholder="#1E40AF"
                          className="flex-1 min-w-0 bg-[#121724] border border-white/[0.1] focus:border-blue-500 rounded-md px-2.5 py-1.5 text-xs font-mono tabular-nums text-white outline-none uppercase"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Fonts: Heading & Body */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Type className="w-3.5 h-3.5 text-blue-400" />
                <span>{isKo ? "Google Fonts 타이포그래피" : "Google Fonts Pairing"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0b0f18] border border-white/[0.08] space-y-1.5">
                  <label
                    htmlFor="brand-heading-font"
                    className="text-[11px] font-medium text-slate-400 block"
                  >
                    {isKo ? "제목 (Heading) 폰트" : "Heading Google Font"}
                  </label>
                  <select
                    id="brand-heading-font"
                    value={draft.headingFont}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, headingFont: e.target.value }))
                    }
                    className="w-full bg-[#121724] border border-white/[0.1] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    {CURATED_GOOGLE_FONTS.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.family} ({f.note})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#0b0f18] border border-white/[0.08] space-y-1.5">
                  <label
                    htmlFor="brand-body-font"
                    className="text-[11px] font-medium text-slate-400 block"
                  >
                    {isKo ? "본문 (Body) 폰트" : "Body Google Font"}
                  </label>
                  <select
                    id="brand-body-font"
                    value={draft.bodyFont}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, bodyFont: e.target.value }))
                    }
                    className="w-full bg-[#121724] border border-white/[0.1] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    {CURATED_GOOGLE_FONTS.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.family} ({f.note})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Brand Logo Upload/URL & Placement */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{isKo ? "브랜드 로고 및 워터마크 위치" : "Brand Logo & Watermark Position"}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0b0f18] border border-white/[0.08] space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="w-24 h-12 rounded-lg bg-[#131926] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0 px-2">
                    {draft.logoUrl ? (
                      <img
                        src={draft.logoUrl}
                        alt="Brand logo preview"
                        className="max-h-9 max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500">No Logo</span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      value={draft.logoUrl || ""}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, logoUrl: e.target.value }))
                      }
                      placeholder={
                        isKo
                          ? "로고 이미지 URL 입력 또는 파일 업로드..."
                          : "Paste logo image URL or upload file..."
                      }
                      className="flex-1 bg-[#121724] border border-white/[0.1] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isKo ? "업로드" : "Upload"}</span>
                    </button>
                    {draft.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, logoUrl: "" }))}
                        className="px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 cursor-pointer shrink-0"
                        title="Remove logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Position Segmented Control */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#121724] border border-white/[0.08] rounded-lg">
                    {POSITION_OPTIONS.map((opt) => {
                      const active = draft.logoPosition === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              logoPosition: opt.id,
                              hideLogoOnTitleSlide:
                                opt.id === "hidden-on-title"
                                  ? true
                                  : prev.hideLogoOnTitleSlide,
                            }))
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {isKo ? opt.labelKo : opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {draft.logoPosition !== "hidden-on-title" && (
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.hideLogoOnTitleSlide)}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            hideLogoOnTitleSlide: e.target.checked,
                          }))
                        }
                        className="rounded border-white/20 bg-slate-900 accent-blue-500 cursor-pointer"
                      />
                      <span>
                        {isKo ? "표지 슬라이드에서 로고 숨기기" : "Hide on title slides"}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Live Brand Kit Slide Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {isKo ? "실시간 브랜드 적용 미리보기" : "Live Slide Preview"}
                </span>
                <div className="flex items-center gap-1 p-0.5 bg-[#0a0d14] border border-white/[0.08] rounded-md">
                  <button
                    type="button"
                    onClick={() => setPreviewSlideType("content")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition ${
                      previewSlideType === "content"
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Content Slide
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSlideType("title")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition ${
                      previewSlideType === "title"
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Title Slide
                  </button>
                </div>
              </div>

              <div
                className="relative rounded-xl border p-5 overflow-hidden transition-colors"
                style={{
                  backgroundColor: isLightPreview ? "#ffffff" : "#0b1120",
                  borderColor: isLightPreview ? "#e2e8f0" : "#273449",
                  color: isLightPreview ? "#0f172a" : "#f8fafc",
                  fontFamily: formatCssFontFamily(draft.bodyFont),
                }}
              >
                {showLogoInPreview && draft.logoUrl && (
                  <img
                    src={draft.logoUrl}
                    alt="Logo watermark preview"
                    className={`absolute ${logoPositionClass} max-h-6 max-w-[110px] object-contain opacity-90 pointer-events-none`}
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: draft.primaryColor }}
                  />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: isLightPreview ? "#475569" : "#94a3b8" }}
                  >
                    {previewSlideType === "title" ? "Executive Cover" : "Strategic Summary"}
                  </span>
                </div>

                <h4
                  className="text-lg font-bold tracking-tight"
                  style={{ fontFamily: formatCssFontFamily(draft.headingFont) }}
                >
                  {draft.name || "Corporate Presentation"} — Q4 Roadmap
                </h4>
                <p
                  className="text-xs mt-1 max-w-xl"
                  style={{ color: isLightPreview ? "#475569" : "#94a3b8" }}
                >
                  Heading uses {draft.headingFont}; body copy and data cards render in {draft.bodyFont}.
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-4">
                  {[
                    { label: "Revenue Growth", val: "+34%", bar: draft.primaryColor },
                    { label: "Enterprise SLA", val: "99.9%", bar: draft.secondaryColor },
                    { label: "Target Velocity", val: "2.4x", bar: draft.accentColor },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="p-2.5 rounded-lg border"
                      style={{
                        backgroundColor: isLightPreview ? "#f8fafc" : "#151d2e",
                        borderColor: isLightPreview ? "#e2e8f0" : "#273449",
                      }}
                    >
                      <div className="w-7 h-1 rounded-full mb-1.5" style={{ backgroundColor: card.bar }} />
                      <div
                        className="text-sm font-bold tabular-nums"
                        style={{ fontFamily: formatCssFontFamily(draft.headingFont) }}
                      >
                        {card.val}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: isLightPreview ? "#475569" : "#94a3b8" }}
                      >
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141925] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {activeBrandKitId && (
              <button
                type="button"
                onClick={() => {
                  clearBrandKitFromDeck();
                  modalCtx.closeModal("brandKit");
                }}
                className="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isKo ? "브랜드 적용 해제" : "Clear Active Brand"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => modalCtx.closeModal("brandKit")}
              className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.08] transition cursor-pointer whitespace-nowrap"
            >
              {isKo ? "닫기" : "Cancel"}
            </button>

            <button
              type="button"
              id="btn-save-brand-kit"
              disabled={isSaving}
              onClick={handleSaveKitOnly}
              className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isKo ? "키트 저장" : "Save Kit"}
            </button>

            <button
              type="button"
              id="btn-apply-brand-kit-to-deck"
              disabled={isSaving}
              onClick={handleApplyToDeck}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isKo ? "덱 전체에 적용" : "Apply Brand Kit to Deck"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
