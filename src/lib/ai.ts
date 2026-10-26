import type { Categories, Project, Scene, Shape, Shot } from '../types';
import type { Detection } from './frame';
import { nextCamera } from './plan';
import { newId } from './planning';
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

/** Esquisse un plan de scène (vue du dessus) d'après le texte de la séquence ; les éléments sont marqués « origin: ia » et les caméras numérotées à la suite des vôtres. */
export async function proposePlan(scene: Scene, roles: string[]): Promise<Shape[]> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, roles }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  const all = [...(scene.plan ?? [])];
  return (data.shapes as Omit<Shape, 'id'>[]).map((s) => {
    const shape = { ...s, id: newId('p'), origin: 'ia' } as Shape;
    if (shape.kind === 'camera') shape.label = nextCamera(all);
    all.push(shape);
    return shape;
  });
}

export interface Schedule {
  resume: string; days: { lieu: string; motif: string; sequences: number[] }[]; unplaced: number[];
  alerts: string[];                       // contrôles calculés : jour mêlé à la nuit, journée trop longue
  convocations: Record<string, number>;   // nombre de jours de présence par comédien
}

/** Propose un nombre de jours de tournage et la répartition des séquences par jour (rien n'est appliqué). */
export async function proposeSchedule(p: Project, contraintes: string): Promise<Schedule> {
  const scenes = p.scenes.map((s) => ({
    number: s.number, decor: s.decor, ie: s.ie, effect: s.effect, durationSec: s.durationSec, shootMin: s.shootMin, roles: s.roles,
    extras: (['effets', 'vehicules', 'silhouettes'] as const).flatMap((k) => s.categories[k] ?? []).slice(0, 6),
  }));
  const res = await fetch('/api/calendrier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenes, contraintes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as Schedule;
}

/** Prompt (en anglais) pour une IA d'images ou de vidéos, d'après un plan et sa séquence. */
export async function shotPrompt(scene: Scene, shot: Shot, roles: string[]): Promise<string> {
  const res = await fetch('/api/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, ie: scene.ie, effect: scene.effect, roles, shot: { size: shot.size, move: shot.move, lens: shot.lens, description: shot.description, notes: shot.notes } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.prompt as string;
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
