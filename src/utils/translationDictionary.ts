/**
 * High-fidelity local dictionary and fallback translation engine for offline / deterministic mode.
 */

export const DICTIONARY_KO_TO_ID: Record<string, string> = {
  "KIND 2026 마스터 플랜": "KIND 2026 Master Plan",
  "KIND 2026 실행 계획": "Rencana Pelaksanaan KIND 2026",
  "한-인도네시아 네트워킹 데이": "Korea-Indonesia Networking Day (KIND)",
  "한-인도네시아": "Korea-Indonesia",
  "산학 협력": "Kerjasama Industri-Akademisi",
  "산학협력": "Kerjasama Industri-Akademisi",
  "고등직업교육": "Pendidikan Vokasi Tinggi",
  "고등 교육": "Pendidikan Tinggi",
  "직업교육": "Pendidikan Vokasi",
  "양해각서": "Nota Kesepahaman (MoU)",
  "지자체 연계형": "Kemitraan Pemerintah Daerah",
  "지자체": "Pemerintah Daerah",
  "주요 과제": "Tugas Utama",
  "추진 방향": "Arah Kebijakan",
  "기대 효과": "Dampak yang Diharapkan",
  "발표자 참고": "Catatan Pembicara",
  "슬라이드": "Slide",
  "개요": "Ringkasan",
  "협약 체결": "Penandatanganan Perjanjian",
  "정부 비자": "Visa Pemerintah",
  "비자 모델": "Model Visa",
  "기업 연계": "Kemitraan Industri",
  "인적 교류": "Pertukaran Sumber Daya Manusia",
  "교류 프로그램": "Program Pertukaran",
  "글로벌 협력": "Kerjasama Global",
  "주요 포인트": "Poin Utama",
  "실시간": "Realtime",
  "동기화": "Sinkronisasi",
  "실시간 가져온 콘텐츠입니다": "Konten diambil secara real-time",
  "Google Drive 동기화": "Sinkronisasi Google Drive",
  "마스터 플랜": "Master Plan",
  "원시 데이터 기반 프레젠테이션": "Presentasi Berbasis Data Mentah",
  "비자 연계": "Kemitraan Visa",
};

export const DICTIONARY_ID_TO_KO: Record<string, string> = {};
for (const [ko, id] of Object.entries(DICTIONARY_KO_TO_ID)) {
  DICTIONARY_ID_TO_KO[id.toLowerCase()] = ko;
}

export const DICTIONARY_TO_JA: Record<string, string> = {
  // Title & Themes
  "KIND 2026 마스터 플랜": "KIND 2026 マスタープラン",
  "KIND 2026 Master Plan": "KIND 2026 マスタープラン",
  "KIND 2026 실행 계획": "KIND 2026 実行計画",
  "Rencana Pelaksanaan KIND 2026": "KIND 2026 実行計画",
  "Korea-Indonesia Networking Day 2026": "韓国・インドネシア ネットワーキングデー 2026",
  "한-인도네시아 네트워킹 데이": "韓国・インドネシア ネットワーキングデー",
  "한-인도네시아": "韓国・インドネシア",
  "Korea-Indonesia": "韓国・インドネシア",
  "공식 마스터 플랜": "公式マスタープラン",
  "Rencana Induk Resmi": "公式マスタープラン",
  "Global Strategic Partnership": "グローバル戦略的パートナーシップ",
  "Official Master Execution Plan": "公式マスター実行計画",
  "KIND 2026 마스터 실행 계획서 : 한-인니 고등직업교육·지자체·기업 연계 글로벌 협력":
    "KIND 2026 マスター実行計画書：韓・尼 高等職業教育・自治体・企業連携グローバル協力",
  "Master Plan KIND 2026 : Kerjasama Global Pendidikan Vokasi, Pemerintah Daerah, dan Industri Korea-Indonesia":
    "KIND 2026 マスター実行計画書：韓・尼 高等職業教育・自治体・企業連携グローバル協力",

  // Organizations & Centers
  "한국센터글로벌네트워크": "韓国センターグローバルネットワーク",
  "Korean Center Global Network": "韓国センターグローバルネットワーク",
  "IPBI대학교 한국센터": "IPBI大学 韓国センター",
  "Pusat Bahasa Korea Universitas IPBI": "IPBI大学 韓国センター",
  "글로벌미래고등교육원": "グローバル未来高等教育院",
  "Global Future Higher Education Institute": "グローバル未来高等教育院",
  "양국 유학·인력 송출 시장의 독보적 허브 (한국본사 부천 / 인니본부 발리)":
    "両国留学・人材輩出市場の基幹ハブ（韓国本社 富川 / インドネシア本部 バリ）",
  "발리 현지 한국어 집중 교육 및 사전 입학 검증 수행 기관":
    "バリ現地韓国語集中教育および事前入学審査実施機関",
  "한-인니 고등교육 학위 연계 및 산학 협력 프로그램 총괄":
    "韓・尼 高等教育学位連携および産学連携プログラム総括",

  // Sections & Schedules
  "1. 행사 개요 및 종합 추진 계획": "1. 行事概要および総合推進計画",
  "1. Ringkasan Acara & Rencana Komprehensif": "1. 行事概要および総合推進計画",
  "행사 개요 및 종합 추진 일정": "行事概要および総合推進日程",
  "Ringkasan Acara dan Jadwal Pelaksanaan Komprehensif": "行事概要および総合推進日程",
  "2개 차수 총 16개 국립폴리테크닉 29명 총장단 방한 및 수도권·중부권 거점 집중":
    "2回にわたり計16校の国立ポリテクニック学長団29名が訪韓、首都圏および中部地域に集中",
  "1차 방한단 규모": "第1次 訪韓団規模",
  "Delegasi Gelombang 1": "第1次 訪韓団規模",
  "2차 방한단 규모": "第2次 訪韓団規模",
  "Delegasi Gelombang 2": "第2次 訪韓団規模",
  "방문 핵심 권역": "主要訪問地域",
  "Wilayah Kunjungan Utama": "主要訪問地域",
  "주최 및 주관": "主催および主管",
  "Penyelenggara Utama": "主催および主管",
  "14개 대학 26명": "14大学 26名",
  "2개 대학 3명": "2大学 3名",
  "서울·충주·경기북부": "ソウル・忠州・京畿北部",
  "3개 기관 공동": "3機関共同",
  "추진 계획": "推進計画",
  "Rencana Pelaksanaan": "推進計画",

  // General Terms
  "산학 협력": "産学連携",
  "산학협력": "産学連携",
  "고등직업교육": "高等職業教育",
  "고등 교육": "高等教育",
  "직업교육": "職業教育",
  "양해각서": "基本合意書 (MoU)",
  "지자체 연계형": "自治体連携型",
  "지자체": "自治体",
  "주요 과제": "主要課題",
  "추진 방향": "推進方針",
  "기대 효과": "期待される効果",
  "발표자 참고": "発表者ノート",
  "슬라이드": "スライド",
  "개요": "概要",
  "협약 체결": "協定締結",
  "정부 비자": "政府ビザ",
  "비자 모델": "ビザモデル",
  "기업 연계": "企業連携",
  "인적 교류": "人的交流",
  "교류 프로그램": "交流プログラム",
  "글로벌 협력": "グローバル協力",
  "주요 포인트": "重要ポイント",
  "실시간": "リアルタイム",
  "동기화": "同期",
  "신규 섹션": "新規セクション",
  "새로운 슬라이드 제목": "新しいスライドのタイトル",
  "슬라이드의 핵심 메시지와 세부 실행 방안을 기술하세요.": "スライドのキーメッセージと詳細な実行計画を記述してください。",
  "핵심 실행 항목 1": "重要実行項目 1",
  "핵심 실행 항목 2": "重要実行項目 2",
  "상세 실행 방안 및 협력 대학·기관과의 연계 사항입니다.": "詳細な実行計画および提携大学・機関との連携事項です。",
  "기대 효과 및 비자·장학 제도와의 결합 모델입니다.": "期待される効果およびビザ・奨学金制度との連携モデルです。",
  "새로 추가된 슬라이드에 대한 발표자 노트입니다.": "新しく追加されたスライドの発表者ノートです。",
};

export function getJapaneseFallbackText(text: string): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (DICTIONARY_TO_JA[trimmed]) {
    return DICTIONARY_TO_JA[trimmed];
  }

  let result = trimmed;
  // Sort keys by length descending to replace compound phrases first
  const sortedKeys = Object.keys(DICTIONARY_TO_JA).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (result.includes(key)) {
      result = result.split(key).join(DICTIONARY_TO_JA[key]);
    }
  }
  return result;
}

export function getLocalFallbackTranslation(text: string, sourceLang: string, targetLang: string): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();

  if (targetLang === "id") {
    if (DICTIONARY_KO_TO_ID[trimmed]) {
      return DICTIONARY_KO_TO_ID[trimmed];
    }
    let result = trimmed;
    for (const [ko, id] of Object.entries(DICTIONARY_KO_TO_ID)) {
      const escaped = ko.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escaped, "g");
      result = result.replace(regex, id);
    }
    return result;
  } else {
    const lowerTrimmed = trimmed.toLowerCase();
    if (DICTIONARY_ID_TO_KO[lowerTrimmed]) {
      return DICTIONARY_ID_TO_KO[lowerTrimmed];
    }
    let result = trimmed;
    const sortedIdKeys = Object.keys(DICTIONARY_ID_TO_KO).sort((a, b) => b.length - a.length);
    for (const idKey of sortedIdKeys) {
      const escaped = idKey.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      result = result.replace(regex, DICTIONARY_ID_TO_KO[idKey]);
    }
    return result;
  }
}

export function translateSlideLocalFallback(slide: any, targetLang: string) {
  if (!slide || typeof slide !== "object") return slide;
  const isToIndonesian = targetLang === "id";
  const result = { ...slide };

  if (targetLang === "ja") {
    if (!result.titleJa) {
      result.titleJa = getJapaneseFallbackText(result.titleKo || result.titleId);
    }
    if (!result.subtitleJa) {
      result.subtitleJa = getJapaneseFallbackText(result.subtitleKo || result.subtitleId);
    }
    if (!result.categoryJa) {
      result.categoryJa = getJapaneseFallbackText(result.categoryKo || result.categoryId);
    }
    if (!result.notesJa) {
      result.notesJa = getJapaneseFallbackText(result.notesKo || result.notesId);
    }
    if (!result.calloutJa) {
      result.calloutJa = getJapaneseFallbackText(result.calloutKo || result.calloutId);
    }
    if (Array.isArray(result.bullets)) {
      result.bullets = result.bullets.map((b: any) => ({
        ...b,
        titleJa: b.titleJa || getJapaneseFallbackText(b.titleKo || b.titleId),
        descJa: b.descJa || getJapaneseFallbackText(b.descKo || b.descId),
        tagJa: b.tagJa || getJapaneseFallbackText(b.tagKo || b.tagId),
      }));
    }
    if (Array.isArray(result.stats)) {
      result.stats = result.stats.map((s: any) => ({
        ...s,
        labelJa: s.labelJa || getJapaneseFallbackText(s.labelKo || s.labelId),
        unitJa: s.unitJa || getJapaneseFallbackText(s.unitKo || s.unitId),
        subJa: s.subJa || getJapaneseFallbackText(s.subKo || s.subId),
      }));
    }
  } else if (isToIndonesian) {
    if (!result.titleId && result.titleKo) {
      result.titleId = getLocalFallbackTranslation(result.titleKo, "ko", "id");
    }
    if (!result.subtitleId && result.subtitleKo) {
      result.subtitleId = getLocalFallbackTranslation(result.subtitleKo, "ko", "id");
    }
    if (!result.categoryId && result.categoryKo) {
      result.categoryId = getLocalFallbackTranslation(result.categoryKo, "ko", "id");
    }
    if (!result.notesId && result.notesKo) {
      result.notesId = getLocalFallbackTranslation(result.notesKo, "ko", "id");
    }
    if (!result.calloutId && result.calloutKo) {
      result.calloutId = getLocalFallbackTranslation(result.calloutKo, "ko", "id");
    }

    if (Array.isArray(result.bullets)) {
      result.bullets = result.bullets.map((b: any) => {
        const nb = { ...b };
        if (!nb.titleId && nb.titleKo) {
          nb.titleId = getLocalFallbackTranslation(nb.titleKo, "ko", "id");
        }
        if (!nb.descId && nb.descKo) {
          nb.descId = getLocalFallbackTranslation(nb.descKo, "ko", "id");
        }
        if (!nb.tagId && nb.tagKo) {
          nb.tagId = getLocalFallbackTranslation(nb.tagKo, "ko", "id");
        }
        return nb;
      });
    }

    if (Array.isArray(result.stats)) {
      result.stats = result.stats.map((s: any) => {
        const ns = { ...s };
        if (!ns.labelId && ns.labelKo) {
          ns.labelId = getLocalFallbackTranslation(ns.labelKo, "ko", "id");
        }
        if (!ns.unitId && ns.unitKo) {
          ns.unitId = getLocalFallbackTranslation(ns.unitKo, "ko", "id");
        }
        return ns;
      });
    }
  } else {
    if (!result.titleKo && result.titleId) {
      result.titleKo = getLocalFallbackTranslation(result.titleId, "id", "ko");
    }
    if (!result.subtitleKo && result.subtitleId) {
      result.subtitleKo = getLocalFallbackTranslation(result.subtitleId, "id", "ko");
    }
    if (!result.categoryKo && result.categoryId) {
      result.categoryKo = getLocalFallbackTranslation(result.categoryId, "id", "ko");
    }
    if (!result.notesKo && result.notesId) {
      result.notesKo = getLocalFallbackTranslation(result.notesId, "id", "ko");
    }
    if (!result.calloutKo && result.calloutId) {
      result.calloutKo = getLocalFallbackTranslation(result.calloutId, "id", "ko");
    }

    if (Array.isArray(result.bullets)) {
      result.bullets = result.bullets.map((b: any) => {
        const nb = { ...b };
        if (!nb.titleKo && nb.titleId) {
          nb.titleKo = getLocalFallbackTranslation(nb.titleId, "id", "ko");
        }
        if (!nb.descKo && nb.descId) {
          nb.descKo = getLocalFallbackTranslation(nb.descId, "id", "ko");
        }
        if (!nb.tagKo && nb.tagId) {
          nb.tagKo = getLocalFallbackTranslation(nb.tagId, "id", "ko");
        }
        return nb;
      });
    }

    if (Array.isArray(result.stats)) {
      result.stats = result.stats.map((s: any) => {
        const ns = { ...s };
        if (!ns.labelKo && ns.labelId) {
          ns.labelKo = getLocalFallbackTranslation(ns.labelId, "id", "ko");
        }
        if (!ns.unitKo && ns.unitId) {
          ns.unitKo = getLocalFallbackTranslation(ns.unitId, "id", "ko");
        }
        return ns;
      });
    }
  }

  return result;
}
