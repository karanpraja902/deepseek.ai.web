import { nanoid } from 'nanoid';
import { ChatService } from '../lib/chat-service';

// Generate a unique chat ID and create chat in database
export async function createChat(): Promise<string> {
  console.log("createChat")
  const chatId = nanoid();
  
  try {
    // Create the chat in MongoDB
    await ChatService.createChat(chatId);
    console.log('Chat created successfully:', chatId);
  } catch (error) {
    console.error('Failed to create chat in database:', error);
    // Still return the ID even if database creation fails
  }
  
  return chatId;
}

// Get chat by ID from database
export async function getChat(id: string) {
  console.log("getChatFromStore:",id)
  try {
    const chat = await ChatService.getChat(id);
    console.log("chatReceived:",chat)
    if (chat) {
      return {
        id: chat.id,
        createdAt: chat.createdAt,
        messages: chat.messages,
        title: chat.title,
        isActive: chat.isActive
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get chat from database:', error);
    return null;
  }
}

// Save chat data to database
export async function saveChat(id: string, data: Record<string, unknown>) {
  try {
    // This could be used to save additional chat metadata
    // For now, we'll log the operation
    console.log('Saving chat data:', id, data);
    
    // You could also update chat title or other metadata here
    // await ChatService.updateChatTitle(id, data.title as string);
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
}

// Add a message to a chat
export async function addMessage(chatId: string, message: {
  role: 'user' | 'assistant';
  content: string;
  files?: Array<{
    filename: string;
    url: string;
    mediaType: string;
  }>;
}) {
  try {
    const updatedChat = await ChatService.addMessage(chatId, message);
    return updatedChat;
  } catch (error) {
    console.error('Failed to add message to chat:', error);
    return null;
  }
}

// Get all chats for history
export async function getAllChats(limit: number = 50, offset: number = 0) {
  try {
    return await ChatService.getAllChats(limit, offset);
  } catch (error) {
    console.error('Failed to get all chats:', error);
    return [];
  }
}

// Delete a chat (soft delete)
export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    return await ChatService.deleteChat(chatId);
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return false;
  }
}
