import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Languages,
  Maximize2,
  Minimize2,
  Volume2,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  Loader2,
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  type TranslationHistoryItem,
} from '../../types';
import { translateEnglishTo, speakText } from '../../services/translator';

interface TranslatorPanelProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  externalText?: string;
  onSendToGemini?: (text: string, explanationPrompt?: string) => void;
}

export const TranslatorPanel: React.FC<TranslatorPanelProps> = ({
  isFullscreen,
  onToggleFullscreen,
  externalText,
  onSendToGemini,
}) => {
  const [targetLang, setTargetLang] = useState<string>('es'); // default Spanish
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Perform translation
  const handleTranslate = useCallback(
    async (text: string, lang: string) => {
      const clean = text.trim();
      if (!clean) {
        setTranslatedText('');
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await translateEnglishTo(clean, lang);
        setTranslatedText(result);

        // Add to history if unique
        setHistory((prev) => {
          const filtered = prev.filter(
            (item) => item.sourceText.toLowerCase() !== clean.toLowerCase()
          );
          return [
            {
              id: Date.now().toString(),
              sourceText: clean,
              translatedText: result,
              targetLang: lang,
              timestamp: Date.now(),
            },
            ...filtered.slice(0, 4),
          ];
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Translation failed. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Respond to incoming external text (e.g. from PDF selection)
  useEffect(() => {
    if (externalText && externalText !== sourceText) {
      setSourceText(externalText);
      handleTranslate(externalText, targetLang);
    }
  }, [externalText, targetLang, handleTranslate]);

  // Handle manual input with auto-debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setTranslatedText('');
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      handleTranslate(val, targetLang);
    }, 450);
  };

  // Language switch
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setTargetLang(newLang);
    if (sourceText.trim()) {
      handleTranslate(sourceText, newLang);
    }
  };

  // Copy translated text
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
        handleTranslate(text, targetLang);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Clear inputs
  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 p-6' : 'p-3.5'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>Google Translate</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                EN → {selectedLangObj?.name}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Target language selector */}
          <select
            value={targetLang}
            onChange={handleLanguageChange}
            aria-label="Select target translation language"
            className="text-xs font-medium py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen translator'}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Convert to Fullscreen'}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Translation Cards Area */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto pr-0.5">
        {/* Source Text (English) */}
        <div className="flex-1 min-h-[90px] flex flex-col bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/60 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium shrink-0">
            <span className="flex items-center gap-1">
              <span>English</span>
              <span className="text-[10px] text-slate-400">({sourceText.length} chars)</span>
            </span>
            <div className="flex items-center gap-1">
              {sourceText && (
                <>
                  <button
                    onClick={() => speakText(sourceText, 'en-US')}
                    title="Listen to English pronunciation"
                    className="p-1 hover:text-blue-600 rounded transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleClear}
                    title="Clear text"
                    className="p-1 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {!sourceText && (
                <button
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] hover:text-blue-600 rounded border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 transition-colors"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={sourceText}
            onChange={handleInputChange}
            placeholder="Type or paste English words/sentences (or select from PDF)..."
            aria-label="English text to translate"
            className="w-full flex-1 resize-none bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Translation Result */}
        <div className="flex-1 min-h-[90px] flex flex-col bg-blue-50/40 dark:bg-slate-800/80 rounded-xl p-2.5 border border-blue-100 dark:border-slate-700/80 transition-all relative">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium shrink-0">
            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold">
              <span>{selectedLangObj?.name}</span>
              <span>{selectedLangObj?.nativeName ? `(${selectedLangObj.nativeName})` : ''}</span>
            </span>
            <div className="flex items-center gap-1">
              {translatedText && (
                <>
                  <button
                    onClick={() => speakText(translatedText, targetLang)}
                    title="Listen to translation"
                    className="p-1 hover:text-blue-600 rounded transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCopy}
                    title="Copy translated text"
                    className="p-1 hover:text-emerald-600 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto text-xs text-slate-900 dark:text-slate-100 leading-relaxed">
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400 pt-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Translating to {selectedLangObj?.name}...</span>
              </div>
            ) : error ? (
              <div className="text-xs text-rose-500 pt-1 leading-relaxed">
                {error}
                <button
                  onClick={() => handleTranslate(sourceText, targetLang)}
                  className="ml-2 underline font-medium hover:text-rose-600"
                >
                  Retry
                </button>
              </div>
            ) : translatedText ? (
              <p className="select-text whitespace-pre-wrap">{translatedText}</p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic select-none">
                Translation will automatically appear here once you paste or select text...
              </p>
            )}
          </div>

          {/* Quick link to Gemini if text exists */}
          {translatedText && onSendToGemini && (
            <div className="pt-2 border-t border-blue-100 dark:border-slate-700/60 mt-1 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">Need deeper context?</span>
              <button
                onClick={() =>
                  onSendToGemini(
                    sourceText,
                    `Explain this sentence and how it translates to ${selectedLangObj?.name}: "${sourceText}"`
                  )
                }
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Explain with Gemini</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent History Quick Chips */}
      {history.length > 0 && !isFullscreen && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
          <span className="text-slate-400 shrink-0 font-medium">Recent:</span>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setSourceText(h.sourceText);
                setTranslatedText(h.translatedText);
                setTargetLang(h.targetLang);
              }}
              title={h.sourceText}
              className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors truncate max-w-[120px]"
            >
              {h.sourceText}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
