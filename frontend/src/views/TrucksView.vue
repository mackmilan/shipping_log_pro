<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { useTrucksStore } from '../stores/trucks';
import { useAuthStore } from '../stores/auth';
import { useI18n } from '../i18n';
import { Truck as TruckType } from '../types';
import { Truck, Plus, Edit, Trash2, X, Phone, UserCheck } from 'lucide-vue-next';

const trucksStore = useTrucksStore();
const authStore = useAuthStore();
const { t } = useI18n();

const isModalOpen = ref(false);
const editingTruckId = ref<number | null>(null);

const formPlate = ref('');
const formDriverName = ref('');
const formDriverPhone = ref('');
const formCarrierName = ref('');
const formTruckType = ref('Carreta LS');

onMounted(() => {
  trucksStore.fetchTrucks();
});

function openCreateModal() {
  editingTruckId.value = null;
  formPlate.value = '';
  formDriverName.value = '';
  formDriverPhone.value = '';
  formCarrierName.value = '';
  formTruckType.value = 'Carreta LS';
  isModalOpen.value = true;
}

function openEditModal(truck: TruckType) {
  editingTruckId.value = truck.id;
  formPlate.value = truck.plate;
  formDriverName.value = truck.driverName;
  formDriverPhone.value = truck.driverPhone || '';
  formCarrierName.value = truck.carrierName;
  formTruckType.value = truck.truckType;
  isModalOpen.value = true;
}

async function handleSubmit() {
  if (!formPlate.value || !formDriverName.value || !formCarrierName.value) {
    alert(t('trucks.errors.fillRequired'));
    return;
  }

  try {
    if (editingTruckId.value) {
      await trucksStore.updateTruck(editingTruckId.value, {
        plate: formPlate.value,
        driverName: formDriverName.value,
        driverPhone: formDriverPhone.value || undefined,
        carrierName: formCarrierName.value,
        truckType: formTruckType.value,
      });
    } else {
      await trucksStore.createTruck({
        plate: formPlate.value,
        driverName: formDriverName.value,
        driverPhone: formDriverPhone.value || undefined,
        carrierName: formCarrierName.value,
        truckType: formTruckType.value,
      });
    }
    isModalOpen.value = false;
  } catch (err: any) {
    alert(err.response?.data?.message || t('trucks.errors.saveError'));
  }
}

async function handleDelete(id: number) {
  if (!confirm(t('trucks.deleteConfirm'))) return;
  try {
    await trucksStore.deleteTruck(id);
  } catch (err: any) {
    alert(err.response?.data?.message || t('trucks.errors.deleteError'));
  }
}
</script>

<template>
  <AppLayout>
    <div class="p-6 sm:p-8 space-y-6 w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-white">{{ t('trucks.title') }}</h1>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {{ t('trucks.truckCount', { count: trucksStore.trucks.length }) }}
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            {{ t('trucks.subtitle') }}
          </p>
        </div>

        <button
          v-if="authStore.isOperator"
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t('trucks.newTruck') }}</span>
        </button>
      </div>

      <!-- Trucks Table -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">{{ t('trucks.plate') }}</th>
                <th class="py-3 px-4">{{ t('trucks.truckType') }}</th>
                <th class="py-3 px-4">{{ t('trucks.driver') }}</th>
                <th class="py-3 px-4">{{ t('trucks.phone') }}</th>
                <th class="py-3 px-4">{{ t('trucks.carrier') }}</th>
                <th class="py-3 px-4 text-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr
                v-for="truck in trucksStore.trucks"
                :key="truck.id"
                class="hover:bg-slate-800/40 transition-colors"
              >
                <td class="py-3.5 px-4 font-mono font-bold text-white text-sm">
                  {{ truck.plate }}
                </td>
                <td class="py-3.5 px-4 text-slate-300">
                  {{ truck.truckType }}
                </td>
                <td class="py-3.5 px-4 font-semibold text-slate-200">
                  {{ truck.driverName }}
                </td>
                <td class="py-3.5 px-4 text-slate-400">
                  <span v-if="truck.driverPhone" class="flex items-center gap-1.5">
                    <Phone class="w-3 h-3 text-emerald-400" />
                    <span>{{ truck.driverPhone }}</span>
                  </span>
                  <span v-else class="text-slate-600">—</span>
                </td>
                <td class="py-3.5 px-4 font-medium text-slate-300">
                  {{ truck.carrierName }}
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="authStore.isOperator"
                      @click="openEditModal(truck)"
                      class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      :title="t('trucks.editTruck')"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      v-if="authStore.isAdmin"
                      @click="handleDelete(truck.id)"
                      class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      :title="t('trucks.deleteTruck')"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="trucksStore.trucks.length === 0">
                <td colspan="6" class="text-center py-8 text-slate-500">
                  {{ t('trucks.emptyList') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-base font-semibold text-white">
              {{ editingTruckId ? t('trucks.editTruck') : t('trucks.newTruck') }}
            </h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-white">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('trucks.plateRequired') }}</label>
                <input
                  v-model="formPlate"
                  type="text"
                  required
                  placeholder="Ex: BRA2E19"
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white uppercase font-mono"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('trucks.truckType') }}</label>
                <input
                  v-model="formTruckType"
                  type="text"
                  placeholder="Ex: Carreta LS, Truck"
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('trucks.driverRequired') }}</label>
              <input
                v-model="formDriverName"
                type="text"
                required
                placeholder="Ex: Carlos Eduardo Santos"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('trucks.phone') }}</label>
              <input
                v-model="formDriverPhone"
                type="text"
                :placeholder="t('trucks.phonePlaceholder')"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('trucks.carrierRequired') }}</label>
              <input
                v-model="formCarrierName"
                type="text"
                required
                placeholder="Ex: Rodonaves Express"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                @click="isModalOpen = false"
                class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white"
              >
                {{ t('trucks.saveTruck') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
