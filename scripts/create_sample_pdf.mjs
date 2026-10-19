import fs from 'node:fs';

// A valid, standard PDF 1.4 document with multiple paragraphs and test text
const streamLines = [
  'BT',
  '/F1 22 Tf',
  '50 720 Td',
  '(Minimal PDF Reader & Study Companion) Tj',
  '/F1 13 Tf',
  '0 -40 Td',
  '(Welcome to your integrated PDF study environment!) Tj',
  '0 -24 Td',
  '(This sample document demonstrates the integrated split-screen capabilities:) Tj',
  '0 -20 Td',
  '(1. Left 70%: High-fidelity PDF viewer with text-selection and fullscreen support.) Tj',
  '0 -20 Td',
  '(2. Right 30% Top: Instant English-to-any-language Google Translator.) Tj',
  '0 -20 Td',
  '(3. Right 30% Bottom: Interactive Google Gemini AI tutor for deep comprehension.) Tj',
  '/F1 15 Tf',
  '0 -40 Td',
  '(Sample Passage for Testing Language Translation & AI:) Tj',
  '/F1 12 Tf',
  '0 -28 Td',
  '(Serendipity is the occurrence and development of events by chance in a happy) Tj',
  '0 -18 Td',
  '(or beneficial way. In scientific discovery, serendipitous events often trigger) Tj',
  '0 -18 Td',
  '(groundbreaking innovations that were never initially anticipated.) Tj',
  '0 -28 Td',
  '(Epistemology is the philosophical study of the nature, origin, and limits of) Tj',
  '0 -18 Td',
  '(human knowledge. It investigates what distinguishes justified belief from opinion.) Tj',
  '0 -28 Td',
  '(Quantum entanglement is a physical phenomenon that occurs when a group of particles) Tj',
  '0 -18 Td',
  '(interact in ways such that the quantum state of each particle of the pair cannot) Tj',
  '0 -18 Td',
  '(be described independently of the state of the others, regardless of distance.) Tj',
  '/F1 11 Tf',
  '0 -40 Td',
  '([Try this]: Highlight any sentence or word above. Click "Translate" or "Ask Gemini"!) Tj',
  'ET'
];

const streamContent = streamLines.join('\n');
const streamLength = Buffer.byteLength(streamContent, 'utf-8');

const body1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
const body2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
const body3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
const body4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
const body5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

const header = '%PDF-1.4\n';

const offset0 = 0;
const offset1 = Buffer.byteLength(header, 'utf-8');
const offset2 = offset1 + Buffer.byteLength(body1, 'utf-8');
const offset3 = offset2 + Buffer.byteLength(body2, 'utf-8');
const offset4 = offset3 + Buffer.byteLength(body3, 'utf-8');
const offset5 = offset4 + Buffer.byteLength(body4, 'utf-8');

const xrefOffset = offset5 + Buffer.byteLength(body5, 'utf-8');

function padOffset(num) {
  return num.toString().padStart(10, '0');
}

const xref = [
  'xref',
  '0 6',
  '0000000000 65535 f ',
  `${padOffset(offset1)} 00000 n `,
  `${padOffset(offset2)} 00000 n `,
  `${padOffset(offset3)} 00000 n `,
  `${padOffset(offset4)} 00000 n `,
  `${padOffset(offset5)} 00000 n `,
  'trailer',
  '<< /Size 6 /Root 1 0 R >>',
  'startxref',
  xrefOffset.toString(),
  '%%EOF'
].join('\n');

const fullPdf = header + body1 + body2 + body3 + body4 + body5 + xref;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/sample.pdf', fullPdf, 'binary');
console.log('Successfully generated public/sample.pdf, size:', fullPdf.length, 'bytes');
