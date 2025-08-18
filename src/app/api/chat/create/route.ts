import { NextResponse } from 'next/server';
import { ChatService } from '../../../../lib/chat-service';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    const chatId = nanoid();
    
    // Create the chat in MongoDB
    await ChatService.createChat(chatId);
    console.log('Chat created successfully:', chatId);
    
    return NextResponse.json({ chatId });
  } catch (error) {
    console.error('Failed to create chat in database:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}