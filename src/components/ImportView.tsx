import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { docxToText, parseScript } from '../lib/screenplay';
import type { Project } from '../types';

export function ImportView({ project, update, onDone }: {
  project: Project; update: (p: (p: Project) => Project) => void; onDone: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const readFile = async (file: File) => {
    setError('');
    try {
      setText(/\.docx$/i.test(file.name) ? await docxToText(await file.arrayBuffer()) : await file.text());
    } catch (e) { setError((e as Error).message); }
  };

  const split = () => {
    const parsed = parseScript(text);
    if (!parsed.scenes.length) { setError('Aucun intitulé INT./EXT. trouvé : le scénario doit contenir des séquences du type « INT. CUISINE - NUIT ».'); return; }
    if (project.scenes.length && !confirm(`Remplacer les ${project.scenes.length} séquences actuelles (et leur dépouillement) ?`)) return;
    update((p) => ({
      ...p,
      title: p.title || parsed.title,
      scenes: parsed.scenes,
      days: [],
      roles: parsed.characters.map((name) => p.roles.find((r) => r.name === name) ?? { name, actor: '' }),
    }));
    onDone();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-neutral-600">
        Collez votre scénario ou ouvrez un fichier (.docx, .md, .txt, .fountain). Chaque intitulé « INT. / EXT. … » devient une séquence.
      </p>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded border border-neutral-400 px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-neutral-900 hover:text-white">
          Ouvrir un fichier
          <input type="file" accept=".docx,.md,.txt,.fountain,text/plain" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }} />
        </label>
        {project.scenes.length > 0 && <span className="text-xs text-neutral-500">{project.scenes.length} séquences déjà importées</span>}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'INT. COUR DE RÉCRÉATION - JOUR\n\nJacque regarde les enfants jouer.\n\nJACQUE\n(pensif)\nJ\'ai envie de rentrer.'}
        className="min-h-[360px] bg-white font-mono text-sm" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button onClick={split} disabled={!text.trim()}>Découper en séquences</Button>
    </div>
  );
}
