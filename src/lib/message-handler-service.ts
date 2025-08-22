import { UIMessage } from 'ai';
import { ChatService } from './chat-service';

export interface MessagePart {
  type: string;
  text?: string;
  filename?: string;
  url?: string;
  mediaType?: string;
}

export interface FileMessagePart {
  filename: string;
  url: string;
  mediaType: string;
}

export interface ProcessedMessage {
  textPart: string;
  fileParts: FileMessagePart[];
}

export class MessageHandlerService {
  /**
   * Extract request parameters from body
   */
  static extractRequestParams(body: any, messages: UIMessage[]) {
    const last = messages.length - 1;
    const lastMessage = messages[last] as any;
    
    return {
      chatId: body.chatId ?? lastMessage?.metadata?.chatId,
      userId: body.userId ?? lastMessage?.userId,
      selectedModel: body.model ?? lastMessage?.model ?? lastMessage?.metadata?.model ?? 'google',
      enableWebSearch: body.enableWebSearch ?? lastMessage?.metadata?.enableWebSearch ?? false
    };
  }

  /**
   * Process message parts (text and files)
   */
  static processMessageParts(message: any): ProcessedMessage {
    const textPart = Array.isArray(message.parts)
      ? message.parts.find((p: any) => p?.type === 'text')?.text
      : message.content;
    
    const fileParts = Array.isArray(message.parts)
      ? message.parts.filter((p: any) => p?.type === 'file')
      : [];

    return {
      textPart: textPart || '',
      fileParts: fileParts?.map((f: any) => ({
        filename: f.filename || '',
        url: f.url || '',
        mediaType: f.mediaType || '',
      })).filter((f: any) => f.filename && f.url && f.mediaType) || []
    };
  }

  /**
   * Save user message to chat service
   */
  static async saveUserMessage(messages: UIMessage[], chatId: string, userId: string) {
    try {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'user' && chatId) {
        const { textPart, fileParts } = this.processMessageParts(lastMsg);

        await ChatService.addMessage(chatId, {
          role: 'user',
          content: textPart,
          files: fileParts,
        }, userId);
      }
    } catch (e) {
      console.error('Failed to save user message:', e);
    }
  }

  /**
   * Generate system prompt with context
   */
  static generateSystemPrompt(webSearchResults: string, memories: any[]): string {
    let systemPrompt = `You are a helpful AI assistant.`;
    
    if (webSearchResults) {
      systemPrompt += `\n\n${webSearchResults}\n\nPlease use this web search information to provide a comprehensive and up-to-date answer to the user's question. Acknowledge that you performed a web search and reference the current information found.`;
    }
    
    if (memories && memories.length > 0) {
      systemPrompt += `\n\nUser context: ${JSON.stringify(memories.slice(0, 3))}`;
    }
    
    return systemPrompt;
  }

  /**
   * Format response structure
   */
  static formatResponseStructure(rawText: string): string {
    let formatted = rawText.replace(/\n{3,}/g, '\n\n');
    
    formatted = formatted.replace(/^(#+\s*.+)/gm, (match) => {
      return `\n${match}\n`;
    });
    
    formatted = formatted.replace(/^(\s*[-*+]\s+)/gm, '- ');
    
    return formatted.trim();
  }
}
