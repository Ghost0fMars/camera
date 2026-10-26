import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyseScene, applyAnalysis } from '../lib/ai';
import { CATEGORIES, type Project, type Scene } from '../types';

const L = ({ children }: { children: string }) => <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">{children}</span>;
const card = 'block rounded-lg border border-neutral-300 bg-[#EEEEEE] p-4 shadow-md';
const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

export function FicheView({ project, sceneId, onSelect, updateScene }: {
  project: Project; sceneId: string | null; onSelect: (id: string) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const sorted = [...project.scenes].sort((a, b) => a.number - b.number);
  const scene = sorted.find((s) => s.id === sceneId) ?? sorted[0];
  if (!scene) return <p className="text-sm text-neutral-500">Importez d'abord un scénario.</p>;

  const analyse = async () => {
    setBusy(true); setMsg('');
    try { updateScene(scene.id, applyAnalysis(scene, await analyseScene(scene, project.roles.map((r) => r.name)))); setMsg('Proposition de l\'IA ajoutée (vos saisies sont conservées).'); }
    catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      <nav className="max-h-[75vh] space-y-1 overflow-y-auto">
        {sorted.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${s.id === scene.id ? 'bg-[#FFD369] font-semibold' : 'hover:bg-neutral-200'}`}>
            {s.number} · {s.decor}
          </button>
        ))}
      </nav>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-xl italic">Séquence {scene.number} · {scene.decor} · {scene.ie} · {scene.effect}</h2>
          <Button variant="outline" size="sm" className="ml-auto" disabled={busy} onClick={analyse}>{busy ? 'Analyse…' : 'Dépouiller avec l\'IA'}</Button>
        </div>
        {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        <label className={card}><L>Résumé</L><Textarea className="bg-white" value={scene.summary} onChange={(e) => updateScene(scene.id, { summary: e.target.value })} /></label>
        <label className={card}><L>Continuité / raccord</L><Textarea className="bg-white" value={scene.continuity} onChange={(e) => updateScene(scene.id, { continuity: e.target.value })} /></label>
        <div className={card}><L>Rôles</L><p className="text-sm">{scene.roles.join(', ') || '—'}</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORIES.map((c) => (
            <label key={c.key} className={card}><L>{c.label}</L>
              <Textarea className="min-h-20 bg-white text-sm" placeholder="Un élément par ligne"
                value={scene.categories[c.key].join('\n')}
                onChange={(e) => updateScene(scene.id, { categories: { ...scene.categories, [c.key]: e.target.value.split('\n') } })}
                onBlur={(e) => updateScene(scene.id, { categories: { ...scene.categories, [c.key]: lines(e.target.value) } })} />
            </label>
          ))}
        </div>
        <label className={card}><L>Notes</L><Textarea className="bg-white" value={scene.notes} onChange={(e) => updateScene(scene.id, { notes: e.target.value })} /></label>
        <details className={`${card} text-sm`}><summary className="cursor-pointer text-neutral-600">Texte de la séquence</summary><pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs">{scene.text}</pre></details>
      </div>
    </div>
  );
}
