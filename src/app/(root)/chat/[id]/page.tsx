'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import ChatInput from '../../../../components/chat/ChatInput';
import { AiApiService, AuthApiService, ChatApiService } from '../../../../services/api';
import type { UploadedClientFile } from '../../../../lib/client-cloudinary';
import { uploadFilesClient } from '../../../../lib/client-cloudinary';
import { toast } from 'react-hot-toast';
import { Loader2, RefreshCw, Copy, Check, Edit, X, FileText, Download, Eye, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Static user ID for the demo
const STATIC_USER_ID = 'static_user_karan';
// 
// Helper function to format base64 image data


export default function ChatPage() {
  const params = useParams();
  console.log("Params:", params);
  const chatId = params.id as string;
  
  // Timer state variables
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isMeasuringResponse, setIsMeasuringResponse] = useState(false);
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Preconnect to API endpoint for faster requests
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = process.env.NEXT_PUBLIC_API_URL || '';
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);
  
  // Custom streaming state (instead of useChat)
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'ready' | 'preparing'>('idle');
  const [error, setError] = useState<any>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Load messages from database when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await ChatApiService.getChatMessages(chatId);
        if (response.success && response.data.messages) {
          // Transform database messages to frontend format
          const transformedMessages = response.data.messages.map((msg: any, index: number) => ({
            id: msg._id || `msg-${index}`,
            role: msg.role,
            content: msg.content,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
            files: msg.files || [],
            metadata: msg.metadata || {},
            createdAt: new Date(msg.timestamp || Date.now())
          }));
          setMessages(transformedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Continue with empty messages if loading fails
      }
    };

    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  // Custom sendMessage function that works with your backend (memoized for performance)
  const sendMessage = useCallback(async (message: any) => {
    
    try {
      setStatus('preparing'); // New status for initial phase
      setError(null);
      

      // Check if this is an image generation request
      const isImageGeneration = message.metadata?.isImageGeneration || false;
      
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        parts: message.parts || [{ type: 'text', text: message.content || message }],
        createdAt: new Date()
      };
      console.log("Original message parts:", message.parts)

      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database
      // try {
      //   await saveMessage(chatId, userMessage);
      // } catch (error) {
      //   console.error('Failed to save user message to database:', error);
      // }

      // If this is an image generation request, handle it specially
      if (isImageGeneration && message.content) {
        try {
          console.log("isImageGeneration:", isImageGeneration);

          
          // Generate image using AI service

          const imageResult = await AiApiService.generateImage({
            prompt: message.content.trim(),
            aspectRatio: '16:9',
            size: '1024x1024'
          });
          console.log("imageResult:", imageResult);

          if (imageResult.success) {
            // Create assistant message with the generated image and commentary
            // const imageUrl = formatBase64Image(imageResult.data.image);
  // console.log("Formatted imageUrl length:", imageUrl.length);
  // console.log("Formatted imageUrl starts with:", imageUrl.substring(0, 50));
  
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage = {
              id: assistantMessageId,
              role: 'assistant',
              parts: [
                { type: 'text', text: imageResult.data.commentary || 'Here is your generated image:' },
                { 
                  type: 'file', 
                  url: imageResult.data.image, 
                  filename: 'generated-image.png',
                  mediaType: 'image/png'
                }
              ],
              createdAt: new Date()
            };
            setStatus('streaming');
          
            console.log("assistantMessage:", assistantMessage);
            setMessages(prev => [...prev, assistantMessage]);
            setStatus('ready');
            console.log("ImageGenMessages:", messages);
            // Save both messages to database
            try {
              await saveMessage(chatId, userMessage);
              await saveMessage(chatId, assistantMessage);
            } catch (error) {
              console.error('Failed to save image generation messages to database:', error);
            }
          } else {
            throw new Error('Failed to generate image');
          }
        } catch (error: any) {
          console.error('Error generating image:', error);
          setStatus('idle');
          
          // Provide detailed error message
          let errorMessage = 'Failed to generate image';
          if (error.message) {
            errorMessage = `Image generation failed: ${error.message}`;
          } else if (error.response?.data?.error) {
            errorMessage = `Server error: ${error.response.data.error}`;
          } else if (error.status) {
            errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
          }
          
          setError(new Error(errorMessage));
          return;
        }
      } else {
        // Check if web search is enabled
        const isWebSearchEnabled = message.metadata?.enableWebSearch || false;
        
        if (isWebSearchEnabled) {
          // Handle web search separately
          try {
            console.log('Performing web search for:', message.content);
            
            // Make web search API call using AiApiService
            const webSearchResult = await AiApiService.webSearchWithAI({
              query: message.content,
              userQuestion: message.content
            });
            
            if (webSearchResult.success) {
              // Create assistant message with web search results
              const assistantMessageId = (Date.now() + 1).toString();
              const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant',
                parts: [
                  { type: 'text', text: webSearchResult.data.answer },
                  ...webSearchResult.data.searchResults.map((result: any, index: number) => ({
                    type: 'file',
                    url: result.url,
                    filename: `search-result-${index + 1}.html`,
                    mediaType: 'text/html'
                  }))
                ],
                metadata: {
                  sources: webSearchResult.data.sources,
                  searchResults: webSearchResult.data.searchResults
                },
                createdAt: new Date()
              };

              setMessages(prev => [...prev, assistantMessage]);
              setStatus('ready');
              
              // Save both messages to database
              try {
                await saveMessage(chatId, userMessage);
                await saveMessage(chatId, assistantMessage);
              } catch (error) {
                console.error('Failed to save web search messages to database:', error);
              }
              
              return;
            } else {
              throw new Error('Web search failed');
            }
          } catch (error: any) {
            console.error('Web search error:', error);
            setStatus('idle');
            
            // Create error message
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              parts: [{ type: 'text', text: 'Sorry, I encountered an error while searching the web. Please try again.' }],
              createdAt: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
            setError(new Error('Web search failed'));
            return;
          }
        }

        // Normal message handling (non-image generation, non-web search)
        // Prepare assistant message ID (but don't add to messages yet)
        const assistantMessageId = (Date.now() + 1).toString();

        // Prepare messages for API (include both text and file parts)
        const currentMessages = [...messages, userMessage];
        const apiMessages = currentMessages.map(msg => ({
          role: msg.role,
          content: msg.parts?.find(part => part.type === 'text')?.text || msg.content || '',
          parts: msg.parts || []
        }));

        // Create abort controller
        const controller = new AbortController();
        streamControllerRef.current = controller;

        // Make streaming request to your backend with optimizations
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: JSON.stringify({ 
            messages: apiMessages
          }),
          signal: controller.signal,
          // Optimize for streaming
          cache: 'no-store',
          keepalive: true,
          priority: 'high',
        });
        console.log("Request body sent:", JSON.stringify({ 
          messages: apiMessages
        }, null, 2))
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }
        setStatus('streaming');

        // Optimized streaming with batched updates
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
        let accumulatedText = '';
        let isFirstChunk = true;
        let updateTimeout: NodeJS.Timeout | null = null;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Final update with complete text
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { 
                    ...msg, 
                    parts: [{ type: 'text', text: accumulatedText }]
                  }
                : msg
            ));
            break;
          }

          // Set status to streaming and add assistant message when first chunk arrives
          if (isFirstChunk) {
            setStatus('streaming');
            
            const assistantMessage = {
              id: assistantMessageId,
              role: 'assistant',
              parts: [{ type: 'text', text: '' }],
              createdAt: new Date()
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            isFirstChunk = false;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          // Batch UI updates for better performance (update every 50ms instead of every chunk)
          if (updateTimeout) clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { 
                    ...msg, 
                    parts: [{ type: 'text', text: accumulatedText }]
                  }
                : msg
            ));
          }, 50);
        }

        setStatus('ready');

        // Save the assistant message to database
        try {
          const finalAssistantMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedText,
            parts: [{ type: 'text', text: accumulatedText }],
            createdAt: new Date()
          };
          await saveMessage(chatId, finalAssistantMessage);
        } catch (error) {
          console.error('Failed to save assistant message to database:', error);
        }

        // Clean up any pending timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
      }

    } catch (error: any) {
      console.error('Streaming error:', error);
      
      if (error.name !== 'AbortError') {
        setError(error);
        // Stop timer on error
        if (isMeasuringResponse) {
          clearResponseTimer();
        }
      }
      
      setStatus('idle');
    } finally {
      streamControllerRef.current = null;
    }
  }, [messages, isMeasuringResponse]);

  const stop = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    setStatus('idle');
  };

  const regenerate = useCallback(async () => {
    if (messages.length >= 2) {
      const newMessages = messages.slice(0, -1);
      setMessages(newMessages);
      
      const lastUserMessage = [...newMessages].reverse().find(msg => msg.role === 'user');
      if (lastUserMessage) {
        await sendMessage({ content: lastUserMessage.parts?.[0]?.text || '' });
      }
    }
  }, [messages, sendMessage]);

  // UI state
  console.log("messagesInitial",messages)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename?: string; type?: string } | null>(null);
  
  const [input, setInput] = useState('');
  const [files, setUploadedFiles] = useState<UploadedClientFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserInitialized, setIsUserInitialized] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [model, setModel] = useState('google');

  console.log("model:", model);

  // Save message function for persistence
  const saveMessage = async (chatId: string, message: any) => {
    try {
      await ChatApiService.addMessage(
        chatId, 
        message.role, 
        message.content, 
        message.files, 
        message.parts, 
        message.metadata
      );
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Enhanced send message with user context and response time measurement
  const sendMessageWithUser = useCallback(async (message: any) => {
    console.log("static_user_id", STATIC_USER_ID);
    
    // Start response time measurement with high precision
    const startTime = performance.now();
    setResponseStartTime(startTime);
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
      ...message,
      userId: STATIC_USER_ID,chatId,
      metadata: {
        ...message.metadata,
        chatId,
        model
      },
      model
    };
    
    console.log("messageWithUser:", messageWithUser);
    await sendMessage(messageWithUser);
  }, [sendMessage, chatId, model, isMeasuringResponse, responseTimerRef]);
  
  // Function to clear response timer
  const clearResponseTimer = () => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    setIsMeasuringResponse(false);
    setResponseStartTime(null);
  };
  
  // Helper functions for chat display
  const handleEdit = (messageId: string, currentText: string) => {
    console.log("handleEdit:",messageId,currentText)
    setEditingId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = (messageId: string) => {
    const updated = messages.map(msg =>
      msg.id === messageId
        ? { ...msg, content: editText, parts: [{ type: 'text', text: editText }] }
        : msg
    );
    setMessages(updated as any);
    regenerate();
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getMessageText = (message: any) => {
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('\n');
    }
    return message.content || '';
  };

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 6000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getModelDisplayName = (model: string) => {
    const modelMap: Record<string, string> = {
      'google': 'Google Gen AI',
      'openrouter:deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
      'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'Llama 3.1',
      'openrouter:openai/gpt-oss-20b:free': 'GPT-Oss-20b'
    };
    return modelMap[model] || model;
  };

  const isDocument = (mediaType: string) => {
    return mediaType === 'application/pdf' || 
           mediaType.includes('document') || 
           mediaType.includes('text/') ||
           mediaType.includes('application/msword') ||
           mediaType.includes('application/vnd.openxmlformats-officedocument');
  };

  const getFileIcon = (mediaType: string, filename: string) => {
    if (mediaType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  // Auto-scroll effect (optimized for faster streaming)
  useEffect(() => {
    if (status === "streaming" || messages.length > 0) {
      // Use requestAnimationFrame for better performance during streaming
      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: status === "streaming" ? 'auto' : 'smooth'
          });
        }
      };
      
      if (status === "streaming") {
        // Immediate scroll during streaming for faster response
        requestAnimationFrame(scrollToBottom);
      } else {
        // Small delay for non-streaming updates
        const timerId = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timerId);
      }
    }
  }, [status, messages.length]);

  // Handle status changes for response time measurement
  useEffect(() => {
    console.log("status:", status);
    
    // If status changes to "ready" and we're measuring response time
    if (status === 'ready' && isMeasuringResponse && responseStartTime && !toastShownRef.current) {
      const endTime = performance.now();
      const timeTaken = Math.round(endTime - responseStartTime);
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
    if (status === 'streaming') {
      toastShownRef.current = false;
    }
    
    // If there's an error and we're measuring, stop the timer
    if (error && isMeasuringResponse) {
      clearResponseTimer();
    }
  }, [error, status, responseStartTime, isMeasuringResponse]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
      }
    };
  }, []);

  // Add a ref to track if we've already shown the toast
  const toastShownRef = useRef(false);



  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Initialize static user
        const initResponse = await AuthApiService.initializeStaticUser();
        console.log("initResponse:",initResponse)
        if (initResponse) {
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
        const {chat:existingChat} = await ChatApiService.getChat(chatId);
        
        console.log('existingChat:', existingChat);
       
        if (existingChat && existingChat.messages.length > 0) {
          const uiMessages = existingChat.messages.map((msg: any) => {
            return {
              id: msg._id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.timestamp,
              files: msg.files || []
            };
          });
          console.log("uiMessages:", uiMessages);
          setMessages(uiMessages);
        }

        // Load user profile with memory context
        if (isUserInitialized) {
          const userResponse = await AuthApiService.getUserWithMemory(STATIC_USER_ID);
          console.log("userResponse:", userResponse);
          if (userResponse.success) {
            
            setUserProfile(userResponse.memory);
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


console.log("Streamedmessages:",messages)
  // Helper function to generate conversation title
  const getConversationTitle = (messages: any[]) => {
    if (messages.length === 0) return '';
    
    // Get the first user message to determine the topic
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'Current Conversation';
    
    const content = firstUserMessage.content || '';
    
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
    
    const content = firstUserMessage.content || '';
    
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
        {messages.length > 0 && status==='ready' && (
        
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
        {messages.length > 0 && <div 
          className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-6 ${
            messages.length === 0 && !error ? 'flex-1 flex items-center justify-center' : 'flex-1 overflow-y-auto'
          }`}
          ref={chatContainerRef}
        >
          {error ? (
            // Show error message (highest priority)
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Error</h3>
              <p className="text-gray-500 mb-4">
                {error.message || 'An error occurred while processing your request.'}
              </p>
              <p className="text-gray-500 mb-6">Please try again or select another model.</p>
              <button
                onClick={() => {
                  // Clear error and reset status
                  setError(null);
                  setStatus('ready');
                  // Also clear any pending timers
                  if (responseTimerRef.current) {
                    clearTimeout(responseTimerRef.current);
                    responseTimerRef.current = null;
                  }
                  setIsMeasuringResponse(false);
                  setResponseStartTime(null);
                  setResponseTime(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : messages.length === 0 ? (
            // Show "Start a Conversation" message
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a Conversation</h3>
              <p className="text-gray-500">Ask me anything and I&apos;ll help you out!</p>
            </div>
          ) : (
            // Show messages
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`flex flex-row max-w p-8 rounded-2xl shadow-sm relative group ${
                    message.role === 'user' 
                      ? 'bg-gray-50 border border-gray-100 text-gray-800' 
                      : 'bg-white border border-gray-100 text-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 absolute -bottom-2 right-2 mb-3 group-hover:opacity-100 transition-opacity duration-200">
                      {message.role === 'assistant' && (status === "ready") && (
                        <button
                          onClick={() => regenerate()}
                          className="p-1.5 bg-gray-50 hover:bg-blue-50 text-black-500 relative group/tooltip"
                          aria-label="Regenerate response"
                          title="Regenerate Response"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Regenerate Response
                          </div>
                        </button>
                      )}
                      {message.role === 'user' && (status === "ready") && editingId !== message.id && (
                        <button
                          onClick={() => handleEdit(message.id, getMessageText(message))}
                          className="p-1.5 bg-gray-50 hover:bg-yellow-50 text-black-500 relative group/tooltip"
                          aria-label="Edit message"
                          title="Edit Message"
                        >
                          <Edit className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Edit Message
                          </div>
                        </button>
                      )}
                      {(status === "ready") && (
                        <button
                          onClick={() => handleCopy(getMessageText(message), message.id)}
                          className="p-1.5 bg-gray-50 hover:bg-green-50 text-black-500 relative group/tooltip"
                          aria-label="Copy message"
                          title="Copy Message"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            {copiedId === message.id ? 'Copied!' : 'Copy Message'}
                          </div>
                        </button>
                      )}
                    </div>
                    
                    <div className='flex flex-row gap-2'>
                      <div className="flex items-top gap-2 mt-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          message.role === 'user' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {message.role === 'user' ? 'U' : 'AI'}
                        </div> 
                      </div>
                      
                      <div className='flex flex-col'>
                        <div className="space-y-2">
                          {/* Render file attachments */}
                          {(message.parts || []).map((part: any, index: number) => {
                            if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                              // Check if this is a generated image from assistant
                              const isGeneratedImage = message.role === 'assistant' && part.filename === 'generated-image.png';
                              
                              if (isGeneratedImage) {
                                // Display generated images with proper dimensions
                                return (
                                  <div key={part.index ?? `${message.id}-img-${index}`} className="relative group">
                                    <div className="mt-4 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                      <button
                                        type="button"
                                        onClick={() => setPreview({ url: part.url, filename: part.filename, type: 'image' })}
                                        className="block w-full"
                                        title="Click to view full size"
                                      >
                                        <img
                                          src={part.url}
                                          alt={part.filename || 'Generated Image'}
                                          className="max-w-full h-auto rounded-lg shadow-lg border-2 border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                                          style={{ maxHeight: '400px', width: 'auto' }}
                                        />
                                      </button>
                                      <div className="mt-2 text-xs text-purple-600 text-center font-medium">
                                        ✨ AI Generated Image • Click to view full size
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else {
                                // Display user-uploaded images as small thumbnails (unchanged)
                                return (
                                  <div key={part.index ?? `${message.id}-img-${index}`} className="relative group">
                                    <button
                                      type="button"
                                      onClick={() => setPreview({ url: part.url, filename: part.filename, type: 'image' })}
                                      className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
                                      title="Click to preview"
                                    >
                                      <img
                                        src={part.url}
                                        alt={part.filename || 'Image'}
                                        className="w-5 h-5 object-cover rounded border"
                                      />
                                      <div className="text-sm text-gray-600 truncate max-w-[160px]">
                                        {part.filename}
                                      </div>
                                    </button>
                                  </div>
                                );
                              }
                            }
                            
                            // Handle document files
                            if (part.type === 'file' && isDocument(part.mediaType)) {
                              return (
                                <div key={part.index ?? `${message.id}-doc-${index}`} className="relative group">
                                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    {getFileIcon(part.mediaType, part.filename)}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900">
                                        {part.filename}
                                      </div>
                                      {part.pdfAnalysis && (
                                        <div className="text-xs text-gray-500">
                                          {part.pdfAnalysis.pageCount} pages • PDF analyzed
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setPreview({ url: part.url, filename: part.filename, type: 'document' })}
                                        className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                        title="View document"
                                      >
                                        <Eye className="w-4 h-4 text-gray-600" />
                                      </button>
                                      <a
                                        href={part.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                        title="Download document"
                                      >
                                        <Download className="w-4 h-4 text-gray-600" />
                                      </a>
                                    </div>
                                  </div>
                                  {part.pdfAnalysis && (
                                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                                      <strong>Document Summary:</strong> {part.pdfAnalysis.summary}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            return null;
                          })}
                        </div>
                        
                        {editingId === message.id && message.role === 'user' ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 bg-white/90 text-gray-800 rounded-lg resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(message.id)}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center leading-relaxed space-y-2 gap-2">
                            {(message.parts || []).map((part: any, index: number) => {
                              if (part.type === 'text') {
                                // For streaming messages, show chunks immediately for faster display
                                if (message.isStreaming && part.chunks && part.chunks.length > 0) {
                                  return (
                                    <div key={`${message.id}-text-${index}`} className="w-full whitespace-pre-wrap leading-relaxed markdown">
                                      {/* Render chunks directly for immediate display */}
                                      {part.chunks.map((chunk: string, chunkIndex: number) => (
                                        <span 
                                          key={`chunk-${chunkIndex}`}
                                          className={`inline ${chunkIndex === part.chunks.length - 1 ? 'animate-pulse' : ''}`}
                                        >
                                          {chunk}
                                        </span>
                                      ))}
                                      {/* Typing indicator for active streaming */}
                                      <span className="inline-block w-1 h-4 bg-blue-500 animate-pulse ml-0.5 opacity-75"></span>
                                    </div>
                                  );
                                }
                                
                                // For completed messages, use markdown rendering
                                return (
                                  <div key={`${message.id}-text-${index}`} className="w-full whitespace-pre-wrap leading-relaxed markdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {part.text}
                                    </ReactMarkdown>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'streaming' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                </div>
                <span className="text-green-800 font-medium">
                  ⚡ Streaming live...
                </span>
                {responseTime && (
                  <span className="text-green-800 text-sm ml-auto">
                    Time: {(responseTime / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>}

        {/* Input Form - Always fixed at bottom */}
          <ChatInput
            input={input}
            setInput={setInput}
            files={files}
            setUploadedFiles={setUploadedFiles}
            sendMessage={sendMessageWithUser}
            status={status}
            onStop={stop}
            chatId={chatId}
            messages={messages}
            setModel={setModel}
            model={model}
          />
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{preview.filename}</h3>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {preview.type === 'image' ? (
                <div className="text-center">
                  <img
                    src={preview.url}
                    alt={preview.filename || 'Preview'}
                    className="max-w-full h-auto rounded-lg"
                  />
                  <div className="mt-4 flex justify-center gap-2">
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Open in New Tab
                    </a>
                    <button
                      onClick={() => setPreview(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : preview.type === 'document' ? (
                <div className="text-center">
                  <div className="mb-4">
                    <FileText className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{preview.filename}</h3>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Open Document
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}