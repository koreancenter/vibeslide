import React, { useState } from "react";
import { X, Search } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  descriptionKo: string;
  category: "presentation" | "editing" | "canvas" | "system";
}

const SHORTCUT_LIST: ShortcutItem[] = [
  { keys: ["F5"], descriptionKo: "16:9 전체화면 프레젠테이션 시작", category: "presentation" },
  { keys: ["Ctrl", "Enter"], descriptionKo: "전체화면 발표 모드 전환", category: "presentation" },
  { keys: ["→", "Space", "PageDown"], descriptionKo: "다음 슬라이드로 이동", category: "presentation" },
  { keys: ["←", "PageUp"], descriptionKo: "이전 슬라이드로 이동", category: "presentation" },
  { keys: ["Home", "End"], descriptionKo: "첫 번째 또는 마지막 슬라이드로 이동", category: "presentation" },
  { keys: ["T"], descriptionKo: "슬라이드 전환 효과 메뉴 열기", category: "presentation" },
  { keys: ["L"], descriptionKo: "발표 모드 레이저 포인터 전환", category: "presentation" },
  { keys: ["N"], descriptionKo: "발표자 대본 오버레이 전환", category: "presentation" },
  { keys: ["Esc"], descriptionKo: "발표 모드 종료 및 열린 창 닫기", category: "presentation" },
  { keys: ["Ctrl", "Z"], descriptionKo: "실행 취소", category: "editing" },
  { keys: ["Ctrl", "Y"], descriptionKo: "다시 실행", category: "editing" },
  { keys: ["Ctrl", "Shift", "Z"], descriptionKo: "다시 실행 대체 단축키", category: "editing" },
  { keys: ["Ctrl", "H"], descriptionKo: "편집 히스토리 창 열기", category: "editing" },
  { keys: ["Ctrl", "N"], descriptionKo: "새 슬라이드 추가", category: "editing" },
  { keys: ["Ctrl", "B"], descriptionKo: "좌측 슬라이드 목록 패널 전환", category: "canvas" },
  { keys: ["Ctrl", "K"], descriptionKo: "명령어 프롬프트 바 열기", category: "canvas" },
  { keys: ["Ctrl", "D"], descriptionKo: "현재 슬라이드 복제", category: "editing" },
  { keys: ["Ctrl", "+"], descriptionKo: "슬라이드 캔버스 확대", category: "canvas" },
  { keys: ["Ctrl", "-"], descriptionKo: "슬라이드 캔버스 축소", category: "canvas" },
  { keys: ["Ctrl", "0"], descriptionKo: "캔버스 배율 기본값 복원", category: "canvas" },
  { keys: ["Ctrl", "P"], descriptionKo: "PDF 내보내기 및 인쇄", category: "system" },
  { keys: ["?"], descriptionKo: "단축키 안내 열기", category: "system" },
];

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "presentation", label: "발표" },
  { id: "editing", label: "편집" },
  { id: "canvas", label: "캔버스" },
  { id: "system", label: "인쇄 및 기타" },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUT_LIST.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.descriptionKo.toLowerCase().includes(query) ||
      item.keys.some((k) => k.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            키보드 단축키 안내
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="px-6 py-3 bg-[#101520] border-b border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-sky-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="단축키 또는 기능 검색..."
              className="w-full bg-[#0b101b] border border-white/10 focus:border-sky-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Flat Shortcuts List (No box-in-box, no badges) */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-xs font-medium text-slate-300">
                일치하는 단축키가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="text-sky-400 text-xs hover:underline cursor-pointer"
              >
                전체 목록 보기
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-xs text-slate-200">{item.descriptionKo}</span>

                  <div className="flex items-center space-x-1 shrink-0">
                    {item.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd className="min-w-[24px] px-2 py-1 rounded-md bg-[#0b101b] border border-white/15 text-[11px] font-mono font-semibold text-sky-200 text-center">
                          {k}
                        </kbd>
                        {ki < item.keys.length - 1 && (
                          <span className="text-slate-500 text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            맥 환경에서는 Ctrl 대신 Command 키를 사용할 수 있습니다.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
