import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Check,
  Cloud,
  RefreshCw,
  PanelLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  Users,
  Globe,
  Sliders,
  Palette,
} from "lucide-react";
import { useCollabContext } from "../context/CollabContext";
import { Language, PresentationTheme, SlideData, DriveSyncConfig, SlideLayout, SlideTransition } from "../types";
import { PRESENTATION_THEMES } from "../data/themes";
import { SLIDE_LAYOUT_OPTIONS, SLIDE_TRANSITION_OPTIONS } from "./SlideEditor";
import { useSlideContext } from "../context/SlideContext";
import { useModalContext } from "../context/ModalContext";

export interface NavbarProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  currentTheme?: PresentationTheme;
  previewTheme?: PresentationTheme | null;
  onThemeChange?: (theme: PresentationTheme) => void;
  onThemePreview?: (theme: PresentationTheme | null) => void;
  onStartPresentation?: () => void;
  onOpenBatchTranslate?: () => void;
  onPrint?: () => void;
  onOpenPdfExport?: () => void;
  onExportPptx?: () => void;
  onShare?: () => void;
  onExportJson?: () => void;
  onImportJson?: (slides: SlideData[]) => void;
  onCreateNewDeck?: () => void;
  onResetDeck?: () => void;
  onApplySuggestion?: () => void;
  totalSlides?: number;
  activeSlideIndex?: number;
  onAddSlide?: () => void;
  onDuplicateSlide?: (index: number) => void;
  onDeleteSlide?: (index: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenHistory?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDriveSync?: () => void;
  onOpenAiImport?: () => void;
  onOpenThemeRecommender?: () => void;
  driveSyncConfig?: DriveSyncConfig;
  isSyncingDrive?: boolean;
  pastCount?: number;
  futureCount?: number;
  // Panel Toggles
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  // Zoom
  canvasZoom?: number;
  onZoomChange?: (zoom: number | ((prev: number) => number)) => void;
  // Save status
  saveStatus?: "saved" | "saving" | "error";
  lastSavedAt?: Date;
  // Dynamic layouts/transitions & action callbacks
  activeSlide?: SlideData | null;
  onLayoutChange?: (layout: SlideLayout) => void;
  onTransitionChange?: (transition: SlideTransition) => void;
  onAutoSelectLayout?: () => void;
  onApplyTransitionToAll?: () => void;
}

type MenuType = "file" | "edit" | "slide" | "ai" | "view" | "theme" | "language" | "help" | null;

export const Navbar: React.FC<NavbarProps> = (props) => {
  const slideCtx = useSlideContext();
  const modalCtx = useModalContext();
  const collab = useCollabContext();

  const language = props.language ?? slideCtx.language;
  const onLanguageChange = props.onLanguageChange ?? slideCtx.setLanguage;
  const currentTheme = props.currentTheme ?? slideCtx.currentTheme;
  const previewTheme = props.previewTheme !== undefined ? props.previewTheme : slideCtx.previewTheme;
  const onThemeChange = props.onThemeChange ?? slideCtx.setCurrentTheme;
  const onThemePreview = props.onThemePreview ?? slideCtx.setPreviewTheme;

  const onStartPresentation = props.onStartPresentation || (() => modalCtx.openModal("presentation"));
  const onOpenBatchTranslate = props.onOpenBatchTranslate || (() => modalCtx.openModal("batchTranslate"));
  const onPrint = props.onPrint || slideCtx.handlePrint;
  const onOpenPdfExport = props.onOpenPdfExport || (() => modalCtx.openModal("pdfExport"));
  const onExportPptx = props.onExportPptx || slideCtx.handleExportPptx;
  const onShare = props.onShare || slideCtx.handleShare;
  const onExportJson = props.onExportJson || slideCtx.handleExportJson;
  const onImportJson = props.onImportJson || slideCtx.handleImportJson;
  const onCreateNewDeck = props.onCreateNewDeck || slideCtx.handleResetDeck;
  const onResetDeck = props.onResetDeck || slideCtx.handleResetDeck;
  const onApplySuggestion = props.onApplySuggestion || (() => slideCtx.handleApplySuggestion(slideCtx.activeSlide));

  const totalSlides = props.totalSlides ?? slideCtx.slides.length;
  const activeSlideIndex = props.activeSlideIndex ?? slideCtx.activeSlideIndex;
  const onAddSlide = props.onAddSlide || (() => modalCtx.openModal("addSlide"));
  const onDuplicateSlide = props.onDuplicateSlide || slideCtx.handleDuplicateSlide;
  const onDeleteSlide = props.onDeleteSlide || slideCtx.handleDeleteSlide;

  const canUndo = props.canUndo !== undefined ? props.canUndo : slideCtx.canUndo;
  const canRedo = props.canRedo !== undefined ? props.canRedo : slideCtx.canRedo;
  const onUndo = props.onUndo || slideCtx.handleManualUndo;
  const onRedo = props.onRedo || slideCtx.handleManualRedo;

  const onOpenHistory = props.onOpenHistory || (() => modalCtx.openModal("history"));
  const onOpenShortcuts = props.onOpenShortcuts || (() => modalCtx.openModal("shortcuts"));
  const onOpenDriveSync = props.onOpenDriveSync || (() => modalCtx.openModal("drive"));
  const onOpenAiImport = props.onOpenAiImport || (() => modalCtx.openModal("aiImport"));
  const onOpenThemeRecommender = props.onOpenThemeRecommender || (() => modalCtx.openModal("themeRecommender"));

  const driveSyncConfig = props.driveSyncConfig ?? slideCtx.driveSyncConfig;
  const isSyncingDrive = props.isSyncingDrive !== undefined ? props.isSyncingDrive : slideCtx.isSyncingDrive;
  const pastCount = props.pastCount ?? slideCtx.pastCount;
  const futureCount = props.futureCount ?? slideCtx.futureCount;

  const showLeftPanel = props.showLeftPanel;
  const onToggleLeftPanel = props.onToggleLeftPanel;
  const canvasZoom = props.canvasZoom ?? slideCtx.canvasZoom;
  const onZoomChange = props.onZoomChange ?? slideCtx.setCanvasZoom;
  const saveStatus = props.saveStatus ?? slideCtx.saveStatus;
  const lastSavedAt = props.lastSavedAt ?? slideCtx.lastSavedAt;

  const activeSlide = props.activeSlide !== undefined ? props.activeSlide : slideCtx.activeSlide;
  const onLayoutChange = props.onLayoutChange || slideCtx.handleLayoutChange;
  const onTransitionChange = props.onTransitionChange || slideCtx.handleTransitionChange;
  const onAutoSelectLayout = props.onAutoSelectLayout || slideCtx.handleAutoSelectLayout;
  const onApplyTransitionToAll = props.onApplyTransitionToAll || slideCtx.handleApplyTransitionToAll;

  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (menu: MenuType) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: MenuType) => {
    if (openMenu !== null) {
      setOpenMenu(menu);
    }
  };

  const closeAndRun = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportJson(parsed);
        }
      } catch (err) {
        console.error("JSON Import error:", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <header
      ref={menuBarRef}
      className="h-10 bg-[#0b0d11] border-b border-white/[0.08] flex items-center justify-between px-3 text-xs select-none relative z-50 text-slate-300"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".json"
        className="hidden"
      />

      {/* Left: App Logo & VS Code Style Text Menus */}
      <div className="flex items-center space-x-0.5">
        {/* App Title */}
        <div className="flex items-center space-x-2 px-3 py-1 text-slate-200 font-semibold text-xs tracking-tight mr-1 border-r border-white/[0.08]">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
          <span>AI Slide Builder</span>
        </div>

        {/* File Menu */}
        <div className="relative">
          <button
            id="nav-menu-file"
            onClick={() => handleMenuClick("file")}
            onMouseEnter={() => handleMenuHover("file")}
            className={`px-2.5 py-1 rounded-md hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer ${
              openMenu === "file" ? "bg-white/[0.08] text-white" : ""
            }`}
          >
            File
          </button>
          {openMenu === "file" && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-[#151921] border border-white/[0.1] rounded-lg shadow-2xl py-1 z-50 text-slate-300 font-sans animate-fadeIn">
              <button
                onClick={() => closeAndRun(onCreateNewDeck)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>New Presentation</span>
              </button>
              <button
                onClick={() => closeAndRun(onExportJson)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Save / Backup JSON</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-200 font-mono">Ctrl+S</span>
              </button>
              <button
                onClick={() => {
                  setOpenMenu(null);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Open JSON...</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-200 font-mono">Ctrl+O</span>
              </button>

              <button
                onClick={() => closeAndRun(onOpenAiImport || (() => {}))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Import Document via AI...</span>
                <span className="text-[10px] text-amber-300 font-mono">AI</span>
              </button>

              <div className="my-1 border-t border-white/[0.08]" />

              {onOpenPdfExport && (
                <button
                  onClick={() => closeAndRun(onOpenPdfExport)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
                >
                  <span>Export PDF...</span>
                </button>
              )}
              <button
                id="btn-export-pptx"
                disabled={Boolean(slideCtx.pptxExportProgress)}
                onClick={() => closeAndRun(onExportPptx)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="whitespace-nowrap">Export as PowerPoint (.pptx)</span>
                <span className="text-[10px] text-orange-300 font-mono">PPTX</span>
              </button>
              <button
                onClick={() => closeAndRun(onPrint)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Print View</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-200 font-mono">Ctrl+P</span>
              </button>

              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("webPublish"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-blue-300 font-medium"
              >
                <span>Publish to Web & Embed...</span>
                <span className="text-[10px] text-blue-400 font-mono">1-Click</span>
              </button>

              <div className="my-1 border-t border-white/[0.08]" />

              {onOpenDriveSync && (
                <button
                  onClick={() => closeAndRun(onOpenDriveSync)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
                >
                  <span>Google Drive Sync...</span>
                  {driveSyncConfig?.isConnected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              )}
              <button
                onClick={() => closeAndRun(onShare)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Copy Share Link</span>
              </button>

              <div className="my-1 border-t border-white/[0.08]" />

              <button
                onClick={() => closeAndRun(onResetDeck)}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 hover:text-rose-200 flex items-center justify-between text-rose-300 group text-xs transition-colors cursor-pointer"
              >
                <span>Reset to Master Plan</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            id="nav-menu-edit"
            onClick={() => handleMenuClick("edit")}
            onMouseEnter={() => handleMenuHover("edit")}
            className={`px-2.5 py-1 rounded-md hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer ${
              openMenu === "edit" ? "bg-white/[0.08] text-white" : ""
            }`}
          >
            Edit
          </button>
          {openMenu === "edit" && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-[#151921] border border-white/[0.1] rounded-lg shadow-2xl py-1 z-50 text-slate-300 font-sans animate-fadeIn">
              <button
                onClick={() => closeAndRun(() => onUndo && onUndo())}
                disabled={!canUndo}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Undo</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-200 font-mono">Ctrl+Z</span>
              </button>
              <button
                onClick={() => closeAndRun(() => onRedo && onRedo())}
                disabled={!canRedo}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Redo</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-200 font-mono">Ctrl+Y</span>
              </button>

              <div className="my-1 border-t border-white/[0.08]" />

              {onOpenHistory && (
                <button
                  onClick={() => closeAndRun(onOpenHistory)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
                >
                  <span>History</span>
                  <span className="text-[10px] text-slate-400 font-mono">({pastCount})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Tools Menu */}
        <div className="relative">
          <button
            id="nav-menu-ai"
            onClick={() => handleMenuClick("ai")}
            onMouseEnter={() => handleMenuHover("ai")}
            className={`px-2.5 py-1 rounded-md hover:bg-white/[0.06] hover:text-white transition-all flex items-center space-x-1 cursor-pointer ${
              openMenu === "ai" ? "bg-white/[0.08] text-white" : ""
            }`}
          >
            <span>AI Tools</span>
          </button>
          {openMenu === "ai" && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#151921] border border-white/[0.1] rounded-lg shadow-2xl py-1 z-50 text-slate-300 font-sans animate-fadeIn">
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("aiPromptBar"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-amber-300 font-medium"
              >
                <span>Universal AI Prompt Launcher...</span>
                <span className="text-[10px] text-amber-400/80 font-mono">⌘K</span>
              </button>
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("ragDiffReview"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-blue-300 font-medium"
              >
                <span>Intranet RAG Auto-Pilot Diff...</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  {slideCtx.ragSuggestions.filter((s) => !s.applied).length > 0
                    ? `${slideCtx.ragSuggestions.filter((s) => !s.applied).length} Patches`
                    : "RAG"}
                </span>
              </button>
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("constitution"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-amber-300 font-medium"
              >
                <span>Design Constitution & Governance...</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  {slideCtx.constitution?.enabled ? "Active" : "Off"}
                </span>
              </button>
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("brandKit"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-sky-300 font-medium"
              >
                <span>Brand Kit & Corporate Styles...</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                  {slideCtx.activeBrandKitId ? "Active" : `${slideCtx.brandKits.length}`}
                </span>
              </button>
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("aiSettings"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>AI Model & Local Ollama Settings...</span>
              </button>
              <button
                onClick={() => closeAndRun(() => modalCtx.openModal("timelineAnimation"))}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer text-violet-300 font-medium"
              >
                <span>Component Animation Timeline...</span>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-mono">Build-In</span>
              </button>
              <div className="my-1 border-t border-white/[0.08]" />
              <button
                onClick={() => closeAndRun(onOpenBatchTranslate)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Batch Translate All Slides...</span>
                <span className="text-[10px] text-blue-300 font-mono">KO↔ID</span>
              </button>
              <button
                onClick={() => closeAndRun(onApplySuggestion)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>Apply AI Improvements</span>
              </button>
              <button
                onClick={() => closeAndRun(onAutoSelectLayout)}
                className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
              >
                <span>AI Recommend Layout</span>
              </button>
              {onOpenThemeRecommender && (
                <button
                  onClick={() => closeAndRun(onOpenThemeRecommender)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
                >
                  <span>AI Recommend Design Theme</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            id="nav-menu-help"
            onClick={() => handleMenuClick("help")}
            onMouseEnter={() => handleMenuHover("help")}
            className={`px-2.5 py-1 rounded-md hover:bg-white/[0.06] hover:text-white transition-all flex items-center space-x-1 cursor-pointer ${
              openMenu === "help" ? "bg-white/[0.08] text-white" : ""
            }`}
          >
            <span>Help</span>
          </button>
          {openMenu === "help" && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#151921] border border-white/[0.1] rounded-lg shadow-2xl py-1 z-50 text-slate-300 font-sans animate-fadeIn">
              {onOpenShortcuts && (
                <button
                  onClick={() => closeAndRun(onOpenShortcuts)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/[0.08] hover:text-white flex items-center justify-between group text-xs transition-colors cursor-pointer"
                >
                  <span>Keyboard Shortcuts</span>
                </button>
              )}
              <div className="my-1 border-t border-white/[0.08]" />
              <div className="px-3 py-1.5 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-200">AI Slide Builder</div>
                <div>v1.0.0 (KIND 2026 Edition)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Slide Position Indicator */}
      <div className="hidden md:flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
        <span>Slide {activeSlideIndex + 1} of {totalSlides}</span>
      </div>

      {/* Right: Quick Action Present Button & Panel Toggles */}
      <div className="flex items-center space-x-1.5">
        {/* Design Constitution Status Badge */}
        {slideCtx.constitution?.enabled && (
          <button
            id="nav-badge-constitution"
            onClick={() => modalCtx.openModal("constitution")}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 rounded-md text-amber-300 hover:text-white transition cursor-pointer text-[11px] font-medium shadow-sm animate-fadeIn whitespace-nowrap shrink-0"
            title={
              slideCtx.constitution.attachedFileName
                ? `⚖️ Constitution Active (${slideCtx.constitution.attachedFileName})`
                : `⚖️ Design Constitution Active: ${slideCtx.constitution.rulesText.slice(0, 80)}`
            }
          >
            <span className="text-xs">⚖️</span>
            <span className="font-semibold tracking-tight">Constitution Active</span>
          </button>
        )}

        {/* RAG Auto-Pilot Diff Pill Badge */}
        {slideCtx.ragSuggestions.filter((s) => !s.applied).length > 0 && (
          <button
            id="nav-btn-rag-diff-pill"
            onClick={() => modalCtx.openModal("ragDiffReview")}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 rounded-md text-blue-300 hover:text-white transition cursor-pointer text-[11px] font-medium shadow-sm animate-pulse"
            title="Intranet RAG Auto-Pilot: 최신 참조 문서와의 수치 차이 검토"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>{slideCtx.ragSuggestions.filter((s) => !s.applied).length} Patches</span>
          </button>
        )}

        {/* Drive Sync Status (Icon only) */}
        {driveSyncConfig && driveSyncConfig.isConnected && (
          <button
            id="nav-btn-drivesync"
            onClick={() => onOpenDriveSync && onOpenDriveSync()}
            className="flex items-center justify-center p-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-md text-emerald-400 transition cursor-pointer relative"
            title={driveSyncConfig.fileName ? `Google Drive: ${driveSyncConfig.fileName}` : "Google Drive Connected"}
            aria-label="Google Drive Sync Status"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
          </button>
        )}

        {/* Save Status Badge (Icon only) */}
        <div
          id="nav-status-save"
          className="flex items-center justify-center p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-md text-slate-300 select-none"
          title={
            saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
              ? lastSavedAt
                ? `Saved (${new Date(lastSavedAt).toLocaleTimeString()})`
                : "Saved"
              : "Save Error"
          }
          aria-label="Save Status"
        >
          {saveStatus === "saving" && (
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          )}
          {saveStatus === "saved" && (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {saveStatus === "error" && (
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>

        <div className="w-px h-3.5 bg-white/[0.08] mx-0.5" />

        {/* Screen Zoom & Canvas Controls */}
        <div className="flex items-center space-x-0.5 bg-white/[0.04] border border-white/[0.08] rounded-md px-1 py-0.5 text-xs text-slate-300 font-mono select-none">
          <button
            type="button"
            id="btn-zoom-out"
            onClick={() => {
              slideCtx.setIsAutoFit(false);
              onZoomChange((z: number) => Math.max(z - 10, 50));
            }}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white rounded transition cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id="btn-zoom-reset"
            onClick={() => {
              slideCtx.setIsAutoFit(false);
              onZoomChange(100);
            }}
            className="px-1.5 py-0.5 hover:bg-white/[0.08] rounded text-[11px] text-slate-300 hover:text-white transition cursor-pointer text-center min-w-[38px] tabular-nums"
            title="Reset to 100%"
            aria-label="Reset to 100%"
          >
            {canvasZoom}%
          </button>

          <button
            type="button"
            id="btn-zoom-in"
            onClick={() => {
              slideCtx.setIsAutoFit(false);
              onZoomChange((z: number) => Math.min(z + 10, 140));
            }}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white rounded transition cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3 bg-white/[0.08] mx-0.5" />

          <button
            type="button"
            id="btn-auto-fit"
            onClick={() => {
              slideCtx.setIsAutoFit(true);
              slideCtx.recalculateAutoFit();
              slideCtx.triggerToast(
                language === "ko" ? "화면 맞춤(Auto Fit) 활성화" : "Fit to Screen Enabled"
              );
            }}
            className={`px-1.5 py-0.5 flex items-center space-x-1 rounded text-[11px] transition cursor-pointer ${
              slideCtx.isAutoFit
                ? "bg-blue-600/30 text-blue-300 font-medium border border-blue-500/30"
                : "hover:bg-white/[0.08] text-slate-400 hover:text-white"
            }`}
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize className="w-3 h-3" />
            <span className="hidden sm:inline">Fit</span>
          </button>
        </div>

        <div className="w-px h-3.5 bg-white/[0.08] mx-0.5" />

        {/* Toggle Left Sidebar (Icon only) */}
        <button
          id="nav-btn-toggle-left-panel"
          onClick={onToggleLeftPanel}
          className={`p-1.5 rounded-md hover:bg-white/[0.08] transition cursor-pointer ${
            showLeftPanel ? "text-blue-400 bg-white/[0.08]" : "text-slate-400 hover:text-white"
          }`}
          title="Toggle Left Panel"
          aria-label="Toggle Left Panel"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Live Real-Time Collaboration Presence Indicator */}
        <button
          id="nav-btn-collab"
          onClick={() => modalCtx.openModal("collab")}
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer ${
            collab.isConnected
              ? "bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300"
              : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-400"
          }`}
          title={`실시간 다자 협업 (Room: ${collab.roomId}, ${collab.users.length + 1}명 접속 중). 클릭하여 협업 설정.`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${collab.isConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live</span>
          <span>({collab.users.length + 1})</span>
        </button>

        {/* Quick Brand Kit Manager Button */}
        <button
          id="nav-btn-brand-kit"
          onClick={() => modalCtx.openModal("brandKit")}
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer whitespace-nowrap shrink-0 ${
            slideCtx.activeBrandKitId
              ? "bg-sky-950/50 hover:bg-sky-900/60 border-sky-500/40 text-sky-300"
              : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white"
          }`}
          title="Brand Kit Manager (Colors, Google Fonts & Logo Watermark)"
          aria-label="Brand Kit Manager"
        >
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Brand Kit</span>
        </button>

        {/* Quick Web Publish & Embed Button */}
        <button
          id="nav-btn-publish"
          onClick={() => modalCtx.openModal("webPublish")}
          className="p-1.5 rounded-md hover:bg-white/[0.08] text-blue-400 hover:text-blue-300 transition cursor-pointer border border-blue-500/30 bg-blue-950/30"
          title="Publish to Web & Embed..."
          aria-label="Publish to Web & Embed"
        >
          <Globe className="w-3.5 h-3.5" />
        </button>

        {/* Quick Animation Timeline Button */}
        <button
          id="nav-btn-timeline"
          onClick={() => modalCtx.openModal("timelineAnimation")}
          className="p-1.5 rounded-md hover:bg-white/[0.08] text-violet-400 hover:text-violet-300 transition cursor-pointer border border-violet-500/30 bg-violet-950/30"
          title="Slide Component Animation & Timeline"
          aria-label="Slide Component Animation & Timeline"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Start Presentation Button (Icon only, 1 Function 1 Button) */}
        <button
          id="nav-btn-start-presentation"
          onClick={onStartPresentation}
          className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm cursor-pointer"
          title="Start Presentation (F5)"
          aria-label="Start Presentation (F5)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </header>
  );
};
