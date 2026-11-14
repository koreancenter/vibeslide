import { AiModelConfig, AiTonePreset } from "../types";

const AI_CONFIG_KEY = "vibe_slide_ai_model_config";

export const DEFAULT_AI_CONFIG: AiModelConfig = {
  provider: "gemini-cloud",
  modelName: "gemini-4-hydrogen",
  localEndpoint: "http://localhost:11434/v1",
  tone: "quiet-luxury",
};

export const TONE_PRESETS: {
  id: AiTonePreset;
  labelKo: string;
  badge: string;
  desc: string;
  systemInstruction: string;
}[] = [
  {
    id: "quiet-luxury",
    labelKo: "조용한 럭셔리 및 외교",
    badge: "외교·럭셔리",
    desc: "절제된 미니멀리즘과 한국-인도네시아 공식 외교 격식체",
    systemInstruction:
      "Maintain ultra-luxury minimal aesthetic, dignified Sumuk ink editorial clarity, executive diplomatic respect, and balanced whitespace. Avoid hype or buzzwords.",
  },
  {
    id: "consulting",
    labelKo: "전략 컨설팅",
    badge: "전략 컨설팅",
    desc: "가설 지향적 피라미드 구조와 3대 핵심 축 중심의 경영진 요약",
    systemInstruction:
      "Apply McKinsey top-down pyramid principle. Group insights into MECE pillars, action-driven statements, and executive takeaways.",
  },
  {
    id: "startup-pitch",
    labelKo: "스타트업 투자 피치",
    badge: "투자 피치",
    desc: "벤처 투자 제안용 문제-해결-시장 기회 및 핵심 성장 지표 강조",
    systemInstruction:
      "Adopt high-impact venture capital pitch tone. Put traction metrics front and center, emphasize unfair advantage, scale, and high-velocity verbs.",
  },
  {
    id: "academic",
    labelKo: "학술 및 직업교육",
    badge: "학술 연구",
    desc: "인도네시아 국립 직업교육 협약 및 엄밀한 산학 연구 보고",
    systemInstruction:
      "Maintain formal academic terminology, precise vocational educational policy framing (D3/D4, Politeknik, Ditjen Vokasi), and structured empirical analysis.",
  },
];

export function loadAiModelConfig(): AiModelConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;
  try {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_AI_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load AI model config:", e);
  }
  return DEFAULT_AI_CONFIG;
}

export function saveAiModelConfig(cfg: AiModelConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn("Failed to save AI model config:", e);
  }
}
