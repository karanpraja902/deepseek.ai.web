import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { ChatService } from '../../../lib/chat-service';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("postmessage")
  // const { messages }: { messages: UIMessage[] } = await req.json();

  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];
  
  // Extract chatId from body first, then from message metadata as fallback
  console.log('messagesToBeAdded:',messages);
  console.log(messages.length)
  const chatId = body.chatId ?? messages[messages.length-1]?.metadata?.chatId;
  console.log('chatId',chatId)  
  console.log('messagesToBeAdded:',messages);
  console.log('chatId',chatId)
  
    if (messages.length > 0 && chatId) {
      const lastMessage = messages[messages.length - 1] as any;
      console.log("lastMessage:",lastMessage)
      console.log()
      if (lastMessage.role === 'user') {
        try {
          const textPart =
            lastMessage.parts?.find((p: any) => p?.type === 'text') ?? null;
          const existingFileParts: any[] =
            lastMessage.parts?.filter((p: any) => p?.type === 'file') ?? [];
            console.log("textPart:",textPart)
  
          // Files uploaded on the client are sent in metadata.uploadedFiles
          const uploadedMeta: Array<{ url: string; mediaType: string; filename: string }> =
            lastMessage.metadata?.uploadedFiles ?? [];
            console.log("uploadedMeta",uploadedMeta)
  
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
  console.log("mergedFiles:",mergedFiles)
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
           
            (messages as any)[messages.length - 1] = {
              ...lastMessage,
              parts: appendedParts,
            };
            console.log("appendedPars:",appendedParts)
          }
  
          const content =
            (textPart?.text || '').trim() || (mergedFiles.length ? '[attachment]' : '');
            console.log("content:",content)
  
          await ChatService.addMessage(chatId, {
            role: 'user',
            content,
            files: mergedFiles.length ? mergedFiles : undefined,
          });
        } catch (error) {
          console.error('Failed to save user message to database:', error);
        }
      }
    }

  // .substring(0,100)
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
`;

const result = await streamText({
model: google('models/gemini-2.5-flash'),
system: systemPrompt,
temperature: 0.25, // Balanced for structure + creativity
maxOutputTokens: 3000, // Allows for structured formatting
messages: convertToModelMessages(messages.slice(-8)), // Slightly smaller context
});

let assistantResponse = '';
// const formattedResponse = formatResponseStructure(assistantResponse);
// assistantResponse = formattedResponse;
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
      }).catch(error => {
        console.error('Failed to save assistant message to database:', error);
      });
    }
    return { totalTokens: part.totalUsage.totalTokens };
  }
  
  if (part.type === 'text-delta') {
    assistantResponse += part.textDelta;
  }
},
});

return customStream;
}

// Save the user's latest message to the database
  // if (messages.length > 0 && chatId) {
  //   const lastMessage = messages[messages.length - 1];
  //   console.log('lastMessage:',lastMessage)
  //   if (lastMessage.role === 'user') {
  //     try {
  //       // Extract content from parts array
  //       let last=lastMessage?.parts?.length-1||0

  //       const content = lastMessage.parts?.[last]?.type === 'text' ? lastMessage.parts[last].text : '';
  //       console.log("content:",content)
  //       console.log("lastMessageFiles",lastMessage)
  //       console.log("filteredFiles:",lastMessage.parts.filter(part=>part.type==='file'))
        
  //       await ChatService.addMessage(chatId, {
  //         role: 'user',
  //         content: content,
  //         files: lastMessage.parts?.[0]?.type==="file"?
  //         lastMessage.parts.filter(part=>part.type==='file').map(file => ({
  //           filename: file?.filename || 'file',
  //           url: file?.url || '',
  //           mediaType: file?.mediaType || 'application/octet-stream'
  //         })
  //       ) : undefined
  //       });
  //     } catch (error) {
  //       console.error('Failed to save user message to database:', error);
  //     }
  //   }
  // }
    // Save the user's latest message to the database