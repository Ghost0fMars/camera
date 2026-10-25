// Vérification rapide : npm test
import assert from 'node:assert/strict';
import { cleanAnalysis, extractJson } from '../api/analyse';
import { angleOf, arrowHead, nextCamera, ownerOf, shift } from '../src/lib/plan';
import { allShots, emptyShot, shotItems, shotNumber, shotsFromCameras } from '../src/lib/shots';
import type { Shape } from '../src/types';
import { parseSse } from '../api/locate.js';
import { describeFrame, sizeFromDetections } from '../src/lib/frame';
import { chapterTitle, chunkText, search } from '../api/_eisenstein.js';
import { cleanShots } from '../api/decoupage';
import { dayStats, fmtDur, parseDur, recap } from '../src/lib/planning';
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
console.log('OK');
