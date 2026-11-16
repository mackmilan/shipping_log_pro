import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';
import { Truck } from '../types';

export const useTrucksStore = defineStore('trucks', () => {
  const trucks = ref<Truck[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTrucks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<Truck[]>('/trucks');
      trucks.value = res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar caminhões';
    } finally {
      loading.value = false;
    }
  }

  async function createTruck(payload: {
    plate: string;
    driverName: string;
    driverPhone?: string;
    carrierName: string;
    truckType?: string;
  }) {
    try {
      const res = await api.post<Truck>('/trucks', payload);
      await fetchTrucks();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao cadastrar caminhão';
      throw err;
    }
  }

  async function updateTruck(id: number, payload: Partial<Truck>) {
    try {
      const res = await api.put<Truck>(`/trucks/${id}`, payload);
      await fetchTrucks();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao atualizar caminhão';
      throw err;
    }
  }

  async function deleteTruck(id: number) {
    try {
      await api.delete(`/trucks/${id}`);
      await fetchTrucks();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao excluir caminhão';
      throw err;
    }
  }

  return {
    trucks,
    loading,
    error,
    fetchTrucks,
    createTruck,
    updateTruck,
    deleteTruck,
  };
});
