'use client';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Loader2, RefreshCw, Copy, Check, Edit, X, FileText, Download, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatApiService } from '../../services/api/chat';

interface ChatContainerProps {
  messages: any[];
  setMessages: (messages: any[]) => void;
  currentModel?: string;
  onClearError?: () => void;
  onSaveMessage?: (chatId: string, message: any) => Promise<void>;
  chatId?: string;
  userId?: string;
}

export interface ChatContainerRef {
  sendMessage: (message: any) => Promise<void>;
  stop: () => void;
}

const ChatContainer = React.forwardRef<ChatContainerRef, ChatContainerProps>(({
  messages,
  setMessages,
  currentModel,
  onClearError,
  onSaveMessage,
  chatId,
  userId
}, ref) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Internal streaming state
  const [status, setStatus] = useState<'idle' | 'processing' | 'streaming' | 'complete'>('idle');
  const [error, setError] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename?: string; type?: string } | null>(null);
  
  // Memoized values
  const modelDisplayName = useMemo(() => {
    const modelMap: Record<string, string> = {
      'google': 'Google Gen AI',
      'openrouter:deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
      'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'Llama 3.1',
      'openrouter:openai/gpt-oss-20b:free': 'GPT-Oss-20b'
    };
    return modelMap[currentModel || ''] || currentModel || 'Unknown Model';
  }, [currentModel]);

  const lastUserMessage = useMemo(() => {
    return [...messages].reverse().find(msg => msg.role === 'user');
  }, [messages]);
  
  // Streaming message function
  const sendMessage = useCallback(async (message: any) => {
    try {
      setStatus('processing');
      setError(null);
      const startTime = Date.now();

      // Create message but don't add to UI yet
      const newMessage = {
        id: Date.now().toString(),
        role: message.role || 'user',
        content: message.content || message,
        parts: message.parts || [],
        createdAt: new Date()
      };

      // Check if this is an image generation message
      if (message.metadata?.isImageGeneration) {
        // For image generation, add the assistant message immediately (no streaming)
        setStatus('complete');
        
        // For image generation, just add the message directly
        const finalMessages = [...messages, newMessage];
        setMessages(finalMessages);
        setResponseTime(Date.now() - startTime);

        // Save message if needed
        if (onSaveMessage && chatId) {
          await onSaveMessage(chatId, newMessage);
        }
        return;
      }

      // Store pending message
      setPendingUserMessage(newMessage);

      // Prepare messages for API (include pending message)
      const apiMessages = [...messages, newMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create abort controller for this request
      const controller = new AbortController();
      streamControllerRef.current = controller;

      // Make streaming request
      const response = await ChatApiService.sendMessage(apiMessages, {
        signal: controller.signal,
        userId: userId
      });

      // Now start streaming and show messages
      setStatus('streaming');
      
      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      setStreamingMessageId(assistantMessageId);
      
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date()
      };
      
      // Only now add both messages to UI when streaming starts
      const initialMessages = [...messages, newMessage, assistantMessage];
      setMessages(initialMessages);
      setPendingUserMessage(null);

      // Parse streaming response with real-time updates
      let accumulatedText = '';
      let currentMessages = initialMessages;

      await ChatApiService.parseStreamingResponse(response, (chunk: string) => {
        accumulatedText += chunk;
        
        // Update the assistant message with accumulated text
        currentMessages = currentMessages.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: accumulatedText }
            : msg
        );
        
        setMessages([...currentMessages]);
      });

      setStatus('complete');
      setResponseTime(Date.now() - startTime);

              // Save messages after completion
        if (onSaveMessage && chatId) {
          await onSaveMessage(chatId, newMessage);
          await onSaveMessage(chatId, { ...assistantMessage, content: accumulatedText });
        }

    } catch (error: any) {
      console.error('Streaming error:', error);
      
      if (error.name !== 'AbortError') {
        // Provide detailed error information
        let errorDetails = error;
        if (error.message) {
          errorDetails = {
            ...error,
            message: `Chat error: ${error.message}`,
            details: error.response?.data?.error || error.statusText || 'Unknown error occurred'
          };
        }
        setError(errorDetails);
      }
      
      setStatus('idle');
    } finally {
      streamControllerRef.current = null;
      setStreamingMessageId(null);
      setPendingUserMessage(null);
    }
  }, [messages, setMessages, onSaveMessage, chatId, userId]);

  const stop = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    setStatus('idle');
    setStreamingMessageId(null);
    setPendingUserMessage(null);
  };

  const regenerate = useCallback(() => {
    if (messages.length >= 2) {
      const newMessages = messages.slice(0, -1);
      setMessages(newMessages);
      
      if (lastUserMessage) {
        sendMessage({ content: lastUserMessage.content });
      }
    }
  }, [messages, setMessages, lastUserMessage, sendMessage]);

  // console.log("chatContainerMessage:",messages)
  useEffect(() => {
    if (status === "streaming" || messages.length > 0) {
      // 🔥 Immediate scroll with no delay for streaming
      const timerId = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: status === "streaming" ? 'auto' : 'smooth' // 🔥 Instant scroll during streaming
          });
        }
      }, status === "streaming" ? 0 : 100); // 🔥 No delay for streaming

      return () => clearTimeout(timerId);
    }
  }, [status, messages, messages[messages.length - 1]?.content]); // 🔥 Also watch content changes

  const handleEdit = (messageId: string, currentText: string) => {
    setEditingId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = (messageId: string) => {
    const updated = messages.map(msg =>
      msg.id === messageId
        ? { ...msg, content: editText, parts: [{ type: 'text', text: editText }] }
        : msg
    );
    setMessages(updated);
    regenerate();
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getMessageText = (message: any) => {
    // Handle both old (parts) and new (content) message formats
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

  // Enhanced message rendering with real-time markdown
  const renderMessageContent = useCallback((content: string, isStreaming: boolean = false) => {
    return (
      <div className="w-full whitespace-pre-wrap leading-relaxed markdown">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow as any}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm`} {...props}>
                  {children}
                </code>
              );
            },
            // Add typing indicator for streaming
            p({ children, ...props }) {
              return (
                <p {...props}>
                  {children}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                  )}
                </p>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }, []);

  // Typing Indicator Component
  const TypingIndicator = () => (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-500">
        {status === 'processing' ? 'Sending message...' : 'AI is thinking...'}
      </span>
    </div>
  );

  // Handle clearing error and staying on same chat
  const handleClearError = () => {
    setError(null);
    if (onClearError) {
      onClearError();
    }
  };

  // Expose sendMessage function for ChatInput
  React.useImperativeHandle(ref, () => ({
    sendMessage,
    stop
  }));

  // Helper function to determine if a file is a document
  const isDocument = (mediaType: string) => {
    return mediaType === 'application/pdf' || 
           mediaType.includes('document') || 
           mediaType.includes('text/') ||
           mediaType.includes('application/msword') ||
           mediaType.includes('application/vnd.openxmlformats-officedocument');
  };

  // Helper function to get file icon based on type
  const getFileIcon = (mediaType: string, filename: string) => {
    if (mediaType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

// console.log("ContainerMessage:",messages)
if(preview){
  return(
    
      <div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={() => setPreview(null)}
      >
        {messages.length > 0 && (
          <div className="sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4">
            <div className="border-2 border-gray-200 rounded-lg p-2 bg-white shadow-sm">
              <div className="text-center">
                <h2 className="text-xl  text-gray-900 ">
                  {/* {getConversationTitle(messages)} */}
                </h2>
              </div>
            </div>
          </div>
        )}
        <div className="relative max-w-4xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow hover:bg-gray-100"
            aria-label="Close preview"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {preview.type === 'image' ? (
            <img
              src={preview.url}
              alt={preview.filename || 'Preview'}
              className="max-w-[90vw] max-h-[80vh] rounded shadow-lg"
            />
          ) : (
            <div className="bg-white rounded-lg p-6 max-w-2xl">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">{preview.filename}</h3>
                <p className="text-gray-600 mb-4">Document preview not available</p>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download & View
                </a>
              </div>
            </div>
          )}
          {preview.filename && (
            <div className="mt-2 text-center text-white text-sm">{preview.filename}</div>
          )}
        </div>
      </div>
    
  )
}
console.log("chatContainerMessages:",messages)
  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-6 ${
        messages.length === 0 && !error ? 'flex-1 flex items-center justify-center' : 'flex-1 overflow-y-auto'
      }`}
      ref={chatContainerRef}
    >
      {messages.length === 0 && !error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a Conversation</h3>
          <p className="text-gray-500">Ask me anything and I&apos;ll help you out!</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Occurred</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  {error.message || 'An error occurred'}
                </h4>
                {error.details && (
                  <div className="mt-1 text-sm text-red-700">
                    {error.details}
                  </div>
                )}
                {error.status && (
                  <div className="mt-1 text-xs text-red-600">
                    Status: {error.status}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-gray-500 mb-6">
            {currentModel ? 
              `The ${modelDisplayName} model encountered an error.` : 
              'The selected model encountered an error.'
            }
          </p>
          <button
            onClick={handleClearError}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
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
                  {message.role === 'assistant' && (status !== "streaming") && (
                    <button
                      onClick={regenerate}
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
                  {message.role === 'user' && (status !== "streaming") && editingId !== message.id && (
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
                  {(status !== "streaming") && (
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
                
                <div className=' flex flex-row gap-2'>
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

                      // Handle generated images
                      if (part.type === 'generated-image') {
                        return (
                          <div key={part.index ?? `${message.id}-genimg-${index}`} className="relative group mt-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-sm font-medium text-purple-700">Generated Image</span>
                                <span className="text-xs text-purple-500">
                                  {new Date(part.generatedAt).toLocaleTimeString()}
                                </span>
                              </div>
                              
                              <div className="relative">
                                <img
                                  src={part.image}
                                  alt={part.prompt}
                                  className="w-full max-w-lg rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                  onClick={() => setPreview({ url: part.image, filename: `Generated: ${part.prompt}`, type: 'image' })}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreview({ url: part.image, filename: `Generated: ${part.prompt}`, type: 'image' })}
                                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                  title="View full size"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                                <div className="text-xs text-purple-600 font-medium mb-1">Prompt:</div>
                                <div className="text-sm text-gray-700">{part.prompt}</div>
                              </div>
                            </div>
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
               
                      {(message.parts || [{ type: 'text', text: message.content }]).map((part: any, index: number) => {
                        if (part.type === 'text') {
                          return (
                            <div key={`${message.id}-text-${index}`}>
                              {renderMessageContent(
                                part.text,
                                status === 'streaming' && message.id === streamingMessageId
                              )}
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

      {(status === 'processing' || status === 'streaming') && (
        <div className="mt-4">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;
