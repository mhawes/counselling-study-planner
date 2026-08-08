<template>
  <q-page padding>
    <div class="row q-gutter-lg">
      <div class="col-12 col-lg-8">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h5">Data export</div>
            <div class="text-subtitle2">Export placement sessions, supervision notes, and course claims as CSV, or save the full tracker state as JSON.</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-gutter-md q-mt-sm">
              <div class="col-12 col-md-3">
                <q-btn label="Export sessions CSV" color="primary" class="full-width" @click="exportSessionCsv" />
              </div>
              <div class="col-12 col-md-3">
                <q-btn label="Export supervision CSV" color="primary" class="full-width" @click="exportSupervisionCsv" />
              </div>
              <div class="col-12 col-md-3">
                <q-btn label="Export criteria CSV" color="primary" class="full-width" @click="exportCriteriaCsv" />
              </div>
              <div class="col-12 col-md-3">
                <q-btn label="Download tracker JSON" color="secondary" class="full-width" @click="downloadTrackerJson" />
              </div>
              <div class="col-12 col-md-3">
                <q-btn label="Upload tracker JSON" color="secondary" class="full-width" @click="triggerTrackerUpload" />
                <input ref="trackerUploadInput" type="file" accept=".json,application/json" @change="onTrackerFileSelected" style="display:none" />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Google Drive Connection</div>
            <div class="row q-gutter-md q-mt-md">
              <div class="col-12">
                <div class="row items-center q-gutter-sm q-mb-sm">
                  <div class="col-auto text-caption">Autosave to Google Drive</div>
                  <div class="col-auto">
                    <q-toggle dense v-model="autosaveEnabled" label="Enable autosave" />
                  </div>
                </div>

                <GoogleDriveConnector
                  ref="driveConnector"
                  :exportJson="exportJson"
                  :showSave="true"
                  :showLoad="true"
                  :showClientIdInput="true"
                  @fileLoaded="handleDriveFileLoaded"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Current tracker counts</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-gutter-sm">
              <div class="col-12 row items-center justify-between">
                <div>Sessions</div>
                <div><strong>{{ sessionCount }}</strong></div>
              </div>
              <div class="col-12 row items-center justify-between">
                <div>Supervision notes</div>
                <div><strong>{{ supervisionCount }}</strong></div>
              </div>
              <div class="col-12 row items-center justify-between">
                <div>Glossary entries</div>
                <div><strong>{{ glossaryCount }}</strong></div>
              </div>
              <div class="col-12 row items-center justify-between">
                <div>Course units</div>
                <div><strong>{{ courseUnits }}</strong></div>
              </div>
              <div class="col-12 q-mt-md">
                <ButtonWithConfirmation label="Clear model and start over" confirm-message="This will clear your current course model and all associated data. Are you sure?" @confirm="resetModel" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Notify } from 'quasar';
import GoogleDriveConnector from '@/components/GoogleDriveConnector.vue';
import type { PlacementSession, SupervisionNote, Agency, Client, GlossaryEntry, CourseSchema, Claim } from '@/types';
import { useCourseStore } from '@/composables/useCourseStore';
import ButtonWithConfirmation from '@/components/ButtonWithConfirmation.vue';

const STORAGE_SESSIONS = 'placement-sessions';
const STORAGE_SUPERVISION = 'placement-supervision';
const STORAGE_AGENCIES = 'placement-agencies';
const STORAGE_CLIENTS = 'placement-clients';
const STORAGE_GLOSSARY = 'glossary-entries';
const STORAGE_COURSE = 'course-criteria-data';

const trackerUploadInput = ref<HTMLInputElement | null>(null);
const driveConnector = ref<any>(null);
const AUTOSAVE_KEY = 'google-drive-autosave';
const autosaveEnabled = ref<boolean>(loadStorage<boolean>(AUTOSAVE_KEY, false));

watch(autosaveEnabled, (val) => {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(val));
  } catch {}
});

let autosaveTimer: number | null = null;

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function buildCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\r\n');
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatCsvValue(value: unknown): string {
  return value == null ? '' : String(value);
}

function getCurrentState() {
  const sessions = loadStorage<PlacementSession[]>(STORAGE_SESSIONS, []);
  const supervisionNotes = loadStorage<SupervisionNote[]>(STORAGE_SUPERVISION, []);
  const agencies = loadStorage<Agency[]>(STORAGE_AGENCIES, []);
  const clients = loadStorage<Client[]>(STORAGE_CLIENTS, []);
  const glossaryEntries = loadStorage<GlossaryEntry[]>(STORAGE_GLOSSARY, []);
  const course = loadStorage<CourseSchema | null>(STORAGE_COURSE, null);

  return { sessions, supervisionNotes, agencies, clients, glossaryEntries, course };
}

function getAgencyNameById(agencies: Agency[], id?: string) {
  return agencies.find((agency) => agency.id === id)?.name || 'Unknown agency';
}

function getClientNameById(clients: Client[], id?: string) {
  return clients.find((client) => client.id === id)?.anonymousIdentifier || 'Unknown client';
}

function getExportJson() {
  const state = getCurrentState();
  return {
    exportedAt: new Date().toISOString(),
    sessions: state.sessions,
    supervisionNotes: state.supervisionNotes,
    agencies: state.agencies,
    clients: state.clients,
    glossaryEntries: state.glossaryEntries,
    course: state.course
  };
}

function exportSessionCsv() {
  const { sessions, agencies, clients } = getCurrentState();
  const header = ['Date', 'Client', 'Agency', 'Duration', 'What happened', 'Personal process', 'Theory to apply'];
  const rows = [header];
  sessions.forEach((session) => {
    rows.push([
      formatCsvValue(session.date),
      formatCsvValue(getClientNameById(clients, session.clientId)),
      formatCsvValue(getAgencyNameById(agencies, session.agencyId)),
      formatCsvValue(session.duration),
      formatCsvValue(session.whatHappened),
      formatCsvValue(session.personalProcess),
      formatCsvValue(session.theoryToApply)
    ]);
  });
  downloadFile(`session-logs-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(rows), 'text/csv;charset=utf-8;');
  Notify.create({ type: 'positive', message: 'Session CSV exported.' });
}

function exportSupervisionCsv() {
  const { supervisionNotes } = getCurrentState();
  const header = ['Date', 'Supervisor', 'Duration', 'Clients', 'Notes'];
  const rows = [header];
  supervisionNotes.forEach((note) => {
    rows.push([
      formatCsvValue(note.date),
      formatCsvValue(note.supervisorName),
      formatCsvValue(note.duration),
      formatCsvValue(note.clients),
      formatCsvValue(note.notes)
    ]);
  });
  downloadFile(`supervision-logs-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(rows), 'text/csv;charset=utf-8;');
  Notify.create({ type: 'positive', message: 'Supervision CSV exported.' });
}

function exportCriteriaCsv() {
  const { course } = getCurrentState();
  const header = ['Unit', 'Section', 'Criterion', 'Title', 'Evidence', 'Claim date', 'Source', 'Confirmed'];
  const rows = [header];

  if (course) {
    course.units.forEach((unit) => {
      unit.sections.forEach((section) => {
        section.criteria.forEach((criterion) => {
          if (criterion.claims.length === 0) {
            rows.push([unit.id, section.id, criterion.id, criterion.title, '', '', '', '']);
          } else {
            criterion.claims.forEach((claim) => {
              rows.push([
                formatCsvValue(unit.id),
                formatCsvValue(section.id),
                formatCsvValue(criterion.id),
                formatCsvValue(criterion.title),
                formatCsvValue(claim.evidence),
                formatCsvValue(claim.claimDate),
                formatCsvValue(claim.source),
                formatCsvValue(claim.confirmed ? 'Yes' : 'No')
              ]);
            });
          }
        });
      });
    });
  }

  downloadFile(`criteria-data-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(rows), 'text/csv;charset=utf-8;');
  Notify.create({ type: 'positive', message: 'Criteria CSV exported.' });
}

function downloadTrackerJson() {
  downloadFile(`tracker-state-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(getExportJson(), null, 2), 'application/json;charset=utf-8;');
  Notify.create({ type: 'positive', message: 'Tracker JSON downloaded.' });
}

function triggerTrackerUpload() {
  trackerUploadInput.value?.click();
}

function onTrackerFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) {
    return;
  }

  const file = files[0];
  file.text()
    .then((text) => {
      try {
        const parsed = JSON.parse(text);
        applyImportedTrackerState(parsed);
        Notify.create({ type: 'positive', message: 'Tracker JSON uploaded successfully.' });
        window.location.reload();
      } catch (err) {
        console.error(err);
        Notify.create({ type: 'negative', message: 'Failed to parse tracker JSON. Please select a valid JSON file.' });
      }
    })
    .finally(() => {
      if (input) {
        input.value = '';
      }
    });
}

function applyImportedTrackerState(payload: any) {
  const importedState = payload && typeof payload === 'object' ? payload : {};
  const nextState = {
    sessions: Array.isArray(importedState.sessions) ? importedState.sessions : [],
    supervisionNotes: Array.isArray(importedState.supervisionNotes) ? importedState.supervisionNotes : [],
    agencies: Array.isArray(importedState.agencies) ? importedState.agencies : [],
    clients: Array.isArray(importedState.clients) ? importedState.clients : [],
    glossaryEntries: Array.isArray(importedState.glossaryEntries) ? importedState.glossaryEntries : [],
    course: importedState.course ?? null
  };

  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(nextState.sessions));
  localStorage.setItem(STORAGE_SUPERVISION, JSON.stringify(nextState.supervisionNotes));
  localStorage.setItem(STORAGE_AGENCIES, JSON.stringify(nextState.agencies));
  localStorage.setItem(STORAGE_CLIENTS, JSON.stringify(nextState.clients));
  localStorage.setItem(STORAGE_GLOSSARY, JSON.stringify(nextState.glossaryEntries));
  localStorage.setItem(STORAGE_COURSE, JSON.stringify(nextState.course));
}

const exportJson = computed(() => JSON.stringify(getExportJson(), null, 2));

// watch exportJson and autosave when enabled (debounced)
watch(
 exportJson,
 () => {
   if (!autosaveEnabled.value) return;
   if (!driveConnector.value?.saveStateToDrive) return;
   if (autosaveTimer) {
     clearTimeout(autosaveTimer);
   }
   autosaveTimer = window.setTimeout(() => {
     try {
       driveConnector.value.saveStateToDrive();
     } catch (err) {
       console.error('Autosave to Drive failed', err);
     }
     autosaveTimer = null;
   }, 800) as unknown as number;
 }
);

function handleDriveFileLoaded(payload: unknown) {
 applyImportedTrackerState(payload);
 window.location.reload();
}

const store = useCourseStore();
const sessionCount = computed(() => getCurrentState().sessions.length);
const supervisionCount = computed(() => getCurrentState().supervisionNotes.length);
const glossaryCount = computed(() => getCurrentState().glossaryEntries.length);
const courseUnits = computed(() => getCurrentState().course?.units.length ?? 0);

function resetModel() {
  store.continueWithEmptyModel();
  store.welcomeDialogVisible.value = true;
  Notify.create({ type: 'positive', message: 'Model cleared. Choose a criteria set to get started.' });
}
</script>
