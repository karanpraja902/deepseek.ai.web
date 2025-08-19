'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatContainer from '../../../../components/chat/ChatContainer';
import ChatInput from '../../../../components/chat/ChatInput';
import { ChatApiService } from '../../../../services/api';
import type { UploadedClientFile } from '../../../../lib/client-cloudinary';
import { uploadFilesClient } from '../../../../lib/client-cloudinary';

interface ChatPageClientProps {
  chatId: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  
  const { 
    messages, 
    sendMessage, 
    status, 
    stop, 
    error, 
    setMessages, 
    regenerate 
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat'
    }),
    experimental_throttle: 50,
    onError: error => {
      console.error('An error occurred:', error);
    },
    onData: data => {
      console.log('Received data part from server:', data);
    },    
  });
  
  const [input, setInput] = useState('');
  const [files, setUploadedFiles] = useState<UploadedClientFile[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExistingMessages = async () => {
      try {
        console.log('chatId:',chatId)
        if (!chatId) return;
        
        // Use the API service instead of direct fetch
        const existingChat = await ChatApiService.getChat(chatId);
        
        console.log('existingChat:',existingChat);
       
        if (existingChat && existingChat.messages.length > 0) {
          const uiMessages = existingChat.messages.map((msg: any) => {
            const fileParts =
              (msg.files ?? []).map((file: any) => ({
                type: 'file',
                mediaType: file.mediaType,
                url: file.url,
                filename: file.filename,
              }));
            const parts = [
              ...(msg.content ? [{ type: 'text', text: msg.content }] : []),
              ...fileParts,
            ];
            return {
              id: msg._id,
              role: msg.role,
              parts,
              createdAt: msg.timestamp,
            };
          });
          console.log("uiMessages:",uiMessages)
          setMessages(uiMessages);
        }
      } catch (error) {
        console.error('Failed to load existing messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingMessages();
  }, [chatId, setMessages]);

  

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex flex-col">
        <div className="max-w-5xl mx-auto flex-1 flex flex-col w-full items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex flex-col">
      <div className="max-w-5xl mx-auto flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Chat Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Powered by Google&apos;s Generative AI
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Chat ID: {chatId}
          </p>
        </div>
        
        {/* Chat Container */}
        <ChatContainer
          messages={messages}
          status={status}
          error={error}
          onRegenerate={regenerate}
          setMessages={setMessages}
        />

        {/* Input Form - Always fixed at bottom */}
        {!error && (
          <ChatInput
            input={input}
            setInput={setInput}
            files={files}
            setUploadedFiles={setUploadedFiles}
            status={status}
            onStop={stop}
            sendMessage={sendMessage}
            chatId={chatId}
            messages={messages}
          />
        )}
      </div>
    </div>
  );
}
