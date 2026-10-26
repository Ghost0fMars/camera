// Vérification rapide : npm test
import assert from 'node:assert/strict';
import { cleanAnalysis, extractJson } from '../api/analyse';
import { angleOf, arrowHead, nextCamera, ownerOf, shift } from '../src/lib/plan';
import { allShots, emptyShot, shotItems, shotNumber, shotsFromCameras } from '../src/lib/shots';
import type { Shape } from '../src/types';
import { integraleChunks, integraleContext, positionContext } from '../api/_integrale.js';
import { position } from '../src/lib/ai';
import { parseSse } from '../api/locate.js';
import { describeFrame, sizeFromDetections } from '../src/lib/frame';
import { chapterTitle, chunkText, search } from '../api/_eisenstein.js';
import { cleanShots } from '../api/decoupage';
import { cleanPlan } from '../api/plan';
import { cleanPrompt } from '../api/prompt';
import { cleanImageUrl, falMessage, FAL_MODELS as FAL_ENDPOINTS } from '../api/image';
import { FAL_MODELS, fmtUsd, imagesCost } from '../src/lib/fal';
import { baseSchedule, capFrom, cleanSchedule, review, type SceneIn } from '../api/calendrier';
import { applySchedule, dayStats, fmtDur, parseDur, recap } from '../src/lib/planning';
import { parseScript, parseSlug } from '../src/lib/screenplay';
import { EMPTY_PROJECT, emptyCategories } from '../src/types';

const script = `# La Clé

INT. IMMEUBLE DE VINCENT : PALIER - NUIT

Vincent sort de son appartement, le regard sur son téléphone.

VINCENT
(distrait)
Voilà.

EXT. RUE DEVANT LE BAR – NUIT

Clémence baisse le rideau.

CLÉMENCE
Il dit quoi, ton serrurier ?

VINCENT
Rien.

INT./EXT. VOITURE - JOUR

Un taxi passe.
`;

const p = parseScript(script);
assert.equal(p.title, 'La Clé');
assert.equal(p.scenes.length, 3);
assert.deepEqual(p.characters.sort(), ['Clémence', 'Vincent']);
assert.deepEqual(p.scenes[1].roles, ['Clémence', 'Vincent']);
assert.deepEqual(parseSlug('INT. IMMEUBLE DE VINCENT : PALIER - NUIT'), { ie: 'INT', decor: 'Immeuble de vincent : palier', effect: 'NUIT' });
assert.equal(p.scenes[0].decor, 'Immeuble de Vincent : palier');
assert.equal(p.scenes[1].decor, 'Rue devant le bar');
assert.equal(p.scenes[2].ie, 'INT/EXT');
assert.equal(fmtDur(510), "8'30");
assert.equal(parseDur("8'30"), 510);
assert.equal(parseDur('90'), 90);

const proj = { ...EMPTY_PROJECT, scenes: p.scenes.map((s) => ({ ...s, dayId: 'd1' })), days: [{ id: 'd1', lieu: '', notes: '' }] };
proj.scenes[0].categories.accessoires = ['Téléphone'];
proj.scenes[1].categories.accessoires = ['Téléphone', 'Clé du bar'];
const st = dayStats(proj, proj.days[0]);
assert.equal(st.sequences.length, 3);
assert.equal(st.ie, 'INT, EXT, INT/EXT');
assert.deepEqual(recap(proj.scenes, 'accessoires'), [{ item: 'Clé du bar', seqs: [2] }, { item: 'Téléphone', seqs: [1, 2] }]);

const a = cleanAnalysis(extractJson('Voici :\n```json\n{"summary":"Il sort.","accessoires":["Téléphone", " "],"son":"pas une liste"}\n```'));
assert.equal(a.summary, 'Il sort.');
assert.deepEqual(a.categories.accessoires, ['Téléphone']);
assert.deepEqual(a.categories.son, []);
assert.throws(() => extractJson('pas de json'));

assert.deepEqual(shift({ id: 'a', kind: 'line', a: { x: 1, y: 2 }, b: { x: 3, y: 4 } }, 10, 20), { id: 'a', kind: 'line', a: { x: 11, y: 22 }, b: { x: 13, y: 24 } });
assert.equal(angleOf({ x: 0, y: 0 }, { x: 0, y: 5 }), 90);
const cast: Shape[] = [{ id: 'v', kind: 'char', at: { x: 100, y: 100 }, name: 'Vincent' }, { id: 'c', kind: 'camera', at: { x: 500, y: 500 }, angle: 0, label: 'Cam 1' }];
assert.equal(ownerOf(cast, { x: 120, y: 110 }), 'Vincent');
assert.equal(ownerOf(cast, { x: 300, y: 300 }), undefined);
assert.equal(ownerOf(cast, { x: 300, y: 300 }, 'Clémence'), 'Clémence');
assert.equal(arrowHead([{ x: 0, y: 0 }, { x: 100, y: 0 }]).split(' ')[0], '100,0');
assert.equal(nextCamera([{ id: 'c', kind: 'camera', at: { x: 0, y: 0 }, angle: 0, label: 'Cam 1' }]), 'Cam 2');

const sc = { ...p.scenes[1], plan: cast, shots: [emptyShot({ camera: 'Cam 1' })] };
assert.equal(shotNumber(sc, 0), '2.1');
assert.equal(shotsFromCameras(sc).length, 0);
assert.equal(shotsFromCameras({ ...sc, shots: [] }).map((h) => h.camera).join(), 'Cam 1');
assert.deepEqual(allShots([p.scenes[0], sc]).map((x) => x.n), ['2.1']);

const cs = cleanShots(extractJson('{"shots":[{"size":"GP","move":"Fixe","description":" Vincent regarde. "},{"description":""},"x",{"size":"PE","description":"Rue","camera":"Cam 1"}]}'));
assert.equal(cs.length, 2);
assert.deepEqual(cs[0], { size: 'GP', move: 'Fixe', lens: '', camera: '', description: 'Vincent regarde.', notes: '' });
assert.equal(cs[1].camera, 'Cam 1');
assert.deepEqual(cleanShots({}), []);

assert.equal(shotItems(emptyShot()), 0);
assert.equal(shotItems(emptyShot({ categories: { ...emptyCategories(), accessoires: ['Clé', 'Téléphone'], son: ['Pas'] } })), 3);

const corpus = chunkText('# PRÉFACE\n\nIntro.\n\n# CADRAGE\n\nLe gros plan accentue le moment de l’action. Le découpage articule la scène.\n\nLe panoramique suit le mouvement du comédien dans l’espace.\n\n# POSTFACE\n\nFin.');
assert.deepEqual(corpus.map((c) => c.chapter), ['CADRAGE']);
assert.equal(search(corpus, 'un gros plan pour accentuer', 3)[0].chapter, 'CADRAGE');
assert.deepEqual(search(corpus, 'xyz inconnu', 3), []);
assert.ok(chunkText('# A\n\n' + 'Une phrase assez longue pour remplir. '.repeat(200)).every((c) => c.text.length < 1300));
assert.equal(chapterTitle('LES PROBLÈMES DU CADRAGE – LE DÉCOUPAGE EN PLANS'), 'Les problèmes du cadrage – le découpage en plans');
assert.equal(sizeFromDetections([{ label: 'face', type: 'box', coords: [0, 0, 300, 600] }]), 'GP');
assert.equal(sizeFromDetections([{ label: 'person', type: 'box', coords: [0, 100, 200, 400] }, { label: 'face', type: 'box', coords: [50, 100, 120, 300] }]), 'PM');
assert.equal(sizeFromDetections([{ label: 'person', type: 'box', coords: [0, 500, 50, 560] }]), 'PG');
assert.equal(sizeFromDetections([{ label: 'person', type: 'box', coords: [0, 0, 500, 1000] }]), null);
assert.equal(sizeFromDetections([]), null);
assert.match(describeFrame([{ label: 'person', type: 'box', coords: [100, 0, 300, 900] }]), /1 personnage \(à gauche\)/);
assert.deepEqual(parseSse('event: complete\ndata: [null, null, {"success": true, "detections": []}]\n'), { event: 'complete', data: [null, null, { success: true, detections: [] }] });
assert.equal(parseSse('event: error\ndata: null\n').event, 'error');
assert.equal(describeFrame([{ label: 'person', type: 'box', coords: [100, 0, 200, 900] }, { label: 'person', type: 'box', coords: [150, 0, 250, 900] }, { label: 'person', type: 'box', coords: [800, 0, 900, 900] }]), '3 personnages (2 à gauche, 1 à droite)');
assert.ok(integraleChunks('<article class="article-card"><h2>I. L\'équation</h2><p>S(t) &eacute;gale l\'int&eacute;grale.</p><h2>Références</h2><p>Aristote.</p></article>').every((c) => c.chapter === 'I. L\'équation' && c.text.includes('égale')));
assert.match(integraleContext('tension accumulation'), /S\(t\) = ∫/);
assert.match(positionContext({ index: 2, total: 5, previous: 'A', next: 'B' }), /séquence 2 sur 5.*précédente : A.*suivante : B/);
assert.equal(positionContext(undefined), '');
assert.deepEqual(position(p.scenes[1], p.scenes), { index: 2, total: 3, previous: position(p.scenes[1], p.scenes)!.previous, next: position(p.scenes[1], p.scenes)!.next });
assert.equal(position(p.scenes[0], p.scenes)!.previous, undefined);
const plan = cleanPlan({
  walls: [{ a: [1, 1], b: [19, 1] }, { a: [3, 3], b: [3, 3] }, { a: ['x', 1], b: [2, 2] }],
  furniture: [{ label: 'table', a: [8, 4], b: [12, 7] }],
  characters: [{ name: 'VINCENT', at: [4, 6] }, { name: 'VINCENT', at: [9, 9] }, { name: 'CLÉMENCE', at: [30, -2] }],
  moves: [{ who: 'VINCENT', path: [[5, 6], [10, 6]] }, { who: 'INCONNU', path: [[2, 2], [6, 2]] }, { path: [[1, 1]] }],
  cameras: [{ at: [2, 10], look: [12, 10] }, { at: [18, 10] }],
});
assert.equal(plan.filter((s) => s.kind === 'line').length, 1);
assert.deepEqual(plan.find((s) => s.kind === 'line'), { kind: 'line', a: { x: 50, y: 53 }, b: { x: 950, y: 53 } });
assert.equal(plan.filter((s) => s.kind === 'rect').length, 1);
assert.equal(plan.filter((s) => s.kind === 'text').length, 1);
assert.deepEqual(plan.filter((s) => s.kind === 'char').map((s) => s.kind === 'char' && s.name), ['VINCENT', 'CLÉMENCE']);
assert.deepEqual(plan.find((s) => s.kind === 'char' && s.name === 'CLÉMENCE'), { kind: 'char', at: { x: 1000, y: 0 }, name: 'CLÉMENCE' });
const moves = plan.filter((s) => s.kind === 'move');
assert.equal(moves.length, 2);
assert.equal(moves[0].kind === 'move' && moves[0].who, 'VINCENT');
assert.equal(moves[0].kind === 'move' && moves[0].pts[0].x, 200);
assert.equal(moves[1].kind === 'move' && moves[1].who, undefined);
assert.deepEqual(plan.filter((s) => s.kind === 'camera').map((s) => s.kind === 'camera' && s.angle), [0, 0]);
assert.deepEqual(cleanPlan({}), []);
assert.equal(cleanPrompt({ prompt: '  A wide shot.\n\n  Night.  ' }), 'A wide shot. Night.');
assert.equal(cleanPrompt({ prompt: 42 }), '');
assert.equal(cleanPrompt({ prompt: 'x'.repeat(2000) }).length, 1200);
const sched = cleanSchedule({ resume: ' Deux jours. ', days: [{ lieu: 'Bar', sequences: [2, '1', 9, 2] }, { lieu: 'x', sequences: [42] }, { sequences: [3] }] }, [1, 2, 3, 4]);
assert.equal(sched.resume, 'Deux jours.');
assert.deepEqual(sched.days.map((d) => d.sequences), [[2, 1], [3]]);
assert.deepEqual(sched.unplaced, [4]);
const mkScene = (number: number, decor: string, effect: string, shootMin: number, roles: string[] = []): SceneIn => ({ number, decor, ie: 'INT.', effect, durationSec: 60, shootMin, roles, extras: [] });
const film = [mkScene(1, 'PALIER', 'NUIT', 120, ['V']), mkScene(2, 'RUE', 'NUIT', 180, ['C', 'V']), mkScene(3, 'PALIER', 'JOUR', 60, ['V']), mkScene(4, 'BAR : SALLE', 'NUIT', 240, ['C']), mkScene(5, 'BAR : RÉSERVE', 'NUIT', 90, ['C']), mkScene(6, 'RUE', 'JOUR', 90, ['C'])];
assert.equal(capFrom('Journées de 6 h maximum.'), 360);
assert.equal(capFrom(''), 480);
const base = baseSchedule(film, 480);
assert.deepEqual(base.map((d) => d.sequences), [[1, 2], [3, 6], [4, 5]]);
assert.equal(base.flatMap((d) => d.sequences).length, 6);
assert.deepEqual(review(base, film, 480), { alerts: [], convocations: { V: 2, C: 3 } });
assert.equal(review([{ lieu: '', motif: '', sequences: [1, 2, 3, 4] }], film, 480).alerts.length, 2);
const planned = applySchedule({ ...EMPTY_PROJECT, scenes: [1, 2, 3, 4].map((n) => ({ ...p.scenes[0], id: `q${n}`, number: n, dayId: 'ancien' })), days: [{ id: 'ancien', lieu: '', notes: '' }] }, sched.days);
assert.equal(planned.days.length, 2);
assert.deepEqual(planned.scenes.map((s) => s.number), [2, 1, 3, 4]);
assert.deepEqual(planned.scenes.map((s) => s.dayId === null ? null : planned.days.findIndex((d) => d.id === s.dayId)), [0, 0, 1, null]);
assert.equal(planned.days[0].lieu, 'Bar');
assert.equal(cleanImageUrl({ images: [{ url: 'https://v3.fal.media/files/a.jpg' }] }), 'https://v3.fal.media/files/a.jpg');
assert.equal(cleanImageUrl({ images: [{ url: 'http://x/a.jpg' }] }), '');
assert.equal(cleanImageUrl({ images: [] }), '');
assert.equal(cleanImageUrl(null), '');
assert.match(falMessage(401, {}), /refusée/);
assert.match(falMessage(403, { detail: 'User is locked. Reason: Exhausted balance.' }), /Solde/);
assert.match(falMessage(500, { detail: 'boom' }), /boom/);
assert.deepEqual(FAL_MODELS.map((m) => m.id).sort(), Object.keys(FAL_ENDPOINTS).sort());
assert.ok(Object.values(FAL_ENDPOINTS).every((m) => m.endpoint.startsWith('https://fal.run/')));
assert.equal(fmtUsd(0.04), '0,04 $');
assert.equal(fmtUsd(0.003), '0,003 $');
assert.equal(fmtUsd(12), '12 $');
assert.equal(fmtUsd(1.5), '1,5 $');
assert.equal(fmtUsd(1.25), '1,25 $');
assert.equal(fmtUsd(0), '0 $');
assert.equal(Math.round(imagesCost(150, 'kontext') * 100) / 100, 6);
console.log('OK');
