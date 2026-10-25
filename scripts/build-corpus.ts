// Prépare les passages du socle théorique : npm run corpus -- ["<Eisenstein .md>" ["<article .html>"]]
import { readFileSync, writeFileSync } from 'node:fs';
import { chunkText } from '../api/_eisenstein.js';
import { integraleChunks } from '../api/_integrale.js';

const eis = process.argv[2] ?? 'C:/Users/elavallard/Documents/Sergueï Eisenstein - Leçons de mise en scène.md';
const art = process.argv[3] ?? 'C:/Users/elavallard/Documents/alacle/pages/articles/theorie/integrale-dramatique.html';
for (const [out, chunks] of [['data/eisenstein.json', chunkText(readFileSync(eis, 'utf8'))], ['data/integrale.json', integraleChunks(readFileSync(art, 'utf8'))]] as const) {
  writeFileSync(out, JSON.stringify(chunks));
  console.log(`${out} : ${chunks.length} passages, ${chunks.reduce((n, c) => n + c.text.length, 0)} caractères`);
}
