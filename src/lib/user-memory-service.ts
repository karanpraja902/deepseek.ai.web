import mem0 from 'mem0ai';
//types

export interface UserMemoryContext {
  userId: string;
  chatId: string;
  context: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  lastUpdated: string;
}

export interface UserPreferences {
  userId: string;
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
    aiModel?: string;
    conversationStyle?: 'formal' | 'casual' | 'technical';
    topics?: string[];
  };
  lastUpdated: string;
}

export interface UserConversationSummary {
  userId: string;
  chatId: string;
  summary: string;
  keyTopics: string[];
  lastUpdated: string;
}
//till here

export class UserMemoryService {
  private static instance: UserMemoryService;
  private memory: any;

  private constructor() {
    this.memory = new mem0({
      apiKey: process.env.MEM0_API_KEY || '',
    });//memory initialization
  }

  static getInstance(): UserMemoryService {
    if (!UserMemoryService.instance) {
      UserMemoryService.instance = new UserMemoryService();
    }
    return UserMemoryService.instance;
  }//getting an instance

  /**
   * Store user-specific conversation context
   */
  async storeUserConversationContext(userId: string, chatId: string, messages: any[]) {
    // console.log("storing user conversation context");
    try {
      const context = messages.map(msg => ({
        role: msg.role,
        content: msg.content || msg.parts?.find((p: any) => p.type === 'text')?.text || '',
        timestamp: msg.timestamp || msg.createdAt
      }));

      await this.memory.add(
        [
          {
            role: 'system',
            content: JSON.stringify({
              mem_key: `user_${userId}_chat_${chatId}`,
              userId,
              chatId,
              context,
              lastUpdated: new Date().toISOString()
            } as UserMemoryContext)
          }
        ],
        { user_id: userId, metadata: { key: `user_${userId}_chat_${chatId}` } }
      );
      // console.log("success")
    } catch (error) {
      console.error('Failed to store user conversation context:', error);
    }
  }

  /**
   * Retrieve user-specific conversation context
   */
  async getUserConversationContext(userId: string, chatId: string): Promise<UserMemoryContext | null> {
    try {

      const result = await this.memory.search(`user_${userId}_chat_${chatId}`, {
        user_id: userId,
        limit: 1
      });
      const mem = result?.results?.[0];
      if (!mem?.content) return null;
      try {
        return JSON.parse(mem.content);
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Failed to retrieve user conversation context:', error);
      return null;
    }
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(userId: string, preferences: any) {
    try {
      await this.memory.add(
        [
          {
            role: 'system',
            content: JSON.stringify({
              mem_key: `user_${userId}_preferences`,
              userId,
              preferences,
              lastUpdated: new Date().toISOString()
            } as UserPreferences)
          }
        ],
        { user_id: userId, metadata: { key: `user_${userId}_preferences` } }
      );
    } catch (error) {
      console.error('Failed to store user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {

      const result = await this.memory.search(`user_${userId}_preferences`, {
        user_id: userId,
        limit: 1
      });
      const mem = result?.results?.[0];
      if (!mem?.content) return null;
      try {
        return JSON.parse(mem.content);
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Get relevant context for current conversation across all user chats
   */
  async getUserRelevantContext(userId: string, currentMessage: string, limit: number = 5) {
    try {

      const result = await this.memory.search(currentMessage || `user_${userId}_`, {
        user_id: userId,
        limit
      });
      return (result?.results || []).map((m: any) => m.content);
    } catch (error) {
      console.error('Failed to get user relevant context:', error);
      return [];
    }
  }

  /**
   * Store user conversation summary
   */
  async storeUserConversationSummary(userId: string, chatId: string, summary: string, keyTopics: string[] = []) {
    try {
      await this.memory.add(
        [
          {
            role: 'system',
            content: JSON.stringify({
              mem_key: `user_${userId}_summary_${chatId}`,
              userId,
              chatId,
              summary,
              keyTopics,
              lastUpdated: new Date().toISOString()
            } as UserConversationSummary)
          }
        ],
        { user_id: userId, metadata: { key: `user_${userId}_summary_${chatId}` } }
      );
    } catch (error) {
      console.error('Failed to store user conversation summary:', error);
    }
  }

  /**
   * Get user conversation summary
   */
  async getUserConversationSummary(userId: string, chatId: string): Promise<UserConversationSummary | null> {
    try {

      const result = await this.memory.search(`user_${userId}_summary_${chatId}`, {
        user_id: userId,
        limit: 1
      });
      const mem = result?.results?.[0];
      if (!mem?.content) return null;
      try {
        return JSON.parse(mem.content);
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Failed to get user conversation summary:', error);
      return null;
    }
  }

  /**
   * Get user's conversation history across all chats
   */
  async getUserConversationHistory(userId: string, limit: number = 10) {
    try {

      const result = await this.memory.search(`user_${userId}_chat_`, {
        user_id: userId,
        limit
      });
      const items = result?.results || [];
      return items
        .map((m: any) => {
          try { return JSON.parse(m.content); } catch { return null; }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to get user conversation history:', error);
      return [];
    }
  }

  /**
   * Store user interaction patterns
   */
async storeUserInteractionPattern(userId: string, pattern: {
    type: 'question_style' | 'topic_preference' | 'response_feedback';
    data: any;
  }) {
    
    try {
      const memKey = `user_${userId}_pattern_${pattern.type}`;
      const text = `[${memKey}] User ${userId} interaction pattern: ${pattern.type} | details: ${JSON.stringify(pattern.data)} | ts=${new Date().toISOString()}`;
      
      const result = await this.memory.add(
        [
          { role: 'user', content: text }
        ],
        { user_id: userId, metadata: { key: `${memKey}_${Date.now()}` } }
      );
      console.log("storeUserInteractionPattern result:", result);
    } catch (error) {
      console.error('Failed to store user interaction pattern:', error);
    }
  }

  /**
   * Get user's learning profile
   */
  async getUserLearningProfile(userId: string) {
    console.log("getting user learning profile");
    try {

      const patterns = await this.memory.search(`user_${userId}_pattern_`, {
        user_id: userId,
        limit: 20
      });
      console.log("patterns:", patterns);
      const patternItems = (patterns?.results || [])
        .map((m: any) => { try { return JSON.parse(m.content); } catch { return null; } })
        .filter(Boolean);
      console.log("patternItems:", patternItems);
      const preferences = await this.getUserPreferences(userId);
      const history = await this.getUserConversationHistory(userId, 5);
      console.log("preferences:", preferences);
      console.log("history:", history);

      return {
        preferences: preferences?.preferences || {},
        patterns: patternItems,
        recentHistory: history
      };
    } catch (error) {
      console.error('Failed to get user learning profile:', error);
      return {
        preferences: {},
        patterns: [],
        recentHistory: []
      };
    }
  }
}
