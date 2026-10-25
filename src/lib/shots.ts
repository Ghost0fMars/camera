import type { Scene, Shot } from '../types';
import { newId } from './planning';

export const emptyShot = (patch: Partial<Shot> = {}): Shot =>
  ({ id: newId('h'), size: 'PM', move: 'Fixe', lens: '', camera: '', description: '', notes: '', ...patch });

/** « 2.3 » : séquence 2, plan n° 3. */
export const shotNumber = (s: Scene, i: number) => `${s.number}.${i + 1}`;

/** Un plan par caméra posée sur le plan de scène, sauf celles déjà utilisées dans la liste. */
export function shotsFromCameras(s: Scene): Shot[] {
  const used = new Set((s.shots ?? []).map((h) => h.camera));
  return (s.plan ?? []).flatMap((p) => (p.kind === 'camera' && !used.has(p.label) ? [emptyShot({ camera: p.label })] : []));
}

/** Tous les plans du film à plat, dans l'ordre des séquences (pour l'export). */
export const allShots = (scenes: Scene[]) =>
  [...scenes].sort((a, b) => a.number - b.number).flatMap((s) => (s.shots ?? []).map((h, i) => ({ s, h, n: shotNumber(s, i) })));
