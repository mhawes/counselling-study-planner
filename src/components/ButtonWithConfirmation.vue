<template>
  <div>
    <q-btn
      :label="label"
      :icon="icon"
      :color="color"
      :dense="dense"
      :flat="flat"
      :disable="disable"
      @click="dialog = true"
    />
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 120px;">
        <q-card-section>
          <div v-if="title" class="text-h6">{{ title }}</div>
          <div class="text">{{ confirmMessage }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :label="cancelLabel ?? 'Cancel'" color="secondary" v-close-popup />
          <q-btn :label="confirmLabel ?? 'Delete'" color="negative" @click="handleConfirm" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  label?: string;
  icon?: string;
  color?: string;
  dense?: boolean;
  flat?: boolean;
  disable?: boolean;
  confirmMessage: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

const dialog = ref(false);

function handleConfirm() {
  dialog.value = false;
  emit('confirm');
}
</script>
