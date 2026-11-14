import { SlideData, SlideLayout } from "../types";

/**
 * Creates default fallback presentation slides if raw document is empty.
 */
export function createFallbackSlides(defaultTitle: string = "Presentation Deck"): SlideData[] {
  return [
    {
      id: "slide-1",
      slideNumber: 1,
      layout: "cover",
      categoryKo: "KIND 2026",
      categoryId: "KIND 2026",
      tagKo: "KIND 2026",
      tagId: "KIND 2026",
      titleKo: defaultTitle,
      titleId: defaultTitle,
      subtitleKo: "Bilingual Presentation Deck",
      subtitleId: "Dek Presentasi Bilingual",
      bullets: [
        {
          id: "b-1",
          titleKo: "핵심 개요",
          titleId: "Ringkasan Kunci",
          descKo: "발표 주요 아젠다 및 협력 추진 과제",
          descId: "Agenda utama presentasi dan inisiatif kerjasama",
          tagKo: "개요",
          tagId: "Overview",
        },
      ],
      notesKo: "Default fallback slide generated from template.",
      notesId: "Slide cadangan default dibuat dari templat.",
    },
  ];
}

/**
 * Robust rule-based Markdown-to-Slides parser.
 * Handles slide separators (---, # Slide, or major headers), titles, subtitles,
 * bullets, callouts, and notes with automatic 16:9 layout detection.
 */
export function parseMarkdownToSlides(rawData: string, defaultTitle?: string): SlideData[] {
  if (!rawData || typeof rawData !== "string" || !rawData.trim()) {
    return createFallbackSlides(defaultTitle);
  }

  // Normalize newlines
  const text = rawData.replace(/\r\n/g, "\n");
  
  // Split on "---" slide breaks first
  let rawSections = text.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(Boolean);

  // If there are no --- dividers, attempt splitting on # Slide or major # headings
  if (rawSections.length <= 1) {
    const slideMatches = text.split(/\n(?=# (?:Slide\s+\d+|[^\n]+))/i).map(s => s.trim()).filter(Boolean);
    if (slideMatches.length > 1) {
      rawSections = slideMatches;
    }
  }

  if (rawSections.length === 0) {
    return createFallbackSlides(defaultTitle);
  }

  const slides: SlideData[] = rawSections.map((section, idx) => {
    const lines = section.split("\n").map(l => l.trim()).filter(Boolean);
    let title = "";
    let subtitle = "";
    let callout = "";
    const notes: string[] = [];
    const rawTableLines: string[] = [];
    let slideImage: any = undefined;
    const bullets: Array<{
      id: string;
      titleKo: string;
      titleId: string;
      descKo: string;
      descId: string;
      tagKo?: string;
      tagId?: string;
    }> = [];

    for (const line of lines) {
      if (line.startsWith("|") && line.endsWith("|")) {
        rawTableLines.push(line);
      } else if (line.startsWith("# ")) {
        const parsedTitle = line.replace(/^#\s+/, "").trim();
        if (!title) {
          title = parsedTitle;
        } else if (!subtitle) {
          subtitle = parsedTitle;
        }
      } else if (line.startsWith("## ")) {
        subtitle = line.replace(/^##\s+/, "").trim();
      } else if (line.startsWith("> ")) {
        callout = line.replace(/^>\s+/, "").trim();
      } else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
        const itemText = line.replace(/^[-*•]\s+/, "").trim();
        
        // Image check inside bullet
        const imgMatch = itemText.match(/!\[(.*?)\]\((.*?)\)/) || itemText.match(/\[Image:\s*(.*?)\]/i) || itemText.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|svg)/i);
        if (imgMatch) {
          const url = imgMatch[2] || imgMatch[1] || imgMatch[0];
          const caption = imgMatch[1] || "Visual Asset";
          slideImage = {
            url: url.trim(),
            captionKo: caption,
            captionId: caption,
            position: "right"
          };
          continue;
        }

        const parts = itemText.split(":");
        const itemTitle = parts[0]?.trim() || itemText;
        const itemDesc = parts.slice(1).join(":").trim();

        // Deduplication guard: ignore bullet if it's identical to the slide title and subtitle
        const isDuplicateOfSlideHeader =
          itemTitle === title && (!itemDesc || itemDesc === subtitle);

        if (!isDuplicateOfSlideHeader && (itemTitle || itemDesc)) {
          bullets.push({
            id: `b-${bullets.length + 1}`,
            titleKo: itemTitle,
            titleId: itemTitle,
            descKo: itemDesc,
            descId: itemDesc,
            tagKo: "Point",
            tagId: "Point",
          });
        }
      } else {
        // Image check in normal line
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/) || line.match(/\[Image:\s*(.*?)\]/i) || line.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|svg)/i);
        if (imgMatch) {
          const url = imgMatch[2] || imgMatch[1] || imgMatch[0];
          const caption = imgMatch[1] || "Visual Asset";
          slideImage = {
            url: url.trim(),
            captionKo: caption,
            captionId: caption,
            position: "right"
          };
          continue;
        }

        if (!title) {
          title = line;
        } else if (!subtitle) {
          subtitle = line;
        } else {
          notes.push(line);
        }
      }
    }

    if (!title) {
      title = defaultTitle ? `${defaultTitle} - Slide ${idx + 1}` : `Slide ${idx + 1}`;
    }

    // Parse accumulated table lines if present
    let customTable: { headers: string[]; rows: string[][] } | undefined = undefined;
    if (rawTableLines.length >= 2) {
      const parsedRows = rawTableLines.map(l => {
        return l
          .split("|")
          .map(cell => cell.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);
      });
      // Filter out markdown table divider row like |---|---|
      const dataRows = parsedRows.filter(row => !row.every(c => /^[:\s-]*$/.test(c) || c === ""));
      if (dataRows.length > 0) {
        customTable = {
          headers: dataRows[0],
          rows: dataRows.slice(1)
        };
      }
    }

    // Extract stats and process stages from bullets for precise rendering
    const stats: any[] = [];
    const processStages: any[] = [];

    bullets.forEach((b, bIdx) => {
      // Metric detect (starts with double asterisks or contains numbers/percentages)
      const hasDoubleAsterisks = b.titleKo.startsWith("**") && b.titleKo.endsWith("**");
      const isMetric = hasDoubleAsterisks || /^[0-9]+|[\d%,.+\-]+|USD|IDR|KRW/.test(b.titleKo);
      
      if (isMetric && b.descKo) {
        stats.push({
          labelKo: b.descKo,
          labelId: b.descId,
          value: b.titleKo.replace(/\*\*/g, ""),
          subKo: b.tagKo !== "Point" ? b.tagKo : undefined,
          subId: b.tagId !== "Point" ? b.tagId : undefined,
        });
      }

      // Process step detect
      const isStep =
        b.titleKo.toLowerCase().includes("step") ||
        b.titleKo.includes("단계") ||
        b.titleKo.toLowerCase().includes("stage") ||
        /^\d+/.test(b.titleKo);
        
      if (isStep) {
        processStages.push({
          stage: bIdx + 1,
          badgeKo: `Step 0${bIdx + 1}`,
          badgeId: `Step 0${bIdx + 1}`,
          titleKo: b.titleKo,
          titleId: b.titleId,
          descKo: b.descKo,
          descId: b.descId,
          bulletsKo: [],
          bulletsId: []
        });
      }
    });

    // Determine layout based on content structure
    let layout: SlideLayout = "general";
    if (customTable) {
      const allText = (title + " " + subtitle + " " + rawTableLines.join(" ")).toLowerCase();
      if (allText.includes("대학") || allText.includes("대표") || allText.includes("인원") || allText.includes("university") || allText.includes("delegate") || allText.includes("total")) {
        layout = "delegation-table";
      } else if (allText.includes("시간") || allText.includes("일정") || allText.includes("일차") || allText.includes("time") || allText.includes("schedule") || allText.includes("jadwal")) {
        layout = "schedule-table";
      } else {
        layout = "comparison-table";
      }
    } else if (idx === 0 && !subtitle && bullets.length === 0) {
      layout = "cover";
    } else if (stats.length >= 2) {
      layout = "key-stats";
    } else if (processStages.length >= 2) {
      layout = "process-3";
    } else if (slideImage && bullets.length > 0) {
      layout = "split-info";
    } else if (slideImage && bullets.length === 0 && (title.length + subtitle.length) < 110) {
      layout = "full-image";
    } else if (bullets.length === 0) {
      layout = "general";
    } else if (bullets.length === 2) {
      layout = "cards-2";
    } else if (bullets.length === 3) {
      const allText = (title + " " + subtitle + " " + bullets.map(b => b.titleKo).join(" ")).toLowerCase();
      if (allText.includes("실행") || allText.includes("과제") || allText.includes("방안") || allText.includes("action") || allText.includes("plan") || allText.includes("eksekusi")) {
        layout = "action-items";
      } else {
        layout = "cards-3";
      }
    } else {
      layout = "overview";
    }

    const noteText = notes.join("\n");

    return {
      id: `slide-${idx + 1}`,
      slideNumber: idx + 1,
      layout,
      categoryKo: idx === 0 ? "KIND 2026 Presentation" : `Section ${idx + 1}`,
      categoryId: idx === 0 ? "KIND 2026 Presentation" : `Section ${idx + 1}`,
      titleKo: title,
      titleId: title,
      subtitleKo: subtitle,
      subtitleId: subtitle,
      calloutKo: callout,
      calloutId: callout,
      customTable,
      bullets,
      stats: stats.length > 0 ? stats : undefined,
      processStages: processStages.length > 0 ? processStages : undefined,
      image: slideImage,
      notesKo: noteText,
      notesId: noteText,
    };
  });

  return slides.length > 0 ? slides : createFallbackSlides(defaultTitle);
}

/**
 * Converts slide objects into markdown text with separator lines.
 */
export function slidesToMarkdown(slides: SlideData[]): string {
  if (!slides || !Array.isArray(slides)) return "";

  return slides.map(slide => {
    let md = "";
    if (slide.titleKo) md += `# ${slide.titleKo}\n`;
    if (slide.subtitleKo) md += `## ${slide.subtitleKo}\n`;
    if (slide.calloutKo) md += `> ${slide.calloutKo}\n`;
    
    if (slide.customTable) {
      const { headers, rows } = slide.customTable;
      if (headers && headers.length > 0) {
        md += `| ${headers.join(" | ")} |\n`;
        md += `| ${headers.map(() => "---").join(" | ")} |\n`;
        if (rows && rows.length > 0) {
          rows.forEach(row => {
            md += `| ${row.join(" | ")} |\n`;
          });
        }
        md += "\n";
      }
    } else if (slide.bullets && slide.bullets.length > 0) {
      slide.bullets.forEach(b => {
        // Skip bullet if it merely echoes the slide title & subtitle
        const isDuplicate =
          b.titleKo === slide.titleKo && (!b.descKo || b.descKo === slide.subtitleKo);
        if (isDuplicate) return;

        if (b.titleKo && b.descKo && b.titleKo !== b.descKo) {
          md += `- ${b.titleKo}: ${b.descKo}\n`;
        } else if (b.titleKo) {
          md += `- ${b.titleKo}\n`;
        } else if (b.descKo) {
          md += `- ${b.descKo}\n`;
        }
      });
    }

    if (slide.notesKo) {
      md += `\n${slide.notesKo}\n`;
    }

    return md.trim();
  }).join("\n\n---\n\n");
}
