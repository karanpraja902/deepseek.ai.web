import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (token) {
    // Store token in a cookie that can be accessed by the client
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('auth_token', token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  }
  
  // If no token, redirect to sign-in with error
  return NextResponse.redirect(new URL('/sign-in?error=auth_failed', request.url));
}
