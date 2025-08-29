'use client';
import React from 'react';
import { useState } from 'react';
import {
  MessageSquare, 
  Plus, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Clock,
  Trash2,
  Star,
  HelpCircle,
  Zap,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useResponsive } from '../../hooks/use-mobile';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  recentChats: any[];
  currentChatId: string;
  onChatSelect: (chatId: string) => void;
  onCreateNewChat: () => void;
  onModelChange: (model: string) => void;
  currentModel: string;
  userId: string;
}

export default function Sidebar({
  isOpen,
  onToggle,
  recentChats,
  currentChatId,
  onChatSelect,
  onCreateNewChat,
  onModelChange,
  currentModel,
  userId
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isMobile, isTablet, isLaptop, isDesktop, isWide } = useResponsive();

  // Auto-close sidebar on mobile when selecting a chat
  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    if (isMobile || isTablet) {
      onToggle(); // Close sidebar on mobile/tablet after chat selection
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

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
      } else {
      return date.toLocaleDateString();
    }
  };

  const filteredChats = recentChats.filter((chat: any) => 
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    toast.success('Logged out successfully');
    setUserMenuOpen(false);
  };

  // For mobile and tablet screens, render as overlay
  if (isMobile || isTablet||isLaptop) {
    if (!isOpen) {
      return null; // Don't render anything when closed on mobile/tablet
    }

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0  bg-opacity-100 z-40 lg:hidden"
          onClick={onToggle}
        />
        
        {/* Sidebar overlay */}
        <div className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-sm z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-80 max-w-[85vw] lg:hidden`}>
          {/* Mobile header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-300">AI Chat</h1>
            <button 
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={onCreateNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search box */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative text-gray-100">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-gray-100 pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h2>
              
              {recentChats.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">No recent chats</p>
              ) : (
                <div className="space-y-1">
                  {filteredChats.map((chat: any) => (
                    <button
                      key={chat._id}
                      onClick={() => handleChatSelect(chat._id)}
                      className={`w-full text-left p-3 rounded-md flex flex-col ${
                        currentChatId === chat._id 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <span className="truncate font-medium text-sm">
                        {chat.title || 'New Chat'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {formatChatDate(chat.updatedAt || chat.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings section */}
          <div className="p-4 border-t border-gray-700">
            <div className="mb-4">
              <div className="relative">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-700 text-left text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium text-sm">AI Settings</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
                </button>

                {settingsOpen && (
                  <div className="mt-2 ml-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">AI Model</span>
                      <select
                        value={currentModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="border border-gray-600 bg-gray-800 text-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="google">Google Gen AI</option>
                        <option value="openrouter:deepseek/deepseek-r1-0528:free">DeepSeek R1</option>
                        <option value="openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free">Llama 3.1</option>
                        <option value="openrouter:openai/gpt-oss-20b:free">GPT-Oss-20b</option>
                      </select>
                    </div>
                    <div className="text-gray-500 text-sm">
                      Current: <span className="font-medium">{getModelDisplayName(currentModel)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User section */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-700 text-gray-300"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{userId}</p>
                  <p className="text-gray-400 truncate text-xs">Free Plan</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-600 py-1 z-10">
                  <div className="px-4 py-2 border-b border-gray-600">
                    <p className="text-sm font-medium text-gray-300">{userId}</p>
                    <p className="text-xs text-gray-400">Free Plan</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 text-gray-300">
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 text-gray-300">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 text-gray-300">
                      <HelpCircle className="w-4 h-4" />
                      Help & Support
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-600">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 text-gray-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar - only shown on laptop+ screens (unchanged)
  return (
    <div className={`hidden lg:block bg-gray-900/80 transition-all duration-300 ease-in-out ${
      isOpen ? 'w-64' : 'w-20'
    } flex flex-col h-full`}>
      {/* Sidebar header */}
      <div className="p-4 flex flex-row items-center justify-center">
        {isOpen && (
          <h1 className={`text-xl font-bold text-gray-500 bg-gradient-to-r from-white to-gray-600 bg-clip-text text-transparent mb-2 ${
            isTablet ? 'text-lg' : 'text-4xl'
          }`}>
            AI Chat
          </h1>
        )}
        <button 
          onClick={onToggle}
          className={`p-1 justify-center rounded-md hover:bg-gray-600 ${isOpen && 'ml-auto mb-2'}`}
        >
          {isOpen ? <ChevronLeft className="w-8 h-8" /> : <ChevronRight className="w-8 h-8" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-gray-200">
        <button
          onClick={onCreateNewChat}
          className="w-full flex items-center justify-center gap-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-300 hover:text-gray-900 transition-colors"
        >
          {isOpen ? (
            <>
              <Plus className="w-5 h-5" />
              <span className={isTablet ? 'text-sm' : 'text-base'}>New Chat</span>
            </>
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search box (only when sidebar is open) */}
      {isOpen && (
        <div className="p-4">
          <div className="relative text-gray-100">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-100 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-gray-100 pl-10 pr-4 py-2 border-4 border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto h-full">
        <div className="p-4">
          {isOpen && <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Chats</h2>}
          
          {recentChats.length === 0 && isOpen ? (
            <p className="text-gray-500 text-sm py-2">No recent chats</p>
          ) : (
            <div className="space-y-1">
              {isOpen && filteredChats.map((chat: any) => (
                <button
                  key={chat._id}
                  onClick={() => onChatSelect(chat._id)}
                  className={`w-full text-left p-2 rounded-md flex ${
                    currentChatId === chat._id 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-gray-500 hover:text-white'
                  } ${isOpen ? 'flex-col' : 'justify-center'}`}
                >
                  {isOpen ? (
                    <>
                      <span className={`truncate font-medium ${isTablet ? 'text-xs' : 'text-sm'}`}>
                        {chat.title || 'New Chat'}
                      </span>
                      <span className={`text-xs ${isTablet ? 'text-xs' : 'text-xs'}`}>
                        {formatChatDate(chat.updatedAt || chat.createdAt)}
                      </span>
                    </>
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings section */}
      <div className="p-4 border-gray-200">
        {isOpen && (
          <div className="mb-4">
            <div className="relative border-gray-500">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 text-left"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className={`font-medium ${isTablet ? 'text-xs' : 'text-sm'}`}>AI Settings</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
              </button>

              {settingsOpen && (
                <div className="mt-2 ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-gray-600 ${isTablet ? 'text-xs' : 'text-xs'}`}>AI Model</span>
                    <select
                      value={currentModel}
                      onChange={(e) => onModelChange(e.target.value)}
                      className={`border border-gray-300 rounded px-2 py-1 ${isTablet ? 'text-xs' : 'text-xs'}`}
                    >
                      <option value="google">Google Gen AI</option>
                      <option value="openrouter:deepseek/deepseek-r1-0528:free">DeepSeek R1</option>
                      <option value="openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free">Llama 3.1</option>
                      <option value="openrouter:openai/gpt-oss-20b:free">GPT-Oss-20b</option>
                    </select>
                  </div>
                  <div className={`text-gray-500 ${isTablet ? 'text-xs' : 'text-xs'}`}>
                    Current: <span className="font-medium">{getModelDisplayName(currentModel)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User section */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isTablet ? 'text-xs' : 'text-sm'}`}>{userId}</p>
                <p className={`text-gray-500 truncate ${isTablet ? 'text-xs' : 'text-xs'}`}>Free Plan</p>
              </div>
            )}
          </button>

          {userMenuOpen && isOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium">{userId}</p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Help & Support
                </button>
              </div>
              <div className="py-1 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
