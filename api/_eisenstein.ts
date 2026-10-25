import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Passage { chapter: string; text: string }

const MAX = 1100;
const FRONT = /^(préface|postface)$/i;

/** Texte du livre → passages d'environ 1 000 caractères, par chapitre (préface et postface exclues). */
export function chunkText(md: string): Passage[] {
  const out: Passage[] = [];
  let chapter = '';
  let buf = '';
  const flush = () => { if (buf.trim() && chapter && !FRONT.test(chapter)) out.push({ chapter, text: buf.trim() }); buf = ''; };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const h = /^#\s+(.+)$/.exec(line);
    if (h) { flush(); chapter = h[1].trim(); continue; }
    if (!line) continue;
    for (const piece of line.match(/[^.!?…»]+[.!?…»]+\s*|[^.!?…»]+$/g) ?? [line]) {
      if (buf.length + piece.length > MAX) flush();
      buf += piece;
    }
    buf += '\n';
    if (buf.length > MAX * 0.7) flush();
  }
  flush();
  return out;
}

const STOP = new Set('le la les un une des de du d l et en au aux à a ou où que qui quoi dont ce ces cet cette il elle ils elles on nous vous je tu se sa son ses leur leurs mais donc or ni car ne pas plus par pour sur sous dans avec sans comme est sont été être était fait faire très tout tous toute toutes y lui eux me te si s c n j m t qu entre aussi même'.split(' '));
const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Les k passages les plus proches d'une requête (BM25 simple, sans dépendance). */
export function search(corpus: Passage[], query: string, k = 4): Passage[] {
  const docs = corpus.map((p) => words(p.text));
  const n = docs.length;
  const avg = docs.reduce((a, d) => a + d.length, 0) / (n || 1);
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  const q = [...new Set(words(query))].filter((w) => df.has(w));
  return docs
    .map((d, i) => {
      const tf = new Map<string, number>();
      for (const w of d) tf.set(w, (tf.get(w) ?? 0) + 1);
      let s = 0;
      for (const w of q) {
        const f = tf.get(w) ?? 0;
        if (!f) continue;
        s += Math.log(1 + (n - df.get(w)! + 0.5) / (df.get(w)! + 0.5)) * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.length / avg))));
      }
      return { i, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => corpus[x.i]);
}

let cache: Passage[] | null = null;
/** Corpus chargé depuis data/eisenstein.json (vide si le fichier est absent : l'IA répond alors sans le socle). */
export function loadCorpus(): Passage[] {
  if (cache) return cache;
  const file = join(process.cwd(), 'data', 'eisenstein.json');
  cache = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Passage[]) : [];
  return cache;
}

/** « LA COMPOSITION DANS LE PLAN » → « La composition dans le plan ». */
export const chapterTitle = (c: string) => { const l = c.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); };

/** Bloc de contexte à glisser dans le prompt système. */
export function context(query: string, k = 4): string {
  const found = search(loadCorpus(), query, k);
  if (!found.length) return '';
  return `\n\nSOCLE THÉORIQUE — extraits de « Leçons de mise en scène » (S. M. Eisenstein, FEMIS 1989). Appuie-toi sur ces idées et reformule-les avec tes mots (citation éventuelle : 15 mots maximum entre guillemets). Quand tu t'en sers, cite-les ainsi : (Eisenstein, « titre exact du chapitre »), en recopiant le titre indiqué avant l'extrait. Le livre n'a pas de chapitres numérotés pour toi : n'écris jamais « chapitre 1 », « chapitre 2 » ni un numéro d'extrait.\n`
    + found.map((p) => `CHAPITRE : « ${chapterTitle(p.chapter)} »\n${p.text}`).join('\n\n');
}
