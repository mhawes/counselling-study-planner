import { computed, ref } from 'vue';
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
function loadStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch {
        return fallback;
    }
}
export function getExportState() {
    const sessions = loadStorage(STORAGE_SESSIONS, []);
    const supervisionNotes = loadStorage(STORAGE_SUPERVISION, []);
    const agencies = loadStorage(STORAGE_AGENCIES, []);
    const clients = loadStorage(STORAGE_CLIENTS, []);
    const glossaryEntries = loadStorage(STORAGE_GLOSSARY, []);
    const course = loadStorage(STORAGE_COURSE, null);
    return { sessions, supervisionNotes, agencies, clients, glossaryEntries, course };
}
export const exportJson = computed(() => {
    exportStateRevision.value;
    return JSON.stringify({
        exportedAt: new Date().toISOString(),
        ...getExportState()
    }, null, 2);
});
//# sourceMappingURL=useTrackerExport.js.map