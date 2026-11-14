export interface ImagePreset {
  id: string;
  nameKo: string;
  nameId: string;
  category: string;
  url: string;
  captionKo: string;
  captionId: string;
}

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: "global-network",
    nameKo: "글로벌 교육 네트워크",
    nameId: "Jaringan Pendidikan Global",
    category: "Network",
    url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    captionKo: "한-인니 글로벌 직업교육 네트워크",
    captionId: "Jaringan Pendidikan Vokasi Global Korea-Indonesia",
  },
  {
    id: "mou-ceremony",
    nameKo: "국제 협약식 & 비즈니스 미팅",
    nameId: "Upacara MOU & Pertemuan Bisnis",
    category: "Diplomacy",
    url: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80",
    captionKo: "KIND 2026 글로벌 네트워킹 및 MOU",
    captionId: "Networking Global & Penandatanganan MOU KIND 2026",
  },
  {
    id: "tech-lab",
    nameKo: "첨단 공학 실습 & 스마트팩토리",
    nameId: "Lab Teknik & Smart Factory",
    category: "Technology",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    captionKo: "첨단 산업 실습 중심 직업교육",
    captionId: "Pendidikan Praktik Industri Berbasis Teknologi",
  },
  {
    id: "seoul-skyline",
    nameKo: "서울 수도권 비즈니스 센터",
    nameId: "Pusat Bisnis Metropolitan Seoul",
    category: "City",
    url: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80",
    captionKo: "서울 수도권 고등교육 및 비즈니스 거점",
    captionId: "Pusat Pendidikan Tinggi & Bisnis Metropolitan Seoul",
  },
  {
    id: "campus-lecture",
    nameKo: "대학 캠퍼스 및 세미나",
    nameId: "Kampus Universitas & Seminar",
    category: "Education",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    captionKo: "한국 명문대 캠퍼스 및 학술 교류",
    captionId: "Pertukaran Akademik & Kampus Terkemuka Korea",
  },
  {
    id: "industry-workers",
    nameKo: "산업단지 정주 및 엔지니어",
    nameId: "Insinyur & Kawasan Industri",
    category: "Industry",
    url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    captionKo: "지역 산업단지 기술 인력 공급망",
    captionId: "Rantai Pasok Tenaga Ahli Kawasan Industri",
  },
  {
    id: "jakarta-skyline",
    nameKo: "인도네시아 자카르타 경제 허브",
    nameId: "Hub Ekonomi Jakarta Indonesia",
    category: "City",
    url: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=800&q=80",
    captionKo: "인도네시아 고등직업교육 혁신 허브",
    captionId: "Hub Inovasi Pendidikan Tinggi Vokasi Indonesia",
  },
];
