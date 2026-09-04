<template>
  <div class="q-gutter-md">
    <div class="row q-gutter-md q-mt-sm">
      <div class="col-auto" v-if="showConnect">
        <q-btn
          :label="primaryButtonLabel"
          color="teal"  
          :disable="!canConnectToGoogle"
          @click="handlePrimaryAction"
        />
      </div>
      <div class="col-auto" v-if="showLoad">
        <q-btn
          :label="loadLabel"
          color="orange"
          :disable="!canConnectToGoogle"
          @click="loadFromGoogleDrive"
        />
      </div>
    </div>

    <div v-if="showStatus" class="q-mt-md">
      <div class="text-caption q-mb-xs">Google Drive status:</div>
      <q-banner :color="googleAccessToken ? 'positive' : 'grey-3'" class="q-pa-sm">
        {{ googleDriveStatus }}
      </q-banner>
    </div>

    <q-dialog v-model="showDriveFilePicker" persistent>
      <q-card style="min-width: 480px;">
        <q-card-section>
          <div class="text-h6">Choose a tracker JSON file</div>
          <div class="text-caption">Select a JSON file from Google Drive to reload the tracker data.</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-select
            v-model="selectedDriveFileId"
            :options="driveFileOptions"
            label="Drive file"
            dense
            emit-value
            map-options
            option-label="label"
            option-value="value"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="secondary" @click="showDriveFilePicker = false" />
          <q-btn label="Load selected file" color="primary" :disable="!selectedDriveFileId" @click="importSelectedDriveFile" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, defineExpose } from 'vue';
import { Notify } from 'quasar';
import {
  recordAutosave,
  sharedGoogleAccessToken,
  sharedGoogleDriveStatus
} from '@/composables/useGoogleDrive2';

interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

const props = defineProps({
  exportJson: {
    type: String,
    default: null
  },
  showSave: {
    type: Boolean,
    default: true
  },
  showLoad: {
    type: Boolean,
    default: true
  },
  showConnect: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  connectLabel: {
    type: String,
    default: 'Connect to Google Drive'
  },
  saveLabel: {
    type: String,
    default: 'Save JSON to Google Drive'
  },
  loadLabel: {
    type: String,
    default: 'Load from Google Drive'
  }
});

const emit = defineEmits<{
  (e: 'fileLoaded', payload: unknown): void;
  (e: 'saved', message: string): void;
}>();

const googleClientId = ref('843769116026-r3e0ati85aecv5v505318oc67olakm8r.apps.googleusercontent.com');
const googleAccessToken = sharedGoogleAccessToken;
const googleDriveStatus = sharedGoogleDriveStatus;
const googleTokenClient = ref<any>(null);
const googleScriptLoaded = ref(false);
const showDriveFilePicker = ref(false);
const googleDriveFiles = ref<GoogleDriveFile[]>([]);
const selectedDriveFileId = ref('');
let googleAuthResolver: (() => void) | null = null;
let googleAuthRejecter: ((reason?: Error) => void) | null = null;

const canConnectToGoogle = computed(() => googleClientId.value !== '' && !googleClientId.value.includes('REPLACE'));

const primaryButtonLabel = computed(() => {
  if (props.showSave && props.exportJson) {
    return props.saveLabel;
  }
  return props.connectLabel;
});

function initGoogleTokenClient() {
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    googleDriveStatus.value = 'Unable to load Google Identity Services.';
    return;
  }

  googleTokenClient.value = google.accounts.oauth2.initTokenClient({
    client_id: googleClientId.value,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: (tokenResponse: any) => {
      if (tokenResponse && tokenResponse.error) {
        googleDriveStatus.value = `Drive auth failed: ${tokenResponse.error}`;
        Notify.create({ type: 'negative', message: 'Unable to connect to Google Drive.' });
        googleAuthRejecter?.(new Error(tokenResponse.error));
        googleAuthResolver = null;
        googleAuthRejecter = null;
        return;
      }
      googleAccessToken.value = tokenResponse.access_token;
      googleDriveStatus.value = 'Connected to Google Drive';
      Notify.create({ type: 'positive', message: 'Connected to Google Drive.' });
      googleAuthResolver?.();
      googleAuthResolver = null;
      googleAuthRejecter = null;
    }
  });
}

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (googleScriptLoaded.value) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => {
        googleScriptLoaded.value = true;
        initGoogleTokenClient();
        resolve();
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    script.onload = () => {
      googleScriptLoaded.value = true;
      initGoogleTokenClient();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });
}

async function connectGoogleDrive() {
  if (!canConnectToGoogle.value) {
    googleDriveStatus.value = 'Missing Google client ID.';
    Notify.create({ type: 'warning', message: 'Enter a valid Google client ID to enable Drive sync.' });
    return;
  }

  try {
    await loadGoogleScript();
    if (!googleTokenClient.value) {
      googleDriveStatus.value = 'Unable to initialize Google auth client.';
      return;
    }

    return await new Promise<void>((resolve, reject) => {
      googleAuthResolver = () => resolve();
      googleAuthRejecter = reject;
      googleTokenClient.value.requestAccessToken();
    });
  } catch (error) {
    googleDriveStatus.value = 'Failed to load Google auth library.';
    Notify.create({ type: 'negative', message: 'Could not load Google Drive connection library.' });
  }
}

async function saveStateToDrive() {
  if (!props.exportJson) return;

  if (!googleAccessToken.value) {
    await connectGoogleDrive();
    if (!googleAccessToken.value) return;
  }

  const exportJson = props.exportJson;
  const metadata: any = {
    name: `counsellor-study-tracker-${new Date().toISOString().slice(0, 10)}.json`,
    mimeType: 'application/json'
  };

  // Ensure there's a folder named 'counselling-study-planner' and store file within it
  const folderName = 'counselling-study-planner';
  let folderId: string | null = null;
  try {
    const q = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=${q}`, {
      headers: { Authorization: `Bearer ${googleAccessToken.value}` }
    });
    if (listResp.ok) {
      const listPayload = await listResp.json();
      const found = (listPayload.files || [])[0];
      if (found) folderId = found.id;
    }

    if (!folderId) {
      const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
      });

      if (createResp.ok) {
        const created = await createResp.json();
        folderId = created.id;
      }
    }
  } catch (err) {
    console.warn('Folder check/create failed', err);
  }

  if (folderId) metadata.parents = [folderId];

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    exportJson +
    closeDelimiter;

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleAccessToken.value}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      googleDriveStatus.value = 'Save failed';
      Notify.create({ type: 'negative', message: 'Google Drive save failed.' });
      console.error('Drive upload error', errorText);
      return;
    }

    const result = await response.json();
    googleDriveStatus.value = `Saved to Drive as ${result.name}`;
    recordAutosave(result.name);
    Notify.create({ type: 'positive', message: 'Tracker state saved to Google Drive.' });
    emit('saved', `Saved to Drive as ${result.name}`);
  } catch (error) {
    googleDriveStatus.value = 'Save failed';
    Notify.create({ type: 'negative', message: 'Could not save tracker state to Google Drive.' });
    console.error(error);
  }
}

async function loadFromGoogleDrive() {
  try {
    if (!googleAccessToken.value) {
      await connectGoogleDrive();
      if (!googleAccessToken.value) return;
    }

    // list only files inside counselling-study-planner folder if exists, otherwise search by name
    let listUrl = `https://www.googleapis.com/drive/v3/files?fields=files(id,name,modifiedTime)&q=trashed%3Dfalse%20and%20mimeType%3D%22application%2Fjson%22%20and%20name%20contains%20%22counsellor-study-tracker%22`;

    // attempt to find folder id
    try {
      const q = encodeURIComponent(`name='counselling-study-planner' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
      const folderResp = await fetch(`https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=${q}`, {
        headers: { Authorization: `Bearer ${googleAccessToken.value}` }
      });
      if (folderResp.ok) {
        const folderPayload = await folderResp.json();
        const folder = (folderPayload.files || [])[0];
        if (folder) {
          const folderQ = encodeURIComponent(`'${folder.id}' in parents and trashed=false and mimeType='application/json'`);
          listUrl = `https://www.googleapis.com/drive/v3/files?fields=files(id,name,modifiedTime)&q=${folderQ}`;
        }
      }
    } catch (err) {
      // ignore and continue with global search
    }

    const response = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${googleAccessToken.value}` }
    });

    if (!response.ok) throw new Error('Unable to list files from Google Drive.');

    const payload = await response.json();
    googleDriveFiles.value = (payload.files || []) as GoogleDriveFile[];
    googleDriveFiles.value.sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || ''));
    selectedDriveFileId.value = googleDriveFiles.value[0]?.id || '';

    if (googleDriveFiles.value.length === 0) {
      googleDriveStatus.value = 'No tracker JSON files found in Drive';
      Notify.create({ type: 'warning', message: 'No JSON tracker files were found in Drive.' });
      return;
    }

    showDriveFilePicker.value = true;
    googleDriveStatus.value = 'Ready to load a file from Drive';
  } catch (error) {
    googleDriveStatus.value = 'Unable to load files from Drive';
    Notify.create({ type: 'negative', message: 'Could not load files from Google Drive.' });
    console.error(error);
  }
}

async function importSelectedDriveFile() {
  if (!selectedDriveFileId.value) {
    Notify.create({ type: 'warning', message: 'Select a file from Google Drive first.' });
    return;
  }

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${selectedDriveFileId.value}?alt=media`, {
      headers: { Authorization: `Bearer ${googleAccessToken.value}` }
    });

    if (!response.ok) throw new Error('Unable to download the selected Drive file.');

    const fileContent = await response.text();
    const parsed = JSON.parse(fileContent);
    showDriveFilePicker.value = false;
    googleDriveStatus.value = 'Loaded tracker data from Google Drive';
    emit('fileLoaded', parsed);
  } catch (error) {
    googleDriveStatus.value = 'Unable to import the selected file';
    Notify.create({ type: 'negative', message: 'Could not load the selected file from Google Drive.' });
    console.error(error);
  }
}

const driveFileOptions = computed(() =>
  googleDriveFiles.value.map((file) => ({
    label: `${file.name}${file.modifiedTime ? ` • ${new Date(file.modifiedTime).toLocaleString()}` : ''}`,
    value: file.id
  }))
);

async function handlePrimaryAction() {
  if (props.showSave && props.exportJson) {
    await saveStateToDrive();
  } else {
    await connectGoogleDrive();
  }
}

// expose save for parent components
defineExpose({ saveStateToDrive, connectGoogleDrive, loadFromGoogleDrive });
</script>
