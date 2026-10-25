import type { CategoryKey, Project, Scene, ShootDay } from '../types';

export const fmtDur = (sec: number) => `${Math.floor(sec / 60)}'${String(Math.round(sec % 60)).padStart(2, '0')}`;
export const fmtHours = (min: number) => String(Math.round((min / 60) * 100) / 100).replace('.', ',');

/** « 3'30 », « 3:30 », « 90 » (secondes) → secondes. */
export function parseDur(s: string): number {
  const m = /^\s*(\d+)\s*['’:]\s*(\d{0,2})\s*$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : Math.max(0, Number(s) || 0);
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const place = (decor: string) => decor.split(':')[0].trim();

/** Les séquences d'un jour, dans l'ordre de tournage (= ordre du tableau Project.scenes). */
export const dayScenes = (p: Project, d: ShootDay) => p.scenes.filter((s) => s.dayId === d.id);

export interface DayStats {
  lieu: string;
  decors: string;
  ie: string;
  effets: string;
  sequences: string[];
  durationSec: number;
  shootMin: number;
  actors: string[];
  collect: (key: CategoryKey) => string[];
}

export function dayStats(p: Project, d: ShootDay): DayStats {
  const scenes = dayScenes(p, d);
  return {
    lieu: d.lieu || uniq(scenes.map((s) => place(s.decor))).join(', '),
    decors: uniq(scenes.map((s) => s.decor)).join(' ; '),
    ie: scenes.map((s) => s.ie).filter((v, i, a) => v !== a[i - 1]).join(', '),
    effets: uniq(scenes.map((s) => s.effect).filter(Boolean)).join(', '),
    sequences: scenes.map((s) => `${s.number} · ${s.decor}`),
    durationSec: scenes.reduce((n, s) => n + s.durationSec, 0),
    shootMin: scenes.reduce((n, s) => n + s.shootMin, 0),
    actors: uniq(scenes.flatMap((s) => s.roles)),
    collect: (key) => uniq(scenes.flatMap((s) => s.categories[key])),
  };
}

/** Récapitulatif d'une rubrique : élément → numéros de séquences (feuilles « RÉCAP … »). */
export function recap(scenes: Scene[], key: CategoryKey): { item: string; seqs: number[] }[] {
  const map = new Map<string, number[]>();
  for (const s of scenes) for (const it of s.categories[key]) map.set(it, [...(map.get(it) ?? []), s.number]);
  return [...map].map(([item, seqs]) => ({ item, seqs: uniq(seqs) })).sort((a, b) => a.item.localeCompare(b.item, 'fr'));
}

export const actorOf = (p: Project, role: string) => p.roles.find((r) => r.name === role)?.actor ?? '';
export const roleLabel = (p: Project, role: string) => { const a = actorOf(p, role); return a ? `${role} (${a})` : role; };

export function dayDate(p: Project, index: number): Date | null {
  if (!p.startDate) return null;
  const d = new Date(`${p.startDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + index);
  return d;
}

let n = 0;
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(n++).toString(36)}`;
