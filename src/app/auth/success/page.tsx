'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function AuthSuccessPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        console.log('Auth success page: Starting user refresh...');
        
        // Add a small delay to ensure cookie is properly set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh user data from the secure HTTP-only cookie
        await refreshUser();
        
        console.log('Auth success page: User refresh completed, redirecting...');
        
        // Use window.location.href for a clean redirect that won't trigger middleware loops
        window.location.href = '/chat/new';
      } catch (error) {
        console.error('Auth success handling failed:', error);
        // Redirect to sign-in if there's an error
        window.location.href = '/sign-in?error=auth_failed';
      }
    };

    handleAuthSuccess();
  }, [refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Authentication successful!</h2>
        <p className="text-gray-600 mt-2">Redirecting you to the application...</p>
      </div>
    </div>
  );
}
