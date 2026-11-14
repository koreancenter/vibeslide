import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SlideData, Language, PresentationTheme } from "../types";

export interface PdfExportOptions {
  fileName?: string;
  format: "16:9" | "a4-landscape" | "letter-landscape";
  language: Language;
  qualityScale: number; // 2 for crisp 1080p, 3 for 4K
  slideRange: "all" | "current" | "custom";
  customRangeText?: string;
  includeNotes?: boolean;
  theme: PresentationTheme;
  onProgress?: (current: number, total: number, statusText: string) => void;
}

/**
 * Parses user custom range string like "1-3, 5, 7-9" into 0-indexed slide array
 */
export function parseSlideRange(
  rangeType: "all" | "current" | "custom",
  totalSlides: number,
  currentSlideIndex: number,
  customRangeText?: string
): number[] {
  if (rangeType === "current") {
    return [currentSlideIndex];
  }
  if (rangeType === "all" || !customRangeText) {
    return Array.from({ length: totalSlides }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = customRangeText.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalSlides, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalSlides) {
        indices.add(pageNum - 1);
      }
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalSlides }, (_, i) => i);
}

/**
 * Exports slides to a PDF file using high-resolution html2canvas and jsPDF
 */
export async function exportSlidesToPdf(
  containerElement: HTMLElement,
  slidesToExport: { slide: SlideData; index: number }[],
  options: PdfExportOptions
): Promise<void> {
  const {
    fileName = "KIND_2026_Presentation.pdf",
    format = "16:9",
    qualityScale = 2,
    includeNotes = false,
    onProgress,
  } = options;

  // Determine PDF dimensions in mm
  let pdfWidth = 297;
  let pdfHeight = 167.0625; // 16:9 standard on 297mm width
  let imageX = 0;
  let imageY = 0;
  let imageWidth = pdfWidth;
  let imageHeight = pdfHeight;

  if (format === "a4-landscape") {
    pdfWidth = 297;
    pdfHeight = 210;
    // Fit 16:9 inside A4 with clean vertical margins
    imageWidth = 297;
    imageHeight = (297 * 9) / 16; // ~167.06mm
    imageX = 0;
    imageY = (210 - imageHeight) / 2; // ~21.47mm top/bottom margin
  } else if (format === "letter-landscape") {
    pdfWidth = 279.4;
    pdfHeight = 215.9;
    imageWidth = 279.4;
    imageHeight = (279.4 * 9) / 16; // ~157.16mm
    imageX = 0;
    imageY = (215.9 - imageHeight) / 2;
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
    compress: true,
  });

  const slideDoms = containerElement.querySelectorAll<HTMLElement>("[data-pdf-slide]");
  const total = slidesToExport.length;

  for (let i = 0; i < total; i++) {
    const targetDom = slideDoms[i];
    if (!targetDom) continue;

    onProgress?.(i + 1, total, `슬라이드 렌더링 중... (${i + 1}/${total})`);

    // Ensure DOM is fully visible and rendered
    const canvas = await html2canvas(targetDom, {
      scale: qualityScale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: 1920,
      windowHeight: 1080,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (i > 0) {
      pdf.addPage([pdfWidth, pdfHeight], "landscape");
    }

    // Background color fill if needed
    pdf.setFillColor(15, 23, 42); // #0F172A slate fallback
    pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

    pdf.addImage(imgData, "JPEG", imageX, imageY, imageWidth, imageHeight, undefined, "FAST");

    // Optional speaker notes page
    if (includeNotes && (slidesToExport[i].slide.notesKo || slidesToExport[i].slide.notesId)) {
      pdf.addPage([pdfWidth, pdfHeight], "landscape");
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(16);
      pdf.text(
        `발표자 노트 (Speaker Notes) - Slide ${slidesToExport[i].slide.slideNumber || i + 1}`,
        20,
        25
      );

      pdf.setFontSize(12);
      pdf.setTextColor(71, 85, 105);
      const title = slidesToExport[i].slide.titleKo || slidesToExport[i].slide.titleId || "Slide";
      pdf.text(`Title: ${title}`, 20, 35);

      pdf.setDrawColor(203, 213, 225);
      pdf.line(20, 40, pdfWidth - 20, 40);

      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);

      let textY = 50;
      if (slidesToExport[i].slide.notesKo) {
        pdf.text("[한국어 발표 메모]", 20, textY);
        textY += 6;
        const splitKo = pdf.splitTextToSize(slidesToExport[i].slide.notesKo, pdfWidth - 40);
        pdf.text(splitKo, 20, textY);
        textY += splitKo.length * 5 + 10;
      }

      if (slidesToExport[i].slide.notesId) {
        pdf.text("[Catatan Bahasa Indonesia]", 20, textY);
        textY += 6;
        const splitId = pdf.splitTextToSize(slidesToExport[i].slide.notesId, pdfWidth - 40);
        pdf.text(splitId, 20, textY);
      }
    }
  }

  onProgress?.(total, total, "PDF 파일 생성 및 저장 중...");
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
