import { useCallback, useEffect, useState } from 'react';
import { EMPTY_PROJECT, emptyCategories, type Project } from '../types';
import { newId } from './planning';

const LIB = 'camera_projects';
const ACTIVE = 'camera_active';
const OLD = 'camera_project'; // projet unique d'avant « Mes projets » : repris comme premier projet

export interface Entry { id: string; at: number; project: Project }
interface Lib { entries: Entry[]; activeId: string | null }

/** Complète un projet lu ailleurs (stockage, fichier importé) avec les champs par défaut. */
export function normalize(raw: Partial<Project>): Project {
  return {
    ...EMPTY_PROJECT, ...raw,
    scenes: (raw.scenes ?? []).map((s) => ({ ...s, categories: { ...emptyCategories(), ...s.categories } })),
  };
}

function load(): Lib {
  try {
    const lib = JSON.parse(localStorage.getItem(LIB) || 'null');
    if (Array.isArray(lib)) {
      const entries = lib.map((e: Entry) => ({ ...e, project: normalize(e.project) }));
      const active = localStorage.getItem(ACTIVE);
      return { entries, activeId: entries.some((e) => e.id === active) ? active : null };
    }
    const old = JSON.parse(localStorage.getItem(OLD) || 'null');
    if (old && (old.scenes?.length || old.title)) {
      const e = { id: newId('P'), at: Date.now(), project: normalize(old) };
      return { entries: [e], activeId: e.id };
    }
  } catch { /* stockage illisible : on repart de zéro */ }
  return { entries: [], activeId: null };
}

export function useProject() {
  const [lib, setLib] = useState<Lib>(load);
  useEffect(() => {
    try {
      localStorage.setItem(LIB, JSON.stringify(lib.entries));
      lib.activeId ? localStorage.setItem(ACTIVE, lib.activeId) : localStorage.removeItem(ACTIVE);
    } catch { /* quota : tant pis */ }
  }, [lib]);

  const project = lib.entries.find((e) => e.id === lib.activeId)?.project ?? EMPTY_PROJECT;

  /** Modifie le projet ouvert ; sans projet ouvert, en crée un. */
  const edit = useCallback((f: (p: Project) => Project) => setLib((l) => {
    if (l.entries.some((e) => e.id === l.activeId)) {
      return { ...l, entries: l.entries.map((e) => (e.id === l.activeId ? { ...e, at: Date.now(), project: f(e.project) } : e)) };
    }
    const e = { id: newId('P'), at: Date.now(), project: f(EMPTY_PROJECT) };
    return { entries: [e, ...l.entries], activeId: e.id };
  }), []);

  const update = useCallback((patch: Partial<Project> | ((p: Project) => Project)) =>
    edit((p) => (typeof patch === 'function' ? patch(p) : { ...p, ...patch })), [edit]);
  const updateScene = useCallback((id: string, patch: Partial<Project['scenes'][number]>) =>
    edit((p) => ({ ...p, scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })), [edit]);

  /** Ajoute un projet (vide ou importé) en tête de liste et l'ouvre si `open`. */
  const add = useCallback((p: Project = EMPTY_PROJECT, open = true) => {
    const e = { id: newId('P'), at: Date.now(), project: p };
    setLib((l) => ({ entries: [e, ...l.entries], activeId: open ? e.id : l.activeId }));
  }, []);
  const open = useCallback((id: string) => setLib((l) => ({ ...l, activeId: id })), []);
  const remove = useCallback((id: string) => setLib((l) => ({ entries: l.entries.filter((e) => e.id !== id), activeId: l.activeId === id ? null : l.activeId })), []);
  /** Remet un projet supprimé à sa place (annulation). */
  const restore = useCallback((e: Entry, index: number) => setLib((l) => {
    const entries = [...l.entries]; entries.splice(Math.min(index, entries.length), 0, e);
    return { entries, activeId: l.activeId ?? e.id };
  }), []);

  return { project, update, updateScene, projects: lib.entries, activeId: lib.activeId, add, open, remove, restore };
}
