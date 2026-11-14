import React, { useState, useEffect } from "react";
import {
  Cloud,
  FileText,
  RefreshCw,
  AlertCircle,
  Search,
  ExternalLink,
  Sliders,
  History,
  FileCode,
  Link2,
  X,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react";
import {
  DriveFileItem,
  DriveSyncConfig,
  DriveSyncLog,
  Language,
  SlideData,
} from "../types";
import {
  fetchDriveFileContent,
  fetchDriveFileMetadata,
  listDriveFiles,
  parseAndSyncSlideContent,
  requestGoogleDriveAccessToken,
  saveDriveSyncConfig,
  addDriveSyncLog,
  loadDriveSyncLogs,
} from "../utils/googleDriveSync";
import { useModalContext } from "../context/ModalContext";

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: DriveSyncConfig;
  onUpdateSyncConfig: (config: DriveSyncConfig) => void;
  currentSlides: SlideData[];
  onApplySyncedSlides: (newSlides: SlideData[], sourceFileName: string) => void;
  language: Language;
  onManualSyncTrigger: () => Promise<void>;
  isSyncingNow: boolean;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  currentSlides,
  onApplySyncedSlides,
  onManualSyncTrigger,
  isSyncingNow,
}) => {
  const modalCtx = useModalContext();
  const [activeTab, setActiveTab] = useState<"browse" | "settings" | "logs" | "preview">("browse");
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manualFileIdInput, setManualFileIdInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<DriveSyncLog[]>([]);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "md" | "txt" | "json" | "doc">("all");

  useEffect(() => {
    if (isOpen) {
      setSyncLogs(loadDriveSyncLogs());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && syncConfig.isConnected && syncConfig.accessToken) {
      fetchFiles();
    }
  }, [isOpen, syncConfig.isConnected, syncConfig.accessToken]);

  const fetchFiles = async (query = searchQuery) => {
    if (!syncConfig.accessToken) return;
    setLoadingFiles(true);
    setAuthError(null);
    try {
      const files = await listDriveFiles(syncConfig.accessToken, query);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Failed to list files:", err);
      setAuthError(err?.message || "구글 드라이브 파일 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setAuthError(null);
    try {
      const { accessToken, expiresIn } = await requestGoogleDriveAccessToken();
      const newConfig: DriveSyncConfig = {
        ...syncConfig,
        isConnected: true,
        accessToken,
        tokenExpiresAt: Date.now() + expiresIn * 1000,
      };
      onUpdateSyncConfig(newConfig);
      saveDriveSyncConfig(newConfig);

      addDriveSyncLog({
        fileName: "구글 드라이브 계정",
        changeDetected: false,
        message: "구글 드라이브 계정 연결 성공",
        status: "success",
      });
      setSyncLogs(loadDriveSyncLogs());
    } catch (err: any) {
      console.error("OAuth connection failed:", err);
      setAuthError(err?.message || "구글 드라이브 인증에 실패했습니다.");
    }
  };

  const handleDisconnect = () => {
    const newConfig: DriveSyncConfig = {
      ...syncConfig,
      isConnected: false,
      accessToken: null,
      tokenExpiresAt: null,
      fileId: null,
      fileName: null,
      fileMimeType: null,
      lastModifiedTime: null,
    };
    onUpdateSyncConfig(newConfig);
    saveDriveSyncConfig(newConfig);
    setDriveFiles([]);

    addDriveSyncLog({
      fileName: "구글 드라이브",
      changeDetected: false,
      message: "구글 드라이브 연결 해제됨",
      status: "pending",
    });
    setSyncLogs(loadDriveSyncLogs());
  };

  const handleSelectFile = async (file: DriveFileItem) => {
    try {
      const newConfig: DriveSyncConfig = {
        ...syncConfig,
        fileId: file.id,
        fileName: file.name,
        fileMimeType: file.mimeType,
        lastModifiedTime: file.modifiedTime,
        lastSyncedAt: Date.now(),
      };
      onUpdateSyncConfig(newConfig);
      saveDriveSyncConfig(newConfig);

      if (syncConfig.accessToken) {
        setLoadingPreview(true);
        const content = await fetchDriveFileContent(file.id, syncConfig.accessToken, file.mimeType);
        setPreviewContent(content);

        const { slides, message } = await parseAndSyncSlideContent(content, file.name, currentSlides);
        onApplySyncedSlides(slides, file.name);

        addDriveSyncLog({
          fileName: file.name,
          changeDetected: true,
          message: `소스 파일 연동 완료: ${message}`,
          status: "success",
          slidesCount: slides.length,
        });
        setSyncLogs(loadDriveSyncLogs());
      }
    } catch (err: any) {
      console.error("File selection sync error:", err);
      setAuthError(err?.message || "파일 연동 및 동기화 중 오류가 발생했습니다.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConnectDirectId = async () => {
    if (!manualFileIdInput.trim() || !syncConfig.accessToken) return;

    let fileId = manualFileIdInput.trim();
    const match = fileId.match(/[-\w]{25,}/);
    if (match) {
      fileId = match[0];
    }

    try {
      setLoadingFiles(true);
      const meta = await fetchDriveFileMetadata(fileId, syncConfig.accessToken);
      await handleSelectFile(meta);
      setManualFileIdInput("");
    } catch (err: any) {
      setAuthError(err?.message || "입력한 파일 ID 또는 링크를 찾을 수 없습니다.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleLoadPreview = async () => {
    if (!syncConfig.fileId || !syncConfig.accessToken) return;
    setLoadingPreview(true);
    try {
      const content = await fetchDriveFileContent(
        syncConfig.fileId,
        syncConfig.accessToken,
        syncConfig.fileMimeType || undefined
      );
      setPreviewContent(content);
    } catch (err) {
      console.error("Preview load failed:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isOpen) return null;

  const filteredFiles = driveFiles.filter((f) => {
    if (filterType === "md") return f.name.endsWith(".md") || f.mimeType.includes("markdown");
    if (filterType === "txt") return f.name.endsWith(".txt") || f.mimeType === "text/plain";
    if (filterType === "json") return f.name.endsWith(".json") || f.mimeType === "application/json";
    if (filterType === "doc") return f.mimeType.includes("google-apps.document") || f.mimeType.includes("presentation");
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            구글 드라이브 동기화
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flat Connection Bar */}
        <div className="px-6 py-3 bg-[#101520] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
          {syncConfig.isConnected ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">연동 파일</span>
                <span className="font-medium text-sky-300">
                  {syncConfig.fileName || "선택된 파일 없음"}
                </span>
              </div>

              {syncConfig.fileName && (
                <button
                  type="button"
                  onClick={onManualSyncTrigger}
                  disabled={isSyncingNow}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? "animate-spin" : ""}`} />
                  <span>{isSyncingNow ? "동기화 중..." : "지금 동기화"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  modalCtx.openModal("ragDiffReview");
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-sky-300 font-medium transition cursor-pointer"
              >
                참조 문서 비교 분석
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-slate-300">
              <span>구글 드라이브 문서를 연결해 실시간으로 슬라이드에 반영할 수 있습니다.</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  modalCtx.openModal("ragDiffReview");
                }}
                className="text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
              >
                참조 문서 비교
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {syncConfig.isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 transition cursor-pointer"
              >
                연결 해제
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>구글 드라이브 연결</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="px-6 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-rose-300 hover:text-white cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 border-b border-white/[0.08] flex items-center space-x-2 bg-[#0d121d]">
          <button
            type="button"
            onClick={() => setActiveTab("browse")}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "browse"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>파일 탐색</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "settings"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>자동 동기화 설정</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("preview");
              handleLoadPreview();
            }}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "preview"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>원본 미리보기</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("logs");
              setSyncLogs(loadDriveSyncLogs());
            }}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === "logs"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>동기화 기록 ({syncLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents (No box-in-box) */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[360px] text-xs">
          {activeTab === "browse" && (
            <div className="space-y-4">
              {!syncConfig.isConnected ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Cloud className="w-8 h-8 text-sky-400" />
                  <h4 className="text-sm font-medium text-white">구글 드라이브 계정을 연결하세요</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    드라이브에 저장된 발표 대본, 마크다운 문서, 슬라이드 초안을 선택해 자동으로 동기화할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
                  >
                    계정 연결하기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Direct Link / ID Input */}
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={manualFileIdInput}
                        onChange={(e) => setManualFileIdInput(e.target.value)}
                        placeholder="구글 드라이브 공유 링크 또는 파일 ID 입력..."
                        className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectDirectId}
                      disabled={!manualFileIdInput.trim() || loadingFiles}
                      className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      직접 연동
                    </button>
                  </div>

                  {/* Search & Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchFiles(searchQuery)}
                        placeholder="파일명 검색..."
                        className="w-full pl-9 pr-3 py-1.5 bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center space-x-1 text-[11px]">
                      {[
                        { id: "all", label: "전체" },
                        { id: "md", label: ".md" },
                        { id: "txt", label: ".txt" },
                        { id: "json", label: ".json" },
                        { id: "doc", label: "문서" },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setFilterType(item.id as typeof filterType)}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            filterType === item.id
                              ? "bg-sky-500 text-slate-950 font-semibold"
                              : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchFiles(searchQuery)}
                      disabled={loadingFiles}
                      className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 transition cursor-pointer"
                      title="새로고침"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* Flat File List */}
                  {loadingFiles ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                      <span>파일 목록을 불러오는 중입니다...</span>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      일치하는 파일이 없습니다. 상단 입력란에 파일 ID를 직접 입력할 수도 있습니다.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {filteredFiles.map((file) => {
                        const isSelected = syncConfig.fileId === file.id;

                        return (
                          <div
                            key={file.id}
                            className={`py-3 px-2 flex items-center justify-between gap-3 rounded-lg transition ${
                              isSelected ? "bg-sky-500/10" : "hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {file.mimeType.includes("markdown") || file.name.endsWith(".md") ? (
                                <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
                              ) : file.mimeType.includes("sheet") || file.name.endsWith(".csv") ? (
                                <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate" title={file.name}>
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                                  수정: {new Date(file.modifiedTime).toLocaleDateString()}{" "}
                                  {new Date(file.modifiedTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {file.size ? ` · ${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : ""}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center space-x-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                                  title="새 탭에서 열기"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {isSelected ? (
                                <span className="text-xs font-medium text-sky-300 px-2">연동 중</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectFile(file)}
                                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                                >
                                  연동하기
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 divide-y divide-white/[0.08]">
              <div className="pb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">실시간 자동 동기화</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    드라이브 문서가 수정되면 변경사항을 감지해 슬라이드에 반영합니다.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSync}
                    onChange={(e) => {
                      const updated = { ...syncConfig, autoSync: e.target.checked };
                      onUpdateSyncConfig(updated);
                      saveDriveSyncConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
                </label>
              </div>

              <div className="pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-white">변경 감지 주기</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      문서 수정 시각을 확인하는 간격입니다.
                    </div>
                  </div>
                  <span className="text-xs font-mono text-sky-300 tabular-nums">
                    {syncConfig.intervalSeconds}초 간격
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 30, 60].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => {
                        const updated = { ...syncConfig, intervalSeconds: sec };
                        onUpdateSyncConfig(updated);
                        saveDriveSyncConfig(updated);
                      }}
                      className={`py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        syncConfig.intervalSeconds === sec
                          ? "bg-sky-500/15 text-white border-sky-400/60"
                          : "bg-[#0b101b] hover:border-sky-400/30 text-slate-300 border-white/10"
                      }`}
                    >
                      {sec}초
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-white">변경사항 반영 방식</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    수정이 감지되었을 때 반영 방법을 선택합니다.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...syncConfig, syncMode: "auto-apply" as const };
                      onUpdateSyncConfig(updated);
                      saveDriveSyncConfig(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      syncConfig.syncMode === "auto-apply"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] hover:border-sky-400/30 border-white/10 text-slate-400"
                    }`}
                  >
                    <div className="font-medium text-xs text-white">자동 즉시 반영</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      파일 저장 시 즉시 분석하여 슬라이드를 갱신합니다.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...syncConfig, syncMode: "prompt" as const };
                      onUpdateSyncConfig(updated);
                      saveDriveSyncConfig(updated);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      syncConfig.syncMode === "prompt"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] hover:border-sky-400/30 border-white/10 text-slate-400"
                    }`}
                  >
                    <div className="font-medium text-xs text-white">알림 후 반영</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      알림이 표시되면 사용자가 확인 후 반영합니다.
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  연동 파일 <strong className="text-white ml-1">{syncConfig.fileName || "없음"}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleLoadPreview}
                  disabled={loadingPreview || !syncConfig.fileId}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-xs text-slate-300 transition disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingPreview ? "animate-spin" : ""}`} />
                  <span>다시 불러오기</span>
                </button>
              </div>

              {loadingPreview ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                  <span>최신 내용을 불러오는 중입니다...</span>
                </div>
              ) : (
                <pre className="p-4 bg-[#0b101b] rounded-xl border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto max-h-[340px] whitespace-pre-wrap leading-relaxed">
                  {previewContent || "연동된 파일의 원본 내용이 여기에 표시됩니다."}
                </pre>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/[0.08]">
                <span>최근 동기화 기록</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("kind_2026_drive_sync_logs");
                    setSyncLogs([]);
                  }}
                  className="text-slate-400 hover:text-rose-300 transition cursor-pointer"
                >
                  기록 비우기
                </button>
              </div>

              {syncLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  기록된 동기화 내역이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] max-h-[340px] overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{log.fileName}</span>
                          {log.slidesCount !== undefined && (
                            <span className="text-[11px] text-sky-300">
                              {log.slidesCount}장 반영
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{log.message}</p>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono shrink-0 tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141b29] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {syncConfig.autoSync ? `자동 감지 활성 · ${syncConfig.intervalSeconds}초 간격` : "수동 동기화"}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
