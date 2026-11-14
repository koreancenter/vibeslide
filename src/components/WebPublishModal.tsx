import React, { useState } from "react";
import {
  X,
  Globe,
  Share2,
  Code,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useSlideContext } from "../context/SlideContext";
import { generateSelfContainedHtmlBundle } from "../utils/webBundleGenerator";

interface WebPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebPublishModal: React.FC<WebPublishModalProps> = ({ isOpen, onClose }) => {
  const { slides, currentTheme, language, triggerToast } = useSlideContext();

  const [activeTab, setActiveTab] = useState<"url" | "embed" | "bundle">("url");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedDeck, setPublishedDeck] = useState<{
    id: string;
    shareUrl: string;
    embedUrl: string;
    publishedAt: number;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("540");
  const [allowFullscreen, setAllowFullscreen] = useState(true);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const deckTitle =
        slides[0]?.titleKo || slides[0]?.titleId || "프레젠테이션";
      const res = await fetch("/api/publish-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides,
          theme: currentTheme,
          language,
          title: deckTitle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Publish failed with status ${res.status}`);
      }

      const data = await res.json();
      const publishId = data.publishId || data.deck?.id;
      if (publishId) {
        const origin = window.location.origin;
        setPublishedDeck({
          id: publishId,
          shareUrl: `${origin}/published/${publishId}`,
          embedUrl: `${origin}/embed/${publishId}`,
          publishedAt: data.createdAt || data.deck?.createdAt || Date.now(),
        });
        triggerToast("슬라이드 덱이 웹에 배포되었습니다.");
      } else {
        throw new Error("Invalid publish response");
      }
    } catch (err) {
      console.error("Failed to publish deck:", err);
      triggerToast("배포 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    triggerToast("클립보드에 복사되었습니다.");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDownloadOfflineBundle = () => {
    try {
      const deckTitle =
        slides[0]?.titleKo || slides[0]?.titleId || "프레젠테이션";
      const htmlContent = generateSelfContainedHtmlBundle({
        slides,
        theme: currentTheme,
        defaultLanguage: language,
        title: deckTitle,
      });

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deckTitle.replace(/[\s/\\?%*:|"<>]/g, "_")}_웹번들.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerToast("오프라인 웹 번들(.html)이 다운로드되었습니다.");
    } catch (err) {
      console.error("Bundle export error:", err);
      triggerToast("오프라인 번들 생성에 실패했습니다.");
    }
  };

  const embedCode = publishedDeck
    ? `<iframe src="${publishedDeck.embedUrl}" width="${embedWidth}" height="${embedHeight}" frameborder="0" ${
        allowFullscreen ? "allowfullscreen" : ""
      } style="border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;" loading="lazy"></iframe>`
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#101520] border border-sky-400/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141b29]">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            웹 게시 및 임베드
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-white/[0.08] bg-[#0d121d] px-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "url"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>공유 링크</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("embed")}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "embed"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>임베드 코드</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bundle")}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "bundle"
                ? "border-sky-400 text-sky-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>오프라인 HTML 번들</span>
          </button>
        </div>

        {/* Body (No box-in-box) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-300 text-xs">
          {/* Flat Publish Status Strip */}
          <div className="pb-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {!publishedDeck ? (
              <>
                <div>
                  <div className="text-sm font-medium text-white">
                    {slides.length}장의 슬라이드 배포 준비 완료
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    웹 공유 링크와 반응형 임베드 코드를 즉시 생성합니다.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center space-x-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>배포 중...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>웹에 게시</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm font-medium text-sky-300">
                    배포 완료 · {publishedDeck.id}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    최근 배포: {new Date(publishedDeck.publishedAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-3.5 py-2 bg-white/[0.06] hover:bg-white/10 text-slate-200 text-xs font-medium rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPublishing ? "animate-spin" : ""}`} />
                  <span>최신 내용 재배포</span>
                </button>
              </>
            )}
          </div>

          {/* Tab 1: Share URL */}
          {activeTab === "url" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-sky-300 block">
                  독립 실행 웹 링크
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      publishedDeck
                        ? publishedDeck.shareUrl
                        : "상단의 [웹에 게시] 버튼을 눌러 링크를 생성하세요."
                    }
                    className="flex-1 bg-[#0b101b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!publishedDeck}
                    onClick={() => publishedDeck && copyToClipboard(publishedDeck.shareUrl, "shareUrl")}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    {copiedField === "shareUrl" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>복사</span>
                  </button>
                  {publishedDeck && (
                    <a
                      href={publishedDeck.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white/[0.06] hover:bg-white/10 text-white rounded-xl transition cursor-pointer flex items-center justify-center"
                      title="새 탭에서 열기"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {publishedDeck && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-medium text-sky-300">라이브 미리보기</div>
                  <div className="w-full aspect-video rounded-xl border border-white/10 overflow-hidden bg-black">
                    <iframe
                      src={publishedDeck.embedUrl}
                      className="w-full h-full border-0"
                      title="게시된 프레젠테이션 미리보기"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Embed Code */}
          {activeTab === "embed" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">너비</label>
                  <input
                    type="text"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
                    placeholder="100% 또는 960px"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">높이</label>
                  <input
                    type="text"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none"
                    placeholder="540"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="fullscreen-check"
                    checked={allowFullscreen}
                    onChange={(e) => setAllowFullscreen(e.target.checked)}
                    className="rounded border-white/20 accent-sky-400 cursor-pointer"
                  />
                  <label htmlFor="fullscreen-check" className="text-slate-300 cursor-pointer">
                    전체화면 허용
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-sky-300">
                    반응형 임베드 HTML 코드
                  </label>
                  <button
                    type="button"
                    disabled={!publishedDeck}
                    onClick={() => publishedDeck && copyToClipboard(embedCode, "embedCode")}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    {copiedField === "embedCode" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>코드 복사</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={
                    publishedDeck
                      ? embedCode
                      : "상단의 [웹에 게시] 버튼을 눌러 임베드 코드를 생성하세요."
                  }
                  className="w-full bg-[#0b101b] border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  노션, 컨플루언스, 사내 위키 및 포털에 이 코드를 붙여넣어 바로 재생할 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Offline Bundle */}
          {activeTab === "bundle" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-1.5">
                  단일 파일 오프라인 웹 번들
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  외부 네트워크나 서버 없이 단일 HTML 파일만으로 16:9 프레젠테이션, 레이저 포인터, 단축키, 발표자 노트 기능을 모두 실행할 수 있습니다.
                </p>
              </div>

              <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                <li>외부 스크립트 호출 없이 브라우저에서 독립 렌더링</li>
                <li>화면 크기에 맞춘 16:9 반응형 비율 자동 지원</li>
                <li>한국어 / 인도네시아어 / 영어 / 이중 언어 전환 지원</li>
                <li>발표자 노트, 타이머, 레이저 포인터 내장</li>
              </ul>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDownloadOfflineBundle}
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>오프라인 HTML 파일 다운로드</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#141b29] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.06] hover:bg-white/10 text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
