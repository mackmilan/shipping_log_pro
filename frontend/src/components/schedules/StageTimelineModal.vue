<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnloadingSchedule } from '../../types';
import StageBadge from '../common/StageBadge.vue';
import PriorityBadge from '../common/PriorityBadge.vue';
import TimeCounter from '../common/TimeCounter.vue';
import { useI18n } from '../../i18n';
import {
  X,
  Truck,
  Warehouse,
  FileText,
  Clock,
  AlertTriangle,
  UserCheck,
  Calendar,
  MapPin,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-vue-next';

const props = defineProps<{
  schedule: UnloadingSchedule;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t, formatDate } = useI18n();
const previewImage = ref<{ url: string; caption?: string } | null>(null);
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-semibold text-white">
              {{ t('timelineModal.title') }}
            </h2>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {{ schedule.code }}
            </span>
            <PriorityBadge :priority="schedule.priority" />
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {{ schedule.truck?.plate }} • {{ schedule.truck?.driverName }} ({{ schedule.truck?.carrierName }})
          </p>
        </div>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto space-y-6">
        <!-- Metrics Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-[11px] text-slate-400 block mb-1">{{ t('timelineModal.inTransit') }}</span>
            <div class="text-base font-bold text-blue-400 font-mono">
              {{ schedule.metrics?.totalInTransitMinutes || 0 }} min
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-[11px] text-slate-400 block mb-1">{{ t('timelineModal.stoppedTime') }}</span>
            <div
              :class="[
                'text-base font-bold font-mono',
                (schedule.metrics?.totalStoppedMinutes || 0) > 0 ? 'text-rose-400' : 'text-slate-400',
              ]"
            >
              {{ schedule.metrics?.totalStoppedMinutes || 0 }} min
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-[11px] text-slate-400 block mb-1">{{ t('timelineModal.yardWait') }}</span>
            <div class="text-base font-bold text-purple-400 font-mono">
              {{ schedule.metrics?.totalYardMinutes || 0 }} min
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-[11px] text-slate-400 block mb-1">{{ t('timelineModal.unloading') }}</span>
            <div class="text-base font-bold text-emerald-400 font-mono">
              {{ schedule.metrics?.totalUnloadingMinutes || 0 }} min
            </div>
          </div>
        </div>

        <!-- Schedule Window Banner -->
        <div class="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-slate-300">
            <Calendar class="w-4 h-4 text-emerald-400" />
            <span>{{ t('timelineModal.scheduledWindow') }}</span>
            <span class="font-mono font-medium text-white">
              {{ formatDate(schedule.scheduledStartTime) }} {{ t('schedules.until') }} {{ formatDate(schedule.scheduledEndTime) }}
            </span>
          </div>

          <div v-if="schedule.dock" class="flex items-center gap-1.5 text-slate-300">
            <Warehouse class="w-4 h-4 text-indigo-400" />
            <span>{{ t('timelineModal.dock') }}</span>
            <span class="font-semibold text-white">{{ schedule.dock.code }}</span>
          </div>

          <div v-if="schedule.metrics?.isOverdue" class="flex items-center gap-1.5 text-rose-400 font-medium">
            <AlertTriangle class="w-4 h-4" />
            <span>{{ t('timelineModal.windowDelay', { minutes: schedule.metrics.delayMinutes }) }}</span>
          </div>
        </div>

        <!-- Timeline List -->
        <div>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5" />
            {{ t('timelineModal.sequenceTitle') }}
          </h3>

          <div class="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            <div
              v-for="(log, idx) in schedule.stageLogs"
              :key="log.id"
              class="relative"
            >
              <!-- Timeline Pin -->
              <div
                :class="[
                  'absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900',
                  !log.endedAt ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-slate-600',
                ]"
              />

              <div class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <StageBadge :stage="log.stage" />
                    <span v-if="!log.endedAt" class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {{ t('timelineModal.inProgress') }}
                    </span>
                  </div>

                  <div class="text-xs text-slate-400 flex items-center gap-2">
                    <span class="font-mono text-slate-300">
                      {{ formatDate(log.startedAt) }}
                      <template v-if="log.endedAt">
                        ➔ {{ formatDate(log.endedAt) }}
                      </template>
                    </span>
                    <TimeCounter
                      :minutes="log.durationMinutes || (log.endedAt ? 0 : schedule.metrics?.activeStageDurationMinutes || 0)"
                      :highlight-warning="log.stage === 'STOPPED'"
                    />
                  </div>
                </div>

                <!-- Reason if present -->
                <div v-if="log.reason" class="text-xs text-slate-200 mt-2 p-2 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                  <span class="text-slate-400 font-medium shrink-0">{{ t('timelineModal.reason') }}</span>
                  <span>{{ log.reason }}</span>
                </div>

                <!-- Notes if present -->
                <div v-if="log.notes" class="text-xs text-slate-400 mt-1.5 pl-1 italic">
                  {{ t('timelineModal.notes') }} {{ log.notes }}
                </div>

                <!-- Location if present -->
                <div
                  v-if="log.locationName || (log.latitude && log.longitude)"
                  class="text-xs text-sky-300 mt-2 p-2 rounded bg-sky-950/40 border border-sky-800/40 flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-1.5 overflow-hidden">
                    <MapPin class="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span class="truncate">{{ log.locationName || `${log.latitude?.toFixed(4)}, ${log.longitude?.toFixed(4)}` }}</span>
                  </div>
                  <a
                    v-if="log.latitude && log.longitude"
                    :href="`https://www.google.com/maps?q=${log.latitude},${log.longitude}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[10px] text-sky-400 hover:text-sky-200 flex items-center gap-1 shrink-0 font-medium underline"
                  >
                    <span>{{ t('common.viewOnMap') }}</span>
                    <ExternalLink class="w-3 h-3" />
                  </a>
                </div>

                <!-- Attached Images if present -->
                <div v-if="log.images && log.images.length > 0" class="mt-3">
                  <div class="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <ImageIcon class="w-3.5 h-3.5 text-emerald-400" />
                    <span>{{ t('timelineModal.attachedPhotos', { count: log.images.length }) }}</span>
                  </div>
                  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <div
                      v-for="(img, imgIdx) in log.images"
                      :key="img.id || imgIdx"
                      @click="previewImage = img"
                      class="group relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer hover:border-emerald-500/50 transition-all"
                    >
                      <img
                        :src="img.url"
                        :alt="img.caption || 'Foto da etapa'"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div
                        v-if="img.caption"
                        class="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-0.5 text-[9px] text-slate-200 truncate"
                      >
                        {{ img.caption }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Author info -->
                <div v-if="log.recordedBy" class="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <UserCheck class="w-3 h-3 text-slate-400" />
                  <span>{{ t('timelineModal.recordedBy', { name: log.recordedBy.name, role: log.recordedBy.role }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          {{ t('common.close') }}
        </button>
      </div>
    </div>

    <!-- Image Preview Lightbox -->
    <div
      v-if="previewImage"
      @click="previewImage = null"
      class="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-pointer"
    >
      <div class="relative max-w-4xl max-h-[85vh] flex flex-col items-center" @click.stop>
        <button
          @click="previewImage = null"
          class="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
        >
          <X class="w-6 h-6" />
        </button>
        <img
          :src="previewImage.url"
          :alt="previewImage.caption || 'Foto da etapa'"
          class="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-700"
        />
        <p v-if="previewImage.caption" class="text-sm text-slate-300 mt-3 text-center">
          {{ previewImage.caption }}
        </p>
      </div>
    </div>
  </div>
</template>
