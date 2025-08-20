import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/user-service';

export async function POST(request: NextRequest) {
  try {
    // Initialize static user
    const staticUser = await UserService.initializeStaticUser();

    return NextResponse.json({
      success: true,
      message: 'Static user initialized successfully',
      user: {
        id: staticUser.id,
        email: staticUser.email,
        username: staticUser.username,
        name: staticUser.name,
      },
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize static user' },
      { status: 500 }
    );
  }
}