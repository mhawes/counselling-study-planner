<template>
  <q-dialog v-model="welcomeDialogVisible" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Welcome to the Counsellor Study Tracker</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Choose a default criteria set</div>
        <q-option-group
          v-model="selectedDefaultCourseId"
          :options="defaultCourseOptions"
          type="radio"
        />
        <q-btn label="Load selected set" color="primary" :disable="!selectedDefaultCourseId" @click="loadDefaultCourse" />
      </q-card-section>
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Or load a file previously saved to Google Drive</div>
        <q-btn label="Load from Google Drive" color="secondary" @click="loadFromDrive" />
        <input ref="fileInput" type="file" accept=".json,application/json" @change="onFileSelected" style="display:none" />
        <GoogleDriveConnector
          ref="driveConnector"
          :showSave="false"
          :showLoad="false"
          :showConnect="false"
          :show-status="false"
          @fileLoaded="handleDriveFileLoaded"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirmImportDialogVisible" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Confirm course import</div>
        <div class="text-caption">Review the import details before overwriting your current model.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-body1 q-mb-sm">Importing: <strong>{{ pendingImport?.label }}</strong></div>
        <div v-if="pendingImport?.hasCriteria" class="text-negative q-mb-sm">
          This model contains criteria and will overwrite your current course data.
        </div>
        <div v-else class="text-caption q-mb-sm">
          This import will replace your current course data.
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="secondary" @click="cancelPendingImport" />
        <q-btn label="Import" color="primary" @click="confirmPendingImport" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Notify } from 'quasar';
import type { CourseSchema } from '@/types';
import { defaultCourse } from '@/data/defaultCourse';
import { CbcabLevel4_2025_2027 } from '@/data/CbcabLevel4_2025_2027';
import { useCourseStore } from '@/composables/useCourseStore';
import GoogleDriveConnector from '@/components/GoogleDriveConnector.vue';
import { notifyExportStateChanged } from '@/composables/useTrackerExport';

const store = useCourseStore();
const { welcomeDialogVisible } = store;
const selectedDefaultCourseId = ref<string | null>(null);
const confirmImportDialogVisible = ref(false);
const pendingImport = ref<{ data: CourseSchema; label: string; hasCriteria: boolean } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const driveConnector = ref<InstanceType<typeof GoogleDriveConnector> | null>(null);

const defaultCourseSets = [
  {
    id: 'cbcab-level4-2025-2027',
    label: 'CBCAB Level 4 Diploma 2025-2027',
    course: {
      ...structuredClone(CbcabLevel4_2025_2027),
    }
  }
] as const;

const defaultCourseOptions = defaultCourseSets.map((item) => ({
  label: item.label,
  value: item.id
}));

function triggerFileInput() {
  fileInput.value?.click();
}

function loadFromDrive() {
  void driveConnector.value?.loadFromGoogleDrive();
}

function handleDriveFileLoaded(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    Notify.create({ type: 'negative', message: 'The selected Drive file is not a valid tracker export.' });
    return;
  }

  const imported = payload as Record<string, unknown>;
  const course = imported.course;
  if (isValidCourseSchema(course)) {
    const keys = ['sessions', 'supervisionNotes', 'agencies', 'clients', 'glossaryEntries'] as const;
    const storageKeys = ['placement-sessions', 'placement-supervision', 'placement-agencies', 'placement-clients', 'glossary-entries'];
    keys.forEach((key, index) => {
      const value = Array.isArray(imported[key]) ? imported[key] : [];
      localStorage.setItem(storageKeys[index], JSON.stringify(value));
    });
    store.replaceCourse(course);
    notifyExportStateChanged();
    Notify.create({ type: 'positive', message: 'Tracker data loaded from Google Drive.' });
    return;
  }

  if (isValidCourseSchema(payload)) {
    pendingImport.value = {
      data: payload,
      label: `${payload.courseTitle || 'Untitled course'} (${payload.courseCode || 'Unknown code'} ${payload.courseYear || ''})`,
      hasCriteria: payload.units.some((unit) => unit.sections.some((section) => section.criteria.length > 0))
    };
    confirmImportDialogVisible.value = true;
    return;
  }

  Notify.create({ type: 'negative', message: 'The selected Drive file does not contain valid tracker data.' });
}

function loadDefaultCourse() {
  if (!selectedDefaultCourseId.value) {
    Notify.create({ type: 'negative', message: 'Select a default criteria set before loading.' });
    return;
  }

  const selected = defaultCourseSets.find((item) => item.id === selectedDefaultCourseId.value);
  if (!selected) {
    Notify.create({ type: 'negative', message: 'Selected default criteria set could not be found.' });
    return;
  }

  store.replaceCourse(selected.course);
  Notify.create({ type: 'positive', message: `Loaded default criteria set: ${selected.label}` });
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) {
    return;
  }

  handleFileImport(files[0]);
  input.value = '';
}

async function handleFileImport(file: File) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;

    if (!isValidCourseSchema(parsed)) {
      Notify.create({ type: 'negative', message: 'The selected file does not appear to be a valid course criteria JSON.' });
      return;
    }

    const data = parsed as CourseSchema;
    const hasCriteria = data.units.some((unit) => unit.sections.some((section) => section.criteria.length > 0));
    pendingImport.value = {
      data,
      label: `${data.courseTitle || 'Untitled course'} (${data.courseCode || 'Unknown code'} ${data.courseYear || ''})`,
      hasCriteria
    };
    confirmImportDialogVisible.value = true;
  } catch (err) {
    console.error(err);
    Notify.create({ type: 'negative', message: 'Failed to import file. Ensure it is valid JSON.' });
  }
}

function confirmPendingImport() {
  if (!pendingImport.value) {
    return;
  }

  store.replaceCourse(pendingImport.value.data);
  pendingImport.value = null;
  confirmImportDialogVisible.value = false;
}

function cancelPendingImport() {
  pendingImport.value = null;
  confirmImportDialogVisible.value = false;
}

function isValidCourseSchema(obj: unknown): obj is CourseSchema {
  if (!obj || typeof obj !== 'object') return false;
  const asAny = obj as any;
  if (typeof asAny.courseTitle !== 'string') return false;
  if (typeof asAny.courseCode !== 'string') return false;
  if (typeof asAny.courseYear !== 'string') return false;
  if (!Array.isArray(asAny.units)) return false;

  for (const unit of asAny.units) {
    if (!unit || typeof unit !== 'object') return false;
    if (typeof unit.id !== 'string' || typeof unit.learningOutcome !== 'string') return false;
    if (!Array.isArray(unit.sections)) return false;
    for (const section of unit.sections) {
      if (!section || typeof section !== 'object') return false;
      if (typeof section.id !== 'string' || typeof section.learningOutcome !== 'string') return false;
      if (!Array.isArray(section.criteria)) return false;
      for (const criterion of section.criteria) {
        if (!criterion || typeof criterion !== 'object') return false;
        if (typeof criterion.id !== 'string' || typeof criterion.title !== 'string') return false;
        if (!Array.isArray(criterion.guidance)) return false;
        if (!Array.isArray(criterion.claims)) return false;
      }
    }
  }

  if (asAny.rules != null) {
    if (typeof asAny.rules !== 'object') return false;
    const r = asAny.rules as any;
    if (r.perCriterion != null) {
      if (typeof r.perCriterion !== 'object') return false;
      if (typeof r.perCriterion.count !== 'number' || r.perCriterion.count < 0) return false;
    }
    if (r.perType != null) {
      if (typeof r.perType !== 'object') return false;
      if (r.perType.scope !== 'unit' && r.perType.scope !== 'section') return false;
      if (typeof r.perType.counts !== 'object') return false;
      for (const k of Object.keys(r.perType.counts)) {
        if (typeof r.perType.counts[k] !== 'number' || r.perType.counts[k] < 0) return false;
      }
    }
  }

  return true;
}
</script>

<style scoped>
</style>
