import { ref } from 'vue';
import { Notify } from 'quasar';

const STORAGE_GOOGLE_CLIENT_ID = 'google-drive-client-id';
const STORAGE_LAST_AUTOSAVE = 'google-drive-last-autosave';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useGoogleDrive2() {
  const googleClientId = ref(loadStorage<string>(STORAGE_GOOGLE_CLIENT_ID, ''));
  const googleAccessToken = ref('');
  const googleDriveStatus = ref('Not connected');
  const googleTokenClient = ref<any>(null);
  const googleScriptLoaded = ref(false);

  let _initialLastAutosave: { filename: string; timestamp: string } | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_LAST_AUTOSAVE);
    _initialLastAutosave = raw ? JSON.parse(raw) : null;
  } catch {
    _initialLastAutosave = null;
  }
  const lastAutosave = ref<{ filename: string; timestamp: string } | null>(_initialLastAutosave);

  function persistLastAutosave(filename: string) {
    const payload = { filename, timestamp: new Date().toISOString() };
    lastAutosave.value = payload;
    try {
      localStorage.setItem(STORAGE_LAST_AUTOSAVE, JSON.stringify(payload));
    } catch {}
  }

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
          return;
        }
        googleAccessToken.value = tokenResponse.access_token;
        googleDriveStatus.value = 'Connected to Google Drive';
        Notify.create({ type: 'positive', message: 'Connected to Google Drive.' });
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
    if (!googleClientId.value) {
      googleDriveStatus.value = 'Missing Google client ID.';
      Notify.create({ type: 'warning', message: 'Enter a valid Google client ID to enable Drive sync.' });
      return false;
    }

    try {
      await loadGoogleScript();
      if (!googleTokenClient.value) {
        googleDriveStatus.value = 'Unable to initialize Google auth client.';
        return false;
      }

      return new Promise<boolean>((resolve, reject) => {
        googleTokenClient.value.requestAccessToken();
        const t = setInterval(() => {
          if (googleAccessToken.value) {
            clearInterval(t);
            resolve(true);
          }
        }, 200);
        setTimeout(() => {
          clearInterval(t);
          if (googleAccessToken.value) resolve(true);
          else reject(new Error('Google auth timeout'));
        }, 10000);
      });
    } catch (error) {
      googleDriveStatus.value = 'Failed to load Google auth library.';
      Notify.create({ type: 'negative', message: 'Could not load Google Drive connection library.' });
      return false;
    }
  }

  async function saveState(exportJson: string) {
    if (!exportJson) return false;
    if (!googleAccessToken.value) {
      const ok = await connectGoogleDrive();
      if (!ok) return false;
    }

    const metadata: any = {
      name: `counsellor-study-tracker-${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: 'application/json'
    };

    // ensure folder
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
        return false;
      }

      const result = await response.json();
      googleDriveStatus.value = `Saved to Drive as ${result.name}`;
      persistLastAutosave(result.name);
      Notify.create({ type: 'positive', message: 'Tracker state saved to Google Drive.' });
      return true;
    } catch (error) {
      googleDriveStatus.value = 'Save failed';
      Notify.create({ type: 'negative', message: 'Could not save tracker state to Google Drive.' });
      console.error(error);
      return false;
    }
  }

  return {
    googleClientId,
    googleAccessToken,
    googleDriveStatus,
    lastAutosave,
    connectGoogleDrive,
    saveState
  };
}
