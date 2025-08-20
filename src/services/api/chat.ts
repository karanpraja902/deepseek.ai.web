// API service for chat operations//Endpoint
export class ChatApiService {
    private static baseUrl = '/api/chat';
  
    // Get chat by ID
    static async getChat(chatId: string) {
      try {
        const response = await fetch(`${this.baseUrl}/${chatId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching chat:', error);
        return null;
      }
    }
  
    // Create a new chat
    static async createChat() {
      try {
        const response = await fetch(`${this.baseUrl}/create`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to create chat');
        }
        return await response.json();
      } catch (error) {
        console.error('Error creating chat:', error);
        throw error;
      }
    }
  
    // Send a message
    static async sendMessage(chatId: string, message: any) {
      console.log("sendMessage:",message)
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [message],
            chatId: chatId,
          }),
        });
        return response;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    }
  }

  