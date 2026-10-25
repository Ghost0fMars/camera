import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { locateFrame } from '../lib/ai';
import { describeFrame, sizeFromDetections, thumb, toJpeg } from '../lib/frame';
import type { Shot } from '../types';

const COLORS: Record<string, string> = { person: '#2471a3', face: '#c0392b' };

export function FrameAnalysis({ shot, edit }: { shot: Shot; edit: (patch: Partial<Shot>) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const frame = shot.frame;
  const size = frame ? sizeFromDetections(frame.detections) : null;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg('');
    try {
      const jpeg = await toJpeg(file);
      const detections = await locateFrame(jpeg);
      edit({ frame: { img: await thumb(jpeg), detections } });
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <b className="text-sm">Analyse du cadre</b>
        <label className={`cursor-pointer rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-100 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          {busy ? 'Analyse…' : frame ? 'Changer l\'image' : 'Choisir une image (photo, storyboard, plan de film)'}
          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {frame && <Button variant="outline" size="sm" onClick={() => edit({ frame: undefined })}>Retirer</Button>}
        <span className="text-xs text-neutral-500">prototype · LocateAnything (NVIDIA), usage non commercial</span>
      </div>
      {msg && <p className="text-sm text-red-700">{msg}</p>}
      {frame && (
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative max-w-md">
            <img src={frame.img} alt="Cadre analysé" className="block w-full rounded border border-neutral-300" />
            <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {frame.detections.map((d, i) => d.type === 'box' && d.coords.length === 4 && (
                <g key={i}>
                  <rect x={d.coords[0]} y={d.coords[1]} width={d.coords[2] - d.coords[0]} height={d.coords[3] - d.coords[1]} fill="none" stroke={COLORS[d.label.toLowerCase()] ?? '#b9770e'} strokeWidth={5} vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </svg>
          </div>
          <div className="space-y-2 text-sm">
            <p>{describeFrame(frame.detections)}</p>
            <p className="text-xs text-neutral-500">Estimation d'après la taille du visage dans le cadre : à confirmer.</p>
            {size && shot.size !== size && <Button variant="outline" size="sm" onClick={() => edit({ size })}>Appliquer « {size} » au plan</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
