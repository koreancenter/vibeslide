import { SlideData, DesignConstitution } from "../types";
import { loadDesignConstitution } from "./constitution";

export async function translateTextWithAi(
  text: string,
  sourceLang: "ko" | "id",
  targetLang: "ko" | "id",
  context?: string,
  constitution?: DesignConstitution
): Promise<string> {
  if (!text || text.trim() === "") return "";
  try {
    const activeConstitution = constitution ?? loadDesignConstitution();
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        context: context || "KIND 2026 Korea-Indonesia presentation",
        constitution: activeConstitution,
      }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.translatedText || text;
  } catch (error) {
    console.warn("Translation API call fallback:", error);
    // Simple basic fallback indicator
    return text;
  }
}

export async function translateSlideWithAi(
  slide: SlideData,
  targetLang: "ko" | "id",
  constitution?: DesignConstitution
): Promise<SlideData> {
  try {
    const activeConstitution = constitution ?? loadDesignConstitution();
    const res = await fetch("/api/translate-slide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slide,
        targetLang,
        constitution: activeConstitution,
      }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.slide || slide;
  } catch (error) {
    console.error("Slide translation API error:", error);
    throw error;
  }
}

export interface AttachedImagePayload {
  data: string;
  mimeType: string;
  name?: string;
  size?: number;
}

export async function aiSlideAssist(
  action: string,
  currentSlide: SlideData,
  instructions?: string,
  tone?: string,
  modelConfig?: any,
  attachedImage?: AttachedImagePayload | null,
  constitution?: DesignConstitution
): Promise<SlideData> {
  const activeConstitution = constitution ?? loadDesignConstitution();
  const res = await fetch("/api/ai-slide-assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      currentSlide,
      instructions,
      tone,
      modelConfig,
      attachedImage,
      constitution: activeConstitution,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "AI assist failed");
  }
  const data = await res.json();
  return data.result || currentSlide;
}

export async function aiGenerateNextSlide(
  currentSlide: SlideData,
  instructions?: string,
  tone?: string,
  modelConfig?: any,
  attachedImage?: AttachedImagePayload | null,
  constitution?: DesignConstitution
): Promise<SlideData> {
  const activeConstitution = constitution ?? loadDesignConstitution();
  const res = await fetch("/api/ai-generate-next-slide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentSlide,
      instructions,
      tone,
      modelConfig,
      attachedImage,
      constitution: activeConstitution,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to generate next slide");
  }
  const data = await res.json();
  return data.slide;
}

export async function testOllamaConnection(
  endpoint = "http://localhost:11434",
  modelName = "llama3.2"
): Promise<{ ok: boolean; message: string }> {
  try {
    const cleanUrl = endpoint.replace(/\/v1\/?$/, "");
    const res = await fetch(`${cleanUrl}/api/tags`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      const hasModel = data?.models?.some((m: any) => m.name?.startsWith(modelName));
      return {
        ok: true,
        message: hasModel
          ? `Ollama 정상 연결됨 (모델 "${modelName}" 확인됨)`
          : `Ollama 서버 응답 정상 (${data.models?.length || 0}개 모델 발견, "${modelName}" 준비 권장)`,
      };
    }
    return { ok: false, message: `Ollama 서버 응답 코드: ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: `로컬 엔드포인트 연결 실패: ${err?.message || "CORS 또는 오프라인 상태"}` };
  }
}


export async function fetchAiAutoLayout(slide: SlideData): Promise<any> {
  const res = await fetch("/api/ai-auto-layout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slide }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "AI Auto-Layout request failed");
  }
  const data = await res.json();
  return data.analysis;
}

export async function fetchAiThemeRecommendation(
  slide: SlideData,
  availableThemes: any[]
): Promise<any> {
  const res = await fetch("/api/ai-theme-recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slide, availableThemes }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "AI Theme Recommendation failed");
  }
  const data = await res.json();
  return data.analysis;
}

export async function fetchAiRedesign(
  slide: SlideData,
  triedLayouts: string[]
): Promise<any> {
  const res = await fetch("/api/ai-redesign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slide, triedLayouts }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "AI Redesign failed");
  }
  return await res.json();
}

export interface PolishElementParams {
  selectedText: string;
  fieldType: string;
  slideContext?: any;
  instructions?: string;
  tone?: string;
  constitution?: DesignConstitution;
}

export async function polishElementWithAi(
  params: PolishElementParams
): Promise<string> {
  const activeConstitution = params.constitution ?? loadDesignConstitution();
  const res = await fetch("/api/ai-polish-element", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      constitution: activeConstitution,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to polish element");
  }

  const data = await res.json();
  return data.revisedText || params.selectedText;
}

export async function generateSlidesWithAi(
  rawData: string,
  constitution?: DesignConstitution
): Promise<{ title: string; slides: SlideData[]; isFallback?: boolean }> {
  const activeConstitution = constitution ?? loadDesignConstitution();
  const res = await fetch("/api/generate-slides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawData,
      constitution: activeConstitution,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate slides");
  }

  return await res.json();
}

export async function fetchRagAutoPilotDiff(
  currentSlides: SlideData[],
  sourceDocumentContent: string,
  documentTitle?: string,
  modelConfig?: any
): Promise<{
  suggestions: any[];
  sourceDocumentTitle?: string;
  metricsExtractedCount?: number;
  analyzedAt?: number;
  note?: string;
}> {
  const res = await fetch("/api/ai-rag-autopilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentSlides,
      sourceDocumentContent,
      documentTitle: documentTitle || "Reference Document",
      modelConfig,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `RAG Auto-Pilot request failed (${res.status})`);
  }

  return await res.json();
}

export interface ExtractConstitutionPayload {
  fileName: string;
  mimeType: string;
  fileText?: string;
  fileBase64?: string;
}

export async function extractConstitutionFromFile(
  payload: ExtractConstitutionPayload
): Promise<{ rulesText: string; fileName: string; note?: string }> {
  const res = await fetch("/api/extract-constitution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to extract constitution (${res.status})`);
  }

  return await res.json();
}

