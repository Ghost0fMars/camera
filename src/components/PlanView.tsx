import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { dayDate, dayScenes, dayStats, fmtDur, fmtHours, newId } from '../lib/planning';
import type { Project, Scene } from '../types';

export function PlanView({ project, update, updateScene }: {
  project: Project; update: (f: (p: Project) => Project) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
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
      {unassigned.length > 0 && (
        <div className="rounded border border-dashed border-neutral-400 bg-white p-3">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Non planifiées ({unassigned.length})</h3>
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
