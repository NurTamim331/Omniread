import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, GripHorizontal, Minimize2 } from 'lucide-react';
import type { FullscreenTarget } from '../../types';

interface SplitPaneLayoutProps {
  pdfComponent: React.ReactNode;
  translatorComponent: React.ReactNode;
  geminiComponent: React.ReactNode;
  fullscreenTarget: FullscreenTarget;
  onExitFullscreen: () => void;
  leftRatio: number;
  setLeftRatio: (ratio: number) => void;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  pdfComponent,
  translatorComponent,
  geminiComponent,
  fullscreenTarget,
  onExitFullscreen,
  leftRatio,
  setLeftRatio,
}) => {
  const [rightTopRatio, setRightTopRatio] = useState<number>(45); // 45% translator, 55% gemini

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isDraggingHRef = useRef(false);
  const isDraggingVRef = useRef(false);

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
    // Clamp between 30% and 85%
    const clamped = Math.min(85, Math.max(30, newPercent));
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

  // Normal Split View (Default 70:30 width ratio)
  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col md:flex-row w-full h-[calc(100vh-3rem)] overflow-hidden select-none"
    >
      {/* Portion 1: Left 70% (PDF Viewer) */}
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
            setLeftRatio(Math.min(85, leftRatio + 2));
          }
        }}
        className="w-2.5 h-full relative cursor-col-resize flex items-center justify-center bg-slate-200/80 dark:bg-slate-800/80 hover:bg-blue-500/30 active:bg-blue-500/50 transition-colors shrink-0 select-none touch-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <GripVertical className="w-3 h-3 text-slate-400 pointer-events-none" />
      </div>

      {/* Portion 2: Right 30% (Translator & Gemini stacked vertically) */}
      <div
        ref={rightPaneRef}
        style={{ width: `${100 - leftRatio}%` }}
        className="h-full flex flex-col min-w-[240px] overflow-hidden"
      >
        {/* Top: Google Translator part */}
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

        {/* Bottom: Gemini Chat part */}
        <div
          style={{ height: `${100 - rightTopRatio}%` }}
          className="w-full overflow-hidden flex flex-col"
        >
          {geminiComponent}
        </div>
      </div>
    </div>
  );
};
