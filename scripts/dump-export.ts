// Génère les deux classeurs sur un projet d'exemple : npx tsx scripts/dump-export.ts <dossier>
import { buildDepouillement, buildPlanTravail } from '../src/lib/exportXlsx';
import { parseScript } from '../src/lib/screenplay';
import { EMPTY_PROJECT } from '../src/types';
import { readFileSync } from 'node:fs';

const parsed = parseScript(readFileSync(process.argv[3], 'utf8'));
const days = [{ id: 'd1', lieu: '', notes: 'Jour chargé.' }, { id: 'd2', lieu: 'Rue', notes: '' }];
const p = {
  ...EMPTY_PROJECT, title: parsed.title, director: 'Étienne Lavallard', startDate: '2026-11-03', days,
  roles: parsed.characters.map((name) => ({ name, actor: name === 'Vincent' ? 'Melchior Escoffier' : '' })),
  scenes: parsed.scenes.map((s, i) => ({ ...s, dayId: i === 0 ? 'd2' : 'd1' })),
};
p.scenes[0].categories.accessoires = ['Téléphone de Vincent', 'Clé'];
p.scenes[0].categories.electricite = ['Éclairage de palier'];
p.scenes[1].categories.accessoires = ['Téléphone de Vincent'];
for (const b of [await buildDepouillement(p), await buildPlanTravail(p)]) await b.wb.xlsx.writeFile(`${process.argv[2]}/${b.filename}`);
