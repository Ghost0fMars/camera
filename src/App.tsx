import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportDepouillement, exportPlanTravail } from './lib/exportXlsx';
import { useProject } from './lib/useProject';
import { DecoupageView } from './components/DecoupageView';
import { DessusView } from './components/DessusView';
import { FicheView } from './components/FicheView';
import { ImportView } from './components/ImportView';
import { PlanView } from './components/PlanView';
import { ProductionView } from './components/ProductionView';
import { SequencierView } from './components/SequencierView';

const TABS = [
  { id: 'import', label: 'Scénario' },
  { id: 'production', label: 'Production' },
  { id: 'sequencier', label: 'Séquencier' },
  { id: 'fiche', label: 'Dépouillement' },
  { id: 'plan', label: 'Plan de travail' },
  { id: 'dessus', label: 'Vue du dessus' },
  { id: 'decoupage', label: 'Découpage technique' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function App() {
  const { project, update, updateScene } = useProject();
  const [tab, setTab] = useState<Tab>('import');
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const ready = project.scenes.length > 0;

  const run = (f: () => Promise<void>) => f().then(() => setError(''), (e) => setError(`Export impossible : ${(e as Error).message}`));

  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#222831] md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden bg-[#222831] p-4 text-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:overflow-y-auto">
        <h1 className="font-serif text-2xl italic text-[#FFD369]">Caméra</h1>
        <nav aria-label="Sections" className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded px-3 py-2 text-left text-xs uppercase tracking-widest ${tab === t.id ? 'bg-[#FFD369] font-bold text-[#222831]' : 'hover:bg-white/10'}`}>{t.label}</button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <p className="text-xs text-white/70">Exports Excel</p>
          <Button variant="outline" size="sm" className="justify-start border-white/40 bg-transparent text-white hover:bg-white hover:text-black"
            disabled={!ready} onClick={() => run(() => exportDepouillement(project))}>Le dépouillement</Button>
          <Button variant="outline" size="sm" className="justify-start border-white/40 bg-transparent text-white hover:bg-white hover:text-black"
            disabled={!ready || !project.days.length} onClick={() => run(() => exportPlanTravail(project))}>Le plan de travail</Button>
        </div>
      </aside>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#222831] px-4 py-3 text-white md:hidden">
        <h1 className="font-serif text-xl italic text-[#FFD369]">Caméra</h1>
        <select aria-label="Section" value={tab} onChange={(e) => setTab(e.target.value as Tab)}
          className="ml-auto rounded border border-white/40 bg-[#222831] px-2 py-2 text-sm text-white">
          {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <details className="relative w-full">
          <summary className="cursor-pointer rounded border border-white/40 px-3 py-2 text-sm">Exporter (Excel)</summary>
          <div className="mt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" className="justify-start border-white/40 bg-transparent text-white hover:bg-white hover:text-black"
              disabled={!ready} onClick={() => run(() => exportDepouillement(project))}>Le dépouillement</Button>
            <Button variant="outline" size="sm" className="justify-start border-white/40 bg-transparent text-white hover:bg-white hover:text-black"
              disabled={!ready || !project.days.length} onClick={() => run(() => exportPlanTravail(project))}>Le plan de travail</Button>
          </div>
        </details>
      </header>
      <main className="min-w-0 p-3 sm:p-5">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
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
