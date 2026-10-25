import type { Project, Scene } from '../types';
import { PlanScene } from './PlanScene';

export function DessusView({ project, sceneId, onSelect, updateScene }: {
  project: Project; sceneId: string | null; onSelect: (id: string) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const sorted = [...project.scenes].sort((a, b) => a.number - b.number);
  const scene = sorted.find((s) => s.id === sceneId) ?? sorted[0];
  if (!scene) return <p className="text-sm text-neutral-500">Importez d'abord un scénario.</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      <nav className="max-h-[75vh] space-y-1 overflow-y-auto">
        {sorted.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${s.id === scene.id ? 'bg-[#FFD369] font-semibold' : 'hover:bg-neutral-200'}`}>
            {s.number} · {s.decor}{s.plan?.length ? ' ✎' : ''}
          </button>
        ))}
      </nav>
      <div className="space-y-3">
        <h2 className="font-serif text-xl italic">Séquence {scene.number} · {scene.decor} · {scene.ie} · {scene.effect}</h2>
        <details className="text-sm"><summary className="cursor-pointer text-neutral-600">Texte de la séquence</summary><pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs">{scene.text}</pre></details>
        <PlanScene key={scene.id} project={project} scene={scene} updateScene={updateScene} />
      </div>
    </div>
  );
}
