<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import StageBadge from '../components/common/StageBadge.vue';
import PriorityBadge from '../components/common/PriorityBadge.vue';
import TimeCounter from '../components/common/TimeCounter.vue';
import { useSchedulesStore } from '../stores/schedules';
import { useDocksStore } from '../stores/docks';
import { useAuthStore } from '../stores/auth';
import { ScheduleStage } from '../types';
import {
  Truck,
  AlertTriangle,
  Clock,
  PackageCheck,
  CheckCircle2,
  Warehouse,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-vue-next';

const router = useRouter();
const schedulesStore = useSchedulesStore();
const docksStore = useDocksStore();
const authStore = useAuthStore();

const isRefreshing = ref(false);

async function loadData() {
  isRefreshing.value = true;
  await Promise.all([
    schedulesStore.fetchMetrics(),
    schedulesStore.fetchSchedules(),
    docksStore.fetchDocks(),
  ]);
  isRefreshing.value = false;
}

onMounted(() => {
  loadData();
});

// Trucks that are stopped or overdue
const criticalTrucks = computed(() => {
  return schedulesStore.schedules.filter(
    (s) => s.currentStage === ScheduleStage.STOPPED || s.metrics?.isOverdue,
  );
});

// Trucks currently unloading
const activeUnloadingTrucks = computed(() => {
  return schedulesStore.schedules.filter(
    (s) => s.currentStage === ScheduleStage.UNLOADING,
  );
});

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m > 0 ? m + 'm' : ''}`;
}
</script>

<template>
  <AppLayout>
    <div class="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-white">Painel Operacional de Descarga</h1>
            <span class="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              Tempo Real
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            Monitoramento das janelas de tempo, caminhões em trânsito, parados e docas
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="loadData"
            :disabled="isRefreshing"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw :class="['w-3.5 h-3.5', isRefreshing ? 'animate-spin text-emerald-400' : '']" />
            <span>Atualizar Dados</span>
          </button>

          <router-link
            to="/schedules"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Ver Janelas</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Em Trânsito -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">Em Trânsito</span>
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Truck class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-white">
              {{ schedulesStore.metrics?.activeCounts?.inTransit || 0 }}
            </span>
            <span class="text-xs text-slate-400">caminhões</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tempo médio rota:</span>
            <span class="font-mono text-slate-200">
              {{ formatTime(schedulesStore.metrics?.averages?.avgTransitMinutes || 0) }}
            </span>
          </div>
        </div>

        <!-- Parados (Alerta Crítico) -->
        <div
          :class="[
            'p-5 rounded-2xl bg-slate-900/80 border shadow-sm relative overflow-hidden',
            (schedulesStore.metrics?.activeCounts?.stopped || 0) > 0
              ? 'border-rose-500/40 bg-gradient-to-b from-rose-500/5 to-transparent'
              : 'border-slate-800',
          ]"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-rose-400 flex items-center gap-1.5">
              <span
                v-if="(schedulesStore.metrics?.activeCounts?.stopped || 0) > 0"
                class="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"
              />
              Caminhões Parados
            </span>
            <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-rose-400">
              {{ schedulesStore.metrics?.activeCounts?.stopped || 0 }}
            </span>
            <span class="text-xs text-rose-400/80">em alerta</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tempo médio parado:</span>
            <span class="font-mono text-rose-300 font-semibold">
              {{ formatTime(schedulesStore.metrics?.averages?.avgStoppedMinutes || 0) }}
            </span>
          </div>
        </div>

        <!-- No Pátio / Fila -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">No Pátio / Aguardando Doca</span>
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-white">
              {{ schedulesStore.metrics?.activeCounts?.waitingYard || 0 }}
            </span>
            <span class="text-xs text-slate-400">na fila</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Espera média:</span>
            <span class="font-mono text-slate-200">
              {{ formatTime(schedulesStore.metrics?.averages?.avgYardWaitMinutes || 0) }}
            </span>
          </div>
        </div>

        <!-- Em Descarga -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">Em Descarga Ativa</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PackageCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-emerald-400">
              {{ schedulesStore.metrics?.activeCounts?.unloading || 0 }}
            </span>
            <span class="text-xs text-slate-400">nas docas</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Duração média:</span>
            <span class="font-mono text-slate-200">
              {{ formatTime(schedulesStore.metrics?.averages?.avgUnloadingMinutes || 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Dock Status Overview Cards -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Warehouse class="w-4 h-4 text-emerald-400" />
            <h2 class="text-base font-semibold text-white">Status das Docas de Descarga</h2>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5 text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{{ schedulesStore.metrics?.docks?.available || 0 }} Disponíveis</span>
            </div>
            <div class="flex items-center gap-1.5 text-amber-400">
              <span class="w-2 h-2 rounded-full bg-amber-400" />
              <span>{{ schedulesStore.metrics?.docks?.occupied || 0 }} Ocupadas</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="w-2 h-2 rounded-full bg-slate-500" />
              <span>{{ schedulesStore.metrics?.docks?.maintenance || 0 }} Manutenção</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="dock in docksStore.docks"
            :key="dock.id"
            :class="[
              'p-4 rounded-2xl border transition-all relative overflow-hidden',
              dock.status === 'OCCUPIED'
                ? 'bg-amber-500/5 border-amber-500/30'
                : dock.status === 'AVAILABLE'
                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/40 border-slate-800 opacity-60',
            ]"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <span class="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {{ dock.code }}
                </span>
                <h3 class="text-sm font-semibold text-slate-200 mt-1.5 truncate">{{ dock.name }}</h3>
                <span class="text-[10px] text-slate-400">{{ dock.type }}</span>
              </div>
              <span
                :class="[
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  dock.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : dock.status === 'OCCUPIED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-slate-700/30 text-slate-400 border-slate-700',
                ]"
              >
                {{ dock.status === 'AVAILABLE' ? 'Livre' : dock.status === 'OCCUPIED' ? 'Ocupada' : 'Manutenção' }}
              </span>
            </div>

            <!-- Active Truck at Dock -->
            <div
              v-if="dock.status === 'OCCUPIED'"
              class="mt-3 pt-3 border-t border-amber-500/20 text-xs space-y-1.5"
            >
              <div class="text-[11px] text-amber-300 font-medium flex items-center justify-between">
                <span>Caminhão em Operação:</span>
                <span class="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                  {{ activeUnloadingTrucks.find(s => s.dockId === dock.id)?.truck?.plate || 'Descarga Ativa' }}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 truncate">
                {{ activeUnloadingTrucks.find(s => s.dockId === dock.id)?.cargoDescription || 'Conferência em andamento' }}
              </div>
            </div>

            <div v-else-if="dock.status === 'AVAILABLE'" class="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Pronta para recepção</span>
              <span class="text-emerald-400">100% Livre</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Alerts Section (Stopped trucks & Overdue) -->
      <div v-if="criticalTrucks.length > 0">
        <div class="flex items-center gap-2 mb-4">
          <AlertTriangle class="w-4 h-4 text-rose-400" />
          <h2 class="text-base font-semibold text-white">Alertas Operacionais & Gargalos de Tempo</h2>
        </div>

        <div class="bg-slate-900/80 border border-rose-500/20 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Agendamento</th>
                  <th class="py-3 px-4">Caminhão & Motorista</th>
                  <th class="py-3 px-4">Status / Etapa</th>
                  <th class="py-3 px-4">Tempo Parado / Decorrido</th>
                  <th class="py-3 px-4">Motivo Informado</th>
                  <th class="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr
                  v-for="item in criticalTrucks"
                  :key="item.id"
                  class="hover:bg-slate-800/40 transition-colors"
                >
                  <td class="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {{ item.code }}
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-semibold text-white">{{ item.truck?.plate }}</div>
                    <div class="text-[11px] text-slate-400">{{ item.truck?.driverName }} ({{ item.truck?.carrierName }})</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <StageBadge :stage="item.currentStage" show-dot />
                  </td>
                  <td class="py-3.5 px-4">
                    <TimeCounter
                      :minutes="item.metrics?.activeStageDurationMinutes || 0"
                      highlight-warning
                    />
                  </td>
                  <td class="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {{ item.stageLogs?.slice(-1)[0]?.reason || (item.metrics?.isOverdue ? `Atraso na janela: +${item.metrics.delayMinutes} min` : '—') }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <router-link
                      :to="`/schedules`"
                      class="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                    >
                      Gerenciar ➔
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
