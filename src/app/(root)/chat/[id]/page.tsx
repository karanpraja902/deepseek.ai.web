'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';

import { AiApiService } from '@/services/api';
import { ChatApiService } from '@/services/api/chat';
import Weather from '@/components/weather/Weather';
import type { UploadedClientFile } from '@/services/api/cloudinary';
import { uploadFilesClient } from '@/services/api/cloudinary';
import { toast } from 'react-hot-toast';
import { Loader2, RefreshCw, Copy, Check, Edit, X, FileText, Download, Eye, StopCircle, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Sidebar from '@/components/ui/sidebar';
import Header from '@/components/ui/header';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import ChatInput from '@/components/chat/ChatInput';
import { ChatProvider } from '@/contexts/ChatContext';
import { addMessageAction, getChatAction, getChatMessagesAction } from '@/lib/chat-actions';
// 
// Helper function to format base64 image data


export default function ChatPage() {
  const { userId } = useAuth();
// Timer state variables
  const params = useParams();
  const [chatId, setChatId] = useState<string | null>(null);
useEffect(() => {
  if (params.id) {
    setChatId(params.id as string);
  }
}, [params.id]);
  const [model, setModel] = useState('google');
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isMeasuringResponse, setIsMeasuringResponse] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'ready' | 'preparing' | 'generating' | 'connecting' | 'converting' | 'thinking' | 'analyzing' | 'searching' | ''>('idle');
  const [statusSub, setStatusSub] = useState<string>('');
  const [error, setError] = useState<any>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [isDocumentAnalyzing, setIsDocumentAnalyzing] = useState(false);
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

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
  

  // Optimized status management for all operations
   // Monitor status changes for debugging
  useEffect(() => {
    console.log("Status changed to:", status, "Sub:", statusSub);
  }, [status, statusSub]);

  // Load messages from database when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (!chatId || chatId === 'undefined') {
          console.error('Invalid chatId:', chatId);
          return;
        }
        
        const response = await getChatMessagesAction(chatId);
        if (response.success && response.data?.messages) {
          // Transform database messages to frontend format
          const transformedMessages = response.data?.messages.map((msg: any, index: number) => ({
            id: msg._id || `msg-${index}`,
            role: msg.role,
            content: msg.content,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
            files: msg.files || [],
            metadata: msg.metadata || {},
            createdAt: new Date(msg.timestamp || Date.now())
          }));
          console.log("transformedMessages:", transformedMessages);
          setMessages(transformedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Continue with empty messages if loading fails
      }
    };

    if (chatId && chatId !== 'undefined') {
      loadMessages();
    }
  }, [chatId]);
 useEffect(() => {
    let statusMessages: Array<{ main: string; sub: string }> = [];
    let operationType = '';

    if (isImageGenerating) {
      operationType = 'Image Generation';
      statusMessages = [
        { main: 'preparing', sub: 'Initializing image generation...' },
        { main: 'connecting', sub: 'Connecting to AI model' },
        { main: 'generating', sub: 'Creating your visual content' },
        { main: 'converting', sub: 'Finalizing output format...' }
      ];
    } else if (isWebSearching) {
      operationType = 'Web Search';
      statusMessages = [
        { main: 'preparing', sub: 'Initializing web search...' },
        { main: 'searching', sub: 'Searching the web for information' },
        { main: 'analyzing', sub: 'Analyzing search results' },
        { main: 'generating', sub: 'Generating comprehensive response' }
      ];
    } else if (isDocumentAnalyzing) {
      operationType = 'Document Analysis';
      statusMessages = [
        { main: 'preparing', sub: 'Initializing document analysis...' },
        { main: 'analyzing', sub: 'Processing document content' },
        { main: 'generating', sub: 'Extracting key information' },
        { main: 'converting', sub: 'Formatting analysis results' }
      ];
    } else if (status === 'preparing') {
      statusMessages = [
        { main: 'preparing', sub: 'connecting to AI model...' },
        { main: 'thinking', sub: 'Finalizing output format..' },
      ];
    }

    if (statusMessages.length > 0) {
      let currentIndex = 0;

      // Set initial message
      const initialStatus = statusMessages[currentIndex].main as 'idle' | 'streaming' | 'ready' | 'preparing' | 'generating' | 'connecting' | 'converting' | 'analyzing' | 'searching';
      setStatus(initialStatus);
      setStatusSub(statusMessages[currentIndex].sub);

      console.log(`${operationType} started:`, initialStatus);

      const interval = setInterval(() => {
        currentIndex++;
 
        if (currentIndex < statusMessages.length) {
          const newStatus = statusMessages[currentIndex].main as 'idle' | 'streaming' | 'ready' | 'preparing' | 'generating' | 'connecting' | 'converting' | 'analyzing' | 'searching';
          const newStatusSub = statusMessages[currentIndex].sub;

          console.log(`${operationType} - Updating status to:`, newStatus, "with sub:", newStatusSub);
          setStatus(newStatus);
          setStatusSub(newStatusSub);
        } else {
          console.log(`${operationType} - Status sequence complete, clearing interval`);
          clearInterval(interval);
        }
      }, 5000); // Optimized timing for better UX
      return () => clearInterval(interval);
    }
  }, [isImageGenerating, isWebSearching, isDocumentAnalyzing, status]);


  // Custom sendMessage function that works with your backend (memoized for performance)
  const sendMessage = useCallback(async (message: any) => {

    try {
      setStatus('preparing'); // New status for initial phase
      setError(null);
      // setMessages(prev => [...prev, userMessage]);

      // Check if this is an image generation request
      const isImageGeneration = message.metadata?.isImageGeneration || false;

      // Check if this is a document analysis request
      const isDocumentMode = message.metadata?.documentMode || false;

      // Check if this is a weather request
      const isWeatherEnabled = message.metadata?.isWeatherEnabled || false;

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

          // Set initial status for image generation
          setIsImageGenerating(true);
          setStatus('preparing');
          setStatusSub('Initializing image generation...');

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
            setIsImageGenerating(false);
            console.log("ImageGenMessages:", messages);
            // Save both messages to database
            try {
              await saveMessage(chatId as string, userMessage);
              await saveMessage(chatId as string, assistantMessage);
            } catch (error) {
              console.error('Failed to save image generation messages to database:', error);
            }
          } else {
            throw new Error('Failed to generate image');
          }
        } catch (error: any) {
          console.error('Error generating image:', error);
          setStatus('idle');
          setIsImageGenerating(false);

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
        // Check if weather is enabled
        if (isWeatherEnabled && message.content) {
          try {
            console.log('Getting weather for:', message.content);

            // Call weather API
            const weatherResult = await AiApiService.getWeather({
              location: message.content.trim(),
              userQuestion: message.content.trim()
            });

            if (weatherResult.success) {
              // Create assistant message with weather data
              const assistantMessageId = (Date.now() + 1).toString();
              const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant',
                parts: [
                  { type: 'text', text: weatherResult.data.aiResponse },
                  {
                    type: 'file',
                    url: `weather://${weatherResult.data.location}`,
                    filename: `weather-${weatherResult.data.location}.json`,
                    mediaType: 'application/json',
                    weatherData: weatherResult.data
                  }
                ],
                metadata: {
                  weatherData: weatherResult.data
                },
                createdAt: new Date()
              };
              setStatus('ready');
              setMessages(prev => [...prev, assistantMessage]);

              // Save both messages to database
              try {
                await saveMessage(chatId as string, userMessage);
                await saveMessage(chatId as string, assistantMessage);
              } catch (error) {
                console.error('Failed to save weather messages to database:', error);
              }

              return;
            } else {
              throw new Error('Weather request failed');
            }
          } catch (error: any) {
            console.error('Weather error:', error);
            setStatus('idle');
            // Create error message
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              parts: [{ type: 'text', text: 'Sorry, I encountered an error while getting weather information. Please try again.' }],
              createdAt: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
            setError(new Error('Weather request failed'));
            return;
          }
        }

        // Check if web search is enabled
        console.log("Web Search message:", message);
        const isWebSearchEnabled = message.metadata?.enableWebSearch || false;
        console.log("isWebSearchEnabled:", isWebSearchEnabled);
        if (isWebSearchEnabled) {
          // Handle web search separately
          try {
            console.log('Performing web search for:', message.content);

            // Set web search status
            setIsWebSearching(true);
            setStatus('preparing');
            setStatusSub('Initializing web search...');

            // Make web search API call using AiApiService
            const webSearchResult = await AiApiService.webSearchWithAI({
              query: message.content,
              userQuestion: message.content
            });
            console.log("webSearchResult:", webSearchResult);
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
              setIsWebSearching(false);

              // Save both messages to database
              try {
                await saveMessage(chatId as string, userMessage);
                await saveMessage(chatId as string, assistantMessage);
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
            setIsWebSearching(false);

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

        // Handle document analysis
        if (isDocumentMode && message.parts) {
          try {
            console.log('Performing document analysis for:', message.content);

            // Set document analysis status
            setIsDocumentAnalyzing(true);
            setStatus('preparing');
            setStatusSub('Initializing document analysis...');

            // Find PDF files in the message parts
            const pdfFiles = message.parts.filter((part: any) =>
              part.type === 'file' && part.mediaType === 'application/pdf'
            );

            if (pdfFiles.length === 0) {
              throw new Error('No PDF files found for document analysis');
            }

            // Analyze each PDF file
            const analysisResults = [];

            for (const pdfFile of pdfFiles) {
              console.log('Analyzing PDF:', pdfFile.filename);

              // Determine analysis type based on user question
              let analysisType = 'general';
              const userQuestion = message.content?.trim();

              if (userQuestion) {
                if (userQuestion.toLowerCase().includes('summary') || userQuestion.toLowerCase().includes('summarize')) {
                  analysisType = 'summary';
                } else if (userQuestion.toLowerCase().includes('extract') || userQuestion.toLowerCase().includes('find')) {
                  analysisType = 'extract';
                } else {
                  analysisType = 'qa';
                }
              }
              console.log("analysisType:", analysisType);
              // Call document analysis API
              const analysisResult = await AiApiService.analyzeDocument({
                pdfUrl: pdfFile.url,
                question: userQuestion || 'Provide a comprehensive analysis of this document',
                analysisType: analysisType as 'summary' | 'qa' | 'extract' | 'general'
              });
              console.log("analysisResult:", analysisResult);
              if (analysisResult.success) {
                analysisResults.push({
                  filename: pdfFile.filename,
                  analysis: analysisResult.data.analysis,
                  documentInfo: analysisResult.data.documentInfo
                });
              } else {
                throw new Error(`Failed to analyze ${pdfFile.filename}`);
              }
            }

            // Create assistant message with analysis results
            const assistantMessageId = (Date.now() + 1).toString();

            let analysisText = '';
            if (analysisResults.length === 1) {
              analysisText = `## Document Analysis: ${analysisResults[0].filename}\n\n${analysisResults[0].analysis}\n\n**Document Info:** ${analysisResults[0].documentInfo.totalPages} pages, ${analysisResults[0].documentInfo.totalChunks} chunks processed`;
            } else {
              analysisText = `## Document Analysis Results\n\n`;
              analysisResults.forEach((result, index) => {
                analysisText += `### ${result.filename}\n\n${result.analysis}\n\n**Document Info:** ${result.documentInfo.totalPages} pages, ${result.documentInfo.totalChunks} chunks processed\n\n`;
              });
            }

            const assistantMessage = {
              id: assistantMessageId,
              role: 'assistant',
              parts: [
                { type: 'text', text: analysisText }
              ],
              metadata: {
                analysisResults,
                documentMode: true
              },
              createdAt: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setStatus('ready');
            setIsDocumentAnalyzing(false);

            // Save both messages to database
            try {
              await saveMessage(chatId as string, userMessage);
              await saveMessage(chatId as string, assistantMessage);
            } catch (error) {
              setStatus('idle');
              console.error('Failed to save document analysis messages to database:', error);
            }

            return;

          } catch (error: any) {
            setStatus('idle');
            console.error('Document analysis error:', error);
            setStatus('idle');
            setIsDocumentAnalyzing(false);

            // Create error message
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              parts: [{ type: 'text', text: 'Sorry, I encountered an error while analyzing the document. Please try again.' }],
              createdAt: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
            setError(new Error('Document analysis failed'));
            return;
          }
        }
        // setMessages(prev => [...prev, userMessage]);

        console.log("normal message handling:", messages)
        console.log("normaluserMessage:", userMessage)
        // Normal message handling (non-image generation, non-web search, non-document analysis)
        // Prepare assistant message ID (but don't add to messages yet)
        const assistantMessageId = (Date.now() + 1).toString();

        // Prepare messages for API (include both text and file parts)
        const currentMessages = [...messages, userMessage];
        console.log("normal currentMessages:", currentMessages)
        const apiMessages = currentMessages.map(msg => ({
          role: msg.role,
          content: msg.parts?.find((part: any) => part.type === 'text')?.text || msg.content || '',
          parts: msg.parts || []
        }));

        // Create abort controller
        const controller = new AbortController();
        streamControllerRef.current = controller;


        // Use ChatApiService for streaming request
        const response = await ChatApiService.sendMessage(apiMessages, {
          signal: controller.signal,
          userId: userId || '',
          model: model
        });
        // const result=await response.json()
        // console.log("smresponse:", result)
        console.log("Request body sent:", JSON.stringify({
          messages: apiMessages,
          userId: userId || ''
        }, null, 2))
        setStatus('streaming');

        // Add assistant message immediately
        const assistantMessage = {
          id: assistantMessageId,
          role: 'assistant',
          parts: [{ type: 'text', text: '' }],
          createdAt: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Use ChatApiService to parse streaming response
        let accumulatedText = '';
        let updateTimeout: NodeJS.Timeout | null = null;

        // Optimized streaming with immediate UI updates and background saves
        let lastUpdateTime = 0;
        let chunkBuffer = '';

        await ChatApiService.parseStreamingResponse(response, (chunk: string) => {
          accumulatedText += chunk;
          chunkBuffer += chunk;
          
          const now = Date.now();
          
          // Update UI immediately for first chunk, then throttle to 60fps (16ms)
          if (now - lastUpdateTime >= 16 || lastUpdateTime === 0) {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                  ...msg,
                  parts: [{ type: 'text', text: accumulatedText }]
                }
                : msg
            ));
            lastUpdateTime = now;
          }
        });

        // Check for empty assistant response after streaming completes
        if (!accumulatedText || accumulatedText.trim().length === 0) {
          console.error('❌ Empty assistant response received');
          
          // Remove the empty assistant message from UI
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          
          // Create specific error for empty response
          const emptyResponseError = new Error('No response received from the AI model. This might be due to a rate limit, API issue, or model unavailability.');
          (emptyResponseError as any).details = 'The AI model returned an empty response. Please try again with a different model or check your API configuration.';
          (emptyResponseError as any).status = 204; // No Content
          (emptyResponseError as any).errorType = 'empty_response_error';
          (emptyResponseError as any).suggestions = [
            'Try using Google AI model instead',
            'Check if you have hit rate limits for OpenRouter',
            'Wait a few minutes and try again',
            'Verify your API keys are configured correctly',
            'Try with a shorter or different message'
          ];
          (emptyResponseError as any).timestamp = new Date().toISOString();
          
          setError(emptyResponseError);
          setStatus('idle');
          
          // Show specific toast for empty response
          toast.error('🤖 No response received from AI model', {
            duration: 6000,
            position: 'top-center',
          });
          
          return; // Exit early, don't save empty response
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
          console.log("messages just before saving:", messages)
          await saveMessage(chatId as string, userMessage);
          await saveMessage(chatId as string, finalAssistantMessage);
        } catch (error) {
          await saveMessage(chatId as string, userMessage);

          console.error('Failed to save assistant message to database:', error);
          setStatus('idle');
        }

        // Clean up any pending timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
      }

    } catch (error: any) {
      console.error('Streaming error:', error);

      if (error.name !== 'AbortError') {
        // Comprehensive error handling for all backend error types
        let errorMessage = 'An error occurred while processing your request.';
        let errorDetails = '';
        let errorType = 'general_error';
        let statusCode = 500;
        let suggestions = [];
        
        // Handle different error response formats
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            errorDetails = errorData.details;
          }
          if (errorData.errorType) {
            errorType = errorData.errorType;
          }
          statusCode = error.response.status || error.status || 500;
        } else if (error.message) {
          errorMessage = error.message;
          statusCode = error.status || 500;
          if (error.details) {
            errorDetails = error.details;
          }
          if (error.errorType) {
            errorType = error.errorType;
          }
        }
        
        // Enhanced error categorization and suggestions
        if (statusCode === 429 || errorMessage.toLowerCase().includes('rate limit')) {
          errorType = 'rate_limit_error';
          suggestions = [
            'Wait a few minutes before trying again',
            'Try using a different model (Google AI)',
            'Add credits to your OpenRouter account',
            'Consider upgrading your OpenRouter plan'
          ];
        } else if (statusCode === 401 || errorMessage.toLowerCase().includes('api key')) {
          errorType = 'api_key_error';
          suggestions = [
            'Check if your API key is configured correctly',
            'Verify your API key has sufficient permissions',
            'Try switching to Google AI model',
            'Contact support if the issue persists'
          ];
        } else if (statusCode === 404 || errorMessage.toLowerCase().includes('not found')) {
          errorType = 'model_not_found_error';
          suggestions = [
            'Try using Google AI model instead',
            'Check if the selected model is available',
            'Switch to a different OpenRouter model',
            'Refresh the page and try again'
          ];
        } else if (statusCode === 204 || errorMessage.toLowerCase().includes('no response') || errorMessage.toLowerCase().includes('empty response')) {
          errorType = 'empty_response_error';
          suggestions = [
            'Try using Google AI model instead',
            'Check if you have hit rate limits for OpenRouter',
            'Wait a few minutes and try again',
            'Verify your API keys are configured correctly',
            'Try with a shorter or different message'
          ];
        } else if (statusCode === 400) {
          errorType = 'request_error';
          suggestions = [
            'Try shorter messages if context is too large',
            'Remove some file attachments',
            'Try a different model',
            'Refresh the page and try again'
          ];
        } else if (statusCode >= 500) {
          errorType = 'server_error';
          suggestions = [
            'Try again in a few moments',
            'Switch to Google AI model',
            'Check your internet connection',
            'Contact support if the issue persists'
          ];
        } else {
          errorType = 'general_error';
          suggestions = [
            'Try refreshing the page',
            'Switch to a different model',
            'Check your internet connection',
            'Try again in a few moments'
          ];
        }
        
        // Create enhanced error object with all details
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).details = errorDetails;
        (enhancedError as any).status = statusCode;
        (enhancedError as any).errorType = errorType;
        (enhancedError as any).suggestions = suggestions;
        (enhancedError as any).timestamp = new Date().toISOString();
        
        setError(enhancedError);
        setStatus('idle');
        
        // Stop timer on error
        if (isMeasuringResponse) {
          clearResponseTimer();
        }
        
        // Show specific toast notifications based on error type
        if (errorType === 'rate_limit_error') {
          toast.error(`OpenRouter Rate Limit: ${errorMessage}`, {
            duration: 8000,
            position: 'top-center',
            icon: '⚡',
          });
        } else if (errorType === 'api_key_error') {
          toast.error(`API Key Issue: ${errorMessage}`, {
            duration: 6000,
            position: 'top-center',
            icon: '🔑',
          });
        } else if (errorType === 'model_not_found_error') {
          toast.error(`Model Unavailable: ${errorMessage}`, {
            duration: 6000,
            position: 'top-center',
            icon: '🤖',
          });
        } else if (errorType === 'empty_response_error') {
          toast.error(`Empty Response: ${errorMessage}`, {
            duration: 6000,
            position: 'top-center',
            icon: '💭',
          });
        } else if (errorType === 'model_error') {
          toast.error(`Model Error: ${errorMessage}`, {
            duration: 5000,
            position: 'top-center',
            icon: '❌',
          });
        }
      }

      setStatus('idle');
    } finally {
      streamControllerRef.current = null;
    }
  }, [messages, model, isMeasuringResponse]);

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
  console.log("messagesInitial", messages)
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
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  console.log("setmodel:", model);

  // Save message function for persistence
  const saveMessage = async (chatId: string, message: any) => {
    try {
      console.log("saveMessage:", {chatId:chatId}, {message:message});
      // Ensure we have valid content before saving
      let content = message.content || '';
      let parts = message.parts || [];
      
      // If no content but parts exist, extract text from parts
      if (!content.trim() && parts.length > 0) {
        const textPart = parts.find((part: any) => part.type === 'text' && part.text);
        content = textPart?.text || '';
      }
      console.log("saveMessage content:", content)
      
      // Only save if we have valid content
      if (content.trim()) {
      await addMessageAction(
        chatId,
        message.role,
          content,
        message.files,
          parts,
        message.metadata
      );
      } else {
        
        console.warn('Skipping message save - no valid content found');
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Enhanced send message with user context and response time measurement
  const sendMessageWithUser = useCallback(async (message: any) => {
    console.log("static_user_id", userId || '');

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
      userId: userId || '', chatId,
      metadata: {
        ...message.metadata,
        chatId,
        model
      },
      model
    };
    console.log("messageWithUser model:", messageWithUser.model)
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
    console.log("handleEdit:", messageId, currentText)
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

  // Enhanced scroll utility functions
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  const isScrolledToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      return scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
    }
    return true;
  }, []);

  const forceScrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      // Force scroll to bottom with multiple attempts for reliability
      const attemptScroll = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      };
      
      // Multiple attempts to ensure scrolling works
      attemptScroll();
      requestAnimationFrame(attemptScroll);
      setTimeout(attemptScroll, 10);
      setTimeout(attemptScroll, 50);
    }
  }, []);

    // Enhanced auto-scroll effect for AI message generation
  useEffect(() => {
    if (status === "streaming" || messages.length > 0) {
      if (status === "streaming") {
        // Immediate scroll during streaming for faster response
        requestAnimationFrame(() => scrollToBottom('auto'));
      } else {
        // Small delay for non-streaming updates
        const timerId = setTimeout(() => scrollToBottom('smooth'), 50);
        return () => clearTimeout(timerId);
      }
    }
  }, [status, messages.length, scrollToBottom]);

  // Enhanced auto-scroll when AI messages are added or updated
  useEffect(() => {
    // Check if the last message is from assistant (AI)
    const lastMessage = messages[messages.length - 1];
    const isLastMessageFromAI = lastMessage?.role === 'assistant';
    
    if (isLastMessageFromAI && !userScrolledUp) {
      // Only auto-scroll if user hasn't manually scrolled up
      forceScrollToBottom();
    }
  }, [messages, forceScrollToBottom, userScrolledUp]);

  // Auto-scroll when streaming status changes
  useEffect(() => {
    if (status === 'streaming' && !userScrolledUp) {
      // Immediate scroll when streaming starts (only if user hasn't scrolled up)
      requestAnimationFrame(() => forceScrollToBottom());
      
      // Continuous scrolling during streaming for better UX
      const scrollInterval = setInterval(() => {
        if (status === 'streaming' && !userScrolledUp) {
          forceScrollToBottom();
        }
      }, 100); // Scroll every 100ms during streaming

      return () => clearInterval(scrollInterval);
    }
  }, [status, forceScrollToBottom, userScrolledUp]);

  // Track user scrolling behavior
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    
    if (chatContainer) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        const hasScrolledUp = scrollTop < scrollHeight - clientHeight - 50;
        
        setShowScrollToBottom(hasScrolledUp && !isAtBottom);
        setUserScrolledUp(hasScrolledUp);
        
        // Reset user scroll state when they manually scroll to bottom
        if (isAtBottom && userScrolledUp) {
          setUserScrolledUp(false);
        }
      };
      
      chatContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        chatContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [userScrolledUp]);

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

  // Sidebar functions
  const toggleSidebar = () => {
    console.log("toggleSidebar");
    setSidebarOpen(!sidebarOpen);
  };


  const handleChatSelect = async (selectedChatId: string) => {
    setError(null);
    console.log("handleChatSelect selectedChatId:", selectedChatId);
    const newUrl = `/chat/${selectedChatId}`;
    console.log("handleChatSelect newUrl:", newUrl);
    
    if (selectedChatId !== chatId) {
      window.history.replaceState({ path: newUrl }, '', newUrl);
      setChatId(selectedChatId);
      
      try {
        // Clear current messages first
        setMessages([]);
     
        setStatus('idle');
        
        // Load the selected chat's messages
        setIsLoading(true);
        const response = await getChatAction(selectedChatId);
        console.log("handleChatSelect response:", response);
        
        if (response.success && response.data?.chat && response.data.chat.messages && response.data.chat.messages.length > 0) {
          // Transform messages to match UI expectations
          const uiMessages = transformMessagesToUI(response.data.chat.messages);
          console.log("Transformed uiMessages:", uiMessages);
          setMessages(uiMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
        setError(new Error('Failed to load chat messages'));
        setMessages([]);
      }
    }
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    toast.success(`Switched to ${getModelDisplayName(newModel)}`);
  };


  // Load recent chats
 


  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Initialize static user
        const { AuthClient } = await import('@/lib/auth-client');
        const initResponse = await AuthClient.initializeStaticUser();
        console.log("initResponse:", initResponse)
        if (initResponse) {
          console.log('Static user initialized');
          setIsUserInitialized(true);
        }
      } catch (error) {
        console.warn('Failed to initialize user (non-critical):', error);
        // Even if user initialization fails, we can still use the chat
        setIsUserInitialized(true);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const loadExistingMessages = async () => {
      try {
        console.log('chatId:', chatId);
        if (!chatId || chatId === 'undefined' || chatId === 'null') {
          console.warn('Invalid chatId for loadExistingMessages:', chatId);
          setIsLoading(false);
          setMessages([]);
          return;
        }
        
        // Use the API service instead of direct fetch
        const response = await getChatAction(chatId);
        console.log('Raw API response:', response);
        
        const existingChat = response?.data?.chat;
        console.log('existingChat:', existingChat);
        
        // Additional safety check for the response structure
        if (!response || !response.success || !response.data) {
          console.warn('Invalid API response structure:', response);
          setMessages([]);
          setIsLoading(false);
          return;
        }

        if (existingChat && existingChat.messages && existingChat.messages.length > 0) {
          const uiMessages = transformMessagesToUI(existingChat.messages);
          console.log("uiMessages:", uiMessages);
          setMessages(uiMessages);
        } else {
          setMessages([]);
        }

        // Load user profile with memory context (non-blocking)
        if (isUserInitialized) {
            // Load user profile in background without blocking the chat loading
          const { AuthClient } = await import('@/lib/auth-client');
          AuthClient.getUserWithMemory(userId || '')
            .then((userResponse: any) => {
              console.log("userResponse:", userResponse);
              if (userResponse.success) {
                setUserProfile(userResponse.memory);
              }
            })
            .catch((error: any) => {
              console.warn('Failed to load user profile (non-critical):', error);
              // This is non-critical, so we don't block the UI
            });
        }
        
      } catch (error) {
        console.error('Failed to load existing messages:', error);
        setError(new Error('Failed to load chat'));
      } finally {
        setIsLoading(false);
      }
    };

    if (isUserInitialized && chatId) {
      loadExistingMessages();
    } else if (!chatId) {
      setIsLoading(false);
    }
  }, [chatId, setMessages, isUserInitialized]);


  console.log("Streamedmessages:", messages)
  // Helper function to safely transform messages from API to UI format
  const transformMessagesToUI = (messages: any[]): any[] => {
    if (!Array.isArray(messages)) {
      console.warn('transformMessagesToUI: messages is not an array:', messages);
      return [];
    }
    
    return messages.map((msg: any, index: number) => {
      // Defensive programming to handle undefined/null message properties
      const safeMsg = msg || {};
      return {
        id: safeMsg._id || safeMsg.id || `msg-${index}`,
        role: safeMsg.role || 'user',
        parts: safeMsg.parts || [{ type: 'text', text: safeMsg.content || '' }],
        content: safeMsg.content || '',
        createdAt: safeMsg.timestamp || safeMsg.createdAt || new Date(),
        files: safeMsg.files || []
      };
    });
  };

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
    console.log("firstUserMessage:", firstUserMessage);

    const content = firstUserMessage.content || '';

    // Generate contextual subtitle
    if (content.includes('vs') || content.includes('difference between')) {
      return 'Detailed comparison and analysis';
    } else if (content.includes('explain') || content.includes('how')) {
      return 'Step-by-step guidance and explanations';
    } else if (content.includes('create') || content.includes('build')) {
      return 'Development and creation assistance';
    } else {
      return content;
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
  //       <div className="max-w-5xl mx-auto flex-1 flex flex-col w-full items-center justify-center">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //           <p className="text-gray-100">Loading conversation...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  console.log("messagesaaaaaaaaaaa:", messages);

  return (
      <div className="flex h-screen bg-gray-100">
             {/* Sidebar - Always rendered, but shown differently based on screen size */}
        <SubscriptionProvider userId={userId || ''}>
          <ChatProvider>
          <Sidebar
          setChatId={setChatId}
           isOpen={sidebarOpen}
           onToggle={toggleSidebar}
           isUserInitialized={isUserInitialized}
           currentChatId={chatId as string}
           onChatSelect={handleChatSelect}
           onModelChange={handleModelChange}
           currentModel={model}
           
         />
         </ChatProvider>
        </SubscriptionProvider>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden dark:bg-gray-950">
        {/* Mobile Header with Menu Button - Only for mobile screens */}
        <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">AI Chat</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Responsive Header - Only for tablet screens (not mobile, not laptop+) */}
        <div className="hidden md:block lg:hidden">
          <Header
            title="AI Chat"
            onMenuToggle={toggleSidebar}
            isMenuOpen={sidebarOpen}
            userId={userId || ''}
          />
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-900/90">
          <div className="flex-1 flex flex-col w-full min-h-0">
            {/* Welcome Header */}
            {!messages.length &&!isLoading && (
              <div className={`text-center mb-8 px-4 ${!messages.length && 'mt-45'}`}>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-600 bg-clip-text text-transparent mb-2">
                  AI Chat Assistant
                </h1>
                <p className="text-gray-200 text-base sm:text-lg">
                  Powered by Google&apos;s Generative AI with Memory
                </p>
                <p className="text-xs sm:text-sm text-gray-200 mt-2">
                  Chat ID: {chatId} | User: {userId || ''}
                </p>

                {/* User Profile Display */}
                {userProfile && (
                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-400/30 rounded-lg mx-4">
                    <div className="text-sm text-blue-200">
                      <strong>Learning Profile:</strong> {userProfile.preferences?.conversationStyle || 'casual'} style,
                      {userProfile.preferences?.topics?.length || 0} preferred topics
                    </div>
                  </div>
                )}
              </div>
            )}


               {
                isLoading && (
                  <div className="min-h-screen bg-gray-700/80 p-4 flex flex-col">
                    <div className="max-w-5xl mx-auto flex-1 flex flex-col w-full items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-100">Loading conversation...</p>
                      </div>
                    </div>
                  </div>
                )
              }

        {/* Dynamic Title Box - Sticky header that stays visible when scrolling */}
        {messages.length > 0 && status === 'ready' && (
          <div className="sticky flex justify-center top-0 z-10 bg-gray-700/80">
            <div
              className="mx-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm group bg-gray-600/80 text-gray-200 cursor-pointer hover:shadow-md transition-shadow max-w-full"
              onClick={() => {
                if (!isEditingTitle) {
                  setIsEditingTitle(true);
                  setEditedTitle(editedTitle ? editedTitle : getConversationTitle(messages));
                }
              }}
            >
              {isEditingTitle ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg sm:text-xl font-bold text-gray-200 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 text-center sm:text-left w-full sm:w-auto"
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
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(false);
                        // Here you could save the new title to your backend if needed
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(false);
                        setEditedTitle(getConversationTitle(messages));
                      }}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className="text-lg sm:text-xl font-bold text-gray-200 scroll-m-20 text-center px-2">
                  {editedTitle ? editedTitle : getConversationSubtitle(messages)}
                </h2>
              )}
            </div>
          </div>

        )}

        {/* Chat Container with proper scrolling context */}
        {messages.length > 0 && <div className="flex-1 flex flex-col overflow-hidden bg-gray-700/80">
        {messages.length > 0 && (
          <div
            className="bg-gray-700/80 px-6 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-30 2xl:px-40  backdrop-blur-sm flex-1 overflow-y-auto min-h-0 overflow-x-hidden chat-scrollbar"
            ref={chatContainerRef}
          >

          {error ? (
            // Enhanced Error Display - Combined comprehensive error handling
            <div className="text-center py-16">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                (error as any).errorType === 'rate_limit_error' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200' :
                (error as any).errorType === 'api_key_error' ? 'bg-gradient-to-r from-orange-100 to-orange-200' :
                (error as any).errorType === 'model_not_found_error' ? 'bg-gradient-to-r from-purple-100 to-purple-200' :
                (error as any).errorType === 'empty_response_error' ? 'bg-gradient-to-r from-teal-100 to-teal-200' :
                (error as any).errorType === 'request_error' ? 'bg-gradient-to-r from-blue-100 to-blue-200' :
                (error as any).errorType === 'server_error' ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                'bg-gradient-to-r from-red-100 to-pink-100'
              }`}>
                {(error as any).errorType === 'rate_limit_error' ? (
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (error as any).errorType === 'api_key_error' ? (
                  <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                ) : (error as any).errorType === 'model_not_found_error' ? (
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (error as any).errorType === 'empty_response_error' ? (
                  <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <h3 className={`text-xl font-semibold ${
                  (error as any).errorType === 'rate_limit_error' ? 'text-gray-100' :
                  (error as any).errorType === 'api_key_error' ? 'text-gray-100' :
                  (error as any).errorType === 'model_not_found_error' ? 'text-gray-100' :
                  (error as any).errorType === 'empty_response_error' ? 'text-gray-100' :
                  (error as any).errorType === 'request_error' ? 'text-gray-100' :
                  (error as any).errorType === 'server_error' ? 'text-gray-100' :
                  'text-gray-100'
                }`}>
                  {(error as any).errorType === 'rate_limit_error' ? '⚡ Rate Limit Exceeded' :
                   (error as any).errorType === 'api_key_error' ? '🔑 API Key Issue' :
                   (error as any).errorType === 'model_not_found_error' ? '🤖 Model Unavailable' :
                   (error as any).errorType === 'empty_response_error' ? '💭 Empty Response' :
                   (error as any).errorType === 'request_error' ? '📝 Request Error' :
                   (error as any).errorType === 'server_error' ? '🔧 Server Error' :
                   '❌ Error Occurred'}
                </h3>
                {(error as any).status && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    (error as any).errorType === 'rate_limit_error' ? 'bg-gray-600 text-white' :
                    (error as any).errorType === 'api_key_error' ? 'bg-gray-600 text-white' :
                    (error as any).errorType === 'model_not_found_error' ? 'bg-gray-600 text-white' :
                    (error as any).errorType === 'empty_response_error' ? 'bg-gray-600 text-white' :
                    (error as any).errorType === 'request_error' ? 'bg-gray-600 text-white' :
                    (error as any).errorType === 'server_error' ? 'bg-gray-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    HTTP {(error as any).status}
                  </span>
                )}
              </div>
              
              <p className={`text-lg mb-4 max-w-2xl mx-auto ${
                (error as any).errorType === 'rate_limit_error' ? 'text-gray-100' :
                (error as any).errorType === 'api_key_error' ? 'text-gray-100' :
                (error as any).errorType === 'model_not_found_error' ? 'text-gray-100' :
                (error as any).errorType === 'empty_response_error' ? 'text-gray-100' :
                (error as any).errorType === 'request_error' ? 'text-gray-100' :
                (error as any).errorType === 'server_error' ? 'text-gray-100' :
                'text-gray-100'
              }`}>
                {error.message || 'An error occurred while processing your request.'}
              </p>
              
              {(error as any).details && (
                <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg border ${
                  (error as any).errorType === 'rate_limit_error' ? 'bg-gray-800 border-gray-600' :
                  (error as any).errorType === 'api_key_error' ? 'bg-gray-800 border-gray-600' :
                  (error as any).errorType === 'model_not_found_error' ? 'bg-gray-800 border-gray-600' :
                  (error as any).errorType === 'empty_response_error' ? 'bg-gray-800 border-gray-600' :
                  (error as any).errorType === 'request_error' ? 'bg-gray-800 border-gray-600' :
                  (error as any).errorType === 'server_error' ? 'bg-gray-800 border-gray-600' :
                  'bg-gray-800 border-gray-600'
                }`}>
                  <p className={`text-sm font-medium mb-2 ${
                    (error as any).errorType === 'rate_limit_error' ? 'text-gray-100' :
                    (error as any).errorType === 'api_key_error' ? 'text-gray-100' :
                    (error as any).errorType === 'model_not_found_error' ? 'text-gray-100' :
                    (error as any).errorType === 'empty_response_error' ? 'text-gray-100' :
                    (error as any).errorType === 'request_error' ? 'text-gray-100' :
                    (error as any).errorType === 'server_error' ? 'text-gray-100' :
                    'text-gray-100'
                  }`}>
                    📋 Technical Details:
                  </p>
                  <p className={`text-sm break-words ${
                    (error as any).errorType === 'rate_limit_error' ? 'text-gray-300' :
                    (error as any).errorType === 'api_key_error' ? 'text-gray-300' :
                    (error as any).errorType === 'model_not_found_error' ? 'text-gray-300' :
                    (error as any).errorType === 'empty_response_error' ? 'text-gray-300' :
                    (error as any).errorType === 'request_error' ? 'text-gray-300' :
                    (error as any).errorType === 'server_error' ? 'text-gray-300' :
                    'text-gray-300'
                  }`}>
                    {(error as any).details}
                  </p>
                </div>
              )}
           
              
              {(error as any).suggestions && (error as any).suggestions.length > 0 && (
                <div className="max-w-2xl mx-auto mb-6">
                  <p className={`text-sm font-medium mb-3 ${
                    (error as any).errorType === 'rate_limit_error' ? 'text-gray-100' :
                    (error as any).errorType === 'api_key_error' ? 'text-gray-100' :
                    (error as any).errorType === 'model_not_found_error' ? 'text-gray-100' :
                    (error as any).errorType === 'empty_response_error' ? 'text-gray-100' :
                    (error as any).errorType === 'request_error' ? 'text-gray-100' :
                    (error as any).errorType === 'server_error' ? 'text-gray-100' :
                    'text-gray-100'
                  }`}>
                    💡 Suggestions to resolve this issue:
                  </p>
                  <ul className={`text-sm text-left space-y-2 ${
                    (error as any).errorType === 'rate_limit_error' ? 'text-gray-300' :
                    (error as any).errorType === 'api_key_error' ? 'text-gray-300' :
                    (error as any).errorType === 'model_not_found_error' ? 'text-gray-300' :
                    (error as any).errorType === 'empty_response_error' ? 'text-gray-300' :
                    (error as any).errorType === 'request_error' ? 'text-gray-300' :
                    (error as any).errorType === 'server_error' ? 'text-gray-300' :
                    'text-gray-300'
                  }`}>
                    {(error as any).suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="font-mono mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setError(null);
                  setStatus('ready');
                  if (responseTimerRef.current) {
                    clearTimeout(responseTimerRef.current);
                    responseTimerRef.current = null;
                  }
                  setIsMeasuringResponse(false);
                  setResponseStartTime(null);
                  setResponseTime(null);
                }}
                  className={`px-6 py-3 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 ${
                    (error as any).errorType === 'rate_limit_error' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800' :
                    (error as any).errorType === 'api_key_error' ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' :
                    (error as any).errorType === 'model_not_found_error' ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' :
                    (error as any).errorType === 'empty_response_error' ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800' :
                    (error as any).errorType === 'request_error' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                    (error as any).errorType === 'server_error' ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800' :
                    'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  }`}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
                
                {(error as any).errorType === 'rate_limit_error' && (
                  <button
                    onClick={() => {
                      setError(null);
                      setModel('google');
                      setStatus('ready');
                    }}
                    className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    🚀 Switch to Google AI
                  </button>
                )}
                
                {((error as any).errorType === 'model_not_found_error' || (error as any).errorType === 'api_key_error' || (error as any).errorType === 'empty_response_error') && (
                  <button
                    onClick={() => {
                      setError(null);
                      setModel('google');
                      setStatus('ready');
                    }}
                    className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    🤖 Try Google AI
                  </button>
                )}
              </div>
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
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                  <div className={`flex flex-row max-w p-8 rounded-2xl  relative group  ${message.role === 'user'
                      ? 'bg-gray-600/80 text-gray-100'
                      : 'bg-gray  text-gray'
                    }`}>
                    <div className="flex items-center gap-2 absolute -bottom-2 right-2 mb-3 group-hover:opacity-100 transition-opacity duration-200">
                      {message.role === 'assistant' && (status === "ready") && (
                        <button
                          onClick={() => regenerate()}
                          className="p-1.5  hover:bg-gray-500  text-black-500 relative group/tooltip"
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
                          className="p-1.5  hover:bg-gray-500 text-gray-100 relative group/tooltip"
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
                          className="p-1.5  hover:bg-gray-500  text-black-500 relative group/tooltip"
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${message.role === 'user'
                            ? 'bg-gray-400 text-white'
                            : 'bg-gray-400 text-white'
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

                            // Handle weather data
                            if (part.type === 'file' && part.mediaType === 'application/json' && part.weatherData) {
                              return (
                                <div key={part.index ?? `${message.id}-weather-${index}`} className="relative group">
                                  <Weather {...part.weatherData} />
                                </div>
                              );
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
                              className="w-full p-2 bg-gray-500 text-gray-100 rounded-lg resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(message.id)}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-200 hover:text-gray-800 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
                                    <div key={`${message.id}-text-${index}`} className="gray-500 w-full whitespace-pre-wrap leading-relaxed markdown">
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
                                  <div key={`${message.id}-text-${index}`} className="w-full whitespace-pre-wrap leading-relaxed markdown text-gray-200">
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
<div className="ml-2 px-4">
          {status !== 'idle'  && status !== 'ready' && (
            <div className="mt-2 p-2  bg-gradient-to-r from-gray-600 to-gray-700/80  rounded-xl border-2 border-gray-400 shadow-lg backdrop-blur-sm bg-opacity-80 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="ml-2 w-5 h-5 animate-spin text-white" />
                  <div className="absolute inset-0 bg-gray-200 rounded-full opacity-0 animate-ping"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-200 font-medium flex items-center">
                    {status === 'preparing' && <span className="typing-animation">Processing</span>}
                    {status === 'thinking' && <span className="typing-animation">Thinking</span>}
                    {status === 'generating' && <span className="typing-animation">Generating</span>}
                    {status === 'analyzing' && <span className="typing-animation">Analyzing</span>}
                    {status === 'searching' && <span className="typing-animation">Searching</span>}
                    {status === 'streaming' && <span className="typing-animation">Streaming</span>}
                    {status === 'connecting' && <span className="typing-animation">Connecting to AI</span>}
                    {status === 'converting' && <span className="typing-animation">Finalizing</span>}
                    <span className="flex ml-1">
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-300">.</span>
                      <span className="animate-bounce delay-500">.</span>
                    </span>
                  </span>
                  {statusSub && (
                    <span className="text-gray-200 text-sm mt-1 animate-fadeIn">
                      {statusSub}
                    </span>
                  )}
                </div>
                {responseTime && (
                  <span className="text-gray-200 border-2 border-gray-200 text-sm ml-auto  px-3 py-1 rounded-full shadow-sm animate-slideIn">
                    Time: {(responseTime / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        </div>

        )}

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <div className="flex justify-center mb-4 px-4">
            <button
              onClick={() => {
                forceScrollToBottom();
                setShowScrollToBottom(false);
              }}
              className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 text-sm sm:text-base"
            >
              <span>↓</span>
              <span className="hidden sm:inline">Scroll to Bottom</span>
            </button>
          </div>
        )}

        {/* Auto-scroll indicator during streaming */}
        {status === 'streaming' && !userScrolledUp && (
          <div className="flex justify-center mb-2 px-4">
            <div className="px-3 py-1 bg-gray-500 text-white text-xs rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
              <span className="hidden sm:inline">Auto-scrolling</span>
            </div>
          </div>
        )}
 </div>} 
        {/* Input Form - Always fixed at bottom */}
        
        <SubscriptionProvider userId={userId || ''}>
          <ChatInput
            input={input}
            setInput={setInput}
            files={files}
            setUploadedFiles={setUploadedFiles}
            sendMessage={sendMessageWithUser}
            status={status}
            onStop={stop}
            chatId={chatId as string}
            messages={messages}
            setModel={setModel}
            model={model}
          />
        </SubscriptionProvider>
        </div>

      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto mx-2">
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
                  <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
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
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">{preview.filename}</h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-2">
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
                    >
                      Open Document
                    </a>
                    <button
                      onClick={() => setPreview(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}