import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Quote,
  X,
  LogIn,
  Loader2,
  Globe,
  ExternalLink,
  FileText,
} from 'lucide-react';
import type { ChatMessage, GoogleUserProfile } from '../../types';
import { sendGeminiMessage } from '../../services/gemini';
import { getStoredGoogleToken } from '../../services/auth';

interface GeminiChatPanelProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  userProfile: GoogleUserProfile | null;
  onOpenAuthModal: () => void;
  incomingPrompt?: { text: string; quotedText?: string } | null;
  onClearIncomingPrompt?: () => void;
  documentContext?: string;
  documentName?: string;
}

export const GeminiChatPanel: React.FC<GeminiChatPanelProps> = ({
  isFullscreen,
  onToggleFullscreen,
  userProfile,
  onOpenAuthModal,
  incomingPrompt,
  onClearIncomingPrompt,
  documentContext,
  documentName,
}) => {
  const [includeDocContext, setIncludeDocContext] = useState<boolean>(true);
  const [activeModel, setActiveModel] = useState<string>('Free Router (OpenRouter)');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: "👋 **Hello! I'm your AI Reading Tutor.**\n\nI am powered by **OpenRouter's Free Models** (`openrouter/free`, `llama-3.3-70b`, `gemma-4`, etc.) with zero cost.\n\n• **Direct PDF Access**: When PDF Context is ON, I analyze your entire document.\n• **Token Saver**: Toggle PDF Context OFF anytime to spend 90%+ fewer tokens!\n• Highlight any text in your document to ask targeted questions.",
      timestamp: Date.now(),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [activeQuotedText, setActiveQuotedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming prompt from PDF selection or Translator
  useEffect(() => {
    if (incomingPrompt) {
      if (incomingPrompt.quotedText) {
        setActiveQuotedText(incomingPrompt.quotedText);
      }
      if (incomingPrompt.text) {
        setInputVal(incomingPrompt.text);
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
      onClearIncomingPrompt?.();
    }
  }, [incomingPrompt, onClearIncomingPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text && !activeQuotedText) return;

    if (!userProfile) {
      onOpenAuthModal();
      return;
    }

    const currentQuote = activeQuotedText || undefined;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text || 'Please explain the referenced text.',
      quotedText: currentQuote,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setActiveQuotedText(null);
    setIsLoading(true);

    try {
      const googleToken = getStoredGoogleToken();
      const response = await sendGeminiMessage(
        messages,
        userMsg.text,
        currentQuote,
        googleToken,
        includeDocContext ? documentContext : undefined,
        includeDocContext ? documentName : undefined
      );

      if (response.model) {
        setActiveModel(response.model);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: response.text,
        groundingSources: response.groundingSources,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: `⚠️ **Note**: ${
          err instanceof Error
            ? err.message
            : 'Failed to communicate with Gemini.'
        }`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'gemini',
        text: '🧹 Conversation cleared. Ask me anything about your PDF document or research topics!',
        timestamp: Date.now(),
      },
    ]);
  };

  // Quick prompt chips
  const quickPrompts = [
    { label: '📋 Summarize Document', prompt: 'Summarize the main themes and key takeaways of this entire uploaded document.' },
    { label: '🌐 Research Web Context', prompt: 'Browse the web for recent discoveries, context, and background on this topic.' },
    { label: '💡 Explain simply', prompt: 'Explain the main concepts in this document in simple, beginner-friendly terms.' },
    { label: '📚 Vocabulary list', prompt: 'Identify and define all technical terms, foreign words, or advanced jargon in this text.' },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-slate-50/60 dark:bg-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 p-6' : 'p-2.5 sm:p-3.5'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                AI Study Tutor
              </h2>
              <span
                title={`Active LLM: ${activeModel}`}
                className="hidden sm:inline-block text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800"
              >
                {activeModel.replace(/^.*\//, '')} (Free)
              </span>
            </div>

            {/* Document Context Toggle & Status */}
            {documentName && (
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => setIncludeDocContext((prev) => !prev)}
                  title={
                    includeDocContext
                      ? 'Full PDF context is currently included in prompts. Click to turn OFF and save tokens!'
                      : 'PDF context is OFF (saves 90%+ tokens). Click to turn ON for deep document questions.'
                  }
                  className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    includeDocContext
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>
                    {includeDocContext ? 'Doc Context: ON' : '⚡ Token Saver'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* User Auth Status Badge */}
          {userProfile ? (
            <button
              onClick={onOpenAuthModal}
              title={`Signed in as ${userProfile.email}. Click to view account.`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium hover:bg-emerald-100 transition-colors"
            >
              {userProfile.picture ? (
                <img
                  src={userProfile.picture}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
              <span className="max-w-[70px] truncate">
                {userProfile.name}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sign in with your Google account to unlock Gemini AI"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sign In</span>
            </button>
          )}

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            title="Clear chat history"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen Gemini chat'}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Convert to Fullscreen'}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Referenced quote if present */}
              {msg.quotedText && (
                <div className="flex items-start gap-1 max-w-[90%] mb-1 px-2.5 py-1 text-[11px] rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border-l-2 border-indigo-500 text-indigo-900 dark:text-indigo-200 italic">
                  <Quote className="w-3 h-3 shrink-0 text-indigo-500 mt-0.5" />
                  <span className="line-clamp-2">"{msg.quotedText}"</span>
                </div>
              )}

              <div
                className={`relative max-w-[92%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-bl-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap select-text break-words">
                  {msg.text}
                </div>

                {/* Live Web Grounding Sources */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                      <Globe className="w-3 h-3 text-blue-500" />
                      <span>Web Sources Cited (Google Search):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[10px] text-blue-600 dark:text-blue-400 hover:underline border border-blue-200/60 dark:border-blue-900/40"
                        >
                          <span className="truncate max-w-[140px]">{source.title || source.url}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy button for Gemini replies */}
                {!isUser && !msg.isError && (
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    title="Copy response"
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 rounded"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 max-w-[70%]">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Reading document & researching...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Pills */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (activeQuotedText) {
                handleSendMessage(qp.prompt);
              } else {
                setInputVal(qp.prompt);
                if (inputRef.current) inputRef.current.focus();
              }
            }}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all font-medium cursor-pointer"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Quoted Text Badge Preview */}
      {activeQuotedText && (
        <div className="mb-2 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 flex items-start justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-start gap-1.5 min-w-0">
            <Quote className="w-3.5 h-3.5 shrink-0 text-indigo-500 mt-0.5" />
            <span className="truncate italic">"{activeQuotedText}"</span>
          </div>
          <button
            onClick={() => setActiveQuotedText(null)}
            title="Remove quote"
            className="p-0.5 text-indigo-400 hover:text-indigo-600 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="relative shrink-0">
        {!userProfile && (
          <div
            onClick={onOpenAuthModal}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/10 dark:bg-black/30 backdrop-blur-xs rounded-xl cursor-pointer hover:bg-slate-900/20 transition-all"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md">
              <LogIn className="w-3.5 h-3.5" />
              Sign In with Google to Chat
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 shadow-xs transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeQuotedText
                ? 'Ask a question about the referenced text...'
                : 'Ask AI Tutor about the document or any concept...'
            }
            aria-label="Ask AI Tutor input"
            className="flex-1 max-h-24 min-h-[36px] resize-none bg-transparent px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputVal.trim() && !activeQuotedText)}
            aria-label="Send to Gemini"
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
