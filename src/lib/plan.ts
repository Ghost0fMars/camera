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
