const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ChatApiService {
  static async createChat(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      return await response.json();
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  }

  static async getChat(chatId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get chat');
      }

      return await response.json();
    } catch (error) {
      console.error('Get chat error:', error);
      throw error;
    }
  }

  static async getUserChats(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user chats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user chats error:', error);
      throw error;
    }
  }

  static async addMessage(chatId: string, role: string, content: string, files?: any[], parts?: any[], metadata?: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, content, files, parts, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      return await response.json();
    } catch (error) {
      console.error('Add message error:', error);
      throw error;
    }
  }

  static async updateChatTitle(chatId: string, title: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      return await response.json();
    } catch (error) {
      console.error('Update chat title error:', error);
      throw error;
    }
  }

  static async deleteChat(chatId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete chat error:', error);
      throw error;
    }
  }

  static async getChatMessages(chatId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get chat messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Get chat messages error:', error);
      throw error;
    }
  }

  static async sendMessage(messages: any[], options?: { signal?: AbortSignal; enableWebSearch?: boolean; userId?: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          enableWebSearch: options?.enableWebSearch || false,
          userId: options?.userId
        }),
        signal: options?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        throw error;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      return response;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // Add new method for parsing streaming response
  static async parseStreamingResponse(response: Response, onChunk: (chunk: string) => void) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        
        // Handle different streaming formats
        if (chunk.startsWith('data: ')) {
          // Server-Sent Events format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.token) {
                    onChunk(parsed.token);
                  }
                } catch (e) {
                  // If not JSON, treat as plain text
                  onChunk(data);
                }
              }
            }
          }
        } else {
          // Plain text streaming
          onChunk(chunk);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
