import type { Request, Response } from 'express';

// Génération d'une image de plan via fal.ai, avec la clé fal DE L'UTILISATEUR.
// La clé arrive dans l'en-tête « x-fal-key » ; elle n'est ni enregistrée ni journalisée, et sert uniquement à cet appel.
// Les modèles sont une liste fermée : on ne relaie jamais vers une adresse choisie par le client.

type FalModel = { endpoint: string; input: (prompt: string) => Record<string, unknown> };

export const FAL_MODELS: Record<string, FalModel> = {
  // Brouillon : très bon marché, pour tester cadrage et lumière.
  schnell: {
    endpoint: 'https://fal.run/fal-ai/flux/schnell',
    input: (prompt) => ({ prompt, image_size: 'landscape_16_9', num_inference_steps: 4, num_images: 1 }),
  },
  // Qualité : rendu plus fidèle au prompt.
  kontext: {
    endpoint: 'https://fal.run/fal-ai/flux-pro/kontext/text-to-image',
    input: (prompt) => ({ prompt, aspect_ratio: '16:9', output_format: 'jpeg', num_images: 1 }),
  },
};

/** Adresse de l'image dans la réponse fal, seulement si elle est en https ; sinon chaîne vide. */
export function cleanImageUrl(raw: unknown): string {
  const first = (raw as { images?: unknown } | null)?.images;
  const url = Array.isArray(first) ? (first[0] as { url?: unknown } | undefined)?.url : undefined;
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : '';
}

/** Message lisible pour une erreur fal (clé refusée, solde épuisé…). */
export function falMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  const text = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d) => (d as { msg?: string })?.msg ?? '').filter(Boolean).join(' ; ') : '';
  if (status === 401) return 'Clé fal.ai refusée : vérifiez-la.';
  if (status === 403 && /balance|locked|exhaust/i.test(text)) return 'Solde fal.ai épuisé : rechargez votre compte sur fal.ai.';
  if (status === 403) return 'Accès refusé par fal.ai.';
  if (status === 429) return 'Trop de demandes envoyées à fal.ai : patientez un instant.';
  return text ? `fal.ai : ${text.slice(0, 200)}` : `fal.ai a répondu ${status}`;
}

export default async function imageHandler(req: Request, res: Response) {
  const raw = req.headers['x-fal-key'];
  const key = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const { prompt, model } = req.body ?? {};
  if (!key) return res.status(400).json({ error: 'Saisissez votre clé fal.ai pour générer une image.' });
  const m = typeof model === 'string' ? FAL_MODELS[model] : undefined;
  if (!m) return res.status(400).json({ error: 'Modèle inconnu.' });
  const text = typeof prompt === 'string' ? prompt.replace(/\s+/g, ' ').trim() : '';
  if (!text) return res.status(400).json({ error: 'Rédigez d\'abord le prompt du plan.' });
  try {
    const r = await fetch(m.endpoint, {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(m.input(text.slice(0, 2000))),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return res.status(r.status === 401 || r.status === 403 || r.status === 429 ? r.status : 502).json({ error: falMessage(r.status, data) });
    const url = cleanImageUrl(data);
    if (!url) return res.status(502).json({ error: 'fal.ai n\'a renvoyé aucune image, réessayez.' });
    res.json({ url });
  } catch {
    res.status(502).json({ error: 'Impossible de joindre fal.ai.' });
  }
}
