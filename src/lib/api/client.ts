import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://asistenti.deputeti.ai';
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';

/**
 * API Client for Deputeti AI
 * 
 * Uses OpenAI-compatible chat/completions API with X-API-Key authentication
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

    // Request interceptor - attach API key from localStorage
    this.client.interceptors.request.use(
      (config) => {
        const apiKey = typeof window !== 'undefined' ? localStorage.getItem('api_key') : null;

        console.log(`[API Client] 📤 ${config.method?.toUpperCase()} ${config.url}`);
        
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
          console.log('[API Client] ✓ Added X-API-Key header');
        } else {
          console.log('[API Client] ⚠️ No API key found in localStorage');
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
        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status || 'Network Error';
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        
        console.error(`[API Client] ❌ ${status} ${method} ${url}`);
        console.error('[API Client] Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.config?.headers,
          requestData: error.config?.data,
        });
        
        // Handle 401 - invalid API key
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('api_key');
            window.location.href = '/login';
          }
        }
        
        // Log full error response for 500 errors
        if (error.response?.status === 500) {
          console.error('[API Client] 500 Server Error - Full response:', JSON.stringify(error.response?.data, null, 2));
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

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
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
  messages: ChatMessage[];
  last_updated: string;
}

class ChatAPIClient {
  private apiClient: APIClient;
  private model: string;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
    this.model = DEFAULT_MODEL;
  }

  /**
   * Send a chat message using OpenAI-compatible format
   */
  async sendMessage(
    userMessage: string,
    sessionId: string = "default",
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // Build messages array with conversation history + new user message
      // Ensure all messages are in correct format (role and content only)
      const messages: ChatMessage[] = [
        ...conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: typeof msg.content === 'string' ? msg.content : String(msg.content)
        })),
        { role: "user" as const, content: userMessage },
      ];

      // Validate messages format
      for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.content !== 'string') {
          console.error('[ChatAPI] Invalid message format:', msg);
          throw new Error('Invalid message format');
        }
      }

      // Build request matching OpenAI-compatible format exactly
      // Only include model and messages (match curl example exactly)
      const request = {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      console.log('[ChatAPI] Sending request:', {
        model: this.model,
        messageCount: messages.length,
        sessionId,
        url: `${API_BASE_URL}/v1/chat/completions`,
        requestBody: JSON.stringify(request, null, 2),
        messagesPreview: messages.map(m => ({ role: m.role, contentLength: m.content.length }))
      });

      const response = await this.apiClient.post<ChatCompletionResponse>(
        '/v1/chat/completions',
        request
      );

      console.log('[ChatAPI] Response received:', {
        status: 'success',
        hasChoices: !!response.choices,
        choicesLength: response.choices?.length,
        fullResponse: response,
      });

      // Extract assistant message from response
      const assistantMessage = response.choices?.[0]?.message?.content || '';
      
      if (!assistantMessage) {
        console.error('[ChatAPI] No assistant message in response:', response);
        return {
          success: false,
          response: '',
          error: 'No response from assistant',
        };
      }

      // Store conversation in localStorage for session management
      this.saveSessionMessages(sessionId, [
        ...messages,
        { role: "assistant", content: assistantMessage },
      ]);

      return {
        success: true,
        response: assistantMessage,
      };
    } catch (error: any) {
      console.error('[ChatAPI] Error sending message:', {
        error,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        fullError: JSON.stringify(error.response?.data, null, 2),
      });
      
      // Try to extract a meaningful error message from various error formats
      let errorMessage = 'Failed to send message';
      
      // Check different possible error response formats
      const errorData = error.response?.data;
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
      if (error.response?.status === 500 && errorMessage.includes('RAG')) {
        console.error('[ChatAPI] RAG Pipeline Error - This might be a backend issue. Full error:', errorData);
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
      return session.messages || [];
    } catch (error) {
      console.error('[ChatAPI] Error loading conversation history:', error);
      return [];
    }
  }

  /**
   * Save conversation messages to localStorage
   */
  private saveSessionMessages(sessionId: string, messages: ChatMessage[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const session: SessionMessages = {
        session_id: sessionId,
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
      if (!stored) return;
      
      const session: SessionMessages = JSON.parse(stored);
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      const preview = firstUserMessage?.content.substring(0, 50) || 'New conversation';
      
      const sessionsJson = localStorage.getItem('chat_sessions_list');
      let sessions: any[] = sessionsJson ? JSON.parse(sessionsJson) : [];
      
      // Remove existing session if present
      sessions = sessions.filter(s => s.session_id !== sessionId);
      
      // Add updated session
      sessions.push({
        session_id: sessionId,
        preview,
        last_updated: session.last_updated,
        message_count: session.messages.length,
      });
      
      localStorage.setItem('chat_sessions_list', JSON.stringify(sessions));
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
