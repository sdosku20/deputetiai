import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUEST_TIMEOUT_MS = 45000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;
const MAX_PROMPT_LENGTH = 6000;
const DEFAULT_MODEL = process.env.CHAT_MODEL || process.env.NEXT_PUBLIC_CHAT_MODEL || 'eu-law-rag';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type ChatProxyRequest = {
  prompt: string;
};

type UpstreamChatResponse = {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: unknown;
  usage?: unknown;
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
    if (!prompt) {
      return NextResponse.json(
        { detail: 'Invalid request. Prompt is required.' },
        { status: 400 }
      );
    }

    const backendPayload = {
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
    };

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
          object: parsed.object,
          created: parsed.created,
          model: parsed.model,
          choices: parsed.choices,
          usage: parsed.usage,
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
    return NextResponse.json(
      { detail: 'Service is temporarily unavailable. Please try again in a moment.' },
      { status: upstreamResponse.status }
    );
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
