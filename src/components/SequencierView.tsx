import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { analyseScene, applyAnalysis } from '../lib/ai';
import { fmtDur, parseDur } from '../lib/planning';
import type { IE, Project, Scene } from '../types';
import { card } from './card';

const cell = 'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-neutral-300 focus:border-neutral-500 focus:bg-white focus:outline-none';

export function SequencierView({ project, updateScene, onOpen }: {
  project: Project; updateScene: (id: string, patch: Partial<Scene>) => void; onOpen: (id: string) => void;
}) {
  const [progress, setProgress] = useState<string>('');
  const sorted = [...project.scenes].sort((a, b) => a.number - b.number);
  const total = sorted.reduce((n, s) => n + s.durationSec, 0);

  const analyseAll = async () => {
    const roles = project.roles.map((r) => r.name);
    let failed = 0;
    for (const [i, s] of sorted.entries()) {
      setProgress(`Analyse IA ${i + 1}/${sorted.length}…`);
      try { updateScene(s.id, applyAnalysis(s, await analyseScene(s, roles))); } catch { failed++; }
    }
    setProgress(failed ? `${failed} séquence(s) non analysée(s) (clé Albert absente ou API injoignable).` : 'Analyse terminée.');
  };

  if (!sorted.length) return <p className="text-sm text-neutral-500">Importez d'abord un scénario.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={analyseAll}>Dépouiller toutes les séquences (IA)</Button>
        <span className="text-xs text-neutral-500">{progress}</span>
        <span className="ml-auto text-sm">Total estimé : <b>{fmtDur(total)}</b></span>
      </div>
      <div className={`${card} overflow-x-auto p-2`}>
        <table className="w-full min-w-[900px] rounded bg-white text-left">
          <thead className="border-b border-neutral-300 bg-neutral-50 text-xs uppercase tracking-widest text-neutral-600">
            <tr>{['N°', 'Décor', 'I/E', 'Effet', 'Rôles', 'Durée', 'Tournage (min)', 'Jour', ''].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id} className="border-t border-neutral-200 align-top">
                <td className="px-2 py-1.5 text-sm font-semibold">{s.number}</td>
                <td className="min-w-52"><input className={cell} value={s.decor} onChange={(e) => updateScene(s.id, { decor: e.target.value })} /></td>
                <td>
                  <select className={cell} value={s.ie} onChange={(e) => updateScene(s.id, { ie: e.target.value as IE })}>
                    {['INT', 'EXT', 'INT/EXT'].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </td>
                <td className="w-32"><input className={cell} value={s.effect} onChange={(e) => updateScene(s.id, { effect: e.target.value.toUpperCase() })} /></td>
                <td className="min-w-40 px-2 py-1.5 text-sm">{s.roles.join(', ')}</td>
                <td className="w-20"><input className={cell} defaultValue={fmtDur(s.durationSec)} key={s.durationSec}
                  onBlur={(e) => updateScene(s.id, { durationSec: parseDur(e.target.value) })} /></td>
                <td className="w-24"><input className={cell} type="number" min={0} step={15} value={s.shootMin} onChange={(e) => updateScene(s.id, { shootMin: Number(e.target.value) || 0 })} /></td>
                <td className="w-28">
                  <select className={cell} value={s.dayId ?? ''} onChange={(e) => updateScene(s.id, { dayId: e.target.value || null })}>
                    <option value="">—</option>
                    {project.days.map((d, i) => <option key={d.id} value={d.id}>Jour {i + 1}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5"><button className="text-xs uppercase tracking-widest text-neutral-600 underline" onClick={() => onOpen(s.id)}>Fiche</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
