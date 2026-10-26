import type { Request, Response } from 'express';
import { AlbertError, chatCompletion } from './_albert.js';
import { extractJson } from './analyse.js';

const SYSTEM = `Tu écris des prompts pour des IA génératrices d'images et de vidéos (Midjourney, Flux, Runway, Kling, Veo…). À partir d'UN plan d'un découpage technique de film (valeur de plan, mouvement, optique, description) et de sa séquence, tu rédiges le prompt qui reproduit ce plan.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme : {"prompt": "..."}
Règles : prompt en anglais, un seul paragraphe de 60 à 130 mots, sans retour à la ligne, sans guillemets, sans nom propre de personnage. Dans l'ordre : le sujet et l'action visibles dans ce plan ; le cadrage en termes de cinéma (extreme wide shot, wide, medium, close-up…) ; l'optique et la profondeur de champ ; le mouvement de caméra (static, slow dolly-in, handheld, pan…), qui sert à une vidéo ; le lieu et sa lumière d'après le décor, intérieur ou extérieur, jour ou nuit ; l'ambiance. Termine par « cinematic still, photorealistic, 35mm film look, 16:9 ».
Ne montre que ce que le plan raconte ; n'invente ni traits physiques, ni vêtements, ni objets que le texte ne donne pas : reste générique (« a man », « a woman ») quand il ne dit rien.`;

/** Garde le prompt s'il est une chaîne non vide, sur une ligne, plafonnée. */
export function cleanPrompt(raw: Record<string, unknown>): string {
  const p = typeof raw.prompt === 'string' ? raw.prompt.replace(/\s+/g, ' ').trim() : '';
  return p.slice(0, 1200);
}

export default async function promptHandler(req: Request, res: Response) {
  const { text, decor, ie, effect, roles, shot } = req.body ?? {};
  const s = (shot ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  if (!str(s.description)) return res.status(400).json({ error: 'Décrivez le plan avant de générer son prompt' });
  try {
    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Décor : ${str(decor)} (${str(ie)}, ${str(effect)})\nPersonnages de la séquence : ${Array.isArray(roles) ? roles.join(', ') : ''}\n\nPLAN : valeur ${str(s.size) || 'non précisée'} ; mouvement ${str(s.move) || 'fixe'} ; optique ${str(s.lens) || 'non précisée'}\nDescription : ${str(s.description)}\nNotes de mise en scène : ${str(s.notes)}\n\nSÉQUENCE (contexte) :\n${str(text).slice(0, 4000)}` },
    ], { maxTokens: 600, temperature: 0.5 });
    const prompt = cleanPrompt(extractJson(reply));
    if (!prompt) return res.status(502).json({ error: 'Réponse vide de l\'IA, réessayez' });
    res.json({ prompt });
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
