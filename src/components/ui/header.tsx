'use client';
import React from 'react';
import { Menu, X, Settings, User, LogOut, HelpCircle } from 'lucide-react';
import { useResponsive } from '../../hooks/use-mobile';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  userId?: string;
}

export default function Header({ title, onMenuToggle, isMenuOpen, userId }: HeaderProps) {
  const { isMobile, isTablet } = useResponsive();

  // Only show header on screens smaller than laptop (1024px)
  if (!isMobile && !isTablet) {
    return null;
  }

  return (
    <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30">
      <div className="px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {/* Title */}
          <h1 className={`font-semibold text-white ${
            isMobile ? 'text-lg' : 
            isTablet ? 'text-xl' : 'text-2xl'
          }`}>
            {title}
          </h1>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* User info - hidden on mobile to save space */}
            {!isMobile && userId && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                <span className="hidden md:inline">Welcome,</span>
                <span className="font-medium text-white truncate max-w-[120px]">
                  {userId}
                </span>
              </div>
            )}

            {/* Settings button - always visible */}
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User menu button - hidden on mobile to save space */}
            {!isMobile && (
              <button
                className="p-2 rounded-md hover:bg-gray-700 text-gray-300 transition-colors"
                aria-label="User menu"
                onClick={onMenuToggle}>
                  
                  <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile subtitle - only show on mobile */}
        {isMobile && userId && (
          <div className="mt-2 text-sm text-gray-400">
            <span className="truncate">User: {userId}</span>
          </div>
        )}
      </div>
    </header>
  );
}
