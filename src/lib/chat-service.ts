import { connectToDatabase } from './mongodb';
import Chat, { IChat } from '../app/api/models/Chat';import { UserMemoryService } from './user-memory-service';


//dabatabase interaction
export class ChatService {
  private static memoryService = UserMemoryService.getInstance();

  /**
   * Create a new chat with user context
   */
  static async createChat(chatId: string, userId?: string): Promise<IChat> {
    await connectToDatabase();
    
    const chat = new Chat({
      id: chatId,
      messages: [],
      title: 'New Chat',
      isActive: true,
      userId: userId || null, // Add userId to chat model
    });

    return await chat.save();
  }

  /**
   * Get chat by ID with user context
   */
  static async getChat(chatId: string, userId?: string): Promise<IChat | null> {
    console.log("getChatFromDb:", chatId, "userId:", userId);
    await connectToDatabase();
    
    const query = userId 
      ? { id: chatId, isActive: true, userId }
      : { id: chatId, isActive: true };
    
    return await Chat.findOne(query);
  }

  /**
   * Get all chats for a specific user
   */
  static async getUserChats(userId: string, limit: number = 50, offset: number = 0): Promise<IChat[]> {
    await connectToDatabase();
    
    return await Chat.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset);
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
   * Add a message to a chat with user memory integration
   */
  static async addMessage(chatId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    files?: Array<{
      filename: string;
      url: string;
      mediaType: string;
    }>;
  }, userId?: string): Promise<IChat | null> {
    await connectToDatabase();
    
    const chat = await Chat.findOne({ id: chatId, isActive: true });
    if (!chat) {
      // If chat doesn't exist, create it
      console.log(`Chat ${chatId} not found, creating new chat`);
      return await this.createChat(chatId, userId);
    }

    chat.messages.push({
      ...message,
      timestamp: new Date(),
    });

    // Update title if it's the first user message
    if (message.role === 'user' && chat.messages.length === 1) {
      chat.title = message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '');
    }

    const savedChat = await chat.save();
    console.log("savedChat:", savedChat);
    console.log("aftersavechatuserId:", userId);

    // Store conversation context in user-specific memory
    if (userId) {
      
      await this.memoryService.storeUserConversationContext(userId, chatId, savedChat.messages);
      
      // Store interaction patterns for learning
      if (message.role === 'user') {
        await this.memoryService.storeUserInteractionPattern(userId, {
          type: 'question_style',
          data: {
            messageLength: message.content.length,
            hasFiles: !!(message.files && message.files.length > 0),
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    return savedChat;
  }

  /**
   * Get chat with enhanced user context from memory
   */
  static async getChatWithUserContext(chatId: string, userId?: string): Promise<{
    chat: IChat | null;
    memoryContext: any[];
    relevantContext: any[];
    userProfile: any;
  }> {
    const chat = await this.getChat(chatId, userId);
    
    if (!chat) {
      return { 
        chat: null, 
        memoryContext: [], 
        relevantContext: [],
        userProfile: null
      };
    }

    let memoryContext: any[] = [];
    let relevantContext: any[] = [];
    let userProfile: any = null;

    if (userId) {
      // Get user-specific conversation context
      const userChatContext = await this.memoryService.getUserConversationContext(userId, chatId);
      memoryContext = userChatContext?.context || [];
      
      // Get relevant context from user's conversation history
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage) {
        relevantContext = await this.memoryService.getUserRelevantContext(
          userId, 
          lastMessage.content
        );
      }

      // Get user learning profile
      userProfile = await this.memoryService.getUserLearningProfile(userId);
    }

    return { chat, memoryContext, relevantContext, userProfile };
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chatId: string, title: string, userId?: string): Promise<IChat | null> {
    await connectToDatabase();
    
    const query = userId 
      ? { id: chatId, isActive: true, userId }
      : { id: chatId, isActive: true };
    
    return await Chat.findOneAndUpdate(query, { title }, { new: true });
  }

  /**
   * Soft delete a chat (mark as inactive)
   */
  static async deleteChat(chatId: string, userId?: string): Promise<boolean> {
    await connectToDatabase();
    
    const query = userId 
      ? { id: chatId, isActive: true, userId }
      : { id: chatId, isActive: true };
    
    const result = await Chat.findOneAndUpdate(query, { isActive: false });
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

  /**
   * Get chat statistics for a user
   */
  static async getUserChatStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    activeChats: number;
    averageMessagesPerChat: number;
  }> {
    await connectToDatabase();
    
    const [totalChats, activeChats, totalMessages] = await Promise.all([
      Chat.countDocuments({ userId }),
      Chat.countDocuments({ userId, isActive: true }),
      Chat.aggregate([
        { $match: { userId, isActive: true } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ])
    ]);

    return {
      totalChats,
      activeChats,
      totalMessages: totalMessages[0]?.total || 0,
      averageMessagesPerChat: activeChats > 0 ? Math.round((totalMessages[0]?.total || 0) / activeChats) : 0,
    };
  }
}
