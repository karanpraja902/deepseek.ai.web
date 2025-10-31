'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatApiService } from '@/services/api/chat';
import { useAuth } from '@/contexts/AuthContext';

export default function NewChatPage() {
  const router = useRouter();
  const { userId } = useAuth();
  console.log("chatpageuserId:", userId);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const createChatAndRedirect = async () => {
      if (!userId) return;

      try {
        setIsCreatingChat(true);
        // Use LangChain to load and split the PDF document
        const response = await ChatApiService.createChat(userId);
        // create a new chat with user context
        console.log("chatdata:", response.data);
        console.log("loadid:", response.data.chat.id);
        const id = response.data.chat.id;
        router.push(`/chat/${id}`); // redirect to chat page
      } catch (error) {
        console.error('Failed to create chat:', error);
        // Fallback: redirect to a default chat or show error page
        router.push('/chat/default');
      } finally {
        setIsCreatingChat(false);
      }
    };

    createChatAndRedirect();
  }, [userId, router]);

  if (isCreatingChat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Creating your chat...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Preparing your chat...</p>
        </div>
      </div>
  );
}
