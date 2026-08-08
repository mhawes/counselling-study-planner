<template>
  <q-dialog v-model="welcomeDialogVisible" persistent>
    <q-card style="min-width: 560px; max-width: 760px;">
      <q-card-section>
        <div class="text-h6">Welcome to the Counsellor Study Tracker</div>
        <div class="text-caption">Start by choosing a default criteria set, importing a saved criteria JSON file, or continue with an empty model.</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Choose a default criteria set</div>
        <q-option-group
          v-model="selectedDefaultCourseId"
          :options="defaultCourseOptions"
          type="radio"
        />
        <div class="row q-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-btn unelevated label="Load selected set" color="primary" :disable="!selectedDefaultCourseId" @click="loadDefaultCourse" class="full-width" />
          </div>
          <div class="col-12 col-md-6">
            <q-btn outlined label="Import criteria JSON" color="secondary" @click="triggerFileInput" class="full-width" />
          </div>
        </div>
        <div class="row q-gutter-md q-mt-sm">
          <div class="col-12 col-md-6">
            <q-btn flat label="Connect to Drive" color="primary" @click="connectToDrive" class="full-width" />
          </div>
          <div class="col-12 col-md-6">
            <q-btn flat label="Continue with empty model" color="secondary" @click="store.continueWithEmptyModel" class="full-width" />
          </div>
        </div>
        <input ref="fileInput" type="file" accept=".json,application/json" @change="onFileSelected" style="display:none" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="confirmImportDialogVisible" persistent>
    <q-card style="min-width: 480px;">
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

const store = useCourseStore();
const { welcomeDialogVisible } = store;
const selectedDefaultCourseId = ref<string | null>(null);
const confirmImportDialogVisible = ref(false);
const pendingImport = ref<{ data: CourseSchema; label: string; hasCriteria: boolean } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

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

function connectToDrive() {
  Notify.create({
    type: 'info',
    message: 'Google Drive import is not available from this dialog yet. Use the file picker to load a JSON file from a connected drive.'
  });
  triggerFileInput();
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
