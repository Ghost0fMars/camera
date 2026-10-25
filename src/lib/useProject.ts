import { useCallback, useEffect, useState } from 'react';
import { EMPTY_PROJECT, emptyCategories, type Project } from '../types';

const KEY = 'camera_project';

function load(): Project {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return EMPTY_PROJECT;
    return {
      ...EMPTY_PROJECT, ...raw,
      scenes: (raw.scenes ?? []).map((s: Project['scenes'][number]) => ({ ...s, categories: { ...emptyCategories(), ...s.categories } })),
    };
  } catch { return EMPTY_PROJECT; }
}

export function useProject() {
  const [project, setProject] = useState<Project>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(project)); } catch { /* quota : tant pis */ } }, [project]);
  const update = useCallback((patch: Partial<Project> | ((p: Project) => Project)) =>
    setProject((p) => (typeof patch === 'function' ? patch(p) : { ...p, ...patch })), []);
  const updateScene = useCallback((id: string, patch: Partial<Project['scenes'][number]>) =>
    setProject((p) => ({ ...p, scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })), []);
  return { project, update, updateScene };
}
