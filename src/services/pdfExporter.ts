import { PDFDocument, rgb } from 'pdf-lib';
import type { Annotation } from '../types';

/**
 * Converts a hex color string like '#fde047' into normalized RGB {r, g, b} in 0..1 range.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return { r, g, b };
}

/**
 * Exports a PDF with all user highlights and underlines drawn natively.
 */
export async function exportPdfWithAnnotations(
  originalPdfBytes: ArrayBuffer,
  annotations: Annotation[]
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  for (const ann of annotations) {
    if (ann.pageNumber < 1 || ann.pageNumber > pages.length) continue;
    const page = pages[ann.pageNumber - 1];
    const { width, height } = page.getSize();
    const { r, g, b } = hexToRgb(ann.color);

    for (const rect of ann.rects) {
      const pdfX = rect.x * width;
      // In PDF coordinates, origin (0,0) is bottom-left
      const pdfY = height - (rect.y + rect.height) * height;
      const pdfW = rect.width * width;
      const pdfH = rect.height * height;

      if (ann.type === 'highlight') {
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: rgb(r, g, b),
          opacity: 0.38,
        });
      } else if (ann.type === 'underline') {
        page.drawLine({
          start: { x: pdfX, y: pdfY },
          end: { x: pdfX + pdfW, y: pdfY },
          thickness: 2,
          color: rgb(r, g, b),
          opacity: 0.9,
        });
      }
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  const blob = new Blob([modifiedPdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });

  return blob;
}

/**
 * Triggers a browser file download for the highlighted PDF.
 */
export function downloadPdfBlob(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  a.download = `${baseName}_highlighted.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
