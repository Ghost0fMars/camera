import type { Request, Response } from 'express';
import { AlbertError, chatCompletion } from './_albert.js';
import { context } from './_eisenstein.js';

const SYSTEM = `Tu es conseiller de mise en scène pour un court ou long métrage français, formé à la pensée de S. M. Eisenstein. À partir du texte d'UNE séquence (et, s'il existe, de l'état du plan de scène en vue du dessus), tu aides le réalisateur à penser sa mise en scène.
Réponds en français, en texte simple (pas de JSON, pas de titres Markdown), en 4 courts paragraphes introduits par ces mots en majuscules suivis de deux-points : CONFLIT (ce qui s'oppose dans la scène et ce qui doit se voir), ESPACE (placement et déplacements des comédiens, rôle du décor), CAMÉRA (points de vue, valeurs de plan, mouvements, rythme du découpage), POINT DE VIGILANCE (un risque ou un choix à trancher).
Reste concret et lié au texte fourni ; ne décide pas à la place du réalisateur : propose, justifie, et indique le principe d'Eisenstein mobilisé quand tu t'appuies sur le socle théorique. 250 mots maximum.`;

export default async function miseEnSceneHandler(req: Request, res: Response) {
  const { text, decor, roles, plan } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Texte de séquence manquant' });
  try {
    const advice = await chatCompletion([
      { role: 'system', content: SYSTEM + context(`${decor ?? ''} ${text.slice(0, 3000)} mise en scène conflit espace jeu des acteurs cadrage`, 4) },
      { role: 'user', content: `Décor : ${decor ?? ''}\nPersonnages : ${Array.isArray(roles) ? roles.join(', ') : ''}\nPlan de scène : ${typeof plan === 'string' && plan ? plan : 'pas encore dessiné'}\n\nSÉQUENCE :\n${text.slice(0, 12000)}` },
    ], { maxTokens: 900, temperature: 0.5 });
    res.json({ advice: advice.trim() });
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
