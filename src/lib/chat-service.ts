import { connectToDatabase } from './mongodb';
import Chat, { IChat } from '../app/api/models/Chat';

export class ChatService {
  /**
   * Create a new chat
   */
  static async createChat(chatId: string): Promise<IChat> {
    await connectToDatabase();
    
    const chat = new Chat({
      id: chatId,
      messages: [],
      title: 'New Chat',
      isActive: true,
    });

    return await chat.save();
  }

  /**
   * Get chat by ID
   */
  static async getChat(chatId: string): Promise<IChat | null> {
    console.log("getChatFromDb:",chatId)
    await connectToDatabase();
    
    return await Chat.findOne({ id: chatId, isActive: true });
  }

  /**
   * Get all chats (for future chat history feature)
   */
  static async getAllChats(limit: number = 50, offset: number = 0): Promise<IChat[]> {
    await connectToDatabase();
    
    return await Chat.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset);
  }

  /**
   * Add a message to a chat
   */
  static async addMessage(chatId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    files?: Array<{
      filename: string;
      url: string;
      mediaType: string;
    }>;
  }): Promise<IChat | null> {
    await connectToDatabase();
    
    const chat = await Chat.findOne({ id: chatId, isActive: true });
    if (!chat) {
      // If chat doesn't exist, create it
      console.log(`Chat ${chatId} not found, creating new chat`);
      return await this.createChat(chatId);
    }

    chat.messages.push({
      ...message,
      timestamp: new Date(),
    });

    // Update title if it's the first user message
    if (message.role === 'user' && chat.messages.length === 1) {
      chat.title = message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '');
    }

    return await chat.save();
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chatId: string, title: string): Promise<IChat | null> {
    await connectToDatabase();
    
    return await Chat.findOneAndUpdate(
      { id: chatId, isActive: true },
      { title },
      { new: true }
    );
  }

  /**
   * Soft delete a chat (mark as inactive)
   */
  static async deleteChat(chatId: string): Promise<boolean> {
    await connectToDatabase();
    
    const result = await Chat.findOneAndUpdate(
      { id: chatId, isActive: true },
      { isActive: false }
    );

    return result !== null;
  }

  /**
   * Get chat statistics
   */
  static async getChatStats(): Promise<{
    totalChats: number;
    totalMessages: number;
    activeChats: number;
  }> {
    await connectToDatabase();
    
    const [totalChats, activeChats, totalMessages] = await Promise.all([
      Chat.countDocuments({}),
      Chat.countDocuments({ isActive: true }),
      Chat.aggregate([
        { $match: { isActive: true } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ])
    ]);

    return {
      totalChats,
      activeChats,
      totalMessages: totalMessages[0]?.total || 0,
    };
  }
}
