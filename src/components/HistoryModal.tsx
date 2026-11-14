import React, { useState } from "react";
import { Undo2, Redo2, RotateCcw, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryTimelineItem {
  id: string;
  action: string;
  timestamp: number;
  isCurrent: boolean;
  isPast: boolean;
  slideCount: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: HistoryTimelineItem[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToPastIndex: (pastIndex: number) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  timeline,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpToPastIndex,
  onClearHistory,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const pastItems = timeline.filter((t) => t.isPast);
  const currentItem = timeline.find((t) => t.isCurrent);
  const futureItems = timeline.filter((t) => !t.isPast && !t.isCurrent);

  const formatTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return "방금 전";
    if (diffSec < 60) return `${diffSec}초 전`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10 font-sans text-slate-200"
          >
            {/* Header: No left icon, no subtitle, no badges */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#141b29]">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                슬라이드 편집 히스토리
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

            {/* Action Bar */}
            <div className="px-6 py-3 bg-[#101520] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 disabled:opacity-40 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>실행 취소</span>
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 disabled:opacity-40 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>다시 실행</span>
                </button>
              </div>
            </div>

            {/* Flat Timeline List (No box-in-box) */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {timeline.length <= 1 && pastItems.length === 0 && futureItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1.5">
                  <p className="text-xs font-medium text-slate-300">저장된 편집 내역이 없습니다.</p>
                  <p className="text-[11px] text-slate-500">
                    슬라이드를 수정하면 복원 가능한 시점이 순서대로 기록됩니다.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {futureItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center space-x-3">
                        <Redo2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <div className="text-xs text-slate-300 line-through">{item.action}</div>
                          <div className="text-[11px] text-slate-500">
                            {formatTime(item.timestamp)} · 슬라이드 {item.slideCount}장
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-300">다시 실행 가능</span>
                    </div>
                  ))}

                  {currentItem && (
                    <div className="py-3.5 px-2.5 rounded-lg bg-sky-500/15 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-white">{currentItem.action}</div>
                          <div className="text-[11px] text-sky-200/80 mt-0.5">
                            {formatTime(currentItem.timestamp)} · 슬라이드 {currentItem.slideCount}장
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-sky-300">현재 상태</span>
                    </div>
                  )}

                  {[...pastItems].reverse().map((item, reverseIdx) => {
                    const originalPastIndex = pastItems.length - 1 - reverseIdx;
                    return (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <Undo2 className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0 transition" />
                          <div>
                            <div className="text-xs font-medium text-slate-200 group-hover:text-white transition">
                              {item.action}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {formatTime(item.timestamp)} · 슬라이드 {item.slideCount}장
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onJumpToPastIndex(originalPastIndex);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-sky-500 hover:text-slate-950 text-slate-300 text-xs font-medium transition cursor-pointer whitespace-nowrap"
                        >
                          복원
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 3000);
                  } else {
                    onClearHistory();
                    setConfirmClear(false);
                  }
                }}
                disabled={pastItems.length === 0 && futureItems.length === 0}
                className="text-slate-400 hover:text-sky-300 disabled:opacity-30 flex items-center space-x-1.5 text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{confirmClear ? "한 번 더 눌러 초기화" : "히스토리 비우기"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
