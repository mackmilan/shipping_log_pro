<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    minutes?: number;
    seconds?: number;
    startedAt?: string | Date | null;
    endedAt?: string | Date | null;
    live?: boolean;
    highlightWarning?: boolean;
  }>(),
  {
    minutes: 0,
    live: false,
    highlightWarning: false,
  },
);

const now = ref(Date.now());
let timerId: ReturnType<typeof setInterval> | null = null;

const isLive = computed(() => {
  if (props.endedAt) return false;
  if (props.live) return true;
  return !!props.startedAt;
});

function updateNow() {
  now.value = Date.now();
}

onMounted(() => {
  if (isLive.value) {
    timerId = setInterval(updateNow, 1000);
  }
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
});

watch(isLive, (val) => {
  if (val && !timerId) {
    updateNow();
    timerId = setInterval(updateNow, 1000);
  } else if (!val && timerId) {
    clearInterval(timerId);
    timerId = null;
  }
});

const totalSeconds = computed(() => {
  if (props.startedAt) {
    const startMs = new Date(props.startedAt).getTime();
    const endMs = props.endedAt ? new Date(props.endedAt).getTime() : now.value;
    return Math.max(0, Math.floor((endMs - startMs) / 1000));
  }
  if (props.seconds !== undefined) {
    return Math.max(0, Math.floor(props.seconds));
  }
  return Math.max(0, Math.floor(props.minutes * 60));
});

const formattedTime = computed(() => {
  // If startedAt was provided or seconds was provided or live mode is active, display with seconds
  if (props.startedAt || props.seconds !== undefined || isLive.value) {
    const s = totalSeconds.value;
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const padSec = String(secs).padStart(2, '0');
    const padMin = String(mins).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}h ${padMin}m ${padSec}s`;
    }
    return `${mins}m ${padSec}s`;
  }

  // Backward-compatible minute formatting when only minutes is passed without startedAt
  const m = Math.max(0, Math.floor(props.minutes));
  if (m < 60) {
    return `${m} min`;
  }
  const hours = Math.floor(m / 60);
  const remainingM = m % 60;
  return `${hours}h ${remainingM > 0 ? remainingM + 'm' : ''}`;
});

const elapsedMinutes = computed(() => {
  return Math.floor(totalSeconds.value / 60);
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded transition-colors',
      highlightWarning && (elapsedMinutes > 30 || minutes > 30)
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
        : 'bg-slate-800 text-slate-300 border border-slate-700',
    ]"
  >
    <span
      v-if="isLive"
      class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
      title="Atualizando em tempo real"
    />
    <span>{{ formattedTime }}</span>
  </span>
</template>
