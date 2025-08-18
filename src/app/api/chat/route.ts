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

  
  // Extract chatId from the metadata of the first message
  // const chatId = messages[0]?.metadata?.chatId || undefined;
  
  console.log('messagesToBeAdded:',messages);
  console.log('chatId',chatId)
  // Save the user's latest message to the database
  if (messages.length > 0 && chatId) {
    const lastMessage = messages[messages.length - 1];
    console.log('lastMessage:',lastMessage)
    if (lastMessage.role === 'user') {
      try {
        // Extract content from parts array
        let last=lastMessage?.parts?.length-1||0

        const content = lastMessage.parts?.[last]?.type === 'text' ? lastMessage.parts[last].text : '';
        console.log("content:",content)
        console.log("lastMessageFiles",lastMessage)
        console.log("filteredFiles:",lastMessage.parts.filter(part=>part.type==='file'))
        
        await ChatService.addMessage(chatId, {
          role: 'user',
          content: content,
          files: lastMessage.parts?.[0]?.type==="file"?
          lastMessage.parts.filter(part=>part.type==='file').map(file => ({
            filename: file?.filename || 'file',
            url: file?.url.substring(0,100) || '',
            mediaType: file?.mediaType || 'application/octet-stream'
          })
        ) : undefined
        });
      } catch (error) {
        console.error('Failed to save user message to database:', error);
      }
    }
  }

  //   // Enhanced system prompt for structured responses
  //   const structuredSystemPrompt = `
  //   Respond in a clear, structured format based on the query type:
    
  //   - For factual questions: Provide a concise answer followed by key points
  //   - For explanations: Use hierarchical bullet points (main points → details)
  //   - For comparisons: Present in a table or parallel bullet points
  //   - For instructions: Numbered steps with clear actions
  //   - For creative requests: Structured narrative with sections
    
  //   Always:
  //   1. Start directly with the answer/content
  //   2. Use appropriate markdown formatting (headers, lists, tables)
  //   3. Keep technical explanations accessible
  //   4. Limit to 5-7 key points for brevity
  //   5. Include examples when helpful
  // `;

  // const result = await streamText({
  //   model: google('models/gemini-2.5-flash'),
  //   system: structuredSystemPrompt,
  //   temperature: 0.3, // Slightly higher for creativity in structuring
  //   maxOutputTokens: 500, // Increased for structured content
  //   messages: convertToModelMessages(messages.slice(-8)),
  // });
  // const result = await streamText({
  //   model: google('models/gemini-2.5-flash'), // or 'gemini-1.5-pro' for newer models
  //   messages: convertToModelMessages(messages),
  // });
  // const result = await streamText({
  //   model: google('models/gemini-2.5-flash'),
  //   system: 'Be concise. Answer in at most 5 short bullet points or sentences. No preambles, no repetition. Use minimal markdown.',
  //   temperature: 0.2,
  //   maxOutputTokens: 300,
  //   messages: convertToModelMessages(messages.slice(-8)),
  // });
  
  // Create a custom stream to save the assistant's response
//   let assistantResponse = '';
  
//   const customStream = result.toUIMessageStreamResponse({
//     messageMetadata: ({ part }) => {
//       if (part.type === 'start') {
//         return {
//           createdAt: Date.now()
//         };
//       }
  
//       if (part.type === 'finish') {
//         // Save the complete assistant response to the database
//         if (chatId && assistantResponse.trim()) {
//           ChatService.addMessage(chatId, {
//             role: 'assistant',
//             content: assistantResponse,
//           }).catch(error => {
//             console.error('Failed to save assistant message to database:', error);
//           });
//         }
        
//         return {
//           totalTokens: part.totalUsage.totalTokens,
//         };
//       }
      
//       // Accumulate the assistant's response
//       if (part.type === 'text-delta') {
//         assistantResponse += part.textDelta;
//       }
//     },
//   });

//   return customStream;
// }
// Enhanced system prompt for DeepSeek-style responses
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
maxOutputTokens: 600, // Allows for structured formatting
messages: convertToModelMessages(messages.slice(-6)), // Slightly smaller context
});

let assistantResponse = '';

const customStream = result.toUIMessageStreamResponse({
messageMetadata: ({ part }) => {
  if (part.type === 'start') {
    return {
      createdAt: Date.now()
    };
  }

  if (part.type === 'finish') {
    if (chatId && assistantResponse.trim()) {
      ChatService.addMessage(chatId, {
        role: 'assistant',
        content: assistantResponse,
      }).catch(error => {
        console.error('Failed to save assistant message to database:', error);
      });
    }
    return {
      totalTokens: part.totalUsage.totalTokens,
    };
  }
  
  if (part.type === 'text-delta') {
    assistantResponse += part.textDelta;
  }
},
});

return customStream;
}