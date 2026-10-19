import React, { useState, useEffect, useCallback } from 'react';
import type { FullscreenTarget, ReaderTheme, GoogleUserProfile, MobileTab } from './types';
import { getStoredProfile } from './services/auth';
import { Navbar } from './components/Navbar';
import { PDFViewer } from './components/PDFViewer/PDFViewer';
import { TranslatorPanel } from './components/Translator/TranslatorPanel';
import { GeminiChatPanel } from './components/GeminiChat/GeminiChatPanel';
import { SplitPaneLayout } from './components/Layout/SplitPaneLayout';
import { GoogleSignInModal } from './components/GoogleSignInModal';

export const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [fullscreenTarget, setFullscreenTarget] = useState<FullscreenTarget>('none');
  const [leftRatio, setLeftRatio] = useState<number>(70); // 70:30 default
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [mobileTab, setMobileTab] = useState<MobileTab>('document');

  // Document state for Gemini deep comprehension
  const [documentName, setDocumentName] = useState<string>('Don Quixote.pdf');
  const [documentContext, setDocumentContext] = useState<string>('');

  // Inter-component communication
  const [translatorText, setTranslatorText] = useState<string>('');
  const [geminiPrompt, setGeminiPrompt] = useState<{
    text: string;
    quotedText?: string;
  } | null>(null);

  // Initialize stored Google auth on mount
  useEffect(() => {
    const profile = getStoredProfile();
    if (profile) setUserProfile(profile);
  }, []);

  // Sync theme with dark class on <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Actions from PDF selection
  const handleSendToTranslate = (text: string) => {
    setTranslatorText(text);
    setMobileTab('translate');
  };

  const handleSendToGemini = (text: string, explanationPrompt?: string) => {
    setGeminiPrompt({
      text:
        explanationPrompt ||
        'Please explain this sentence and break down any difficult concepts:',
      quotedText: text,
    });
    setMobileTab('gemini');
  };

  const handleDocumentLoaded = useCallback((name: string, fullText: string) => {
    setDocumentName(name);
    setDocumentContext(fullText);
  }, []);

  // Fullscreen toggles
  const togglePdfFullscreen = () => {
    setFullscreenTarget((prev) => (prev === 'pdf' ? 'none' : 'pdf'));
  };

  const toggleTranslateFullscreen = () => {
    setFullscreenTarget((prev) => (prev === 'translate' ? 'none' : 'translate'));
  };

  const toggleGeminiFullscreen = () => {
    setFullscreenTarget((prev) => (prev === 'gemini' ? 'none' : 'gemini'));
  };

  const handleResetLayout = () => {
    setLeftRatio(70);
    setFullscreenTarget('none');
    setMobileTab('document');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        userProfile={userProfile}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onResetLayout={handleResetLayout}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Split & Responsive Workspace */}
      <SplitPaneLayout
        leftRatio={leftRatio}
        setLeftRatio={setLeftRatio}
        fullscreenTarget={fullscreenTarget}
        onExitFullscreen={() => setFullscreenTarget('none')}
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        pdfComponent={
          <PDFViewer
            isFullscreen={fullscreenTarget === 'pdf'}
            onToggleFullscreen={togglePdfFullscreen}
            onSendToTranslate={handleSendToTranslate}
            onSendToGemini={handleSendToGemini}
            onDocumentLoaded={handleDocumentLoaded}
            theme={theme}
            setTheme={setTheme}
          />
        }
        translatorComponent={
          <TranslatorPanel
            isFullscreen={fullscreenTarget === 'translate'}
            onToggleFullscreen={toggleTranslateFullscreen}
            externalText={translatorText}
            onSendToGemini={handleSendToGemini}
          />
        }
        geminiComponent={
          <GeminiChatPanel
            isFullscreen={fullscreenTarget === 'gemini'}
            onToggleFullscreen={toggleGeminiFullscreen}
            userProfile={userProfile}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            incomingPrompt={geminiPrompt}
            onClearIncomingPrompt={() => setGeminiPrompt(null)}
            documentName={documentName}
            documentContext={documentContext}
          />
        }
      />

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
    </div>
  );
};

export default App;
