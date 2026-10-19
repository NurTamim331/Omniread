import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Maximize,
  Minimize,
  SlidersHorizontal,
  CheckCircle2,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';
import type { GoogleUserProfile, ReaderTheme } from '../types';

interface NavbarProps {
  userProfile: GoogleUserProfile | null;
  onOpenAuthModal: () => void;
  onResetLayout: () => void;
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenAuthModal,
  onResetLayout,
  theme,
  setTheme,
}) => {
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  };

  return (
    <nav className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            OmniRead
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">
            PDF Reader & Language Companion
          </span>
        </div>
      </div>

      {/* Middle & Right Actions */}
      <div className="flex items-center gap-2">
        {/* Reset 70:30 layout button */}
        <button
          onClick={onResetLayout}
          title="Reset to default 70:30 screen ratio"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset 70:30</span>
        </button>

        {/* Theme switcher */}
        <button
          onClick={() =>
            setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light')
          }
          title={`Reader theme: ${theme.toUpperCase()}`}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : theme === 'sepia' ? (
            <BookOpen className="w-4 h-4 text-amber-600" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Google Account Sign-In / Status */}
        {userProfile ? (
          <button
            onClick={onOpenAuthModal}
            title={`Signed in as ${userProfile.email}. Click to view account.`}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100/70 transition-colors cursor-pointer"
          >
            {userProfile.picture ? (
              <img
                src={userProfile.picture}
                alt="Google avatar"
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="max-w-[110px] truncate">
              {userProfile.name}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        )}

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Browser Fullscreen Button */}
        <button
          onClick={toggleBrowserFullscreen}
          title={isBrowserFullscreen ? 'Exit window fullscreen' : 'Window fullscreen'}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {isBrowserFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
};
