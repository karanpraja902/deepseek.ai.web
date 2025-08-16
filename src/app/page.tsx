// 'use client';
// import { useChat } from '@ai-sdk/react';
// import { DefaultChatTransport } from 'ai';
// import { useState } from 'react';
// import { Loader2, Trash2 } from 'lucide-react';

// export default function Page() {
//   const { messages, sendMessage, status, stop, error, setMessages } = useChat({
//     transport: new DefaultChatTransport({
//       api: '/api/chat',
//     }),
//   });
//   const [input, setInput] = useState('');

//   const handleDelete = (id: string) => {
//     setMessages(messages.filter(message => message.id !== id));
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
//             AI Chat Assistant
//           </h1>
//           <p className="text-gray-600 text-lg">
//             Powered by Google's Generative AI
//           </p>
//         </div>
        
//         {/* Chat Container */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-6 min-h-[500px] max-h-[700px] overflow-y-auto">
//           {messages.length === 0 && !error ? (
//             <div className="text-center py-16">
//               <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
//                 <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a Conversation</h3>
//               <p className="text-gray-500">Ask me anything and I'll help you out!</p>
//             </div>
//           ) : error ? (
//             <div className="text-center py-16">
//               <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
//                 <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">Something went wrong</h3>
//               <p className="text-gray-500 mb-6">We couldn't process your request. Please try again.</p>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
//               >
//                 Retry
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {messages.map(message => (
//                 <div key={message.id} className={`flex ${
//                   message.role === 'user' ? 'justify-end' : 'justify-start'
//                 }`}>
//                   <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative group ${
//                     message.role === 'user' 
//                       ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
//                       : 'bg-gray-50 border border-gray-100 text-gray-800'
//                   }`}>
//                     {/* Delete button */}
//                     <button
//                       onClick={() => handleDelete(message.id)}
//                       className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 text-red-500"
//                       aria-label="Delete message"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
                    
//                     <div className="flex items-center gap-2 mb-2">
//                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
//                         message.role === 'user' 
//                           ? 'bg-white/20 text-blue-100' 
//                           : 'bg-blue-100 text-blue-600'
//                       }`}>
//                         {message.role === 'user' ? 'U' : 'AI'}
//                       </div>
//                       <span className="text-xs opacity-80">
//                         {message.role === 'user' ? 'You' : 'Assistant'}
//                       </span>
//                     </div>
//                     <div className="leading-relaxed">
//                       {message.parts.map((part, index) =>
//                         part.type === 'text' ? <span key={index}>{part.text}</span> : null,
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Status Indicator - Now with a separate stop button in the input area */}
//           {(status === 'submitted' || status === 'streaming') && (
//             <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
//               <div className="flex items-center gap-3">
//                 <div className="relative">
//                   <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
//                 </div>
//                 <span className="text-amber-800 font-medium">
//                   {status === 'submitted' ? 'Processing your request...' : 'Streaming response...'}
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Input Form - Disabled when error occurs */}
//         {!error && (
//           <div className="relative">
//             {/* Stop button positioned above the input form */}
//             {(status === 'streaming' || status === 'submitted') && (
//               <div className="flex justify-end mb-2">
//                 <button 
//                   onClick={stop}
//                   disabled={!(status === 'streaming' || status === 'submitted')}
//                   className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
//                   </svg>
//                   Stop Generation
//                 </button>
//               </div>
//             )}
            
//             <form
//               onSubmit={e => {
//                 e.preventDefault();
//                 if (input.trim()) {
//                   sendMessage({ text: input });
//                   setInput('');
//                 }
//               }}
//             >
//               <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
//                 <input
//                   value={input}
//                   onChange={e => setInput(e.target.value)}
//                   disabled={status !== 'ready'}
//                   placeholder="Ask me anything..."
//                   className="flex-1 px-6 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50"
//                 />
//                 <button 
//                   type="submit" 
//                   disabled={status !== 'ready' || !input.trim()}
//                   className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                   </svg>
//                 </button>
//               </div>
//             </form>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';

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
      api: '/api/chat',
    }),
  });
  const [input, setInput] = useState('');

  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-6 min-h-[500px] max-h-[700px] overflow-y-auto">
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
                    {/* Delete button */}
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
                    </div>
                    <div className="leading-relaxed">
                      {message.parts.map((part, index) =>
                        part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Indicator */}
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

        {/* Input Form - Disabled when error occurs */}
        {!error && (
          <div className="relative">
            {/* Action buttons (Stop/Regenerate) positioned above the input form */}
            <div className="flex justify-between mb-2">
              {(status === 'streaming' || status === 'submitted') && (
                <button 
                  onClick={stop}
                  disabled={!(status === 'streaming' || status === 'submitted')}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Generation
                </button>
              )}

              {(status === 'ready' || status === 'error') && messages.length > 0 && (
                <button
                  onClick={() => regenerate()}
                  disabled={!(status === 'ready' || status === 'error')}
                  className="ml-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Response
                </button>
              )}
            </div>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput('');
                }
              }}
            >
              <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={status !== 'ready'}
                  placeholder="Ask me anything..."
                  className="flex-1 px-6 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={status !== 'ready' || !input.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}