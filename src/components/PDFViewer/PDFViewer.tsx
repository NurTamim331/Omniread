import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Upload,
  FileText,
  Languages,
  Sparkles,
  Copy,
  Check,
  Sun,
  Moon,
  BookOpen,
  RefreshCw,
  FileUp,
  Download,
  Trash2,
  LogOut,
  Undo,
} from 'lucide-react';
import type {
  ReaderTheme,
  PDFDocumentInfo,
  SelectionActionPosition,
  Annotation,
  AnnotationRect,
} from '../../types';
import { exportPdfWithAnnotations, downloadPdfBlob } from '../../services/pdfExporter';
import { ExitConfirmModal } from '../ExitConfirmModal';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFViewerProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSendToTranslate: (text: string) => void;
  onSendToGemini: (text: string) => void;
  onDocumentLoaded?: (name: string, fullText: string, rawBytes: ArrayBuffer) => void;
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
}

// Single Page Item component for Continuous Scroll
interface PageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  scale: number;
  rotation: number;
  annotations: Annotation[];
  onDeleteAnnotation: (id: string) => void;
  onRegisterRef: (pageNum: number, el: HTMLDivElement | null) => void;
}

const PageItem: React.FC<PageItemProps> = ({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  annotations,
  onDeleteAnnotation,
  onRegisterRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const textLayerDiv = textLayerRef.current;
        if (!canvas || !textLayerDiv) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.scale(outputScale, outputScale);

        const renderContext = {
          canvas,
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        ctx.restore();

        if (isCancelled) return;

        // Synchronize container dimensions and scale factor
        if (containerRef.current) {
          containerRef.current.style.width = `${Math.floor(viewport.width)}px`;
          containerRef.current.style.height = `${Math.floor(viewport.height)}px`;
          containerRef.current.style.setProperty('--scale-factor', `${viewport.scale}`);
          containerRef.current.style.setProperty('--total-scale-factor', `${viewport.scale}`);
          containerRef.current.style.setProperty('--user-unit', '1');
          containerRef.current.style.setProperty('--scale-round-x', '1px');
          containerRef.current.style.setProperty('--scale-round-y', '1px');
        }

        // Render Text Layer exactly matching viewport
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
        textLayerDiv.style.setProperty('--scale-factor', `${viewport.scale}`);
        textLayerDiv.style.setProperty('--total-scale-factor', `${viewport.scale}`);
        textLayerDiv.style.setProperty('--user-unit', '1');
        textLayerDiv.style.setProperty('--scale-round-x', '1px');
        textLayerDiv.style.setProperty('--scale-round-y', '1px');
        textLayerDiv.style.setProperty('--min-font-size', '1');

        const textContent = await page.getTextContent({
          includeMarkedContent: true,
          disableNormalization: true,
        });
        if (isCancelled) return;

        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
        });

        await textLayer.render();
        if (isCancelled) return;

        // Ensure textLayer stays accurately positioned & sized
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

        // Append endOfContent helper element to contain text selection
        const endOfContent = document.createElement('div');
        endOfContent.className = 'endOfContent';
        textLayerDiv.appendChild(endOfContent);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    };

    render();

    const handleMouseDown = () => {
      textLayerRef.current?.classList.add('selecting');
    };
    const tlEl = textLayerRef.current;
    if (tlEl) {
      tlEl.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      isCancelled = true;
      if (tlEl) {
        tlEl.removeEventListener('mousedown', handleMouseDown);
      }
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNum);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        onRegisterRef(pageNum, el);
      }}
      data-page-number={pageNum}
      className="page relative mb-8 shadow-2xl rounded-sm bg-white shrink-0 mx-auto"
    >
      <canvas ref={canvasRef} className="block rounded-sm pointer-events-none" />

      {/* 1. Annotations Color Layer - z-1 (under textLayer so text is sharp and unblocked) */}
      <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
        {pageAnnotations.map((ann) => (
          <React.Fragment key={ann.id}>
            {ann.rects.map((rect, rIdx) => (
              <div
                key={`${ann.id}-${rIdx}`}
                style={{
                  position: 'absolute',
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.width * 100}%`,
                  height: `${rect.height * 100}%`,
                  backgroundColor:
                    ann.type === 'highlight' ? `${ann.color}55` : 'transparent',
                  borderBottom:
                    ann.type === 'underline'
                      ? `2.5px solid ${ann.color}`
                      : 'none',
                }}
                className="pointer-events-none rounded-xs"
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* 2. Native PDF Text Layer - z-2 for accurate text selection */}
      <div ref={textLayerRef} className="textLayer" />

      {/* 3. Annotation Delete Controls Layer - z-20 (ABOVE textLayer so clicks are received directly) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {pageAnnotations.map((ann) => {
          const lastRect = ann.rects[ann.rects.length - 1] || ann.rects[0];
          if (!lastRect) return null;

          const leftPercent = Math.min(98.5, Math.max(1.5, (lastRect.x + lastRect.width) * 100));
          const topPercent = Math.min(99, Math.max(1, lastRect.y * 100));

          return (
            <div
              key={`del-${ann.id}`}
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-35%, -65%)',
              }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDeleteAnnotation(ann.id);
                }}
                title="Delete this highlight"
                className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900/90 hover:bg-rose-600 text-white shadow-md border border-white/70 transition-all hover:scale-115 active:scale-95 cursor-pointer opacity-85 hover:opacity-100"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Page number watermark on footer */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-400 select-none">
        Page {pageNum}
      </div>
    </div>
  );
};

export const PDFViewer: React.FC<PDFViewerProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onSendToTranslate,
  onSendToGemini,
  onDocumentLoaded,
  theme,
  setTheme,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [docInfo, setDocInfo] = useState<PDFDocumentInfo | null>(null);
  const [rawPdfBytes, setRawPdfBytes] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Annotations & Highlighting State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectionAction, setSelectionAction] =
    useState<SelectionActionPosition | null>(null);
  const [copiedSelection, setCopiedSelection] = useState<boolean>(false);

  // Exit Confirmation Modal State
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Warn on tab close / reload if annotations exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (annotations.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
  }, [annotations.length]);

  // Global pointerup and selectionchange listeners to clean up .selecting state on textLayer
  useEffect(() => {
    const handlePointerUp = () => {
      document.querySelectorAll('.textLayer.selecting').forEach((el) => {
        el.classList.remove('selecting');
      });
    };

    const handleSelectionChange = () => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        document.querySelectorAll('.textLayer.selecting').forEach((el) => {
          el.classList.remove('selecting');
        });
        return;
      }
      try {
        const range = sel.getRangeAt(0);
        document.querySelectorAll('.textLayer').forEach((tl) => {
          if (range.intersectsNode(tl)) {
            tl.classList.add('selecting');
          } else {
            tl.classList.remove('selecting');
          }
        });
      } catch {
        // ignore
      }
    };

    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const onDocumentLoadedRef = useRef(onDocumentLoaded);
  useEffect(() => {
    onDocumentLoadedRef.current = onDocumentLoaded;
  });

  const hasLoadedInitialDoc = useRef(false);

  // Load PDF from ArrayBuffer or URL
  const loadPdf = useCallback(
    async (source: string | ArrayBuffer, fileName = 'Document.pdf') => {
      setIsLoading(true);
      setLoadingError(null);
      setSelectionAction(null);

      try {
        let buffer: ArrayBuffer;
        if (typeof source === 'string') {
          const res = await fetch(source);
          buffer = await res.arrayBuffer();
        } else {
          buffer = source;
        }

        setRawPdfBytes(buffer);

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          standardFontDataUrl: '/standard_fonts/',
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const loadedDoc = await loadingTask.promise;
        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setCurrentPage(1);
        setDocInfo({
          name: fileName,
          numPages: loadedDoc.numPages,
        });

        // Extract full text from all pages for Gemini AI
        const extractedPages: Array<{ page: number; text: string }> = [];
        for (let i = 1; i <= loadedDoc.numPages; i++) {
          try {
            const page = await loadedDoc.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str || '')
              .join(' ');
            extractedPages.push({ page: i, text: pageText });
          } catch (e) {
            console.warn(`Could not extract text from page ${i}`, e);
          }
        }

        const fullDocumentText = extractedPages
          .map((p) => `[Page ${p.page}]:\n${p.text}`)
          .join('\n\n');

        onDocumentLoadedRef.current?.(fileName, fullDocumentText, buffer);
      } catch (err: unknown) {
        console.error('Failed to load PDF:', err);
        setLoadingError(
          err instanceof Error
            ? err.message
            : 'Failed to load PDF document. Please verify the file.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load: Load sample PDF ONCE on mount
  useEffect(() => {
    if (!hasLoadedInitialDoc.current) {
      hasLoadedInitialDoc.current = true;
      loadPdf('/sample.pdf', 'Sample Document.pdf');
    }
  }, [loadPdf]);

  // Track currently visible page during continuous scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      setSelectionAction(null);
      const containerRect = container.getBoundingClientRect();
      const midY = containerRect.top + containerRect.height / 3;

      for (let i = 1; i <= numPages; i++) {
        const el = pageRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= midY && rect.bottom >= midY) {
            setCurrentPage(i);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  // Jump to specific page
  const scrollToPage = (pageNum: number) => {
    const el = pageRefs.current[pageNum];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  // Handle Text Selection in Continuous Scroll view
  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionAction(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) {
        setSelectionAction(null);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rects = Array.from(range.getClientRects());
        if (rects.length === 0) return;

        // Find which page container contains this selection
        let anchorNode: Node | null = range.startContainer;
        while (anchorNode && !(anchorNode as HTMLElement).dataset?.pageNumber) {
          anchorNode = anchorNode.parentNode;
        }

        const pageEl = anchorNode as HTMLElement | null;
        if (!pageEl) return;

        const pageNum = parseInt(pageEl.dataset.pageNumber || '1', 10);
        const pageRect = pageEl.getBoundingClientRect();

        // Calculate normalized rects [0..1] relative to the page
        const normalizedRects: AnnotationRect[] = rects
          .map((r) => ({
            x: (r.left - pageRect.left) / pageRect.width,
            y: (r.top - pageRect.top) / pageRect.height,
            width: r.width / pageRect.width,
            height: r.height / pageRect.height,
          }))
          .filter((r) => r.width > 0 && r.height > 0);

        const primaryRect = rects[0];
        setSelectionAction({
          x: Math.max(16, primaryRect.left + primaryRect.width / 2),
          y: Math.max(16, primaryRect.top - 12),
          text,
          pageNumber: pageNum,
          rects: normalizedRects,
        });
      } catch (e) {
        console.warn('Error reading selection range', e);
      }
    }, 50);
  };

  // Add Annotation (Highlight / Underline)
  const handleAddAnnotation = (
    type: 'highlight' | 'underline',
    color = '#fde047'
  ) => {
    if (!selectionAction) return;

    const newAnnotation: Annotation = {
      id: 'ann_' + Date.now() + Math.random().toString(36).substring(2, 6),
      pageNumber: selectionAction.pageNumber,
      type,
      color,
      rects: selectionAction.rects,
      text: selectionAction.text,
      createdAt: Date.now(),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setSelectionAction(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  // Export & Download PDF with Highlights
  const handleDownloadHighlightedPdf = async () => {
    if (!rawPdfBytes) return;
    try {
      const blob = await exportPdfWithAnnotations(
        rawPdfBytes,
        annotations
      );
      downloadPdfBlob(blob, docInfo?.name || 'document.pdf');
    } catch (err) {
      console.error('Failed to export PDF with highlights:', err);
      alert('Could not export highlighted PDF. Please try again.');
    }
  };

  // Handle Exit / Close button click
  const handleExitClick = () => {
    if (annotations.length > 0) {
      setIsExitModalOpen(true);
    } else {
      window.location.reload();
    }
  };

  const handleConfirmDownloadAndExit = async () => {
    await handleDownloadHighlightedPdf();
    setIsExitModalOpen(false);
    window.location.reload();
  };

  const handleConfirmExitWithoutSaving = () => {
    setIsExitModalOpen(false);
    window.location.reload();
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setAnnotations([]);
          loadPdf(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
    }
  };

  // Handle drag and drop files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setAnnotations([]);
          loadPdf(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleCopySelection = () => {
    if (!selectionAction?.text) return;
    navigator.clipboard.writeText(selectionAction.text);
    setCopiedSelection(true);
    setTimeout(() => {
      setCopiedSelection(false);
      setSelectionAction(null);
    }, 1500);
  };

  // Theme styling for container
  const themeContainerClass =
    theme === 'dark'
      ? 'bg-slate-950 text-slate-100 pdf-dark-mode'
      : theme === 'sepia'
      ? 'bg-[#f8f1e5] text-[#433422] pdf-sepia-mode'
      : 'bg-slate-100/80 text-slate-900';

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div
      className={`relative flex flex-col h-full bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 shadow-xs">
        {/* Left: Document name & upload button */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium max-w-[200px]">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate" title={docInfo?.name || 'Document'}>
              {docInfo?.name || 'No document loaded'}
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload local PDF file"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={() => {
              setAnnotations([]);
              loadPdf('/sample.pdf', 'Sample Document.pdf');
            }}
            title="Reload built-in sample document"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden md:inline">Sample</span>
          </button>
        </div>

        {/* Center: Continuous Scroll Page Indicator & Navigation */}
        {numPages > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
            <button
              onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-medium px-1.5 flex items-center gap-1">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= numPages) scrollToPage(val);
                }}
                className="w-10 text-center font-bold bg-transparent rounded border border-slate-300 dark:border-slate-600 focus:outline-none"
              />
              <span className="text-slate-400">/ {numPages}</span>
            </span>

            <button
              onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              aria-label="Next page"
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Annotations, Download, Theme, Fullscreen, Exit */}
        <div className="flex items-center gap-1.5">
          {/* Annotation counter & clear actions */}
          {annotations.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <span>{annotations.length} marked</span>
              <button
                onClick={() => setAnnotations((prev) => prev.slice(0, -1))}
                title="Undo last highlight"
                className="p-0.5 hover:text-amber-950 dark:hover:text-amber-100 rounded cursor-pointer"
              >
                <Undo className="w-3 h-3" />
              </button>
              <button
                onClick={() => setAnnotations([])}
                title="Clear all highlights"
                className="p-0.5 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Download with Highlights button */}
          <button
            onClick={handleDownloadHighlightedPdf}
            title={`Download PDF with ${annotations.length} highlights`}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Download {annotations.length > 0 ? `(${annotations.length})` : ''}
            </span>
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            title="Zoom Out"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-500 w-11 text-center select-none">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            title="Zoom In"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Rotate */}
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Rotate 90 degrees"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <button
            onClick={() =>
              setTheme(
                theme === 'light'
                  ? 'dark'
                  : theme === 'dark'
                  ? 'sepia'
                  : 'light'
              )
            }
            title={`Reading Theme: ${theme.toUpperCase()}`}
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

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            aria-label={
              isFullscreen ? 'Exit full screen' : 'Full screen PDF viewer'
            }
            title={
              isFullscreen
                ? 'Exit Fullscreen (Esc)'
                : 'Convert PDF Viewer to Fullscreen'
            }
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Exit / Close Document button */}
          <button
            onClick={handleExitClick}
            title="Close document / Exit"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main PDF Scrollable Stage (Continuous Vertical Scroll) */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={`flex-1 overflow-y-auto overflow-x-auto p-6 ${themeContainerClass} relative scroll-smooth`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-2" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Loading document pages...
            </span>
          </div>
        )}

        {loadingError && (
          <div className="max-w-md p-6 my-auto mx-auto text-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-rose-200 dark:border-rose-900">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Could not open PDF
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">
              {loadingError}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              Choose another PDF
            </button>
          </div>
        )}

        {/* Drag & drop overlay indicator */}
        {isDragOver && (
          <div className="absolute inset-4 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50/90 dark:bg-blue-950/90 backdrop-blur-xs text-blue-600 dark:text-blue-400">
            <FileUp className="w-12 h-12 mb-2 animate-bounce" />
            <p className="text-base font-semibold">Drop PDF here to open</p>
          </div>
        )}

        {/* Continuous Column of PDF Pages */}
        {pdfDoc && (
          <div className="pdfViewer flex flex-col items-center min-w-max pb-12">
            {pageNumbers.map((pNum) => (
              <PageItem
                key={pNum}
                pdfDoc={pdfDoc}
                pageNum={pNum}
                scale={scale}
                rotation={rotation}
                annotations={annotations}
                onDeleteAnnotation={handleDeleteAnnotation}
                onRegisterRef={(num, el) => {
                  pageRefs.current[num] = el;
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Selection Action Pill with Highlights & Underline */}
      {selectionAction && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionAction.x}px`,
            top: `${selectionAction.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Highlight Color Pickers */}
          <div className="flex items-center gap-1 pr-1 border-r border-slate-700">
            <button
              onClick={() => handleAddAnnotation('highlight', '#fde047')}
              title="Yellow Highlight"
              className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-125 transition-transform border border-yellow-400 cursor-pointer"
            />
            <button
              onClick={() => handleAddAnnotation('highlight', '#86efac')}
              title="Green Highlight"
              className="w-4 h-4 rounded-full bg-emerald-400 hover:scale-125 transition-transform border border-emerald-500 cursor-pointer"
            />
            <button
              onClick={() => handleAddAnnotation('highlight', '#93c5fd')}
              title="Blue Highlight"
              className="w-4 h-4 rounded-full bg-blue-400 hover:scale-125 transition-transform border border-blue-500 cursor-pointer"
            />
            <button
              onClick={() => handleAddAnnotation('highlight', '#f472b6')}
              title="Pink Highlight"
              className="w-4 h-4 rounded-full bg-pink-400 hover:scale-125 transition-transform border border-pink-500 cursor-pointer"
            />
          </div>

          {/* Underline Button */}
          <button
            onClick={() => handleAddAnnotation('underline', '#ef4444')}
            title="Red Underline"
            className="flex items-center gap-1 px-1.5 py-1 text-xs font-semibold hover:bg-slate-800 rounded-lg text-rose-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="underline decoration-2 decoration-rose-500 font-bold">
              U
            </span>
          </button>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          {/* Translate Button */}
          <button
            onClick={() => {
              onSendToTranslate(selectionAction.text);
              setSelectionAction(null);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-blue-600 rounded-lg transition-colors text-blue-200 hover:text-white cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span>Translate</span>
          </button>

          {/* Ask Gemini Button */}
          <button
            onClick={() => {
              onSendToGemini(selectionAction.text);
              setSelectionAction(null);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-indigo-600 rounded-lg transition-colors text-indigo-200 hover:text-white cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask Gemini</span>
          </button>

          <div className="w-[1px] h-3.5 bg-slate-700" />

          {/* Copy Button */}
          <button
            onClick={handleCopySelection}
            title="Copy text"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {copiedSelection ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Exit & Save Confirmation Modal */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmDownloadAndExit={handleConfirmDownloadAndExit}
        onConfirmExitWithoutSaving={handleConfirmExitWithoutSaving}
        highlightCount={annotations.length}
        fileName={docInfo?.name || 'Document.pdf'}
      />
    </div>
  );
};
