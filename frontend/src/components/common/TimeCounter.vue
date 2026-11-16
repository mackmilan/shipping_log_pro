<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  minutes: number;
  highlightWarning?: boolean;
}>();

const formattedTime = computed(() => {
  const m = Math.max(0, Math.floor(props.minutes));
  if (m < 60) {
    return `${m} min`;
  }
  const hours = Math.floor(m / 60);
  const remainingM = m % 60;
  return `${hours}h ${remainingM > 0 ? remainingM + 'm' : ''}`;
});
</script>

<template>
  <span
    :class="[
      'font-mono text-xs font-semibold px-2 py-0.5 rounded',
      highlightWarning && minutes > 30
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
        : 'bg-slate-800 text-slate-300 border border-slate-700',
    ]"
  >
    {{ formattedTime }}
  </span>
</template>
