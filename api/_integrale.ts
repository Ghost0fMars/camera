import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chunkText, search, type Passage } from './_eisenstein.js';

const entities: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", eacute: 'é', egrave: 'è', agrave: 'à', ecirc: 'ê', ocirc: 'ô', ccedil: 'ç', rsquo: '’', laquo: '«', raquo: '»', hellip: '…' };

/** Page HTML de l'article « L'intégrale dramatique » → passages par section (hors références). */
export function integraleChunks(html: string): Passage[] {
  const body = /<article class="article-card">([\s\S]*?)<\/article>/.exec(html)?.[1] ?? html;
  const md = body
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g, '\n# $1\n')
    .replace(/<\/(p|li|blockquote|tr|div)>|<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|\w+);/g, (m, e: string) => (e[0] === '#' ? String.fromCharCode(Number(e.slice(1))) : entities[e] ?? m))
    .replace(/[ \t]+/g, ' ');
  return chunkText(md).filter((p) => !/^références$/i.test(p.chapter));
}

/** Les idées de la théorie à garder en tête pour penser le découpage (toujours injectées dans le prompt). */
export const FRAMEWORK = `

CADRE THÉORIQUE — L'INTÉGRALE DRAMATIQUE (théorie du réalisateur, à utiliser pour penser le découpage) :
- Équation : S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt, avec C = Ci × Ce. S(t) est la puissance narrative accumulée. V(t) est le registre des actions : chaque beat est une unité de l'intégrale. P(t|τ) est le poids rétroactif (après-coup, reconnaissance) : une révélation recalcule le sens des actes passés. Ci est le contexte interne du personnage (faille, arc), Ce le contexte externe (monde, pression antagoniste, contraintes).
- Contingence (tuché) : l'événement qui n'aurait pas dû avoir lieu et qui restructure rétroactivement l'intégrale.
- Régimes : tragédie (accumulation sans résolution), comédie (accumulation puis retour à l'équilibre), romance (amplitude maximale puis réconciliation qui relit tout).
- Le manque comme moteur : hors-champ, ellipse, retardement. L'absence organisée crée la présence désirante ; le spectateur « effectue la mesure », S(t) se complète dans sa psyché.
Lecture proposée pour le découpage (à interpréter, pas à appliquer mécaniquement) : un plan est une unité de V(t) et doit déplacer une valeur ou charger la tension ; Ci se travaille surtout par la proximité (gros plans, regards, silences), Ce par l'espace (plans larges, décor, obstacles, distances entre comédiens) ; découper, c'est décider ce qui s'accumule (retenir, retarder) et ce qui se montre ; le hors-champ et l'ellipse maintiennent le doute ; des objets ou indices montrés tôt verront leur sens recalculé plus tard (P) ; la tuché se met en scène par une rupture de cadre, de rythme ou d'axe.`;

let cache: Passage[] | null = null;
function load(): Passage[] {
  if (cache) return cache;
  const file = join(process.cwd(), 'data', 'integrale.json');
  cache = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Passage[]) : [];
  return cache;
}

/** Cadre de la théorie + les passages de l'article les plus proches de la requête. */
export function integraleContext(query: string, k = 2): string {
  const found = search(load(), query, k);
  return FRAMEWORK + (found.length
    ? '\n\nEXTRAITS DE L\'ARTICLE « L\'intégrale dramatique » (même auteur), section par section :\n' + found.map((p) => `SECTION : « ${p.chapter} »\n${p.text}`).join('\n\n')
    : '');
}

/** Phrase de situation de la séquence dans le film (pour penser l'accumulation et l'après-coup). */
export function positionContext(p: unknown): string {
  const o = (p ?? {}) as { index?: number; total?: number; previous?: string; next?: string };
  if (!o.index || !o.total) return '';
  return `\nPosition : séquence ${o.index} sur ${o.total}.${o.previous ? ` Séquence précédente : ${o.previous}` : ' C\'est la première séquence.'}${o.next ? ` Séquence suivante : ${o.next}` : ' C\'est la dernière séquence.'}`;
}
