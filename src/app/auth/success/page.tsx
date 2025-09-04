'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const oauthProvider = searchParams.get('oauth');
        const timestamp = searchParams.get('t');
        
        addDebugInfo(`Auth success page: OAuth=${oauthProvider}, timestamp=${timestamp}`);
        addDebugInfo('Starting user refresh...');
        
        // Increased delay for better cookie propagation, especially on slower networks
        const delay = retryCount === 0 ? 2000 : 1000 * (retryCount + 1);
        addDebugInfo(`Waiting ${delay}ms for cookie propagation...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Check if cookies are available in the browser
        const cookieExists = document.cookie.includes('auth_token');
        console.log("cookieExists", cookieExists);
        addDebugInfo(`Cookie check: auth_token ${cookieExists ? 'found' : 'not found'} in document.cookie`);
        if (cookieExists) {
          window.location.href = '/chat/new';
        }
        // Refresh user data from the secure HTTP-only cookie
        // await refreshUser();
        
        addDebugInfo('User refresh completed successfully, redirecting...');
        
        // Use window.location.href for a clean redirect that won't trigger middleware loops
        // window.location.href = '/chat/new';
      } catch (error) {
        console.error('Auth success handling failed:', error);
        addDebugInfo(`Auth refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Retry logic for transient network issues
        if (retryCount < 3) {
          addDebugInfo(`Retrying... (attempt ${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          return; // This will trigger useEffect again due to retryCount change
        }
        
        // After 3 retries, redirect to sign-in with detailed error info
        const errorDetails = encodeURIComponent(`auth_failed_after_${retryCount + 1}_retries`);
        // window.location.href = `/sign-in?error=${errorDetails}`;
      }
    };

    handleAuthSuccess();
  }, [refreshUser, searchParams, retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication successful!
          </h2>
          <p className="text-gray-600 mb-4">
            {retryCount > 0 
              ? `Retrying authentication... (${retryCount}/3)` 
              : 'Setting up your session...'}
          </p>
          
          {/* Debug information - only show in development or after retries */}
          {(process.env.NODE_ENV === 'development' || retryCount > 0) && debugInfo.length > 0 && (
            <div className="mt-6 text-left">
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium mb-2">Debug Information</summary>
                <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="mb-1">{info}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading authentication...
          </h2>
          <p className="text-gray-600">Please wait while we set up your session.</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthSuccessContent />
    </Suspense>
  );
}
