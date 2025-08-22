import { streamText, UIMessage, convertToModelMessages } from 'ai';

import { ModelProviderService } from '../../../lib/model-provider-service';
import { WebSearchService } from '../../../lib/web-search-service';
import { MessageHandlerService } from '../../../lib/message-handler-service';
import { StreamHandlerService } from '../../../lib/stream-handler-service';
import { MemoryService } from '@/lib/memory-service';

// Allow streaming responses up to 20 seconds (reduced for faster timeout)
export const maxDuration = 20;

// Simple in-memory cache for repeated queries (expires after 5 minutes)
const responseCache = new Map<string, { response: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Update the model optimization settings for complete responses

function getOptimizedSettings(selectedModel: string) {
  // Google Gemini - fastest model, can handle more tokens
  if (selectedModel === 'google') {
    return {
      temperature: 0.2,
      maxTokens: 1500, // Increased for complete responses
      contextSize: -4
    };
  }
  
  // DeepSeek R1 - reasoning model, needs more tokens for complete analysis
  if (selectedModel.includes('deepseek')) {
    return {
      temperature: 0.1,
      maxTokens: 1200, // Increased from 600
      contextSize: -2
    };
  }
  
  // Llama models - moderate optimization
  if (selectedModel.includes('llama')) {
    return {
      temperature: 0.15,
      maxTokens: 1000, // Increased
      contextSize: -3
    };
  }
  
  // GPT and other models - balanced settings
  if (selectedModel.includes('gpt') || selectedModel.includes('openai')) {
    return {
      temperature: 0.2,
      maxTokens: 1200, // Increased
      contextSize: -3
    };
  }
  
  // Default fallback - optimized for complete responses
  return {
    temperature: 0.1,
    maxTokens: 1000, // Increased from 700
    contextSize: -3
  };
}

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

  // Check cache for repeated queries (only for simple text queries without files)
  const lastMessage = messages[messages.length - 1];
  const hasFiles = lastMessage?.parts?.some((part: any) => part.type === 'file');
  
  if (!hasFiles && !enableWebSearch) {
    const cacheKey = `${selectedModel}-${JSON.stringify(messages.slice(-2))}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached response');
      return cached.response;
    }
  }

  // Get user memories with caching
  const memories = await MemoryService.getMemoriesWithCache(userId);

  // Process web search if enabled
  const webSearchResults = await WebSearchService.processWebSearch(enableWebSearch, messages);

  // Add this after extracting request parameters
  const pdfFiles = lastMessage?.parts?.filter((part: any) => 
    part.type === 'file' && part.mediaType === 'application/pdf'
  );

  // Process PDF files if present
  let pdfContext = '';
  if (pdfFiles && pdfFiles.length > 0) {
    console.log('🔍 Processing PDF files in chat...');
    
    for (const pdfFile of pdfFiles) {
      try {
        // Analyze PDF when message is sent, not during upload
        const analysisResponse = await fetch('/api/pdf/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: pdfFile.url,
            filename: pdfFile.filename,
          }),
        });
        
        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json();
          pdfContext += `Document: ${analysis.filename}\nSummary: ${analysis.summary}\n\n`;
        }
      } catch (error) {
        console.error('PDF analysis failed:', error);
        pdfContext += `Document: ${pdfFile.filename} (analysis pending)\n\n`;
      }
    }
  }

  // Include PDF context in system prompt
  const systemPrompt = MessageHandlerService.generateSystemPrompt(webSearchResults, memories, pdfContext);

  // Create timeout controller
  const { controller, timeoutId } = StreamHandlerService.createTimeoutController();

  // Get the appropriate model
  const modelToUse = ModelProviderService.getModel(selectedModel);

  try {
    console.log("tryModelToUse", modelToUse);
    
    // Get optimized settings based on selected model
    const optimizedSettings = getOptimizedSettings(selectedModel);
    
    const result = await streamText({
      model: modelToUse,
      system: systemPrompt,
      temperature: optimizedSettings.temperature,
      maxOutputTokens: optimizedSettings.maxTokens,
      messages: convertToModelMessages(messages.slice(optimizedSettings.contextSize)),
    });
    
    clearTimeout(timeoutId);

    // Create custom stream with message handling
    const customStream = StreamHandlerService.createCustomStream(result, chatId, userId);

    // Cache the response for simple queries (without files or web search)
    if (!hasFiles && !enableWebSearch) {
      const cacheKey = `${selectedModel}-${JSON.stringify(messages.slice(-2))}`;
      responseCache.set(cacheKey, {
        response: customStream,
        timestamp: Date.now()
      });
      
      // Clean up old cache entries (keep cache size manageable)
      if (responseCache.size > 100) {
        const oldestEntries = Array.from(responseCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 50);
        oldestEntries.forEach(([key]) => responseCache.delete(key));
      }
    }

    return customStream;
  } catch (error: any) {
    return StreamHandlerService.handleTimeout(timeoutId, error);
  }
}