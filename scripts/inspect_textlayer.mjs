import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const code = pdfjsLib.TextLayer.toString();
const idx = code.indexOf('this.#pageWidth');
console.log('--- pageWidth snippet ---');
console.log(code.slice(idx - 100, idx + 600));
