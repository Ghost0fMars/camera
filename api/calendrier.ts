import type { Request, Response } from 'express';
import { AlbertError, chatCompletion } from './_albert.js';
import { extractJson } from './analyse.js';

const SYSTEM = `Tu es directeur de production pour un court ou long métrage français. On te donne les séquences d'un film (décor, intérieur ou extérieur, effet jour ou nuit, durée à l'écran, temps de tournage estimé en minutes, comédiens, éléments à prévoir), une PROPOSITION DE DÉPART calculée automatiquement (regroupement par lieu, jour et nuit séparés, journées limitées en minutes) et les contraintes de l'utilisateur. Tu produis le plan de travail final : le nombre de jours de tournage et la répartition des séquences par jour, dans l'ordre de tournage de chaque jour.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"resume": "deux phrases : le nombre de jours et les critères qui l'ont fixé, et ce que tu as changé par rapport à la proposition de départ", "days": [{"lieu": "lieu de tournage du jour", "sequences": [3, 1, 2], "motif": "pourquoi ces séquences ensemble, en une phrase"}]}
Règles : sequences = les NUMÉROS des séquences, chacun placé une seule fois, aucun oublié ; pars de la proposition de départ et ne la modifie que pour tenir une contrainte de l'utilisateur ou pour un gain net (moins de jours, moins de déménagements) ; ne mélange pas une séquence de jour et une séquence de nuit dans une même journée ; garde ensemble les séquences d'un même lieu (le décor avant les deux-points) ; respecte la limite de minutes de tournage par journée ; si une contrainte ne peut pas être tenue, dis-le clairement dans le resume au lieu de faire semblant ; ne coupe pas une séquence entre deux jours ; n'invente aucune séquence.`;

export interface Day { lieu: string; motif: string; sequences: number[] }
export interface SceneIn { number: number; decor: string; ie: string; effect: string; durationSec: number; shootMin: number; roles: string[]; extras: string[] }

const lieuOf = (s: SceneIn) => s.decor.split(':')[0].trim().toUpperCase();
const periodOf = (s: SceneIn) => (/nuit/i.test(s.effect) ? 'nuit' : 'jour');

/** Minutes de tournage par journée : « journées de 6 h » dans les contraintes, sinon 8 h. */
export function capFrom(contraintes: string): number {
  const m = /journ[ée]es?\s+(?:de|d'environ)\s+(\d+(?:[.,]\d+)?)\s*h/i.exec(contraintes);
  const h = m ? Number(m[1].replace(',', '.')) : 8;
  return Math.round(Math.min(16, Math.max(1, h)) * 60);
}

/** Proposition de départ : séquences groupées par lieu et par période (jour / nuit), groupes remplis dans des journées de `cap` minutes, une journée ne mélangeant pas jour et nuit. */
export function baseSchedule(scenes: SceneIn[], cap: number): Day[] {
  const groups = new Map<string, SceneIn[]>();
  for (const s of [...scenes].sort((a, b) => a.number - b.number)) groups.set(`${periodOf(s)}|${lieuOf(s)}`, [...(groups.get(`${periodOf(s)}|${lieuOf(s)}`) ?? []), s]);
  const days: { period: string; left: number; scenes: SceneIn[] }[] = [];
  for (const [key, list] of groups) {
    const period = key.split('|')[0];
    for (const s of list) {
      const t = Math.max(1, s.shootMin);
      // même journée que la séquence précédente du lieu si elle tient, sinon première journée de la période qui a la place
      const day = days.find((d) => d.period === period && d.scenes.some((x) => lieuOf(x) === lieuOf(s)) && d.left >= t)
        ?? days.find((d) => d.period === period && d.left >= t);
      if (day) { day.scenes.push(s); day.left -= t; } else days.push({ period, left: cap - t, scenes: [s] });
    }
  }
  return days.map((d) => ({ lieu: [...new Set(d.scenes.map(lieuOf))].join(' / '), motif: `Séquences de ${d.period}, regroupées par lieu.`, sequences: d.scenes.sort((a, b) => lieuOf(a).localeCompare(lieuOf(b)) || a.number - b.number).map((s) => s.number) }));
}

/** Garde les jours dont les séquences existent, chacune au plus une fois ; renvoie aussi les séquences laissées de côté par le modèle. */
export function cleanSchedule(raw: Record<string, unknown>, numbers: number[]) {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const left = new Set(numbers);
  const days: Day[] = (Array.isArray(raw.days) ? raw.days : []).slice(0, 80).flatMap((d) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const sequences = (Array.isArray(o.sequences) ? o.sequences : []).map(Number).filter((n) => {
      if (!left.has(n)) return false;
      left.delete(n);
      return true;
    });
    return sequences.length ? [{ lieu: str(o.lieu, 80), motif: str(o.motif, 240), sequences }] : [];
  });
  return { resume: str(raw.resume, 600), days, unplaced: numbers.filter((n) => left.has(n)) };
}

/** Contrôles calculés (pas par l'IA) : journées mêlant jour et nuit, journées trop longues, nombre de jours de convocation par comédien. */
export function review(days: Day[], scenes: SceneIn[], cap: number) {
  const by = new Map(scenes.map((s) => [s.number, s]));
  const alerts: string[] = [];
  const calls = new Map<string, number>();
  days.forEach((d, i) => {
    const sc = d.sequences.flatMap((n) => by.get(n) ?? []);
    if (new Set(sc.map(periodOf)).size > 1) alerts.push(`Jour ${i + 1} : mélange des séquences de jour et de nuit.`);
    const min = sc.reduce((a, s) => a + s.shootMin, 0);
    if (min > cap * 1.1) alerts.push(`Jour ${i + 1} : ${Math.round((min / 60) * 10) / 10} h de tournage estimé, au-delà de ${Math.round((cap / 60) * 10) / 10} h.`);
    for (const r of new Set(sc.flatMap((s) => s.roles))) calls.set(r, (calls.get(r) ?? 0) + 1);
  });
  return { alerts, convocations: Object.fromEntries([...calls].sort((a, b) => b[1] - a[1])) };
}

export default async function calendrierHandler(req: Request, res: Response) {
  const { scenes, contraintes } = req.body ?? {};
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const list: SceneIn[] = (Array.isArray(scenes) ? scenes : []).slice(0, 150).flatMap((s: Record<string, unknown>) => {
    const number = Number(s?.number);
    if (!Number.isFinite(number)) return [];
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    return [{ number, decor: str(s.decor), ie: str(s.ie), effect: str(s.effect), durationSec: Number(s.durationSec) || 0, shootMin: Number(s.shootMin) || 0, roles: arr(s.roles), extras: arr(s.extras) }];
  });
  if (!list.length) return res.status(400).json({ error: 'Aucune séquence à planifier' });
  const numbers = list.map((s) => s.number);
  const cons = str(contraintes).trim().slice(0, 600);
  const cap = capFrom(cons);
  const base = baseSchedule(list, cap);
  const line = (s: SceneIn) => `${s.number} | ${s.decor} | ${s.ie} | ${s.effect} | écran ${s.durationSec} s | tournage ${s.shootMin} min | comédiens : ${s.roles.join(', ') || '—'} | à prévoir : ${s.extras.join(' ; ') || '—'}`;
  try {
    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Contraintes de l'utilisateur : ${cons || 'aucune'}\nLimite par journée : ${cap} minutes de tournage estimé.\n\nPROPOSITION DE DÉPART (${base.length} jours) :\n${base.map((d, i) => `Jour ${i + 1} : séquences ${d.sequences.join(', ')}`).join('\n')}\n\nSÉQUENCES (numéro | décor | I/E | effet | durée | tournage | comédiens | à prévoir) :\n${list.map(line).join('\n')}` },
    ], { maxTokens: 3000, temperature: 0.2 });
    const out = cleanSchedule(extractJson(reply), numbers);
    if (!out.days.length) return res.status(502).json({ error: 'L\'IA n\'a proposé aucun jour, réessayez' });
    const checked = review(out.days, list, cap);
    if (!out.unplaced.length && !checked.alerts.length) return res.json({ ...out, ...checked });
    // Le modèle a enfreint les règles (jour mêlé à la nuit, journée trop longue, séquence oubliée) : on garde la proposition calculée.
    const fallback = review(base, list, cap);
    res.json({
      resume: `${base.length} jour${base.length > 1 ? 's' : ''} : séquences regroupées par lieu, jour et nuit séparés, journées de ${Math.round((cap / 60) * 10) / 10} h. La proposition de l'IA enfreignait ces règles (${[...checked.alerts, ...(out.unplaced.length ? [`séquences oubliées : ${out.unplaced.join(', ')}`] : [])].join(' ')}), elle a été écartée. Les contraintes de disponibilité des comédiens ne sont pas prises en compte dans ce calendrier : ajustez-le à la main.`,
      days: base, unplaced: [], ...fallback,
    });
  } catch (err) {
    const e = err as AlbertError;
    res.status(e.status ?? 500).json({ error: e.message });
  }
}
