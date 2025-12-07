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

  // Listen for new conversation events and refresh
  useEffect(() => {
    const handleConversationCreated = () => {
      console.log("[useConversationSessions] New conversation created, refreshing list...");
      loadSessions();
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated);
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
