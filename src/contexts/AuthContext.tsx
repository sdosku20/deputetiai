"use client";

/**
 * Auth Context for Deputeti AI
 * 
 * Simplified authentication using API key
 *  stored in localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { devError, devLog, devWarn } from "@/lib/utils/logger";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const JWT_REFRESHED_AT_KEY = "jwt_token_refreshed_at";
const TOKEN_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check token health every 5 minutes
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000; // Refresh 10 minutes before exp
const TOKEN_FALLBACK_REFRESH_MS = 55 * 60 * 1000; // Fallback hourly refresh if exp is unavailable
const DEFAULT_USERNAME = "michael";
const DEFAULT_PASSWORD = "IUsedToBeAStrongPass__";

function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Set default user immediately - no authentication required
  const [user] = useState<User>({
    id: 'user',
    email: 'user@deputeti.ai',
    name: 'User',
  });
  const [loading, setLoading] = useState(false); // No loading needed
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isRefreshingTokenRef = useRef(false);

  const requestJwtToken = useCallback(
    async (username: string, password: string, reason: string): Promise<string | null> => {
      if (typeof window === "undefined") return null;
      if (isRefreshingTokenRef.current) {
        return localStorage.getItem("jwt_token");
      }

      isRefreshingTokenRef.current = true;
      try {
        devLog(`[AuthContext] Refreshing JWT token (${reason})...`);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          devWarn(`[AuthContext] Token refresh failed (${reason}):`, response.status, errorText);
          return null;
        }

        const data = (await response.json()) as { access_token?: string; token?: string };
        const token = data.access_token || data.token || null;
        if (!token) {
          devWarn(`[AuthContext] Login response missing token (${reason}):`, data);
          return null;
        }

        localStorage.setItem("jwt_token", token);
        localStorage.setItem(JWT_REFRESHED_AT_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent("jwtTokenUpdated"));
        devLog(`[AuthContext] ✓ JWT token refreshed (${reason})`);
        return token;
      } catch (err: unknown) {
        devError(`[AuthContext] Token refresh error (${reason}):`, {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          name: err instanceof Error ? err.name : "UnknownError",
        });
        return null;
      } finally {
        isRefreshingTokenRef.current = false;
      }
    },
    []
  );

  const refreshJwtToken = useCallback(
    async (reason: string): Promise<string | null> => requestJwtToken(DEFAULT_USERNAME, DEFAULT_PASSWORD, reason),
    [requestJwtToken]
  );

  const refreshTokenIfNeeded = useCallback(
    async (reason: string): Promise<void> => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("jwt_token");
      if (!token) {
        await refreshJwtToken(`${reason}:missing`);
        return;
      }

      const expiresAtMs = getJwtExpiryMs(token);
      const now = Date.now();
      let shouldRefresh = false;

      if (typeof expiresAtMs === "number") {
        shouldRefresh = expiresAtMs - now <= TOKEN_REFRESH_BUFFER_MS;
      } else {
        const lastRefreshRaw = localStorage.getItem(JWT_REFRESHED_AT_KEY);
        const lastRefreshAt = Number(lastRefreshRaw || 0);
        shouldRefresh = !Number.isFinite(lastRefreshAt) || now - lastRefreshAt >= TOKEN_FALLBACK_REFRESH_MS;
      }

      if (shouldRefresh) {
        await refreshJwtToken(`${reason}:proactive`);
      }
    },
    [refreshJwtToken]
  );

  // Auto-login in background silently (no blocking, no UI)
  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const bootstrapToken = async () => {
      const existingToken = localStorage.getItem("jwt_token");
      if (!existingToken) {
        await refreshJwtToken("bootstrap");
      } else {
        await refreshTokenIfNeeded("bootstrap-check");
      }
      setLoading(false);
    };

    bootstrapToken();
  }, [refreshJwtToken, refreshTokenIfNeeded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runCheck = () => {
      void refreshTokenIfNeeded("interval");
    };
    const onTabVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshTokenIfNeeded("tab-visible");
      }
    };

    const intervalId = window.setInterval(runCheck, TOKEN_CHECK_INTERVAL_MS);
    window.addEventListener("focus", onTabVisible);
    document.addEventListener("visibilitychange", onTabVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onTabVisible);
      document.removeEventListener("visibilitychange", onTabVisible);
    };
  }, [refreshTokenIfNeeded]);

  // Dummy login function (not used, but required by interface)
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const token = await requestJwtToken(username, password, "manual-login");
    if (!token) {
      return { success: false, error: "Login failed" };
    }
    return { success: true };
  }, [requestJwtToken]);

  // Logout function - just clears chat sessions (no redirect, no login required)
  const logout = useCallback(() => {
    // Clear all chat sessions
    if (typeof window !== 'undefined') {
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      if (sessionsJson) {
        try {
          const sessions = JSON.parse(sessionsJson) as Array<{ session_id?: string }>;
          sessions.forEach((session) => {
            if (typeof session.session_id === "string" && session.session_id.trim()) {
              localStorage.removeItem(`chat_session_${session.session_id}`);
            }
          });
        } catch (e) {
          devError('Error clearing chat sessions:', e);
        }
      }
      localStorage.removeItem('chat_sessions_list');
    }
    void refreshJwtToken("logout");
  }, [refreshJwtToken]);

  const value: AuthContextType = {
    user, // Always set (never null)
    loading: false, // Never loading
    error: null,
    isAuthenticated: true, // Always authenticated (no login required)
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
