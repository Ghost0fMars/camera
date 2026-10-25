import { Input } from '@/components/ui/input';
import type { Project } from '../types';

const L = ({ children }: { children: string }) => <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">{children}</span>;

export function ProductionView({ project, update }: { project: Project; update: (p: Partial<Project>) => void }) {
  const setActor = (name: string, actor: string) => update({ roles: project.roles.map((r) => (r.name === name ? { ...r, actor } : r)) });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label><L>Titre du film</L><Input value={project.title} onChange={(e) => update({ title: e.target.value })} className="bg-white" /></label>
        <label><L>Réalisation</L><Input value={project.director} onChange={(e) => update({ director: e.target.value })} className="bg-white" /></label>
        <label><L>Date du jour 1 (vide = jours relatifs)</L><Input type="date" value={project.startDate} onChange={(e) => update({ startDate: e.target.value })} className="bg-white" /></label>
      </div>
      <div>
        <L>Rôles et comédiens</L>
        {project.roles.length === 0 && <p className="text-sm text-neutral-500">Les personnages apparaissent après l'import du scénario.</p>}
        <div className="space-y-2">
          {project.roles.map((r) => (
            <div key={r.name} className="grid grid-cols-[10rem_1fr] items-center gap-3">
              <span className="text-sm font-medium">{r.name}</span>
              <Input value={r.actor} placeholder="Comédien (à distribuer)" onChange={(e) => setActor(r.name, e.target.value)} className="bg-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
