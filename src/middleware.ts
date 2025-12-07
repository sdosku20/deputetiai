import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware - Minimal Implementation
 * 
 * IMPORTANT: The has_dashboard check is now in the server component (dashboard/page.tsx)
 * because:
 * 1. Middleware runs on Edge Runtime and doesn't have reliable access to cookies
 * 2. Server component has access to cookies() and can authenticate properly
 * 3. Server component can use redirect() which is server-only
 * 
 * This middleware just ensures the page can load, delegating auth checks to the app.
 */
export async function middleware(request: NextRequest) {
  // For now, just let all requests through
  // The server component will handle auth and has_dashboard checks
  return NextResponse.next();
}

// Disable middleware for now - server component handles it
export const config = {
  matcher: [] // Empty matcher means middleware doesn't run
};
