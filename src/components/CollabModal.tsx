import React, { useState } from "react";
import { X, Copy, Check, RefreshCw, Edit2 } from "lucide-react";
import { useModalContext } from "../context/ModalContext";
import { useCollabContext } from "../context/CollabContext";
import { useSlideContext } from "../context/SlideContext";

interface CollabModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CollabModal: React.FC<CollabModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const modalCtx = useModalContext();
  const collabCtx = useCollabContext();
  const slideCtx = useSlideContext();

  const isOpen = propIsOpen !== undefined ? propIsOpen : modalCtx.isModalOpen("collab");
  const handleClose = propOnClose || (() => modalCtx.closeModal("collab"));

  const [copiedLink, setCopiedLink] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(collabCtx.myUser.name);

  if (!isOpen) return null;

  const handleCopyInviteLink = () => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}?room=${encodeURIComponent(collabCtx.roomId)}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      slideCtx.triggerToast("실시간 협업 초대 링크가 복사되었습니다.");
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      collabCtx.updateMyProfile(tempName.trim());
      setEditingName(false);
      slideCtx.triggerToast(`프로필 이름이 "${tempName.trim()}"으로 변경되었습니다.`);
    }
  };

  const handleBroadcastCurrentDeck = () => {
    collabCtx.broadcastSlidesReplace(slideCtx.slides, "덱 전체 동기화");
    slideCtx.triggerToast("현재 슬라이드 덱을 참여자 전원에게 전송했습니다.");
  };

  const PALETTE_COLORS = [
    "#38bdf8",
    "#0ea5e9",
    "#0284c7",
    "#60a5fa",
    "#818cf8",
    "#22d3ee",
    "#93c5fd",
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-[#101520] border border-sky-400/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: No left icon, no subtitle, no badges */}
        <div className="px-6 py-4 bg-[#141b29] border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            실시간 멀티유저 협업
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Flat sections without nested card boxes */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs divide-y divide-white/[0.08]">
          {/* Room Invite Row */}
          <div className="flex items-center justify-between gap-4 pb-5">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-sky-300 mb-1">현재 협업 방</div>
              <div className="font-mono text-sm text-white font-semibold truncate">
                {collabCtx.roomId}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                버전 {collabCtx.roomVersion} · {collabCtx.users.length + 1}명 참여 중
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "복사됨" : "초대 링크 복사"}</span>
            </button>
          </div>

          {/* My Profile Section */}
          <div className="pb-5 space-y-3">
            <div className="text-xs font-medium text-sky-300">내 협업 프로필</div>

            <div className="flex items-center space-x-3">
              {editingName ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#0b101b] border border-sky-400/50 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: collabCtx.myUser.color }}
                    />
                    <span className="font-semibold text-white text-xs">{collabCtx.myUser.name}</span>
                    <span className="text-[11px] text-sky-300">나</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(collabCtx.myUser.name);
                      setEditingName(true);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title="이름 수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">커서 색상</span>
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => collabCtx.updateMyProfile(collabCtx.myUser.name, c)}
                  className={`w-4 h-4 rounded-full transition cursor-pointer ${
                    collabCtx.myUser.color === c ? "ring-2 ring-sky-200 scale-110" : "opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Active Participants Flat List */}
          <div className="pb-5 space-y-2.5">
            <div className="text-xs font-medium text-sky-300">
              접속 중인 참여자 ({collabCtx.users.length + 1}명)
            </div>

            <div className="divide-y divide-white/[0.06]">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-slate-950 shrink-0"
                    style={{ backgroundColor: collabCtx.myUser.color }}
                  >
                    {collabCtx.myUser.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white text-xs">{collabCtx.myUser.name}</div>
                    <div className="text-[11px] text-slate-400">
                      슬라이드 {slideCtx.activeSlideIndex + 1} 편집 중
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-sky-300">본인</span>
              </div>

              {collabCtx.users.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  다른 참여자가 없습니다. 초대 링크를 복사해 동료를 초대하세요.
                </div>
              ) : (
                collabCtx.users.map((peer) => (
                  <div key={peer.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-slate-950 shrink-0"
                        style={{ backgroundColor: peer.color }}
                      >
                        {peer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white text-xs">{peer.name}</div>
                        <div className="text-[11px] text-slate-400">
                          슬라이드 {peer.activeSlideIndex + 1} 열람 중
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-sky-300">접속 중</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Full Deck Broadcast Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleBroadcastCurrentDeck}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 text-xs font-medium text-sky-200 hover:text-white flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>현재 슬라이드 덱 전체 동기화 전송</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b29] border-t border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-200 font-medium text-xs transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
