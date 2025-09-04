import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log("login route - processing request");
    const { email, password } = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log("login response", data);
    
    if (response.ok && data.success) {
      const token = data.data.token;
      (await cookies()).set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Login route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}