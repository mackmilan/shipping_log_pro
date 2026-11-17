<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import StageBadge from '../components/common/StageBadge.vue';
import PriorityBadge from '../components/common/PriorityBadge.vue';
import TimeCounter from '../components/common/TimeCounter.vue';
import StageTransitionModal from '../components/schedules/StageTransitionModal.vue';
import StageTimelineModal from '../components/schedules/StageTimelineModal.vue';
import NewScheduleModal from '../components/schedules/NewScheduleModal.vue';
import { useSchedulesStore } from '../stores/schedules';
import { useDocksStore } from '../stores/docks';
import { useTrucksStore } from '../stores/trucks';
import { useAuthStore } from '../stores/auth';
import { useI18n } from '../i18n';
import { UnloadingSchedule, ScheduleStage } from '../types';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  History,
  ArrowRightCircle,
  Warehouse,
  Truck,
  Trash2,
  AlertTriangle,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-vue-next';

const schedulesStore = useSchedulesStore();
const docksStore = useDocksStore();
const trucksStore = useTrucksStore();
const authStore = useAuthStore();
const { t, formatDate } = useI18n();

// View and filter states
const viewMode = ref<'list' | 'board'>('list');
const searchTerm = ref('');
const selectedStageFilter = ref<string>('');

// Modal states
const selectedScheduleForTransition = ref<UnloadingSchedule | null>(null);
const selectedScheduleForTimeline = ref<UnloadingSchedule | null>(null);
const isNewScheduleModalOpen = ref(false);

async function loadData() {
  await Promise.all([
    schedulesStore.fetchSchedules({
      search: searchTerm.value || undefined,
      stage: selectedStageFilter.value || undefined,
    }),
    docksStore.fetchDocks(),
    trucksStore.fetchTrucks(),
  ]);
}

onMounted(() => {
  loadData();
});

function handleFilter() {
  schedulesStore.fetchSchedules({
    search: searchTerm.value || undefined,
    stage: selectedStageFilter.value || undefined,
  });
}

// Stage transition handlers
function openTransitionModal(schedule: UnloadingSchedule) {
  selectedScheduleForTransition.value = schedule;
}

async function handleTransitionSubmit(payload: any) {
  if (!selectedScheduleForTransition.value) return;
  try {
    await schedulesStore.updateStage(selectedScheduleForTransition.value.id, payload);
    selectedScheduleForTransition.value = null;
  } catch (err: any) {
    alert(err.response?.data?.message || t('schedules.errors.stageUpdate'));
  }
}

// Create schedule handlers
async function handleNewScheduleSubmit(payload: any) {
  try {
    await schedulesStore.createSchedule(payload);
    isNewScheduleModalOpen.value = false;
  } catch (err: any) {
    alert(err.response?.data?.message || t('schedules.errors.create'));
  }
}

// Delete schedule handler (Admin only)
async function handleDelete(id: number) {
  if (!confirm(t('schedules.deleteConfirm'))) return;
  try {
    await schedulesStore.deleteSchedule(id);
  } catch (err: any) {
    alert(err.response?.data?.message || t('schedules.errors.delete'));
  }
}
</script>

<template>
  <AppLayout>
    <div class="p-6 sm:p-8 space-y-6 w-full">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-white">{{ t('schedules.title') }}</h1>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {{ t('schedules.scheduleCount', { count: schedulesStore.schedules.length }) }}
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            {{ t('schedules.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- View Mode Toggle -->
          <div class="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-1.5 rounded-lg text-xs font-medium transition-colors',
                viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
              ]"
              :title="t('schedules.listView')"
            >
              <List class="w-4 h-4" />
            </button>
            <button
              @click="viewMode = 'board'"
              :class="[
                'p-1.5 rounded-lg text-xs font-medium transition-colors',
                viewMode === 'board' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
              ]"
              :title="t('schedules.boardView')"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
          </div>

          <!-- Create Button (Admin or Operator) -->
          <button
            v-if="authStore.isOperator"
            @click="isNewScheduleModalOpen = true"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('schedules.newSchedule') }}</span>
          </button>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchTerm"
            @input="handleFilter"
            type="text"
            :placeholder="t('schedules.searchPlaceholder')"
            class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <Filter class="w-3.5 h-3.5 text-slate-400" />
            <select
              v-model="selectedStageFilter"
              @change="handleFilter"
              class="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">{{ t('stages.allStages') }}</option>
              <option value="IN_TRANSIT">{{ t('stages.inTransit') }}</option>
              <option value="STOPPED">{{ t('stages.stoppedAlert') }}</option>
              <option value="WAITING_YARD">{{ t('stages.waitingYard') }}</option>
              <option value="AT_DOCK">{{ t('stages.atDock') }}</option>
              <option value="UNLOADING">{{ t('stages.unloading') }}</option>
              <option value="COMPLETED">{{ t('stages.completed') }}</option>
              <option value="SCHEDULED">{{ t('stages.scheduled') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-if="viewMode === 'list'" class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.codeAndCargo') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.truckAndDriver') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.dock') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.scheduledWindow') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.currentStage') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.timeInStage') }}</th>
                <th class="py-3 px-4">{{ t('schedules.tableHeaders.totalTimes') }}</th>
                <th class="py-3 px-4 text-right">{{ t('schedules.tableHeaders.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr
                v-for="item in schedulesStore.schedules"
                :key="item.id"
                class="hover:bg-slate-800/40 transition-colors"
              >
                <!-- Code & Cargo -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-200">{{ item.code }}</span>
                    <PriorityBadge :priority="item.priority" />
                  </div>
                  <div class="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                    {{ item.cargoDescription }}
                  </div>
                </td>

                <!-- Truck -->
                <td class="py-3.5 px-4">
                  <div class="font-semibold text-white flex items-center gap-1.5">
                    <Truck class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ item.truck?.plate }}</span>
                  </div>
                  <div class="text-[11px] text-slate-400">
                    {{ item.truck?.driverName }} • {{ item.truck?.carrierName }}
                  </div>
                </td>

                <!-- Dock -->
                <td class="py-3.5 px-4">
                  <div v-if="item.dock" class="flex items-center gap-1 font-medium text-indigo-300">
                    <Warehouse class="w-3.5 h-3.5" />
                    <span>{{ item.dock.code }}</span>
                  </div>
                  <span v-else class="text-slate-500 italic">{{ t('common.unassigned') }}</span>
                </td>

                <!-- Planned Window -->
                <td class="py-3.5 px-4">
                  <div class="font-mono text-slate-200">
                    {{ formatDate(item.scheduledStartTime) }}
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {{ t('schedules.until') }} {{ formatDate(item.scheduledEndTime) }}
                  </div>
                  <div v-if="item.metrics?.isOverdue" class="text-[10px] text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    <span>{{ t('schedules.delay', { minutes: item.metrics.delayMinutes }) }}</span>
                  </div>
                </td>

                <!-- Current Stage -->
                <td class="py-3.5 px-4">
                  <StageBadge :stage="item.currentStage" show-dot />
                </td>

                <!-- Active Stage Duration -->
                <td class="py-3.5 px-4">
                  <TimeCounter
                    :minutes="item.metrics?.activeStageDurationMinutes || 0"
                    :highlight-warning="item.currentStage === 'STOPPED'"
                  />
                </td>

                <!-- Total Times Breakdown -->
                <td class="py-3.5 px-4">
                  <div class="flex flex-col gap-1 text-[10px] font-mono">
                    <span v-if="item.metrics?.totalInTransitMinutes" class="text-blue-400">
                      {{ t('schedules.breakdownRoute', { minutes: item.metrics.totalInTransitMinutes }) }}
                    </span>
                    <span v-if="item.metrics?.totalStoppedMinutes" class="text-rose-400 font-bold">
                      {{ t('schedules.breakdownStopped', { minutes: item.metrics.totalStoppedMinutes }) }}
                    </span>
                    <span v-if="item.metrics?.totalUnloadingMinutes" class="text-emerald-400">
                      {{ t('schedules.breakdownUnloading', { minutes: item.metrics.totalUnloadingMinutes }) }}
                    </span>
                  </div>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Update Stage (Operator or Admin) -->
                    <button
                      v-if="authStore.isOperator && item.currentStage !== 'COMPLETED' && item.currentStage !== 'CANCELLED'"
                      @click="openTransitionModal(item)"
                      class="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center gap-1"
                      :title="t('schedules.changeStage')"
                    >
                      <ArrowRightCircle class="w-3.5 h-3.5" />
                      <span>{{ t('schedules.stageAction') }}</span>
                    </button>

                    <!-- View Timeline History -->
                    <button
                      @click="selectedScheduleForTimeline = item"
                      class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      :title="t('schedules.viewHistory')"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <!-- Delete (Admin only) -->
                    <button
                      v-if="authStore.isAdmin"
                      @click="handleDelete(item.id)"
                      class="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      :title="t('schedules.deleteSchedule')"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="schedulesStore.schedules.length === 0">
                <td colspan="8" class="text-center py-10 text-slate-500">
                  {{ t('schedules.emptyState') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOARD / KANBAN VIEW -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Coluna: Em Trânsito -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Truck class="w-4 h-4" />
              {{ t('schedules.boardTransit') }}
            </span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {{ schedulesStore.schedules.filter(s => s.currentStage === 'IN_TRANSIT').length }}
            </span>
          </div>

          <div class="space-y-3 overflow-y-auto max-h-[70vh]">
            <div
              v-for="card in schedulesStore.schedules.filter(s => s.currentStage === 'IN_TRANSIT')"
              :key="card.id"
              class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-white">{{ card.code }}</span>
                <TimeCounter :minutes="card.metrics?.activeStageDurationMinutes || 0" />
              </div>
              <div class="text-xs font-semibold text-slate-200">{{ card.truck?.plate }}</div>
              <div class="text-[11px] text-slate-400">{{ card.truck?.driverName }} ({{ card.truck?.carrierName }})</div>
              <div class="text-[11px] text-slate-300 truncate">{{ card.cargoDescription }}</div>

              <div class="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <button
                  @click="selectedScheduleForTimeline = card"
                  class="text-[11px] text-slate-400 hover:text-white"
                >
                  {{ t('schedules.btnHistory') }}
                </button>
                <button
                  v-if="authStore.isOperator"
                  @click="openTransitionModal(card)"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {{ t('schedules.btnAdvance') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna: Parado -->
        <div class="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-rose-500/20">
            <span class="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle class="w-4 h-4" />
              {{ t('schedules.boardStopped') }}
            </span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {{ schedulesStore.schedules.filter(s => s.currentStage === 'STOPPED').length }}
            </span>
          </div>

          <div class="space-y-3 overflow-y-auto max-h-[70vh]">
            <div
              v-for="card in schedulesStore.schedules.filter(s => s.currentStage === 'STOPPED')"
              :key="card.id"
              class="p-3.5 rounded-xl bg-slate-800/80 border border-rose-500/30 hover:border-rose-500 transition-all space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-rose-300">{{ card.code }}</span>
                <TimeCounter :minutes="card.metrics?.activeStageDurationMinutes || 0" highlight-warning />
              </div>
              <div class="text-xs font-semibold text-white">{{ card.truck?.plate }}</div>
              <div class="text-[11px] text-slate-400">{{ card.truck?.driverName }}</div>
              <div class="text-[11px] text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                {{ t('schedules.reasonLabel') }} {{ card.stageLogs?.slice(-1)[0]?.reason || t('schedules.reasonNotReported') }}
              </div>

              <div class="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <button
                  @click="selectedScheduleForTimeline = card"
                  class="text-[11px] text-slate-400 hover:text-white"
                >
                  {{ t('schedules.btnHistory') }}
                </button>
                <button
                  v-if="authStore.isOperator"
                  @click="openTransitionModal(card)"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {{ t('schedules.btnRelease') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna: No Pátio / Doca -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <Clock class="w-4 h-4" />
              {{ t('schedules.boardYardDock') }}
            </span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {{ schedulesStore.schedules.filter(s => s.currentStage === 'WAITING_YARD' || s.currentStage === 'AT_DOCK').length }}
            </span>
          </div>

          <div class="space-y-3 overflow-y-auto max-h-[70vh]">
            <div
              v-for="card in schedulesStore.schedules.filter(s => s.currentStage === 'WAITING_YARD' || s.currentStage === 'AT_DOCK')"
              :key="card.id"
              class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-white">{{ card.code }}</span>
                <StageBadge :stage="card.currentStage" />
              </div>
              <div class="text-xs font-semibold text-slate-200">{{ card.truck?.plate }}</div>
              <div v-if="card.dock" class="text-[11px] text-indigo-400 font-medium">{{ t('schedules.dockLabel') }} {{ card.dock.code }}</div>

              <div class="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <button
                  @click="selectedScheduleForTimeline = card"
                  class="text-[11px] text-slate-400 hover:text-white"
                >
                  {{ t('schedules.btnHistory') }}
                </button>
                <button
                  v-if="authStore.isOperator"
                  @click="openTransitionModal(card)"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {{ t('schedules.btnUnload') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna: Em Descarga -->
        <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Warehouse class="w-4 h-4" />
              {{ t('schedules.boardUnloading') }}
            </span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {{ schedulesStore.schedules.filter(s => s.currentStage === 'UNLOADING').length }}
            </span>
          </div>

          <div class="space-y-3 overflow-y-auto max-h-[70vh]">
            <div
              v-for="card in schedulesStore.schedules.filter(s => s.currentStage === 'UNLOADING')"
              :key="card.id"
              class="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500 transition-all space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-bold text-emerald-300">{{ card.code }}</span>
                <TimeCounter :minutes="card.metrics?.activeStageDurationMinutes || 0" />
              </div>
              <div class="text-xs font-semibold text-white">{{ card.truck?.plate }}</div>
              <div v-if="card.dock" class="text-[11px] text-emerald-400 font-semibold">{{ t('schedules.dockLabel') }} {{ card.dock.code }}</div>
              <div class="text-[11px] text-slate-300 truncate">{{ card.cargoDescription }}</div>

              <div class="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <button
                  @click="selectedScheduleForTimeline = card"
                  class="text-[11px] text-slate-400 hover:text-white"
                >
                  {{ t('schedules.btnHistory') }}
                </button>
                <button
                  v-if="authStore.isOperator"
                  @click="openTransitionModal(card)"
                  class="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {{ t('schedules.btnComplete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <StageTransitionModal
        v-if="selectedScheduleForTransition"
        :schedule="selectedScheduleForTransition"
        :docks="docksStore.docks"
        @close="selectedScheduleForTransition = null"
        @submit="handleTransitionSubmit"
      />

      <StageTimelineModal
        v-if="selectedScheduleForTimeline"
        :schedule="selectedScheduleForTimeline"
        @close="selectedScheduleForTimeline = null"
      />

      <NewScheduleModal
        v-if="isNewScheduleModalOpen"
        :trucks="trucksStore.trucks"
        :docks="docksStore.docks"
        @close="isNewScheduleModalOpen = false"
        @submit="handleNewScheduleSubmit"
      />
    </div>
  </AppLayout>
</template>
