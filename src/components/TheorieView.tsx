import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { card } from './card';
import { COURANTS, THEORIES } from '../data/theorie';

/** Minuscules sans accents, pour que « eisenstein » et « Éisenstein » se trouvent. */
const flat = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const nConcepts = THEORIES.reduce((n, t) => n + t.concepts.length, 0);

export function TheorieView() {
  const [q, setQ] = useState('');
  const [courant, setCourant] = useState<string>('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const needle = flat(q.trim());
  const shown = THEORIES.filter((t) => (!courant || t.courant === courant)
    && (!needle || flat([t.auteur, t.oeuvre, t.resume, ...t.concepts.flat()].join(' ')).includes(needle)));
  const key = (t: (typeof THEORIES)[number]) => `${t.auteur}|${t.oeuvre}`;
  const allOpen = shown.length > 0 && shown.every((t) => open.has(key(t)));
  const toggle = (k: string) => setOpen((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium pointer-coarse:py-2.5 ${on ? 'border-[#222831] bg-[#222831] text-white' : 'border-neutral-400 bg-white text-neutral-700 hover:bg-neutral-100'}`;

  return (
    <div className="space-y-4">
      <div className="border-b border-neutral-300 pb-4">
        <h2 className="font-serif text-2xl italic">Théorie de la mise en scène</h2>
        <p className="text-sm text-neutral-600">{THEORIES.length} théories · {nConcepts} concepts. Synthèses rédigées pour l'application : les ouvrages originaux font foi.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <label className="relative block">
          <span className="sr-only">Rechercher un auteur, un concept, une définition</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un auteur, un concept, une définition…"
            className="w-full rounded border border-neutral-400 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#222831]" />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par courant">
          <button aria-pressed={!courant} onClick={() => setCourant('')} className={chip(!courant)}>Tous</button>
          {COURANTS.map((c) => <button key={c} aria-pressed={courant === c} onClick={() => setCourant(courant === c ? '' : c)} className={chip(courant === c)}>{c}</button>)}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-700" role="status" aria-live="polite">
        <span>{shown.length} théorie{shown.length > 1 ? 's' : ''}</span>
        {shown.length > 0 && (
          <button onClick={() => setOpen(allOpen ? new Set() : new Set(shown.map(key)))} className="px-1 py-1.5 font-semibold underline underline-offset-2 pointer-coarse:min-h-11">
            {allOpen ? 'Tout replier' : 'Tout développer'}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className={`${card} text-sm text-neutral-700`}>Aucune théorie ne correspond à « {q} ». Essayez un autre mot, ou retirez le filtre de courant.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((t) => {
            const k = key(t);
            const on = open.has(k);
            return (
              <li key={k} className="rounded-lg border border-neutral-300 bg-[#EEEEEE] shadow-md">
                <button aria-expanded={on} aria-controls={`th-${k}`} onClick={() => toggle(k)} className="flex w-full items-start gap-3 p-4 text-left">
                  {on ? <ChevronDown className="mt-1 size-4 shrink-0" aria-hidden /> : <ChevronRight className="mt-1 size-4 shrink-0" aria-hidden />}
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-serif text-lg font-bold">{t.auteur}</span>
                      <span className="text-sm italic text-neutral-700">{t.oeuvre}</span>
                      <span className="text-xs text-neutral-600">{t.annee}</span>
                    </span>
                    <span className="inline-block rounded border border-neutral-700 px-1.5 text-xs">{t.courant}</span>
                    <span className={`block text-sm text-neutral-800 ${on ? '' : 'line-clamp-2'}`}>{t.resume}</span>
                  </span>
                </button>
                {on && (
                  <dl id={`th-${k}`} className="space-y-2 border-t border-neutral-300 px-4 py-3 pl-11">
                    {t.concepts.map(([nom, def]) => (
                      <div key={nom}>
                        <dt className="text-sm font-semibold">{nom}</dt>
                        <dd className="text-sm text-neutral-800">{def}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
