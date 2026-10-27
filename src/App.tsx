import { useState } from 'react';
import { Camera as CameraIcon, CalendarDays, ClipboardList, Clapperboard, Download, FileText, FolderOpen, LayoutGrid, ListOrdered, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportDecoupage, exportDepouillement, exportPlanTravail } from './lib/exportXlsx';
import { useProject } from './lib/useProject';
import { DecoupageView } from './components/DecoupageView';
import { DessusView } from './components/DessusView';
import { FicheView } from './components/FicheView';
import { ImportView } from './components/ImportView';
import { PlanView } from './components/PlanView';
import { ProductionView } from './components/ProductionView';
import { ProjectsView } from './components/ProjectsView';
import { SequencierView } from './components/SequencierView';

const TABS = [
  { id: 'import', label: 'Scénario', icon: FileText },
  { id: 'production', label: 'Production', icon: Users },
  { id: 'sequencier', label: 'Séquencier', icon: ListOrdered },
  { id: 'fiche', label: 'Dépouillement', icon: ClipboardList },
  { id: 'plan', label: 'Plan de travail', icon: CalendarDays },
  { id: 'dessus', label: 'Vue du dessus', icon: LayoutGrid },
  { id: 'decoupage', label: 'Découpage technique', icon: Clapperboard },
] as const;
const PROJECTS = { id: 'projets', label: 'Mes projets', icon: FolderOpen } as const;
type Tab = (typeof TABS)[number]['id'] | typeof PROJECTS.id;

export default function App() {
  const { project, update, updateScene, projects, activeId, add, open, remove, restore } = useProject();
  const [tab, setTab] = useState<Tab>('import');
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const ready = project.scenes.length > 0;

  const shotCount = project.scenes.reduce((n, s) => n + (s.shots?.length ?? 0), 0);
  const run = (f: () => Promise<void>) => f().then(() => setError(''), (e) => setError(`Export impossible : ${(e as Error).message}`));

  const exports = (
    <>
      <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest"
        disabled={!ready} onClick={() => run(() => exportDepouillement(project))}><Download size={13} className="mr-2" />Dépouillement</Button>
      <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest"
        disabled={!ready || !project.days.length} onClick={() => run(() => exportPlanTravail(project))}><Download size={13} className="mr-2" />Plan de travail</Button>
      <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest"
        disabled={!shotCount} onClick={() => run(() => exportDecoupage(project))}><Download size={13} className="mr-2" />Découpage{shotCount ? ` · ${shotCount}` : ''}</Button>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-[#222831] md:grid md:grid-cols-[13rem_1fr]">
      <aside className="hidden border-r border-[#393E46] bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-[#393E46] px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded bg-[#FFD369] text-black"><CameraIcon size={16} /></div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg italic tracking-wide">Caméra</h1>
            <p className="text-xs font-medium uppercase tracking-widest text-[#222831]/65">Préparation de tournage</p>
          </div>
        </div>
        <nav aria-label="Sections" className="flex flex-1 flex-col gap-0.5 py-2">
          <button onClick={() => setTab(PROJECTS.id)} aria-current={tab === PROJECTS.id ? 'page' : undefined}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors ${tab === PROJECTS.id ? 'bg-[#FFD369] text-[#222831]' : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]'}`}>
            <FolderOpen size={15} />{PROJECTS.label}
          </button>
          <div className="mx-4 my-1 border-t border-neutral-300" aria-hidden />
          {TABS.map((t, i) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors ${tab === t.id ? 'bg-[#FFD369] text-[#222831]' : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]'}`}>
                <span className="w-4 shrink-0 text-xs opacity-60">{i + 1}.</span><Icon size={15} />{t.label}
              </button>
            );
          })}
        </nav>
        <div className="space-y-1.5 border-t border-[#393E46] p-3">
          <p className="px-1 pb-1 text-xs font-bold uppercase tracking-widest text-[#393E46]">Exports Excel</p>
          {exports}
        </div>
      </aside>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#393E46] bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded bg-[#FFD369] text-black"><CameraIcon size={15} /></div>
          <h1 className="font-serif text-lg italic tracking-wide">Caméra</h1>
        </div>
        <select aria-label="Section" value={tab} onChange={(e) => setTab(e.target.value as Tab)}
          className="ml-auto rounded border border-[#393E46] bg-white px-2 py-2 text-sm">
          {[PROJECTS, ...TABS].map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <details className="relative w-full">
          <summary className="cursor-pointer rounded border border-[#393E46] px-3 py-2 text-sm">Exporter (Excel)</summary>
          <div className="mt-2 flex flex-col gap-1.5">{exports}</div>
        </details>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-7xl p-3 sm:p-6">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        {tab === 'projets' && (
          <ProjectsView projects={projects} activeId={activeId} onRemove={remove} onRestore={restore}
            onCreate={() => { add(); setSceneId(null); setTab('import'); }}
            onOpen={(id) => { open(id); setSceneId(null); setTab(projects.find((e) => e.id === id)?.project.scenes.length ? 'sequencier' : 'import'); }}
            onImport={(p) => add(p, false)} />
        )}
        {tab === 'import' && <ImportView project={project} update={update} onDone={() => setTab('sequencier')} />}
        {tab === 'production' && <ProductionView project={project} update={update} />}
        {tab === 'sequencier' && <SequencierView project={project} updateScene={updateScene} onOpen={(id) => { setSceneId(id); setTab('fiche'); }} />}
        {tab === 'fiche' && <FicheView project={project} sceneId={sceneId} onSelect={setSceneId} updateScene={updateScene} />}
        {tab === 'plan' && <PlanView project={project} update={update} updateScene={updateScene} />}
        {tab === 'decoupage' && <DecoupageView project={project} sceneId={sceneId} onSelect={setSceneId} updateScene={updateScene} />}
        {tab === 'dessus' && <DessusView project={project} sceneId={sceneId} onSelect={setSceneId} updateScene={updateScene} />}
      </main>
    </div>
  );
}
