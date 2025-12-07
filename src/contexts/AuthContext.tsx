"use client";

/**
 * Auth Context for Deputeti AI
 * 
 * Simplified authentication using API key stored in localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  login: (apiKey: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if API key exists in localStorage
  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const apiKey = localStorage.getItem('api_key');
    const userEmail = localStorage.getItem('user_email');
    
    // AUTO-LOGIN: Set default API key if not present
    // TODO: Remove this and restore login requirement when needed
    if (!apiKey) {
      const defaultApiKey = 'sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4';
      localStorage.setItem('api_key', defaultApiKey);
      localStorage.setItem('user_email', 'user@deputeti.ai');
      setUser({
        id: 'user',
        email: 'user@deputeti.ai',
      });
      setLoading(false);
    } else {
      setUser({
        id: 'user',
        email: userEmail || 'user@deputeti.ai',
      });
      setLoading(false);
    }
    
    // COMMENTED OUT: Original login requirement
    // if (apiKey) {
    //   setUser({
    //     id: 'user',
    //     email: userEmail || 'user@deputeti.ai',
    //   });
    //   setLoading(false);
    // } else {
    //   setUser(null);
    //   setLoading(false);
    // }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function - store API key
  const login = useCallback(async (apiKey: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Validate API key format (basic check)
      if (!apiKey || !apiKey.startsWith('sk-')) {
        setError('Invalid API key format');
        setLoading(false);
        return { success: false, error: 'Invalid API key format' };
      }

      // Store API key
      localStorage.setItem('api_key', apiKey);
      if (email) {
        localStorage.setItem('user_email', email);
      }

      // Set user state
      setUser({
        id: 'user',
        email: email || 'user@deputeti.ai',
      });

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('user_email');
    localStorage.removeItem('chat_sessions_list');
    
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
          console.error('Error clearing chat sessions:', e);
        }
      }
      localStorage.removeItem('chat_sessions_list');
    }
    
    setUser(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
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
