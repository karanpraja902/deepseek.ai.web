import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("login route", request);
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
  console.log("login response structure:", JSON.stringify(data, null, 2));
  
  if (data.success && data.data && data.data.token) {
    const token = data.data.token;
    console.log("login token found:", token);
    console.log("token length:", token.length);
    
    // Set the cookie on frontend
    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  } else {
    console.error("Token not found in response:", {
      success: data.success,
      hasData: !!data.data,
      hasToken: !!(data.data && data.data.token),
      dataKeys: data.data ? Object.keys(data.data) : []
    });
  }

  return NextResponse.json(data);
// return NextResponse;
  
}