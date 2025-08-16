'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, RefreshCw, StopCircle, Paperclip, X } from 'lucide-react';

export default function Page() {
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
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id));
  };

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [messages, status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || files.length > 0) {
      sendMessage({
        text: input,
        files: files.length > 0 ? files : undefined
      });
      setInput('');
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex flex-col">
      <div className="max-w-5xl mx-auto flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Chat Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Powered by Google's Generative AI
          </p>
        </div>
        
        {/* Chat Container */}
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
              <p className="text-gray-500">Ask me anything and I'll help you out!</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-6">We couldn't process your request. Please try again.</p>
              <button
                onClick={() => regenerate()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Response
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative group ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                      : 'bg-gray-50 border border-gray-100 text-gray-800'
                  }`}>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 text-red-500"
                      aria-label="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        message.role === 'user' 
                          ? 'bg-white/20 text-blue-100' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <span className="text-xs opacity-80">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <div className="text-xs">
                        {message.metadata?.createdAt &&
                          new Date(message.metadata.createdAt).toLocaleTimeString('en-US',{
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                      </div>
                    </div>
                    
                    <div className="leading-relaxed space-y-2">
                      {message.parts.map((part, index) => {
                        if (part.type === 'text') {
                          return <div key={index}>{part.text}</div>;
                        } else if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                          return (
                            <div key={index} className="mt-2">
                              <img 
                                src={part.url} 
                                alt={part.filename || 'Uploaded image'} 
                                className="max-w-full h-auto rounded-lg border border-gray-200 max-h-80 object-contain"
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(status === 'submitted' || status === 'streaming') && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                </div>
                <span className="text-amber-800 font-medium">
                  {status === 'submitted' ? 'Processing your request...' : 'Streaming response...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form - Always fixed at bottom */}
        {!error && (
          <div className={`sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4 ${
            messages.length === 0 ? 'mt-auto' : ''
          }`}>
            {(status === 'ready' || status === 'error') && messages.length > 0 && (
              <button
                onClick={() => regenerate()}
                disabled={!(status === 'ready' || status === 'error')}
                className="mb-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Response
              </button>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* File preview section */}
              {files.length > 0 && (
                <div className="mb-2 p-2 bg-white/50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                          <div className="text-sm text-gray-600 truncate max-w-[120px]">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)}MB
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                {/* File input button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    accept="image/*"
                  />
                </button>
                
                {/* Text input */}
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={status !== 'ready'}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50"
                />
                
                {/* Submit or stop button */}
                {(status === 'submitted' || status === 'streaming') ? (
                  <button 
                    type="button"
                    onClick={stop}
                    className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors flex items-center justify-center"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={status !== 'ready' || (!input.trim() && files.length === 0)}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}