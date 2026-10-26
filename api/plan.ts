import type { Request, Response } from 'express';
import { H, W, angleOf } from '../src/lib/plan.js';
import type { Pt, Shape } from '../src/types.js';
import { AlbertError, chatCompletion } from './_albert.js';
import { context } from './_eisenstein.js';
import { extractJson } from './analyse.js';

/** Le modèle raisonne mal sur des coordonnées fines : il dessine sur une grille de 20 × 12 cases (≈ 1 m), convertie ensuite en 1000 × 640. */
const GX = 20;
const GY = 12;

const SYSTEM = `Tu es assistant réalisateur. À partir du texte d'UNE séquence, tu esquisses le plan de scène en vue du dessus : la pièce ou le lieu, les meubles, la place des personnages au début, leurs déplacements et les caméras.
Repère : grille de ${GX} colonnes (x de 0 à ${GX}) sur ${GY} lignes (y de 0 à ${GY}), origine en haut à gauche, 1 case ≈ 1 mètre. Laisse une marge d'une case autour du lieu.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"walls": [{"a": [x, y], "b": [x, y]}], "furniture": [{"label": "table", "a": [x, y], "b": [x, y]}], "characters": [{"name": "VINCENT", "at": [x, y]}], "moves": [{"who": "VINCENT", "path": [[x, y], [x, y]]}], "cameras": [{"at": [x, y], "look": [x, y]}]}
Règles : walls = segments (une pièce rectangulaire = 4 murs ; laisse un vide pour une porte) ; furniture = rectangles (a et b sont deux coins opposés), label court ; characters = les personnages de la liste qui apparaissent dans la séquence, une seule fois chacun ; moves = trajets de 2 à 6 points d'un personnage, seulement ceux que le texte raconte ; cameras = de 1 à 3 caméras, at = position, look = point visé, placées pour servir la mise en scène (évite de les mettre au milieu des personnages). N'invente pas d'éléments sans rapport avec le texte ; si le lieu n'est pas décrit, reste simple. Garde les formes à l'intérieur de la grille, sans chevauchement de meubles.`;

type Bare = Shape extends infer S ? (S extends Shape ? Omit<S, 'id'> : never) : never;

/** Nettoie la réponse du modèle : points dans la grille, quantités plafonnées, déplacements rattachés à un personnage posé. Les caméras n'ont pas de nom (le client les numérote). */
export function cleanPlan(raw: Record<string, unknown>): Bare[] {
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []) as Record<string, unknown>[];
  const pt = (v: unknown): Pt | null => {
    if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
    const c = (n: number, max: number) => Math.min(max, Math.max(0, n));
    return { x: Math.round((c(v[0], GX) * W) / GX), y: Math.round((c(v[1], GY) * H) / GY) };
  };
  const far = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y) > 20;
  const out: Bare[] = [];

  for (const w of list(raw.walls, 16)) {
    const a = pt(w?.a), b = pt(w?.b);
    if (a && b && far(a, b)) out.push({ kind: 'line', a, b });
  }
  for (const f of list(raw.furniture, 16)) {
    const a = pt(f?.a), b = pt(f?.b);
    if (!a || !b || !far(a, b)) continue;
    out.push({ kind: 'rect', a, b });
    const label = typeof f.label === 'string' ? f.label.trim().slice(0, 16) : '';
    if (label) out.push({ kind: 'text', at: { x: Math.min(a.x, b.x) + 6, y: Math.min(a.y, b.y) + 24 }, text: label });
  }
  const chars = new Map<string, Pt>();
  for (const c of list(raw.characters, 12)) {
    const at = pt(c?.at);
    const name = typeof c?.name === 'string' ? c.name.trim().slice(0, 20) : '';
    if (at && name && !chars.has(name)) chars.set(name, at);
  }
  for (const m of list(raw.moves, 12)) {
    const pts = (Array.isArray(m?.path) ? m.path.slice(0, 8) : []).map(pt).filter((p): p is Pt => !!p);
    const who = typeof m?.who === 'string' && chars.has(m.who.trim()) ? m.who.trim() : '';
    const start = who ? chars.get(who)! : undefined;
    if (start && pts.length && far(start, pts[0])) pts.unshift(start);
    if (pts.length >= 2 && far(pts[0], pts[pts.length - 1])) out.push({ kind: 'move', pts, ...(who && { who }) });
  }
  for (const [name, at] of chars) out.push({ kind: 'char', at, name });
  for (const c of list(raw.cameras, 3)) {
    const at = pt(c?.at), look = pt(c?.look);
    if (at) out.push({ kind: 'camera', at, angle: look && far(at, look) ? angleOf(at, look) : 0, label: '' });
  }
  return out;
}

export default async function planHandler(req: Request, res: Response) {
  const { text, decor, roles } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Texte de séquence manquant' });
  try {
    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM + context(`${decor ?? ''} ${text.slice(0, 3000)} espace placement des acteurs déplacement mise en scène point de vue de la caméra`, 2) },
      { role: 'user', content: `Décor : ${decor ?? ''}\nPersonnages : ${Array.isArray(roles) ? roles.join(', ') : ''}\n\nSÉQUENCE :\n${text.slice(0, 12000)}` },
    ], { maxTokens: 1800, temperature: 0.3 });
    res.json({ shapes: cleanPlan(extractJson(reply)) });
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
