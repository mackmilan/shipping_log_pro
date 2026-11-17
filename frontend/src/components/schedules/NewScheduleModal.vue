<script setup lang="ts">
import { ref } from 'vue';
import { Truck, Dock, SchedulePriority, ScheduleStage } from '../../types';
import { useI18n } from '../../i18n';
import { X, CalendarPlus, Truck as TruckIcon } from 'lucide-vue-next';

const props = defineProps<{
  trucks: Truck[];
  docks: Dock[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: any): void;
}>();

const { t } = useI18n();

// Form state
const truckId = ref<number | ''>(props.trucks[0]?.id || '');
const dockId = ref<number | ''>('');
const priority = ref<SchedulePriority>(SchedulePriority.NORMAL);
const initialStage = ref<ScheduleStage>(ScheduleStage.SCHEDULED);
const cargoDescription = ref('');
const cargoWeightKg = ref<number | ''>('');
const invoiceNumber = ref('');
const estimatedDurationMinutes = ref<number>(60);
const notes = ref('');

// Default scheduled dates: start in 1 hour, end in 2.5 hours
const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const toDateTimeLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const startDefault = new Date(now.getTime() + 60 * 60 * 1000);
const endDefault = new Date(now.getTime() + 150 * 60 * 1000);

const scheduledStartTime = ref(toDateTimeLocal(startDefault));
const scheduledEndTime = ref(toDateTimeLocal(endDefault));

function handleSubmit() {
  if (!truckId.value || !cargoDescription.value || !scheduledStartTime.value || !scheduledEndTime.value) {
    alert(t('newScheduleModal.fillRequired'));
    return;
  }

  emit('submit', {
    truckId: Number(truckId.value),
    dockId: dockId.value ? Number(dockId.value) : undefined,
    scheduledStartTime: new Date(scheduledStartTime.value).toISOString(),
    scheduledEndTime: new Date(scheduledEndTime.value).toISOString(),
    priority: priority.value,
    initialStage: initialStage.value,
    cargoDescription: cargoDescription.value,
    cargoWeightKg: cargoWeightKg.value ? Number(cargoWeightKg.value) : undefined,
    invoiceNumber: invoiceNumber.value || undefined,
    estimatedDurationMinutes: Number(estimatedDurationMinutes.value) || 60,
    notes: notes.value || undefined,
  });
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CalendarPlus class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-white">{{ t('newScheduleModal.title') }}</h2>
            <p class="text-xs text-slate-400">{{ t('newScheduleModal.subtitle') }}</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-5 overflow-y-auto space-y-4">
        <!-- Caminhão -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            {{ t('newScheduleModal.truckSelect') }}
          </label>
          <select
            v-model="truckId"
            required
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="" disabled>{{ t('newScheduleModal.truckSelectPlaceholder') }}</option>
            <option
              v-for="truck in trucks"
              :key="truck.id"
              :value="truck.id"
            >
              {{ truck.plate }} • {{ truck.driverName }} ({{ truck.carrierName }}) - {{ truck.truckType }}
            </option>
          </select>
        </div>

        <!-- Janela de Horário -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.startWindow') }}
            </label>
            <input
              v-model="scheduledStartTime"
              type="datetime-local"
              required
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.endWindow') }}
            </label>
            <input
              v-model="scheduledEndTime"
              type="datetime-local"
              required
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <!-- Doca e Prioridade -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.dockAssigned') }}
            </label>
            <select
              v-model="dockId"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">{{ t('newScheduleModal.dockToDefine') }}</option>
              <option
                v-for="dock in docks"
                :key="dock.id"
                :value="dock.id"
              >
                {{ dock.code }} - {{ dock.name }} ({{ dock.status }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.priority') }}
            </label>
            <select
              v-model="priority"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option :value="SchedulePriority.LOW">{{ t('priorities.low') }}</option>
              <option :value="SchedulePriority.NORMAL">{{ t('priorities.normal') }}</option>
              <option :value="SchedulePriority.HIGH">{{ t('priorities.high') }}</option>
              <option :value="SchedulePriority.URGENT">{{ t('priorities.urgent') }}</option>
            </select>
          </div>
        </div>

        <!-- Etapa Inicial -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            {{ t('newScheduleModal.initialStage') }}
          </label>
          <select
            v-model="initialStage"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option :value="ScheduleStage.SCHEDULED">{{ t('stages.descScheduled') }}</option>
            <option :value="ScheduleStage.IN_TRANSIT">{{ t('stages.descInTransitOption') }}</option>
            <option :value="ScheduleStage.WAITING_YARD">{{ t('stages.descWaitingYardOption') }}</option>
          </select>
        </div>

        <!-- Descrição da Carga -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            {{ t('newScheduleModal.cargoDescription') }}
          </label>
          <input
            v-model="cargoDescription"
            type="text"
            required
            :placeholder="t('newScheduleModal.cargoPlaceholder')"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <!-- Peso, NF-e, Tempo Estimado -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.cargoWeight') }}
            </label>
            <input
              v-model="cargoWeightKg"
              type="number"
              step="any"
              :placeholder="t('newScheduleModal.weightPlaceholder')"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.invoice') }}
            </label>
            <input
              v-model="invoiceNumber"
              type="text"
              :placeholder="t('newScheduleModal.invoicePlaceholder')"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">
              {{ t('newScheduleModal.estimatedDuration') }}
            </label>
            <input
              v-model="estimatedDurationMinutes"
              type="number"
              min="10"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <!-- Observações -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            {{ t('newScheduleModal.notes') }}
          </label>
          <textarea
            v-model="notes"
            rows="2"
            :placeholder="t('newScheduleModal.notesPlaceholder')"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <!-- Footer Buttons -->
        <div class="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            {{ t('newScheduleModal.submitBtn') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
