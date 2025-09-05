'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatClient } from '@/lib/chat-client';
import { ChatResponse } from '@/lib/chat-actions';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Message {
  role: string;
  content: string;
  timestamp: string;
  files?: any[];
  parts?: any[];
  metadata?: any;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  createChat: () => Promise<string | null>;
  getChat: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
  addMessage: (chatId: string, role: string, content: string, files?: any[], parts?: any[], metadata?: any) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
  getChatMessages: (chatId: string) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const createChat = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ChatClient.createChat();
      
      if (response.success && response.data?.chat) {
        const newChat = {
          id: response.data.chat.id,
          title: response.data.chat.title,
          createdAt: response.data.chat.createdAt,
          updatedAt: response.data.chat.createdAt,
          messageCount: 0
        };
        
        setChats(prev => [newChat, ...prev]);
        setCurrentChat(newChat);
        setMessages([]);
        
        return newChat.id;
      } else {
        throw new Error(response.error || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getChat = async (chatId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ChatClient.getChat(chatId);
      
      if (response.success && response.data?.chat) {
        const chat = {
          id: response.data.chat.id,
          title: response.data.chat.title,
          createdAt: response.data.chat.createdAt,
          updatedAt: response.data.chat.createdAt,
          messageCount: response.data.chat.messages?.length || 0
        };
        
        setCurrentChat(chat);
        setMessages(response.data.chat.messages || []);
      } else {
        throw new Error(response.error || 'Failed to get chat');
      }
    } catch (error) {
      console.error('Get chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get chat');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserChats = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ChatClient.getUserChats();
      
      if (response.success && response.data?.chats) {
        setChats(response.data.chats);
      } else {
        throw new Error(response.error || 'Failed to get user chats');
      }
    } catch (error) {
      console.error('Get user chats error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get user chats');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (
    chatId: string, 
    role: string, 
    content: string, 
    files?: any[], 
    parts?: any[], 
    metadata?: any
  ): Promise<void> => {
    try {
      setError(null);
      
      const response = await ChatClient.addMessage(chatId, role, content, files, parts, metadata);
      
      if (response.success && response.data?.message) {
        setMessages(prev => [...prev, response.data!.message!]);
        
        // Update chat in the list if it's the current chat
        if (currentChat?.id === chatId) {
          setCurrentChat(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : null);
        }
      } else {
        throw new Error(response.error || 'Failed to add message');
      }
    } catch (error) {
      console.error('Add message error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add message');
    }
  };

  const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await ChatClient.updateChatTitle(chatId, title);
      
      if (response.success) {
        setChats(prev => 
          prev.map(chat => 
            chat.id === chatId ? { ...chat, title } : chat
          )
        );
        
        if (currentChat?.id === chatId) {
          setCurrentChat(prev => prev ? { ...prev, title } : null);
        }
      } else {
        throw new Error(response.error || 'Failed to update chat title');
      }
    } catch (error) {
      console.error('Update chat title error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update chat title');
    }
  };

  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await ChatClient.deleteChat(chatId);
      
      if (response.success) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        
        if (currentChat?.id === chatId) {
          setCurrentChat(null);
          setMessages([]);
        }
      } else {
        throw new Error(response.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete chat');
    }
  };

  const deleteAllChats = async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await ChatClient.deleteAllChats();
      
      if (response.success) {
        setChats([]);
        setCurrentChat(null);
        setMessages([]);
      } else {
        throw new Error(response.error || 'Failed to delete all chats');
      }
    } catch (error) {
      console.error('Delete all chats error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete all chats');
    }
  };

  const getChatMessages = async (chatId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await ChatClient.getChatMessages(chatId);
      
      if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
      } else {
        throw new Error(response.error || 'Failed to get chat messages');
      }
    } catch (error) {
      console.error('Get chat messages error:', error);
      setError(error instanceof Error ? error.message : 'Failed to get chat messages');
    } finally {
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    chats,
    currentChat,
    messages,
    isLoading,
    error,
    createChat,
    getChat,
    getUserChats,
    addMessage,
    updateChatTitle,
    deleteChat,
    deleteAllChats,
    getChatMessages,
    clearError,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
