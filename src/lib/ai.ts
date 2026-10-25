import type { Categories, Scene, Shot } from '../types';
import { emptyShot } from './shots';

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
export async function proposeShots(scene: Scene, roles: string[]): Promise<Shot[]> {
  const res = await fetch('/api/decoupage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scene.text, decor: scene.decor, roles, cameras: (scene.plan ?? []).flatMap((p) => (p.kind === 'camera' ? [p.label] : [])) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return (data.shots as Omit<Shot, 'id'>[]).map((h) => emptyShot(h));
}
