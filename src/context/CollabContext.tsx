import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { CollabUser, SlideData } from "../types";
import { useSlideContext } from "./SlideContext";

interface CollabContextType {
  isConnected: boolean;
  roomId: string;
  myUser: CollabUser;
  users: CollabUser[];
  updateMyProfile: (name: string, color?: string) => void;
  broadcastCursor: (xPercent: number, yPercent: number, slideIndex: number) => void;
  broadcastSlideUpdate: (slideIndex: number, slide: SlideData, actionDesc?: string) => void;
  broadcastSlidesReplace: (slides: SlideData[], actionDesc?: string) => void;
  broadcastSlideChange: (index: number) => void;
  roomVersion: number;
}

const CollabContext = createContext<CollabContextType | undefined>(undefined);

const COLLAB_USER_STORAGE_KEY = "kind_2026_collab_user";

const PALETTE_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

function getStoredOrNewUser(): CollabUser {
  if (typeof window === "undefined") {
    return {
      id: "u_local",
      name: "Presenter",
      color: "#3b82f6",
      activeSlideIndex: 0,
      lastSeen: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(COLLAB_USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return {
          id: parsed.id || `u_${Date.now().toString(36)}`,
          name: parsed.name,
          color: parsed.color || PALETTE_COLORS[0],
          activeSlideIndex: 0,
          lastSeen: Date.now(),
        };
      }
    }
  } catch (e) {
    console.warn("Collab user load notice:", e);
  }

  const randomColor = PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newUser: CollabUser = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Strategist ${randomNum}`,
    color: randomColor,
    activeSlideIndex: 0,
    lastSeen: Date.now(),
  };

  try {
    localStorage.setItem(COLLAB_USER_STORAGE_KEY, JSON.stringify(newUser));
  } catch {}

  return newUser;
}

export const CollabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const slideCtx = useSlideContext();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("kind-2026-main");
  const [myUser, setMyUser] = useState<CollabUser>(getStoredOrNewUser);
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [roomVersion, setRoomVersion] = useState<number>(1);

  const socketRef = useRef<WebSocket | null>(null);
  const isRemoteSyncRef = useRef<boolean>(false);
  const lastCursorSentRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const serverClientIdRef = useRef<string>(myUser.id);
  const slideCtxRef = useRef(slideCtx);
  slideCtxRef.current = slideCtx;
  const myUserRef = useRef(myUser);
  myUserRef.current = myUser;

  const lastSyncedSlidesRef = useRef<SlideData[]>(slideCtx.slides);
  const syncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Read room from URL or default
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam && roomParam.trim()) {
        setRoomId(roomParam.trim());
      }
    } catch {}
  }, []);

  // WebSocket Connection Lifecycle (depends only on roomId so edits never drop connection)
  const connectSocket = useCallback(() => {
    if (typeof window === "undefined") return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/collab?room=${encodeURIComponent(roomId)}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        const currentUser = myUserRef.current;
        const currentSlideCtx = slideCtxRef.current;
        ws.send(
          JSON.stringify({
            type: "join",
            user: {
              name: currentUser.name,
              color: currentUser.color,
              activeSlideIndex: currentSlideCtx.activeSlideIndex,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const currentSlideCtx = slideCtxRef.current;

          switch (msg.type) {
            case "sync": {
              if (msg.clientId) {
                serverClientIdRef.current = msg.clientId;
                setMyUser((prev) => ({ ...prev, id: msg.clientId }));
              }
              if (msg.version) setRoomVersion(msg.version);
              const selfId = msg.clientId || serverClientIdRef.current;
              if (msg.users && Array.isArray(msg.users)) {
                setUsers(msg.users.filter((u: CollabUser) => u.id !== selfId));
              }
              if (msg.slides && Array.isArray(msg.slides) && msg.slides.length > 0) {
                const hasLocalCustomEdits = localStorage.getItem("kind_2026_slides");
                const hasOtherPeers = Array.isArray(msg.users) && msg.users.some((u: CollabUser) => u.id !== selfId);
                if (!hasLocalCustomEdits || hasOtherPeers) {
                  isRemoteSyncRef.current = true;
                  lastSyncedSlidesRef.current = msg.slides;
                  currentSlideCtx.setSlidesWithHistory(msg.slides, "Real-time Room Sync", 0, true);
                  setTimeout(() => {
                    isRemoteSyncRef.current = false;
                  }, 250);
                }
              }
              break;
            }

            case "presence": {
              const selfId = serverClientIdRef.current;
              if (msg.users && Array.isArray(msg.users)) {
                setUsers(msg.users.filter((u: CollabUser) => u.id !== selfId));
              }
              if (msg.joinedUser && msg.joinedUser.id !== selfId) {
                currentSlideCtx.triggerToast(`👋 ${msg.joinedUser.name}님이 회의실에 참여했습니다.`);
              }
              break;
            }

            case "cursor_update": {
              const selfId = serverClientIdRef.current;
              if (msg.userId && msg.cursor && msg.userId !== selfId) {
                setUsers((prev) =>
                  prev.map((u) => (u.id === msg.userId ? { ...u, cursor: msg.cursor } : u))
                );
              }
              break;
            }

            case "slide_update": {
              const selfId = serverClientIdRef.current;
              if (msg.senderId !== selfId && typeof msg.slideIndex === "number" && msg.slide) {
                isRemoteSyncRef.current = true;
                const nextSlides = [...currentSlideCtx.slides];
                nextSlides[msg.slideIndex] = msg.slide;
                lastSyncedSlidesRef.current = nextSlides;
                currentSlideCtx.updateSingleSlide(
                  msg.slideIndex,
                  msg.slide,
                  msg.actionDesc || "Remote edit",
                  true
                );
                if (msg.version) setRoomVersion(msg.version);
                currentSlideCtx.triggerToast(
                  `✍️ ${msg.senderName || "동료"}님이 슬라이드 ${msg.slideIndex + 1}을(를) 편집했습니다.`
                );
                setTimeout(() => {
                  isRemoteSyncRef.current = false;
                }, 200);
              }
              break;
            }

            case "slides_replace": {
              const selfId = serverClientIdRef.current;
              if (msg.senderId !== selfId && Array.isArray(msg.slides)) {
                isRemoteSyncRef.current = true;
                lastSyncedSlidesRef.current = msg.slides;
                currentSlideCtx.setSlidesWithHistory(
                  msg.slides,
                  msg.actionDesc || "Remote deck sync",
                  currentSlideCtx.activeSlideIndex,
                  true
                );
                if (msg.version) setRoomVersion(msg.version);
                currentSlideCtx.triggerToast(`🔄 ${msg.senderName || "동료"}님이 전체 덱을 업데이트했습니다.`);
                setTimeout(() => {
                  isRemoteSyncRef.current = false;
                }, 200);
              }
              break;
            }
          }
        } catch (err) {
          console.warn("WS onmessage parse error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn("WS connect exception:", err);
      setIsConnected(false);
    }
  }, [roomId]);

  // Connect on mount & room change
  useEffect(() => {
    connectSocket();

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        } catch {}
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.onclose = null;
          socketRef.current.close();
        } catch {}
      }
    };
  }, [connectSocket]);

  // Throttled cursor emission (max 20 per second)
  const broadcastCursor = useCallback(
    (xPercent: number, yPercent: number, slideIndex: number) => {
      const now = Date.now();
      if (now - lastCursorSentRef.current < 45) return;
      lastCursorSentRef.current = now;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "cursor",
              cursor: {
                x: Math.round(xPercent * 10) / 10,
                y: Math.round(yPercent * 10) / 10,
                slideIndex,
              },
            })
          );
        } catch {}
      }
    },
    []
  );

  // Broadcast slide update (unless originating from remote update)
  const broadcastSlideUpdate = useCallback(
    (slideIndex: number, slide: SlideData, actionDesc?: string) => {
      if (isRemoteSyncRef.current) return;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "slide_update",
              slideIndex,
              slide,
              actionDesc: actionDesc || `슬라이드 ${slideIndex + 1} 수정`,
            })
          );
        } catch (e) {
          console.warn("WS broadcast slide_update error:", e);
        }
      }
    },
    []
  );

  // Broadcast entire deck replace
  const broadcastSlidesReplace = useCallback(
    (slides: SlideData[], actionDesc?: string) => {
      if (isRemoteSyncRef.current) return;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "slides_replace",
              slides,
              actionDesc: actionDesc || "전체 슬라이드 갱신",
            })
          );
        } catch (e) {
          console.warn("WS broadcast slides_replace error:", e);
        }
      }
    },
    []
  );

  // Broadcast slide index change
  const broadcastSlideChange = useCallback(
    (index: number) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "slide_change",
              activeSlideIndex: index,
            })
          );
        } catch {}
      }
    },
    []
  );

  // Automatically sync local slide edits to peers with lightweight diff & debounce
  useEffect(() => {
    if (isRemoteSyncRef.current) {
      lastSyncedSlidesRef.current = slideCtx.slides;
      return;
    }

    if (slideCtx.slides === lastSyncedSlidesRef.current) return;

    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => {
      if (isRemoteSyncRef.current) return;
      const prev = lastSyncedSlidesRef.current;
      const next = slideCtx.slides;
      lastSyncedSlidesRef.current = next;

      if (!prev || prev.length !== next.length) {
        broadcastSlidesReplace(next, "슬라이드 구성 변경");
        return;
      }

      const changedIndices: number[] = [];
      for (let i = 0; i < next.length; i++) {
        if (prev[i] !== next[i] && JSON.stringify(prev[i]) !== JSON.stringify(next[i])) {
          changedIndices.push(i);
        }
      }

      if (changedIndices.length === 1) {
        const idx = changedIndices[0];
        broadcastSlideUpdate(idx, next[idx], `슬라이드 ${idx + 1} 실시간 편집`);
      } else if (changedIndices.length > 1) {
        broadcastSlidesReplace(next, "다중 슬라이드 변경");
      }
    }, 250);

    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    };
  }, [slideCtx.slides, broadcastSlideUpdate, broadcastSlidesReplace]);

  // Sync active slide navigation to room presence
  useEffect(() => {
    broadcastSlideChange(slideCtx.activeSlideIndex);
  }, [slideCtx.activeSlideIndex, broadcastSlideChange]);

  // Update profile
  const updateMyProfile = useCallback((name: string, color?: string) => {
    setMyUser((prev) => {
      const updated = {
        ...prev,
        name: name.trim() || prev.name,
        color: color || prev.color,
      };
      try {
        localStorage.setItem(COLLAB_USER_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "join",
              user: {
                name: updated.name,
                color: updated.color,
              },
            })
          );
        } catch {}
      }

      return updated;
    });
  }, []);

  return (
    <CollabContext.Provider
      value={{
        isConnected,
        roomId,
        myUser,
        users,
        updateMyProfile,
        broadcastCursor,
        broadcastSlideUpdate,
        broadcastSlidesReplace,
        broadcastSlideChange,
        roomVersion,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
};

export const useCollabContext = () => {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollabContext must be used within a CollabProvider");
  }
  return context;
};
