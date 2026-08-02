<template>
  <q-layout view="lHh Lpr lFf">
    <WelcomeDialog />

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>Counsellor Study Tracker</q-toolbar-title>
        
        <div class="q-mx-md">
          <q-chip dense outline text-color="white" color="white" v-if="googleDrive.lastAutosave">
            <template #default>
              Autosaved: {{ googleDrive.lastAutosave.filename }} • {{ new Date(googleDrive.lastAutosave.timestamp).toLocaleString() }}
            </template>
          </q-chip>
          <q-chip dense outline text-color="white" color="white" v-else>
            Autosave: none
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
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import WelcomeDialog from '@/components/WelcomeDialog.vue';

// autosave support
import { exportJson } from '@/composables/useTrackerExport';
import { useGoogleDrive2 } from '@/composables/useGoogleDrive2';

const $q = useQuasar();
const STORAGE_KEY = 'counsellor-study-tracker-dark-mode';
const AUTOSAVE_KEY = 'google-drive-autosave';
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
let autosaveTimer: number | null = null;
const autosaveEnabled = ref<boolean>(false);
try {
  const stored = localStorage.getItem(AUTOSAVE_KEY);
  if (stored !== null) autosaveEnabled.value = JSON.parse(stored);
} catch {}

watch(
  exportJson,
  () => {
    if (!autosaveEnabled.value) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(() => {
      try {
        googleDrive.saveState(exportJson.value);
      } catch (err) {
        console.error('Global autosave failed', err);
      }
      autosaveTimer = null;
    }, 800) as unknown as number;
  },
  { deep: false }
);

// keep autosave flag in localStorage when toggled elsewhere
window.addEventListener('storage', (e) => {
  if (e.key === AUTOSAVE_KEY) {
    try {
      autosaveEnabled.value = e.newValue ? JSON.parse(e.newValue) : false;
    } catch {}
  }
});
</script>
