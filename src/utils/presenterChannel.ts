import { Language, SlideData } from "../types";

export const DEFAULT_PRESENTER_CHANNEL = "kind_presenter_sync";

export type PresenterCommandAction =
  | "next"
  | "prev"
  | "goto"
  | "reset-timer"
  | "toggle-timer"
  | "toggle-buildin"
  | "toggle-laser"
  | "close-presenter";

export type PresenterSyncMessage =
  | {
      type: "SYNC_REQUEST";
      senderId: string;
      sessionId: string;
    }
  | {
      type: "STATE_SYNC";
      senderId: string;
      sessionId: string;
      currentIndex: number;
      buildInStep: number;
      buildInEnabled: boolean;
      language: Language;
      themeId: string;
      secondsElapsed: number;
      timerRunning: boolean;
      slides?: SlideData[];
    }
  | {
      type: "COMMAND";
      senderId: string;
      sessionId: string;
      action: PresenterCommandAction;
      targetIndex?: number;
    }
  | {
      type: "LASER_SYNC";
      senderId: string;
      sessionId: string;
      active: boolean;
      xPct: number;
      yPct: number;
    };

export function createPresenterSenderId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getPresenterChannelName(sessionId?: string): string {
  if (!sessionId || sessionId === "default") return DEFAULT_PRESENTER_CHANNEL;
  return `${DEFAULT_PRESENTER_CHANNEL}_${sessionId}`;
}

export function openPresenterBroadcastChannel(sessionId?: string): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  try {
    return new BroadcastChannel(getPresenterChannelName(sessionId));
  } catch {
    return null;
  }
}
