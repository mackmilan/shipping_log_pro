<script setup lang="ts">
import { computed } from 'vue';
import { ScheduleStage } from '../../types';
import {
  Truck,
  AlertTriangle,
  Clock,
  Warehouse,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-vue-next';

const props = defineProps<{
  stage: ScheduleStage;
  showDot?: boolean;
}>();

const config = computed(() => {
  switch (props.stage) {
    case ScheduleStage.IN_TRANSIT:
      return {
        label: 'Em Trânsito',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        icon: Truck,
      };
    case ScheduleStage.STOPPED:
      return {
        label: 'Parado',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse',
        dot: 'bg-rose-500',
        icon: AlertTriangle,
      };
    case ScheduleStage.WAITING_YARD:
      return {
        label: 'No Pátio / Fila',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
        icon: Clock,
      };
    case ScheduleStage.AT_DOCK:
      return {
        label: 'Na Doca',
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        dot: 'bg-indigo-400',
        icon: Warehouse,
      };
    case ScheduleStage.UNLOADING:
      return {
        label: 'Em Descarga',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: PackageCheck,
      };
    case ScheduleStage.COMPLETED:
      return {
        label: 'Finalizado',
        bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
        dot: 'bg-slate-400',
        icon: CheckCircle2,
      };
    case ScheduleStage.CANCELLED:
      return {
        label: 'Cancelado',
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-400',
        icon: XCircle,
      };
    default:
      return {
        label: 'Agendado',
        bg: 'bg-slate-800 text-slate-400 border-slate-700',
        dot: 'bg-slate-400',
        icon: Calendar,
      };
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.bg,
    ]"
  >
    <span
      v-if="showDot"
      :class="['w-1.5 h-1.5 rounded-full inline-block', config.dot]"
    />
    <component :is="config.icon" class="w-3.5 h-3.5" />
    <span>{{ config.label }}</span>
  </span>
</template>
