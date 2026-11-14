import { SlideData, SlideTransition } from "../types";

export interface SmartTransitionRecommendation {
  recommendedTransition: SlideTransition;
  reasonKo: string;
  reasonId: string;
}

/**
 * Automatically analyzes content structure, categories, layouts, and media
 * of consecutive slides to recommend the most narrative-fluent transition effect.
 */
export function recommendTransition(
  prevSlide: SlideData | null,
  currSlide: SlideData
): SmartTransitionRecommendation {
  if (!prevSlide) {
    return {
      recommendedTransition: "fade",
      reasonKo: "프레젠테이션의 첫 번째 슬라이드는 부드러운 페이드(Fade) 효과로 시작하는 것이 정석입니다.",
      reasonId: "Slide pertama dalam presentasi sebaiknya dimulai dengan efek fade yang lembut."
    };
  }

  // 1. Zoom recommendation (Full image or Key Stats focus)
  const isImageShowcase = currSlide.layout === "full-image" || (currSlide.image && currSlide.layout === "split-info");
  const isMetricsShowcase = currSlide.layout === "key-stats" || (currSlide.stats && currSlide.stats.length > 0);
  if (isImageShowcase || isMetricsShowcase) {
    return {
      recommendedTransition: "zoom",
      reasonKo: "핵심 수치나 고화질 비주얼 강조 레이아웃으로, 시각적 초점을 유도하는 줌(Zoom) 효과가 자연스럽습니다.",
      reasonId: "Tata letak visual resolusi tinggi atau statistik angka cocok menggunakan efek Zoom untuk memusatkan perhatian."
    };
  }

  // 2. Flip recommendation (Tables & comparative structures)
  const currIsTable = currSlide.layout === "delegation-table" || currSlide.layout === "schedule-table" || currSlide.delegates || currSlide.schedule;
  if (currIsTable) {
    return {
      recommendedTransition: "flip",
      reasonKo: "공식 일정 정보 또는 기관 대표 명단 테이블의 경우, 책장을 넘기는 듯한 입체적인 플립(Flip) 효과로 시트를 전환합니다.",
      reasonId: "Untuk struktur data tabel atau jadwal resmi, efek Flip (putar 3D) sangat cocok untuk transisi lembar data yang rapi."
    };
  }

  // 3. Slide-In recommendation (Chronological processes or category continuations)
  const isProcessFlow = currSlide.layout === "process-3" || currSlide.processStages;
  const isSameCategory = prevSlide.categoryKo && currSlide.categoryKo && prevSlide.categoryKo === currSlide.categoryKo;
  if (isProcessFlow || isSameCategory) {
    return {
      recommendedTransition: "slide-in",
      reasonKo: "이전 슬라이드와 동일한 세션 카테고리 혹은 단계적 프로세스 흐름이므로, 방향 전환용 슬라이드(Slide-In)를 권장합니다.",
      reasonId: "Menampilkan topik yang sama atau tahap linier yang berlanjut, disarankan menggunakan efek Slide-In untuk menjaga kontinuitas."
    };
  }

  // 4. Wipe recommendation (Structural break or section intro)
  const isStructuralBreak = currSlide.layout === "cover" || currSlide.layout === "overview";
  if (isStructuralBreak) {
    return {
      recommendedTransition: "wipe",
      reasonKo: "대단원 세션 표지 혹은 종합 대시보드 브레이크이므로, 화면을 쓸어넘기는 와이프(Wipe) 효과로 맥락을 새롭게 환기합니다.",
      reasonId: "Sebagai pembatas sesi utama atau Overview break, efek Wipe sangat pas untuk memberikan penyegaran visual yang terstruktur."
    };
  }

  // 5. Default: Fade (Safe, elegant, topic changes)
  return {
    recommendedTransition: "fade",
    reasonKo: "상이한 주제 또는 텍스트 중심 구조로 변화하므로, 흐름을 끊지 않는 부드러운 디졸브 페이드(Fade) 효과를 추천합니다.",
    reasonId: "Perubahan topik atau struktur informasi teks baru, disarankan menggunakan efek Fade yang paling stabil dan netral."
  };
}
