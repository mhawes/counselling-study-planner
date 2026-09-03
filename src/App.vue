<template>
  <q-layout view="lHh Lpr lFf">
    <WelcomeDialog />

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>Counsellor Study Tracker</q-toolbar-title>
        
        <div class="q-mx-md">
          <q-chip dense outline text-color="white" color="white" v-if="autosaveEnabled && lastAutosaveDate">
            <template #default>
              Last autosave: {{ lastAutosaveDate.toLocaleString() }}
            </template>
          </q-chip>
        </div>

        <q-btn-group flat dense>
          <q-btn flat dense to="/placement" icon="home" label="Placement" color="white" class="q-mx-xs" />
          <q-btn flat dense to="/course-criteria" icon="school" label="Criteria" color="white" class="q-mx-xs" />
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
import { useQuasar } from 'quasar';
import WelcomeDialog from '@/components/WelcomeDialog.vue';

// autosave support
import { exportJson } from '@/composables/useTrackerExport';
import { useGoogleDrive2 } from '@/composables/useGoogleDrive2';

const $q = useQuasar();
const STORAGE_KEY = 'counsellor-study-tracker-dark-mode';
const isDark = ref(false);

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
let autosaveTimer: number | null = null;

const lastAutosaveDate = computed(() => {
  const timestamp = googleDrive.lastAutosave.value?.timestamp;
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
});

function scheduleAutosave() {
  if (!autosaveEnabled.value) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    void googleDrive.saveState(exportJson.value);
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
