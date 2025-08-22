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
    let systemPrompt = `You are a helpful AI assistant. Provide well-formatted, structured responses with proper markdown formatting. Use headers, bullet points, and clear sections for better readability.`;
    
    // Add PDF document context first (highest priority)
    if (pdfContext) {
      systemPrompt += `\n\n📄 DOCUMENT ANALYSIS:\n${pdfContext}\n\nAnalyze and discuss the uploaded document(s) based on their content. Structure your response with clear sections, bullet points, and proper formatting.`;
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
   * Enhanced response formatting with proper markdown and structure
   */
  static formatResponseStructure(rawText: string): string {
    if (!rawText || typeof rawText !== 'string') {
      return rawText || '';
    }

    let formatted = rawText;

    // 1. Fix excessive line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // 2. Format headers properly
    formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      const indent = '  '.repeat(Math.max(0, level - 1));
      return `\n${indent}**${content.trim()}**\n`;
    });
    
    // 3. Format bullet points and lists
    formatted = formatted.replace(/^(\s*)[-*+]\s+(.+)$/gm, (match, spaces, content) => {
      return `${spaces}• ${content.trim()}`;
    });
    
    // 4. Format numbered lists
    formatted = formatted.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, spaces, number, content) => {
      return `${spaces}${number}. ${content.trim()}`;
    });
    
    // 5. Format bold text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '**$1**');
    
    // 6. Format italic text
    formatted = formatted.replace(/\*(.+?)\*/g, '*$1*');
    
    // 7. Format code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\n\`\`\`${lang || ''}\n${code.trim()}\n\`\`\`\n`;
    });
    
    // 8. Format inline code
    formatted = formatted.replace(/`([^`]+)`/g, '`$1`');
    
    // 9. Format links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)');
    
    // 10. Format blockquotes
    formatted = formatted.replace(/^>\s+(.+)$/gm, '> $1');
    
    // 11. Fix spacing around punctuation
    formatted = formatted.replace(/\s+([.!?])/g, '$1');
    formatted = formatted.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    // 12. Ensure proper paragraph spacing
    formatted = formatted.replace(/\n\n+/g, '\n\n');
    
    // 13. Format document sections (common in AI responses)
    formatted = formatted.replace(/^(Document|Summary|Analysis|Key Points|Conclusion):/gmi, (match) => {
      return `\n**${match}**\n`;
    });
    
    // 14. Format technical terms and emphasis
    formatted = formatted.replace(/\b(IMC|PDF|API|URL|HTTP|HTTPS|JSON|XML|HTML|CSS|JS|React|Node|Python|JavaScript|TypeScript)\b/gi, '**$1**');
    
    // 15. Clean up any remaining formatting issues
    formatted = formatted.replace(/\s+/g, ' '); // Remove multiple spaces
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive line breaks
    
    // 16. Ensure proper start and end
    formatted = formatted.trim();
    
    // 17. Add final formatting for better readability
    if (formatted.length > 100) {
      // Add section breaks for long responses
      formatted = formatted.replace(/(\n\n)([A-Z][^.!?]*[.!?])/g, '$1$2');
    }
    
    return formatted;
  }

  /**
   * Additional method for specific document response formatting
   */
  static formatDocumentResponse(rawText: string): string {
    let formatted = this.formatResponseStructure(rawText);
    
    // Add document-specific formatting
    formatted = formatted.replace(/^(Main Topic|Key Points|Document Type|Purpose|Conclusions):/gmi, (match) => {
      return `\n**${match}**\n`;
    });
    
    // Format technical analysis sections
    formatted = formatted.replace(/^(Theoretical Foundations|Implementation|Performance Evaluation|Comparative Analysis):/gmi, (match) => {
      return `\n**${match}**\n`;
    });
    
    return formatted;
  }
}
