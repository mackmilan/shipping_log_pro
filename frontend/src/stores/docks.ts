import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';
import { Dock, DockStatus, DockType } from '../types';

export const useDocksStore = defineStore('docks', () => {
  const docks = ref<Dock[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDocks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Dock[]>('/docks');
      docks.value = res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar docas';
    } finally {
      loading.value = false;
    }
  }

  async function createDock(payload: { code: string; name: string; type?: DockType; status?: DockStatus; notes?: string }) {
    try {
      const res = await api.post<Dock>('/docks', payload);
      await fetchDocks();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao criar doca';
      throw err;
    }
  }

  async function updateDock(id: number, payload: Partial<Dock>) {
    try {
      const res = await api.put<Dock>(`/docks/${id}`, payload);
      await fetchDocks();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao atualizar doca';
      throw err;
    }
  }

  async function deleteDock(id: number) {
    try {
      await api.delete(`/docks/${id}`);
      await fetchDocks();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao remover doca';
      throw err;
    }
  }

  return {
    docks,
    loading,
    error,
    fetchDocks,
    createDock,
    updateDock,
    deleteDock,
  };
});
