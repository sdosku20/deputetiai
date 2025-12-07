import { useState, useCallback, useEffect } from "react";
import { chatClient } from "@/lib/api/client";

export interface ConversationSession {
  session_id: string;
  preview: string;
  last_updated: string;
  message_count: number;
}

/**
 * Hook to manage conversation sessions from localStorage
 * Sessions are stored client-side only
 */
export function useConversationSessions() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions from localStorage
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionsList = chatClient.getConversationSessions();
      console.log(`[useConversationSessions] Loaded ${sessionsList.length} sessions from localStorage`);
      setSessions(sessionsList);
    } catch (err) {
      console.error("Failed to load conversation sessions:", err);
      setError("Failed to load conversations");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Listen for conversation events and refresh
  useEffect(() => {
    const handleConversationCreated = () => {
      console.log("[useConversationSessions] New conversation created, refreshing list...");
      loadSessions();
    };

    const handleSessionUpdated = () => {
      console.log("[useConversationSessions] Session updated, refreshing list...");
      loadSessions();
    };

    // Refresh on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[useConversationSessions] Tab visible, refreshing sessions...");
        loadSessions();
      }
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    window.addEventListener('sessionUpdated', handleSessionUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated);
      window.removeEventListener('sessionUpdated', handleSessionUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadSessions]);

  // Delete a conversation session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        setError(null);
        chatClient.deleteConversation(sessionId);
        // Remove from local state
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        return true;
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        setError("Failed to delete conversation");
        return false;
      }
    },
    []
  );

  // Refresh sessions list (useful after creating a new conversation)
  const refreshSessions = useCallback(() => {
    return loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    deleteSession,
    refreshSessions,
    clearError: () => setError(null),
  };
}
