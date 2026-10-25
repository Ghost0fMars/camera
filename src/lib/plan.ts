import type { Pt, Shape } from '../types';

export const W = 1000;
export const H = 640;

/** Déplace un élément du plan de (dx, dy). */
export function shift(s: Shape, dx: number, dy: number): Shape {
  const m = (p: Pt): Pt => ({ x: p.x + dx, y: p.y + dy });
  switch (s.kind) {
    case 'pen': case 'move': return { ...s, pts: s.pts.map(m) };
    case 'line': case 'rect': return { ...s, a: m(s.a), b: m(s.b) };
    default: return { ...s, at: m(s.at) };
  }
}

/** Angle (degrés, 0 = vers la droite) du vecteur a → b. */
export const angleOf = (a: Pt, b: Pt) => Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);

/** Prochain nom de caméra libre : « Cam 1 », « Cam 2 »… */
export const nextCamera = (plan: Shape[]) => `Cam ${plan.filter((s) => s.kind === 'camera').length + 1}`;

/** À qui appartient un déplacement : le choix explicite, sinon le personnage ou la caméra le plus proche du départ (≤ 50). */
export function ownerOf(plan: Shape[], start: Pt, who = ''): string | undefined {
  if (who) return who;
  let best: string | undefined; let d = 50;
  for (const s of plan) {
    if (s.kind !== 'char' && s.kind !== 'camera') continue;
    const k = Math.hypot(s.at.x - start.x, s.at.y - start.y);
    if (k <= d) { d = k; best = s.kind === 'char' ? s.name : s.label; }
  }
  return best;
}

/** Pointe de flèche (3 sommets) au bout d'un tracé. */
export function arrowHead(pts: Pt[], size = 16): string {
  const e = pts[pts.length - 1];
  const f = pts[Math.max(0, pts.length - 6)];
  const a = Math.atan2(e.y - f.y, e.x - f.x);
  const p = (da: number) => `${Math.round(e.x - size * Math.cos(a + da))},${Math.round(e.y - size * Math.sin(a + da))}`;
  return `${e.x},${e.y} ${p(0.45)} ${p(-0.45)}`;
}
