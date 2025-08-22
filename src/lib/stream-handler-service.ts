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
    let lastSaveLength = 0;
    const SAVE_THRESHOLD = 500; // Save every 500 chars instead of 100

    return result.toUIMessageStreamResponse({
      messageMetadata: async ({ part }: any) => {
        if (part.type === 'start') {
          return {
            createdAt: Date.now()
          };
        }

        if (part.type === 'finish') {
          // Enhanced formatting for better response structure
          assistantResponse = MessageHandlerService.formatDocumentResponse(assistantResponse);
          
          if (chatId && assistantResponse.trim()) {
            // Final save - ensure complete response is saved
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
              console.log('✅ Complete formatted response saved:', assistantResponse.length, 'characters');
            } catch (error) {
              console.error('Failed to save complete assistant message:', error);
            }
          }
          return { totalTokens: part.totalUsage?.totalTokens || 0 };
        }
        
        if (part.type === 'text-delta') {
          assistantResponse += (part as any).text ?? '';
          
          // Reduced frequency saves - only save significant chunks
          const currentLength = assistantResponse.length;
          if (currentLength - lastSaveLength >= SAVE_THRESHOLD) {
            lastSaveLength = currentLength;
            
            // Non-blocking partial save (don't await)
            setImmediate(async () => {
              try {
                await ChatService.addMessage(chatId, {
                  role: 'assistant',
                  content: assistantResponse,
                }, userId);
                console.log('💾 Partial save:', currentLength, 'characters');
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
  static createTimeoutController(timeoutMs: number = 30000) { // Increased timeout for complete responses
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
