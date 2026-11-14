/**
 * Security validation and sanitization utilities
 */

/**
 * Escapes HTML control characters to prevent XSS injection
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitizes plain text by removing null bytes, script tags, and dangerous executable code.
 */
export function sanitizePlainText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\0/g, "") // Strip null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip script tags
    .replace(/javascript:/gi, "") // Strip javascript: schemes
    .replace(/onload\s*=/gi, "")
    .replace(/onerror\s*=/gi, "")
    .trim();
}

/**
 * Strips all HTML tags and returns safe plain text content
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validates whether a URL is safe for rendering in <img> or <a> tags.
 * Only allows http:, https:, or standard image data URI protocols.
 * Blocks dangerous schemes like javascript:, vbscript:, file:, or data:text/html.
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "") return false;

  // Safe data URIs for images only
  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }

  // Safe http / https URLs
  try {
    const parsed = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Returns safe image URL or fallback placeholder
 */
export function getSafeImageUrl(url: string | null | undefined, fallback: string = ""): string {
  if (isSafeImageUrl(url)) {
    return url!.trim();
  }
  return fallback;
}

/**
 * Validates Google Drive File ID string format (strictly alphanumeric, hyphens, underscores, max 128 chars)
 */
export function isValidDriveFileId(fileId: string | null | undefined): boolean {
  if (!fileId || typeof fileId !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(fileId);
}

/**
 * Validates that an OAuth access token conforms to safe token patterns
 */
export function isSafeToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  if (token.length > 2048) return false;
  return !/[\r\n\0<>\s]/.test(token);
}

