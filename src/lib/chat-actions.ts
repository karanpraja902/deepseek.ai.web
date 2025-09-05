'use server'

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';

export interface ChatResponse {
  success: boolean;
  message?: string;
  data?: {
    chat?: {
      _id: string;
      id: string;
      userId: string;
      title: string;
      createdAt: string;
      messages?: Array<{
        role: string;
        content: string;
        timestamp: string;
        files?: any[];
        parts?: any[];
        metadata?: any;
      }>;
    };
    chats?: Array<{
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
    }>;
    messages?: Array<{
      role: string;
      content: string;
      timestamp: string;
      files?: any[];
      parts?: any[];
      metadata?: any;
    }>;
    message?: {
      role: string;
      content: string;
      timestamp: string;
      files?: any[];
      parts?: any[];
      metadata?: any;
    };
  };
  error?: string;
}

const getAuthHeaders = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value || '';
  
  return {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${token}; token=${token}`,
  };
};

export async function createChatAction(): Promise<ChatResponse> {
  try {
    console.log("createChatAction");
    const headers = await getAuthHeaders();
    console.log("createChatAction headers:", headers);
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({}), // Empty body since userId comes from auth
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("createChatAction response:", response);
    return await response.json();
  } catch (error) {
    console.error('Create chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chat'
    };
  }
}

export async function getChatAction(chatId: string): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat'
    };
  }
}

export async function getUserChatsAction(): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get user chats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user chats'
    };
  }
}

export async function addMessageAction(
  chatId: string, 
  role: string, 
  content: string, 
  files?: any[], 
  parts?: any[], 
  metadata?: any
): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const messageData = { 
      role, 
      content: content.trim(), 
      files: files || [], 
      parts: parts || [], 
      metadata: metadata || {} 
    };

    const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}/messages`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Add message error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add message'
    };
  }
}

export async function updateChatTitleAction(chatId: string, title: string): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}/title`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Update chat title error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update chat title'
    };
  }
}

export async function deleteChatAction(chatId: string): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chat'
    };
  }
}


export async function getChatMessagesAction(chatId: string): Promise<ChatResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}/messages`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get chat messages error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat messages'
    };
  }
}

export async function sendMessageAction(
  messages: any[], 
  options?: { 
    signal?: AbortSignal; 
    enableWebSearch?: boolean; 
    userId?: string; 
    model?: string 
  }
): Promise<Response> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        messages,
        enableWebSearch: options?.enableWebSearch || false,
        userId: options?.userId,
        model: options?.model
      }),
      signal: options?.signal,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).details = errorData.details;
      (error as any).timestamp = errorData.timestamp;
      (error as any).errorType = errorData.errorType;
      (error as any).response = { status: response.status, data: errorData };
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

export async function parseStreamingResponseAction(
  response: Response, 
  onChunk: (chunk: string) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      
      // Check for error responses in the stream
      if (chunk.includes('"error"') || chunk.includes('"success":false')) {
        try {
          const errorData = JSON.parse(chunk);
          if (errorData.error) {
            const error = new Error(errorData.error);
            (error as any).status = response.status;
            (error as any).details = errorData.details;
            (error as any).timestamp = errorData.timestamp;
            (error as any).errorType = errorData.errorType;
            throw error;
          }
        } catch (parseError) {
          // If we can't parse as JSON, continue with normal processing
        }
      }
      
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
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export async function deleteAllChatsAction(): Promise<ChatResponse> {
  try {
    console.log("deleteAllChatsAction");
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
console.log("deleteAllChatsAction response:", response);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Delete all chats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all chats'
    };
  }
}
