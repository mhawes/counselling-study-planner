import { computed, ref } from 'vue';
import type { PlacementSession, SupervisionNote, Agency, Client, GlossaryEntry, CourseSchema } from '@/types';

const STORAGE_SESSIONS = 'placement-sessions';
const STORAGE_SUPERVISION = 'placement-supervision';
const STORAGE_AGENCIES = 'placement-agencies';
const STORAGE_CLIENTS = 'placement-clients';
const STORAGE_GLOSSARY = 'glossary-entries';
const STORAGE_COURSE = 'course-criteria-data';
export const exportStateRevision = ref(0);

export function notifyExportStateChanged() {
  exportStateRevision.value += 1;
}

export function clearTrackerState() {
  [
    STORAGE_SESSIONS,
    STORAGE_SUPERVISION,
    STORAGE_AGENCIES,
    STORAGE_CLIENTS,
    STORAGE_GLOSSARY,
    STORAGE_COURSE
  ].forEach((key) => localStorage.removeItem(key));
  notifyExportStateChanged();
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getExportState() {
  const sessions = loadStorage<PlacementSession[]>(STORAGE_SESSIONS, []);
  const supervisionNotes = loadStorage<SupervisionNote[]>(STORAGE_SUPERVISION, []);
  const agencies = loadStorage<Agency[]>(STORAGE_AGENCIES, []);
  const clients = loadStorage<Client[]>(STORAGE_CLIENTS, []);
  const glossaryEntries = loadStorage<GlossaryEntry[]>(STORAGE_GLOSSARY, []);
  const course = loadStorage<CourseSchema | null>(STORAGE_COURSE, null);

  return { sessions, supervisionNotes, agencies, clients, glossaryEntries, course };
}

export const exportJson = computed(() => {
  exportStateRevision.value;
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    ...getExportState()
  }, null, 2);
});
