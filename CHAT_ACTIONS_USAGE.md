# Chat Actions Usage Guide

This guide explains how to use the new chat actions and context system for managing chat functionality.

## Files Created

1. **`src/lib/chat-actions.ts`** - Server actions for chat operations
2. **`src/lib/chat-client.ts`** - Client-side wrappers for chat actions
3. **`src/contexts/ChatContext.tsx`** - React context for chat state management

## Usage Patterns

### 1. Using Chat Actions Directly

```typescript
import { ChatClient } from '@/lib/chat-client';

// Create a new chat
const response = await ChatClient.createChat();
if (response.success) {
  const chatId = response.data?.chat?.id;
  console.log('Created chat:', chatId);
}

// Get user's chats
const chatsResponse = await ChatClient.getUserChats();
if (chatsResponse.success) {
  const chats = chatsResponse.data?.chats;
  console.log('User chats:', chats);
}

// Add a message to a chat
const messageResponse = await ChatClient.addMessage(
  chatId, 
  'user', 
  'Hello, how are you?'
);
```

### 2. Using Chat Context (Recommended)

```typescript
import { useChat } from '@/contexts/ChatContext';

function ChatComponent() {
  const {
    chats,
    currentChat,
    messages,
    isLoading,
    error,
    createChat,
    getChat,
    addMessage,
    updateChatTitle,
    deleteChat
  } = useChat();

  const handleCreateChat = async () => {
    const chatId = await createChat();
    if (chatId) {
      console.log('Created chat:', chatId);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (currentChat) {
      await addMessage(currentChat.id, 'user', content);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      
      <button onClick={handleCreateChat}>
        Create New Chat
      </button>
      
      {chats.map(chat => (
        <div key={chat.id}>
          <h3>{chat.title}</h3>
          <p>Messages: {chat.messageCount}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Setting Up Chat Provider

Wrap your app with the ChatProvider:

```typescript
// In your root layout or app component
import { ChatProvider } from '@/contexts/ChatContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Available Actions

### ChatClient Methods

- `createChat()` - Create a new chat
- `getChat(chatId)` - Get a specific chat
- `getUserChats()` - Get all user's chats
- `addMessage(chatId, role, content, files?, parts?, metadata?)` - Add a message
- `updateChatTitle(chatId, title)` - Update chat title
- `deleteChat(chatId)` - Delete a chat
- `getChatMessages(chatId)` - Get chat messages

### Chat Context State

- `chats` - Array of user's chats
- `currentChat` - Currently selected chat
- `messages` - Messages in current chat
- `isLoading` - Loading state
- `error` - Error message
- `clearError()` - Clear error state

## Benefits

1. **Server Actions**: Automatic cookie handling and server-side execution
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Error Handling**: Consistent error handling across all operations
4. **State Management**: Centralized chat state with React context
5. **Reusability**: Easy to use across different components
6. **Authentication**: Automatic user authentication for all requests

## Migration from ChatApiService

The new system replaces the direct API calls in `ChatApiService` with server actions that handle authentication automatically. You can gradually migrate by:

1. Using `ChatClient` instead of `ChatApiService`
2. Using `useChat` context for state management
3. Removing manual authentication handling

## Error Handling

All actions return a consistent response format:

```typescript
interface ChatResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

Always check `response.success` before accessing `response.data`.
