import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  GripHorizontal,
  Minimize2,
  FileText,
  Languages,
  Sparkles,
  Columns2,
  Rows2,
} from 'lucide-react';
import type { FullscreenTarget, MobileTab } from '../../types';

interface SplitPaneLayoutProps {
  pdfComponent: React.ReactNode;
  translatorComponent: React.ReactNode;
  geminiComponent: React.ReactNode;
  fullscreenTarget: FullscreenTarget;
  onExitFullscreen: () => void;
  leftRatio: number;
  setLeftRatio: (ratio: number) => void;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  pdfComponent,
  translatorComponent,
  geminiComponent,
  fullscreenTarget,
  onExitFullscreen,
  leftRatio,
  setLeftRatio,
  mobileTab,
  setMobileTab,
}) => {
  const [rightTopRatio, setRightTopRatio] = useState<number>(45); // 45% translator, 55% gemini
  const [companionTab, setCompanionTab] = useState<'translate' | 'gemini'>('translate');
  const [companionMode, setCompanionMode] = useState<'stacked' | 'tabs'>('stacked');

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isDraggingHRef = useRef(false);
  const isDraggingVRef = useRef(false);

  // Auto-switch companion mode based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setCompanionMode('tabs');
      } else if (window.innerWidth >= 1024) {
        setCompanionMode('stacked');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenTarget !== 'none') {
        onExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenTarget, onExitFullscreen]);

  // Horizontal Dragging (Between Left PDF and Right Panel)
  const handlePointerDownH = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    isDraggingHRef.current = true;
  };

  const handlePointerMoveH = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingHRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const newPercent = (currentX / rect.width) * 100;
    // Clamp between 30% and 80%
    const clamped = Math.min(80, Math.max(30, newPercent));
    setLeftRatio(clamped);
  };

  const handlePointerUpH = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingHRef.current) {
      isDraggingHRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Vertical Dragging (Between Translator Top and Gemini Bottom)
  const handlePointerDownV = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    isDraggingVRef.current = true;
  };

  const handlePointerMoveV = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVRef.current || !rightPaneRef.current) return;
    const rect = rightPaneRef.current.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const newPercent = (currentY / rect.height) * 100;
    // Clamp between 20% and 80%
    const clamped = Math.min(80, Math.max(20, newPercent));
    setRightTopRatio(clamped);
  };

  const handlePointerUpV = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingVRef.current) {
      isDraggingVRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Fullscreen renderings
  if (fullscreenTarget === 'pdf') {
    return (
      <div className="relative w-full h-full flex flex-col">
        {pdfComponent}
        <button
          onClick={onExitFullscreen}
          title="Restore Split Layout (Esc)"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      </div>
    );
  }

  if (fullscreenTarget === 'translate') {
    return (
      <div className="relative w-full h-full flex flex-col">
        {translatorComponent}
        <button
          onClick={onExitFullscreen}
          title="Restore Split Layout (Esc)"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      </div>
    );
  }

  if (fullscreenTarget === 'gemini') {
    return (
      <div className="relative w-full h-full flex flex-col">
        {geminiComponent}
        <button
          onClick={onExitFullscreen}
          title="Restore Split Layout (Esc)"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-[calc(100dvh-3rem)] overflow-hidden select-none">
      {/* ----------------- MOBILE VIEW (< 768px) ----------------- */}
      <div className="flex md:hidden flex-col w-full h-full">
        {/* Active Panel Content */}
        <div className="flex-1 w-full h-[calc(100dvh-3rem-3.5rem)] overflow-hidden">
          {mobileTab === 'document' && (
            <div className="w-full h-full flex flex-col">{pdfComponent}</div>
          )}
          {mobileTab === 'translate' && (
            <div className="w-full h-full flex flex-col">{translatorComponent}</div>
          )}
          {mobileTab === 'gemini' && (
            <div className="w-full h-full flex flex-col">{geminiComponent}</div>
          )}
        </div>

        {/* Bottom Tab Navigation Bar */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 px-3 py-1 select-none shadow-lg shadow-black/5"
        >
          <button
            onClick={() => setMobileTab('document')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'document'
                ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/80 dark:bg-blue-950/50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Document</span>
          </button>

          <button
            onClick={() => setMobileTab('translate')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'translate'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/80 dark:bg-indigo-950/50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Languages className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Translate</span>
          </button>

          <button
            onClick={() => setMobileTab('gemini')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'gemini'
                ? 'text-violet-600 dark:text-violet-400 font-semibold bg-violet-50/80 dark:bg-violet-950/50'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">AI Tutor</span>
          </button>
        </nav>
      </div>

      {/* ----------------- TABLET & DESKTOP VIEW (>= 768px) ----------------- */}
      <div
        ref={containerRef}
        className="hidden md:flex flex-row w-full h-full overflow-hidden"
      >
        {/* Left Side: PDF Viewer */}
        <div
          style={{ width: `${leftRatio}%` }}
          className="h-full overflow-hidden shrink-0 flex flex-col min-w-[280px]"
        >
          {pdfComponent}
        </div>

        {/* Horizontal Draggable Splitter */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels horizontally"
          tabIndex={0}
          onPointerDown={handlePointerDownH}
          onPointerMove={handlePointerMoveH}
          onPointerUp={handlePointerUpH}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setLeftRatio(Math.max(30, leftRatio - 2));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setLeftRatio(Math.min(80, leftRatio + 2));
            }
          }}
          className="w-2.5 h-full relative cursor-col-resize flex items-center justify-center bg-slate-200/80 dark:bg-slate-800/80 hover:bg-blue-500/30 active:bg-blue-500/50 transition-colors shrink-0 select-none touch-none focus:outline-none focus:ring-1 focus:ring-blue-500 z-10"
        >
          <GripVertical className="w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Right Side: Companion Panel (Stacked or Tabs) */}
        <div
          ref={rightPaneRef}
          style={{ width: `${100 - leftRatio}%` }}
          className="h-full flex flex-col min-w-[260px] overflow-hidden bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
        >
          {/* Header Switcher for Tablet / Compact screens */}
          <div className="h-9 px-2 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            {companionMode === 'tabs' ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCompanionTab('translate')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    companionTab === 'translate'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Translate</span>
                </button>
                <button
                  onClick={() => setCompanionTab('gemini')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    companionTab === 'gemini'
                      ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Tutor</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
                <span>Companion Workspace</span>
              </div>
            )}

            {/* Mode Toggle Button: Stacked vs Tabbed */}
            <button
              onClick={() =>
                setCompanionMode((prev) => (prev === 'stacked' ? 'tabs' : 'stacked'))
              }
              title={
                companionMode === 'stacked'
                  ? 'Switch to Tabbed View (gives full height to Translate or AI Tutor)'
                  : 'Switch to Stacked View (view Translate and AI Tutor simultaneously)'
              }
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {companionMode === 'stacked' ? (
                <>
                  <Columns2 className="w-3 h-3" />
                  <span className="hidden xl:inline">Tabs</span>
                </>
              ) : (
                <>
                  <Rows2 className="w-3 h-3" />
                  <span className="hidden xl:inline">Split</span>
                </>
              )}
            </button>
          </div>

          {/* Content Area */}
          {companionMode === 'tabs' ? (
            <div className="flex-1 w-full overflow-hidden flex flex-col">
              {companionTab === 'translate' ? translatorComponent : geminiComponent}
            </div>
          ) : (
            <div className="flex-1 w-full overflow-hidden flex flex-col">
              {/* Top: Google Translator */}
              <div
                style={{ height: `${rightTopRatio}%` }}
                className="w-full overflow-hidden shrink-0 flex flex-col"
              >
                {translatorComponent}
              </div>

              {/* Vertical Draggable Splitter */}
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize translator and gemini panels vertically"
                tabIndex={0}
                onPointerDown={handlePointerDownV}
                onPointerMove={handlePointerMoveV}
                onPointerUp={handlePointerUpV}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setRightTopRatio(Math.max(20, rightTopRatio - 3));
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setRightTopRatio(Math.min(80, rightTopRatio + 3));
                  }
                }}
                className="h-2.5 w-full relative cursor-row-resize flex items-center justify-center bg-slate-200/80 dark:bg-slate-800/80 hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors shrink-0 select-none touch-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <GripHorizontal className="w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Bottom: Gemini Chat */}
              <div
                style={{ height: `${100 - rightTopRatio}%` }}
                className="w-full overflow-hidden flex flex-col"
              >
                {geminiComponent}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
