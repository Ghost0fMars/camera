import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { analyseShot, proposeShots } from '../lib/ai';
import { exportDecoupage } from '../lib/exportXlsx';
import { emptyShot, shotCats, shotItems, shotNumber, shotsFromCameras } from '../lib/shots';
import { CATEGORIES, MOVES, SIZES, type Project, type Scene, type Shot } from '../types';

const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

const cell = 'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-neutral-300 focus:border-neutral-500 focus:bg-white focus:outline-none';

export function DecoupageView({ project, sceneId, onSelect, updateScene }: {
  project: Project; sceneId: string | null; onSelect: (id: string) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const sorted = [...project.scenes].sort((a, b) => a.number - b.number);
  const scene = sorted.find((s) => s.id === sceneId) ?? sorted[0];
  if (!scene) return <p className="text-sm text-neutral-500">Importez d'abord un scénario.</p>;

  const shots = scene.shots ?? [];
  const set = (next: Shot[]) => updateScene(scene.id, { shots: next });
  const edit = (id: string, patch: Partial<Shot>) => set(shots.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const swap = (i: number, j: number) => { const n = [...shots]; [n[i], n[j]] = [n[j], n[i]]; set(n); };
  const propose = async () => {
    setBusy(true); setMsg('');
    try {
      const added = await proposeShots(scene, project.roles.map((r) => r.name));
      set([...shots, ...added]);
      setMsg(`${added.length} plans proposés par l'IA, ajoutés à la suite de votre liste.`);
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };
  const analyse = async (h: Shot) => {
    setBusy(true); setMsg('');
    try { edit(h.id, { categories: await analyseShot(scene, h, project.roles.map((r) => r.name)) }); setMsg('Proposition de l\'IA ajoutée (vos saisies sont conservées).'); }
    catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };
  const fromCams =shotsFromCameras(scene);
  const total = project.scenes.reduce((n, s) => n + (s.shots?.length ?? 0), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      <nav className="max-h-[75vh] space-y-1 overflow-y-auto">
        {sorted.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${s.id === scene.id ? 'bg-[#FFD369] font-semibold' : 'hover:bg-neutral-200'}`}>
            {s.number} · {s.decor}{s.shots?.length ? ` (${s.shots.length})` : ''}
          </button>
        ))}
      </nav>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-xl italic">Séquence {scene.number} · {scene.decor} · {scene.ie} · {scene.effect}</h2>
          <Button variant="outline" size="sm" className="ml-auto" disabled={!total} onClick={() => exportDecoupage(project)}>Exporter le découpage ({total} plans)</Button>
        </div>
        <details className="text-sm"><summary className="cursor-pointer text-neutral-600">Texte de la séquence</summary><pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs">{scene.text}</pre></details>
        <div className="overflow-x-auto rounded border border-neutral-300 bg-white">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#1F2433] text-[11px] uppercase tracking-wider text-white">
              <tr>{['Plan', 'Taille', 'Mouvement', 'Optique', 'Caméra', 'Description', 'Notes', ''].map((h) => <th key={h} className="px-2 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shots.map((h, i) => (
                <Fragment key={h.id}>
                <tr className="border-t border-neutral-200 align-top">
                  <td className="whitespace-nowrap px-2 py-1.5 text-sm font-semibold">{shotNumber(scene, i)}</td>
                  <td><input className={cell} list="tailles" value={h.size} onChange={(e) => edit(h.id, { size: e.target.value })} /></td>
                  <td><input className={cell} list="mouvements" value={h.move} onChange={(e) => edit(h.id, { move: e.target.value })} /></td>
                  <td className="w-24"><input className={cell} placeholder="35 mm" value={h.lens} onChange={(e) => edit(h.id, { lens: e.target.value })} /></td>
                  <td className="w-24"><input className={cell} placeholder="Cam 1" value={h.camera} onChange={(e) => edit(h.id, { camera: e.target.value })} /></td>
                  <td className="min-w-64"><textarea className={`${cell} min-h-9`} value={h.description} onChange={(e) => edit(h.id, { description: e.target.value })} /></td>
                  <td className="min-w-40"><textarea className={`${cell} min-h-9`} value={h.notes} onChange={(e) => edit(h.id, { notes: e.target.value })} /></td>
                  <td className="whitespace-nowrap px-1 text-sm">
                    <button title="Dépouillement du plan" onClick={() => setOpen(open === h.id ? null : h.id)}
                      className={`mr-1 rounded px-1.5 text-xs ${open === h.id ? 'bg-[#FFD369] font-semibold' : 'bg-neutral-100 hover:bg-neutral-200'}`}>Dép.{shotItems(h) ? ` (${shotItems(h)})` : ''}</button>
                    <button title="Monter" disabled={!i} onClick={() => swap(i, i - 1)} className="px-1 disabled:opacity-30">↑</button>
                    <button title="Descendre" disabled={i === shots.length - 1} onClick={() => swap(i, i + 1)} className="px-1 disabled:opacity-30">↓</button>
                    <button title="Supprimer" onClick={() => set(shots.filter((x) => x.id !== h.id))} className="px-1 text-red-700">✕</button>
                  </td>
                </tr>
                {open === h.id && (
                  <tr className="bg-neutral-50"><td colSpan={8} className="px-3 py-3">
                    <div className="mb-2 flex items-center gap-3">
                      <b className="text-sm">Dépouillement du plan {shotNumber(scene, i)}</b>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => analyse(h)}>{busy ? 'Analyse…' : 'Dépouiller ce plan (IA)'}</Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {CATEGORIES.map((c) => (
                        <label key={c.key} className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">{c.label}</span>
                          <textarea className="min-h-14 w-full rounded border border-neutral-300 bg-white p-1.5 text-sm" placeholder="Un élément par ligne"
                            value={shotCats(h)[c.key].join('\n')}
                            onChange={(e) => edit(h.id, { categories: { ...shotCats(h), [c.key]: e.target.value.split('\n') } })}
                            onBlur={(e) => edit(h.id, { categories: { ...shotCats(h), [c.key]: lines(e.target.value) } })} />
                        </label>
                      ))}
                    </div>
                  </td></tr>
                )}
                </Fragment>
              ))}
              {!shots.length && <tr><td colSpan={8} className="px-3 py-4 text-sm text-neutral-500">Aucun plan. Ajoutez-en un, ou créez-les depuis les caméras de la vue du dessus.</td></tr>}
            </tbody>
          </table>
        </div>
        {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        <datalist id="tailles">{SIZES.map((s) => <option key={s} value={s} />)}</datalist>
        <datalist id="mouvements">{MOVES.map((m) => <option key={m} value={m} />)}</datalist>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => set([...shots, emptyShot()])}>+ Ajouter un plan</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={propose}>{busy ? 'Analyse…' : 'Proposer un découpage (IA)'}</Button>
          <Button variant="outline" size="sm" disabled={!fromCams.length} onClick={() => set([...shots, ...fromCams])}>
            Créer depuis les caméras du plan ({fromCams.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
