import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { ChatService } from '../../../lib/chat-service';
import { UserMemoryService } from '../../../lib/user-memory-service';
import { text } from 'stream/consumers';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const memoryService = UserMemoryService.getInstance();

export async function POST(req: Request) {
  console.log("postmessage");
  
  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];

  console.log("chat routebody:", body);
; // Extract userId from request body
  
  // Extract chatId from body first, then from message metadata as fallback
  console.log('messagesToBeAdded:', messages);
  console.log(messages.length);
  let last=messages.length-1
  const chatId = body.chatId ?? (messages[last] as any)?.metadata?.chatId;
  const userId = body.userId?? (messages[last] as any)?.userId
  console.log('chatId userId', {chatId,userId});
  // console.log('userId', userId);
  
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

  // Get user-specific context and preferences
  let userContext = '';
  let userPreferences = null;
  
  if (userId) {
    try {
      // Get user's learning profile and preferences
      const userProfile = await memoryService.getUserLearningProfile(userId);
      userPreferences = userProfile.preferences;
      
      // Get relevant context from user's conversation history
      const lastMessage = messages[last];
      if (lastMessage && lastMessage.role === 'user') {
        const textPart = lastMessage.parts?.find((p: any) => p?.type === 'text') as any;
        const userContent = textPart?.text || '';
        const relevantContext = await memoryService.getUserRelevantContext(userId, userContent);
        
        if (relevantContext.length > 0) {
          userContext = `
Previous relevant conversations:
${relevantContext.map((ctx: any) => `- ${ctx.content}`).join('\n')}
`;
        }
      }
    } catch (error) {
      console.error('Failed to get user context:', error);
    }
  }

  // Enhanced system prompt with user context
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

${userPreferences ? `
User Preferences:
- Conversation Style: ${userPreferences.conversationStyle || 'casual'}
- Language: ${userPreferences.language || 'en'}
- Preferred Topics: ${userPreferences.topics?.join(', ') || 'general'}
` : ''}

${userContext}

Example structure:
[Brief overview sentence]

## Main Topic 1
- Key point 1
  - Supporting detail
- Key point 2

## Main Topic 2
- Key point 1
- Key point 2
`;

  const result = await streamText({
    model: google('models/gemini-2.5-flash'),
    system: systemPrompt,
    temperature: 0.25, // Balanced for structure + creativity
    maxOutputTokens: 3000, // Allows for structured formatting
    messages: convertToModelMessages(messages.slice(-8)), // Slightly smaller context
  });

  let assistantResponse = '';

  function formatResponseStructure(rawText: string): string {
    // Ensure consistent line breaks
    let formatted = rawText.replace(/\n{3,}/g, '\n\n');
    
    // Standardize headers
    formatted = formatted.replace(/^(#+\s*.+)/gm, (match) => {
      return `\n${match}\n`;
    });
    
    // Ensure bullet point consistency
    formatted = formatted.replace(/^(\s*[-*+]\s+)/gm, '- ');
    
    return formatted.trim();
  }

  const customStream = result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === 'start') {
        return {
          createdAt: Date.now()
        };
      }

      if (part.type === 'finish') {
        // format the final aggregated text before saving
        assistantResponse = formatResponseStructure(assistantResponse);
        if (chatId && assistantResponse.trim()) {
          ChatService.addMessage(chatId, {
            role: 'assistant',
            content: assistantResponse,
          }, userId).catch(error => {
            console.error('Failed to save assistant message to database:', error);
          });
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
