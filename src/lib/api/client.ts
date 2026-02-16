import axios, { AxiosInstance, AxiosError } from 'axios';
// ALL TRANSLATION DISABLED - Backend handles everything
// No language detection, no system messages, no translation from frontend

// API Base URL - use eu-law.deputeti.ai (without #/chat which is frontend route)
// Note: #/chat is a frontend route, API endpoints are at the root domain
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eu-law.deputeti.ai';

// Force correct endpoint - remove any hash routes or old endpoints
if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
  console.warn('[API Config] ⚠️ Detected old endpoint, forcing to eu-law.deputeti.ai');
  API_BASE_URL = 'https://eu-law.deputeti.ai';
}
// Remove hash routes if accidentally included (they're frontend routes, not API)
if (API_BASE_URL.includes('#')) {
  API_BASE_URL = API_BASE_URL.split('#')[0];
}
// Ensure no trailing slash
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';
const ENV_API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4';

// Debug: Log environment on client side (only in browser)
if (typeof window !== 'undefined') {
  // Warn if old endpoint is detected
  if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
    console.error('[API Config] ⚠️ WARNING: Using old endpoint! Please set NEXT_PUBLIC_API_URL=https://eu-law.deputeti.ai');
  }
  
  console.log('[API Config] Environment check:', {
    API_BASE_URL,
    DEFAULT_MODEL,
    env_API_URL: process.env.NEXT_PUBLIC_API_URL,
    env_MODEL: process.env.NEXT_PUBLIC_CHAT_MODEL,
    isProduction: process.env.NODE_ENV === 'production',
    usingDefault: !process.env.NEXT_PUBLIC_API_URL,
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

    // Store reference to this for use in interceptors
    const self = this;

    // Request interceptor - attach JWT Bearer token and/or API key
    this.client.interceptors.request.use(
      async (config) => {
        // Get JWT token from localStorage (from login) or login if missing
        let jwtToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
        
        // If no token, try to get one (this will be async, but axios supports async interceptors)
        if (!jwtToken && typeof window !== 'undefined') {
          jwtToken = await self.ensureValidToken();
        }
        
        // Get API key from env or localStorage (fallback)
        const apiKey = ENV_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('api_key') : null);

        const fullUrl = `${config.baseURL}${config.url}`;
        console.log(`[API Client] 📤 ${config.method?.toUpperCase()} ${fullUrl}`);
        
        // Log the actual data that will be sent
        const requestDataForLog = config.data;
        const requestDataJson = typeof requestDataForLog === 'string' 
          ? requestDataForLog 
          : JSON.stringify(requestDataForLog);
        
        console.log('[API Client] Request config:', {
          fullUrl: fullUrl,
          baseURL: config.baseURL,
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            // Mask sensitive headers in logs
            'Authorization': config.headers['Authorization'] ? 'Bearer ***' : undefined,
            'X-API-Key': config.headers['X-API-Key'] ? config.headers['X-API-Key'].substring(0, 10) + '...' : undefined,
          },
          dataType: typeof config.data,
          dataAsJson: requestDataJson,
          hasJWT: !!config.headers['Authorization'],
          hasAPIKey: !!config.headers['X-API-Key'],
        });
        
        // Use JWT Bearer token (primary) and API key (secondary) if available
        if (jwtToken) {
          config.headers['Authorization'] = `Bearer ${jwtToken}`;
          console.log('[API Client] ✓ Added Authorization Bearer token');
        }
        
        // Also add API key if available (some endpoints may require both)
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
          console.log('[API Client] ✓ Added X-API-Key header:', apiKey.substring(0, 10) + '...');
        }
        
        if (!jwtToken && !apiKey) {
          console.warn('[API Client] ⚠️ No authentication found (JWT token or API key)');
        }

        return config;
      },
      (error) => {
        console.error('[API Client] ❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

      // Response interceptor - handle errors and token refresh
      this.client.interceptors.response.use(
        (response) => {
          console.log(`[API Client] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
          
          return response;
        },
      async (error: AxiosError) => {
        const status = error.response?.status || error.code || 'Network Error';
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url;
        
        console.error(`[API Client] ❌ ${status} ${method} ${fullUrl}`);
        
        // Better error logging - extract data properly
        const responseData = error.response?.data;
        const responseDataStr = responseData 
          ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2))
          : 'No response data';
        
        // Log comprehensive error details
        console.error('[API Client] Error details:', {
          errorCode: error.code,
          errorMessage: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          fullUrl: fullUrl,
          baseURL: error.config?.baseURL,
          url: url,
          method: method,
          responseData: responseDataStr,
          requestHeaders: JSON.stringify(error.config?.headers || {}, null, 2),
          requestData: error.config?.data ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2)) : 'No request data',
          hasJWT: !!error.config?.headers?.['Authorization'],
          hasAPIKey: !!error.config?.headers?.['X-API-Key'],
        });
        
        // Log full error response for 500 errors
        if (error.response?.status === 500) {
          console.error('[API Client] 500 Server Error - Full response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        // Handle 401 Unauthorized - token might be expired, try to refresh
        if (error.response?.status === 401) {
          console.warn('[API Client] ⚠️ 401 Unauthorized - token may be expired, attempting to refresh...');
          
          // Clear old token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
          }
          
          // Try to get a new token
          if (typeof window !== 'undefined') {
            try {
              const newToken = await self.ensureValidToken();
              if (newToken && error.config) {
                // Retry the original request with new token
                error.config.headers['Authorization'] = `Bearer ${newToken}`;
                console.log('[API Client] ✓ Retrying request with new token');
                return self.client.request(error.config);
              }
            } catch (refreshError) {
              console.error('[API Client] ❌ Failed to refresh token:', refreshError);
            }
          }
        }
        
        // Enhanced: Export error details in copyable format for debugging
        // Handle network errors and timeouts gracefully
        if (error.code === 'ECONNABORTED') {
          console.error('[API Client] ⚠️ Request timeout - server may be processing');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          console.error('[API Client] ⚠️ Network error - Possible causes:');
          console.error('  1. CORS issue - server may not allow requests from this origin');
          console.error('  2. Server is down or unreachable');
          console.error('  3. SSL/certificate issue');
          console.error('  4. Endpoint does not exist:', fullUrl);
          console.error('  5. Check browser console Network tab for more details');
        } else if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.code === 'ERR_SSL_PROTOCOL_ERROR') {
          console.error('[API Client] ⚠️ SSL/Certificate error - server certificate may be invalid');
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper method to ensure we have a valid JWT token
  private async ensureValidToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    let jwtToken = localStorage.getItem('jwt_token');
    
    // If no token, try to login
    if (!jwtToken) {
      console.log('[API Client] No JWT token found, attempting login...');
      try {
        const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'michael',
            password: 'IUsedToBeAStrongPass__',
          }),
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          jwtToken = loginData.access_token || loginData.token || null;
          if (jwtToken) {
            localStorage.setItem('jwt_token', jwtToken);
            console.log('[API Client] ✓ Login successful, JWT token obtained');
          } else {
            console.error('[API Client] ❌ Login response missing token:', loginData);
          }
        } else {
          const errorText = await loginResponse.text();
          console.error('[API Client] ❌ Login failed:', loginResponse.status, errorText);
        }
      } catch (loginError) {
        console.error('[API Client] ❌ Login error:', loginError);
      }
    }
    
    return jwtToken;
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

  async sendMessage(
    userMessage: string,
    sessionId: string = "default",
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      // Send ONLY the user message to the backend
      // No system message, no conversation history - backend handles everything
      // This ensures we get the same response as the backend webapp
      const messages: ChatMessage[] = [
        { role: "user", content: userMessage },
      ];

      const requestBody: ChatCompletionRequest = {
        model: DEFAULT_MODEL,
        messages,
      };

      // Log what we're actually sending
      const requestBodyJson = JSON.stringify(requestBody);
      console.log('[ChatAPI] 📤 Sending request to:', `${API_BASE_URL}/v1/chat/completions`);
      console.log('[ChatAPI] User message:', userMessage.substring(0, 80));
      console.log('[ChatAPI] Request body (JSON):', requestBodyJson);
      console.log('[ChatAPI] Request details:', {
        messageCount: messages.length,
        messagePreview: userMessage.substring(0, 80),
      });

      // Step 4: Send request to chat completions endpoint
      // Note: Authentication is handled by the request interceptor
      console.log('[ChatAPI] Sending request to:', `${API_BASE_URL}/v1/chat/completions`);
      const response = await this.apiClient.post<ChatCompletionResponse>(
        `/v1/chat/completions`,
        requestBody
      );

      console.log('[ChatAPI] Response received:', {
        status: 'success',
        fullResponse: response,
      });

      // Extract assistant message from response - return EXACTLY as received from backend
      const assistantMessage = response.choices?.[0]?.message?.content || '';
      
      if (!assistantMessage) {
        console.error('[ChatAPI] No assistant message in response:', response);
        return {
          success: false,
          response: '',
          error: 'No response from assistant',
        };
      }

      // Return response directly from backend - no modifications, no translation
      const finalResponse = assistantMessage;
      console.log('[ChatAPI] Returning response as-is from backend:', finalResponse.substring(0, 80));

      // Store conversation in localStorage for session management
      const updatedMessages: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: finalResponse },
      ];
      
      this.saveSessionMessages(sessionId, updatedMessages);

      // Dispatch event to refresh sessions list in UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId } }));
      }

      return {
        success: true,
        response: finalResponse,
      };
    } catch (error: any) {
      // Better error logging
      const errorData = error.response?.data;
      const errorStatus = error.response?.status;
      const errorStatusText = error.response?.statusText;
      const errorCode = error.code;
      const errorMessage = error.message;
      const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url;
      
      // Extract error message properly
      const errorDataStr = errorData 
        ? (typeof errorData === 'string' ? errorData : JSON.stringify(errorData, null, 2))
        : 'No error data';
      
      const requestDataStr = error.config?.data 
        ? (typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data, null, 2))
        : 'No request data';
      
      // Comprehensive error logging
      console.error('[ChatAPI] ❌ Error sending message:', {
        errorCode: errorCode,
        errorMessage: errorMessage,
        status: errorStatus,
        statusText: errorStatusText,
        fullUrl: fullUrl,
        baseURL: error.config?.baseURL,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        errorResponseData: errorDataStr,
        requestData: requestDataStr,
        hasResponse: !!error.response,
        isNetworkError: errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error'),
        isTimeout: errorCode === 'ECONNABORTED',
        isCORS: errorMessage?.includes('CORS') || errorMessage?.includes('Access-Control'),
      });
      
      // Special handling for network errors
      if (errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error')) {
        console.error('[ChatAPI] 🔍 Network Error Diagnosis:');
        console.error('  1. Check if endpoint exists:', fullUrl);
        console.error('  2. Check browser Network tab for CORS errors');
        console.error('  3. Verify server is reachable');
        console.error('  4. Check if SSL certificate is valid');
        console.error('  5. Try opening the URL directly in browser:', fullUrl);
      }
      
      // Try to extract a meaningful error message from various error formats
      let userErrorMessage = 'Failed to send message';
      
      if (errorData) {
        // Try different error message locations
        if (typeof errorData === 'string') {
          userErrorMessage = errorData;
        } else if (errorData.error?.message) {
          userErrorMessage = errorData.error.message;
        } else if (errorData.message) {
          userErrorMessage = errorData.message;
        } else if (errorData.detail) {
          userErrorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.error) {
          userErrorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else {
          userErrorMessage = JSON.stringify(errorData);
        }
      } else if (errorMessage) {
        userErrorMessage = errorMessage;
      }
      
      // If we got a 500 error with RAG pipeline error, show it clearly
      if (errorStatus === 500 && userErrorMessage.includes('RAG')) {
        console.error('[ChatAPI] ⚠️ RAG Pipeline Error detected!');
        console.error('[ChatAPI] This suggests the backend received data in an unexpected format.');
        console.error('[ChatAPI] Error response:', errorDataStr);
        console.error('[ChatAPI] What we sent:', requestDataStr);
        console.error('[ChatAPI] Expected format (from working website):', JSON.stringify({
          content: "What is Article 50 TEU?"
        }, null, 2));
      }
      
      // For network errors, provide a more helpful message
      if (errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error')) {
        userErrorMessage = `Network error: Unable to connect to ${fullUrl}. Please check your connection and try again.`;
      }
      
      // Return error message as-is
      const translatedErrorMessage = userErrorMessage;
      
      return {
        success: false,
        response: '',
        error: translatedErrorMessage,
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
