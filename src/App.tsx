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
    <div className="min-h-screen bg-[#EEEEEE] text-[#222831]">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#222831] px-5 py-3 text-white">
        <h1 className="font-serif text-xl italic text-[#FFD369]">Caméra</h1>
        <nav className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1.5 text-xs uppercase tracking-widest ${tab === t.id ? 'bg-[#FFD369] font-bold text-[#222831]' : 'hover:bg-white/10'}`}>{t.label}</button>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black"
            disabled={!ready} onClick={() => run(() => exportDepouillement(project))}>Exporter le dépouillement</Button>
          <Button variant="outline" size="sm" className="border-white/40 bg-transparent text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black"
            disabled={!ready || !project.days.length} onClick={() => run(() => exportPlanTravail(project))}>Exporter le plan de travail</Button>
        </div>
      </header>
      <main className="p-5">
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
