import { SlideData, SlideLayout, BulletItem, StatItem } from "../types";

export interface MorphCommandMatch {
  matched: boolean;
  targetLayout?: SlideLayout;
  actionDescription?: string;
  isChartMorph?: boolean;
}

/**
 * Detects whether the user's natural language command asks to morph
 * the current slide into a different layout (e.g. chart-donut, chart-bar,
 * chart-line, chart-waterfall, key-stats, cards-3, cards-2, process-3,
 * comparison-table, split-info, full-image).
 */
export function detectLayoutMorphCommand(prompt: string): MorphCommandMatch {
  const p = prompt.toLowerCase().trim();

  // 1. Donut / Oval / Pie chart morph
  // "도넛 그래프로 변환해줘", "타원형 그래프로 변환해줘", "파이 차트로 바꿔줘", "원형 그래프"
  if (
    p.includes("타원") ||
    p.includes("도넛") ||
    p.includes("원형") ||
    p.includes("파이") ||
    p.includes("donut") ||
    p.includes("pie")
  ) {
    if (
      p.includes("그래프") ||
      p.includes("차트") ||
      p.includes("변환") ||
      p.includes("바꿔") ||
      p.includes("만들어") ||
      p.includes("chart") ||
      p.includes("morph")
    ) {
      return {
        matched: true,
        targetLayout: "chart-donut",
        actionDescription: "도넛(타원형) 차트로 레이아웃 변환",
        isChartMorph: true,
      };
    }
  }

  // 2. Bar / Column chart morph
  // "막대 그래프로 변환해줘", "바 차트로 바꿔줘", "기둥 그래프"
  if (
    p.includes("막대") ||
    p.includes("바 차트") ||
    p.includes("바차트") ||
    p.includes("막대그래프") ||
    p.includes("column chart") ||
    p.includes("bar chart")
  ) {
    return {
      matched: true,
      targetLayout: "chart-bar",
      actionDescription: "막대(Bar) 차트로 레이아웃 변환",
      isChartMorph: true,
    };
  }

  // 3. Line / Trend chart morph
  // "선 그래프로 변환해줘", "꺾은선", "라인 차트", "추세선"
  if (
    p.includes("선 그래프") ||
    p.includes("선그래프") ||
    p.includes("꺾은선") ||
    p.includes("라인 차트") ||
    p.includes("라인차트") ||
    p.includes("line chart") ||
    p.includes("추세 그래프")
  ) {
    return {
      matched: true,
      targetLayout: "chart-line",
      actionDescription: "선(Line) 추세 차트로 레이아웃 변환",
      isChartMorph: true,
    };
  }

  // 4. Waterfall chart morph
  // "폭포수 차트", "워터폴", "누적 폭포수"
  if (
    p.includes("폭포수") ||
    p.includes("워터폴") ||
    p.includes("waterfall")
  ) {
    return {
      matched: true,
      targetLayout: "chart-waterfall",
      actionDescription: "폭포수(Waterfall) 차트로 레이아웃 변환",
      isChartMorph: true,
    };
  }

  // 5. Key stats / KPI cards
  // "수치 지표로 변환해줘", "kpi 카드로 변환", "4대 지표", "통계 카드로"
  if (
    p.includes("kpi") ||
    p.includes("수치 지표") ||
    p.includes("통계 카드") ||
    p.includes("핵심 지표") ||
    p.includes("key-stats") ||
    p.includes("숫자 카드")
  ) {
    return {
      matched: true,
      targetLayout: "key-stats",
      actionDescription: "핵심 KPI 수치 카드로 변환",
      isChartMorph: false,
    };
  }

  // 6. Process-3 / Step-by-step
  // "3단계 프로세스로", "스텝별 흐름으로", "단계별 실행"
  if (
    p.includes("3단계 프로세스") ||
    p.includes("3단계 순차") ||
    p.includes("단계별 프로세스") ||
    p.includes("순차 실행") ||
    p.includes("step 1") ||
    p.includes("로드맵 플로우")
  ) {
    return {
      matched: true,
      targetLayout: "process-3",
      actionDescription: "3단계 순차 실행 프로세스로 변환",
      isChartMorph: false,
    };
  }

  // 7. Comparison Table / Matrix
  // "비교표로 변환해줘", "테이블로 변환", "대조표로 바꿔줘", "표로 만들어줘"
  if (
    p.includes("비교표") ||
    p.includes("대조표") ||
    p.includes("표 형태로") ||
    p.includes("표로 변환") ||
    p.includes("테이블로") ||
    p.includes("comparison table") ||
    p.includes("matrix")
  ) {
    return {
      matched: true,
      targetLayout: "comparison-table",
      actionDescription: "비교 대조 테이블(Table)로 변환",
      isChartMorph: false,
    };
  }

  // 8. Cards-3 / Cards-2
  if (p.includes("3단 카드") || p.includes("3열 카드") || p.includes("3개 카드")) {
    return {
      matched: true,
      targetLayout: "cards-3",
      actionDescription: "3열 균등 카드로 변환",
      isChartMorph: false,
    };
  }
  if (p.includes("2단 카드") || p.includes("2열 카드") || p.includes("2개 카드") || p.includes("좌우 2열")) {
    return {
      matched: true,
      targetLayout: "cards-2",
      actionDescription: "2열 와이드 카드로 변환",
      isChartMorph: false,
    };
  }

  // 9. Split info (split with image)
  if (p.includes("분할형") || p.includes("split-info") || p.includes("분할 정보") || p.includes("우측 이미지 분할")) {
    return {
      matched: true,
      targetLayout: "split-info",
      actionDescription: "텍스트-이미지 분할형(Split-Info)으로 변환",
      isChartMorph: false,
    };
  }

  // 10. Full image
  if (p.includes("전면 배경") || p.includes("풀 이미지") || p.includes("full-image") || p.includes("히어로 슬라이드")) {
    return {
      matched: true,
      targetLayout: "full-image",
      actionDescription: "전면 비주얼 히어로 슬라이드로 변환",
      isChartMorph: false,
    };
  }

  return { matched: false };
}

/**
 * Intelligently transforms existing slide data to match the target layout
 * without data loss. Re-shapes bullets into numerical values, extracts stats
 * into charts or tables, and ensures bilingual integrity.
 */
export function morphSlideToLayout(
  slide: SlideData,
  targetLayout: SlideLayout
): SlideData {
  const updated: SlideData = JSON.parse(JSON.stringify(slide));
  updated.layout = targetLayout;

  // Case A: Morphing into Chart (bar, line, donut, waterfall)
  if (["chart-bar", "chart-line", "chart-donut", "chart-waterfall"].includes(targetLayout)) {
    // If slide has stats but no bullets with numbers, convert stats into bullets for chart consumption
    if (Array.isArray(updated.stats) && updated.stats.length > 0) {
      const statsAsBullets: BulletItem[] = updated.stats.map((st, i) => {
        const num = parseFloat((st.value || "").replace(/[^0-9.-]/g, "")) || (i + 1) * 25;
        const unit = st.unitKo || "";
        return {
          id: `chart-b-${i}-${Date.now()}`,
          titleKo: st.labelKo || `항목 ${i + 1}`,
          titleId: st.labelId || `Item ${i + 1}`,
          descKo: `${num}${unit}`,
          descId: `${num}${st.unitId || unit}`,
        };
      });
      // If bullets are empty or non-numeric, use stats
      const hasNumericBullets = updated.bullets?.some(b => /[0-9]/.test(b.descKo || ""));
      if (!hasNumericBullets) {
        updated.bullets = statsAsBullets;
      }
    }

    // Ensure all bullets have numeric values in descKo for the chart renderer
    if (Array.isArray(updated.bullets) && updated.bullets.length > 0) {
      updated.bullets = updated.bullets.map((b, idx) => {
        const rawDesc = b.descKo || "";
        const hasNumber = /[0-9]/.test(rawDesc);
        if (!hasNumber) {
          // Assign meaningful balanced sample percentages if missing
          const defaultVals = [45, 30, 15, 10];
          const assignedVal = defaultVals[idx % defaultVals.length] || 20;
          return {
            ...b,
            descKo: `${assignedVal}%`,
            descId: `${assignedVal}%`,
          };
        }
        return b;
      });
    } else {
      // Create rich default chart items matching the slide topic
      const topic = updated.titleKo || "핵심 지표";
      updated.bullets = [
        {
          id: `b-c1-${Date.now()}`,
          titleKo: `${topic} A`,
          titleId: `${updated.titleId || 'Item'} A`,
          descKo: "45%",
          descId: "45%",
        },
        {
          id: `b-c2-${Date.now()}`,
          titleKo: `${topic} B`,
          titleId: `${updated.titleId || 'Item'} B`,
          descKo: "30%",
          descId: "30%",
        },
        {
          id: `b-c3-${Date.now()}`,
          titleKo: `${topic} C`,
          titleId: `${updated.titleId || 'Item'} C`,
          descKo: "15%",
          descId: "15%",
        },
        {
          id: `b-c4-${Date.now()}`,
          titleKo: `${topic} D`,
          titleId: `${updated.titleId || 'Item'} D`,
          descKo: "10%",
          descId: "10%",
        },
      ];
    }
    return updated;
  }

  // Case B: Morphing into key-stats (KPI cards)
  if (targetLayout === "key-stats") {
    if (!Array.isArray(updated.stats) || updated.stats.length === 0) {
      if (Array.isArray(updated.bullets) && updated.bullets.length > 0) {
        updated.stats = updated.bullets.slice(0, 4).map((b, i) => {
          const numMatch = (b.descKo || "").match(/[0-9,.]+/);
          const val = numMatch ? numMatch[0] : `${(i + 1) * 25}%`;
          return {
            labelKo: b.titleKo || `지표 ${i + 1}`,
            labelId: b.titleId || `Indikator ${i + 1}`,
            value: val,
            subKo: b.descKo || "핵심 지표 설명",
            subId: b.descId || "Deskripsi indikator",
          };
        });
      } else {
        updated.stats = [
          { labelKo: "목표 달성률", labelId: "Tingkat Pencapaian", value: "98.5%", subKo: "2026 연간 목표치", subId: "Target Tahunan 2026" },
          { labelKo: "협약 체결 기관", labelId: "Mitra Kerjasama", value: "16개교", subKo: "국립폴리테크닉 전수", subId: "Seluruh Politeknik Negeri" },
          { labelKo: "파견 전문 인재", labelId: "Tenaga Ahli", value: "150명", subKo: "글로벌 매칭 완료", subId: "Pencocokan Global Selesai" },
          { labelKo: "비자 전환 성공률", labelId: "Konversi Visa", value: "94%", subKo: "E-7 및 F-2-R 연계", subId: "Integrasi E-7 & F-2-R" },
        ];
      }
    }
    return updated;
  }

  // Case C: Morphing into comparison-table or feature-matrix
  if (["comparison-table", "feature-matrix", "schedule-table", "delegation-table"].includes(targetLayout)) {
    if (!updated.customTable && (!updated.delegates || updated.delegates.length === 0) && (!updated.schedule || updated.schedule.length === 0)) {
      if (Array.isArray(updated.bullets) && updated.bullets.length > 0) {
        updated.customTable = {
          headers: ["비교 항목 (항목명)", "기존 현황 (Baseline)", "KIND 2026 혁신 방안", "비고 (Keterangan)"],
          rows: updated.bullets.map((b, i) => [
            b.titleKo || `항목 ${i + 1}`,
            "기본 모델 / 수동 연계",
            b.descKo || "통합 플랫폼 및 제도화",
            b.tagKo || "핵심 과제",
          ]),
        };
      } else {
        updated.customTable = {
          headers: ["구분", "추진 내용 (한국어)", "Rencana (Bahasa Indonesia)", "목표 성과"],
          rows: [
            ["01", "직업교육 학위 연계", "Integrasi Gelar Vokasi", "공동학위 협약"],
            ["02", "지자체 비자 트랙", "Jalur Visa Pemda (F-2-R)", "지역 정주율 80%"],
            ["03", "기업 맞춤형 인턴십", "Magang Khusus Industri", "취업 연계 100명"],
          ],
        };
      }
    }
    return updated;
  }

  // Case D: Morphing into process-3 (3-stage flow)
  if (targetLayout === "process-3") {
    if (!Array.isArray(updated.processStages) || updated.processStages.length === 0) {
      if (Array.isArray(updated.bullets) && updated.bullets.length >= 3) {
        updated.processStages = updated.bullets.slice(0, 3).map((b, idx) => ({
          stage: idx + 1,
          badgeKo: `STEP 0${idx + 1}`,
          badgeId: `TAHAP 0${idx + 1}`,
          titleKo: b.titleKo || `단계 ${idx + 1}`,
          titleId: b.titleId || `Tahap ${idx + 1}`,
          descKo: b.descKo || "실행 상세 내용",
          descId: b.descId || "Rincian pelaksanaan",
          bulletsKo: [b.tagKo || "실무 협의", "타임라인 확정"],
          bulletsId: [b.tagId || "Konsultasi", "Finalisasi"],
        }));
      } else {
        updated.processStages = [
          {
            stage: 1,
            badgeKo: "STEP 01",
            badgeId: "TAHAP 01",
            titleKo: "기반 구축 및 협약 체결",
            titleId: "Pembangunan Fondasi & MOU",
            descKo: "양국 기관 간 사전 협의 및 실무 추진단 구성",
            descId: "Konsultasi awal dan pembentukan gugus tugas",
            bulletsKo: ["협약서 초안 검토", "참여 대학 확정"],
            bulletsId: ["Review draft perjanjian", "Konfirmasi universitas"],
          },
          {
            stage: 2,
            badgeKo: "STEP 02",
            badgeId: "TAHAP 02",
            titleKo: "집중 교육 및 현장 검증",
            titleId: "Pelatihan Intensif & Verifikasi",
            descKo: "현지 한국어 교육 및 사전 역량 평가 진행",
            descId: "Pelatihan bahasa Korea dan asesmen kompetensi",
            bulletsKo: ["어학 300시간 이수", "직무 적합도 인터뷰"],
            bulletsId: ["300 jam pelatihan bahasa", "Wawancara kesesuaian"],
          },
          {
            stage: 3,
            badgeKo: "STEP 03",
            badgeId: "TAHAP 03",
            titleKo: "비자 발급 및 정주 연계",
            titleId: "Penerbitan Visa & Integrasi Karir",
            descKo: "지자체 비자(F-2-R/E-7) 연계 및 가족 동반 정착",
            descId: "Fasilitasi visa dan penempatan kerja regional",
            bulletsKo: ["정주형 일자리 매칭", "장기 체류 안착"],
            bulletsId: ["Penempatan kerja tetap", "Penyelesaian izin tinggal"],
          },
        ];
      }
    }
    return updated;
  }

  // Case E: Morphing to split-info or cards-3
  if (targetLayout === "split-info" && !updated.image?.url) {
    updated.image = {
      url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
      captionKo: "데이터 시각화 및 양국 협력 모델",
      captionId: "Visualisasi Data dan Model Kerjasama",
      position: "right",
    };
  }

  return updated;
}
