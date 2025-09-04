import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();
        console.log("signup route - received data:", { name, email, password: '***' });
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app'}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });
        
        const data = await response.json();
        console.log("signup response:", data);
        
        if (response.ok && data.success) {
            // Set the auth token cookie
            (await cookies()).set('auth_token', data.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            return NextResponse.json({
                success: true,
                message: data.message,
                data: {
                    user: data.data.user
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error || 'Registration failed'
            }, { status: response.status });
        }
    } catch (error: any) {
        console.error('Registration route error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}