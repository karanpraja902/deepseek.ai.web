'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Copy, Check, Edit, X, FileText, Download, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatContainerProps {
  messages: any[];
  status: string;
  error: any;
  onRegenerate: () => void;
  setMessages: (messages: any[]) => void;
  currentModel?: string;
  onClearError?: () => void;
}

export default function ChatContainer({
  messages,
  status,
  error,
  onRegenerate,
  setMessages,
  currentModel,
  onClearError,
}: ChatContainerProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; filename?: string; type?: string } | null>(null);
  
  // console.log("chatContainerMessage:",messages)
  useEffect(() => {
    if(status==="streaming"){
      const timerId = setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 1000); // Delay of 2000 milliseconds (2 seconds)
  
      // 2. Cleanup function: runs on component unmount
      return () => {
        clearTimeout(timerId); // Cancels the timeout if the component unmounts
      };
    }
   

  }, [status,messages]);

  const handleEdit = (messageId: string, currentText: string) => {
    setEditingId(messageId);
    setEditText(currentText);
  };

  const handleSaveEdit = (messageId: string) => {
    const updated = messages.map(msg =>
      msg.id === messageId
        ? { ...msg, parts: [{ type: 'text', text: editText }] }
        : msg
    );
    setMessages(updated);
    onRegenerate();
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getMessageText = (message: any) => {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
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

  // Helper function to get model display name
  const getModelDisplayName = (model: string) => {
    const modelMap: Record<string, string> = {
      'google': 'Google Gen AI',
      'openrouter:deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
      'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'Llama 3.1',
      'openrouter:openai/gpt-oss-20b:free': 'GPT-Oss-20b'
    };
    return modelMap[model] || model;
  };

  // Handle clearing error and staying on same chat
  const handleClearError = () => {
    if (onClearError) {
      onClearError();
    }
  };

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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Model Error</h3>
          <p className="text-gray-500 mb-4">
            {currentModel ? 
              `The ${getModelDisplayName(currentModel)} model is currently unable to generate a response.` : 
              'The selected model is currently unable to generate a response.'
            }
          </p>
          <p className="text-gray-500 mb-6">Please select another model and try again.</p>
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
                    {message.parts.map((part: any, index: number) => {
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
                                <div className="text-sm font-medium text-gray-900 truncate">
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
                                <strong>Summary:</strong> {part.pdfAnalysis.summary}
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
               
                      {message.parts.map((part: any, index: number) => {
	if (part.type === 'text') {
		return (
			<div key={message.id} className="w-full whitespace-pre-wrap leading-relaxed markdown">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{part.text}
				</ReactMarkdown>
			</div>
		);
  }})}
                    </div>
                  )}
                  </div>
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