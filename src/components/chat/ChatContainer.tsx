'use client';
import { useRef, useEffect } from 'react';
import { Loader2, RefreshCw, Copy, Check, Edit } from 'lucide-react';

interface ChatContainerProps {
  messages: any[];
  status: string;
  error: any;
  onRegenerate: () => void;
  onCopy: (text: string, messageId: string) => void;
  onEdit: (messageId: string, currentText: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  editingId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  copiedId: string | null;
}

export default function ChatContainer({
  messages,
  status,
  error,
  onRegenerate,
  onCopy,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  editingId,
  editText,
  setEditText,
  copiedId
}: ChatContainerProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getMessageText = (message: any) => {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  };

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [messages, status]);

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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">We couldn&apos;t process your request. Please try again.</p>
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate Response
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(message => (
            <div key={`${message.id}-part-${Math.random()}`} className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`flex flex-row max-w-[80%] p-8 rounded-2xl shadow-sm relative group ${
                message.role === 'user' 
                  ? 'bg-gray-50 border border-gray-100 text-gray-800' 
                  : 'bg-gray-50 border border-gray-100 text-gray-800'
              }`}>
                <div className="flex items-center gap-2 absolute -bottom-2 right-2 mb-3 group-hover:opacity-100 transition-opacity duration-200">
                  {message.role === 'assistant' && (status !== "streaming") && (
                    <button
                      onClick={onRegenerate}
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
                      onClick={() => onEdit(message.id, getMessageText(message))}
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
                      onClick={() => onCopy(getMessageText(message), message.id)}
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
                
                <div className='flex gap-2'>
                  <div className="flex items-top gap-2 mt-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      message.role === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {message.role === 'user' ? 'U' : 'AI'}
                    </div> 
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
                          onClick={() => onSaveEdit(message.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center leading-relaxed space-y-2 gap-2">
                      {message.parts.map((part: any, index: number) => {
                        if (part.type === 'text') {
                          return <div className="gap-2" key={`${message.id}-part-${index}`}>{part.text}</div>;
                        } else if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                          return (
                            <div key={`${message.id}-part-${index}`} className="mt-2">
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
            <span className="text-blue-800 font-medium">
              {status === 'submitted' ? 'Processing your request...' : 'Generating response...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
