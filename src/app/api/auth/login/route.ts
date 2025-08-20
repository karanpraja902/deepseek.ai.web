import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/user-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Authenticate user
    const user = await UserService.authenticateUser(email, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}