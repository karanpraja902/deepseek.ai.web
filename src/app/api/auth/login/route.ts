import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("login route", request);
  const { email, password } = await request.json();

  const response = await fetch(`http://localhost:5000/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (data.success) {
    const token = data.data.token;
    (await cookies()).set('auth_token', token);
  }

  return NextResponse.json(data);
// return NextResponse;
  
}