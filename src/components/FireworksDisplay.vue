<template>
  <div v-show="active" class="fireworks-root">
    <div ref="container" class="fireworks-container" aria-hidden="true"></div>
    <div v-if="messageVisible" class="fireworks-message-overlay">
      <div class="fireworks-message-card">
        <div class="fireworks-message-title">{{ title }}</div>
        <div class="fireworks-message-text">{{ message }}</div>
        <button class="fireworks-dismiss-button" type="button" @click="dismissMessage">
          {{ dismissLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Fireworks } from 'fireworks-js';
import { defineProps, ref, watch, onBeforeUnmount, nextTick, computed } from 'vue';

const props = defineProps<{
  active: boolean;
  title?: string;
  message?: string;
  dismissLabel?: string;
}>();

const container = ref<HTMLElement | null>(null);
const fireworksInstance = ref<any>(null);
const messageVisible = ref(false);
const dismissed = ref(false);

const title = computed(() => props.title ?? 'Congratulations!');
const message = computed(() => props.message ?? 'You have unlocked a celebration.');
const dismissLabel = computed(() => props.dismissLabel ?? 'Dismiss');

function stopFireworks() {
  if (fireworksInstance.value) {
    try {
      fireworksInstance.value.stop();
    } catch {
      // ignore
    }
    fireworksInstance.value = null;
  }
}

watch(
  () => props.active,
  async (active) => {
    if (active) {
      if (!dismissed.value) {
        messageVisible.value = true;
        await nextTick();
        const el = container.value;
        if (!el) {
          return;
        }
        if (fireworksInstance.value) {
          return;
        }
        fireworksInstance.value = new Fireworks(el, {
          speed: 3,
          acceleration: 1.05,
          friction: 0.98,
          particles: 60,
          trace: 3,
          explosion: 4,
        });
        fireworksInstance.value.start();
      }
    } else {
      dismissed.value = false;
      messageVisible.value = false;
      stopFireworks();
    }
  },
  { immediate: true },
);

function dismissMessage() {
  dismissed.value = true;
  messageVisible.value = false;
  stopFireworks();
}

onBeforeUnmount(stopFireworks);
</script>

<style scoped>
.fireworks-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.fireworks-container {
  position: absolute;
  inset: 0;
}

.fireworks-message-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.fireworks-message-card {
  pointer-events: auto;
  background: rgba(18, 18, 18, 0.9);
  color: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 460px;
  width: calc(100% - 48px);
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.fireworks-message-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.fireworks-message-text {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.fireworks-dismiss-button {
  border: none;
  background: #ffffff;
  color: #1f2937;
  padding: 0.75rem 1.4rem;
  border-radius: 9999px;
  font-weight: 700;
  cursor: pointer;
}

.fireworks-dismiss-button:hover {
  background: #f3f4f6;
}
</style>
