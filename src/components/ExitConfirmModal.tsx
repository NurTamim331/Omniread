import React from 'react';
import { Download, AlertTriangle, X, FileCheck } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownloadAndExit: () => void;
  onConfirmExitWithoutSaving: () => void;
  highlightCount: number;
  fileName: string;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownloadAndExit,
  onConfirmExitWithoutSaving,
  highlightCount,
  fileName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="exit-modal-title" className="text-base font-bold tracking-tight">
                Save Your Highlights?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have unsaved annotations on this document
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span className="truncate max-w-[280px]">{fileName}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You created <strong>{highlightCount} annotation{highlightCount === 1 ? '' : 's'}</strong> (highlights/underlines). Would you like to download a copy of the PDF with all your highlights permanently embedded?
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onConfirmDownloadAndExit}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Highlighted PDF & Exit</span>
            </button>

            <button
              type="button"
              onClick={onConfirmExitWithoutSaving}
              className="w-full py-2.5 px-4 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
            >
              Exit Without Downloading
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel & Keep Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
