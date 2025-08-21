import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { ChatService } from '../../../lib/chat-service';
import { UserMemoryService } from '../../../lib/user-memory-service';
import { text } from 'stream/consumers';
import MemoryClient from 'mem0ai';
import { createOpenRouter} from '@openrouter/ai-sdk-provider';
// import { generateText } from 'ai';

// const { text } = await generateText({
  // model: openrouter('openai/gpt-4o'),
  // prompt: 'Write a vegetarian lasagna recipe for 4 people.',
// });

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });
console.log("✅ Mem0 initialized:", !!process.env.MEM0_API_KEY);


// Add memory caching
const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getMemoriesWithCache = async (userId: string) => {
  const cacheKey = `memories_${userId}`;
  const cached = memoryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const memories = await mem0.getAll({ user_id: userId, limit: 10 });
  memoryCache.set(cacheKey, { data: memories, timestamp: Date.now() });
  return memories;
};

export async function POST(req: Request) {
  console.log("postmessage");
  
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  // console.log("chat routebody:", body);
  
  let last = messages.length - 1;
  const chatId = body.chatId ?? (messages[last] as any)?.metadata?.chatId;
  const userId = body.userId ?? (messages[last] as any)?.userId;
  const selectedModel: string = body.model ?? (messages[last] as any)?.model ?? (messages[last] as any)?.metadata?.model ?? 'google';
  console.log('chatId userId SelectedModel', {chatId, userId, selectedModel});

  // Persist the latest user message immediately
  try {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user' && chatId) {
      const textPart = Array.isArray((lastMsg as any).parts)
        ? (lastMsg as any).parts.find((p: any) => p?.type === 'text')?.text
        : (lastMsg as any).content;
      const fileParts = Array.isArray((lastMsg as any).parts)
        ? (lastMsg as any).parts.filter((p: any) => p?.type === 'file')
        : [];

      await ChatService.addMessage(chatId, {
        role: 'user',
        content: textPart || '',
        files: fileParts?.map((f: any) => ({
          filename: f.filename,
          url: f.url,
          mediaType: f.mediaType,
        })) || [],
      }, userId);
    }
  } catch (e) {
    console.error('Failed to save user message:', e);
  }

  // Use cached version
  const memories = await getMemoriesWithCache(userId);


  // Optimized: Shorter, focused prompt
  const systemPrompt = `You are a helpful AI assistant. Use this context: ${JSON.stringify(memories.slice(0, 3))}`;
  // : ${JSON.stringify(memories.slice(0, 3))}
  // Add request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  // Helper: map OpenRouter model -> env API key
  function getOpenRouterKeyForModel(modelId: string): string | undefined {
    // DeepSeek R1 key
    console.log("getOpenRouterKeyForModel:",modelId)
    if (modelId.startsWith('deepseek/deepseek-r1')) {
      console.log("getOpenRouterKeyForModelIf:",modelId)
      return process.env.OPEN_ROUTER_DEEPSEEK_R1_1;
    }
    if (modelId.startsWith('openai/gpt')) {
      console.log("getOpenRouterKeyForModelIf:",modelId)
      return process.env.OPEN_ROUTER_OPENAI;
    }
    if (modelId.startsWith('nvidia/llama')) {
      console.log("getOpenRouterKeyForModelIf:",modelId)
      return process.env.OPEN_ROUTER_Llama;
    }

    // Generic OpenRouter fallback
    return process.env.OPEN_ROUTER_API_KEY;
  }

  // Choose model per selection; default to Google
  const modelToUse = (() => {
    console.log("modelToUse")
    if (selectedModel === 'google') {
      console.log("selectedModelisGoogle")
      return google('models/gemini-2.5-flash');
    }
    if (typeof selectedModel === 'string' && selectedModel.startsWith('openrouter:')) {
      console.log("selectedModelisDeepSeek")
      const orModel = selectedModel.replace('openrouter:', '');
      const apiKey = getOpenRouterKeyForModel(orModel);
      console.log("apiKey:",apiKey)
      if (!apiKey) {
        console.warn('OpenRouter API key missing for model:', orModel, '— falling back to Google.');
        return google('models/gemini-2.5-flash');
      }
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(orModel);
    }
    // Fallback
    return google('models/gemini-2.5-flash');
  })();

  try {
    console.log("tryModelToUse",modelToUse)
    const result = await streamText({
      model: modelToUse,
      // system: systemPrompt,
      temperature: 0.25,
      maxOutputTokens: 1500, // Reduced for faster generation
      messages: convertToModelMessages(messages.slice(-5)), // Reduced context
    });
//     const model=openrouter('deepseek/deepseek-r1-0528:free')
    
//     const result=await streamText({
// model,
// system:systemPrompt,
// temperature:0.25,
// messages:convertToModelMessages(messages.slice(-5)),
// providerOptions: {
//   openrouter: {
//     reasoning: {
//       max_tokens: 10,
//     },
//   },
// },
//     })
    
    clearTimeout(timeoutId);

    let assistantResponse = '';

    function formatResponseStructure(rawText: string): string {
      let formatted = rawText.replace(/\n{3,}/g, '\n\n');
      
      formatted = formatted.replace(/^(#+\s*.+)/gm, (match) => {
        return `\n${match}\n`;
      });
      
      formatted = formatted.replace(/^(\s*[-*+]\s+)/gm, '- ');
      
      return formatted.trim();
    }

    const customStream = result.toUIMessageStreamResponse({
      messageMetadata: async ({ part }) => {
        if (part.type === 'start') {
          return {
            createdAt: Date.now()
          };
        }

        if (part.type === 'finish') {
          // Format the final aggregated text before saving
          assistantResponse = formatResponseStructure(assistantResponse);
          
          if (chatId && assistantResponse.trim()) {
            // Optimized: Non-blocking saves
            setImmediate(async () => {
              try {
                await Promise.all([
                  ChatService.addMessage(chatId, {
                    role: 'assistant',
                    content: assistantResponse,
                  }, userId),
                  mem0.add([{ role: 'assistant', content: assistantResponse }], {
                    user_id: userId,
                    metadata: { type: 'assistant_message', chatId, timestamp: new Date().toISOString() }
                  })
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

    return customStream;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return new Response('Request timeout', { status: 408 });
    }
    throw error;
  }
}