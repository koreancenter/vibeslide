/**
 * Single Source of Truth for Presentation Visual Assets and Presets
 */

export interface StockAsset {
  id: string;
  keywords: string[];
  url: string;
  title: string;
  category: string;
}

export const CURATED_STOCK_ASSETS: StockAsset[] = [
  {
    id: "bilateral-summit",
    title: "International Bilateral Summit",
    category: "Diplomacy & Government",
    keywords: ["summit", "conference", "partnership", "diplomacy", "meeting", "agreement", "mou", "bilateral"],
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "education-campus",
    title: "Modern University Campus & Academic Hall",
    category: "Education & Campus",
    keywords: ["university", "campus", "education", "vocational", "college", "academic", "students", "polytechnic"],
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "tech-future",
    title: "Global Digital Network & AI Technology",
    category: "Innovation & Technology",
    keywords: ["technology", "ai", "digital", "network", "future", "data", "cyber", "innovation", "semiconductor"],
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "corporate-alliance",
    title: "Strategic Business Collaboration & Alliance",
    category: "Business & Growth",
    keywords: ["handshake", "cooperation", "business", "growth", "strategic", "alliance", "investment", "trade"],
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "modern-architecture",
    title: "Sustainable Smart City & Infrastructure",
    category: "City & Infrastructure",
    keywords: ["city", "building", "infrastructure", "architecture", "smart city", "skyscraper", "skyline"],
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "data-analytics",
    title: "Executive Business Analytics & KPI Dashboard",
    category: "Analytics & Finance",
    keywords: ["chart", "analytics", "statistics", "report", "growth", "finance", "kpi", "metrics", "dashboard"],
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "engineering-lab",
    title: "Advanced Engineering Research & Laboratory",
    category: "Science & Engineering",
    keywords: ["lab", "engineering", "industry", "automation", "manufacturing", "research", "robotics", "vocational"],
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "leadership-forum",
    title: "Executive Keynote & Bilateral Forum",
    category: "Keynote & Leadership",
    keywords: ["speech", "keynote", "presentation", "stage", "leader", "forum", "roundtable", "audience"],
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
  },
];
