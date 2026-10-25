import type { Categories, Scene, Shot } from '../types';
import type { Detection } from './frame';
import { emptyShot, shotCats } from './shots';

export interface Analysis { summary: string; continuity: string; categories: Categories }

export async function analyseScene(scene: Scene, roles: string[]): Promise<Analysis> {
  const res = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, roles }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as Analysis;
}

/** Applique une analyse IA : ne remplace jamais ce que l'utilisateur a déjà saisi. */
export function applyAnalysis(scene: Scene, a: Analysis): Scene {
  const categories = { ...scene.categories };
  for (const k of Object.keys(a.categories) as (keyof Categories)[]) {
    if (!categories[k]?.length) categories[k] = a.categories[k] ?? [];
  }
  return { ...scene, categories, summary: scene.summary || a.summary, continuity: scene.continuity || a.continuity };
}

/** Propose un découpage technique (liste de plans) pour une séquence. */
export async function proposeShots(scene: Scene, roles: string[], all: Scene[] = []): Promise<Shot[]> {
  const res = await fetch('/api/decoupage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, roles, position: position(scene, all), cameras: (scene.plan ?? []).flatMap((p) => (p.kind === 'camera' ? [p.label] : [])) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return (data.shots as Omit<Shot, 'id'>[]).map((h) => emptyShot({ ...h, origin: 'ia' }));
}

/** Dépouillement d'un plan : l'IA ne remplit que les rubriques encore vides. */
export async function analyseShot(scene: Scene, shot: Shot, roles: string[]): Promise<Categories> {
  const text = `PLAN À DÉPOUILLER : ${shot.size}, ${shot.move}${shot.lens ? `, ${shot.lens}` : ''} — ${shot.description}\n`
    + `Ne liste QUE ce qui est visible ou audible dans ce plan.\n\nCONTEXTE (séquence entière) :\n${scene.text}`;
  const a = await analyseScene({ ...scene, text }, roles);
  const cats = shotCats(shot);
  for (const k of Object.keys(cats) as (keyof Categories)[]) if (!cats[k].length) cats[k] = a.categories[k] ?? [];
  return cats;
}

/** Conseils de mise en scène (socle : Eisenstein) pour une séquence, avec l'état de son plan de scène. */
export async function adviseScene(scene: Scene, roles: string[], all: Scene[] = []): Promise<string> {
  const plan = scene.plan ?? [];
  const cams = plan.flatMap((p) => (p.kind === 'camera' ? [`${p.label} (axe ${p.angle}°)`] : []));
  const chars = plan.flatMap((p) => (p.kind === 'char' ? [p.name] : []));
  const moves = plan.flatMap((p) => (p.kind === 'move' && p.who ? [p.who] : []));
  const desc = [cams.length && `caméras : ${cams.join(', ')}`, chars.length && `personnages placés : ${chars.join(', ')}`, moves.length && `déplacements de : ${moves.join(', ')}`].filter(Boolean).join(' ; ');
  const res = await fetch('/api/mise-en-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, roles, plan: desc, position: position(scene, all) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.advice as string;
}

/** Repère personnages et visages dans une image (LocateAnything, via /api/locate). */
export async function locateFrame(dataUrl: string): Promise<Detection[]> {
  const res = await fetch('/api/locate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.detections as Detection[];
}

/** Place de la séquence dans le film, avec le résumé des séquences voisines (l'intégrale dramatique se lit dans la durée). */
export function position(scene: Scene, all: Scene[]) {
  const sorted = [...all].sort((a, b) => a.number - b.number);
  const i = sorted.findIndex((s) => s.id === scene.id);
  if (i < 0) return undefined;
  const brief = (s?: Scene) => (s ? `${s.decor} — ${(s.summary || s.text).replace(/\s+/g, ' ').slice(0, 280)}` : undefined);
  return { index: i + 1, total: sorted.length, previous: brief(sorted[i - 1]), next: brief(sorted[i + 1]) };
}
