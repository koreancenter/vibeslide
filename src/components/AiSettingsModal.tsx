import React, { useState, useEffect } from "react";
import {
  Cpu,
  Cloud,
  Shield,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  RefreshCw,
  UploadCloud,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import {
  loadAiModelConfig,
  saveAiModelConfig,
  DEFAULT_AI_CONFIG,
  TONE_PRESETS,
} from "../utils/aiModelConfig";
import { testOllamaConnection } from "../utils/api";
import { AiModelConfig, AiProviderType, DesignConstitution } from "../types";
import {
  DEFAULT_DESIGN_CONSTITUTION,
  processConstitutionReferenceFile,
} from "../utils/constitution";

export const AiSettingsModal: React.FC = () => {
  const modalCtx = useModalContext();
  const slideCtx = useSlideContext();

  const isOpen = modalCtx.isModalOpen("aiSettings");

  const [activeTab, setActiveTab] = useState<"engine" | "constitution">("engine");
  const [config, setConfig] = useState<AiModelConfig>(loadAiModelConfig());
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [localConstitution, setLocalConstitution] = useState<DesignConstitution>(
    slideCtx.constitution || DEFAULT_DESIGN_CONSTITUTION
  );
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const constitutionFileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(loadAiModelConfig());
      setLocalConstitution(slideCtx.constitution || DEFAULT_DESIGN_CONSTITUTION);
      setTestResult(null);
      setIsExtractingFile(false);
      setIsDraggingFile(false);
    }
  }, [isOpen, slideCtx.constitution]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiProviderType) => {
    setConfig((prev) => ({
      ...prev,
      provider,
      modelName:
        provider === "local-ollama"
          ? "llama3.2"
          : provider === "gemini-cloud"
          ? "gemini-3.8-flash"
          : "offline-rule",
    }));
    setTestResult(null);
  };

  const handleTestLocalConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const result = await testOllamaConnection(
        config.localEndpoint || "http://localhost:11434",
        config.modelName || "llama3.2"
      );
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `연결 테스트 오류: ${err?.message || "네트워크 오류"}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConstitutionFile = async (file: File) => {
    setIsExtractingFile(true);
    try {
      const result = await processConstitutionReferenceFile(file);
      setLocalConstitution((prev) => ({
        ...prev,
        rulesText: result.rulesText || prev.rulesText,
        attachedFileName: result.fileName || file.name,
      }));
      slideCtx.triggerToast(`"${file.name}"에서 스타일 규칙이 추출되었습니다.`);
    } catch (err: any) {
      slideCtx.triggerToast(err?.message || "파일 처리 중 오류가 발생했습니다.");
    } finally {
      setIsExtractingFile(false);
      if (constitutionFileRef.current) constitutionFileRef.current.value = "";
    }
  };

  const handleSave = () => {
    saveAiModelConfig(config);
    slideCtx.updateConstitution({
      enabled: localConstitution.enabled,
      rulesText: localConstitution.rulesText.trim(),
      attachedFileName: localConstitution.attachedFileName,
    });
    slideCtx.triggerToast("AI 엔진 및 디자인 헌법 설정이 저장되었습니다.");
    modalCtx.closeModal("aiSettings");
  };

  const handleReset = () => {
    if (activeTab === "engine") {
      setConfig(DEFAULT_AI_CONFIG);
      saveAiModelConfig(DEFAULT_AI_CONFIG);
      slideCtx.triggerToast("AI 엔진 설정이 기본값으로 초기화되었습니다.");
      setTestResult(null);
    } else {
      setLocalConstitution(DEFAULT_DESIGN_CONSTITUTION);
      slideCtx.triggerToast("디자인 헌법이 기본값으로 초기화되었습니다.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => modalCtx.closeModal("aiSettings")}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 bg-[#141b29] border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            AI 엔진 및 디자인 헌법 설정
          </h3>
          <button
            type="button"
            onClick={() => modalCtx.closeModal("aiSettings")}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-[#0d121d] px-6">
          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`py-3 px-4 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "engine"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            AI 엔진 및 모델
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("constitution")}
            className={`py-3 px-4 text-xs font-medium transition cursor-pointer border-b-2 ${
              activeTab === "constitution"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            디자인 헌법
          </button>
        </div>

        {/* Content Body (No box-in-box) */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-xs">
          {activeTab === "engine" ? (
            <div className="space-y-6 divide-y divide-white/[0.08]">
              {/* Provider Selection */}
              <div className="pb-5 space-y-3">
                <label className="block text-xs font-medium text-sky-300">
                  AI 실행 공급자
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleProviderChange("gemini-cloud")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.provider === "gemini-cloud"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] border-white/10 hover:border-sky-400/30 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Cloud className="w-4 h-4 text-sky-400" />
                      {config.provider === "gemini-cloud" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white">제미나이 클라우드</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">구글 클라우드 API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderChange("local-ollama")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.provider === "local-ollama"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] border-white/10 hover:border-sky-400/30 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Shield className="w-4 h-4 text-sky-400" />
                      {config.provider === "local-ollama" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white">로컬 프라이빗</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">사내 로컬 엔드포인트</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderChange("offline-rule")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.provider === "offline-rule"
                        ? "bg-sky-500/15 border-sky-400/60 text-white"
                        : "bg-[#0b101b] border-white/10 hover:border-sky-400/30 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <HardDrive className="w-4 h-4 text-sky-400" />
                      {config.provider === "offline-rule" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white">오프라인 규칙</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">내장 사전 및 규칙 기반</div>
                  </button>
                </div>

                {/* Local Ollama Inline Config (no extra outer box) */}
                {config.provider === "local-ollama" && (
                  <div className="pt-4 space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">엔드포인트 주소</label>
                      <input
                        type="text"
                        value={config.localEndpoint || "http://localhost:11434"}
                        onChange={(e) => setConfig({ ...config, localEndpoint: e.target.value })}
                        placeholder="http://localhost:11434"
                        className="w-full px-3 py-2 bg-[#0b101b] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">로컬 모델명</label>
                      <input
                        type="text"
                        value={config.modelName || "llama3.2"}
                        onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                        placeholder="llama3.2"
                        className="w-full px-3 py-2 bg-[#0b101b] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestLocalConnection}
                        disabled={testingConnection}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {testingConnection ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5" />
                        )}
                        <span>연결 테스트</span>
                      </button>

                      {testResult && (
                        <div
                          className={`text-xs flex items-center gap-1.5 ${
                            testResult.ok ? "text-sky-300" : "text-rose-400"
                          }`}
                        >
                          {testResult.ok ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {config.provider === "gemini-cloud" && (
                  <p className="text-[11px] text-slate-400 pt-2">
                    서버에서 관리되는 제미나이 API를 통해 고속 슬라이드 생성과 다국어 번역을 제공합니다.
                  </p>
                )}

                {config.provider === "offline-rule" && (
                  <p className="text-[11px] text-slate-400 pt-2">
                    외부 네트워크 호출 없이 내장 사전과 규칙 기반으로만 슬라이드를 편집합니다.
                  </p>
                )}
              </div>

              {/* Default Tone Preference */}
              <div className="space-y-2.5">
                <label className="block text-xs font-medium text-sky-300">
                  기본 어조 설정
                </label>
                <div className="divide-y divide-white/[0.06]">
                  {TONE_PRESETS.map((t) => (
                    <label
                      key={t.id}
                      className={`py-2.5 px-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        config.tone === t.id
                          ? "bg-sky-500/15 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="tone"
                          checked={config.tone === t.id}
                          onChange={() => setConfig({ ...config, tone: t.id })}
                          className="accent-sky-400"
                        />
                        <div>
                          <span className="text-xs font-semibold text-white mr-2">{t.labelKo}</span>
                          <span className="text-[11px] text-slate-400">{t.desc}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              {/* Active / Off Row (no nested box) */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-white">디자인 헌법 활성화</span>
                <button
                  type="button"
                  onClick={() =>
                    setLocalConstitution((prev) => ({ ...prev, enabled: !prev.enabled }))
                  }
                  role="switch"
                  aria-checked={localConstitution.enabled}
                  className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer"
                >
                  <span>{localConstitution.enabled ? "활성" : "해제"}</span>
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      localConstitution.enabled ? "bg-sky-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        localConstitution.enabled ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              </div>

              {/* Reference File Dropzone */}
              <div>
                <input
                  ref={constitutionFileRef}
                  type="file"
                  accept=".txt,.md,.json,.pdf,text/plain,text/markdown,application/json,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleConstitutionFile(f);
                  }}
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDraggingFile) setIsDraggingFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleConstitutionFile(f);
                  }}
                  onClick={() => !isExtractingFile && constitutionFileRef.current?.click()}
                  className={`rounded-xl border border-dashed px-4 py-3.5 transition cursor-pointer flex items-center justify-between gap-3 ${
                    isDraggingFile
                      ? "border-sky-400 bg-sky-500/10"
                      : "border-sky-400/30 bg-[#0b101b] hover:border-sky-400/60"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {isExtractingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {isExtractingFile
                          ? "문서에서 스타일 규칙 추출 중..."
                          : "스타일 가이드 문서를 드롭하거나 클릭해 첨부"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        .txt, .md, .json, .pdf 지원
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-sky-300 whitespace-nowrap shrink-0">
                    파일 선택
                  </span>
                </div>

                {localConstitution.attachedFileName && (
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{localConstitution.attachedFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalConstitution((prev) => ({ ...prev, attachedFileName: undefined }))
                      }
                      className="text-slate-400 hover:text-rose-300 p-1 rounded transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Single Clean Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-sky-300">
                    어조 및 스타일 지침
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {localConstitution.rulesText.length}자
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={localConstitution.rulesText}
                  onChange={(e) =>
                    setLocalConstitution((prev) => ({ ...prev, rulesText: e.target.value }))
                  }
                  placeholder="원하는 어조, 스타일 규칙, 금지 표현 등을 자유롭게 입력하세요..."
                  className="w-full px-3.5 py-3 bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none leading-relaxed font-sans"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => modalCtx.closeModal("aiSettings")}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/10 transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
            >
              저장 및 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
