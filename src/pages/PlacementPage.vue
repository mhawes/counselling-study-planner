<template>
  <q-page padding>
    <FireworksDisplay
      :active="totalHours >= 100"
      title="Placement milestone reached!"
      message="Well done! You have exceeded 100 placement hours."
      dismiss-label="Close"
    />
    <div class="row q-gutter-md">
      <div class="col">
        <q-card>
          <q-card-section>
            <div class="text-h6">Clients and Agencies</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row">
              <div class="col-6 q-pr-xs">
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-subtitle1">Agencies</div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      dense
                      color="primary"
                      icon="add"
                      label="New agency"
                      @click="openAgencyDialog()"
                    />
                  </div>
                </div>
                <div v-if="agencies.length === 0" class="text-grey">
                  No agencies added yet.
                </div>
                <div v-else>
                  <q-table
                    :rows="agencies"
                    :columns="agencyColumns"
                    row-key="id"
                    flat
                    bordered
                    dense
                    class="full-width"
                  >
                    <template #body-cell-actions="props">
                      <q-td :props="props" align="center">
                        <div class="row items-center justify-end q-gutter-xs">
                          <q-btn
                            dense
                            flat
                            icon="edit"
                            color="primary"
                            @click="openAgencyDialog(props.row)"
                          />
                          <ButtonWithConfirmation
                            dense 
                            flat 
                            icon="delete"
                            color="negative"
                            confirm-message="Remove this agency?"
                            @confirm="removeAgency(props.row.id)"
                          />
                        </div>
                      </q-td>
                    </template>
                  </q-table>
                </div>
              </div>

              <div class="col-6 q-pl-xs">
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-subtitle1">Clients</div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      dense
                      color="secondary"
                      icon="add"
                      label="New client"
                      @click="openClientDialog()"
                    />
                  </div>
                </div>
                <div v-if="clients.length === 0" class="text-grey">
                  No clients added yet.
                </div>
                <div v-else>
                  <q-table
                    :rows="clients"
                    :columns="clientColumns"
                    row-key="id"
                    flat
                    bordered
                    dense
                  >
                    <template #body-cell-agency="props">
                      <q-td :props="props">
                        {{
                          getAgencyNameById(props.row.agencyId) ||
                          "Unassigned agency"
                        }}
                      </q-td>
                    </template>
                    <template #body-cell-actions="props">
                      <q-td :props="props" align="center">
                        <div class="row items-center justify-end q-gutter-xs">
                          <q-btn
                            dense
                            flat
                            icon="edit"
                            color="primary"
                            @click="openClientDialog(props.row)"
                          />
                          <ButtonWithConfirmation
                            dense 
                            flat 
                            icon="delete"
                            color="negative"
                            confirm-message="Remove this client?"
                            @confirm="removeClient(props.row.id)"
                          />
                        </div>
                      </q-td>
                    </template>
                  </q-table>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col">
        <q-card>
          <q-card-section>
            <div class="text-h6">Hours Summary</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-mb-sm">
              <div class="col">Overall hours:</div>
              <div class="col-auto"><strong>{{ totalHours.toFixed(1) }}</strong></div>
            </div>
            <div class="q-mb-sm">Hours by client:</div>
            <div
              v-for="client in hoursByClient"
              :key="client.key"
              class="row items-center q-px-xs q-py-xs"
            >
              <div class="col">{{ client.key }}</div>
              <div class="col-auto">
                <strong>{{ client.value.toFixed(1) }}</strong>
              </div>
            </div>
            <div class="q-mt-md q-mb-sm">Hours by agency:</div>
            <div
              v-for="agency in hoursByAgency"
              :key="agency.key"
              class="row items-center q-px-xs q-py-xs"
            >
              <div class="col">{{ agency.key }}</div>
              <div class="col-auto">
                <strong>{{ agency.value.toFixed(1) }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-gutter-md">
      <div class="col-12">
        <q-card class="q-mt-md">
          <q-card-section class="row items-center q-gutter-sm">
            <div class="col">
              <div class="text-h6">Session records</div>
            </div>
            <div class="col-6 col-md-4">
              <q-select
                v-model="clientFilter"
                :options="clientOptions"
                option-label="label"
                option-value="value"
                label="Filter by client"
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-6 col-md-4">
              <q-select
                v-model="agencyFilter"
                :options="agencyOptions"
                option-label="label"
                option-value="value"
                label="Filter by agency"
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-auto">
              <q-btn
                dense
                label="Add session"
                color="primary"
                icon="add"
                @click="openSessionDialog()"
              />
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div v-if="filteredSessions.length === 0" class="text-grey">
              No placement sessions found.
            </div>
            <div v-else>
              <q-item
                v-for="session in filteredSessions"
                :key="session.id"
                class="q-mb-sm"
              >
                <q-item-section avatar>
                  <q-avatar :color="clientColor(session.clientId)">
                    <span class="text-white">{{
                      getClientInitials(session.clientId)
                    }}</span>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <div class="text-subtitle1">
                    {{ getSessionClientName(session) }} @
                    {{ getSessionAgencyName(session) }}
                  </div>
                  <div class="text-caption">
                    {{ session.date || "No date" }} • {{ session.duration }} h
                  </div>
                  <div class="q-mt-xs">
                    <strong>What happened:</strong>
                    {{ session.whatHappened || "—" }}
                  </div>
                  <div class="q-mt-xs">
                    <strong>Personal process:</strong>
                    {{ session.personalProcess || "—" }}
                  </div>
                  <div class="q-mt-xs">
                    <strong>Theory:</strong> {{ session.theoryToApply || "—" }}
                  </div>
                </q-item-section>
                <q-item-section
                  side
                  top
                  class="row items-start justify-end q-gutter-sm"
                >
                  <q-btn
                    dense
                    flat
                    icon="edit"
                    color="primary"
                    @click="openSessionDialog(session)"
                  />
                  <ButtonWithConfirmation
                    dense 
                    flat 
                    icon="delete"
                    color="negative"
                    confirm-message="Remove this session?"
                    @confirm="removeSession(session.id)"
                  />
                </q-item-section>
              </q-item>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="q-mt-lg">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col">
          <div class="text-h6">Supervision records</div>
        </div>
        <div class="col-auto">
          <q-btn
            dense
            label="Add supervision note"
            color="secondary"
            icon="add"
            @click="openSupervisionDialog()"
          />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="supervisionNotes.length === 0" class="text-grey">
          No supervision notes recorded yet.
        </div>
        <div v-else>
          <q-item
            v-for="note in supervisionNotes"
            :key="note.id"
            class="q-mb-sm"
          >
            <q-item-section>
              <div class="text-subtitle1">
                {{ note.supervisorName }} on {{ note.date || "No date" }}
              </div>
              <div class="text-caption">
                Duration: {{ note.duration }} h • Clients:
                {{ getSupervisionClientNames(note) }}
              </div>
              <div class="q-mt-xs">
                {{ note.notes || "No notes recorded." }}
              </div>
            </q-item-section>
            <q-item-section
              side
              top
              class="row items-start justify-end q-gutter-sm"
            >
              <q-btn
                dense
                flat
                icon="edit"
                color="primary"
                @click="openSupervisionDialog(note)"
              />
              <ButtonWithConfirmation
                dense 
                flat 
                icon="delete"
                color="negative"
                confirm-message="Remove this supervision note?"
                @confirm="removeSupervisionNote(note.id)"
              />
            </q-item-section>
          </q-item>
        </div>
      </q-card-section>
    </q-card>
    <q-dialog v-model="showAgencyDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ editingAgency.id ? "Edit" : "New" }} Agency
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveAgency">
            <q-input
              v-model="editingAgency.name"
              label="Agency name"
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="editingAgency.website"
              label="Website"
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="editingAgency.manager"
              label="Manager"
              dense
              class="q-mb-md"
            />
            <q-input
              v-model="editingAgency.notes"
              label="Notes"
              type="textarea"
              autogrow
              dense
            />
            <q-card-actions align="right" class="q-mt-md">
              <q-btn
                flat
                label="Cancel"
                color="secondary"
                @click="showAgencyDialog = false"
              />
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showClientDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ editingClient.id ? "Edit" : "New" }} Client
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveClient">
            <q-input
              v-model="editingClient.anonymousIdentifier"
              label="Anonymous identifier"
              dense
              class="q-mb-md"
            />
            <q-select
              v-model="editingClient.agencyId"
              :options="agencyOptions"
              option-label="label"
              option-value="value"
              label="Agency"
              dense
              emit-value
              map-options
              class="q-mb-md"
            />
            <q-card-actions align="right" class="q-mt-md">
              <q-btn
                flat
                label="Cancel"
                color="secondary"
                @click="showClientDialog = false"
              />
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showSessionDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit Session Note</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveSession">
            <div class="row q-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingSession.date"
                  label="Session Date"
                  type="date"
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="editingSession.clientId"
                  :options="clientOptions"
                  option-label="label"
                  option-value="value"
                  label="Client"
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="editingSession.agencyId"
                  :options="agencyOptions"
                  option-label="label"
                  option-value="value"
                  label="Agency"
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="editingSession.duration"
                  label="Duration (hours)"
                  type="number"
                  min="0"
                  dense
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="editingSession.whatHappened"
                  label="What happened"
                  type="textarea"
                  autogrow
                  dense
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="editingSession.personalProcess"
                  label="Personal process"
                  type="textarea"
                  autogrow
                  dense
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="editingSession.theoryToApply"
                  label="Theory to apply"
                  type="textarea"
                  autogrow
                  dense
                />
              </div>
            </div>
            <q-card-actions align="right" class="q-mt-md">
              <q-btn
                flat
                label="Cancel"
                color="secondary"
                @click="showSessionDialog = false"
              />
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showSupervisionDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit Supervision Note</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveSupervision">
            <div class="row q-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingSupervision.date"
                  label="Supervision Date"
                  type="date"
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="editingSupervision.supervisorName"
                  label="Supervisor"
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="editingSupervision.duration"
                  label="Duration (hours)"
                  type="number"
                  min="0"
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="editingSupervision.clientIds"
                  :options="clientOptions"
                  option-label="label"
                  option-value="value"
                  label="Clients discussed"
                  dense
                  multiple
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="editingSupervision.notes"
                  label="Notes"
                  type="textarea"
                  autogrow
                  dense
                />
              </div>
            </div>
            <q-card-actions align="right" class="q-mt-md">
              <q-btn
                flat
                label="Cancel"
                color="secondary"
                @click="showSupervisionDialog = false"
              />
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Notify } from "quasar";
import type {
  PlacementSession,
  SupervisionNote,
  Agency,
  Client,
} from "@/types";
import { uuid } from "@/utils/uuid";
import FireworksDisplay from '@/components/FireworksDisplay.vue';
import ButtonWithConfirmation from '@/components/ButtonWithConfirmation.vue';

const STORAGE_SESSIONS = "placement-sessions";
const STORAGE_SUPERVISION = "placement-supervision";
const STORAGE_AGENCIES = "placement-agencies";
const STORAGE_CLIENTS = "placement-clients";

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const sessions = ref<PlacementSession[]>(loadStorage(STORAGE_SESSIONS, []));
const supervisionNotes = ref<SupervisionNote[]>(
  loadStorage(STORAGE_SUPERVISION, []),
);
const agencies = ref<Agency[]>(loadStorage(STORAGE_AGENCIES, []));
const clients = ref<Client[]>(loadStorage(STORAGE_CLIENTS, []));

const showAgencyDialog = ref(false);
const showClientDialog = ref(false);
const showSessionDialog = ref(false);
const showSupervisionDialog = ref(false);

const editingAgency = reactive<Agency>({
  id: "",
  name: "",
  website: "",
  manager: "",
  notes: "",
});

const editingClient = reactive<Client>({
  id: "",
  anonymousIdentifier: "",
  agencyId: "",
});

const editingSession = reactive<PlacementSession>({
  id: "",
  date: "",
  clientId: "",
  agencyId: "",
  clientName: "",
  agency: "",
  duration: 1,
  whatHappened: "",
  personalProcess: "",
  theoryToApply: "",
});

const editingSupervision = reactive<SupervisionNote>({
  id: "",
  date: "",
  supervisorName: "",
  duration: 1,
  clientIds: [],
  clients: "",
  notes: "",
});

watch(
  sessions,
  (value) => {
    localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(value));
  },
  { deep: true },
);

watch(
  supervisionNotes,
  (value) => {
    localStorage.setItem(STORAGE_SUPERVISION, JSON.stringify(value));
  },
  { deep: true },
);

watch(
  agencies,
  (value) => {
    localStorage.setItem(STORAGE_AGENCIES, JSON.stringify(value));
  },
  { deep: true },
);

watch(
  clients,
  (value) => {
    localStorage.setItem(STORAGE_CLIENTS, JSON.stringify(value));
  },
  { deep: true },
);

watch(
  () => editingSession.clientId,
  (clientId) => {
    const client = clients.value.find((item) => item.id === clientId);
    if (client) {
      editingSession.clientName = client.anonymousIdentifier;
      if (client.agencyId) {
        editingSession.agencyId = client.agencyId;
      }
    }
  },
);

watch(
  () => editingSession.agencyId,
  (agencyId) => {
    const agency = agencies.value.find((item) => item.id === agencyId);
    if (agency) {
      editingSession.agency = agency.name;
    }
  },
);

watch(
  () => editingSupervision.clientIds,
  (value) => {
    editingSupervision.clients = (value || [])
      .map((id) => getClientNameById(id))
      .filter((name) => name)
      .join(", ");
  },
  { deep: true },
);

function getAgencyNameById(id?: string) {
  return agencies.value.find((agency) => agency.id === id)?.name ?? "";
}

function getClientNameById(id?: string) {
  return (
    clients.value.find((client) => client.id === id)?.anonymousIdentifier ?? ""
  );
}

function getSessionClientName(session: PlacementSession) {
  return (
    getClientNameById(session.clientId) ||
    session.clientName ||
    "Unknown client"
  );
}

function getSessionAgencyName(session: PlacementSession) {
  return (
    getAgencyNameById(session.agencyId) || session.agency || "Unknown agency"
  );
}

function getSupervisionClientNames(note: SupervisionNote) {
  const names = (note.clientIds || [])
    .map((id) => getClientNameById(id))
    .filter((name) => name);
  return names.length > 0 ? names.join(", ") : note.clients || "None";
}

const agencyOptions = computed(() =>
  agencies.value.map((agency) => ({ label: agency.name, value: agency.id })),
);

const clientOptions = computed(() =>
  clients.value.map((client) => ({
    label: `${client.anonymousIdentifier}${client.agencyId ? ` @ ${getAgencyNameById(client.agencyId)}` : ""}`,
    value: client.id,
  })),
);

const agencyColumns = [
  { name: "name", label: "Name", field: "name", align: "left" as const },
  {
    name: "manager",
    label: "Manager",
    field: "manager",
    align: "left" as const,
  },
  { name: "actions", label: "", field: "actions", align: "right" as const },
];

const clientColumns = [
  {
    name: "identifier",
    label: "Client",
    field: "anonymousIdentifier",
    align: "left" as const,
  },
  { name: "agency", label: "Agency", field: "agency", align: "left" as const },
  { name: "actions", label: "", field: "actions", align: "right" as const },
];

const clientFilter = ref<string | null>(null);
const agencyFilter = ref<string | null>(null);

const colorPalette = [
  "blue",
  "teal",
  "purple",
  "orange",
  "indigo",
  "green",
  "deep-orange",
  "brown",
  "cyan",
  "pink",
];

function hashStringToInt(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function clientColor(clientId?: string) {
  if (!clientId) return "grey";
  const idx = hashStringToInt(clientId) % colorPalette.length;
  return colorPalette[idx];
}

function getClientInitials(clientId?: string) {
  const client = clients.value.find((c) => c.id === clientId);
  const name = client ? client.anonymousIdentifier : "??";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const filteredSessions = computed(() => {
  return sessions.value
    .filter(
      (s) =>
        (clientFilter.value ? s.clientId === clientFilter.value : true) &&
        (agencyFilter.value ? s.agencyId === agencyFilter.value : true),
    )
    .slice()
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
});

const totalHours = computed(() =>
  sessions.value.reduce((sum, item) => sum + item.duration, 0),
);

const hoursByClient = computed(() => {
  const map = new Map<string, number>();
  sessions.value.forEach((item) => {
    const key = getSessionClientName(item);
    map.set(key, (map.get(key) ?? 0) + item.duration);
  });
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
});

const hoursByAgency = computed(() => {
  const map = new Map<string, number>();
  sessions.value.forEach((item) => {
    const key = getSessionAgencyName(item);
    map.set(key, (map.get(key) ?? 0) + item.duration);
  });
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
});

function openAgencyDialog(agency?: Agency) {
  if (agency) {
    Object.assign(editingAgency, agency);
  } else {
    Object.assign(editingAgency, {
      id: "",
      name: "",
      website: "",
      manager: "",
      notes: "",
    });
  }
  showAgencyDialog.value = true;
}

function openClientDialog(client?: Client) {
  if (client) {
    Object.assign(editingClient, client);
  } else {
    Object.assign(editingClient, {
      id: "",
      anonymousIdentifier: "",
      agencyId: "",
    });
  }
  showClientDialog.value = true;
}

function openSessionDialog(session?: PlacementSession) {
  if (session) {
    Object.assign(editingSession, session);
  } else {
    Object.assign(editingSession, {
      id: "",
      date: "",
      clientId: "",
      agencyId: "",
      clientName: "",
      agency: "",
      duration: 1,
      whatHappened: "",
      personalProcess: "",
      theoryToApply: "",
    });
  }
  showSessionDialog.value = true;
}

function openSupervisionDialog(note?: SupervisionNote) {
  if (note) {
    Object.assign(editingSupervision, note);
    if (!editingSupervision.clientIds) {
      editingSupervision.clientIds = [];
    }
  } else {
    Object.assign(editingSupervision, {
      id: "",
      date: "",
      supervisorName: "",
      duration: 1,
      clientIds: [],
      clients: "",
      notes: "",
    });
  }
  showSupervisionDialog.value = true;
}

function saveAgency() {
  if (!editingAgency.name.trim()) {
    Notify.create({ type: "negative", message: "Agency name is required." });
    return;
  }

  if (editingAgency.id) {
    agencies.value = agencies.value.map((agency) =>
      agency.id === editingAgency.id ? { ...editingAgency } : agency,
    );
  } else {
    agencies.value.push({ ...editingAgency, id: uuid() });
  }

  showAgencyDialog.value = false;
  Notify.create({ type: "positive", message: "Agency saved." });
}

function saveClient() {
  if (!editingClient.anonymousIdentifier.trim()) {
    Notify.create({
      type: "negative",
      message: "Client identifier is required.",
    });
    return;
  }

  if (!editingClient.agencyId) {
    Notify.create({
      type: "negative",
      message: "Please choose an agency for this client.",
    });
    return;
  }

  if (editingClient.id) {
    clients.value = clients.value.map((client) =>
      client.id === editingClient.id ? { ...editingClient } : client,
    );
  } else {
    clients.value.push({ ...editingClient, id: uuid() });
  }

  showClientDialog.value = false;
  Notify.create({ type: "positive", message: "Client saved." });
}

function saveSession() {
  if (!editingSession.clientId || !editingSession.agencyId) {
    Notify.create({
      type: "negative",
      message: "Please select both a client and an agency.",
    });
    return;
  }

  if (editingSession.id) {
    sessions.value = sessions.value.map((session) =>
      session.id === editingSession.id ? { ...editingSession } : session,
    );
    Notify.create({ type: "positive", message: "Session updated." });
  } else {
    sessions.value.push({ ...editingSession, id: uuid() });
    Notify.create({ type: "positive", message: "Placement session saved." });
  }

  showSessionDialog.value = false;
}

function saveSupervision() {
  if (!editingSupervision.supervisorName.trim()) {
    Notify.create({
      type: "negative",
      message: "Please provide the supervisor name.",
    });
    return;
  }

  if (editingSupervision.id) {
    supervisionNotes.value = supervisionNotes.value.map((note) =>
      note.id === editingSupervision.id ? { ...editingSupervision } : note,
    );
    Notify.create({ type: "positive", message: "Supervision note updated." });
  } else {
    supervisionNotes.value.push({ ...editingSupervision, id: uuid() });
    Notify.create({ type: "positive", message: "Supervision note saved." });
  }

  showSupervisionDialog.value = false;
}

function removeAgency(id: string) {
  agencies.value = agencies.value.filter((agency) => agency.id !== id);
  clients.value = clients.value.map((client) =>
    client.agencyId === id ? { ...client, agencyId: "" } : client,
  );

  Notify.create({ type: "warning", message: "Agency removed." });
}

function removeClient(id: string) {
  clients.value = clients.value.filter((client) => client.id !== id);
  sessions.value = sessions.value.map((session) =>
    session.clientId === id ? { ...session, clientId: undefined } : session,
  );
  if (editingSupervision.clientIds) {
    editingSupervision.clientIds = editingSupervision.clientIds.filter(
      (clientId) => clientId !== id,
    );
  }

  Notify.create({ type: "warning", message: "Client removed." });
}

function removeSession(id: string) {
  sessions.value = sessions.value.filter((entry) => entry.id !== id);
  Notify.create({ type: "warning", message: "Session removed." });
}

function removeSupervisionNote(id: string) {
  supervisionNotes.value = supervisionNotes.value.filter(
    (entry) => entry.id !== id,
  );
  Notify.create({ type: "warning", message: "Supervision note removed." });
}
</script>
