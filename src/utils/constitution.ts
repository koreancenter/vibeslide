import { DesignConstitution } from "../types";
import { extractConstitutionFromFile } from "./api";

export type { DesignConstitution };

export const CONSTITUTION_STORAGE_KEY = "kind_2026_design_constitution";

export const DEFAULT_DESIGN_CONSTITUTION: DesignConstitution = {
  enabled: true,
  rulesText:
    "Maintain formal diplomatic dignity and executive clarity. Always cite concrete data sources and figures. Avoid overhyped marketing buzzwords (e.g., revolutionary, ultimate, game-changing).",
  attachedFileName: undefined,
};

export function loadDesignConstitution(): DesignConstitution {
  if (typeof window === "undefined") {
    return DEFAULT_DESIGN_CONSTITUTION;
  }
  try {
    const raw = localStorage.getItem(CONSTITUTION_STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN_CONSTITUTION;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Support clean loading plus automatic migration from legacy structured schema
      let rulesText = typeof parsed.rulesText === "string" ? parsed.rulesText : "";
      if (!rulesText && (parsed.customDirectives || parsed.toneStyle || Array.isArray(parsed.forbiddenWords))) {
        const legacyParts: string[] = [];
        if (parsed.toneStyle) legacyParts.push(`Tone style: ${parsed.toneStyle}.`);
        if (typeof parsed.customDirectives === "string" && parsed.customDirectives.trim()) {
          legacyParts.push(parsed.customDirectives.trim());
        }
        if (Array.isArray(parsed.forbiddenWords) && parsed.forbiddenWords.length > 0) {
          legacyParts.push(`Avoid words: ${parsed.forbiddenWords.join(", ")}.`);
        }
        rulesText = legacyParts.join(" ");
      }

      return {
        enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
        rulesText: rulesText || DEFAULT_DESIGN_CONSTITUTION.rulesText,
        attachedFileName:
          typeof parsed.attachedFileName === "string" && parsed.attachedFileName.trim()
            ? parsed.attachedFileName.trim()
            : undefined,
      };
    }
  } catch (err) {
    console.warn("Failed to load Design Constitution from localStorage:", err);
  }
  return DEFAULT_DESIGN_CONSTITUTION;
}

export function saveDesignConstitution(config: DesignConstitution): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSTITUTION_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("Failed to save Design Constitution to localStorage:", err);
  }
}

export function formatConstitutionPromptDirective(constitution?: DesignConstitution | null): string {
  if (!constitution || !constitution.enabled) {
    return "";
  }
  const rulesText = typeof constitution.rulesText === "string" ? constitution.rulesText.trim() : "";
  if (!rulesText) {
    return "";
  }

  return `\n\n=== USER DESIGN CONSTITUTION & TONE DIRECTIVES ===\n${rulesText}\nStrictly follow the tone, formatting, and style guidelines defined above.\n`;
}

export async function processConstitutionReferenceFile(
  file: File
): Promise<{ rulesText: string; fileName: string; note?: string }> {
  const lower = file.name.toLowerCase();
  const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
  const isSupportedText =
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    file.type.startsWith("text/") ||
    file.type === "application/json";

  if (!isPdf && !isSupportedText) {
    throw new Error("지원되지 않는 파일 형식입니다. (.txt, .md, .json, .pdf만 지원)");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("15MB 이하의 파일만 업로드할 수 있습니다.");
  }

  if (isPdf) {
    const fileBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("PDF 파일을 읽는 중 오류가 발생했습니다."));
      reader.readAsDataURL(file);
    });
    return extractConstitutionFromFile({
      fileName: file.name,
      mimeType: "application/pdf",
      fileBase64,
    });
  }

  const fileText = await file.text();
  if (!fileText.trim()) {
    throw new Error("첨부된 파일에 텍스트 내용이 없습니다.");
  }

  return extractConstitutionFromFile({
    fileName: file.name,
    mimeType: file.type || "text/plain",
    fileText,
  });
}
