import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://eu-law.deputeti.ai";
  if (baseUrl.includes("#")) baseUrl = baseUrl.split("#")[0];
  return baseUrl.replace(/\/$/, "");
}

function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get("authorization");
}

type CompareAction = "history" | "report" | "search-laws" | "cross" | "amendment" | "replacement";

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: "Missing authorization token." }, { status: 401 });
    }

    const action = (request.nextUrl.searchParams.get("action") || "history") as CompareAction;
    const backendBase = getBackendBaseUrl();
    let url = `${backendBase}/api/v1/compare/history`;

    if (action === "history") {
      url = `${backendBase}/api/v1/compare/history`;
    } else if (action === "report") {
      const reportId = request.nextUrl.searchParams.get("report_id");
      if (!reportId) return NextResponse.json({ detail: "report_id is required." }, { status: 400 });
      url = `${backendBase}/api/v1/compare/history/${encodeURIComponent(reportId)}`;
    } else if (action === "search-laws") {
      const q = request.nextUrl.searchParams.get("q") || "";
      const source = request.nextUrl.searchParams.get("source") || "eu_law";
      const limit = request.nextUrl.searchParams.get("limit") || "10";
      if (!q.trim()) return NextResponse.json({ results: [], source, query: q }, { status: 200 });
      url = `${backendBase}/api/v1/compare/search-laws?q=${encodeURIComponent(q)}&source=${encodeURIComponent(source)}&limit=${encodeURIComponent(limit)}`;
    } else {
      return NextResponse.json({ detail: "Invalid compare action." }, { status: 400 });
    }

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: upstream.status });
    } catch {
      return NextResponse.json({ detail: text || "Invalid upstream response." }, { status: upstream.status });
    }
  } catch {
    return NextResponse.json({ detail: "Compare request failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ detail: "Missing authorization token." }, { status: 401 });
    }

    const action = (request.nextUrl.searchParams.get("action") || "cross") as CompareAction;
    const backendBase = getBackendBaseUrl();
    const body = (await request.json()) as Record<string, unknown>;

    let url = "";
    if (action === "cross") url = `${backendBase}/api/v1/compare/cross-jurisdiction`;
    else if (action === "amendment") url = `${backendBase}/api/v1/compare/amendment`;
    else if (action === "replacement") url = `${backendBase}/api/v1/compare/replacement`;
    else return NextResponse.json({ detail: "Invalid compare action." }, { status: 400 });

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: upstream.status });
    } catch {
      return NextResponse.json({ detail: text || "Invalid upstream response." }, { status: upstream.status });
    }
  } catch {
    return NextResponse.json({ detail: "Compare request failed." }, { status: 500 });
  }
}
