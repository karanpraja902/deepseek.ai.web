import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { ChatService } from '../../../lib/chat-service';
import { UserMemoryService } from '../../../lib/user-memory-service';
import { text } from 'stream/consumers';
import MemoryClient from 'mem0ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });
console.log("✅ Mem0 initialized:", !!process.env.MEM0_API_KEY);

export async function POST(req: Request) {
  console.log("postmessage");
  
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  console.log("chat routebody:", body);
  
  let last = messages.length - 1;
  const chatId = body.chatId ?? (messages[last] as any)?.metadata?.chatId;
  const userId = body.userId ?? (messages[last] as any)?.userId;
  console.log('chatId userId', {chatId, userId});

  // Store user message in mem0
  if (messages.length > 0 && userId && messages[last].role === 'user') {
    const lastMessage = messages[last] as any;
    const textPart = lastMessage.parts?.find((p: any) => p?.type === 'text') ?? null;
    const content = (textPart?.text || '').trim();
    
    if (content) {
      try {
        await mem0.add(
          [
            { role: 'user', content: content }
          ],
          {
            user_id: userId,
            metadata: {
              type: 'user_message',
              chatId: chatId,
              timestamp: new Date().toISOString()
            }
          }
        );
        console.log("✅ User message stored in mem0");
      } catch (error) {
        console.error('Failed to store user message in mem0:', error);
      }
    }
  }

  if (messages.length > 0 && chatId) {
    const lastMessage = messages[last] as any;

    console.log("lastMessage:", lastMessage);
    if (lastMessage.role === 'user') {
      try {
        const textPart =
          lastMessage.parts?.find((p: any) => p?.type === 'text') ?? null;
        console.log("textPart:", textPart);
        const existingFileParts: any[] =
          lastMessage.parts?.filter((p: any) => p?.type === 'file') ?? [];
        console.log("filePart:", existingFileParts);

        // Files uploaded on the client are sent in metadata.uploadedFiles
        const uploadedMeta: Array<{ url: string; mediaType: string; filename: string }> =
          lastMessage.metadata?.files ?? [];
        console.log("uploadedMeta", uploadedMeta);

        // Merge any existing file parts with uploaded meta files
        const mergedFiles = [
          ...existingFileParts.map((p: any) => ({
            filename: p.filename || 'file',
            url: p.url || '',
            mediaType: p.mediaType || 'application/octet-stream',
          })),
          ...uploadedMeta.map((m: any) => ({
            filename: m.filename || 'file',
            url: m.url || '',
            mediaType: m.mediaType || 'application/octet-stream',
          })),
        ].filter(f => !!f.url);
        console.log("mergedFiles:", mergedFiles);

        // Ensure last message parts include file parts for the model
        if (uploadedMeta.length > 0) {
          const appendedParts = [
            ...(lastMessage.parts ?? []),
            ...uploadedMeta.map(m => ({
              type: 'file',
              url: m.url,
              mediaType: m.mediaType,
              filename: m.filename,
            })),
          ];
         
          (messages as any)[last] = {
            ...lastMessage,
            parts: appendedParts,
          };
          console.log("appendedPars:", appendedParts);
        }

        const content =
          (textPart?.text || '').trim() || (mergedFiles.length ? '[attachment]' : '');
        console.log("content:", content);

        await ChatService.addMessage(chatId, {
          role: 'user',
          content,
          files: mergedFiles.length ? mergedFiles : undefined,
        }, userId);
      } catch (error) {
        console.error('Failed to save user message to database:', error);
      }
    }
  }

  const memories = await mem0.getAll({
    user_id: userId
  })
  console.log(memories, "here are the user memories")

  // Stringify memories so the model can actually read them
  const memoriesStr = JSON.stringify(memories, null, 2);

  const systemPrompt = `
Respond to all prompts with clear, structured formatting:

1. Begin with a concise 1-2 sentence overview
2. Organize content under bold headers (##) for main sections
3. Use bullet points (-) for key aspects
4. For hierarchical information:
   - Main points as primary bullets
   - Sub-points indented with spaces
5. Keep technical terms accessible with brief explanations
6. Limit to 5-7 key points for brevity
7. Use line breaks between sections for readability

Example structure:
[Brief overview sentence]

## Main Topic 1
- Key point 1
  - Supporting detail
- Key point 2

## Main Topic 2
- Key point 1
- Key point 2

Here are user information saved in memories, you can access to all 
these are user memories - ${memoriesStr}
`;

  const result = await streamText({
    model: google('models/gemini-2.5-flash'),
    system: systemPrompt,
    temperature: 0.25,
    maxOutputTokens: 3000,
    messages: convertToModelMessages(messages.slice(-8)),
  });

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
          try {
            // Save assistant message to database
            await ChatService.addMessage(chatId, {
              role: 'assistant',
              content: assistantResponse,
            }, userId);
            
            // Store assistant message in mem0
            if (userId) {
              await mem0.add(
                [
                  { role: 'assistant', content: assistantResponse }
                ],
                {
                  user_id: userId,
                  metadata: {
                    type: 'assistant_message',
                    chatId: chatId,
                    timestamp: new Date().toISOString()
                  }
                }
              );
              console.log("✅ Assistant message stored in mem0");
            }
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }
        }
        return { totalTokens: part.totalUsage.totalTokens };
      }
      
      if (part.type === 'text-delta') {
        assistantResponse += (part as any).text ?? '';
      }
    },
  });

  return customStream;
}