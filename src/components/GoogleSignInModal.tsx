import React, { useState } from 'react';
import {
  CheckCircle2,
  LogOut,
  X,
  User,
  ShieldCheck,
  Mail,
  Sparkles,
} from 'lucide-react';
import type { GoogleUserProfile } from '../types';
import {
  setStoredProfile,
  setStoredGoogleToken,
  clearGoogleAuth,
} from '../services/auth';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: GoogleUserProfile | null;
  setUserProfile: (profile: GoogleUserProfile | null) => void;
  onSignedIn?: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  onSignedIn,
}) => {
  const [email, setEmail] = useState('cybernut2001@gmail.com');
  const [name, setName] = useState('cybernut2001');

  if (!isOpen) return null;

  const handleSignOut = () => {
    clearGoogleAuth();
    setUserProfile(null);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim() || 'user@gmail.com';
    const cleanName =
      name.trim() || cleanEmail.split('@')[0] || 'Google User';

    const profile: GoogleUserProfile = {
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email: cleanEmail,
      picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        cleanEmail
      )}`,
    };

    setStoredProfile(profile);
    setStoredGoogleToken('google_session_' + Date.now());
    setUserProfile(profile);
    onSignedIn?.();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-signin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
              {/* Google G SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="google-signin-title"
                className="text-base font-bold tracking-tight"
              >
                Sign in with Google
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock your Gemini AI reading tutor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active status if already signed in */}
          {userProfile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center overflow-hidden border-2 border-emerald-300 dark:border-emerald-700">
                    {userProfile.picture ? (
                      <img
                        src={userProfile.picture}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{userProfile.name}</span>
                    </div>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400 font-mono">
                      {userProfile.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>You are ready!</strong> Gemini is unlocked. Select any
                  sentence or word from your PDF and click <strong>"Ask Gemini"</strong> to receive explanations.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-blue-800 dark:text-blue-300">
                    No API Key Required from Users
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    Simply enter your Google Account to sign in and immediately access the Gemini reading companion.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-google-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Google / Gmail Account
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="user-google-email"
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-display-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="user-display-name"
                    type="text"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 text-xs font-semibold rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
