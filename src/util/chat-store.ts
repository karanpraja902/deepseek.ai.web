import { nanoid } from 'nanoid';
import { ChatService } from '../lib/chat-service';

// Generate a unique chat ID and create chat in database
export async function createChat(userId?: string): Promise<string> {
  console.log("createChat", "userId:", userId);
  const chatId = nanoid();
  
  try {
    // Create the chat in MongoDB with user context
    await ChatService.createChat(chatId, userId);
    console.log('Chat created successfully:', chatId);
  } catch (error) {
    console.error('Failed to create chat in database:', error);
    // Still return the ID even if database creation fails
  }
  
  return chatId;
}

// Get chat by ID from database
export async function getChat(id: string, userId?: string) {
  console.log("getChatFromStore:", id, "userId:", userId);
  try {
    const chat = await ChatService.getChat(id, userId);
    console.log("chatReceived:", chat);
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

// Get chat with user context and memory
export async function getChatWithUserContext(id: string, userId?: string) {
  console.log("getChatWithUserContext:", id, "userId:", userId);
  try {
    const chatWithContext = await ChatService.getChatWithUserContext(id, userId);
    console.log("chatWithContextReceived:", chatWithContext);
    return chatWithContext;
  } catch (error) {
    console.error('Failed to get chat with user context from database:', error);
    return null;
  }
}

// Save chat data to database
export async function saveChat(id: string, data: Record<string, unknown>, userId?: string) {
  try {
    // This could be used to save additional chat metadata
    // For now, we'll log the operation
    console.log('Saving chat data:', id, data, 'userId:', userId);
    
    // You could also update chat title or other metadata here
    // await ChatService.updateChatTitle(id, data.title as string, userId);
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
}, userId?: string) {
  try {
    const updatedChat = await ChatService.addMessage(chatId, message, userId);
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

// Get user-specific chats
export async function getUserChats(userId: string, limit: number = 50, offset: number = 0) {
  try {
    return await ChatService.getUserChats(userId, limit, offset);
  } catch (error) {
    console.error('Failed to get user chats:', error);
    return [];
  }
}

// Delete a chat (soft delete)
export async function deleteChat(chatId: string, userId?: string): Promise<boolean> {
  try {
    return await ChatService.deleteChat(chatId, userId);
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return false;
  }
}

// Get chat statistics
export async function getChatStats() {
  try {
    return await ChatService.getChatStats();
  } catch (error) {
    console.error('Failed to get chat stats:', error);
    return {
      totalChats: 0,
      totalMessages: 0,
      activeChats: 0,
    };
  }
}

// Get user-specific chat statistics
export async function getUserChatStats(userId: string) {
  try {
    return await ChatService.getUserChatStats(userId);
  } catch (error) {
    console.error('Failed to get user chat stats:', error);
    return {
      totalChats: 0,
      totalMessages: 0,
      activeChats: 0,
      averageMessagesPerChat: 0,
    };
  }
}
