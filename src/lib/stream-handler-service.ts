import { ChatService } from './chat-service';
import { MemoryService } from './memory-service';
import { MessageHandlerService } from './message-handler-service';

export class StreamHandlerService {
  /**
   * Create custom stream response with message handling
   */
  static createCustomStream(
    result: any,
    chatId: string,
    userId: string
  ) {
    let assistantResponse = '';

    return result.toUIMessageStreamResponse({
      messageMetadata: async ({ part }: any) => {
        if (part.type === 'start') {
          return {
            createdAt: Date.now()
          };
        }

        if (part.type === 'finish') {
          // Format the final aggregated text before saving
          assistantResponse = MessageHandlerService.formatResponseStructure(assistantResponse);
          
          if (chatId && assistantResponse.trim()) {
            // Optimized: Non-blocking saves
            setImmediate(async () => {
              try {
                await Promise.all([
                  ChatService.addMessage(chatId, {
                    role: 'assistant',
                    content: assistantResponse,
                  }, userId),
                  MemoryService.addMemory(
                    [{ role: 'assistant', content: assistantResponse }], 
                    userId,
                    { 
                      type: 'assistant_message', 
                      chatId, 
                      timestamp: new Date().toISOString() 
                    }
                  )
                ]);
              } catch (error) {
                console.error('Failed to save assistant message:', error);
              }
            });
          }
          return { totalTokens: part.totalUsage.totalTokens };
        }
        
        if (part.type === 'text-delta') {
          assistantResponse += (part as any).text ?? '';
          
          // Save in chunks every 100 characters
          if (assistantResponse.length % 100 === 0) {
            // Save partial response asynchronously
            setImmediate(async () => {
              try {
                await ChatService.addMessage(chatId, {
                  role: 'assistant',
                  content: assistantResponse,
                }, userId);
              } catch (error) {
                console.error('Failed to save partial message:', error);
              }
            });
          }
        }
      },
    });
  }

  /**
   * Create timeout controller
   */
  static createTimeoutController(timeoutMs: number = 25000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    return { controller, timeoutId };
  }

  /**
   * Handle timeout error
   */
  static handleTimeout(timeoutId: NodeJS.Timeout, error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return new Response('Request timeout', { status: 408 });
    }
    throw error;
  }
}
