import { streamText, UIMessage, convertToModelMessages } from 'ai';

import { ModelProviderService } from '../../../lib/model-provider-service';
import { WebSearchService } from '../../../lib/web-search-service';
import { MessageHandlerService } from '../../../lib/message-handler-service';
import { StreamHandlerService } from '../../../lib/stream-handler-service';
import { MemoryService } from '@/lib/memory-service';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("postmessage");
  
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  
  // Extract request parameters
  const { chatId, userId, selectedModel, enableWebSearch } = 
    MessageHandlerService.extractRequestParams(body, messages);
  
  console.log('chatId userId SelectedModel enableWebSearch', {
    chatId, userId, selectedModel, enableWebSearch
  });

  // Save the latest user message immediately
  await MessageHandlerService.saveUserMessage(messages, chatId, userId);

  // Get user memories with caching
  const memories = await MemoryService.getMemoriesWithCache(userId);

  // Process web search if enabled
  const webSearchResults = await WebSearchService.processWebSearch(enableWebSearch, messages);

  // Generate system prompt with context
  const systemPrompt = MessageHandlerService.generateSystemPrompt(webSearchResults, memories);

  // Create timeout controller
  const { controller, timeoutId } = StreamHandlerService.createTimeoutController();

  // Get the appropriate model
  const modelToUse = ModelProviderService.getModel(selectedModel);

  try {
    console.log("tryModelToUse", modelToUse);
    
    const result = await streamText({
      model: modelToUse,
      system: systemPrompt, // Now includes web search results if available
      temperature: 0.25,
      maxOutputTokens: 1500, // Reduced for faster generation
      messages: convertToModelMessages(messages.slice(-5)), // Reduced context
    });
    
    clearTimeout(timeoutId);

    // Create custom stream with message handling
    const customStream = StreamHandlerService.createCustomStream(result, chatId, userId);

    return customStream;
  } catch (error: any) {
    return StreamHandlerService.handleTimeout(timeoutId, error);
  }
}