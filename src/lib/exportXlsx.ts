import type { Workbook, Worksheet } from 'exceljs';
import { CATEGORIES, type Project, type Scene } from '../types';
import { allShots, shotCats } from './shots';
import { dayDate, dayStats, fmtDur, fmtHours, recap, roleLabel } from './planning';

const HEAD = 'FF1F2433';
const GREY = 'FFC0C0C0';
const LIGHT = 'FFF2F2F2';
const fill = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } });
const wrap = { vertical: 'top' as const, wrapText: true };

function header(ws: Worksheet, row = 1) {
  ws.getRow(row).eachCell((c) => { c.fill = fill(HEAD); c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = wrap; });
}

const slug = (s: string) => (s || 'film').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const dayLabel = (p: Project, id: string | null) => { const i = p.days.findIndex((d) => d.id === id); return i < 0 ? '' : `Jour ${i + 1}`; };

async function newWorkbook(): Promise<Workbook> {
  const mod = await import('exceljs');
  const wb = new (mod.Workbook ?? (mod as unknown as { default: typeof mod }).default.Workbook)();
  wb.creator = 'Caméra';
  return wb;
}

async function download(wb: Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

function addTable(wb: Workbook, name: string, cols: { header: string; width: number }[], rows: (string | number)[][]) {
  const ws = wb.addWorksheet(name);
  ws.columns = cols.map((c) => ({ header: c.header, width: c.width }));
  rows.forEach((r) => ws.addRow(r));
  header(ws);
  ws.eachRow((r, i) => { if (i > 1) r.eachCell((c) => { c.alignment = wrap; }); });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return ws;
}

function sceneSheet(wb: Workbook, p: Project, s: Scene) {
  const ws = wb.addWorksheet(`SEQ ${s.number}`);
  ws.columns = [{ width: 48 }, { width: 48 }];
  const head = ws.addRow([`DÉCOR\n${s.decor}`, `LIEU : ${s.ie}  ·  EFFET : ${s.effect}  ·  SEQ ${s.number}  ·  ${fmtDur(s.durationSec)}`]);
  head.height = 34;
  const cont = ws.addRow([`CONTINUITÉ / RACCORD\n${s.continuity}`, `JOUR\n${dayLabel(p, s.dayId)}`]);
  cont.height = 34;
  ws.addRow([`RÉSUMÉ\n${s.summary}`]);
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, 2);
  ws.getRow(ws.rowCount).height = Math.max(34, Math.ceil(s.summary.length / 90) * 14);
  const roles = ws.addRow([`RÔLES\n${s.roles.map((r) => roleLabel(p, r)).join('\n')}`, `SILHOUETTES / FIGURATION\n${s.categories.silhouettes.join('\n') || 'Aucune'}`]);
  roles.height = 14 * Math.max(2, s.roles.length + 1);
  const rest = CATEGORIES.filter((c) => c.key !== 'silhouettes');
  for (let i = 0; i < rest.length; i += 2) {
    const [a, b] = [rest[i], rest[i + 1]];
    const la = s.categories[a.key]; const lb = b ? s.categories[b.key] : [];
    const r = ws.addRow([`${a.label.toUpperCase()}\n${la.join('\n')}`, b ? `${b.label.toUpperCase()}\n${lb.join('\n')}` : '']);
    r.height = 14 * Math.max(2, la.length + 1, lb.length + 1);
  }
  ws.addRow([`NOTES\n${s.notes}`]);
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, 2);
  ws.getRow(ws.rowCount).height = Math.max(30, Math.ceil(s.notes.length / 90) * 14);
  ws.eachRow((r) => r.eachCell((c) => {
    c.alignment = wrap; c.font = { name: 'Arial', size: 9 };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  }));
}

/** Dépouillement : séquencier, jours et décors, récaps par rubrique, une feuille par séquence. */
export async function buildDepouillement(p: Project) {
  const wb = await newWorkbook();
  const total = p.scenes.reduce((n, s) => n + s.durationSec, 0);
  const seq = addTable(wb, 'SÉQUENCIER',
    [['N°', 5], ['Décor', 30], ['I/E', 6], ['Effet', 12], ['Rôles', 28], ['Résumé', 70], ['Durée (min)', 10], ['Jour de tournage', 16]].map(([header, width]) => ({ header: String(header), width: Number(width) })),
    [...p.scenes].sort((a, b) => a.number - b.number).map((s) => [s.number, s.decor, s.ie, s.effect, s.roles.map((r) => roleLabel(p, r)).join(', '), s.summary, fmtDur(s.durationSec), dayLabel(p, s.dayId)]));
  seq.addRow(['', 'TOTAL estimé', '', '', '', '', fmtDur(total)]).font = { bold: true };

  addTable(wb, 'PAR JOUR ET DÉCOR',
    [['Jour', 10], ['Lieu', 30], ['Séquences', 16], ['Effets', 20], ['Durée estimée', 14], ['Détail', 60]].map(([header, width]) => ({ header: String(header), width: Number(width) })),
    p.days.map((d, i) => { const st = dayStats(p, d); return [`Jour ${i + 1}`, st.lieu, st.sequences.map((x) => x.split(' ')[0]).join(', '), st.effets, fmtDur(st.durationSec), st.sequences.join('\n')]; }));

  for (const [key, name] of [['accessoires', 'RÉCAP ACCESSOIRES'], ['costumes', 'RÉCAP COSTUMES'], ['decoration', 'RÉCAP DÉCORATION']] as const) {
    addTable(wb, name, [{ header: key === 'accessoires' ? 'Accessoire' : key === 'costumes' ? 'Costume' : 'Élément de décor', width: 60 }, { header: 'Séquences', width: 24 }],
      recap(p.scenes, key).map((r) => [r.item, r.seqs.join(', ')]));
  }
  [...p.scenes].sort((a, b) => a.number - b.number).forEach((s) => sceneSheet(wb, p, s));
  return { wb, filename: `depouillement-${slug(p.title)}.xlsx` };
}
export const exportDepouillement = async (p: Project) => { const r = await buildDepouillement(p); await download(r.wb, r.filename); };

/** Plan de travail : une colonne par jour, comme la feuille « PDT » de l'exemple. */
export async function buildPlanTravail(p: Project) {
  const wb = await newWorkbook();
  const ws = wb.addWorksheet('PDT');
  ws.columns = [{ width: 30 }, ...p.days.map(() => ({ width: 40 })), { width: 12 }];
  ws.addRow([`${p.title.toUpperCase()} · PLAN DE TRAVAIL`]).font = { bold: true, size: 16 };
  ws.addRow([`Réalisation : ${p.director || '—'}${p.startDate ? '' : ' · jours relatifs (date du jour 1 à saisir)'}`]);
  ws.addRow([]);
  const stats = p.days.map((d) => dayStats(p, d));
  const row = (label: string, cells: (string | number)[], total: string | number = '') => {
    const r = ws.addRow([label, ...cells, total]);
    r.getCell(1).fill = fill(GREY); r.getCell(1).font = { bold: true, size: 10 };
    r.eachCell((c) => { c.alignment = wrap; if (Number(c.col) > 1) c.font = { size: 10 }; });
    return r;
  };
  const rep = (f: (i: number) => string | number) => p.days.map((_, i) => f(i));
  const dd = (i: number) => dayDate(p, i);
  const head = row('N° DE JOUR', rep((i) => `JOUR ${i + 1}`), 'TOTAL');
  head.eachCell((c) => { if (Number(c.col) > 1) c.font = { bold: true, size: 12 }; });
  row('DATE', rep((i) => dd(i)?.toLocaleDateString('fr-FR') ?? 'à fixer'));
  row('JOUR', rep((i) => dd(i)?.toLocaleDateString('fr-FR', { weekday: 'long' }) ?? ''));
  row('MOIS', rep((i) => dd(i)?.toLocaleDateString('fr-FR', { month: 'long' }) ?? ''));
  row('LIEU DE TOURNAGE', stats.map((s) => s.lieu));
  row('DÉCORS', stats.map((s) => s.decors));
  row('SÉQUENCES (ordre de tournage)', stats.map((s) => s.sequences.join('\n')));
  row('INT/EXT', stats.map((s) => s.ie));
  row('EFFET', stats.map((s) => s.effets));
  row("DURÉE À L'ÉCRAN", stats.map((s) => fmtDur(s.durationSec)), fmtDur(stats.reduce((a, s) => a + s.durationSec, 0)));
  row('NB DE SÉQUENCES', stats.map((s) => s.sequences.length), stats.reduce((a, s) => a + s.sequences.length, 0));
  row('TEMPS DE TOURNAGE ESTIMÉ (h)', stats.map((s) => fmtHours(s.shootMin)), fmtHours(stats.reduce((a, s) => a + s.shootMin, 0)));
  ws.addRow([]);
  const cast = ws.addRow(['COMÉDIENS', ...p.days.map(() => ''), 'Jours']);
  cast.eachCell((c) => { c.fill = fill(LIGHT); c.font = { bold: true, size: 10 }; });
  for (const r of p.roles.filter((r) => p.scenes.some((s) => s.roles.includes(r.name)))) {
    const present = stats.map((s) => s.actors.includes(r.name));
    ws.addRow([`${r.name}${r.actor ? ` · ${r.actor}` : ' · à distribuer'}`, ...present.map((x) => (x ? 'X' : '')), present.filter(Boolean).length]);
  }
  ws.addRow([]);
  const join = (key: Parameters<typeof stats[0]['collect']>[0]) => stats.map((s) => s.collect(key).join(' ; ') || '—');
  row('SILHOUETTES', join('silhouettes'));
  row('VÉHICULES', join('vehicules'));
  row('EFFETS SPÉCIAUX', join('effets'));
  row('SON (à part)', join('son'));
  row('ÉLECTRICITÉ / LUMIÈRE', join('electricite'));
  row('RÉGIE / AUTORISATIONS', join('regie'));
  row('NOTES', p.days.map((d) => d.notes));

  const seq = addTable(wb, 'SÉQUENCES',
    [['N°', 5], ['Décor', 34], ['I/E', 7], ['Effet', 14], ['Durée écran (s)', 12], ['Durée écran', 11], ['Comédiens', 30], ['Jour', 8], ['Temps de tournage estimé (min)', 14], ['Remarque', 50]].map(([header, width]) => ({ header: String(header), width: Number(width) })),
    [...p.scenes].sort((a, b) => a.number - b.number).map((s) => [s.number, s.decor, s.ie, s.effect, s.durationSec, fmtDur(s.durationSec), s.roles.join(', '), dayLabel(p, s.dayId), s.shootMin, s.notes]));
  const t = p.scenes.reduce((a, s) => a + s.durationSec, 0);
  seq.addRow(['', 'TOTAL', '', '', t, fmtDur(t), '', '', p.scenes.reduce((a, s) => a + s.shootMin, 0)]).font = { bold: true };
  return { wb, filename: `pdt-${slug(p.title)}.xlsx` };
}
export const exportPlanTravail = async (p: Project) => { const r = await buildPlanTravail(p); await download(r.wb, r.filename); };

/** Découpage technique : la liste de tous les plans, séquence par séquence. */
export async function buildDecoupage(p: Project) {
  const wb = await newWorkbook();
  addTable(wb, 'DÉCOUPAGE TECHNIQUE',
    [['Plan', 7], ['Séq', 6], ['Décor', 30], ['I/E', 7], ['Effet', 12], ['Taille', 9], ['Mouvement', 14], ['Optique', 10], ['Caméra', 9], ['Durée', 9], ['Description', 60], ['Notes', 40]].map(([header, width]) => ({ header: String(header), width: Number(width) })),
    allShots(p.scenes).map(({ s, h, n }) => [n, s.number, s.decor, s.ie, s.effect, h.size, h.move, h.lens, h.camera, h.duration ?? '', h.description, h.notes]));
  addTable(wb, 'DÉPOUILLEMENT PAR PLAN',
    [{ header: 'Plan', width: 7 }, { header: 'Description', width: 40 }, ...CATEGORIES.map((c) => ({ header: c.label, width: 24 }))],
    allShots(p.scenes).map(({ h, n }) => [n, h.description, ...CATEGORIES.map((c) => shotCats(h)[c.key].join('\n'))]));
  return { wb, filename: `decoupage-${slug(p.title)}.xlsx` };
}
export const exportDecoupage = async (p: Project) => { const r = await buildDecoupage(p); await download(r.wb, r.filename); };
