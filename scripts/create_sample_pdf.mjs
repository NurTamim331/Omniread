import fs from 'node:fs';

// A valid, standard PDF 1.4 document with multiple paragraphs and test text
const streamLines = [
  'BT',
  '/F1 22 Tf',
  '50 720 Td',
  '(Don Quixote - Miguel de Cervantes) Tj',
  '/F1 13 Tf',
  '0 -40 Td',
  '(The Ingenious Gentleman Don Quixote of La Mancha) Tj',
  '0 -24 Td',
  '(Welcome to your integrated PDF study environment!) Tj',
  '0 -20 Td',
  '(1. Responsive PDF Reader: Smooth continuous reading with text selection.) Tj',
  '0 -20 Td',
  '(2. Instant Google Translator: Effortlessly translate literary excerpts.) Tj',
  '0 -20 Td',
  '(3. Interactive AI Tutor: Clarify vocabulary, historical context, and themes.) Tj',
  '/F1 15 Tf',
  '0 -40 Td',
  '(Famous Opening Passage (English):) Tj',
  '/F1 12 Tf',
  '0 -26 Td',
  '(In a village of La Mancha, the name of which I have no desire to recall,) Tj',
  '0 -18 Td',
  '(there lived not long ago one of those gentlemen who keep a lance in the) Tj',
  '0 -18 Td',
  '(lance-rack, an old shield, a lean hack, and a greyhound for coursing.) Tj',
  '0 -26 Td',
  '(An olla of rather more beef than mutton, a salad on most nights, scraps) Tj',
  '0 -18 Td',
  '(on Saturdays, lentils on Fridays, and a pigeon or so extra on Sundays,) Tj',
  '0 -18 Td',
  '(made away with three-quarters of his income.) Tj',
  '/F1 15 Tf',
  '0 -36 Td',
  '(Original Passage (Spanish):) Tj',
  '/F1 12 Tf',
  '0 -26 Td',
  '(En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho) Tj',
  '0 -18 Td',
  '(tiempo que vivia un hidalgo de los de lanza en astillero, adarga antigua,) Tj',
  '0 -18 Td',
  '(rocin flaco y galgo corredor.) Tj',
  '/F1 11 Tf',
  '0 -40 Td',
  '([Try this]: Highlight any sentence or phrase above to Translate or Ask Gemini!) Tj',
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
