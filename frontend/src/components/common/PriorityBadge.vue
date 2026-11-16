<script setup lang="ts">
import { computed } from 'vue';
import { SchedulePriority } from '../../types';

const props = defineProps<{
  priority: SchedulePriority;
}>();

const config = computed(() => {
  switch (props.priority) {
    case SchedulePriority.URGENT:
      return {
        label: 'Urgente',
        class: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    case SchedulePriority.HIGH:
      return {
        label: 'Alta',
        class: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    case SchedulePriority.NORMAL:
      return {
        label: 'Normal',
        class: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      };
    default:
      return {
        label: 'Baixa',
        class: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      };
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
      config.class,
    ]"
  >
    {{ config.label }}
  </span>
</template>
