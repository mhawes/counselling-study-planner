<template>
  <q-layout view="hHh Lpr lFf">
    <WelcomeDialog />

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>Counsellor Study Tracker</q-toolbar-title>
        
        <div class="q-mx-md">
          <q-chip dense outline text-color="white" color="white" v-if="autosaveEnabled && (googleDriveSaving || lastAutosaveDate)">
            <template #default>
              <span v-if="googleDriveSaving">Saving to Google Drive...</span>
              <span v-else>Last autosave: {{ lastAutosaveDate ? formatDisplayDate(lastAutosaveDate, '', true) : '' }}</span>
            </template>
          </q-chip>
          <q-btn
            v-else-if="!autosaveEnabled"
            flat
            dense
            round
            color="white"
            icon="add_to_drive"
            :loading="manualSaveInProgress"
            aria-label="Save to Google Drive"
            @click="saveToGoogleDrive"
          >
            <q-tooltip>Save to Google Drive</q-tooltip>
          </q-btn>
        </div>

        <q-btn-group flat dense>
          <q-btn flat dense to="/course-criteria" icon="school" label="Criteria" color="white" class="q-mx-xs" />
          <q-btn v-if="hasPlacement" flat dense to="/placement" icon="home" label="Placement" color="white" class="q-mx-xs" />
          <q-btn flat dense to="/glossary" icon="menu_book" label="Glossary" color="white" class="q-mx-xs" />
          <q-btn flat dense to="/settings" icon="settings" color="white" class="q-mx-xs" />
        </q-btn-group>
        <q-toggle
          dense
          left-label
          v-model="isDark"
          icon="light_mode"
          checked-icon="dark_mode"
          color="black"
          class="q-mx-xs"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { formatDisplayDate } from '@/utils/formatDate';
import { useQuasar } from 'quasar';
import WelcomeDialog from '@/components/WelcomeDialog.vue';
import { useCourseStore } from '@/composables/useCourseStore';

// autosave support
import { exportJson } from '@/composables/useTrackerExport';
import { useGoogleDrive2 } from '@/composables/useGoogleDrive2';

const $q = useQuasar();
const { course } = useCourseStore();
const STORAGE_KEY = 'counsellor-study-tracker-dark-mode';
const isDark = ref(false);
const hasPlacement = computed(() => course.rules?.placement?.hasPlacement === true);

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      isDark.value = JSON.parse(stored);
    } else {
      isDark.value = $q.dark.isActive;
    }
  } catch {
    isDark.value = false;
  }
});

watch(isDark, (value) => {
  $q.dark.set(value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
});

// init google drive service and global autosave
const googleDrive = useGoogleDrive2();
const autosaveEnabled = googleDrive.autosaveEnabled;
const googleDriveSaving = googleDrive.googleDriveSaving;
let autosaveTimer: number | null = null;
const manualSaveInProgress = ref(false);

const lastAutosaveDate = computed(() => {
  const timestamp = googleDrive.lastAutosave.value?.timestamp;
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
});

async function saveToGoogleDrive() {
  if (manualSaveInProgress.value) return;
  manualSaveInProgress.value = true;
  try {
    await googleDrive.saveState(exportJson.value);
  } finally {
    manualSaveInProgress.value = false;
  }
}

function scheduleAutosave() {
  if (!autosaveEnabled.value) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    void googleDrive.saveState(exportJson.value, { silent: true });
    autosaveTimer = null;
  }, 800);
}

watch(
  exportJson,
  scheduleAutosave,
  { deep: false }
);

watch(autosaveEnabled, (enabled) => {
  if (enabled) scheduleAutosave();
});

</script>
