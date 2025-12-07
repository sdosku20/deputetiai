"use client";

/**
 * Root Providers
 *
 * Minimal providers needed for ALL pages (including login)
 * - QueryClientProvider: Required for React Query
 * - AuthProvider: Required for login page and authentication
 *
 * Dashboard-specific providers (TenantProvider) are in (dashboard)/providers.tsx
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export function RootProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
