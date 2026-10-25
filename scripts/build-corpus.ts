// Découpe le texte d'Eisenstein en passages : npm run corpus -- "<chemin du .md>"
import { readFileSync, writeFileSync } from 'node:fs';
import { chunkText } from '../api/_eisenstein.js';

const src = process.argv[2] ?? 'C:/Users/elavallard/Documents/Sergueï Eisenstein - Leçons de mise en scène.md';
const chunks = chunkText(readFileSync(src, 'utf8'));
writeFileSync('data/eisenstein.json', JSON.stringify(chunks));
console.log(`${chunks.length} passages, ${chunks.reduce((n, c) => n + c.text.length, 0)} caractères`);
