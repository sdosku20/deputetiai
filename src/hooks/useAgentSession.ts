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

        // Get conversation history for context
        const conversationHistory = chatClient.getConversationHistory(activeSessionId);
        
        // Send to chat API with conversation history
        const response = await chatClient.sendMessage(userMessage, activeSessionId, conversationHistory);

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
          return response;
        } else {
          // Backend responded but indicated failure
          console.error("[useAgentSession] Backend indicated failure:", {
            response,
            success: response?.success,
            error: response?.error
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
          
          // Remove the optimistic user message on error
          setMessages((prev) => prev.filter((msg, idx) => 
            !(idx === prev.length - 2 && msg.role === "user" && msg.content === userMessage)
          ));
          
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
        
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((msg, idx) => 
          !(idx === prev.length - 2 && msg.role === "user" && msg.content === userMessage)
        ));
        
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
