import axios, { AxiosInstance, AxiosError } from 'axios';
import { devError, devLog, devWarn } from '@/lib/utils/logger';
// ALL TRANSLATION DISABLED - Backend handles everything
// No language detection, no system messages, no translation from frontend

// API Base URL - use eu-law.deputeti.ai (without #/chat which is frontend route)
// Note: #/chat is a frontend route, API endpoints are at the root domain
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eu-law.deputeti.ai';

// Force correct endpoint - remove any hash routes or old endpoints
if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
  devWarn('[API Config] ⚠️ Detected old endpoint, forcing to eu-law.deputeti.ai');
  API_BASE_URL = 'https://eu-law.deputeti.ai';
}
// Remove hash routes if accidentally included (they're frontend routes, not API)
if (API_BASE_URL.includes('#')) {
  API_BASE_URL = API_BASE_URL.split('#')[0];
}
// Ensure no trailing slash
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';

// Debug: Log environment on client side (only in browser)
if (typeof window !== 'undefined') {
  // Warn if old endpoint is detected
  if (API_BASE_URL.includes('asistenti.deputeti.ai')) {
    devError('[API Config] ⚠️ WARNING: Using old endpoint! Please set NEXT_PUBLIC_API_URL=https://eu-law.deputeti.ai');
  }

  devLog('[API Config] Environment check:', {
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

    // Request interceptor - attach JWT Bearer token
    this.client.interceptors.request.use(
      async (config) => {
        // Get JWT token from localStorage (from login) or login if missing
        let jwtToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

        // If no token, try to get one (this will be async, but axios supports async interceptors)
        if (!jwtToken && typeof window !== 'undefined') {
          jwtToken = await self.ensureValidToken();
        }

        const fullUrl = `${config.baseURL}${config.url}`;
        devLog(`[API Client] 📤 ${config.method?.toUpperCase()} ${fullUrl}`);

        // Log the actual data that will be sent
        const requestDataForLog = config.data;
        const requestDataJson = typeof requestDataForLog === 'string'
          ? requestDataForLog
          : JSON.stringify(requestDataForLog);

        devLog('[API Client] Request config:', {
          fullUrl: fullUrl,
          baseURL: config.baseURL,
          url: config.url,
          method: config.method,
          headers: {
            ...config.headers,
            // Mask sensitive headers in logs
            'Authorization': config.headers['Authorization'] ? 'Bearer ***' : undefined,
          },
          dataType: typeof config.data,
          dataAsJson: requestDataJson,
          hasJWT: !!config.headers['Authorization'],
        });

        // Use JWT Bearer token if available
        if (jwtToken) {
          config.headers['Authorization'] = `Bearer ${jwtToken}`;
          devLog('[API Client] ✓ Added Authorization Bearer token');
        }

        if (!jwtToken) {
          devWarn('[API Client] ⚠️ No JWT token found');
        }

        return config;
      },
      (error) => {
        devError('[API Client] ❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        devLog(`[API Client] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);

        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status || error.code || 'Network Error';
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;
        const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url;

        devError(`[API Client] ❌ ${status} ${method} ${fullUrl}`);

        // Better error logging - extract data properly
        const responseData = error.response?.data;
        const responseDataStr = responseData
          ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2))
          : 'No response data';

        // Log comprehensive error details
        devError('[API Client] Error details:', {
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
        });

        // Log full error response for 500 errors
        if (error.response?.status === 500) {
          devError('[API Client] 500 Server Error - Full response:', JSON.stringify(error.response?.data, null, 2));
        }

        // Handle 401 Unauthorized - token might be expired, try to refresh
        if (error.response?.status === 401) {
          devWarn('[API Client] ⚠️ 401 Unauthorized - token may be expired, attempting to refresh...');

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
                devLog('[API Client] ✓ Retrying request with new token');
                return self.client.request(error.config);
              }
            } catch (refreshError) {
              devError('[API Client] ❌ Failed to refresh token:', refreshError);
            }
          }
        }

        // Enhanced: Export error details in copyable format for debugging
        // Handle network errors and timeouts gracefully
        if (error.code === 'ECONNABORTED') {
          devError('[API Client] ⚠️ Request timeout - server may be processing');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          devError('[API Client] ⚠️ Network error - Possible causes:');
          devError('  1. CORS issue - server may not allow requests from this origin');
          devError('  2. Server is down or unreachable');
          devError('  3. SSL/certificate issue');
          devError('  4. Endpoint does not exist:', fullUrl);
          devError('  5. Check browser console Network tab for more details');
        } else if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.code === 'ERR_SSL_PROTOCOL_ERROR') {
          devError('[API Client] ⚠️ SSL/Certificate error - server certificate may be invalid');
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
      devLog('[API Client] No JWT token found, attempting login...');
      try {
        const loginResponse = await fetch(`/api/auth/login`, {
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
            window.dispatchEvent(new CustomEvent('jwtTokenUpdated'));
            devLog('[API Client] ✓ Login successful, JWT token obtained');
          } else {
            devError('[API Client] ❌ Login response missing token:', loginData);
          }
        } else {
          const errorText = await loginResponse.text();
          devError('[API Client] ❌ Login failed:', loginResponse.status, errorText);
        }
      } catch (loginError) {
        devError('[API Client] ❌ Login error:', loginError);
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
  sources?: ChatSource[];
  reasoningSteps?: string[];
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
  sources?: unknown;
  metadata?: unknown;
}

export interface ChatSource {
  label: string;
  title?: string;
  reference?: string;
  treaty?: string;
  article?: string;
  documentId?: string;
  articleHeading?: string;
  textPreview?: string;
  sourceType?: string;
  score?: number;
  dataSource?: "eu_law" | "albanian";
}

// Simplified response for our chat interface
export interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
  sources?: ChatSource[];
  reasoningSteps?: string[];
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

  private extractSources(rawSources: unknown, content: string): ChatSource[] {
    if (Array.isArray(rawSources)) {
      const mappedSources: Array<ChatSource | null> = rawSources
        .map((item) => {
          if (typeof item === "string") {
            const text = item.trim();
            return text ? { label: text } : null;
          }
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            const rawLabel = record.label || record.title || record.reference || record.source || record.id;
            const fallbackLabel = (() => {
              const srcType = typeof record.source_type === "string" ? record.source_type.trim() : "";
              const treaty = typeof record.treaty === "string" ? record.treaty.trim() : "";
              const article = typeof record.article === "string" ? record.article.trim() : "";
              const docId =
                typeof record.document_id === "string"
                  ? record.document_id.trim()
                  : typeof record.document_id === "number"
                    ? String(record.document_id)
                    : "";

              if (treaty && article) return `[${treaty}] ${article}`;
              if (srcType && docId) return `${srcType}:${docId}`;
              if (srcType) return srcType;
              if (docId) return docId;
              return "";
            })();

            const resolvedLabel =
              typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : fallbackLabel;

            if (resolvedLabel) {
              return {
                label: resolvedLabel,
                title: typeof record.title === "string" ? record.title : undefined,
                reference: typeof record.reference === "string" ? record.reference : undefined,
                treaty: typeof record.treaty === "string" ? record.treaty : undefined,
                article: typeof record.article === "string" ? record.article : undefined,
                documentId:
                  typeof record.document_id === "string"
                    ? record.document_id
                    : typeof record.document_id === "number"
                      ? String(record.document_id)
                      : undefined,
                articleHeading: typeof record.article_heading === "string" ? record.article_heading : undefined,
                textPreview: typeof record.text_preview === "string" ? record.text_preview : undefined,
                sourceType: typeof record.source_type === "string" ? record.source_type : undefined,
                score: typeof record.score === "number" ? record.score : undefined,
                dataSource: record.data_source === "albanian" ? "albanian" : record.data_source === "eu_law" ? "eu_law" : undefined,
              };
            }
          }
          return null;
        });

      return mappedSources.filter((item): item is ChatSource => item !== null).slice(0, 12);
    }

    const sourcesFromContent = content.match(/(?:\*\*Sources:\*\*|Sources:)\s*([^\n]+)/i);
    if (sourcesFromContent?.[1]) {
      return sourcesFromContent[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((label) => ({ label }))
        .slice(0, 12);
    }

    return [];
  }

  private extractReasoningSteps(rawMetadata: unknown, content: string, sourcesCount: number): string[] {
    if (rawMetadata && typeof rawMetadata === "object") {
      const metadata = rawMetadata as Record<string, unknown>;
      const candidates = ["thinking_steps", "reasoning_steps", "steps", "thoughts"];

      for (const key of candidates) {
        const value = metadata[key];
        if (Array.isArray(value)) {
          const steps = value
            .map((step) => {
              if (typeof step === "string") return step.trim();
              if (step && typeof step === "object") {
                const record = step as Record<string, unknown>;
                const txt = record.text || record.content || record.summary || record.title;
                return typeof txt === "string" ? txt.trim() : "";
              }
              return "";
            })
            .filter(Boolean)
            .slice(0, 8);
          if (steps.length > 0) return steps;
        }
      }
    }

    const fallbackSteps: string[] = [];
    fallbackSteps.push("Klasifikimi i pyetjes dhe percaktimi i kontekstit ligjor");
    fallbackSteps.push("Kerkimi i fragmenteve relevante ne bazen e burimeve");
    if (sourcesCount > 0) {
      fallbackSteps.push(`Vleresimi i ${sourcesCount} burimeve me relevante`);
    }
    if (/retrieval:/i.test(content)) {
      fallbackSteps.push("Pergjigjja u ndertua mbi fragmentet e rikuperuara (retrieval)");
    }
    fallbackSteps.push("Sinteza e pergjigjes duke respektuar kufizimet e evidences");
    return fallbackSteps;
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
        devWarn('[ChatAPI] Conversation not found, creating new one:', error);
      }
    }

    // Create new conversation
    try {
      const response = await this.apiClient.post<Conversation>('/api/v1/conversations', {
        title: 'Bisede e re',
        profile: 'general',
      });
      devLog('[ChatAPI] Created new conversation:', response.id);
      return response.id;
    } catch (error: any) {
      devError('[ChatAPI] Failed to create conversation:', error);
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

      // Send an abstracted payload to the local proxy. The proxy builds the
      // backend OpenAI-compatible shape server-side.
      const selectedLaw = typeof window !== 'undefined' ? localStorage.getItem('selected_law') : null;
      const source: "eu_law" | "albanian" = selectedLaw === 'albanian' ? 'albanian' : 'eu_law';
      const existingConversationId = (() => {
        if (typeof window === "undefined") return null;
        try {
          const raw = localStorage.getItem(`chat_session_${sessionId}`);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as { conversation_id?: unknown };
          return typeof parsed.conversation_id === "string" ? parsed.conversation_id : null;
        } catch {
          return null;
        }
      })();

      const requestBody: { prompt: string; source: "eu_law" | "albanian"; conversation_id?: string } = {
        prompt: userMessage,
        source,
      };
      if (existingConversationId) {
        requestBody.conversation_id = existingConversationId;
      }

      // Log what we're actually sending
      const requestBodyJson = JSON.stringify(requestBody);
      devLog('[ChatAPI] 📤 Sending request to local proxy:', '/api/chat');
      devLog('[ChatAPI] User message:', userMessage.substring(0, 80));
      devLog('[ChatAPI] Request body (JSON):', requestBodyJson);
      devLog('[ChatAPI] Request details:', {
        messageCount: messages.length,
        messagePreview: userMessage.substring(0, 80),
        source,
      });

      // Ensure JWT is present for chat proxying.
      const ensureJwtToken = async (forceRefresh = false): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        if (forceRefresh) {
          localStorage.removeItem('jwt_token');
        }

        const existing = localStorage.getItem('jwt_token');
        if (existing) return existing;

        try {
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'michael',
              password: 'IUsedToBeAStrongPass__',
            }),
          });
          if (!loginResponse.ok) return null;

          const loginData = await loginResponse.json() as { access_token?: string; token?: string };
          const token = loginData.access_token || loginData.token || null;
          if (token) {
            localStorage.setItem('jwt_token', token);
            window.dispatchEvent(new CustomEvent('jwtTokenUpdated'));
          }
          return token;
        } catch {
          return null;
        }
      };

      let jwtToken = await ensureJwtToken();
      if (!jwtToken) {
        return {
          success: false,
          response: '',
          error: 'Autentikimi deshtoi. Ju lutem hyni perseri.',
        };
      }

      const sendProxyRequest = (token: string) =>
        axios.post<ChatCompletionResponse>('/api/chat', requestBody, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 120000,
        });

      let proxyResponse;
      try {
        proxyResponse = await sendProxyRequest(jwtToken);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          const refreshedToken = await ensureJwtToken(true);
          if (!refreshedToken) throw error;
          proxyResponse = await sendProxyRequest(refreshedToken);
        } else {
          throw error;
        }
      }
      const response = proxyResponse.data;
      const responseMetadata = response.metadata && typeof response.metadata === "object"
        ? (response.metadata as Record<string, unknown>)
        : null;
      const responseConversationId =
        typeof responseMetadata?.conversation_id === "string" ? responseMetadata.conversation_id : existingConversationId;
      const responseSourceSummary = Array.isArray(response.sources)
        ? response.sources.slice(0, 8).map((item) => {
          if (item && typeof item === "object") {
            const sourceRecord = item as Record<string, unknown>;
            return String(
              sourceRecord.source ||
              sourceRecord.data_source ||
              sourceRecord.source_type ||
              sourceRecord.treaty ||
              sourceRecord.id ||
              "unknown"
            );
          }
          return typeof item === "string" ? item : "unknown";
        })
        : [];

      // Extract stable short reference ID from response for backend tracking
      const rawId = response.id || '';
      const normalizedId = rawId.replace(/^chatcmpl-/, '');
      const tailRefMatch = normalizedId.match(/([a-z0-9]{8,})$/i);
      const refId = tailRefMatch
        ? tailRefMatch[1].slice(0, 8)
        : normalizedId.slice(0, 8) || '';

      devLog('[ChatAPI] Response received:', {
        status: 'success',
        rawId,
        refId,
        selectedLaw,
        requestSource: source,
        responseSourceSummary,
        fullResponse: response,
      });

      // Extract assistant message from response - return EXACTLY as received from backend
      const assistantMessage = response.choices?.[0]?.message?.content || '';

      if (!assistantMessage) {
        devError('[ChatAPI] No assistant message in response:', response);
        return {
          success: false,
          response: '',
          error: 'No response from assistant',
        };
      }

      // Append reference ID to content so it persists in localStorage
      const finalResponse = refId
        ? `${assistantMessage}\n\nref: ${refId}`
        : assistantMessage;
      const sources = this.extractSources(response.sources, assistantMessage);
      const reasoningSteps = this.extractReasoningSteps(response.metadata, assistantMessage, sources.length);
      devLog('[ChatAPI] Response with ref:', refId, finalResponse.substring(0, 80));

      // Store conversation in localStorage for session management
      const updatedMessages: ChatMessage[] = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: finalResponse, sources, reasoningSteps },
      ];

      this.saveSessionMessages(sessionId, updatedMessages, responseConversationId || undefined);

      // Dispatch event to refresh sessions list in UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId } }));
      }

      return {
        success: true,
        response: finalResponse,
        sources,
        reasoningSteps,
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
      devError('[ChatAPI] ❌ Error sending message:', {
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
        devError('[ChatAPI] 🔍 Network Error Diagnosis:');
        devError('  1. Check if endpoint exists:', fullUrl);
        devError('  2. Check browser Network tab for CORS errors');
        devError('  3. Verify server is reachable');
        devError('  4. Check if SSL certificate is valid');
        devError('  5. Try opening the URL directly in browser:', fullUrl);
      }

      // Build a production-safe user message (avoid leaking endpoint URLs/internal details)
      let userErrorMessage = 'Ndodhi nje gabim gjate perpunimit te kerkeses. Ju lutem provoni perseri.';

      if (errorCode === 'ERR_NETWORK' || errorMessage?.includes('Network Error')) {
        userErrorMessage = 'U zbulua problem me rrjetin. Ju lutem kontrolloni lidhjen dhe provoni perseri.';
      } else if (errorCode === 'ECONNABORTED') {
        userErrorMessage = 'Kerkesa po zgjat me shume se sa pritej. Ju lutem provoni perseri.';
      } else if (errorStatus === 401 || errorStatus === 403) {
        userErrorMessage = 'Autentikimi deshtoi. Ju lutem hyni perseri.';
      } else if (errorStatus === 429) {
        userErrorMessage = 'Ka shume kerkesa per momentin. Ju lutem prisni pak dhe provoni perseri.';
      } else if (typeof errorStatus === 'number' && errorStatus >= 500) {
        userErrorMessage = 'Sherbimi eshte perkohesisht i padisponueshem. Ju lutem provoni pas pak.';
      } else if (typeof errorStatus === 'number' && errorStatus >= 400) {
        userErrorMessage = 'Kerkesa nuk mund te plotesohej. Ju lutem verifikoni inputin dhe provoni perseri.';
      }

      // If we got a 500 error with RAG pipeline error, show it clearly
      if (errorStatus === 500 && userErrorMessage.includes('RAG')) {
        devError('[ChatAPI] ⚠️ RAG Pipeline Error detected!');
        devError('[ChatAPI] This suggests the backend received data in an unexpected format.');
        devError('[ChatAPI] Error response:', errorDataStr);
        devError('[ChatAPI] What we sent:', requestDataStr);
        devError('[ChatAPI] Expected format (from working website):', JSON.stringify({
          content: "What is Article 50 TEU?"
        }, null, 2));
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

      return messages
        .map((msg) => {
          const role = msg.role as "user" | "assistant" | "system";
          const content = String(msg.content || "");
          const chatMessage = msg as ChatMessage;
          const sources = Array.isArray(chatMessage.sources)
            ? chatMessage.sources
            : undefined;
          const reasoningSteps = Array.isArray(chatMessage.reasoningSteps)
            ? chatMessage.reasoningSteps.map((step) => String(step))
            : undefined;

          return {
            role,
            content,
            ...(sources ? { sources } : {}),
            ...(reasoningSteps ? { reasoningSteps } : {}),
          } as ChatMessage;
        })
        .filter((msg) => msg.role && msg.content);
    } catch (error) {
      devError('[ChatAPI] Error loading conversation history:', error);
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
      devError('[ChatAPI] Error saving session messages:', error);
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
      devError('[ChatAPI] Error loading sessions list:', error);
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
        devWarn(`[ChatAPI] No session found for ${sessionId}, cannot update list`);
        return;
      }

      const session: SessionMessages = JSON.parse(stored);
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      const preview = firstUserMessage?.content.substring(0, 50) || 'Bisede e re';

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
      devLog(`[ChatAPI] Updated sessions list. Total sessions: ${sessions.length}`);
    } catch (error) {
      devError('[ChatAPI] Error updating sessions list:', error);
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
      devError('[ChatAPI] Error deleting session:', error);
    }
  }
}

export const chatClient = new ChatAPIClient(apiClient);
// Legacy export name for compatibility
export const agentClient = chatClient;
