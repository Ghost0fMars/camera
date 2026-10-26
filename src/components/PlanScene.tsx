import { useRef, useState, type PointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import { proposePlan } from '../lib/ai';
import { angleOf, arrowHead, H, nextCamera, ownerOf, shift, W } from '../lib/plan';
import { newId } from '../lib/planning';
import type { Project, Pt, Scene, Shape } from '../types';

const TOOLS = [
  ['select', 'Déplacer'], ['pen', 'Crayon'], ['line', 'Mur / ligne'], ['rect', 'Rectangle (meuble)'],
  ['move', 'Déplacement'], ['camera', 'Caméra'], ['char', 'Personnage'], ['text', 'Texte'], ['erase', 'Gommer'],
] as const;
type Tool = (typeof TOOLS)[number][0];
type Draft = { tool: 'pen' | 'move'; pts: Pt[] } | { tool: 'line' | 'rect' | 'camera'; a: Pt; b: Pt };

const COLORS = ['#c0392b', '#2471a3', '#1e8449', '#b9770e', '#7d3c98', '#17202a'];
const pts2 = (p: Pt[]) => p.map((q) => `${q.x},${q.y}`).join(' ');

export function PlanScene({ project, scene, updateScene }: {
  project: Project; scene: Scene; updateScene: (id: string, patch: Partial<Scene>) => void;
}) {
  const [tool, setTool] = useState<Tool>('pen');
  const [who, setWho] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; last: Pt } | null>(null);
  const plan = scene.plan ?? [];
  const set = (p: Shape[]) => updateScene(scene.id, { plan: p });
  const name = who || scene.roles[0] || 'Perso';
  const colorOf = (n?: string) => (n?.startsWith('Cam ') ? '#b9770e' : n ? COLORS[Math.max(0, project.roles.findIndex((r) => r.name === n)) % COLORS.length] : '#c0392b');
  const cams = plan.flatMap((s) => (s.kind === 'camera' ? [s.label] : []));

  const at = (e: PointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return { x: Math.round(((e.clientX - r.left) / r.width) * W), y: Math.round(((e.clientY - r.top) / r.height) * H) };
  };

  const iaCount = plan.filter((s) => s.origin === 'ia').length;
  const propose = async () => {
    setBusy(true); setError('');
    try {
      const added = await proposePlan(scene, project.roles.map((r) => r.name));
      updateScene(scene.id, { plan: [...(scene.plan ?? []), ...added] });
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const exportPng = () => {
    const c = svg.current!.cloneNode(true) as SVGSVGElement;
    c.removeAttribute('style'); c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('width', String(W * 2)); c.setAttribute('height', String(H * 2)); c.setAttribute('font-family', 'sans-serif');
    c.insertAdjacentHTML('afterbegin', `<rect width="${W}" height="${H}" fill="#fff"/>`);
    const img = new Image();
    img.onload = () => {
      const cv = Object.assign(document.createElement('canvas'), { width: W * 2, height: H * 2 });
      cv.getContext('2d')!.drawImage(img, 0, 0);
      cv.toBlob((b) => Object.assign(document.createElement('a'), { href: URL.createObjectURL(b!), download: `plan-seq-${scene.number}.png` }).click());
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(c))}`;
  };

  const hit = (e: PointerEvent, s: Shape) => {
    if (tool === 'erase') { e.stopPropagation(); set(plan.filter((x) => x.id !== s.id)); }
    else if (tool === 'select') { e.stopPropagation(); (e.currentTarget as Element).setPointerCapture?.(e.pointerId); drag.current = { id: s.id, last: at(e) }; }
  };

  const down = (e: PointerEvent) => {
    const p = at(e);
    if (tool === 'pen' || tool === 'move') setDraft({ tool, pts: [p] });
    else if (tool === 'line' || tool === 'rect' || tool === 'camera') setDraft({ tool, a: p, b: p });
    else if (tool === 'char') set([...plan, { id: newId('p'), kind: 'char', at: p, name }]);
    else if (tool === 'text') { const text = window.prompt('Texte'); if (text) set([...plan, { id: newId('p'), kind: 'text', at: p, text }]); }
    svg.current?.setPointerCapture(e.pointerId);
  };

  const moveEv = (e: PointerEvent) => {
    const p = at(e);
    if (drag.current) {
      const { id, last } = drag.current;
      drag.current = { id, last: p };
      set(plan.map((s) => (s.id === id ? shift(s, p.x - last.x, p.y - last.y) : s)));
    } else if (draft) setDraft('pts' in draft ? { ...draft, pts: [...draft.pts, p] } : { ...draft, b: p });
  };

  const up = () => {
    drag.current = null;
    if (!draft) return;
    setDraft(null);
    const id = newId('p');
    if ('pts' in draft) {
      if (draft.pts.length > 2) set([...plan, draft.tool === 'move' ? { id, kind: 'move', pts: draft.pts, who: ownerOf(plan, draft.pts[0], who) } : { id, kind: 'pen', pts: draft.pts }]);
      return;
    }
    const { a, b } = draft;
    if (draft.tool === 'camera') set([...plan, { id, kind: 'camera', at: a, angle: Math.hypot(b.x - a.x, b.y - a.y) > 8 ? angleOf(a, b) : 0, label: nextCamera(plan) }]);
    else if (Math.hypot(b.x - a.x, b.y - a.y) > 4) set([...plan, { id, kind: draft.tool, a, b }]);
  };

  const render = (s: Shape, ghost = false) => {
    const o = { onPointerDown: (e: PointerEvent) => hit(e, s), opacity: ghost ? 0.5 : s.origin === 'ia' ? 0.6 : 1, className: tool === 'select' ? 'cursor-move' : tool === 'erase' ? 'cursor-pointer' : '' };
    switch (s.kind) {
      case 'pen': return <polyline {...o} points={pts2(s.pts)} fill="none" stroke="#222831" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
      case 'move': {
        const c = colorOf(s.who);
        return (
          <g {...o}>
            <polyline points={pts2(s.pts)} fill="none" stroke={c} strokeWidth={3} strokeDasharray="10 7" />
            <polygon points={arrowHead(s.pts)} fill={c} />
            {s.who && <text x={s.pts[0].x + 10} y={s.pts[0].y - 10} fontSize={15} fontWeight="bold" fill={c}>{s.who}</text>}
          </g>
        );
      }
      case 'line': return <line {...o} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke="#222831" strokeWidth={6} strokeLinecap="round" />;
      case 'rect': return <rect {...o} x={Math.min(s.a.x, s.b.x)} y={Math.min(s.a.y, s.b.y)} width={Math.abs(s.b.x - s.a.x)} height={Math.abs(s.b.y - s.a.y)} fill="#e5e7eb" stroke="#222831" strokeWidth={3} />;
      case 'camera': return (
        <g {...o} transform={`translate(${s.at.x} ${s.at.y}) rotate(${s.angle})`}>
          <polygon points="0,0 190,-85 190,85" fill="#FFD369" fillOpacity={0.35} stroke="#b9770e" strokeDasharray="6 5" />
          <rect x={-18} y={-13} width={36} height={26} rx={4} fill="#222831" /><circle cx={22} cy={0} r={8} fill="#222831" />
          <text transform={`rotate(${-s.angle})`} y={34} textAnchor="middle" fontSize={20} fontWeight="bold">{s.label}</text>
        </g>
      );
      case 'char': return (
        <g {...o}>
          <circle cx={s.at.x} cy={s.at.y} r={20} fill={colorOf(s.name)} />
          <text x={s.at.x} y={s.at.y + 6} textAnchor="middle" fontSize={17} fontWeight="bold" fill="#fff">{s.name.slice(0, 2).toUpperCase()}</text>
          <text x={s.at.x} y={s.at.y + 40} textAnchor="middle" fontSize={16}>{s.name}</text>
        </g>
      );
      case 'text': return <text {...o} x={s.at.x} y={s.at.y} fontSize={22}>{s.text}</text>;
    }
  };

  const ghost: Shape | null = !draft ? null
    : 'pts' in draft ? { id: 'draft', kind: draft.tool, pts: draft.pts }
    : draft.tool === 'camera' ? { id: 'draft', kind: 'camera', at: draft.a, angle: angleOf(draft.a, draft.b), label: '' }
    : { id: 'draft', kind: draft.tool, a: draft.a, b: draft.b };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {TOOLS.map(([t, label]) => (
          <button key={t} onClick={() => setTool(t)} className={`rounded px-2.5 py-1 text-xs ${tool === t ? 'bg-[#222831] text-white' : 'bg-white hover:bg-neutral-200'}`}>{label}</button>
        ))}
        {(tool === 'char' || tool === 'move') && (
          <select className="rounded border bg-white px-2 py-1 text-xs" value={tool === 'char' ? name : who} onChange={(e) => setWho(e.target.value)}>
            {tool === 'move' && <option value="">Auto (le plus proche du départ)</option>}
            {[...new Set([...scene.roles, ...project.roles.map((r) => r.name)])].map((r) => <option key={r}>{r}</option>)}
            {tool === 'move' && cams.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        <Button variant="outline" size="sm" className="ml-auto" disabled={busy} onClick={() => void propose()}>{busy ? 'Esquisse en cours…' : 'Proposer un plan (IA)'}</Button>
        <Button variant="outline" size="sm" disabled={!plan.length} onClick={() => set(plan.slice(0, -1))}>Annuler le dernier</Button>
        <Button variant="outline" size="sm" disabled={!plan.length} onClick={exportPng}>Exporter en PNG</Button>
        <Button variant="outline" size="sm" disabled={!plan.length} onClick={() => window.confirm('Effacer tout le plan ?') && set([])}>Tout effacer</Button>
      </div>
      <div role="status" aria-live="polite" className="space-y-2 empty:hidden">
        {error && (
          <p className="flex flex-wrap items-center gap-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            <span>{error}</span><button onClick={() => void propose()} className="font-semibold underline underline-offset-2">Réessayer</button>
          </p>
        )}
        {iaCount > 0 && (
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <span>{iaCount} élément{iaCount > 1 ? 's' : ''} esquissé{iaCount > 1 ? 's' : ''} par l'IA (transparents, à corriger).</span>
            <button onClick={() => set(plan.map(({ origin, ...s }) => s as Shape))} className="px-1 py-1.5 font-semibold underline underline-offset-2 pointer-coarse:min-h-11">Tout garder</button>
            <button onClick={() => set(plan.filter((s) => s.origin !== 'ia'))} className="px-1 py-1.5 font-semibold text-red-800 underline underline-offset-2 pointer-coarse:min-h-11">Tout retirer</button>
          </p>
        )}
      </div>
      <p className="text-xs text-neutral-600">
        {tool === 'camera' ? 'Cliquez-glissez : le point est la caméra, la direction du glissé est son axe.'
          : tool === 'move' ? 'Tracez le trajet : il est rattaché au personnage ou à la caméra choisi, ou à celui posé près du départ.'
          : tool === 'select' ? 'Glissez un élément pour le déplacer.' : tool === 'erase' ? 'Cliquez un élément pour le supprimer.' : ' '}
      </p>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none rounded border border-neutral-300 bg-white"
        style={{ cursor: tool === 'select' || tool === 'erase' ? 'default' : 'crosshair', backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)', backgroundSize: '2.5% 3.9%' }}
        onPointerDown={down} onPointerMove={moveEv} onPointerUp={up}>
        {plan.map((s) => <g key={s.id}>{render(s)}</g>)}
        {ghost && render(ghost, true)}
      </svg>
    </div>
  );
}
