'use client';
import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Menu,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentModel: string;
  onModelChange: (model: string) => void;
  userId: string;
  isSidebarOpen: boolean;
}

export default function Header({
  onToggleSidebar,
  currentModel,
  onModelChange,
  userId,
  isSidebarOpen
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const getModelDisplayName = (model: string) => {
    const modelMap: Record<string, string> = {
      'google': 'Google Gen AI',
      'openrouter:deepseek/deepseek-r1-0528:free': 'DeepSeek R1',
      'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'Llama 3.1',
      'openrouter:openai/gpt-oss-20b:free': 'GPT-Oss-20b'
    };
    return modelMap[model] || model;
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Model Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Model:</span>
          <span className="text-sm font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {getModelDisplayName(currentModel)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Settings button */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 rounded-md hover:bg-gray-100 relative"
          >
            <Settings className="w-5 h-5" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium">AI Settings</p>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">AI Model</span>
                  <select
                    value={currentModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="google">Google Gen AI</option>
                    <option value="openrouter:deepseek/deepseek-r1-0528:free">DeepSeek R1</option>
                    <option value="openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free">Llama 3.1</option>
                    <option value="openrouter:openai/gpt-oss-20b:free">GPT-Oss-20b</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Current model: <span className="font-medium">{getModelDisplayName(currentModel)}</span>
                </div>
              </div>
              <div className="px-3 py-2 border-t border-gray-100">
                <button className="w-full text-left px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Advanced settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile button */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <span className="hidden sm:block text-sm font-medium">{userId}</span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
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
    </header>
  );
}
