import { UIMessage } from 'ai';
import { ChatService } from './chat-service';

export interface MessagePart {
  type: string;
  text?: string;
  filename?: string;
  url?: string;
  mediaType?: string;
  pdfAnalysis?: {
    summary: string;
    content: string;
    pageCount: number;
  };
}

export interface FileMessagePart {
  filename: string;
  url: string;
  mediaType: string;
  pdfAnalysis?: {
    summary: string;
    content: string;
    pageCount: number;
  };
}

export interface ProcessedMessage {
  textPart: string;
  fileParts: FileMessagePart[];
  pdfContext: string; // Add PDF context
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
   * Process message parts (text and files) including PDF analysis
   */
  static processMessageParts(message: any): ProcessedMessage {
    const textPart = Array.isArray(message.parts)
      ? message.parts.find((p: any) => p?.type === 'text')?.text
      : message.content;
    
    const fileParts = Array.isArray(message.parts)
      ? message.parts.filter((p: any) => p?.type === 'file')
      : [];

    // Extract PDF analysis context
    let pdfContext = '';
    const pdfFiles = fileParts.filter((f: any) => f.pdfAnalysis);
    
    if (pdfFiles.length > 0) {
      pdfContext = pdfFiles.map((f: any) => 
        `Document: ${f.filename}\nSummary: ${f.pdfAnalysis.summary}\n\nFull Analysis: ${f.pdfAnalysis.content}`
      ).join('\n\n---\n\n');
    }

    return {
      textPart: textPart || '',
      fileParts: fileParts?.map((f: any) => ({
        filename: f.filename || '',
        url: f.url || '',
        mediaType: f.mediaType || '',
        pdfAnalysis: f.pdfAnalysis || null,
      })).filter((f: any) => f.filename && f.url && f.mediaType) || [],
      pdfContext: pdfContext
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
   * Generate system prompt with context including PDF analysis (optimized for speed)
   */
  static generateSystemPrompt(webSearchResults: string, memories: any[], pdfContext?: string): string {
    let systemPrompt = `You are a helpful AI assistant. Be concise and direct.`;
    
    // Add PDF document context first (highest priority) - truncated for speed
    if (pdfContext) {
      const truncatedPdfContext = pdfContext.length > 1500 ? pdfContext.substring(0, 1500) + '...' : pdfContext;
      systemPrompt += `\n\nDocument: ${truncatedPdfContext}`;
    }
    
    // Truncated web search results for faster processing
    if (webSearchResults) {
      const truncatedWebResults = webSearchResults.length > 800 ? webSearchResults.substring(0, 800) + '...' : webSearchResults;
      systemPrompt += `\n\nSearch: ${truncatedWebResults}`;
    }
    
    // Minimal user context for speed
    if (memories && memories.length > 0) {
      systemPrompt += `\n\nContext: ${JSON.stringify(memories.slice(0, 2))}`;
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
