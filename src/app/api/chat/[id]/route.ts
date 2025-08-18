import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '../../../../lib/chat-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = await params.id;
    const chat = await ChatService.getChat(chatId);
    
    if (chat) {
      return NextResponse.json({
        id: chat.id,
        createdAt: chat.createdAt,
        messages: chat.messages,
        title: chat.title,
        isActive: chat.isActive
      });
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error('Failed to get chat:', error);
    return NextResponse.json({ error: 'Failed to get chat' }, { status: 500 });
  }
}
