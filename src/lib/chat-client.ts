'use client';

import { ChatResponse } from './chat-actions';

// Client-side wrappers for server actions
export class ChatClient {
  static async createChat(): Promise<ChatResponse> {
    const { createChatAction } = await import('./chat-actions');
    return await createChatAction();
  }

  static async getChat(chatId: string): Promise<ChatResponse> {
    const { getChatAction } = await import('./chat-actions');
    return await getChatAction(chatId);
  }

  static async getUserChats(): Promise<ChatResponse> {
    const { getUserChatsAction } = await import('./chat-actions');
    return await getUserChatsAction();
  }

  static async addMessage(
    chatId: string, 
    role: string, 
    content: string, 
    files?: any[], 
    parts?: any[], 
    metadata?: any
  ): Promise<ChatResponse> {
    const { addMessageAction } = await import('./chat-actions');
    return await addMessageAction(chatId, role, content, files, parts, metadata);
  }

  static async updateChatTitle(chatId: string, title: string): Promise<ChatResponse> {
    const { updateChatTitleAction } = await import('./chat-actions');
    return await updateChatTitleAction(chatId, title);
  }

  static async deleteChat(chatId: string): Promise<ChatResponse> {
    const { deleteChatAction } = await import('./chat-actions');
    return await deleteChatAction(chatId);
  }

  static async deleteAllChats(): Promise<ChatResponse> {
    const { deleteAllChatsAction } = await import('./chat-actions');
    return await deleteAllChatsAction();
  }

  static async getChatMessages(chatId: string): Promise<ChatResponse> {
    const { getChatMessagesAction } = await import('./chat-actions');
    return await getChatMessagesAction(chatId);
  }
}
