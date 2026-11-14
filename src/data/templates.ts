import { SlideData } from "../types";

export interface PresentationTemplate {
  id: string;
  nameKo: string;
  nameId: string;
  descriptionKo: string;
  descriptionId: string;
  icon: string;
  slides: SlideData[];
}

export const PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: "project-proposal",
    nameKo: "프로젝트 제안서 (Project Proposal)",
    nameId: "Proposal Proyek",
    descriptionKo: "추진 배경, 핵심 목표, 세부 실행 계획 및 기대 효과를 체계적으로 구성한 제안서 템플릿입니다.",
    descriptionId: "Template proposal sistematis untuk latar belakang, tujuan, rencana eksekusi, dan dampak.",
    icon: "FileText",
    slides: [
      {
        id: "p1_" + Date.now(),
        slideNumber: 1,
        layout: "cover",
        categoryKo: "PROJECT PROPOSAL 2026",
        categoryId: "PROPOSAL PROYEK 2026",
        tagKo: "OFFICIAL SUBMISSION",
        tagId: "PENGIRIMAN RESMI",
        titleKo: "신규 전략 프로젝트 기획 및 제안서",
        titleId: "Perencanaan & Proposal Proyek Strategis Baru",
        subtitleKo: "성공적인 프로젝트 런칭을 위한 종합 마스터 플랜 및 실행 로드맵",
        subtitleId: "Master plan komprehensif dan peta jalan eksekusi untuk peluncuran proyek sukses.",
        notesKo: "프로젝트 제안서 표지 슬라이드입니다. 핵심 비전과 목적을 설명하세요.",
        notesId: "Slide sampul proposal proyek. Jelaskan visi dan tujuan utama."
      },
      {
        id: "p2_" + Date.now(),
        slideNumber: 2,
        layout: "overview",
        categoryKo: "추진 배경 및 필요성",
        categoryId: "Latar Belakang & Kebutuhan",
        tagKo: "BACKGROUND",
        tagId: "LATAR BELAKANG",
        titleKo: "시장 환경 분석 및 핵심 과제",
        titleId: "Analisis Lingkungan Pasar & Tantangan Utama",
        subtitleKo: "현재 시장의 페인포인트와 본 프로젝트가 반드시 해결해야 하는 핵심 과제입니다.",
        subtitleId: "Pain point pasar saat ini dan tantangan utama yang harus diselesaikan oleh proyek ini.",
        bullets: [
          {
            id: "b1_" + Date.now(),
            titleKo: "급변하는 디지털 환경 대응",
            titleId: "Respon Lingkungan Digital yang Cepat",
            descKo: "기존 방식의 한계를 극복하고 디지털 전환 가속화 필요",
            descId: "Mengatasi keterbatasan metode lama dan mempercepat transformasi digital"
          },
          {
            id: "b2_" + Date.now(),
            titleKo: "사용자 경험 혁신",
            titleId: "Inovasi Pengalaman Pengguna",
            descKo: "직관적이고 원활한 사용자 여정 구축을 통한 만족도 극대화",
            descId: "Maksimalisasi kepuasan melalui pembangunan perjalanan pengguna yang intuitif"
          }
        ],
        notesKo: "프로젝트 추진 배경과 필요성을 명확히 전달합니다.",
        notesId: "Sampaikan latar belakang dan kebutuhan proyek secara jelas."
      },
      {
        id: "p3_" + Date.now(),
        slideNumber: 3,
        layout: "cards-2",
        categoryKo: "실행 일정 및 로드맵",
        categoryId: "Jadwal & Peta Jalan Eksekusi",
        tagKo: "TIMELINE",
        tagId: "LINIMASA",
        titleKo: "단계별 마일스톤 및 일정",
        titleId: "Tonggak & Jadwal Bertahap",
        subtitleKo: "프로젝트 시작부터 안정화까지 체계적인 4단계 실행 타임라인입니다.",
        subtitleId: "Linimasa eksekusi 4 tahap yang sistematis dari awal hingga stabilisasi.",
        bullets: [
          {
            id: "t1_" + Date.now(),
            titleKo: "1단계: 사전 기획 및 아키텍처 설계",
            titleId: "Tahap 1: Perencanaan & Desain",
            descKo: "요구사항 분석 및 핵심 기술 스택 확정 (1개월차)",
            descId: "Analisis kebutuhan & penetapan teknologi (Bulan 1)"
          },
          {
            id: "t2_" + Date.now(),
            titleKo: "2단계: 핵심 기능 개발 및 통합",
            titleId: "Tahap 2: Pengembangan Fitur",
            descKo: "프론트엔드/백엔드 모듈 구현 및 API 연동 (2~3개월차)",
            descId: "Implementasi modul & integrasi API (Bulan 2-3)"
          },
          {
            id: "t3_" + Date.now(),
            titleKo: "3단계: 베타 테스트 및 품질 검증",
            titleId: "Tahap 3: Pengujian Beta & QA",
            descKo: "파일럿 운영, 피드백 수렴 및 버그 패치 (4개월차)",
            descId: "Operasi pilot, pengumpulan umpan balik & perbaikan (Bulan 4)"
          },
          {
            id: "t4_" + Date.now(),
            titleKo: "4단계: 정식 런칭 및 사후 고도화",
            titleId: "Tahap 4: Peluncuran Resmi",
            descKo: "전체 서비스 오픈 및 데이터 기반 성과 최적화 (5개월차~)",
            descId: "Peluncuran penuh & optimalisasi berbasis data (Bulan 5+)"
          }
        ],
        notesKo: "단계별 마일스톤을 통해 실행 가능성을 입증합니다.",
        notesId: "Buktikan kelayakan eksekusi melalui tonggak sejarah bertahap."
      },
      {
        id: "p4_" + Date.now(),
        slideNumber: 4,
        layout: "cards-3",
        categoryKo: "기대 효과 및 비전",
        categoryId: "Dampak & Visi",
        tagKo: "OUTCOMES",
        tagId: "HASIL",
        titleKo: "프로젝트 완료 후 기대 성과",
        titleId: "Hasil yang Diharapkan Setelah Proyek Selesai",
        subtitleKo: "본 프로젝트를 통해 달성할 수 있는 정량적·정성적 핵심 가치입니다.",
        subtitleId: "Nilai inti kuantitatif dan kualitatif yang dapat dicapai melalui proyek ini.",
        bullets: [
          {
            id: "c1_" + Date.now(),
            titleKo: "업무 효율 300% 향상",
            titleId: "Peningkatan Efisiensi 300%",
            descKo: "자동화 및 최적화 프로세스 도입으로 리소스 절감",
            descId: "Pengurangan sumber daya melalui otomatisasi dan proses optimal"
          },
          {
            id: "c2_" + Date.now(),
            titleKo: "사용자 만족도 극대화",
            titleId: "Kepuasan Pengguna Maksimal",
            descKo: "고품질 인터페이스와 빠른 응답속도로 고객 충성도 제고",
            descId: "Meningkatkan loyalitas pelanggan melalui antarmuka berkualitas"
          },
          {
            id: "c3_" + Date.now(),
            titleKo: "글로벌 확장 기반 마련",
            titleId: "Landasan Ekspansi Global",
            descKo: "다국어 지원 및 확장 가능한 아키텍처로 해외 진출 가속화",
            descId: "Mempercepat ekspansi luar negeri dengan dukungan multibahasa"
          }
        ],
        notesKo: "프로젝트 완료 시 기대되는 효과를 요약하여 마무리합니다.",
        notesId: "Ringkas dampak yang diharapkan pada penyelesaian proyek."
      }
    ]
  },
  {
    id: "quarterly-report",
    nameKo: "분기 실적 보고서 (Quarterly Report)",
    nameId: "Laporan Kinerja Kuartalan",
    descriptionKo: "분기별 주요 KPI, 핵심 성과 지표, 주요 달성 사항 및 향후 계획을 담은 보고서 템플릿입니다.",
    descriptionId: "Template laporan untuk KPI kuartalan, pencapaian utama, dan rencana masa depan.",
    icon: "BarChart3",
    slides: [
      {
        id: "q1_" + Date.now(),
        slideNumber: 1,
        layout: "cover",
        categoryKo: "Q3 2026 PERFORMANCE",
        categoryId: "KINERJA Q3 2026",
        tagKo: "EXECUTIVE REPORT",
        tagId: "LAPORAN EKSEKUTIF",
        titleKo: "2026년 3분기 경영 실적 및 성과 보고",
        titleId: "Laporan Kinerja & Hasil Manajemen Q3 2026",
        subtitleKo: "전사 매출 성장세, 주요 프로젝트 완료 현황 및 4분기 전략적 방향성",
        subtitleId: "Pertumbuhan pendapatan perusahaan, status proyek, & arah strategis Q4",
        notesKo: "3분기 실적 보고서 표지입니다.",
        notesId: "Sampul laporan kinerja Q3."
      },
      {
        id: "q2_" + Date.now(),
        slideNumber: 2,
        layout: "cards-3",
        categoryKo: "주요 경영 지표 (KPI)",
        categoryId: "Indikator Utama (KPI)",
        tagKo: "METRICS",
        tagId: "METRIK",
        titleKo: "3분기 핵심 성과 지표 요약",
        titleId: "Ringkasan Indikator Kinerja Utama Q3",
        subtitleKo: "전년 동기 대비 주요 성장 지표 및 목표 달성률 현황입니다.",
        subtitleId: "Indikator pertumbuhan utama dan status pencapaian target dibanding tahun lalu.",
        bullets: [
          {
            id: "s1_" + Date.now(),
            titleKo: "총 매출액 $4.2M",
            titleId: "Total Pendapatan $4.2M",
            descKo: "전년 동기 대비 +34% 성장 달성",
            descId: "Pertumbuhan +34% YoY"
          },
          {
            id: "s2_" + Date.now(),
            titleKo: "활성 사용자 120K",
            titleId: "Pengguna Aktif 120K",
            descKo: "신규 가입자 전분기 대비 45% 증가",
            descId: "Pendaftaran baru naik 45% QoQ"
          },
          {
            id: "s3_" + Date.now(),
            titleKo: "고객 유지율 94.5%",
            titleId: "Retensi Pelanggan 94.5%",
            descKo: "업계 최고 수준의 이탈률 방어 성공",
            descId: "Pertahanan churn rate terbaik di industri"
          },
          {
            id: "s4_" + Date.now(),
            titleKo: "운영 비용 15% 절감",
            titleId: "Pengurangan Biaya Operasional 15%",
            descKo: "프로세스 자동화로 비용 효율성 극대화",
            descId: "Maksimalisasi efisiensi biaya via otomatisasi"
          }
        ],
        notesKo: "핵심 경영 지표를 수치와 함께 명확히 제시합니다.",
        notesId: "Sajikan indikator manajemen inti dengan angka secara jelas."
      },
      {
        id: "q3_" + Date.now(),
        slideNumber: 3,
        layout: "cards-3",
        categoryKo: "주요 달성 사항",
        categoryId: "Pencapaian Utama",
        tagKo: "ACHIEVEMENTS",
        tagId: "PENCAPAIAN",
        titleKo: "3분기 주요 비즈니스 마일스톤",
        titleId: "Tonggak Bisnis Utama Q3",
        subtitleKo: "이번 분기 동안 성공적으로 완수한 핵심 프로젝트 및 성과입니다.",
        subtitleId: "Proyek inti dan pencapaian yang berhasil diselesaikan kuartal ini.",
        bullets: [
          {
            id: "a1_" + Date.now(),
            titleKo: "글로벌 파트너십 체결",
            titleId: "Kemitraan Global Ditetapkan",
            descKo: "동남아시아 거점 대학 및 기관과 독점 업무협약(MOU) 완료",
            descId: "MOU eksklusif selesai dengan kampus & lembaga Asia Tenggara"
          },
          {
            id: "a2_" + Date.now(),
            titleKo: "v2.0 플랫폼 대규모 업데이트",
            titleId: "Pembaruan Besar Platform v2.0",
            descKo: "AI 자동화 기능 및 실시간 다국어 번역 시스템 전면 도입",
            descId: "Adopsi penuh fitur otomatisasi AI & terjemahan multibahasa"
          },
          {
            id: "a3_" + Date.now(),
            titleKo: "정보보호 인증 획득",
            titleId: "Sertifikasi Keamanan Diperoleh",
            descKo: "국제 표준 보안 인증을 성공적으로 획득하여 신뢰성 제고",
            descId: "Berhasil memperoleh sertifikasi keamanan standar internasional"
          }
        ],
        notesKo: "주요 마일스톤을 통해 기업의 성장 동력을 증명합니다.",
        notesId: "Buktikan daya dorong pertumbuhan perusahaan melalui milestone."
      },
      {
        id: "q4_" + Date.now(),
        slideNumber: 4,
        layout: "cards-2",
        categoryKo: "4분기 전망 및 계획",
        categoryId: "Prospek & Rencana Q4",
        tagKo: "Q4 OUTLOOK",
        tagId: "PROSPEK Q4",
        titleKo: "2026년 4분기 전략적 목표",
        titleId: "Tujuan Strategis Q4 2026",
        subtitleKo: "연말 목표 달성을 위한 핵심 실행 계획 및 마케팅 드라이브입니다.",
        subtitleId: "Rencana eksekusi inti & dorongan pemasaran untuk target akhir tahun.",
        bullets: [
          {
            id: "r1_" + Date.now(),
            titleKo: "신규 서비스 라인업 런칭",
            titleId: "Peluncuran Lini Layanan Baru",
            descKo: "엔터프라이즈 맞춤형 보안 패키지 출시 (10월)",
            descId: "Peluncuran paket keamanan kustom enterprise (Oktober)"
          },
          {
            id: "r2_" + Date.now(),
            titleKo: "대규모 마케팅 캠페인 전개",
            titleId: "Kampanye Pemasaran Besar",
            descKo: "온/오프라인 통합 브랜드 인지도 제고 캠페인 (11월)",
            descId: "Kampanye peningkatan brand awareness terpadu (November)"
          },
          {
            id: "r3_" + Date.now(),
            titleKo: "연간 결산 및 성과 공유회",
            titleId: "Evaluasi Tahunan & Sharing",
            descKo: "2026년 성과 총결산 및 2027년 비전 선포 (12월)",
            descId: "Evaluasi kinerja 2026 & deklarasi visi 2027 (Desember)"
          }
        ],
        notesKo: "4분기 계획을 공유하며 보고를 마무리합니다.",
        notesId: "Bagikan rencana Q4 dan akhiri laporan."
      }
    ]
  },
  {
    id: "team-pitch",
    nameKo: "팀 피치 / IR (Team Pitch & IR)",
    nameId: "Pitching Tim / IR",
    descriptionKo: "스타트업 IR, 팀 비전, 시장 기회, 솔루션 및 투자 유치 계획을 위한 피치 덱 템플릿입니다.",
    descriptionId: "Template pitch deck untuk startup IR, visi tim, peluang pasar, dan rencana pendanaan.",
    icon: "Sparkles",
    slides: [
      {
        id: "tp1_" + Date.now(),
        slideNumber: 1,
        layout: "cover",
        categoryKo: "STARTUP PITCH DECK",
        categoryId: "PITCH DECK STARTUP",
        tagKo: "INVESTOR PRESENTATION",
        tagId: "PRESENTASI INVESTOR",
        titleKo: "차세대 글로벌 협업 및 프레젠테이션 플랫폼",
        titleId: "Platform Kolaborasi & Presentasi Global Generasi Berikutnya",
        subtitleKo: "AI와 클라우드 기술을 결합한 혁신적인 업무 생산성 솔루션",
        subtitleId: "Solusi produktivitas kerja inovatif yang menggabungkan AI & teknologi cloud",
        notesKo: "IR 피치 덱 표지 슬라이드입니다.",
        notesId: "Slide sampul pitch deck IR."
      },
      {
        id: "tp2_" + Date.now(),
        slideNumber: 2,
        layout: "overview",
        categoryKo: "시장 기회 및 문제점",
        categoryId: "Peluang Pasar & Masalah",
        tagKo: "THE PROBLEM",
        tagId: "MASALAH",
        titleKo: "기존 업무 도구의 한계와 기회",
        titleId: "Keterbatasan & Peluang Alat Kerja Lama",
        subtitleKo: "현업 조직들이 겪고 있는 비효율성과 우리가 해결하고자 하는 기회입니다.",
        subtitleId: "Inefisiensi yang dialami organisasi dan peluang yang ingin kami selesaikan.",
        bullets: [
          {
            id: "tp_b1_" + Date.now(),
            titleKo: "복잡하고 느린 문서 제작",
            titleId: "Pembuatan Dokumen Kompleks & Lambat",
            descKo: "기존 소프트웨어의 무거운 UI와 호환성 문제로 인한 시간 낭비",
            descId: "Buang waktu karena UI berat & masalah kompatibilitas software lama"
          },
          {
            id: "tp_b2_" + Date.now(),
            titleKo: "다국어 소통의 장벽",
            titleId: "Hambatan Komunikasi Multibahasa",
            descKo: "글로벌 팀 간 협업 시 번역 및 문화적 맥락 전달의 어려움",
            descId: "Kesulitan terjemahan & penyampaian konteks budaya antar tim global"
          }
        ],
        notesKo: "고객이 직면한 페인포인을 강조하세요.",
        notesId: "Tekankan pain point yang dihadapi pelanggan."
      },
      {
        id: "tp3_" + Date.now(),
        slideNumber: 3,
        layout: "cards-3",
        categoryKo: "핵심 솔루션",
        categoryId: "Solusi Utama",
        tagKo: "OUR SOLUTION",
        tagId: "SOLUSI KAMI",
        titleKo: "KIND Platform의 차별화된 가치",
        titleId: "Nilai Diferensiasi Platform KIND",
        subtitleKo: "우리의 기술력으로 제공하는 압도적인 업무 혁신 솔루션입니다.",
        subtitleId: "Solusi inovasi kerja luar biasa yang disediakan oleh teknologi kami.",
        bullets: [
          {
            id: "tp_s1_" + Date.now(),
            titleKo: "AI 기반 실시간 구조화",
            titleId: "Strukturasi Real-time Berbasis AI",
            descKo: "원문 입력만으로 최고급 16:9 슬라이드와 레이아웃 자동 생성",
            descId: "Pembuatan otomatis slide 16:9 & tata letak mewah dari teks mentah"
          },
          {
            id: "tp_s2_" + Date.now(),
            titleKo: "완벽한 양방향 동시 지원",
            titleId: "Dukungan Dual Sektor Sempurna",
            descKo: "한국어와 인도네시아어 양방향 싱크 및 다국어 실시간 발표 모드",
            descId: "Sinkronisasi dwiarah Korea-Indonesia & mode presentasi real-time"
          },
          {
            id: "tp_s3_" + Date.now(),
            titleKo: "구글 드라이브 실시간 연동",
            titleId: "Integrasi Real-time Google Drive",
            descKo: "클라우드 기반 안전한 동기화와 언제 어디서나 접속 가능한 환경",
            descId: "Sinkronisasi awan aman & akses kapan saja di mana saja"
          }
        ],
        notesKo: "우리 제품의 핵심 경쟁력을 명확히 전달합니다.",
        notesId: "Sampaikan keunggulan kompetitif inti produk kita secara jelas."
      },
      {
        id: "tp4_" + Date.now(),
        slideNumber: 4,
        layout: "cards-3",
        categoryKo: "비즈니스 모델 및 성과",
        categoryId: "Model Bisnis & Kinerja",
        tagKo: "TRACTION",
        tagId: "TRAKSI",
        titleKo: "빠른 성장세와 검증된 지표",
        titleId: "Pertumbuhan Cepat & Metrik Teruji",
        subtitleKo: "런칭 이후 가파른 사용자 유입과 높은 리텐션을 기록하고 있습니다.",
        subtitleId: "Mencatat lonjakan pengguna dan retensi tinggi sejak peluncuran.",
        bullets: [
          {
            id: "tp_tr1_" + Date.now(),
            titleKo: "월간 활성 사용자 5만+",
            titleId: "Pengguna Aktif Bulanan 50K+",
            descKo: "오가닉 바이럴을 통한 폭발적 사용자 증가",
            descId: "Lonjakan pengguna organik melalui viral"
          },
          {
            id: "tp_tr2_" + Date.now(),
            titleKo: "유료 전환율 18%",
            titleId: "Tingkat Konversi Berbayar 18%",
            descKo: "업계 평균을 상회하는 프리미엄 구독 전환",
            descId: "Konversi langganan premium di atas rata-rata industri"
          },
          {
            id: "tp_tr3_" + Date.now(),
            titleKo: "고객 만족도 NPS 82",
            titleId: "Kepuasan Pelanggan NPS 82",
            descKo: "압도적인 사용자 경험과 추천 지수",
            descId: "Pengalaman pengguna luar biasa & indeks rekomendasi"
          },
          {
            id: "tp_tr4_" + Date.now(),
            titleKo: "손익분기점(BEP) 달성",
            titleId: "Mencapai Titik Impas (BEP)",
            descKo: "건실한 재무 구조와 빠른 매출 성장",
            descId: "Struktur keuangan sehat & pertumbuhan pendapatan cepat"
          }
        ],
        notesKo: "성장 트랙션을 통해 투자 가치를 입증합니다.",
        notesId: "Buktikan nilai investasi melalui traksi pertumbuhan."
      }
    ]
  },
  {
    id: "korean-corporate",
    nameKo: "프리미엄 기업 소개서 (Premium Corporate Profile)",
    nameId: "Profil Perusahaan Premium",
    descriptionKo: "한국 주요 기업 및 제안서 표준 양식에 근거하여 강점(Metrics), 연혁(Timeline), 협력사 연계와 연락망을 아우르는 6슬라이드 원스톱 패키지입니다.",
    descriptionId: "Paket lengkap 6 slide berdasarkan format standar proposal & profil perusahaan Korea, mencakup Metrik, Linimasa, Mitra, dan Kontak.",
    icon: "FileText",
    slides: [
      {
        id: "kc1_" + Date.now(),
        slideNumber: 1,
        layout: "cover",
        categoryKo: "CORPORATE INTRODUCTION",
        categoryId: "INTRODUKSI PERUSAHAAN",
        tagKo: "OFFICIAL PRESENTATION",
        tagId: "PRESENTASI RESMI",
        titleKo: "글로벌 비즈니스 협력 및 기업 소개서",
        titleId: "Kerjasama Bisnis Global & Profil Perusahaan",
        subtitleKo: "외국인 대상 글로벌 홍보 마케팅 전문 비즈니스 서비스 제안",
        subtitleId: "Usulan Layanan Bisnis Khusus untuk Pemasaran & Promosi Global Target Asing",
        notesKo: "기업소개서 공식 표지입니다. 로고 및 발표 기업명을 하단에 소개하세요.",
        notesId: "Sampul resmi profil perusahaan. Perkenalkan logo & nama perusahaan presentasi di bawah."
      },
      {
        id: "kc2_" + Date.now(),
        slideNumber: 2,
        layout: "split-info",
        categoryKo: "기업 가치 및 비전",
        categoryId: "Nilai & Visi Perusahaan",
        tagKo: "BRAND STORY",
        tagId: "CERITA BRAND",
        titleKo: "글로벌 상생의 시너지를 창출하는 비즈니스 파트너",
        titleId: "Mitra Bisnis yang Menciptakan Sinergi Win-Win Global",
        subtitleKo: "독보적인 글로벌 마케팅 역량을 토대로 해외 홍보와 실질적 성과를 약속합니다.",
        subtitleId: "Berdasarkan kemampuan pemasaran global yang unik, kami menjamin promosi luar negeri dan hasil nyata.",
        bullets: [
          {
            id: "kcb1_" + Date.now(),
            titleKo: "원스톱 기획 및 실행력",
            titleId: "Perencanaan & Eksekusi One-stop",
            descKo: "관광, 문화, 교류 행사 기획부터 마케팅 대행까지 한 번에 수행합니다.",
            descId: "Melakukan semuanya sekaligus dari perencanaan acara wisata, budaya, pertukaran hingga pemasaran."
          },
          {
            id: "kcb2_" + Date.now(),
            titleKo: "풍부한 글로벌 고객 풀",
            titleId: "Kumpulan Klien Global yang Kaya",
            descKo: "검증된 유학생 데이터베이스와 해외 인플루언서 네트워크를 투명하게 제공합니다.",
            descId: "Menyediakan database mahasiswa asing terverifikasi dan jaringan influencer global secara transparan."
          }
        ],
        image: {
          url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80",
          captionKo: "글로벌 홍보 마케팅 행사 현장 레퍼런스",
          captionId: "Referensi Acara Promosi Pemasaran Global"
        },
        notesKo: "회사의 브랜드 스토리와 핵심 아이덴티티를 설명하는 슬라이드입니다.",
        notesId: "Slide untuk menjelaskan kisah merek perusahaan dan identitas inti."
      },
      {
        id: "kc3_" + Date.now(),
        slideNumber: 3,
        layout: "cards-3",
        categoryKo: "핵심 역량 및 강점",
        categoryId: "Kompetensi Utama & Kekuatan",
        tagKo: "CORE TRACTION",
        tagId: "TRAKSI INTI",
        titleKo: "신뢰와 트랙션으로 검증된 3대 비즈니스 강점",
        titleId: "3 Kekuatan Bisnis Utama yang Teruji Melalui Kepercayaan & Traksi",
        subtitleKo: "다년간 축적된 글로벌 실행 성과를 핵심 수치로 투명하게 보여드립니다.",
        subtitleId: "Kami menunjukkan hasil eksekusi global yang terakumulasi selama bertahun-tahun melalui angka-angka kunci.",
        bullets: [
          {
            id: "kcb3_" + Date.now(),
            titleKo: "150회+ 국비 및 용역 성공",
            titleId: "150+ Keberhasilan Proyek Pemerintah",
            descKo: "정부 부처 및 전국 지자체의 다양한 해외 교류·관광 행사 대행 성공",
            descId: "Berhasil agen berbagai acara pertukaran & wisata asing kementerian & pemda"
          },
          {
            id: "kcb4_" + Date.now(),
            titleKo: "50,000명+ 글로벌 DB 인프라",
            titleId: "50.000+ Infrastruktur DB Global",
            descKo: "양방향 실시간 홍보 바이럴이 가능한 다국적 인플루언서 커뮤니티 파워",
            descId: "Kekuatan komunitas influencer multinasional yang mampu promosi viral dua arah"
          },
          {
            id: "kcb5_" + Date.now(),
            titleKo: "100편+ 고품질 자체 콘텐츠",
            titleId: "100+ Konten Mandiri Berkualitas Tinggi",
            descKo: "한국 홍보 영상, 유학 관련 숏폼 및 트렌디한 글로벌 미디어 자체 제작",
            descId: "Pembuatan mandiri video promosi Korea, short-form studi luar negeri & media global"
          }
        ],
        notesKo: "실질적인 성과 수치(Traction)를 강조해 파트너십 신뢰도를 높이세요.",
        notesId: "Tekankan metrik pencapaian nyata (Traksi) untuk meningkatkan kepercayaan kemitraan."
      },
      {
        id: "kc4_" + Date.now(),
        slideNumber: 4,
        layout: "cards-2",
        categoryKo: "회사 연혁 및 마일스톤",
        categoryId: "Sejarah & Milestone Perusahaan",
        tagKo: "GROWTH PATH",
        tagId: "JALUR PERTUMBUHAN",
        titleKo: "지속 가능한 동반 성장의 연혁",
        titleId: "Sejarah Pertumbuhan Bersama yang Berkelanjutan",
        subtitleKo: "2016년 설립 이래 공공 지자체와 함께하며 다져온 탄탄한 발자취입니다.",
        subtitleId: "Jejak langkah solid yang dibangun bersama pemda dan lembaga publik sejak didirikan tahun 2016.",
        bullets: [
          {
            id: "kcb6_" + Date.now(),
            titleKo: "2016 ~ 2018 : 비즈니스 기틀 확립",
            titleId: "2016 ~ 2018 : Pendirian Fondasi Bisnis",
            descKo: "제안사 설립, 고용노동부 특별상 수상 및 예비 사회적 기업 지정 완료",
            descId: "Pendirian perusahaan, penghargaan khusus Kemenaker & penunjukan wirausaha sosial"
          },
          {
            id: "kcb7_" + Date.now(),
            titleKo: "2019 ~ 2021 : 성과 확대 및 고도화",
            titleId: "2019 ~ 2021 : Ekspansi Hasil & Peningkatan",
            descKo: "서울시 우수 단체 지정, 정식 사회적 기업 인증 획득 및 정부 대형 용역 착수",
            descId: "Penunjukan kelompok teladan Seoul, sertifikasi resmi & mulai proyek besar pemerintah"
          },
          {
            id: "kcb8_" + Date.now(),
            titleKo: "2022 ~ 2024 : 글로벌 네트워크 완성",
            titleId: "2022 ~ 2024 : Penyelesaian Jaringan Global",
            descKo: "주한 외국인 대규모 팸투어 150회 돌파 및 글로벌 다국어 미디어 라인업 완성",
            descId: "Melampaui 150 kali wisata pengenalan warga asing & merampungkan media multibahasa"
          },
          {
            id: "kcb9_" + Date.now(),
            titleKo: "2025 ~ 현재 : 정주 연계 패스트트랙",
            titleId: "2025 ~ Sekarang : Jalur Cepat Integrasi Pemukiman",
            descKo: "20만 인니 폴리텍 학위-장학 연계 및 지자체 F-2-R 지역 정주형 모델 전격 구축",
            descId: "Integrasi beasiswa-gelar Politeknik RI & model pemukiman regional F-2-R"
          }
        ],
        notesKo: "역사와 비전 마일스톤을 연대순으로 깔끔하게 연출했습니다.",
        notesId: "Sajikan sejarah dan visi tonggak secara rapi kronologis."
      },
      {
        id: "kc5_" + Date.now(),
        slideNumber: 5,
        layout: "cards-3",
        categoryKo: "협력 네트워크",
        categoryId: "Jaringan Kemitraan",
        tagKo: "PARTNERSHIPS",
        tagId: "KEMITRAAN",
        titleKo: "상생 협력으로 구축된 탄탄한 거버넌스",
        titleId: "Tata Kelola Solid yang Dibangun Melalui Kemitraan Win-Win",
        subtitleKo: "주요 정부 부처, 광역 및 기초 지자체, 교육 기관과의 강력한 파트너십 현황입니다.",
        subtitleId: "Status kemitraan kuat kami dengan kementerian utama, pemerintah daerah, dan lembaga pendidikan.",
        bullets: [
          {
            id: "kcb10_" + Date.now(),
            titleKo: "대한민국 중앙 정부 부처",
            titleId: "Kementerian Pemerintah Pusat Korea",
            descKo: "외교부, 해외문화홍보원, 한국관광공사 및 세종학당재단 등 주요 국책 파트너십",
            descId: "Kemitraan strategis dengan Kemenlu, KOCIS, KTO, & King Sejong Institute"
          },
          {
            id: "kcb11_" + Date.now(),
            titleKo: "광역 및 기초 지방자치단체",
            titleId: "Pemerintah Provinsi & Kabupaten",
            descKo: "서울특별시, 경기도, 전라남도, 서대문구, 보성군, 순창군 등 지역 상생 연계",
            descId: "Hubungan simbiosis regional dengan Seoul, Gyeonggi, Jeonnam, Seodaemun, Boseong, dll"
          },
          {
            id: "kcb12_" + Date.now(),
            titleKo: "글로벌 산학 교육 기관",
            titleId: "Lembaga Pendidikan & Industri Global",
            descKo: "인도네시아 국립폴리텍대학 연합, 발리 IPBI대학교, 한국센터 글로벌 네트워크 등",
            descId: "Asosiasi Politeknik Negeri RI, Universitas IPBI Bali, Jaringan Global Pusat Korea, dll"
          }
        ],
        notesKo: "안정적이고 투명한 국책 사업 수행 역량의 증거인 파트너 리스트입니다.",
        notesId: "Daftar mitra sebagai bukti kemampuan eksekusi proyek nasional yang stabil & transparan."
      },
      {
        id: "kc6_" + Date.now(),
        slideNumber: 6,
        layout: "general",
        categoryKo: "소통 및 연락처",
        categoryId: "Komunikasi & Kontak",
        tagKo: "CONTACT US",
        tagId: "KONTAK KAMI",
        titleKo: "글로벌 성장 동맹에 귀사를 초대합니다",
        titleId: "Kami Mengundang Anda ke Aliansi Pertumbuhan Global",
        subtitleKo: "협력 비즈니스 개시 및 세부 제안 미팅 문의처입니다.",
        subtitleId: "Kontak untuk memulai kemitraan bisnis dan pertemuan proposal terperinci.",
        bullets: [
          {
            id: "kcb13_" + Date.now(),
            titleKo: "대표 메일 및 유선 문의",
            titleId: "Email Perwakilan & Kontak Telepon",
            descKo: "Email: support@fundaykorea.com | Tel: 010-5669-9618 (외국인 마케팅 총괄 담당)",
            descId: "Email: support@fundaykorea.com | Tel: 010-5669-9618 (Direktur Pemasaran Asing)"
          },
          {
            id: "kcb14_" + Date.now(),
            titleKo: "공식 웹사이트 및 미디어 채널",
            titleId: "Situs Web Resmi & Saluran Media",
            descKo: "Situs: www.fundaykorea.com | SNS: @funday.korea.networks",
            descId: "Situs: www.fundaykorea.com | Medsos: @funday.korea.networks"
          },
          {
            id: "kcb15_" + Date.now(),
            titleKo: "오피스 주소 및 내방 안내",
            titleId: "Alamat Kantor & Panduan Kunjungan",
            descKo: "서울특별시 성동구 왕십리로 115, 헤이그라운드 서울숲점 G610 [펀데이코리아네트웍스]",
            descId: "G610 Heyground Seoul Forest, 115 Wangsimni-ro, Seongdong-gu, Seoul, Korea"
          }
        ],
        notesKo: "엔드 슬라이드로, 추가 질의응답 및 즉각적인 소통 채널을 제시하는 슬라이드입니다.",
        notesId: "Slide akhir untuk memberikan saluran komunikasi langsung dan tanya jawab tambahan."
      }
    ]
  },
  {
    id: "blank",
    nameKo: "빈 프레젠테이션 (Blank Presentation)",
    nameId: "Presentasi Kosong",
    descriptionKo: "기본 1장의 빈 슬라이드에서 백지 상태로 자유롭게 시작합니다.",
    descriptionId: "Mulai secara bebas dari satu slide kosong standar.",
    icon: "FilePlus",
    slides: [
      {
        id: "b_blank_" + Date.now(),
        slideNumber: 1,
        layout: "cards-3",
        categoryKo: "신규 프로젝트",
        categoryId: "Proyek Baru",
        titleKo: "새로운 프레젠테이션",
        titleId: "Presentasi Baru",
        subtitleKo: "여기에 제목과 내용을 입력하세요.",
        subtitleId: "Masukkan judul dan konten di sini.",
        bullets: [
          {
            id: "bb1_" + Date.now(),
            titleKo: "첫 번째 항목",
            titleId: "Poin Pertama",
            descKo: "세부 내용을 입력하세요.",
            descId: "Masukkan detail konten."
          }
        ],
        notesKo: "새 프레젠테이션 발표자 노트",
        notesId: "Catatan presenter"
      }
    ]
  }
];
