import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../lib/user-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    console.log("getUser:",userId)

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const userWithMemory = await UserService.getUserWithMemory(userId);
    console.log("userWithMemory:",userWithMemory)
    
    if (!userWithMemory) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: userWithMemory.user,
      memory: userWithMemory.memory,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}