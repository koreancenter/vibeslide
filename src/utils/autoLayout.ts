import { SlideData, SlideLayout, AutoLayoutAnalysis } from "../types";

/**
 * Calculates text statistics and performs real-time visual balance analysis
 * to recommend the optimal 16:9 presentation layout based on text length and structure.
 */
export function analyzeSlideLayout(slide: SlideData): AutoLayoutAnalysis {
  // 1. Calculate character and word lengths across Korean and Indonesian text
  const titleLenKo = (slide.titleKo || "").trim().length;
  const titleLenId = (slide.titleId || "").trim().length;
  const subtitleLenKo = (slide.subtitleKo || "").trim().length;
  const subtitleLenId = (slide.subtitleId || "").trim().length;
  const calloutLenKo = (slide.calloutKo || "").trim().length;
  const calloutLenId = (slide.calloutId || "").trim().length;

  let bulletsLenKo = 0;
  let bulletsLenId = 0;
  const bulletCount = slide.bullets?.length || 0;

  if (slide.bullets) {
    slide.bullets.forEach((b) => {
      bulletsLenKo += (b.titleKo || "").length + (b.descKo || "").length + (b.tagKo || "").length;
      bulletsLenId += (b.titleId || "").length + (b.descId || "").length + (b.tagId || "").length;
    });
  }

  let processLenKo = 0;
  let processLenId = 0;
  const processCount = slide.processStages?.length || 0;
  if (slide.processStages) {
    slide.processStages.forEach((s) => {
      processLenKo += (s.titleKo || "").length + (s.descKo || "").length + (s.badgeKo || "").length;
      processLenId += (s.titleId || "").length + (s.descId || "").length + (s.badgeId || "").length;
      s.bulletsKo?.forEach((b) => (processLenKo += b.length));
      s.bulletsId?.forEach((b) => (processLenId += b.length));
    });
  }

  const delegateCount = slide.delegates?.length || 0;
  const scheduleCount = slide.schedule?.length || 0;
  const statCount = slide.stats?.length || 0;
  const hasImage = Boolean(slide.image && slide.image.url && slide.image.url.trim().length > 0);
  const hasStats = statCount > 0;
  const hasTable = delegateCount > 0 || scheduleCount > 0;

  const totalLengthKo = titleLenKo + subtitleLenKo + calloutLenKo + bulletsLenKo + processLenKo;
  const totalLengthId = titleLenId + subtitleLenId + calloutLenId + bulletsLenId + processLenId;

  // Use the primary length (or average) for density estimation
  const effectiveLength = Math.max(totalLengthKo, totalLengthId * 0.85);

  // 2. Determine Text Density Category
  let textDensity: "minimal" | "compact" | "moderate" | "dense" | "heavy";
  if (effectiveLength < 90 && bulletCount <= 1) {
    textDensity = "minimal";
  } else if (effectiveLength < 260 && bulletCount <= 3) {
    textDensity = "compact";
  } else if (effectiveLength < 500) {
    textDensity = "moderate";
  } else if (effectiveLength < 850) {
    textDensity = "dense";
  } else {
    textDensity = "heavy";
  }

  // 3. Layout Determination Heuristics
  let recommendedLayout: SlideLayout = "cards-3";
  let reasonKo = "";
  let reasonId = "";
  const alternatives: {
    layout: SlideLayout;
    labelKo: string;
    labelId: string;
    fitScore: number;
  }[] = [];

  // Special structures check first
  if (slide.layout === "cover" || (slide.categoryKo?.includes("표지") && effectiveLength < 120)) {
    recommendedLayout = "cover";
    reasonKo = "공식 문서 번호와 주최 기관 명시가 적합한 마스터 표지 구조입니다.";
    reasonId = "Struktur sampul master yang sesuai untuk dokumen resmi.";
    alternatives.push(
      { layout: "full-image", labelKo: "풀 이미지 비주얼", labelId: "Gambar Penuh", fitScore: 88 },
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom Kartu", fitScore: 70 }
    );
  } else if (delegateCount >= 3) {
    recommendedLayout = "delegation-table";
    reasonKo = `${delegateCount}개 대학 및 대표단 데이터가 포함되어 표 레이아웃이 가독성에 가장 최적입니다.`;
    reasonId = `Data ${delegateCount} delegasi paling optimal ditampilkan dalam bentuk tabel.`;
    alternatives.push(
      { layout: "cards-2", labelKo: "2단 카드", labelId: "2 Kolom", fitScore: 65 },
      { layout: "general", labelKo: "일반 목록", labelId: "Daftar Umum", fitScore: 60 }
    );
  } else if (scheduleCount >= 3) {
    recommendedLayout = "schedule-table";
    reasonKo = `${scheduleCount}개 일정 항목이 등록되어 타임라인 표 구조가 직관적인 전달력을 제공합니다.`;
    reasonId = `${scheduleCount} agenda jadwal paling jelas ditampilkan dalam tabel linimasa.`;
    alternatives.push(
      { layout: "process-3", labelKo: "3단계 프로세스", labelId: "Proses 3 Tahap", fitScore: 72 },
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom Kartu", fitScore: 65 }
    );
  } else if (processCount >= 2 && processCount <= 4) {
    recommendedLayout = "process-3";
    reasonKo = "단계별(Step-by-step) 이행 로드맵 데이터로 3단계 플로우 레이아웃이 가장 이상적입니다.";
    reasonId = "Data alur bertahap paling ideal disajikan dalam tata letak proses 3 tahap.";
    alternatives.push(
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom", fitScore: 84 },
      { layout: "action-items", labelKo: "실행 과제", labelId: "Rencana Aksi", fitScore: 80 }
    );
  } else if (hasStats && statCount >= 3 && hasImage) {
    recommendedLayout = "split-info";
    reasonKo = "핵심 수치 지표와 이미지, 설명 불릿이 고르게 분포되어 3단 분할(Split Info) 레이아웃이 균형적입니다.";
    reasonId = "Kombinasi metrik, gambar, dan deskripsi paling seimbang dalam tata letak Split Info.";
    alternatives.push(
      { layout: "overview", labelKo: "지표 개요", labelId: "Ringkasan Metrik", fitScore: 90 },
      { layout: "key-stats", labelKo: "핵심 KPI", labelId: "Metrik Utama", fitScore: 82 }
    );
  } else if (hasStats && statCount >= 3 && effectiveLength < 250) {
    recommendedLayout = "key-stats";
    reasonKo = "수치 데이터 비중이 높고 텍스트가 간결하여 4대 대형 KPI 쇼케이스가 시각적 임팩트를 극대화합니다.";
    reasonId = "Proporsi data angka tinggi dengan teks ringkas sangat cocok untuk KPI besar.";
    alternatives.push(
      { layout: "overview", labelKo: "지표 개요", labelId: "Overview", fitScore: 88 },
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom", fitScore: 74 }
    );
  } else if (textDensity === "minimal") {
    // Very short text (< 90 chars) -> Full Image or Key Summary
    recommendedLayout = "full-image";
    reasonKo = "텍스트 분량이 매우 간결하여, 3단 카드 사용 시 빈 공간이 발생할 수 있습니다. 16:9 풀 이미지 레이아웃으로 시각적 웅장함과 전달력을 극대화하는 것을 권장합니다.";
    reasonId = "Teks sangat ringkas. Tata letak Gambar Penuh (Full Image) mencegah ruang kosong dan memberikan dampak visual maksimal.";
    alternatives.push(
      { layout: "cards-2", labelKo: "2단 카드", labelId: "2 Kolom", fitScore: 82 },
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom", fitScore: 68 },
      { layout: "general", labelKo: "일반 슬라이드", labelId: "Umum", fitScore: 60 }
    );
  } else if (textDensity === "compact") {
    // 80~250 chars -> cards-3 or action-items
    recommendedLayout = "cards-3";
    reasonKo = "3개의 간결한 불릿 포인트와 적정 텍스트 길이(250자 이내)로, 3단 균등 분할 카드(cards-3)가 가장 완벽한 16:9 황금 비율 밸런스를 이룹니다.";
    reasonId = "Panjang teks ringkas (3 poin) sangat presisi untuk tata letak 3 Kolom Kartu (cards-3).";
    alternatives.push(
      { layout: "action-items", labelKo: "실행 과제 3개", labelId: "Rencana Aksi", fitScore: 92 },
      { layout: "cards-2", labelKo: "2단 카드", labelId: "2 Kolom", fitScore: 80 },
      { layout: "full-image", labelKo: "풀 이미지", labelId: "Full Image", fitScore: 75 }
    );
  } else if (textDensity === "moderate" || textDensity === "dense") {
    // 250~800 chars -> cards-2 (spacious 2 columns prevent vertical overflow)
    if (bulletCount === 2) {
      recommendedLayout = "cards-2";
      reasonKo = "2개의 세부 설명 블록으로 구성되어 넓은 2열 카드(cards-2)가 문장 줄바꿈과 여백 가독성을 확보합니다.";
      reasonId = "2 blok penjelasan detail sangat pas dalam tata letak 2 Kolom luas.";
    } else if (hasImage) {
      recommendedLayout = "split-info";
      reasonKo = "상세한 텍스트와 보조 이미지가 결합되어 있어 분할 정보(Split-Info)가 시각적 과밀을 방지합니다.";
      reasonId = "Teks deskriptif dengan gambar pendukung paling proporsional dalam Split-Info.";
    } else {
      recommendedLayout = "cards-2";
      reasonKo = "텍스트 분량이 풍부하여 3단 카드로 배치할 경우 카드 내부가 답답해질 수 있습니다. 넓은 2단 카드(cards-2)로 여백과 폰트 크기를 유지하는 것이 최적입니다.";
      reasonId = "Volume teks cukup panjang. 2 Kolom mencegah pemadatan teks dan menjaga keterbacaan.";
    }
    alternatives.push(
      { layout: "cards-3", labelKo: "3단 카드", labelId: "3 Kolom", fitScore: 74 },
      { layout: "general", labelKo: "일반 서술", labelId: "Umum", fitScore: 82 },
      { layout: "action-items", labelKo: "실행 과제", labelId: "Rencana Aksi", fitScore: 70 }
    );
  } else {
    // Heavy text
    recommendedLayout = "cards-2";
    reasonKo = "텍스트 정보량이 많아 2단 분할 또는 리스트형 배치가 16:9 슬라이드 화면 밖으로 넘치지 않도록 방지합니다.";
    reasonId = "Teks sangat padat, tata letak 2 kolom mencegah teks meluap keluar layar 16:9.";
    alternatives.push(
      { layout: "general", labelKo: "일반 서술", labelId: "Umum", fitScore: 85 },
      { layout: "split-info", labelKo: "분할 정보", labelId: "Split Info", fitScore: 78 }
    );
  }

  // Calculate Visual Balance Score (0 to 100)
  const isOptimal = slide.layout === recommendedLayout;
  let balanceScore = 95;

  if (!isOptimal) {
    // If layout is cards-3 but text is minimal (e.g. < 80 chars)
    if (slide.layout === "cards-3" && textDensity === "minimal") {
      balanceScore = 58; // Sparse empty cards defect
    } else if (slide.layout === "full-image" && (textDensity === "dense" || textDensity === "heavy")) {
      balanceScore = 52; // Text cluttering hero image defect
    } else if (slide.layout === "cards-3" && textDensity === "heavy") {
      balanceScore = 64; // Text overflowing narrow columns
    } else {
      balanceScore = 78;
    }
  } else {
    balanceScore = 96;
  }

  return {
    recommendedLayout,
    currentLayout: slide.layout,
    isOptimal,
    textDensity,
    totalLengthKo,
    totalLengthId,
    bulletCount,
    hasImage,
    hasStats,
    hasTable,
    balanceScore,
    reasonKo,
    reasonId,
    alternatives,
  };
}
