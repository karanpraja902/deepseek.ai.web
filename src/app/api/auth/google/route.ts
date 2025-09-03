import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log("Google OAuth callback - fetching token from backend");
    
    // Get the authorization code from query params (sent by Google)
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect('http://localhost:3000/sign-in?error=no_code');
    }
    
    // Forward the callback to backend
    const backendResponse = await fetch(`http://localhost:5000/api/auth/google/callback?code=${code}&state=${state || ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const data = await backendResponse.json();
    console.log("Backend response:", data);
    
    if (data.success && data.data?.token) {
      // Set the cookie on frontend
      (await cookies()).set('auth_token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
      
      console.log("Cookie set successfully, redirecting to success page");
      return NextResponse.redirect('http://localhost:3000/auth/success?oauth=google');
    } else {
      console.error("Backend authentication failed:", data);
      return NextResponse.redirect('http://localhost:3000/sign-in?error=auth_failed');
    }
    
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect('http://localhost:3000/sign-in?error=oauth_error');
  }
}