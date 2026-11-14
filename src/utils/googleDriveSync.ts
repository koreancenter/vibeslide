import { DriveFileItem, DriveSyncConfig, DriveSyncLog, SlideData } from "../types";

const DRIVE_CONFIG_STORAGE_KEY = "kind_2026_drive_sync_config";
const DRIVE_LOGS_STORAGE_KEY = "kind_2026_drive_sync_logs";

export const DEFAULT_DRIVE_CONFIG: DriveSyncConfig = {
  isConnected: false,
  fileId: null,
  fileName: null,
  fileMimeType: null,
  lastModifiedTime: null,
  lastSyncedAt: null,
  autoSync: true,
  intervalSeconds: 10,
  syncMode: "auto-apply",
  accessToken: null,
  tokenExpiresAt: null,
};

/**
 * Loads saved Drive sync config from localStorage (strictly excluding sensitive credentials)
 */
export function loadDriveSyncConfig(): DriveSyncConfig {
  try {
    const saved = localStorage.getItem(DRIVE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Security defense: If legacy tokens exist in localStorage, immediately purge them
      if (parsed.accessToken || parsed.tokenExpiresAt) {
        delete parsed.accessToken;
        delete parsed.tokenExpiresAt;
        try {
          localStorage.setItem(DRIVE_CONFIG_STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
      }
      return { ...DEFAULT_DRIVE_CONFIG, ...parsed, accessToken: null, tokenExpiresAt: null };
    }
  } catch (e) {
    console.warn("Failed to load drive sync config:", e);
  }
  return DEFAULT_DRIVE_CONFIG;
}

/**
 * Saves Drive sync config to localStorage, explicitly stripping out access tokens to prevent XSS credential theft
 */
export function saveDriveSyncConfig(config: DriveSyncConfig): void {
  try {
    // Explicitly omit sensitive tokens from persistent storage.
    // OAuth access tokens must remain strictly in ephemeral React memory state.
    const { accessToken, tokenExpiresAt, ...safeConfig } = config;
    localStorage.setItem(DRIVE_CONFIG_STORAGE_KEY, JSON.stringify(safeConfig));
  } catch (e) {
    console.warn("Failed to save drive sync config:", e);
  }
}


/**
 * Loads sync logs from localStorage
 */
export function loadDriveSyncLogs(): DriveSyncLog[] {
  try {
    const saved = localStorage.getItem(DRIVE_LOGS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load drive sync logs:", e);
  }
  return [];
}

/**
 * Adds a log entry to sync logs in localStorage
 */
export function addDriveSyncLog(log: Omit<DriveSyncLog, "id" | "timestamp">): DriveSyncLog[] {
  try {
    const existing = loadDriveSyncLogs();
    const newEntry: DriveSyncLog = {
      ...log,
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(DRIVE_LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn("Failed to save drive sync log:", e);
    return [];
  }
}

/**
 * Requests an OAuth access token using Google Identity Services (GSI)
 */
export async function requestGoogleDriveAccessToken(
  clientId?: string,
  hint?: string
): Promise<{ accessToken: string; expiresIn: number }> {
  if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
    throw new Error("Google Identity Services script not loaded. Please check your connection.");
  }

  let effectiveClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (!effectiveClientId) {
    try {
      const res = await fetch("/api/auth/google-client-id");
      if (res.ok) {
        const data = await res.json();
        if (data?.clientId) {
          effectiveClientId = data.clientId;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch google-client-id from server:", e);
    }
  }

  if (!effectiveClientId) {
    throw new Error("Google OAuth Client ID가 설정되지 않았습니다. .env에 GOOGLE_CLIENT_ID를 입력해주세요.");
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        hint: hint || undefined,
        prompt: "select_account",
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Google OAuth error: ${response.error} - ${response.error_description || ""}`));
          } else if (response.access_token) {
            resolve({
              accessToken: response.access_token,
              expiresIn: parseInt(response.expires_in, 10) || 3600,
            });
          } else {
            reject(new Error("No access token returned from Google"));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Lists files from user's Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery = ""
): Promise<DriveFileItem[]> {
  try {
    let q = "trashed = false";
    if (searchQuery.trim()) {
      q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
    }

    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", "35");
    url.searchParams.set(
      "fields",
      "files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink, version)"
    );
    url.searchParams.set("orderBy", "modifiedTime desc");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive API failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error("List Drive Files Error:", error);
    throw error;
  }
}

/**
 * Fetches single file metadata from Google Drive
 */
export async function fetchDriveFileMetadata(
  fileId: string,
  accessToken: string
): Promise<DriveFileItem> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,size,iconLink,webViewLink,version`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch file metadata (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetches file content using backend proxy (handles Google Docs / Slides export and text/media alt)
 */
export async function fetchDriveFileContent(
  fileId: string,
  accessToken: string,
  mimeType?: string
): Promise<string> {
  const res = await fetch("/api/drive/fetch-file-content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId, accessToken, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch content (${res.status})`);
  }

  const data = await res.json();
  return data.content || "";
}

/**
 * Parses raw file content into SlideData[]
 */
export async function parseAndSyncSlideContent(
  fileContent: string,
  fileName: string,
  currentSlides: SlideData[] = []
): Promise<{ slides: SlideData[]; method: string; message: string }> {
  const res = await fetch("/api/drive/parse-and-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileContent, fileName, currentSlides }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to parse drive content (${res.status})`);
  }

  return await res.json();
}
