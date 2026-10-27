import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { card, L } from './card';
import { FrameAnalysis } from './FrameAnalysis';
import { ShotGlyph } from './ShotGlyph';
import { adviseScene, analyseShot, proposeShots, shotPrompt } from '../lib/ai';
import { addSpent, falModel, fmtUsd, generateShotImage, getFalKey, getImgModel, imagesCost } from '../lib/fal';
import { emptyShot, shotCats, shotItems, shotNumber, shotsFromCameras } from '../lib/shots';
import { CATEGORIES, MOVES, SIZES, SIZE_NAMES, type CategoryKey, type Project, type Scene, type Shot } from '../types';

const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);
const plural = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const field = 'w-full rounded border border-neutral-400 bg-white px-2 py-1.5 text-sm placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#222831]';
const label = 'mb-1 block text-xs font-medium text-neutral-700';
const iconBtn = 'inline-flex size-9 items-center justify-center rounded border border-transparent text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-30 pointer-coarse:size-11';
const primary = 'bg-[#222831] text-white hover:bg-[#393E46]';

type Note = { text: string; error?: boolean; retry?: () => void };
type Undo = { text: string; restore: () => void };

export function DecoupageView({ project, sceneId, onSelect, updateScene }: {
  project: Project; sceneId: string | null; onSelect: (id: string) => void; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [falKey] = useState(getFalKey);
  const [imgModel] = useState(getImgModel);
  const [progress, setProgress] = useState('');
  const stop = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sorted = [...project.scenes].sort((a, b) => a.number - b.number);
  const scene = sorted.find((s) => s.id === sceneId) ?? sorted[0];
  const shots = scene?.shots ?? [];
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!scene) return <p className="text-sm text-neutral-600">Importez d'abord un scénario.</p>;

  const set = (next: Shot[]) => updateScene(scene.id, { shots: next });
  const edit = (id: string, patch: Partial<Shot>) => set(shotsRef.current.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const swap = (i: number, j: number) => { const n = [...shots]; [n[i], n[j]] = [n[j], n[i]]; set(n); };
  const startTimer = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setUndo(null), 12000); };
  const offerUndo = (u: Undo) => { setUndo(u); startTimer(); };
  const closeMenu = (e: { currentTarget: HTMLElement }) => { (e.currentTarget.closest('details') as HTMLDetailsElement).open = false; };
  const busyText = busy === 'advise' ? 'Conseils de mise en scène en cours…' : busy === 'propose' ? 'Proposition de découpage en cours…' : busy?.startsWith('dep:') ? 'Dépouillement du plan en cours…' : busy?.startsWith('prompt:') ? 'Rédaction du prompt en cours…' : busy?.startsWith('img:') ? 'Génération de l\'image en cours (quelques secondes)…' : busy === 'batch' ? `Génération en cours : ${progress}` : '';
  const roles = project.roles.map((r) => r.name);

  const fromCams = shotsFromCameras(scene);
  const run = async (key: string, task: () => Promise<string | void>) => {
    setBusy(key); setNote(null);
    try { const text = await task(); if (text) setNote({ text }); }
    catch (e) { setNote({ text: (e as Error).message, error: true, retry: () => void run(key, task) }); }
    setBusy(null);
  };

  const remove = (h: Shot, i: number) => {
    set(shots.filter((x) => x.id !== h.id));
    offerUndo({ text: `Plan ${shotNumber(scene, i)} supprimé.`, restore: () => { const n = [...shotsRef.current]; n.splice(Math.min(i, n.length), 0, h); set(n); } });
  };
  const propose = () => run('propose', async () => {
    const added = await proposeShots(scene, roles, project.scenes);
    set([...shotsRef.current, ...added]);
    const ids = new Set(added.map((a) => a.id));
    offerUndo({ text: `${plural(added.length, 'plan')} proposé${added.length > 1 ? 's' : ''} par l'IA.`, restore: () => set(shotsRef.current.filter((x) => !ids.has(x.id))) });
  });
  const advise = () => run('advise', async () => {
    const before = scene.advice;
    updateScene(scene.id, { advice: await adviseScene(scene, roles, project.scenes) });
    if (before) offerUndo({ text: 'Conseils remplacés.', restore: () => updateScene(scene.id, { advice: before }) });
  });
  const analyse = (h: Shot) => run(`dep:${h.id}`, async () => {
    edit(h.id, { categories: await analyseShot(scene, h, roles) });
    return 'Proposition de l\'IA ajoutée dans les rubriques vides ; vos saisies sont conservées.';
  });
  const fromCameras = () => {
    const added = fromCams;
    set([...shots, ...added]);
    const ids = new Set(added.map((a) => a.id));
    offerUndo({ text: `${plural(added.length, 'plan')} créé${added.length > 1 ? 's' : ''} depuis les caméras.`, restore: () => set(shotsRef.current.filter((x) => !ids.has(x.id))) });
  };
  const writePrompt = (h: Shot) => run(`prompt:${h.id}`, async () => {
    const before = h.prompt;
    edit(h.id, { prompt: await shotPrompt(scene, h, roles) });
    if (before) offerUndo({ text: 'Prompt remplacé.', restore: () => edit(h.id, { prompt: before }) });
  });
  /** Image d'un plan ; le prompt est rédigé d'abord (gratuit, via Albert) s'il n'existe pas encore. */
  const makeImage = (h: Shot) => run(`img:${h.id}`, async () => {
    const before = h.image;
    const prompt = h.prompt?.trim() ? h.prompt : await shotPrompt(scene, h, roles);
    if (!h.prompt?.trim()) edit(h.id, { prompt });
    const url = await generateShotImage(prompt, imgModel, falKey.trim());
    edit(h.id, { image: { url, model: imgModel, at: Date.now() } });
    addSpent(falModel(imgModel).usdPerImage);
    if (before) offerUndo({ text: 'Image remplacée.', restore: () => edit(h.id, { image: before }) });
  });

  /** Génère, l'une après l'autre, l'image de chaque plan décrit et sans image des séquences données. Le coût est confirmé avant de partir ; un échec arrête le lot sans perdre les images déjà faites. */
  const generateBatch = (targets: Scene[], what: string) => run('batch', async () => {
    const jobs = targets.flatMap((s) => (s.shots ?? []).filter((h) => h.description.trim() && !h.image).map((h) => ({ s, h })));
    if (!jobs.length) return 'Rien à générer : tous les plans décrits ont déjà une image (les plans sans description sont ignorés).';
    const cost = imagesCost(jobs.length, imgModel);
    if (!window.confirm(`Générer ${plural(jobs.length, 'image')} pour ${what} avec « ${falModel(imgModel).label} » ?\nCoût estimé : ${fmtUsd(cost)}, facturé sur votre compte fal.ai.`)) return;
    stop.current = false;
    const shotsOf = new Map(targets.map((s) => [s.id, [...(s.shots ?? [])]]));
    const patch = (sid: string, id: string, p: Partial<Shot>) => {
      const next = (shotsOf.get(sid) ?? []).map((x) => (x.id === id ? { ...x, ...p } : x));
      shotsOf.set(sid, next);
      updateScene(sid, { shots: next });
    };
    let done = 0;
    try {
      for (const { s, h } of jobs) {
        if (stop.current) break;
        setProgress(`image ${done + 1} sur ${jobs.length}…`);
        const prompt = h.prompt?.trim() ? h.prompt : await shotPrompt(s, h, roles);
        if (!h.prompt?.trim()) patch(s.id, h.id, { prompt });
        const url = await generateShotImage(prompt, imgModel, falKey.trim());
        patch(s.id, h.id, { image: { url, model: imgModel, at: Date.now() } });
        addSpent(falModel(imgModel).usdPerImage);
        done += 1;
      }
    } catch (e) {
      setNote({ text: `${(e as Error).message} Lot interrompu : ${plural(done, 'image')} générée${done > 1 ? 's' : ''} sur ${jobs.length}. Relancez pour continuer avec les plans restants.`, error: true });
      return;
    }
    return stop.current ? `Lot arrêté : ${plural(done, 'image')} générée${done > 1 ? 's' : ''} sur ${jobs.length}.` : `${plural(done, 'image')} générée${done > 1 ? 's' : ''}.`;
  });
  const batchReady = !!falKey.trim();
  const copy = async (h: Shot) => {
    try { await navigator.clipboard.writeText(h.prompt ?? ''); setCopied(h.id); setTimeout(() => setCopied(null), 2000); }
    catch { setNote({ text: 'Copie impossible : sélectionnez le texte et copiez-le à la main.', error: true }); }
  };
  const dropIa = () => {
    const removed = shots.flatMap((h, i) => (h.origin === 'ia' ? [{ h, i }] : []));
    set(shots.filter((h) => h.origin !== 'ia'));
    offerUndo({ text: `${plural(removed.length, 'plan')} proposé${removed.length > 1 ? 's' : ''} par l'IA retiré${removed.length > 1 ? 's' : ''}.`, restore: () => { const n = [...shotsRef.current]; removed.forEach(({ h, i }) => n.splice(Math.min(i, n.length), 0, h)); set(n); } });
  };

  const iaCount = shots.filter((h) => h.origin === 'ia').length;
  const anyBusy = busy !== null;

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Séquences" className="flex gap-1 overflow-x-auto pb-1 lg:block lg:max-h-[75vh] lg:space-y-1 lg:overflow-y-auto lg:pb-0">
        {sorted.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)} aria-current={s.id === scene.id ? 'true' : undefined}
            className={`block shrink-0 whitespace-nowrap rounded px-3 py-2 text-left text-sm lg:w-full lg:whitespace-normal ${s.id === scene.id ? 'bg-[#FFD369] font-semibold' : 'hover:bg-neutral-200'}`}>
            {s.number} · {s.decor}{s.shots?.length ? ` (${s.shots.length})` : ''}
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        <h2 className="font-serif text-xl italic">Séquence {scene.number} · {scene.decor} · {scene.ie} · {scene.effect}</h2>

        <details key={scene.id} open={!!scene.advice} className={`${card} text-sm`}>
          <summary className="cursor-pointer font-semibold">Outils de la séquence <span className="font-normal text-neutral-600">· texte, conseils de mise en scène (Eisenstein, intégrale dramatique)</span></summary>
          <div className="mt-3 space-y-3">
            <div>
              <L>Texte de la séquence</L>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-300 bg-white p-3 font-mono text-xs">{scene.text}</pre>
            </div>
            <div className="space-y-2 border-t border-neutral-300 pt-3">
              <L>Assistance à la mise en scène</L>
              <Button variant="outline" size="sm" disabled={anyBusy} onClick={advise}>{scene.advice ? 'Régénérer les conseils' : 'Conseils de mise en scène (IA)'}</Button>
              {scene.advice !== undefined && (
                <textarea aria-label="Conseils de mise en scène" className={`${field} min-h-40`} placeholder="Les conseils de l'IA apparaissent ici ; vous pouvez les modifier."
                  value={scene.advice} onChange={(e) => updateScene(scene.id, { advice: e.target.value })} />
              )}
            </div>
          </div>
        </details>

        <section aria-labelledby="plans" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="plans" className="mr-auto text-base font-semibold">Plans de la séquence · {shots.length}</h3>
            <Button size="sm" className={primary} onClick={() => set([...shots, emptyShot()])}>+ Ajouter un plan</Button>
            <details className="relative">
              <summary className="inline-flex h-7 cursor-pointer list-none items-center gap-1 rounded-md border border-neutral-400 bg-white px-2.5 text-sm font-medium hover:bg-neutral-100 pointer-coarse:h-11">Plus d'actions <ChevronDown className="size-4" aria-hidden /></summary>
              <div className="absolute right-0 top-full z-10 mt-1 flex w-80 max-w-[85vw] flex-col gap-2 rounded border border-neutral-300 bg-white p-3 shadow-md">
                <Button variant="outline" size="sm" className="justify-start" disabled={anyBusy} onClick={(e) => { closeMenu(e); void propose(); }}>Proposer un découpage (IA)</Button>
                <p className="text-xs text-neutral-600">Les plans proposés s'ajoutent à la suite de votre liste ; vous les gardez ou les retirez.</p>
                <Button variant="outline" size="sm" className="justify-start" disabled={!fromCams.length} onClick={(e) => { closeMenu(e); fromCameras(); }}>Un plan par caméra du plan de scène ({fromCams.length})</Button>
                {!fromCams.length && <p className="text-xs text-neutral-600">Pour créer des plans depuis les caméras, posez-en dans la vue du dessus.</p>}
                <div className="space-y-2 border-t border-neutral-300 pt-2">
                  <Button variant="outline" size="sm" className="justify-start" disabled={anyBusy || !batchReady || !shots.some((h) => h.description.trim() && !h.image)}
                    onClick={(e) => { closeMenu(e); void generateBatch([scene], `la séquence ${scene.number}`); }}>Générer les images de la séquence</Button>
                  <Button variant="outline" size="sm" className="justify-start" disabled={anyBusy || !batchReady}
                    onClick={(e) => { closeMenu(e); void generateBatch(sorted, 'tout le film'); }}>Générer les images de tout le film</Button>
                  <p className="text-xs text-neutral-600">{batchReady ? `Une image par plan décrit et sans image, avec « ${falModel(imgModel).label} ». Le coût est confirmé avant le départ.` : 'Saisissez votre clé fal.ai dans Production › Images des plans.'}</p>
                </div>
              </div>
            </details>
          </div>

          <div role="status" aria-live="polite" className="space-y-2 empty:hidden">
            {busyText && (
              <p className="flex flex-wrap items-center gap-3 rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800">
                <span>{busyText}</span>
                {busy === 'batch' && <button onClick={() => { stop.current = true; }} className="font-semibold underline underline-offset-2">Arrêter après l'image en cours</button>}
              </p>
            )}
            {note && (
              <p className={`flex flex-wrap items-center gap-3 rounded border px-3 py-2 text-sm ${note.error ? 'border-red-300 bg-red-50 text-red-800' : 'border-neutral-300 bg-white text-neutral-800'}`}>
                <span>{note.text}</span>
                {note.retry && <button onClick={note.retry} className="font-semibold underline underline-offset-2">Réessayer</button>}
              </p>
            )}
            {undo && (
              <p data-dark onMouseEnter={() => clearTimeout(timer.current)} onFocus={() => clearTimeout(timer.current)} onMouseLeave={startTimer} onBlur={startTimer}
                className="flex flex-wrap items-center gap-3 rounded border border-neutral-700 bg-[#222831] px-3 py-2 text-sm text-white">
                <span>{undo.text}</span>
                <button onClick={() => { undo.restore(); setUndo(null); }} className="font-semibold underline underline-offset-2">Annuler</button>
              </p>
            )}
          </div>

          {iaCount > 0 && (
            <p className="flex flex-wrap items-center gap-3 text-sm">
              <span>{plural(iaCount, 'plan')} proposé{iaCount > 1 ? 's' : ''} par l'IA, pas encore gardé{iaCount > 1 ? 's' : ''}.</span>
              <button onClick={() => set(shots.map((h) => ({ ...h, origin: undefined })))} className="px-1 py-1.5 font-semibold underline underline-offset-2 pointer-coarse:min-h-11">Tout garder</button>
              <button onClick={dropIa} className="px-1 py-1.5 font-semibold text-red-800 underline underline-offset-2 pointer-coarse:min-h-11">Tout retirer</button>
            </p>
          )}

          {shots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-400 px-4 py-6 text-sm text-neutral-700">
              Aucun plan pour cette séquence. Ajoutez-en un, demandez une proposition à l'IA, ou créez-les depuis les caméras de la vue du dessus.
            </div>
          ) : (
            <ol className="space-y-3">
              {shots.map((h, i) => {
                const n = shotNumber(scene, i);
                const items = shotItems(h);
                return (
                  <li key={h.id} className="overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
                      <span className="text-sm font-semibold">Plan {n}</span>
                      {h.origin === 'ia' ? (
                        <>
                          <span className="rounded border border-neutral-700 px-1.5 text-xs">Proposé par l'IA</span>
                          <button onClick={() => edit(h.id, { origin: undefined })} className="px-1 py-1.5 text-xs font-semibold underline underline-offset-2 pointer-coarse:min-h-11">Garder</button>
                        </>
                      ) : !h.description.trim() && <span className="text-xs text-neutral-600">À décrire</span>}
                      <span className="ml-auto flex items-center gap-0.5">
                        <button aria-label={`Monter le plan ${n}`} title="Monter" disabled={!i} onClick={() => swap(i, i - 1)} className={iconBtn}><ChevronUp className="size-4" aria-hidden /></button>
                        <button aria-label={`Descendre le plan ${n}`} title="Descendre" disabled={i === shots.length - 1} onClick={() => swap(i, i + 1)} className={iconBtn}><ChevronDown className="size-4" aria-hidden /></button>
                        <span className="mx-1 h-5 w-px bg-neutral-300" aria-hidden />
                        <button aria-label={`Supprimer le plan ${n}`} title="Supprimer" onClick={() => remove(h, i)} className={`${iconBtn} text-red-800 hover:border-red-300 hover:bg-red-50`}><Trash2 className="size-4" aria-hidden /></button>
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 p-3 sm:flex-row">
                      <div className="w-36 shrink-0"><ShotGlyph shot={h} /></div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                          <label><span className={label}>Taille</span>
                            <select className={field} value={h.size} onChange={(e) => edit(h.id, { size: e.target.value })}>
                              <option value="">—</option>
                              {h.size && !(SIZES as readonly string[]).includes(h.size) && <option value={h.size}>{h.size}</option>}
                              {SIZES.map((s) => <option key={s} value={s}>{s} · {SIZE_NAMES[s]}</option>)}
                            </select>
                          </label>
                          <label><span className={label}>Mouvement</span><input className={field} list="mouvements" placeholder="Fixe" value={h.move} onChange={(e) => edit(h.id, { move: e.target.value })} /></label>
                          <label><span className={label}>Optique</span><input className={field} placeholder="35 mm" value={h.lens} onChange={(e) => edit(h.id, { lens: e.target.value })} /></label>
                          <label><span className={label}>Caméra</span><input className={field} placeholder="Cam 1" value={h.camera} onChange={(e) => edit(h.id, { camera: e.target.value })} /></label>
                          <label><span className={label}>Durée</span><input className={field} placeholder="8 s" value={h.duration ?? ''} onChange={(e) => edit(h.id, { duration: e.target.value })} /></label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label><span className={label}>Description</span><textarea className={`${field} field-sizing-content min-h-16 resize-none`} value={h.description} onChange={(e) => edit(h.id, { description: e.target.value })} /></label>
                          <label><span className={label}>Notes</span><textarea className={`${field} field-sizing-content min-h-16 resize-none`} value={h.notes} onChange={(e) => edit(h.id, { notes: e.target.value })} /></label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-neutral-200 px-3 py-2">
                      {([
                        ['image', `Image et prompt${h.image ? ' · image' : h.prompt ? ' · prompt' : ''}`],
                        ['cadre', `Analyse du cadre${h.frame ? ' · image analysée' : ''}`],
                        ['dep', `Dépouillement du plan${items ? ` · ${plural(items, 'élément')}` : ''}`],
                      ] as const).map(([kind, text]) => {
                        const k = `${kind}:${h.id}`;
                        return (
                          <button key={kind} aria-expanded={panel === k} aria-controls={`${kind}-${h.id}`} onClick={() => setPanel(panel === k ? null : k)}
                            className="inline-flex min-h-9 items-center gap-1 rounded border border-neutral-400 px-2.5 text-sm hover:bg-neutral-100 pointer-coarse:min-h-11">
                            {panel === k ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
                            {text}
                          </button>
                        );
                      })}
                      {busy === `img:${h.id}` && <span role="status" className="self-center text-sm text-neutral-700">Génération de l'image en cours…</span>}
                    </div>

                    {panel === `image:${h.id}` && (
                      <div id={`image-${h.id}`} className="space-y-3 border-t border-neutral-200 bg-neutral-50 px-3 py-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" size="sm" disabled={anyBusy || !h.description.trim()} onClick={() => writePrompt(h)}>{h.prompt ? 'Régénérer le prompt' : 'Rédiger le prompt (IA)'}</Button>
                            {h.prompt && <Button variant="outline" size="sm" onClick={() => void copy(h)}>{copied === h.id ? 'Copié' : 'Copier'}</Button>}
                            <span className="text-xs text-neutral-600">{h.description.trim() ? "Gratuit. En anglais, prêt à coller dans un générateur d'images ou de vidéos." : "Décrivez d'abord le plan."}</span>
                          </div>
                          {h.prompt !== undefined && (
                            <label className="block"><span className={label}>Prompt</span>
                              <textarea className={`${field} field-sizing-content min-h-24 resize-none`} value={h.prompt} onChange={(e) => edit(h.id, { prompt: e.target.value })} /></label>
                          )}
                        </div>
                        <div className="space-y-2 border-t border-neutral-200 pt-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Button size="sm" className={primary} disabled={anyBusy || !falKey.trim() || !h.description.trim()} onClick={() => makeImage(h)}>
                              {h.image ? "Régénérer l'image" : "Générer l'image"} · ≈ {fmtUsd(falModel(imgModel).usdPerImage)}
                            </Button>
                            <span className="text-xs text-neutral-600">{!falKey.trim() ? 'Saisissez votre clé fal.ai dans Production › Images des plans.' : !h.description.trim() ? "Décrivez d'abord le plan." : `Payant, facturé par fal.ai · ${falModel(imgModel).label}${h.prompt?.trim() ? '' : ' · le prompt sera rédigé automatiquement'}`}</span>
                          </div>
                          {h.image && (
                            <p className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                              <a href={h.image.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Ouvrir en grand pour l'enregistrer</a>
                              <button onClick={() => { const before = h.image; edit(h.id, { image: undefined }); offerUndo({ text: `Image du plan ${n} retirée.`, restore: () => edit(h.id, { image: before }) }); }} className="px-1 py-1.5 font-semibold underline underline-offset-2 pointer-coarse:min-h-11">Retirer</button>
                              <span>L'adresse de l'image est temporaire : enregistrez-la pour la garder.</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {panel === `cadre:${h.id}` && <div id={`cadre-${h.id}`} className="border-t border-neutral-200 bg-neutral-50 px-3 py-3"><FrameAnalysis shot={h} edit={(patch) => edit(h.id, patch)} /></div>}
                    {panel === `dep:${h.id}` && (
                      <div id={`dep-${h.id}`} className="border-t border-neutral-200 bg-neutral-50 px-3 py-3">
                        <Breakdown shot={h} busy={busy === `dep:${h.id}`} disabled={anyBusy} onAi={() => analyse(h)} onChange={(categories) => edit(h.id, { categories })} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

        </section>

        <datalist id="mouvements">{MOVES.map((m) => <option key={m} value={m} />)}</datalist>
      </div>
    </div>
  );
}

/** Dépouillement d'un plan : seules les rubriques remplies (ou ajoutées) sont affichées. */
function Breakdown({ shot, busy, disabled, onAi, onChange }: {
  shot: Shot; busy: boolean; disabled: boolean; onAi: () => void; onChange: (c: ReturnType<typeof shotCats>) => void;
}) {
  const cats = shotCats(shot);
  const [added, setAdded] = useState<CategoryKey[]>([]);
  const shown = CATEGORIES.filter((c) => cats[c.key].length > 0 || added.includes(c.key));
  const rest = CATEGORIES.filter((c) => !shown.includes(c));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" disabled={disabled} onClick={onAi}>{busy ? 'Analyse en cours…' : 'Dépouiller ce plan (IA)'}</Button>
        {rest.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Ajouter une rubrique</span>
            <select className={`${field} w-auto`} value="" onChange={(e) => e.target.value && setAdded([...added, e.target.value as CategoryKey])}>
              <option value="">+ Ajouter une rubrique…</option>
              {rest.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </label>
        )}
      </div>
      {shown.length === 0 && <p className="text-sm text-neutral-600">Aucune rubrique remplie. Ajoutez-en une, ou laissez l'IA proposer.</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => (
          <label key={c.key} className="block">
            <span className={label}>{c.label}</span>
            <textarea className={`${field} field-sizing-content min-h-14 resize-none`} placeholder="Un élément par ligne"
              value={cats[c.key].join('\n')}
              onChange={(e) => onChange({ ...cats, [c.key]: e.target.value.split('\n') })}
              onBlur={(e) => onChange({ ...cats, [c.key]: lines(e.target.value) })} />
          </label>
        ))}
      </div>
    </div>
  );
}
