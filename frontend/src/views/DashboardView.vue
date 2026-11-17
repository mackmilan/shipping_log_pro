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
import { useI18n } from '../i18n';
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
const { t, formatTime } = useI18n();

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
</script>

<template>
  <AppLayout>
    <div class="p-6 sm:p-8 space-y-8 w-full">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-white">{{ t('dashboard.title') }}</h1>
            <span class="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              {{ t('dashboard.realtime') }}
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            {{ t('dashboard.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="loadData"
            :disabled="isRefreshing"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw :class="['w-3.5 h-3.5', isRefreshing ? 'animate-spin text-emerald-400' : '']" />
            <span>{{ t('dashboard.refreshData') }}</span>
          </button>

          <router-link
            to="/schedules"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>{{ t('dashboard.viewSchedules') }}</span>
            <ArrowUpRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Em Trânsito -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">{{ t('dashboard.kpi.inTransit') }}</span>
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Truck class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-white">
              {{ schedulesStore.metrics?.activeCounts?.inTransit || 0 }}
            </span>
            <span class="text-xs text-slate-400">{{ t('dashboard.kpi.trucks') }}</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ t('dashboard.kpi.avgTransit') }}</span>
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
              {{ t('dashboard.kpi.stoppedTrucks') }}
            </span>
            <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-rose-400">
              {{ schedulesStore.metrics?.activeCounts?.stopped || 0 }}
            </span>
            <span class="text-xs text-rose-400/80">{{ t('dashboard.kpi.onAlert') }}</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ t('dashboard.kpi.avgStopped') }}</span>
            <span class="font-mono text-rose-300 font-semibold">
              {{ formatTime(schedulesStore.metrics?.averages?.avgStoppedMinutes || 0) }}
            </span>
          </div>
        </div>

        <!-- No Pátio / Fila -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">{{ t('dashboard.kpi.waitingYard') }}</span>
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-white">
              {{ schedulesStore.metrics?.activeCounts?.waitingYard || 0 }}
            </span>
            <span class="text-xs text-slate-400">{{ t('dashboard.kpi.inQueue') }}</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ t('dashboard.kpi.avgWait') }}</span>
            <span class="font-mono text-slate-200">
              {{ formatTime(schedulesStore.metrics?.averages?.avgYardWaitMinutes || 0) }}
            </span>
          </div>
        </div>

        <!-- Em Descarga -->
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-400">{{ t('dashboard.kpi.activeUnloading') }}</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PackageCheck class="w-4 h-4" />
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-emerald-400">
              {{ schedulesStore.metrics?.activeCounts?.unloading || 0 }}
            </span>
            <span class="text-xs text-slate-400">{{ t('dashboard.kpi.atDocks') }}</span>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ t('dashboard.kpi.avgDuration') }}</span>
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
            <h2 class="text-base font-semibold text-white">{{ t('docks.title') }}</h2>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5 text-emerald-400">
              <span class="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{{ t('docks.availableCount', { count: schedulesStore.metrics?.docks?.available || 0 }) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-amber-400">
              <span class="w-2 h-2 rounded-full bg-amber-400" />
              <span>{{ t('docks.occupiedCount', { count: schedulesStore.metrics?.docks?.occupied || 0 }) }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="w-2 h-2 rounded-full bg-slate-500" />
              <span>{{ t('docks.maintenanceCount', { count: schedulesStore.metrics?.docks?.maintenance || 0 }) }}</span>
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
                {{ dock.status === 'AVAILABLE' ? t('docks.available') : dock.status === 'OCCUPIED' ? t('docks.occupied') : t('docks.maintenance') }}
              </span>
            </div>

            <!-- Active Truck at Dock -->
            <div
              v-if="dock.status === 'OCCUPIED'"
              class="mt-3 pt-3 border-t border-amber-500/20 text-xs space-y-1.5"
            >
              <div class="text-[11px] text-amber-300 font-medium flex items-center justify-between">
                <span>{{ t('docks.operatingTruck') }}</span>
                <span class="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                  {{ activeUnloadingTrucks.find(s => s.dockId === dock.id)?.truck?.plate || t('docks.activeUnloading') }}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 truncate">
                {{ activeUnloadingTrucks.find(s => s.dockId === dock.id)?.cargoDescription || t('docks.verificationInProgress') }}
              </div>
            </div>

            <div v-else-if="dock.status === 'AVAILABLE'" class="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{{ t('docks.readyForReception') }}</span>
              <span class="text-emerald-400">{{ t('docks.fullyAvailable') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Alerts Section (Stopped trucks & Overdue) -->
      <div v-if="criticalTrucks.length > 0">
        <div class="flex items-center gap-2 mb-4">
          <AlertTriangle class="w-4 h-4 text-rose-400" />
          <h2 class="text-base font-semibold text-white">{{ t('dashboard.criticalAlerts.title') }}</h2>
        </div>

        <div class="bg-slate-900/80 border border-rose-500/20 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">{{ t('dashboard.criticalAlerts.headers.schedule') }}</th>
                  <th class="py-3 px-4">{{ t('dashboard.criticalAlerts.headers.truckAndDriver') }}</th>
                  <th class="py-3 px-4">{{ t('dashboard.criticalAlerts.headers.statusStage') }}</th>
                  <th class="py-3 px-4">{{ t('dashboard.criticalAlerts.headers.stoppedTime') }}</th>
                  <th class="py-3 px-4">{{ t('dashboard.criticalAlerts.headers.reason') }}</th>
                  <th class="py-3 px-4 text-right">{{ t('dashboard.criticalAlerts.headers.action') }}</th>
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
                    {{ item.stageLogs?.slice(-1)[0]?.reason || (item.metrics?.isOverdue ? t('dashboard.criticalAlerts.overdueDelay', { minutes: item.metrics.delayMinutes }) : '—') }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <router-link
                      :to="`/schedules`"
                      class="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                    >
                      {{ t('dashboard.criticalAlerts.manage') }}
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
