<template>
  <q-page padding>
    <q-card>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col">
          <div class="text-h5">Glossary</div>
          <div class="text-subtitle2">Add terms and definitions to capture what you have learned.</div>
        </div>
        <div class="col-auto">
          <q-btn label="Add term" color="primary" icon="add" @click="openEntryDialog()" />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="entries.length === 0" class="text-grey">No glossary entries yet. Add terms to build your learning reference.</div>
        <div v-else class="q-gutter-md">
          <div v-for="entry in entries" :key="entry.id" class="q-my-sm q-pa-sm rounded-borders">
            <div class="row items-start">
              <div class="col">
                <div class="text-subtitle1">{{ entry.term }}</div>
                <div class="q-mb-sm">{{ entry.definition }}</div>

                <div v-if="entry.subterms && entry.subterms.length > 0" class="q-pl-md">
                  <div class="text-caption q-mb-xs">Sub-terms:</div>
                  <ul class="q-pl-lg q-ma-none">
                    <li v-for="sub in entry.subterms" :key="sub.id">
                      <div class="row items-center q-gutter-sm">
                        <div class="col">{{ sub.term }} <span class="text-caption">— {{ sub.definition }}</span></div>
                        <div class="col-auto">
                          <q-btn dense flat color="primary" icon="edit" @click="openEditSubtermDialog(entry.id, sub)" />
                          <ButtonWithConfirmation dense flat color="negative" icon="delete" confirm-message="Remove this sub-term?" @confirm="removeSubterm(entry.id, sub.id)" />
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div class="q-mt-sm">
                  <q-btn dense flat icon="add" label="Add sub-term" @click="openAddSubtermDialog(entry.id)" />
                </div>
              </div>

              <div class="col-auto">
                <div class="row">
                  <q-btn dense flat color="primary" icon="edit" @click="openEntryDialog(entry)" />
                  <ButtonWithConfirmation dense flat color="negative" icon="delete" confirm-message="Remove this glossary entry?" @confirm="removeEntry(entry.id)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-dialog v-model="entryDialog" persistent>
        <q-card style="min-width: 420px;">
          <q-card-section>
            <div class="text-h6">{{ editingEntry.id ? 'Edit' : 'Add' }} glossary term</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form @submit.prevent="saveEntry">
              <q-input v-model="editingEntry.term" label="Term" dense class="q-mb-md" />
              <q-input v-model="editingEntry.definition" label="Definition" dense />
              <q-card-actions align="right" class="q-mt-md">
                <q-btn flat label="Cancel" color="secondary" @click="entryDialog = false" />
                <q-btn :label="editingEntry.id ? 'Update' : 'Add'" color="primary" type="submit" />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="deleteTermDialog" persistent>
        <q-card style="min-width: 400px;">
          <q-card-section>
            <div class="text-h6">Confirm deletion</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div>Are you sure you want to delete this glossary entry? This action cannot be undone.</div>
            <q-card-actions align="right" class="q-mt-md">
              <q-btn flat label="Cancel" color="secondary" @click="deleteTermDialog = false" />
              <q-btn label="Delete" color="negative" @click="removeEntry(editingEntry.id)" />
            </q-card-actions>
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="subtermDialog" persistent>
        <q-card style="min-width: 400px;">
          <q-card-section>
            <div class="text-h6">{{ subtermContext.editingId ? 'Edit' : 'Add' }} sub-term</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form @submit.prevent="saveSubterm">
              <q-input v-model="subtermContext.term" label="Sub-term" dense class="q-mb-md" />
              <q-input v-model="subtermContext.definition" label="Definition" dense />
              <q-card-actions align="right" class="q-mt-md">
                <q-btn flat label="Cancel" color="secondary" @click="subtermDialog = false" />
                <q-btn label="Save" color="primary" type="submit" />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Notify } from 'quasar';
import type { GlossaryEntry } from '@/types';
import { uuid } from '@/utils/uuid';
import ButtonWithConfirmation from '@/components/ButtonWithConfirmation.vue';
import { notifyExportStateChanged } from '@/composables/useTrackerExport';

const STORAGE_KEY = 'glossary-entries';

function loadEntries(): GlossaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as GlossaryEntry[] : [];
  } catch {
    return [];
  }
}

const entries = ref<GlossaryEntry[]>(loadEntries());

const deleteTermDialog = ref(false);

const entryDialog = ref(false);
const editingEntry = ref<{ id: string; term: string; definition: string }>({ id: '', term: '', definition: '' });

const subtermDialog = ref(false);
const subtermContext = ref<{ parentId: string; editingId?: string; term: string; definition: string }>({ parentId: '', editingId: undefined, term: '', definition: '' });

watch(entries, (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  notifyExportStateChanged();
}, { deep: true });

function openEntryDialog(entry?: GlossaryEntry) {
  if (entry) {
    editingEntry.value.id = entry.id;
    editingEntry.value.term = entry.term;
    editingEntry.value.definition = entry.definition;
  } else {
    editingEntry.value.id = '';
    editingEntry.value.term = '';
    editingEntry.value.definition = '';
  }
  entryDialog.value = true;
}

function saveEntry() {
  if (!editingEntry.value.term.trim() || !editingEntry.value.definition.trim()) {
    Notify.create({ type: 'negative', message: 'Both term and definition are required.' });
    return;
  }

  if (editingEntry.value.id) {
    entries.value = entries.value.map((e) => e.id === editingEntry.value.id ? { ...e, term: editingEntry.value.term.trim(), definition: editingEntry.value.definition.trim() } : e);
    Notify.create({ type: 'positive', message: 'Glossary entry updated.' });
  } else {
    entries.value.unshift({ id: uuid(), term: editingEntry.value.term.trim(), definition: editingEntry.value.definition.trim(), subterms: [] });
    Notify.create({ type: 'positive', message: 'Glossary entry added.' });
  }

  entryDialog.value = false;
  editingEntry.value.id = '';
  editingEntry.value.term = '';
  editingEntry.value.definition = '';
}

function openRemoveEntryDialog(parentId: string) {
  deleteTermDialog.value = true;
}

function removeEntry(id: string) {
  entries.value = entries.value.filter((entry) => entry.id !== id);
  Notify.create({ type: 'warning', message: 'Glossary entry removed.' });
}

function openAddSubtermDialog(parentId: string) {
  subtermContext.value = { parentId, editingId: undefined, term: '', definition: '' };
  subtermDialog.value = true;
}

function openEditSubtermDialog(parentId: string, sub: GlossaryEntry) {
  subtermContext.value = { parentId, editingId: sub.id, term: sub.term, definition: sub.definition };
  subtermDialog.value = true;
}

function saveSubterm() {
  const ctx = subtermContext.value;
  if (!ctx.term.trim() || !ctx.definition.trim()) {
    Notify.create({ type: 'negative', message: 'Both sub-term and definition are required.' });
    return;
  }

  const parent = entries.value.find((e) => e.id === ctx.parentId);
  if (!parent) {
    Notify.create({ type: 'negative', message: 'Parent entry not found.' });
    subtermDialog.value = false;
    return;
  }

  parent.subterms = parent.subterms || [];

  if (ctx.editingId) {
    parent.subterms = parent.subterms.map((s) => s.id === ctx.editingId ? { ...s, term: ctx.term.trim(), definition: ctx.definition.trim() } : s);
    Notify.create({ type: 'positive', message: 'Sub-term updated.' });
  } else {
    parent.subterms.push({ id: uuid(), term: ctx.term.trim(), definition: ctx.definition.trim(), subterms: [] });
    Notify.create({ type: 'positive', message: 'Sub-term added.' });
  }

  subtermDialog.value = false;
}

function removeSubterm(parentId: string, subtermId: string) {
  const parent = entries.value.find((e) => e.id === parentId);
  if (!parent || !parent.subterms) return;
  parent.subterms = parent.subterms.filter((s) => s.id !== subtermId);
  Notify.create({ type: 'warning', message: 'Sub-term removed.' });
}
</script>
