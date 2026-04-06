"use client";

/**
 * Auth Context for Deputeti AI
 * 
 * Simplified authentication using API key
 *  stored in localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  // Auto-login in background silently (no blocking, no UI)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check if we already have a token
    const existingToken = localStorage.getItem('jwt_token');
    if (existingToken) {
      setLoading(false);
      // Start background refresh if needed
      return;
    }

    // Silently attempt to get JWT token in background (non-blocking)
    const attemptLogin = async () => {
      try {
        devLog('[AuthContext] Attempting login through local proxy: /api/auth/login');
        
        const response = await fetch(`/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'michael',
            password: 'IUsedToBeAStrongPass__',
          }),
        });

        devLog('[AuthContext] Login response status:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          devLog('[AuthContext] Login response data:', data);
          if (data.access_token || data.token) {
            const token = data.access_token || data.token;
            localStorage.setItem('jwt_token', token);
            window.dispatchEvent(new CustomEvent('jwtTokenUpdated'));
            devLog('[AuthContext] ✓ Background login successful, JWT token stored');
          } else {
            devWarn('[AuthContext] ⚠️ Login response missing token:', data);
          }
        } else {
          const errorText = await response.text();
          devError('[AuthContext] ❌ Login failed:', response.status, errorText);
        }
      } catch (err: any) {
        // Log error details for debugging
        devError('[AuthContext] ❌ Background login error:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
      }
    };

    // Don't wait for login - start it in background
    attemptLogin();
    setLoading(false);
  }, []);

  // Dummy login function (not used, but required by interface)
  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Silently attempt login in background
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.access_token || data.token) {
          localStorage.setItem('jwt_token', data.access_token || data.token);
          window.dispatchEvent(new CustomEvent('jwtTokenUpdated'));
        }
      }
    } catch (err) {
      // Ignore errors
    }
    return { success: true };
  }, []);

  // Logout function - just clears chat sessions (no redirect, no login required)
  const logout = useCallback(() => {
    // Clear all chat sessions
    if (typeof window !== 'undefined') {
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      if (sessionsJson) {
        try {
          const sessions = JSON.parse(sessionsJson);
          sessions.forEach((session: any) => {
            localStorage.removeItem(`chat_session_${session.session_id}`);
          });
        } catch (e) {
          devError('Error clearing chat sessions:', e);
        }
      }
      localStorage.removeItem('chat_sessions_list');
    }
    // Silently refresh JWT token in background
    const attemptLogin = async () => {
      try {
        devLog('[AuthContext] Refreshing JWT token...');
        const response = await fetch(`/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'michael',
            password: 'IUsedToBeAStrongPass__',
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.access_token || data.token) {
            localStorage.setItem('jwt_token', data.access_token || data.token);
            window.dispatchEvent(new CustomEvent('jwtTokenUpdated'));
            devLog('[AuthContext] ✓ JWT token refreshed');
          }
        } else {
          devWarn('[AuthContext] ⚠️ Token refresh failed:', response.status);
        }
      } catch (err) {
        devError('[AuthContext] ❌ Token refresh error:', err);
      }
    };
    attemptLogin();
  }, []);

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
