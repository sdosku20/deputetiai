import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://eu-law.deputeti.ai';
  if (baseUrl.includes('#')) {
    baseUrl = baseUrl.split('#')[0];
  }
  return baseUrl.replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { detail: 'Server API key is not configured' },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const backendUrl = `${getBackendBaseUrl()}/v1/chat/completions`;

    const upstreamResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const bodyText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';

    return new NextResponse(bodyText, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: 'Proxy request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
