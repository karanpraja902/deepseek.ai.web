'use client';
import React from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatContainer from '../../../../components/chat/ChatContainer';
import ChatInput from '../../../../components/chat/ChatInput';
import { ChatApiService } from '../../../../services/api';
import type { UploadedClientFile } from '../../../../lib/client-cloudinary';
import { uploadFilesClient } from '../../../../lib/client-cloudinary';
import { toast } from 'react-hot-toast';
// Static user ID for the demo
const STATIC_USER_ID = 'static_user_karan';

interface ChatPageClientProps {
  chatId: string;
}

export default function ChatPage() {
  const params = useParams();
  console.log("Params:", params);
  let id = params;
  const chatId = params.id as string;
  
  // Timer state variables
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isMeasuringResponse, setIsMeasuringResponse] = useState(false);
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      // Stop timer on error
      if (isMeasuringResponse) {
        clearResponseTimer();
      }
    },
    onData: data => {
      console.log('Received data part from server:', data);
      // If we're measuring response time and this is the first data chunk
      if (isMeasuringResponse && responseStartTime) {
        const endTime = Date.now();
        const timeTaken = endTime - responseStartTime;
        setResponseTime(timeTaken);
        console.log(`Response time: ${timeTaken}ms`);
        setIsMeasuringResponse(false);
        
        // Clear any existing timer
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
          responseTimerRef.current = null;
        }
      }
    },    
  });
  
  const [input, setInput] = useState('');
  const [files, setUploadedFiles] = useState<UploadedClientFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserInitialized, setIsUserInitialized] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [model, setModel] = useState('google');
  const [localError, setLocalError] = useState<any>(null);
  const [localStatus, setLocalStatus] = useState<any>(null);
  console.log("model:", model);
  
  // Function to clear response timer
  const clearResponseTimer = () => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    setIsMeasuringResponse(false);
    setResponseStartTime(null);
  };
  
  // Function to clear error
  const clearError = () => {
    setLocalError(null);
  };
  
  // Add a ref to track if we've already shown the toast
  const toastShownRef = useRef(false);

  // Update local error when useChat error changes
  useEffect(() => {
    console.log("status:", status);
    setLocalError(error);
    setLocalStatus(status);
    
    // If status changes to "ready" and we're measuring response time
    if (status === 'ready' && isMeasuringResponse && responseStartTime && !toastShownRef.current) {
      const endTime = Date.now();
      const timeTaken = endTime - responseStartTime;
      setResponseTime(timeTaken);
      console.log(`Response time: ${timeTaken}ms`);
      setIsMeasuringResponse(false);
      toastShownRef.current = true;
      
      // Show toast notification
      toast.success(`Response generated in ${timeTaken}ms!`, {
        position: 'top-center',
        duration: 3000
      });
      
      // Clear any existing timer
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
    }
    
    // Reset toast flag when starting new measurement
    if (status === 'submitted') {
      toastShownRef.current = false;
    }
    
    // If status changes to "error" and we're measuring, stop the timer
    if (status === 'error' && isMeasuringResponse) {
      clearResponseTimer();
    }
  }, [error, status]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Initialize static user
        const initResponse = await fetch('/api/auth/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (initResponse.ok) {
          console.log('Static user initialized');
          setIsUserInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const loadExistingMessages = async () => {
      try {
        console.log('chatId:', chatId);
        if (!chatId) return;
        
        // Use the API service instead of direct fetch
        const existingChat = await ChatApiService.getChat(chatId);
        
        console.log('existingChat:', existingChat);
       
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
          console.log("uiMessages:", uiMessages);
          setMessages(uiMessages);
        }

        // Load user profile with memory context
        if (isUserInitialized) {
          const userResponse = await fetch(`/api/auth/user?userId=${STATIC_USER_ID}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log("userData:", userData);
            setUserProfile(userData.memory);
          }
        }
      } catch (error) {
        console.error('Failed to load existing messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isUserInitialized) {
      loadExistingMessages();
    }
  }, [chatId, setMessages, isUserInitialized]);

  // Enhanced send message with user context
  const sendMessageWithUser = async (message: any) => {

    console.log("static_user_id",STATIC_USER_ID)
    // Start response time measurement
    setResponseStartTime(Date.now());
    setIsMeasuringResponse(true);
    setResponseTime(null);
    
    // Set a timeout to automatically stop measuring after 30 seconds
    responseTimerRef.current = setTimeout(() => {
      if (isMeasuringResponse) {
        console.log("Response time measurement timed out after 30 seconds");
        setIsMeasuringResponse(false);
      }
    }, 30000);
    
    // Add user context to the message metadata
    const messageWithUser = {
      ...message,userId: STATIC_USER_ID,
      metadata: {
        ...message.metadata,
        chatId: chatId,
        model
      },
      model
    };
    console.log("messageWithUser:",messageWithUser)
    await sendMessage(messageWithUser);
  };

  // Helper function to generate conversation title
  const getConversationTitle = (messages: any[]) => {
    if (messages.length === 0) return '';
    
    // Get the first user message to determine the topic
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'Current Conversation';
    
    const content = firstUserMessage.parts?.find((p: any) => p?.type === 'text')?.text || '';
    
    // Extract key topic from the first message
    if (content.includes('vs') || content.includes('difference between')) {
      return 'Comparison Analysis';
    } else if (content.includes('explain') || content.includes('how')) {
      return 'Explanation & Guidance';
    } else if (content.includes('create') || content.includes('build')) {
      return 'Creation & Development';
    } else if (content.includes('analyze') || content.includes('review')) {
      return 'Analysis & Review';
    } else {
      // Default: use first few words as title
      const words = content.split(' ').slice(0, 4).join(' ');
      return words.length > 20 ? words.substring(0, 20) + '...' : words;
    }
  };

  // Helper function to generate conversation subtitle
  const getConversationSubtitle = (messages: any[]) => {
    if (messages.length === 0) return '';
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'AI-powered conversation';
    
    const content = firstUserMessage.parts?.find((p: any) => p?.type === 'text')?.text || '';
    
    // Generate contextual subtitle
    if (content.includes('vs') || content.includes('difference between')) {
      return 'Detailed comparison and analysis';
    } else if (content.includes('explain') || content.includes('how')) {
      return 'Step-by-step guidance and explanations';
    } else if (content.includes('create') || content.includes('build')) {
      return 'Development and creation assistance';
    } else {
      return 'AI-powered conversation with memory';
    }
  };

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
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50  to-indigo-100 p-4 flex flex-col`}>
      <div className={`max-w-5xl  mx-auto flex-1 flex flex-col w-full ${messages.length === 0 ? 'justify-center' : ''}`}>
        {/* Header */}
        {!messages.length&&<div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Chat Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Powered by Google&apos;s Generative AI with Memory
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Chat ID: {chatId} | User: {STATIC_USER_ID}
          </p>
          
          {/* Response time display */}
          {responseTime !== null && (
            <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                Response time: <strong>{responseTime}ms</strong>
              </div>
            </div>
          )}
          
          {/* User Profile Display */}
          {userProfile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Learning Profile:</strong> {userProfile.preferences?.conversationStyle || 'casual'} style, 
                {userProfile.preferences?.topics?.length || 0} preferred topics
              </div>
            </div>
          )}
        </div>}
        
        {/* Dynamic Title Box - Sticky header that stays visible when scrolling */}
        {messages.length > 0 && (
        
            <div className="sticky flex justify-center top-0 z-10  bg-gradient-to-b from-transparent to-white/50 pb-4 rounded-2xl ">
              <div 
                className="p-4 rounded-2xl shadow-sm group bg-white border border-gray-100 text-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  if (!isEditingTitle) {
                    setIsEditingTitle(true);
                    setEditedTitle(editedTitle?editedTitle:getConversationTitle(messages));
                  }
                }}
              >
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingTitle(false);
                          // Here you could save the new title to your backend if needed
                        } else if (e.key === 'Escape') {
                          setIsEditingTitle(false);
                          setEditedTitle(getConversationTitle(messages));
                        }
                      }}
                      onBlur={() => {
                        setIsEditingTitle(false);
                        // Here you could save the new title to your backend if needed
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(false);
                        // Here you could save the new title to your backend if needed
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <h2 className="text-xl font-bold text-gray-900">
                    {editedTitle?editedTitle:getConversationSubtitle(messages)}
                  </h2>
                )}
              </div>
            </div>
          
        )}
        
        {/* Chat Container with proper scrolling context */}
        {messages.length > 0 && (
          
            <ChatContainer
              messages={messages}
              status={status}
              error={localError}
              onRegenerate={regenerate}
              setMessages={setMessages}
              currentModel={model}
              onClearError={clearError}
              responseTime={responseTime} // Pass response time to container
            />
          
        )}

        {/* Input Form - Always fixed at bottom */}
        {!localError && (
          <ChatInput
            input={input}
            setInput={setInput}
            files={files}
            setUploadedFiles={setUploadedFiles}
            status={status}
            onStop={stop}
            sendMessage={sendMessageWithUser}
            chatId={chatId}
            messages={messages}
            setModel={setModel}
            model={model}
            isMeasuringResponse={isMeasuringResponse} // Pass measurement state
          />
        )}
      </div>
    </div>
  );
}