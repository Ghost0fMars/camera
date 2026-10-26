import { useId } from 'react';
import type { Shot } from '../types';

/** Un même personnage (tête + corps, 0 à 100) cadré de plus ou moins près : échelle k et décalage vertical ty dans un cadre 160 × 90. */
const FRAMING: Record<string, { k: number; ty: number }> = {
  PG: { k: 0.45, ty: 40 }, PE: { k: 0.8, ty: 8 }, PA: { k: 1.5, ty: 6 },
  PM: { k: 2.2, ty: 2 }, PR: { k: 3.4, ty: -10 }, GP: { k: 6, ty: -30 }, TGP: { k: 10, ty: -60 },
};

/** Vignette d'un plan : l'image de référence si elle existe, sinon le cadrage de sa valeur de plan en pictogramme plat. */
export function ShotGlyph({ shot }: { shot: Shot }) {
  const clip = useId();
  const box = 'block aspect-video w-full rounded border border-neutral-300 bg-neutral-50';
  if (shot.frame) return <img src={shot.frame.img} alt="Image de référence du plan" className={`${box} object-cover`} />;
  const f = FRAMING[shot.size];
  return (
    <svg viewBox="0 0 160 90" role="img" aria-label={shot.size ? `Cadrage : ${shot.size}` : 'Cadrage non choisi'} className={box}>
      <clipPath id={clip}><rect width="160" height="90" /></clipPath>
      <g clipPath={`url(#${clip})`} fill="#D4D4D4" stroke="#393E46" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
        {f && (
          <g transform={`translate(80 ${f.ty}) scale(${f.k})`} strokeWidth={1.5 / f.k}>
            <circle cx="0" cy="10" r="8" />
            <path d="M-15 24 Q-15 20 -10 20 H10 Q15 20 15 24 V60 H10 V100 H-10 V60 H-15 Z" />
          </g>
        )}
        {shot.size === 'Insert' && <rect x="62" y="30" width="36" height="30" rx="2" />}
        {!f && shot.size !== 'Insert' && <rect x="1" y="1" width="158" height="88" fill="none" strokeDasharray="4 4" />}
      </g>
    </svg>
  );
}
