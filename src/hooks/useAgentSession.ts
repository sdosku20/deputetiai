import { useState, useCallback, useEffect } from "react";
import { chatClient, ChatMessage, ChatResponse } from "@/lib/api/client";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useAgentSession(sessionId: string | null = null) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation history from localStorage when sessionId changes
  const loadConversationHistory = useCallback(async () => {
    // Don't load if sessionId is null (new conversation not started yet)
    if (!sessionId) {
      setMessages([]); // Clear messages for fresh start
      return;
    }

    try {
      setError(null);
      const history = chatClient.getConversationHistory(sessionId);
      
      // Convert from ChatMessage to AgentMessage format
      const converted: AgentMessage[] = history.map((msg: ChatMessage) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date().toISOString(),
      }));
      
      setMessages(converted);
    } catch (error) {
      console.error("Failed to load conversation history:", error);
      setError("Failed to load conversation history");
    }
  }, [sessionId]);

  // Load conversation history when sessionId changes
  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  const sendMessage = useCallback(
    async (userMessage: string, overrideSessionId?: string): Promise<ChatResponse | null> => {
      if (!userMessage.trim()) return null;

      // Use provided sessionId or fall back to the hook's sessionId
      const activeSessionId = overrideSessionId || sessionId || "default";
      
      console.log("[useAgentSession] Sending message:", {
        message: userMessage.substring(0, 50),
        activeSessionId,
        overrideSessionId,
        hookSessionId: sessionId
      });

      setLoading(true);
      setError(null);

      try {
        // Add user message optimistically
        const userMsg: AgentMessage = {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Save user message immediately to localStorage (even before backend response)
        // This ensures conversation is persisted even if backend fails
        const conversationHistory = chatClient.getConversationHistory(activeSessionId);
        const updatedHistoryWithUser = [...conversationHistory, { role: "user" as const, content: userMessage }];
        
        // Save immediately with user message
        if (typeof window !== 'undefined') {
          try {
            const sessionData = {
              session_id: activeSessionId,
              messages: updatedHistoryWithUser,
              last_updated: new Date().toISOString(),
            };
            localStorage.setItem(`chat_session_${activeSessionId}`, JSON.stringify(sessionData));
            
            // Update sessions list immediately
            const sessionsJson = localStorage.getItem('chat_sessions_list');
            let sessions: any[] = sessionsJson ? JSON.parse(sessionsJson) : [];
            const firstUserMessage = updatedHistoryWithUser.find(m => m.role === 'user');
            const preview = firstUserMessage?.content.substring(0, 50) || 'New conversation';
            
            // Remove existing session if present
            sessions = sessions.filter(s => s.session_id !== activeSessionId);
            
            // Add/update session at the beginning
            sessions.unshift({
              session_id: activeSessionId,
              preview,
              last_updated: sessionData.last_updated,
              message_count: updatedHistoryWithUser.length,
            });
            
            localStorage.setItem('chat_sessions_list', JSON.stringify(sessions));
            
            // Dispatch event to refresh UI
            window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: activeSessionId } }));
          } catch (saveError) {
            console.error('[useAgentSession] Error saving user message:', saveError);
          }
        }
        
        console.log('[useAgentSession] Conversation history:', conversationHistory);
        
        // Send to chat API - try with empty history first
        const response = await chatClient.sendMessage(userMessage, activeSessionId, []);

        console.log("[useAgentSession] Response received:", {
          success: response?.success,
          hasResponse: !!response?.response,
          error: response?.error
        });

        if (response && response.success && response.response) {
          // Add assistant response
          const assistantMsg: AgentMessage = {
            role: "assistant",
            content: response.response,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          
          // Dispatch event to refresh sessions list
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: activeSessionId } }));
          }
          
          return response;
        } else {
          // Backend responded but indicated failure
          const errorDetails = response?.error ? String(response.error) : 'Unknown error';
          console.error("[useAgentSession] ❌ Backend indicated failure:", {
            success: response?.success,
            hasResponse: !!response?.response,
            error: errorDetails
          });
          
          const errorContent = response?.error || 
                              "I encountered an error processing your request. Please try again.";
          
          const errorMsg: AgentMessage = {
            role: "assistant",
            content: errorContent,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
          setError(response?.error || "Failed to get response from assistant");
          
          // Even on error, save the conversation (user message + error message)
          // This ensures the conversation is still in "Previous Chats"
          if (typeof window !== 'undefined') {
            try {
              const currentHistory = chatClient.getConversationHistory(activeSessionId);
              const historyWithError = [...currentHistory, { role: "assistant" as const, content: errorContent }];
              const sessionData = {
                session_id: activeSessionId,
                messages: historyWithError,
                last_updated: new Date().toISOString(),
              };
              localStorage.setItem(`chat_session_${activeSessionId}`, JSON.stringify(sessionData));
              
              // Update sessions list
              const sessionsJson = localStorage.getItem('chat_sessions_list');
              let sessions: any[] = sessionsJson ? JSON.parse(sessionsJson) : [];
              const firstUserMessage = historyWithError.find(m => m.role === 'user');
              const preview = firstUserMessage?.content.substring(0, 50) || 'New conversation';
              
              sessions = sessions.filter(s => s.session_id !== activeSessionId);
              sessions.unshift({
                session_id: activeSessionId,
                preview,
                last_updated: sessionData.last_updated,
                message_count: historyWithError.length,
              });
              
              localStorage.setItem('chat_sessions_list', JSON.stringify(sessions));
              window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: activeSessionId } }));
            } catch (saveError) {
              console.error('[useAgentSession] Error saving error message:', saveError);
            }
          }
          
          // Don't remove user message - keep it in the conversation
          
          return null;
        }
      } catch (err) {
        console.error("[useAgentSession] Request failed:", err);
        
        const errorMsg: AgentMessage = {
          role: "assistant",
          content: "Request failed. Please check your API key and try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        
        // Even on exception, save the conversation (user message + error message)
        // This ensures the conversation is still in "Previous Chats"
        if (typeof window !== 'undefined') {
          try {
            const currentHistory = chatClient.getConversationHistory(activeSessionId);
            const historyWithError = [...currentHistory, { role: "assistant" as const, content: errorMsg.content }];
            const sessionData = {
              session_id: activeSessionId,
              messages: historyWithError,
              last_updated: new Date().toISOString(),
            };
            localStorage.setItem(`chat_session_${activeSessionId}`, JSON.stringify(sessionData));
            
            // Update sessions list
            const sessionsJson = localStorage.getItem('chat_sessions_list');
            let sessions: any[] = sessionsJson ? JSON.parse(sessionsJson) : [];
            const firstUserMessage = historyWithError.find(m => m.role === 'user');
            const preview = firstUserMessage?.content.substring(0, 50) || 'New conversation';
            
            sessions = sessions.filter(s => s.session_id !== activeSessionId);
            sessions.unshift({
              session_id: activeSessionId,
              preview,
              last_updated: sessionData.last_updated,
              message_count: historyWithError.length,
            });
            
            localStorage.setItem('chat_sessions_list', JSON.stringify(sessions));
            window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: activeSessionId } }));
          } catch (saveError) {
            console.error('[useAgentSession] Error saving exception message:', saveError);
          }
        }
        
        // Don't remove user message - keep it in the conversation
        
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const deleteConversation = useCallback(async () => {
    if (!sessionId) {
      console.warn("Cannot delete conversation: no session ID");
      return;
    }
    
    try {
      setError(null);
      chatClient.deleteConversation(sessionId);
      setMessages([]);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setError("Failed to delete conversation");
    }
  }, [sessionId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteConversation,
    refreshHistory: loadConversationHistory,
    clearError: () => setError(null),
  };
}
