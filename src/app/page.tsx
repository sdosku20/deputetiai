'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // AUTO-LOGIN: Always redirect to chat (login requirement commented out)
      // TODO: Restore login check when needed
      router.push('/chat');
      
      // COMMENTED OUT: Original authentication check
      // if (isAuthenticated) {
      //   // User is authenticated, redirect to chat interface
      //   router.push('/chat');
      // } else {
      //   // User is not authenticated, redirect to login
      //   router.push('/login');
      // }
    }
  }, [loading, router]); // Removed isAuthenticated dependency

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}
