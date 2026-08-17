import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const source=path.join(root,'node_modules','pdfjs-dist','build');
const target=path.join(root,'public','vendor','pdfjs');
await mkdir(target,{recursive:true});
await copyFile(path.join(source,'pdf.min.mjs'),path.join(target,'pdf.min.mjs'));
await copyFile(path.join(source,'pdf.worker.min.mjs'),path.join(target,'pdf.worker.min.mjs'));
console.log('Vendored PDF.js browser files into public/vendor/pdfjs');
