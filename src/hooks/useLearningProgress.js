import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {
  emptyProgress,
  createProgressStorage,
  LEGACY_KEY,
  STORAGE_KEY,
} from '../services/learning/progressStorage.mjs';
import {recordAssessment} from '../services/learning/assessmentService.mjs';
import {lessonById} from '../data/learning/roadmap.mjs';
const LearningContext = createContext(null);
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export function useProgressStore() {
  const [data, setData] = useState(emptyProgress);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [legacy, setLegacy] = useState(false);
  const [adapter, setAdapter] = useState(null);
  useEffect(() => {
    // Browser APIs are accessed after hydration only, including localStorage getter failures.
    let service;
    try {
      service = createProgressStorage(window.localStorage);
      setAdapter(service);
      const result = service.read();
      setData(result.data);
      setError(result.error || '');
      setLegacy(Boolean(service.legacyRaw()));
    } catch (failure) {
      setError(`Bộ nhớ trình duyệt không khả dụng: ${failure.message}`);
    }
    setReady(true);
    const refresh = (event) => {
      if (event.type === 'storage' && event.key !== STORAGE_KEY) return;
      if (service) {
        const result = service.read();
        setData(result.data);
        setError(result.error || '');
      }
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('learning-progress', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('learning-progress', refresh);
    };
  }, []);
  const run = useCallback(
    (action) => {
      try {
        if (!adapter) throw new Error('Bộ nhớ chưa sẵn sàng.');
        const next = action(adapter);
        setData(next);
        setError('');
        window.dispatchEvent(new Event('learning-progress'));
        return true;
      } catch (failure) {
        setError(failure.message);
        return false;
      }
    },
    [adapter],
  );
  const update = (updater) => run((service) => service.update(updater));
  const withLesson = (state, id, change) => {
    const lesson = lessonById[id];
    const current = state.lessons[id] || {
      startedAt: new Date().toISOString(),
      checklist: lesson.assessment.criteria.map(() => false),
      evidence: [],
      assessments: [],
      review: null,
    };
    return {...state, lessons: {...state.lessons, [id]: change(current)}};
  };
  return {
    data,
    ready,
    error,
    legacy,
    update,
    startLesson: (id) => update((state) => withLesson(state, id, (p) => p)),
    checkCriterion: (id, index, checked) =>
      update((state) =>
        withLesson(state, id, (p) => ({
          ...p,
          checklist: p.checklist.map((v, i) => (i === index ? checked : v)),
        })),
      ),
    addEvidence: (id, evidence) =>
      update((state) =>
        withLesson(state, id, (p) => ({
          ...p,
          evidence: [...p.evidence, {...evidence, id: newId(), at: new Date().toISOString()}],
        })),
      ),
    assess: (id, input) =>
      update((state) =>
        withLesson(state, id, (p) =>
          recordAssessment(
            p,
            lessonById[id],
            {...input, criteria: p.checklist, weights: state.preferences.weights},
            new Date().toISOString(),
            newId(),
          ),
        ),
      ),
    saveProject: (id, progress) =>
      update((state) => ({
        ...state,
        projects: {...state.projects, [id]: {...progress, updatedAt: new Date().toISOString()}},
      })),
    addJournal: (entry) =>
      update((state) => ({
        ...state,
        journal: [...state.journal, {...entry, id: newId(), at: new Date().toISOString()}],
      })),
    removeJournal: (id) =>
      update((state) => ({...state, journal: state.journal.filter((e) => e.id !== id)})),
    importBackup: (raw) => run((service) => service.importBackup(raw)),
    exportBackup: () => adapter?.exportBackup(),
    archiveLegacy: (raw) =>
      update((state) => ({
        ...state,
        legacyArchives: [
          ...state.legacyArchives,
          {id: newId(), at: new Date().toISOString(), source: LEGACY_KEY, raw},
        ],
      })),
    readLegacy: () => {
      try {
        return adapter?.legacyRaw();
      } catch (failure) {
        setError(failure.message);
        return null;
      }
    },
  };
}
export function LearningProvider({children}) {
  const store = useProgressStore();
  return <LearningContext.Provider value={store}>{children}</LearningContext.Provider>;
}
export function useLearningProgress() {
  const store = useContext(LearningContext);
  if (!store) throw new Error('LearningProvider required');
  return store;
}
