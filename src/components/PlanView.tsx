import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { proposeSchedule, type Schedule } from '../lib/ai';
import { applySchedule, dayDate, dayScenes, dayStats, fmtDur, fmtHours, newId } from '../lib/planning';
import type { Project, Scene } from '../types';

const box = 'w-full rounded border border-neutral-400 bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#222831]';

export function PlanView({ project, update, updateScene }: {
  project: Project; update: (f: (p: Project) => Project) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const [contraintes, setContraintes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<Schedule | null>(null);
  const [undo, setUndo] = useState<{ days: Project['days']; scenes: Project['scenes'] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const startTimer = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setUndo(null), 12000); };
  const byNumber = new Map(project.scenes.map((s) => [s.number, s]));

  const propose = async () => {
    setBusy(true); setError(''); setProposal(null);
    try { setProposal(await proposeSchedule(project, contraintes)); }
    catch (e) { setError((e as Error).message); }
    setBusy(false);
  };
  const apply = () => {
    if (!proposal) return;
    setUndo({ days: project.days, scenes: project.scenes }); startTimer();
    update((p) => applySchedule(p, proposal.days));
    setProposal(null);
  };
  const unassigned = project.scenes.filter((s) => !s.dayId || !project.days.some((d) => d.id === s.dayId));
  const addDay = () => update((p) => ({ ...p, days: [...p.days, { id: newId('d'), lieu: '', notes: '' }] }));
  const removeDay = (id: string) => update((p) => ({
    ...p, days: p.days.filter((d) => d.id !== id), scenes: p.scenes.map((s) => (s.dayId === id ? { ...s, dayId: null } : s)),
  }));
  const setDay = (id: string, patch: Partial<Project['days'][number]>) =>
    update((p) => ({ ...p, days: p.days.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  /** Décale une séquence dans l'ordre de tournage du jour (= ordre du tableau). */
  const move = (id: string, dir: -1 | 1) => update((p) => {
    const sc = p.scenes.find((s) => s.id === id)!;
    const mates = p.scenes.filter((s) => s.dayId === sc.dayId);
    const j = mates.findIndex((s) => s.id === id) + dir;
    if (j < 0 || j >= mates.length) return p;
    const a = p.scenes.indexOf(sc); const b = p.scenes.indexOf(mates[j]);
    const scenes = [...p.scenes]; [scenes[a], scenes[b]] = [scenes[b], scenes[a]];
    return { ...p, scenes };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={addDay}>Ajouter un jour</Button>
        <span className="text-xs text-neutral-500">Affectez les séquences aux jours ici ou dans le séquencier.</span>
      </div>
      <details className="rounded border border-neutral-300 bg-white p-3 text-sm" open={!!proposal || !!error}>
        <summary className="cursor-pointer font-semibold">Assistance au plan de travail <span className="font-normal text-neutral-600">· jours de tournage et répartition des séquences</span></summary>
        <div className="mt-2 space-y-2">
          <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-700">Contraintes (facultatif)</span>
            <textarea className={`${box} field-sizing-content min-h-10 resize-none`} placeholder="Ex. : journées de 6 h, Clémence disponible seulement 2 jours, l'extérieur d'abord"
              value={contraintes} onChange={(e) => setContraintes(e.target.value)} /></label>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" disabled={busy || !project.scenes.length} onClick={() => void propose()}>Proposer un calendrier (IA)</Button>
            <span className="text-xs text-neutral-600">{project.days.length ? 'Appliquer remplace vos jours actuels ; vous pourrez annuler.' : 'Rien n\'est appliqué avant votre accord.'}</span>
          </div>
        </div>
      </details>
      <div role="status" aria-live="polite" className="space-y-2 empty:hidden">
        {busy && <p className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Calendrier en cours de proposition…</p>}
        {error && (
          <p className="flex flex-wrap items-center gap-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>{error}</span><button onClick={() => void propose()} className="font-semibold underline underline-offset-2">Réessayer</button>
          </p>
        )}
        {undo && (
          <p data-dark onMouseEnter={() => clearTimeout(timer.current)} onFocus={() => clearTimeout(timer.current)} onMouseLeave={startTimer} onBlur={startTimer}
            className="flex flex-wrap items-center gap-3 rounded border border-neutral-700 bg-[#222831] px-3 py-2 text-sm text-white">
            <span>Calendrier appliqué.</span>
            <button onClick={() => { update((p) => ({ ...p, days: undo.days, scenes: undo.scenes })); setUndo(null); }} className="font-semibold underline underline-offset-2">Annuler</button>
          </p>
        )}
      </div>
      {proposal && (
        <section aria-label="Proposition de calendrier" className="space-y-3 rounded border border-neutral-700 bg-white p-3">
          <h3 className="text-base font-semibold">Proposition de l'IA : {proposal.days.length} jour{proposal.days.length > 1 ? 's' : ''} de tournage</h3>
          {proposal.resume && <p className="text-sm text-neutral-800">{proposal.resume}</p>}
          <ol className="space-y-2">
            {proposal.days.map((d, i) => {
              const sc = d.sequences.flatMap((n) => byNumber.get(n) ?? []);
              return (
                <li key={i} className="rounded border border-neutral-300 px-3 py-2 text-sm">
                  <p className="font-semibold">Jour {i + 1}{d.lieu ? ` · ${d.lieu}` : ''} <span className="font-normal text-neutral-600">· séq. {d.sequences.join(', ')} · {fmtHours(sc.reduce((a, s) => a + s.shootMin, 0))} h de tournage · {fmtDur(sc.reduce((a, s) => a + s.durationSec, 0))} à l'écran</span></p>
                  {d.motif && <p className="text-neutral-700">{d.motif}</p>}
                </li>
              );
            })}
          </ol>
          {Object.keys(proposal.convocations).length > 0 && (
            <p className="text-sm text-neutral-800"><span className="font-semibold">Jours de présence :</span> {Object.entries(proposal.convocations).map(([r, n]) => `${r} ${n}`).join(' · ')}</p>
          )}
          {proposal.alerts.length > 0 && <ul className="list-disc pl-5 text-sm text-red-800">{proposal.alerts.map((a) => <li key={a}>{a}</li>)}</ul>}
          {proposal.unplaced.length > 0 && <p className="text-sm text-red-800">Séquences laissées de côté par l'IA (elles resteront non planifiées) : {proposal.unplaced.join(', ')}.</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-[#222831] text-white hover:bg-[#393E46]" onClick={apply}>Appliquer cette proposition</Button>
            <Button variant="outline" size="sm" onClick={() => setProposal(null)}>Ignorer</Button>
          </div>
        </section>
      )}
      {unassigned.length > 0 && (
        <div className="rounded border border-dashed border-neutral-400 bg-white p-3">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-500">Non planifiées ({unassigned.length})</h3>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((s) => (
              <span key={s.id} className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-sm">
                {s.number} · {s.decor}
                <select className="ml-1 rounded border border-neutral-300 text-xs" value="" onChange={(e) => e.target.value && updateScene(s.id, { dayId: e.target.value })}>
                  <option value="">Jour…</option>
                  {project.days.map((d, i) => <option key={d.id} value={d.id}>Jour {i + 1}</option>)}
                </select>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {project.days.map((d, i) => {
          const st = dayStats(project, d);
          const date = dayDate(project, i);
          return (
            <section key={d.id} className="space-y-2 rounded border border-neutral-300 bg-white p-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-bold">JOUR {i + 1}</h3>
                <span className="text-xs text-neutral-500">{date ? date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'date à fixer'}</span>
                <button className="ml-auto text-xs text-red-700 underline" onClick={() => removeDay(d.id)}>Supprimer</button>
              </div>
              <Input placeholder={st.lieu || 'Lieu de tournage'} value={d.lieu} onChange={(e) => setDay(d.id, { lieu: e.target.value })} className="h-8 text-sm" />
              <ul className="space-y-1">
                {dayScenes(project, d).map((s) => (
                  <li key={s.id} className="flex items-center gap-1 text-sm">
                    <span className="flex-1">{s.number} · {s.decor} <span className="text-xs text-neutral-500">{s.ie} {s.effect} · {fmtDur(s.durationSec)}</span></span>
                    <button title="Monter" className="px-1" onClick={() => move(s.id, -1)}>↑</button>
                    <button title="Descendre" className="px-1" onClick={() => move(s.id, 1)}>↓</button>
                    <button title="Retirer du jour" className="px-1 text-red-700" onClick={() => updateScene(s.id, { dayId: null })}>×</button>
                  </li>
                ))}
              </ul>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-neutral-200 pt-2 text-xs">
                <dt className="font-bold uppercase text-neutral-500">I/E</dt><dd>{st.ie || '—'}</dd>
                <dt className="font-bold uppercase text-neutral-500">Effet</dt><dd>{st.effets || '—'}</dd>
                <dt className="font-bold uppercase text-neutral-500">À l'écran</dt><dd>{fmtDur(st.durationSec)} · {st.sequences.length} séq.</dd>
                <dt className="font-bold uppercase text-neutral-500">Tournage</dt><dd>{fmtHours(st.shootMin)} h</dd>
                <dt className="font-bold uppercase text-neutral-500">Comédiens</dt><dd>{st.actors.join(', ') || '—'}</dd>
              </dl>
              <Textarea placeholder="Notes du jour" value={d.notes} onChange={(e) => setDay(d.id, { notes: e.target.value })} className="min-h-14 text-sm" />
            </section>
          );
        })}
      </div>
    </div>
  );
}
