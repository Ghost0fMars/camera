import type { Request, Response } from 'express';
import { AlbertError, chatCompletion } from './_albert';

const KEYS = ['silhouettes', 'decoration', 'accessoires', 'costumes', 'maquillage', 'image', 'son', 'electricite', 'machinerie', 'vehicules', 'effets', 'animaux', 'armes', 'regie', 'miseEnScene'];

const SYSTEM = `Tu es assistant de production et de régie pour un court ou long métrage français. À partir du texte d'UNE séquence de scénario, tu fais le dépouillement : tu listes ce qui est nécessaire au tournage.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"summary": "résumé en 2 à 3 phrases au présent",
 "continuity": "éléments de raccord à surveiller (vide si aucun)",
 "silhouettes": [], "decoration": [], "accessoires": [], "costumes": [], "maquillage": [], "image": [], "son": [], "electricite": [], "machinerie": [], "vehicules": [], "effets": [], "animaux": [], "armes": [], "regie": [], "miseEnScene": []}
Règles : chaque rubrique est une liste de courtes chaînes ; liste vide si rien n'est mentionné ou clairement impliqué ; n'invente rien qui ne soit pas dans le texte ; costumes = tenue de chaque personnage (« Nom : tenue ») ; image = valeurs de plan seulement si le texte les indique ; son = bruitages et musiques mentionnés.`;

export function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new AlbertError('Réponse IA sans JSON', 502);
  try { return JSON.parse(text.slice(start, end + 1)); } catch { throw new AlbertError('JSON IA invalide', 502); }
}

export function cleanAnalysis(raw: Record<string, unknown>) {
  const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 30) : []);
  return {
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    continuity: typeof raw.continuity === 'string' ? raw.continuity.trim() : '',
    categories: Object.fromEntries(KEYS.map((k) => [k, list(raw[k])])),
  };
}

export default async function analyseHandler(req: Request, res: Response) {
  const { text, decor, roles } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Texte de séquence manquant' });
  try {
    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Décor : ${decor ?? ''}\nPersonnages connus : ${Array.isArray(roles) ? roles.join(', ') : ''}\n\nSÉQUENCE :\n${text.slice(0, 12000)}` },
    ], { maxTokens: 1500, temperature: 0.2 });
    res.json(cleanAnalysis(extractJson(reply)));
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
