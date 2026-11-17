<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { useDocksStore } from '../stores/docks';
import { useAuthStore } from '../stores/auth';
import { useI18n } from '../i18n';
import { DockStatus, DockType, Dock } from '../types';
import { Warehouse, Plus, Edit, Trash2, X, Check } from 'lucide-vue-next';

const docksStore = useDocksStore();
const authStore = useAuthStore();
const { t } = useI18n();

const isModalOpen = ref(false);
const editingDockId = ref<number | null>(null);

const formCode = ref('');
const formName = ref('');
const formType = ref<DockType>(DockType.DRY);
const formStatus = ref<DockStatus>(DockStatus.AVAILABLE);
const formNotes = ref('');

onMounted(() => {
  docksStore.fetchDocks();
});

function openCreateModal() {
  editingDockId.value = null;
  formCode.value = `DOCA-0${docksStore.docks.length + 1}`;
  formName.value = '';
  formType.value = DockType.DRY;
  formStatus.value = DockStatus.AVAILABLE;
  formNotes.value = '';
  isModalOpen.value = true;
}

function openEditModal(dock: Dock) {
  editingDockId.value = dock.id;
  formCode.value = dock.code;
  formName.value = dock.name;
  formType.value = dock.type;
  formStatus.value = dock.status;
  formNotes.value = dock.notes || '';
  isModalOpen.value = true;
}

async function handleSubmit() {
  if (!formCode.value || !formName.value) {
    alert(t('docks.errors.fillRequired'));
    return;
  }

  try {
    if (editingDockId.value) {
      await docksStore.updateDock(editingDockId.value, {
        code: formCode.value,
        name: formName.value,
        type: formType.value,
        status: formStatus.value,
        notes: formNotes.value,
      });
    } else {
      await docksStore.createDock({
        code: formCode.value,
        name: formName.value,
        type: formType.value,
        status: formStatus.value,
        notes: formNotes.value,
      });
    }
    isModalOpen.value = false;
  } catch (err: any) {
    alert(err.response?.data?.message || t('docks.errors.saveError'));
  }
}

async function handleDelete(id: number) {
  if (!confirm(t('docks.deleteConfirm'))) return;
  try {
    await docksStore.deleteDock(id);
  } catch (err: any) {
    alert(err.response?.data?.message || t('docks.errors.deleteError'));
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
            <h1 class="text-2xl font-bold tracking-tight text-white">{{ t('docks.title') }}</h1>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {{ t('docks.dockCount', { count: docksStore.docks.length }) }}
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            {{ t('docks.subtitle') }}
          </p>
        </div>

        <button
          v-if="authStore.isOperator"
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>{{ t('docks.newDock') }}</span>
        </button>
      </div>

      <!-- Docks Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="dock in docksStore.docks"
          :key="dock.id"
          class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between mb-3">
              <span class="font-mono text-sm font-bold text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                {{ dock.code }}
              </span>
              <span
                :class="[
                  'text-xs font-semibold px-2.5 py-1 rounded-full border',
                  dock.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : dock.status === 'OCCUPIED'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-700/30 text-slate-400 border-slate-700',
                ]"
              >
                {{ dock.status === 'AVAILABLE' ? t('docks.available') : dock.status === 'OCCUPIED' ? t('docks.occupied') : t('docks.maintenance') }}
              </span>
            </div>

            <h3 class="text-base font-semibold text-white mb-1">{{ dock.name }}</h3>
            <div class="text-xs text-slate-400 mb-2">{{ t('docks.type') }}: <span class="text-slate-300">{{ dock.type }}</span></div>
            <p v-if="dock.notes" class="text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
              {{ dock.notes }}
            </p>
          </div>

          <div
            v-if="authStore.isOperator"
            class="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2"
          >
            <button
              @click="openEditModal(dock)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <Edit class="w-3.5 h-3.5" />
              <span>{{ t('common.edit') }}</span>
            </button>

            <button
              v-if="authStore.isAdmin"
              @click="handleDelete(dock.id)"
              class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              :title="t('common.delete')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
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
              {{ editingDockId ? t('docks.editDock') : t('docks.createDock') }}
            </h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-white">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('docks.code') }}</label>
              <input
                v-model="formCode"
                type="text"
                required
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('docks.name') }}</label>
              <input
                v-model="formName"
                type="text"
                required
                placeholder="Ex: Doca 01 - Cargas Secas"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('docks.type') }}</label>
                <select
                  v-model="formType"
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option :value="DockType.DRY">{{ t('docks.types.dry') }}</option>
                  <option :value="DockType.REFRIGERATED">{{ t('docks.types.refrigerated') }}</option>
                  <option :value="DockType.BULK">{{ t('docks.types.bulk') }}</option>
                  <option :value="DockType.HAZARDOUS">{{ t('docks.types.hazardous') }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('docks.status') }}</label>
                <select
                  v-model="formStatus"
                  class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option :value="DockStatus.AVAILABLE">{{ t('docks.available') }}</option>
                  <option :value="DockStatus.OCCUPIED">{{ t('docks.occupied') }}</option>
                  <option :value="DockStatus.MAINTENANCE">{{ t('docks.maintenance') }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('docks.notes') }}</label>
              <textarea
                v-model="formNotes"
                rows="2"
                :placeholder="t('docks.notesPlaceholder')"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white resize-none"
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
                {{ t('docks.saveDock') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
