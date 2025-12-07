import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://asistenti.deputeti.ai';
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';

// Debug: Log environment on client side (only in browser)
if (typeof window !== 'undefined') {
  console.log('[API Config] Environment check:', {
    API_BASE_URL,
    DEFAULT_MODEL,
    env_API_URL: process.env.NEXT_PUBLIC_API_URL,
    env_MODEL: process.env.NEXT_PUBLIC_CHAT_MODEL,
    isProduction: process.env.NODE_ENV === 'production',
  });
}

/**
 * API Client for Deputeti AI
 * 
 * Uses conversation-based API with JWT Bearer token authentication
 * Endpoint: /api/v1/conversations/{id}/messages
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000, // 2 minutes timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - attach JWT token from localStorage
    this.client.interceptors.request.use(
      (config) => {
        const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

        console.log(`[API Client] 📤 ${config.method?.toUpperCase()} ${config.url}`);
        
        // Log the actual data that will be sent
        const requestDataForLog = config.data;
        const requestDataJson = typeof requestDataForLog === 'string' 
          ? requestDataForLog 
          : JSON.stringify(requestDataForLog);
        
        console.log('[API Client] Request config:', {
          baseURL: config.baseURL,
          url: config.url,
          method: config.method,
          headers: config.headers,
          dataType: typeof config.data,
          dataAsJson: requestDataJson,
        });
        
        // Enhanced: Export request details in copyable format for debugging
        if (config.url?.includes('/conversations') || config.url?.includes('/messages')) {
          const exportData = {
            timestamp: new Date().toISOString(),
            url: config.baseURL + config.url,
            method: config.method?.toUpperCase(),
            headers: config.headers,
            body: config.data,
            cookies: typeof window !== 'undefined' ? document.cookie : 'N/A (SSR)',
          };
          console.log('[API Client] 📋 COPY THIS FOR DEBUGGING:');
          console.log(JSON.stringify(exportData, null, 2));
        }
        
        if (jwtToken) {
          config.headers['Authorization'] = `Bearer ${jwtToken}`;
          console.log('[API Client] ✓ Added Authorization Bearer header:', jwtToken.substring(0, 20) + '...');
        } else {
          console.log('[API Client] ⚠️ No JWT token found in localStorage - request may fail if auth required');
          // Note: Don't block the request - let the backend decide if auth is required
        }

        return config;
      },
      (error) => {
        console.error('[API Client] ❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API Client] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        
        // Enhanced: Export successful response details for debugging
        if (response.config.url?.includes('/chat/completions')) {
          const exportData = {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            requestUrl: response.config.url,
            requestMethod: response.config.method?.toUpperCase(),
          };
          console.log('[API Client] 📋 SUCCESS RESPONSE (COPY FOR DEBUGGING):');
          console.log(JSON.stringify(exportData, null, 2));
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status || 'Network Error';
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        
        console.error(`[API Client] ❌ ${status} ${method} ${url}`);
        
        // Better error logging - extract data properly
        const responseData = error.response?.data;
        const responseDataStr = responseData 
          ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2))
          : 'No response data';
        
        console.error('[API Client] Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: responseDataStr,
          requestHeaders: JSON.stringify(error.config?.headers || {}, null, 2),
          requestData: error.config?.data ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2)) : 'No request data',
        });
        
        // Handle 401 - token expired or invalid
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
            // Try to auto-login again (don't redirect to login page)
            // The auto-login in AuthContext will handle re-authentication
            console.warn('[API Client] 401 Unauthorized - token may have expired, will retry auto-login');
          }
        }
        
        // Log full error response for 500 errors
        if (error.response?.status === 500) {
          console.error('[API Client] 500 Server Error - Full response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        // Enhanced: Export error details in copyable format for debugging
        if (error.config?.url?.includes('/chat/completions')) {
          const exportData = {
            timestamp: new Date().toISOString(),
            status: error.response?.status || 'Network Error',
            statusText: error.response?.statusText,
            errorMessage: error.message,
            errorCode: error.code,
            responseHeaders: error.response?.headers,
            responseData: error.response?.data,
            requestUrl: error.config.url,
            requestMethod: error.config.method?.toUpperCase(),
            requestHeaders: error.config.headers,
            requestData: error.config.data,
          };
          console.error('[API Client] 📋 ERROR RESPONSE (COPY FOR DEBUGGING):');
          console.error(JSON.stringify(exportData, null, 2));
        }

        // Handle network errors and timeouts gracefully
        if (error.code === 'ECONNABORTED') {
          console.warn('Request timeout - server may be processing');
        } else if (error.code === 'ERR_NETWORK') {
          console.warn('Network error - server may be down');
        }

        return Promise.reject(error);
      }
    );
  }

  // Public methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    // If data is a string (pre-stringified JSON), ensure it's sent correctly
    const mergedConfig = config ? {
      ...config,
      headers: {
        ...this.client.defaults.headers,
        ...config.headers,
      }
    } : undefined;
    
    const response = await this.client.post<T>(url, data, mergedConfig);
    return response.data;
  }
}

export const apiClient = new APIClient();

// ==================== Chat API Client (OpenAI-compatible) ====================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Simplified response for our chat interface
export interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
}

// Session-based message storage (client-side only)
interface SessionMessages {
  session_id: string;
  conversation_id?: string; // Backend conversation ID
  messages: ChatMessage[];
  last_updated: string;
}

// Conversation API response format
interface ConversationMessageResponse {
  user_message: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    role: string;
    content: string;
    sources?: any[];
    created_at: string;
  };
  tracking_id?: number;
}

interface Conversation {
  id: string;
  title: string;
  profile: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  scope: string;
}

class ChatAPIClient {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(conversationId?: string): Promise<string> {
    if (conversationId && conversationId.includes('-') && conversationId.length > 30) {
      // Verify conversation exists (only if it looks like a UUID)
      try {
        const conversation = await this.apiClient.get<Conversation>(`/api/v1/conversations/${conversationId}`);
        if (conversation && conversation.id) {
          return conversation.id;
        }
      } catch (error) {
        console.warn('[ChatAPI] Conversation not found, creating new one:', error);
      }
    }

    // Create new conversation
    try {
      const response = await this.apiClient.post<Conversation>('/api/v1/conversations', {
        title: 'New conversation',
        profile: 'general',
      });
      console.log('[ChatAPI] Created new conversation:', response.id);
      return response.id;
    } catch (error: any) {
      console.error('[ChatAPI] Failed to create conversation:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create conversation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Send a chat message using conversation-based API
   */
  async sendMessage(
    userMessage: string,
    sessionId: string = "default",
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // Get or create conversation ID
      // Use sessionId as conversationId if it looks like a UUID, otherwise create new
      const conversationId = sessionId.includes('-') && sessionId.length > 30 
        ? await this.getOrCreateConversation(sessionId)
        : await this.getOrCreateConversation();

      // Build request body: simple {"content": "..."} format
      const requestBody = {
        content: userMessage
      };

      // Log what we're actually sending
      const requestBodyJson = JSON.stringify(requestBody);
      console.log('[ChatAPI] 📤 Sending request to:', `${API_BASE_URL}/api/v1/conversations/${conversationId}/messages`);
      console.log('[ChatAPI] Request body (JSON):', requestBodyJson);
      console.log('[ChatAPI] Request details:', {
        conversationId,
        messageLength: userMessage.length,
        messagePreview: userMessage.substring(0, 50)
      });

      // Send request to conversation messages endpoint
      const response = await this.apiClient.post<ConversationMessageResponse>(
        `/api/v1/conversations/${conversationId}/messages`,
        requestBody
      );

      console.log('[ChatAPI] Response received:', {
        status: 'success',
        hasAssistantMessage: !!response.assistant_message,
        fullResponse: response,
      });

      // Extract assistant message from response
      const assistantMessage = response.assistant_message?.content || '';
      
      if (!assistantMessage) {
        console.error('[ChatAPI] No assistant message in response:', response);
        return {
          success: false,
          response: '',
          error: 'No response from assistant',
        };
      }

      // Store conversation in localStorage for session management
      // Map conversationId to sessionId for our UI
      const messages: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage },
      ];
      
      this.saveSessionMessages(sessionId, messages, conversationId);

      // Dispatch event to refresh sessions list in UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId, conversationId } }));
      }

      return {
        success: true,
        response: assistantMessage,
      };
    } catch (error: any) {
      // Better error logging
      const errorData = error.response?.data;
      const errorStatus = error.response?.status;
      const errorStatusText = error.response?.statusText;
      
      // Extract error message properly
      const errorDataStr = errorData 
        ? (typeof errorData === 'string' ? errorData : JSON.stringify(errorData, null, 2))
        : 'No error data';
      
      const requestDataStr = error.config?.data 
        ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2))
        : 'No request data';
      
      console.error('[ChatAPI] Error sending message:', {
        status: errorStatus,
        statusText: errorStatusText,
        errorMessage: error.message,
        errorCode: error.code,
        errorResponseData: errorDataStr,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestData: requestDataStr,
      });
      
      // Try to extract a meaningful error message from various error formats
      let errorMessage = 'Failed to send message';
      
      if (errorData) {
        // Try different error message locations
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If we got a 500 error with RAG pipeline error, show it clearly
      if (errorStatus === 500 && errorMessage.includes('RAG')) {
        console.error('[ChatAPI] ⚠️ RAG Pipeline Error detected!');
        console.error('[ChatAPI] This suggests the backend received data in an unexpected format.');
        console.error('[ChatAPI] Error response:', errorDataStr);
        console.error('[ChatAPI] What we sent:', requestDataStr);
        console.error('[ChatAPI] Expected format (from working website):', JSON.stringify({
          content: "What is Article 50 TEU?"
        }, null, 2));
      }
      
      return {
        success: false,
        response: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Get conversation history from localStorage
   */
  getConversationHistory(sessionId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(`chat_session_${sessionId}`);
      if (!stored) return [];
      
      const session: SessionMessages = JSON.parse(stored);
      const messages = session.messages || [];
      
      // Filter to only include role and content fields (strip any extra fields like timestamp)
      return messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: String(msg.content || '')
      })).filter(msg => msg.role && msg.content);
    } catch (error) {
      console.error('[ChatAPI] Error loading conversation history:', error);
      return [];
    }
  }

  /**
   * Save conversation messages to localStorage
   */
  private saveSessionMessages(sessionId: string, messages: ChatMessage[], conversationId?: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const session: SessionMessages = {
        session_id: sessionId,
        conversation_id: conversationId,
        messages,
        last_updated: new Date().toISOString(),
      };
      
      localStorage.setItem(`chat_session_${sessionId}`, JSON.stringify(session));
      
      // Update session list
      this.updateSessionList(sessionId);
    } catch (error) {
      console.error('[ChatAPI] Error saving session messages:', error);
    }
  }

  /**
   * Get list of all conversation sessions
   */
  getConversationSessions(): Array<{
    session_id: string;
    preview: string;
    last_updated: string;
    message_count: number;
  }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      if (!sessionsJson) return [];
      
      const sessions = JSON.parse(sessionsJson);
      return sessions.sort((a: any, b: any) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );
    } catch (error) {
      console.error('[ChatAPI] Error loading sessions list:', error);
      return [];
    }
  }

  /**
   * Update the sessions list with a session
   */
  private updateSessionList(sessionId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(`chat_session_${sessionId}`);
      if (!stored) {
        console.warn(`[ChatAPI] No session found for ${sessionId}, cannot update list`);
        return;
      }
      
      const session: SessionMessages = JSON.parse(stored);
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      const preview = firstUserMessage?.content.substring(0, 50) || 'New conversation';
      
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      let sessions: any[] = sessionsJson ? JSON.parse(sessionsJson) : [];
      
      // Remove existing session if present
      sessions = sessions.filter(s => s.session_id !== sessionId);
      
      // Add updated session at the beginning (most recent first)
      sessions.unshift({
        session_id: sessionId,
        preview,
        last_updated: session.last_updated,
        message_count: session.messages.length,
      });
      
      localStorage.setItem('chat_sessions_list', JSON.stringify(sessions));
      console.log(`[ChatAPI] Updated sessions list. Total sessions: ${sessions.length}`);
    } catch (error) {
      console.error('[ChatAPI] Error updating sessions list:', error);
    }
  }

  /**
   * Delete a conversation session
   */
  deleteConversation(sessionId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`chat_session_${sessionId}`);
      
      // Remove from sessions list
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      if (sessionsJson) {
        const sessions: any[] = JSON.parse(sessionsJson);
        const updated = sessions.filter(s => s.session_id !== sessionId);
        localStorage.setItem('chat_sessions_list', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('[ChatAPI] Error deleting session:', error);
    }
  }
}

export const chatClient = new ChatAPIClient(apiClient);
// Legacy export name for compatibility
export const agentClient = chatClient;
