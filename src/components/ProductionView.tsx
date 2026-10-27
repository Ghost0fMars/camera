import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { FAL_MODELS, fmtUsd, getFalKey, getImgModel, getSpent, imagesCost, resetSpent, setFalKey, setImgModel } from '../lib/fal';
import { allShots } from '../lib/shots';
import type { Project } from '../types';
import { card, L } from './card';

export function ProductionView({ project, update }: { project: Project; update: (p: Partial<Project>) => void }) {
  const [key, setKey] = useState(getFalKey);
  const [model, setModel] = useState<string>(getImgModel);
  const [spent, setSpent] = useState(getSpent);
  const n = allShots(project.scenes).length;
  const setActor = (name: string, actor: string) => update({ roles: project.roles.map((r) => (r.name === name ? { ...r, actor } : r)) });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className={`${card} grid gap-4 sm:grid-cols-2`}>
        <label><L>Titre du film</L><Input value={project.title} onChange={(e) => update({ title: e.target.value })} className="bg-white" /></label>
        <label><L>Réalisation</L><Input value={project.director} onChange={(e) => update({ director: e.target.value })} className="bg-white" /></label>
        <label><L>Date du jour 1 (vide = jours relatifs)</L><Input type="date" value={project.startDate} onChange={(e) => update({ startDate: e.target.value })} className="bg-white" /></label>
      </div>
      <div className={card}>
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
      <div className={`${card} space-y-3`}>
        <L>Images des plans (fal.ai)</L>
        <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-700">Votre clé fal.ai</span>
          <Input type="password" autoComplete="off" spellCheck={false} placeholder="clé fal.ai" value={key} className="bg-white"
            onChange={(e) => { setKey(e.target.value); setFalKey(e.target.value.trim()); }} /></label>
        <p className="text-xs text-neutral-600">La clé reste dans votre navigateur. Elle est envoyée au serveur de l'application à chaque génération, uniquement pour relayer l'appel à fal.ai : elle n'y est ni enregistrée ni journalisée. Chaque image est facturée par fal.ai sur votre compte.</p>
        <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-700">Modèle</span>
          <select className="w-full rounded border border-neutral-400 bg-white px-2 py-1.5 text-sm" value={model} onChange={(e) => { setModel(e.target.value); setImgModel(e.target.value); }}>
            {FAL_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label} · ≈ {fmtUsd(m.usdPerImage)} l'image</option>)}
          </select></label>
        <p className="text-sm">Tout le film ({n} plan{n > 1 ? 's' : ''}) : <b>≈ {fmtUsd(imagesCost(n, model))}</b> avec une image par plan, ≈ <b>{fmtUsd(imagesCost(n * 3, model))}</b> avec trois essais par plan.</p>
        <p className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">
          <span>Dépensé depuis cette application (estimation) : <b>{fmtUsd(spent)}</b></span>
          {spent > 0 && <button onClick={() => { resetSpent(); setSpent(0); }} className="px-1 py-1.5 font-semibold underline underline-offset-2 pointer-coarse:min-h-11">Remettre à zéro</button>}
        </p>
        <p className="text-xs text-neutral-600">Les images se génèrent depuis Découpage technique. Tarifs indicatifs relevés sur fal.ai ; le montant réel est celui de votre compte.</p>
      </div>
    </div>
  );
}
