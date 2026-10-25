import type { Request, Response } from 'express';
import { MOVES, SIZES } from '../src/types.js';
import { AlbertError, chatCompletion } from './_albert.js';
import { context } from './_eisenstein.js';
import { integraleContext, positionContext } from './_integrale.js';
import { extractJson } from './analyse.js';

const SYSTEM = `Tu es assistant réalisateur pour un court ou long métrage français. À partir du texte d'UNE séquence, tu proposes un découpage technique : la liste des plans à tourner, dans l'ordre du montage.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"shots": [{"size": "PM", "move": "Fixe", "lens": "35 mm", "camera": "", "description": "ce que montre le plan, action et personnages", "notes": "intention de mise en scène ou point d'attention, avec le principe d'Eisenstein ou le terme de l'intégrale dramatique (V, P, Ci, Ce, manque, tuché) mobilisé s'il y en a un (vide si aucun)"}]}
Règles : size parmi ${SIZES.join(', ')} ; move parmi ${MOVES.join(', ')} ; lens = focale usuelle (ex. « 50 mm »), vide si tu hésites ; camera = un nom de la liste fournie si elle correspond au plan, sinon vide ; entre 2 et 12 plans selon la longueur de la séquence ; ne montre que ce que le texte raconte.`;

export function cleanShots(raw: Record<string, unknown>) {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const list = Array.isArray(raw.shots) ? raw.shots : [];
  return list.slice(0, 40).flatMap((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const description = str(o.description);
    return description ? [{ size: str(o.size) || 'PM', move: str(o.move) || 'Fixe', lens: str(o.lens), camera: str(o.camera), description, notes: str(o.notes) }] : [];
  });
}

export default async function decoupageHandler(req: Request, res: Response) {
  const { text, decor, roles, cameras, position } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Texte de séquence manquant' });
  try {
    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM + context(`${decor ?? ''} ${text.slice(0, 3000)} découpage en plans cadrage grosseur de plan montage`, 3) + integraleContext(`${decor ?? ''} ${text.slice(0, 3000)} tension accumulation hors-champ manque contingence`) },
      { role: 'user', content: `Décor : ${decor ?? ''}\nPersonnages : ${Array.isArray(roles) ? roles.join(', ') : ''}\nCaméras disponibles : ${Array.isArray(cameras) ? cameras.join(', ') : ''}${positionContext(position)}\n\nSÉQUENCE :\n${text.slice(0, 12000)}` },
    ], { maxTokens: 2000, temperature: 0.3 });
    res.json({ shots: cleanShots(extractJson(reply)) });
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
