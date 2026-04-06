import { NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://eu-law.deputeti.ai";
  if (baseUrl.includes("#")) {
    baseUrl = baseUrl.split("#")[0];
  }
  return baseUrl.replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ detail: "username and password are required" }, { status: 400 });
    }

    const backendUrl = `${getBackendBaseUrl()}/api/v1/auth/login`;
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let parsed: unknown = { detail: "Invalid upstream response" };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { detail: "Invalid upstream response" };
    }

    return NextResponse.json(parsed, { status: upstream.status });
  } catch {
    return NextResponse.json({ detail: "Login proxy request failed" }, { status: 500 });
  }
}
