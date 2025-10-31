'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LandingPage from '../landing/page';

export default function Page() {
  const router = useRouter();
  const { userId, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && userId) {
      // If user is authenticated, redirect to chat
      router.push('/chat/new');
    }
  }, [userId, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    // If user is not authenticated, show landing page
    return <LandingPage />;
  }

  // If user is authenticated, show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-300">Redirecting to chat...</p>
      </div>
    </div>
  );
}