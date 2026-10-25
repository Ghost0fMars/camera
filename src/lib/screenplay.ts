import { emptyCategories, type IE, type Scene } from '../types';

const SLUG_RE = /^(?:INT|EXT|I\/E)(?:\s*\.?\s*\/\s*(?:INT|EXT))?\s*\.?\s*(?:[–—:-]|\s)\s*\S/i;
const TRANSITION_RE = /^(FIN|ELLIPSE|NOIR|FONDU.*|COUPE.*|CUT TO:?|FADE (IN|OUT).*|G[ÉE]N[ÉE]RIQUE.*|SUPER.*|FLASH-?BACK.*|RETOUR.*)$/i;
const TIME_WORDS = 'JOUR|NUIT|SOIR|MATIN|AUBE|CR[ÉE]PUSCULE|APR[ÈE]S-MIDI|MIDI|CONTINU|PLUS TARD|LE LENDEMAIN';
const WORDS_PER_MIN = 140; // ponytail: règle simple (≈ 1 page/min) ; à affiner avec le montage

export function stripMd(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/\\([.\-–—*_#[\]()!>])/g, '$1')
    .replace(/\*{1,3}|_{2,3}/g, '')
    .replace(/^\d+[A-Z]?\s*[.)]\s+(?=(?:INT|EXT|I\/E))/i, '')
    .trim();
}

export const isSlug = (l: string) => l.length > 0 && l.length <= 160 && (SLUG_RE.test(l) || /^\.(?!\.)\S/.test(l));

export const isCue = (l: string) =>
  l.length >= 2 && l.length <= 45 && /[A-ZÀ-ÖØ-Þ]{2}/.test(l)
  && l === l.toUpperCase() && !/[.!?…:;]$/.test(l) && !TRANSITION_RE.test(l) && !isSlug(l);

const SMALL = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'un', 'une', 'à', 'au', 'aux', 'et', 'en', 'sur', 'sous', 'dans', 'devant', 'derrière', 'chez', 'avec', 'sans', 'pour', 'par']);
const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'’-])(\p{L}+)/gu, (m, sep: string, w: string, off: number) =>
    off > 0 && SMALL.has(w) ? m : sep + w[0].toUpperCase() + w.slice(1));

/** « RUE DEVANT LE BAR » → « Rue devant le bar » (les noms de personnages sont remis en majuscule par parseScript). */
const sentenceCase = (s: string) => {
  const l = s.toLowerCase().replace(/\s*:\s*/g, ' : ');
  return l.charAt(0).toUpperCase() + l.slice(1);
};

/** « INT. BUREAU DE JEAN - NUIT » → { ie: 'INT', decor: 'Bureau De Jean', effect: 'NUIT' }. */
export function parseSlug(slug: string): { ie: IE; decor: string; effect: string } {
  const s = slug.replace(/^\./, '').trim();
  const m = /^(INT|EXT|I\/E)(?:\s*\.?\s*\/\s*(INT|EXT))?/i.exec(s);
  const ie: IE = !m ? 'INT' : m[2] || /^I\/E$/i.test(m[1]) ? 'INT/EXT' : (m[1].toUpperCase() as IE);
  const body = s.slice(m ? m[0].length : 0).replace(/^\s*\.?\s*[–—:-]?\s*/, '');
  const parts = body.split(/\s*[–—]\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  let effect = '';
  if (parts.length > 1 && new RegExp(`^(${TIME_WORDS})`, 'i').test(parts[parts.length - 1])) effect = parts.pop()!.toUpperCase();
  return { ie, decor: sentenceCase(parts.join(' – ') || body), effect };
}

export interface ParsedScript { title: string; scenes: Scene[]; characters: string[] }

const countWords = (t: string) => (t.match(/\S+/g) || []).length;

/** Découpe un scénario (texte brut / Markdown / Fountain) en séquences, une par intitulé INT./EXT. */
export function parseScript(raw: string): ParsedScript {
  const lines = raw.replace(/\r/g, '').split('\n');
  const preamble: string[] = [];
  const blocks: { slug: string; lines: string[] }[] = [];
  for (const line of lines) {
    const c = stripMd(line);
    if (isSlug(c)) blocks.push({ slug: c, lines: [] });
    else (blocks.length ? blocks[blocks.length - 1].lines : preamble).push(line);
  }
  const rawTitle =
    preamble.map((l) => /^title\s*:\s*(.+)$/i.exec(l.trim())?.[1]).find(Boolean)
    ?? preamble.map((l) => /^#\s+(.+)$/.exec(l)?.[1]).find(Boolean)
    ?? preamble.map(stripMd).find((l) => l.length > 0 && l.length <= 80);
  const all = new Set<string>();
  const scenes: Scene[] = blocks.map((b, i) => {
    const { ie, decor, effect } = parseSlug(b.slug);
    const cues = new Set<string>();
    const action: string[] = [];
    let inDialogue = false;
    for (const l0 of b.lines) {
      const l = stripMd(l0);
      if (!l) { inDialogue = false; continue; }
      if (!inDialogue && isCue(l)) {
        inDialogue = true;
        const n = titleCase(l.replace(/\s*\(.*\)$/, ''));
        cues.add(n); all.add(n);
        continue;
      }
      if (!inDialogue) action.push(l);
    }
    const text = b.lines.join('\n').trim();
    const sec = Math.max(15, Math.round(((countWords(text) / WORDS_PER_MIN) * 60) / 5) * 5);
    return {
      id: `s${i + 1}`, number: i + 1, decor, ie, effect,
      summary: action.join(' ').slice(0, 480), text,
      durationSec: sec, shootMin: Math.max(30, Math.round(sec / 15) * 15),
      roles: [...cues], categories: emptyCategories(), continuity: '', notes: '', dayId: null,
    };
  });
  for (const sc of scenes) {
    for (const n of all) {
      sc.decor = sc.decor.replace(new RegExp(String.raw`(^|[^\p{L}])${n.toLowerCase()}(?![\p{L}])`, 'giu'), (_m, a: string) => a + n);
    }
  }
  return { title: rawTitle ? titleCase(stripMd(rawTitle)) : '', scenes, characters: [...all] };
}

/** Texte brut d'un .docx (un paragraphe Word = une ligne). */
export async function docxToText(buf: ArrayBuffer): Promise<string> {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  let o = 0;
  while (o + 30 < u8.length && dv.getUint32(o, true) === 0x04034b50) {
    const method = dv.getUint16(o + 8, true);
    const cs = dv.getUint32(o + 18, true);
    const nl = dv.getUint16(o + 26, true);
    const el = dv.getUint16(o + 28, true);
    const name = new TextDecoder().decode(u8.slice(o + 30, o + 30 + nl));
    const data = u8.slice(o + 30 + nl + el, o + 30 + nl + el + cs);
    if (name === 'word/document.xml') {
      const xml = method === 0
        ? new TextDecoder().decode(data)
        : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      const dec = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
      return xml.split(/<\/w:p>/)
        .map((p) => dec([...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>|<w:tab\/>/g)].map((m) => m[1] ?? '\t').join('')))
        .join('\n');
    }
    o += 30 + nl + el + cs;
  }
  throw new Error('Fichier .docx illisible');
}
