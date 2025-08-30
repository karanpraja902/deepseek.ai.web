import React from "react"
import Link from "next/link"
import { MessageSquare, Plus, Settings } from "lucide-react"
import { ThemeToggle } from "./ui/theme-toggle"
  
export function AppSidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold">AI Chat Assistant</h2>
      </div>
      
      <div className="flex-1 p-4 space-y-2">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Link>
        
        <Link 
          href="/chat" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat History</span>
        </Link>
        
        <div className="pt-4">
          <ThemeToggle />
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  )
}