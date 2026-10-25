export type IE = 'INT' | 'EXT' | 'INT/EXT';

/** Rubriques de la fiche de séquence (dans l'ordre de la feuille « SEQ n » du dépouillement). */
export const CATEGORIES = [
  { key: 'silhouettes', label: 'Silhouettes / figuration' },
  { key: 'decoration', label: 'Décoration' },
  { key: 'accessoires', label: 'Accessoires' },
  { key: 'costumes', label: 'Costumes' },
  { key: 'maquillage', label: 'Maquillage / coiffure' },
  { key: 'image', label: 'Image' },
  { key: 'son', label: 'Son' },
  { key: 'electricite', label: 'Électricité' },
  { key: 'machinerie', label: 'Machinerie' },
  { key: 'vehicules', label: 'Véhicules' },
  { key: 'effets', label: 'Effets spéciaux / cascades' },
  { key: 'animaux', label: 'Animaux' },
  { key: 'armes', label: 'Armes' },
  { key: 'regie', label: 'Régie' },
  { key: 'miseEnScene', label: 'Mise en scène' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];
export type Categories = Record<CategoryKey, string[]>;

export const emptyCategories = (): Categories =>
  Object.fromEntries(CATEGORIES.map((c) => [c.key, []])) as unknown as Categories;

export interface Pt { x: number; y: number }

/** Éléments du plan de scène en vue du dessus (coordonnées dans un repère 1000 × 640). */
export type Shape = { id: string } & (
  | { kind: 'pen' | 'move'; pts: Pt[] }          // tracé libre / déplacement (flèche)
  | { kind: 'line' | 'rect'; a: Pt; b: Pt }
  | { kind: 'camera'; at: Pt; angle: number; label: string }
  | { kind: 'char'; at: Pt; name: string }
  | { kind: 'text'; at: Pt; text: string }
);

export interface Scene {
  id: string;
  number: number;
  decor: string;
  ie: IE;
  effect: string;          // NUIT, JOUR, MATIN (7 h)…
  summary: string;
  text: string;            // texte de la séquence tel qu'importé
  durationSec: number;     // durée à l'écran
  shootMin: number;        // temps de tournage estimé (min)
  roles: string[];         // noms de personnages (clés de Project.roles)
  categories: Categories;
  continuity: string;
  notes: string;
  dayId: string | null;
  plan?: Shape[];          // plan de scène vue du dessus
}

export interface Role { name: string; actor: string }

export interface ShootDay { id: string; lieu: string; notes: string }

export interface Project {
  title: string;
  director: string;
  startDate: string;       // AAAA-MM-JJ, vide = jours relatifs
  roles: Role[];
  scenes: Scene[];
  days: ShootDay[];
}

export const EMPTY_PROJECT: Project = { title: '', director: '', startDate: '', roles: [], scenes: [], days: [] };
