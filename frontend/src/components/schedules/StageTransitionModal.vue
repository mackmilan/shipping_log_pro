<script setup lang="ts">
import { ref, computed } from 'vue';
import { UnloadingSchedule, ScheduleStage, Dock } from '../../types';
import StageBadge from '../common/StageBadge.vue';
import { X, ArrowRight, AlertTriangle } from 'lucide-vue-next';

const props = defineProps<{
  schedule: UnloadingSchedule;
  docks: Dock[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: { stage: ScheduleStage; reason?: string; notes?: string; dockId?: number }): void;
}>();

const selectedStage = ref<ScheduleStage>(props.schedule.currentStage);
const reason = ref('');
const notes = ref('');
const selectedDockId = ref<number | undefined>(props.schedule.dockId || undefined);

const availableStages = [
  { stage: ScheduleStage.IN_TRANSIT, label: 'Em Trânsito', desc: 'Veículo em rota de entrega' },
  { stage: ScheduleStage.STOPPED, label: 'Parado (Alerta)', desc: 'Parada por trânsito, defeito, fiscalização ou descanso' },
  { stage: ScheduleStage.WAITING_YARD, label: 'No Pátio / Fila', desc: 'Chegou na portaria e aguarda liberação' },
  { stage: ScheduleStage.AT_DOCK, label: 'Encostado na Doca', desc: 'Posicionado para conferência e descarga' },
  { stage: ScheduleStage.UNLOADING, label: 'Em Descarga', desc: 'Descarregamento em andamento' },
  { stage: ScheduleStage.COMPLETED, label: 'Finalizado / Liberado', desc: 'Descarga finalizada, veículo liberado' },
  { stage: ScheduleStage.CANCELLED, label: 'Cancelado', desc: 'Janela cancelada ou reagendada' },
];

const commonReasons = computed(() => {
  if (selectedStage.value === ScheduleStage.STOPPED) {
    return [
      'Congestionamento intenso na rodovia',
      'Problema mecânico / Pneu furado',
      'Parada regulamentar para descanso / alimentação',
      'Retenção em posto de pesagem / fiscalização',
      'Aguardando liberação de documentação fiscal',
    ];
  }
  if (selectedStage.value === ScheduleStage.WAITING_YARD) {
    return [
      'Aguardando liberação de doca designada',
      'Triagem de documentos na portaria',
      'Conferência de termometria / lacre',
    ];
  }
  if (selectedStage.value === ScheduleStage.UNLOADING) {
    return [
      'Início padrão de descarga paletizada',
      'Descarga com 2 operadores e paleteira',
      'Descarga manual com conferência cega',
    ];
  }
  return [];
});

function setQuickReason(text: string) {
  reason.value = text;
}

function handleSubmit() {
  emit('submit', {
    stage: selectedStage.value,
    reason: reason.value.trim() || undefined,
    notes: notes.value.trim() || undefined,
    dockId: selectedDockId.value || undefined,
  });
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div>
          <h2 class="text-base font-semibold text-white flex items-center gap-2">
            Atualizar Etapa do Caminhão
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ schedule.code }} • {{ schedule.truck?.plate }} ({{ schedule.truck?.driverName }})
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
      <div class="p-5 overflow-y-auto space-y-4">
        <!-- Current Stage Banner -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div class="text-xs text-slate-400">Etapa Atual:</div>
          <StageBadge :stage="schedule.currentStage" show-dot />
        </div>

        <!-- Stage Selection Grid -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-2">
            Selecione a Nova Etapa:
          </label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="item in availableStages"
              :key="item.stage"
              type="button"
              @click="selectedStage = item.stage"
              :class="[
                'flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                selectedStage === item.stage
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700',
              ]"
            >
              <div>
                <div class="text-xs font-semibold flex items-center gap-2">
                  <StageBadge :stage="item.stage" />
                  <span>{{ item.label }}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-1 pl-1">
                  {{ item.desc }}
                </div>
              </div>
              <div
                v-if="selectedStage === item.stage"
                class="w-2.5 h-2.5 rounded-full bg-emerald-400"
              />
            </button>
          </div>
        </div>

        <!-- Warning Callout when Stopped -->
        <div
          v-if="selectedStage === ScheduleStage.STOPPED"
          class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 text-xs"
        >
          <AlertTriangle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span class="font-semibold block">Atenção para tempo parado:</span>
            Informar o motivo da parada permite rastrear gargalos logísticos e calcular o tempo ocioso com precisão.
          </div>
        </div>

        <!-- Motivo / Reason -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            Motivo / Justificativa
            <span v-if="selectedStage === ScheduleStage.STOPPED" class="text-rose-400">* (Recomendado)</span>
          </label>
          <input
            v-model="reason"
            type="text"
            placeholder="Ex: Congestionamento na rodovia, pneu furado, aguardando liberação..."
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <!-- Quick Suggestion Buttons -->
          <div v-if="commonReasons.length > 0" class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="r in commonReasons"
              :key="r"
              type="button"
              @click="setQuickReason(r)"
              class="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
            >
              + {{ r }}
            </button>
          </div>
        </div>

        <!-- Doca Selection (if applicable) -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            Designar ou Alterar Doca
          </label>
          <select
            v-model="selectedDockId"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option :value="undefined">Nenhuma doca vinculada</option>
            <option
              v-for="dock in docks"
              :key="dock.id"
              :value="dock.id"
            >
              {{ dock.code }} - {{ dock.name }} (Status: {{ dock.status }})
            </option>
          </select>
        </div>

        <!-- Observações Adicionais -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">
            Observações Adicionais
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="Anotações internas da operação..."
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
        >
          <span>Confirmar Transição</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
