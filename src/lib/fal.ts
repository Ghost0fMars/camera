// Génération d'images de plan via fal.ai, avec la clé de l'utilisateur (gardée dans son navigateur).

export interface FalModel { id: 'schnell' | 'kontext'; label: string; usdPerImage: number }

/** Tarifs fal.ai relevés en octobre 2026 : indicatifs, à confirmer sur fal.ai/pricing. */
export const FAL_MODELS: FalModel[] = [
  { id: 'schnell', label: 'Brouillon (Flux schnell)', usdPerImage: 0.003 },
  { id: 'kontext', label: 'Qualité (Flux Kontext Pro)', usdPerImage: 0.04 },
];

export const falModel = (id: string) => FAL_MODELS.find((m) => m.id === id) ?? FAL_MODELS[1];

const KEY = 'camera_fal_key';
const SPENT = 'camera_fal_spent';

export const getFalKey = () => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };
export const setFalKey = (v: string) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* stockage indisponible */ } };

/** Dépense estimée cumulée (en dollars), comptée localement à chaque image réussie. */
export const getSpent = () => { try { return Number(localStorage.getItem(SPENT)) || 0; } catch { return 0; } };
export function addSpent(usd: number): number {
  const next = Math.round((getSpent() + usd) * 10000) / 10000;
  try { localStorage.setItem(SPENT, String(next)); } catch { /* tant pis */ }
  return next;
}
export const resetSpent = () => { try { localStorage.removeItem(SPENT); } catch { /* tant pis */ } };

/** Coût estimé de n images avec un modèle. */
export const imagesCost = (n: number, modelId: string) => n * falModel(modelId).usdPerImage;

/** « 0,003 $ », « 0,04 $ », « 12 $ » : trois décimales sous 1 $, deux au-delà, sans zéros inutiles. */
export function fmtUsd(v: number): string {
  if (v === 0) return '0 $';
  if (v < 0.001) return '< 0,001 $';
  const s = v.toFixed(v < 1 ? 3 : 2).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
  return `${s.replace('.', ',')} $`;
}

/** Génère l'image d'un plan : renvoie l'adresse (temporaire côté fal) de l'image. */
export async function generateShotImage(prompt: string, modelId: string, key: string): Promise<string> {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-fal-key': key },
    body: JSON.stringify({ prompt, model: modelId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data.url as string;
}

const MODEL = 'camera_fal_model';
export const getImgModel = () => { try { return falModel(localStorage.getItem(MODEL) ?? '').id; } catch { return falModel('').id; } };
export const setImgModel = (id: string) => { try { localStorage.setItem(MODEL, id); } catch { /* stockage indisponible */ } };
