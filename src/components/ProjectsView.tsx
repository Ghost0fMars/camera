import { useEffect, useRef, useState } from 'react';
import { Download, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { card } from './card';
import { normalize, type Entry } from '../lib/useProject';
import type { Project } from '../types';

const count = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const date = (at: number) => new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const name = (p: Project) => p.title.trim() || 'Sans titre';

/** Lit un fichier .json exporté par Caméra (ou un projet nu) ; refuse tout ce qui n'a pas de séquences. */
export async function readProjectFile(file: File): Promise<Project> {
  let raw: { project?: Project } & Partial<Project>;
  try { raw = JSON.parse(await file.text()); } catch { throw new Error('Ce fichier n\'est pas un projet Caméra (JSON illisible).'); }
  const p = raw.project ?? raw;
  if (!Array.isArray(p.scenes)) throw new Error('Ce fichier n\'est pas un projet Caméra (aucune séquence trouvée).');
  return normalize(p);
}

function download(p: Project) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'camera', version: 1, project: p }, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${name(p).replace(/[^\p{L}\p{N}]+/gu, '-')}.camera.json` });
  a.click();
  URL.revokeObjectURL(url);
}

export function ProjectsView({ projects, activeId, onCreate, onOpen, onRemove, onRestore, onImport }: {
  projects: Entry[]; activeId: string | null;
  onCreate: () => void; onOpen: (id: string) => void; onRemove: (id: string) => void;
  onRestore: (e: Entry, index: number) => void; onImport: (p: Project) => void;
}) {
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [undo, setUndo] = useState<{ entry: Entry; index: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const startTimer = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setUndo(null), 12000); };

  const remove = (e: Entry, index: number) => { onRemove(e.id); setUndo({ entry: e, index }); startTimer(); };
  const pick = async (file: File | undefined) => {
    if (!file) return;
    try { const p = await readProjectFile(file); onImport(p); setMsg({ text: `Projet « ${name(p)} » importé.` }); }
    catch (e) { setMsg({ text: (e as Error).message, error: true }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-neutral-300 pb-4">
        <div className="mr-auto">
          <h2 className="font-serif text-2xl italic">Mes projets</h2>
          <p className="text-sm text-neutral-600">Retrouvez vos projets de tournage sauvegardés sur cet appareil.</p>
        </div>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-400 bg-white px-3 text-sm font-medium hover:bg-neutral-100 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[#222831] pointer-coarse:h-11">
          <Upload className="size-4" aria-hidden />Importer
          <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <Button size="sm" className="bg-[#222831] text-white hover:bg-[#393E46] pointer-coarse:h-11" onClick={onCreate}><Plus className="size-4" aria-hidden />Nouveau projet</Button>
      </div>

      <div role="status" aria-live="polite" className="space-y-2 empty:hidden">
        {msg && <p className={`rounded border px-3 py-2 text-sm ${msg.error ? 'border-red-300 bg-red-50 text-red-800' : 'border-neutral-300 bg-white text-neutral-800'}`}>{msg.text}</p>}
        {undo && (
          <p data-dark onMouseEnter={() => clearTimeout(timer.current)} onFocus={() => clearTimeout(timer.current)} onMouseLeave={startTimer} onBlur={startTimer}
            className="flex flex-wrap items-center gap-3 rounded border border-neutral-700 bg-[#222831] px-3 py-2 text-sm text-white">
            <span>Projet « {name(undo.entry.project)} » supprimé.</span>
            <button onClick={() => { onRestore(undo.entry, undo.index); setUndo(null); }} className="font-semibold underline underline-offset-2">Annuler</button>
          </p>
        )}
      </div>

      {projects.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-3 py-12 text-center`}>
          <FolderOpen className="size-10 text-neutral-500" aria-hidden />
          <h3 className="font-serif text-xl italic">Aucun projet</h3>
          <p className="max-w-sm text-sm text-neutral-700">Créez un projet pour importer un scénario et préparer le tournage, ou importez un projet exporté depuis Caméra.</p>
          <Button size="sm" className="bg-[#222831] text-white hover:bg-[#393E46]" onClick={onCreate}><Plus className="size-4" aria-hidden />Commencer</Button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((e, i) => {
            const p = e.project;
            const shots = p.scenes.reduce((n, s) => n + (s.shots?.length ?? 0), 0);
            return (
              <li key={e.id} className={`${card} flex flex-col gap-3`}>
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-lg italic" title={name(p)}>{name(p)}</h3>
                  <p className="truncate text-sm text-neutral-600">{p.director.trim() || 'Réalisation non renseignée'}</p>
                </div>
                <p className="text-sm text-neutral-700">{count(p.scenes.length, 'séquence')} · {count(shots, 'plan')}<br /><span className="text-xs text-neutral-600">Modifié le {date(e.at)}</span></p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="pointer-coarse:h-11" onClick={() => onOpen(e.id)}>{e.id === activeId ? 'Reprendre' : 'Ouvrir'}</Button>
                  {e.id === activeId && <span className="rounded border border-neutral-700 px-1.5 text-xs">Ouvert</span>}
                  <span className="ml-auto flex items-center gap-0.5">
                    <button aria-label={`Exporter « ${name(p)} »`} title="Exporter (JSON)" onClick={() => download(p)}
                      className="inline-flex size-9 items-center justify-center rounded border border-transparent text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 pointer-coarse:size-11"><Download className="size-4" aria-hidden /></button>
                    <button aria-label={`Supprimer « ${name(p)} »`} title="Supprimer" onClick={() => remove(e, i)}
                      className="inline-flex size-9 items-center justify-center rounded border border-transparent text-red-800 hover:border-red-300 hover:bg-red-50 pointer-coarse:size-11"><Trash2 className="size-4" aria-hidden /></button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
