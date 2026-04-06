import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 45000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;
const MAX_PROMPT_LENGTH = 6000;
const DEFAULT_MODEL = process.env.CHAT_MODEL || process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';
const ALBANIAN_MODEL = process.env.CHAT_MODEL_ALBANIAN || process.env.NEXT_PUBLIC_CHAT_MODEL_ALBANIAN || DEFAULT_MODEL;
const ALLOWED_SOURCES = new Set(['eu_law', 'albanian']);

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type ChatProxyRequest = {
  prompt: string;
  source?: string;
};


type UpstreamChatResponse = {
  id?: string;
  created?: number;
  choices?: unknown;
  usage?: unknown;
  sources?: unknown;
  metadata?: unknown;
};

type UpstreamConversationCreateResponse = {
  id?: string;
};

type UpstreamConversationMessageResponse = {
  tracking_id?: string | number;
  assistant_message?: {
    id?: string;
    role?: string;
    content?: string;
    sources?: unknown;
    metadata?: unknown;
    created_at?: string;
  };
};

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://eu-law.deputeti.ai';
  if (baseUrl.includes('#')) {
    baseUrl = baseUrl.split('#')[0];
  }
  return baseUrl.replace(/\/$/, '');
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return false;
}

function sanitizePrompt(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalized = input.replace(/\u0000/g, '').trim();
  if (!normalized) return null;
  if (normalized.length > MAX_PROMPT_LENGTH) {
    return normalized.slice(0, MAX_PROMPT_LENGTH);
  }
  return normalized;
}

function normalizeSource(input: unknown): 'eu_law' | 'albanian' {
  if (typeof input !== 'string') return 'eu_law';
  const normalized = input.trim().toLowerCase();
  return ALLOWED_SOURCES.has(normalized) ? (normalized as 'eu_law' | 'albanian') : 'eu_law';
}

function getBearerAuthHeader(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  return auth.toLowerCase().startsWith('bearer ') ? auth : null;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}


export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json({ detail: 'Service is not configured.' }, { status: 500 });
    }

    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { detail: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Partial<ChatProxyRequest>;
    const prompt = sanitizePrompt(body.prompt);
    const source = normalizeSource(body.source);
    if (!prompt) {
      return NextResponse.json(
        { detail: 'Invalid request. Prompt is required.' },
        { status: 400 }
      );
    }

    const backendPayload = {
      model: source === 'albanian' ? ALBANIAN_MODEL : DEFAULT_MODEL,
      source,
      data_source: source,
      messages: [{ role: 'user', content: prompt }],
    };

    // For albanian mode, use conversation messages endpoint because it returns
    // Albanian corpus sources (e.g. qbz) while /v1/chat/completions currently
    // returns EU/EURLEX-only sources even with data_source=albanian.
    if (source === 'albanian') {
      const authHeader = getBearerAuthHeader(request);
      if (!authHeader) {
        return NextResponse.json(
          { detail: 'Authorization token is required for Albanian mode.' },
          { status: 401 }
        );
      }

      const backendBase = getBackendBaseUrl();
      const createConversationResponse = await fetchWithTimeout(
        `${backendBase}/api/v1/conversations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            title: 'Bisede e re',
            profile: 'general',
          }),
          cache: 'no-store',
        }
      );

      if (!createConversationResponse.ok) {
        const createText = await createConversationResponse.text();
        return NextResponse.json(
          { detail: createText || 'Failed to create conversation.' },
          { status: createConversationResponse.status }
        );
      }

      let createdConversation: UpstreamConversationCreateResponse | null = null;
      try {
        createdConversation = (await createConversationResponse.json()) as UpstreamConversationCreateResponse;
      } catch {
        createdConversation = null;
      }

      const conversationId = createdConversation?.id;
      if (!conversationId) {
        return NextResponse.json(
          { detail: 'Invalid conversation creation response.' },
          { status: 502 }
        );
      }

      const sendMessageResponse = await fetchWithTimeout(
        `${backendBase}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            content: prompt,
            data_source: 'albanian',
          }),
          cache: 'no-store',
        }
      );

      const sendMessageText = await sendMessageResponse.text();
      if (!sendMessageResponse.ok) {
        try {
          const parsedError = JSON.parse(sendMessageText);
          return NextResponse.json(parsedError, { status: sendMessageResponse.status });
        } catch {
          return NextResponse.json(
            { detail: sendMessageText || 'Failed to get Albanian response.' },
            { status: sendMessageResponse.status }
          );
        }
      }

      let parsedMessage: UpstreamConversationMessageResponse | null = null;
      try {
        parsedMessage = JSON.parse(sendMessageText) as UpstreamConversationMessageResponse;
      } catch {
        parsedMessage = null;
      }

      const assistant = parsedMessage?.assistant_message;
      const assistantContent = assistant?.content;
      if (!assistantContent) {
        return NextResponse.json(
          { detail: 'Invalid conversation message response format.' },
          { status: 502 }
        );
      }

      const syntheticId =
        assistant?.id ||
        (parsedMessage?.tracking_id ? `chatcmpl-${parsedMessage.tracking_id}` : `chatcmpl-${Date.now()}`);

      const safeResponse = {
        id: syntheticId,
        created: Math.floor(Date.now() / 1000),
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: assistantContent,
            },
            finish_reason: 'stop',
          },
        ],
        usage: undefined,
        sources: assistant?.sources ?? [],
        metadata: {
          ...(assistant?.metadata && typeof assistant.metadata === 'object' ? assistant.metadata : {}),
          data_source: 'albanian',
          via: 'conversations_api',
          conversation_id: conversationId,
        },
      };

      // Best-effort cleanup to avoid leaving temporary conversations.
      fetch(`${backendBase}/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
        cache: 'no-store',
      }).catch(() => {
        // no-op
      });

      return NextResponse.json(safeResponse, { status: 200 });
    }

    const backendUrl = `${getBackendBaseUrl()}/v1/chat/completions`;
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(backendPayload),
      cache: 'no-store',
    };

    let upstreamResponse = await fetchWithTimeout(backendUrl, requestInit);
    if ([502, 503, 504].includes(upstreamResponse.status)) {
      upstreamResponse = await fetchWithTimeout(backendUrl, requestInit);
    }

    const responseText = await upstreamResponse.text();

    // Return a minimal safe shape to the browser to avoid exposing backend internals.
    if (upstreamResponse.ok) {
      try {
        const parsed = JSON.parse(responseText) as UpstreamChatResponse;
        const safeResponse = {
          id: parsed.id,
          created: parsed.created,
          choices: parsed.choices,
          usage: parsed.usage,
          sources: parsed.sources,
          metadata: parsed.metadata,
        };
        return NextResponse.json(safeResponse, { status: upstreamResponse.status });
      } catch {
        return NextResponse.json(
          { detail: 'Invalid upstream response format.' },
          { status: 502 }
        );
      }
    }

    // Preserve status, but avoid passing full upstream internals.
    console.warn('[chat-route] Upstream chat failed', {
      status: upstreamResponse.status,
      source,
      responsePreview: responseText.slice(0, 300),
    });

    try {
      const parsedError = JSON.parse(responseText);
      return NextResponse.json(parsedError, { status: upstreamResponse.status });
    } catch {
      return NextResponse.json(
        { detail: responseText || 'Service is temporarily unavailable. Please try again in a moment.' },
        { status: upstreamResponse.status }
      );
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { detail: 'Service timeout. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { detail: 'Service request failed. Please try again.' },
      { status: 500 }
    );
  }
}
