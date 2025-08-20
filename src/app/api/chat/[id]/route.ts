import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '../../../../lib/chat-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("params:", params);
    const Id = await params.id.split("&&");
    console.log("IdDDDDDDDDD:", Id);
    const chatId = Id[0];
    const userId = Id[1];
    const chat = await ChatService.getChat(chatId, userId);
    console.log("chat:", chat);
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
