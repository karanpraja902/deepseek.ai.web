import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await streamText({
    model: google('models/gemini-2.5-flash'), // or 'gemini-1.5-pro' for newer models
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}