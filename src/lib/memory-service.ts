import MemoryClient from 'mem0ai';

// Initialize Mem0 client
const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });
console.log("✅ Mem0 initialized:", !!process.env.MEM0_API_KEY);

// Memory caching
const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class MemoryService {
  /**
   * Get user memories with caching
   */
  static async getMemoriesWithCache(userId: string) {
    const cacheKey = `memories_${userId}`;
    const cached = memoryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    const memories = await mem0.getAll({ user_id: userId, limit: 10 });
    memoryCache.set(cacheKey, { data: memories, timestamp: Date.now() });
    return memories;
  }

  /**
   * Add memory for user
   */
  static async addMemory(content: any[], userId: string, metadata: any) {
    return await mem0.add(content, {
      user_id: userId,
      metadata
    });
  }

  /**
   * Clear memory cache for user
   */
  static clearCache(userId: string) {
    const cacheKey = `memories_${userId}`;
    memoryCache.delete(cacheKey);
  }

  /**
   * Clear all memory cache
   */
  static clearAllCache() {
    memoryCache.clear();
  }
}