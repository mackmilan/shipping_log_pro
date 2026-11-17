import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';
import { UnloadingSchedule, DashboardMetrics, ScheduleStage } from '../types';

export const useSchedulesStore = defineStore('schedules', () => {
  const schedules = ref<UnloadingSchedule[]>([]);
  const currentSchedule = ref<UnloadingSchedule | null>(null);
  const metrics = ref<DashboardMetrics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSchedules(filter?: { stage?: string; priority?: string; search?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<UnloadingSchedule[]>('/schedules', { params: filter });
      schedules.value = res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar agendamentos';
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: number) {
    try {
      const res = await api.get<UnloadingSchedule>(`/schedules/${id}`);
      currentSchedule.value = res.data;
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar agendamento';
      throw err;
    }
  }

  async function fetchMetrics() {
    try {
      const res = await api.get<DashboardMetrics>('/schedules/metrics');
      metrics.value = res.data;
      return res.data;
    } catch (err: any) {
      console.error('Erro ao buscar métricas', err);
    }
  }

  async function createSchedule(payload: any) {
    loading.value = true;
    try {
      const res = await api.post<UnloadingSchedule>('/schedules', payload);
      await fetchSchedules();
      await fetchMetrics();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao criar agendamento';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateStage(id: number, payload: {
    stage: ScheduleStage;
    reason?: string;
    notes?: string;
    dockId?: number;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    images?: any[];
  }) {
    try {
      const res = await api.post<UnloadingSchedule>(`/schedules/${id}/stage`, payload);
      await fetchSchedules();
      await fetchMetrics();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao atualizar etapa';
      throw err;
    }
  }

  async function updateLocation(
    id: number,
    payload: { latitude: number; longitude: number; locationName?: string },
  ) {
    try {
      const res = await api.post<UnloadingSchedule>(`/schedules/${id}/location`, payload);
      await fetchSchedules();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao atualizar localização';
      throw err;
    }
  }

  async function addStageImage(
    id: number,
    payload: {
      url: string;
      caption?: string;
      stage?: ScheduleStage;
      latitude?: number;
      longitude?: number;
      locationName?: string;
    },
  ) {
    try {
      const res = await api.post<UnloadingSchedule>(`/schedules/${id}/stage-images`, payload);
      await fetchSchedules();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao enviar imagem';
      throw err;
    }
  }

  async function uploadImage(
    id: number,
    file: File,
    metadata?: {
      caption?: string;
      stage?: ScheduleStage;
      latitude?: number;
      longitude?: number;
      locationName?: string;
    },
  ) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata?.caption) formData.append('caption', metadata.caption);
      if (metadata?.stage) formData.append('stage', metadata.stage);
      if (metadata?.latitude) formData.append('latitude', metadata.latitude.toString());
      if (metadata?.longitude) formData.append('longitude', metadata.longitude.toString());
      if (metadata?.locationName) formData.append('locationName', metadata.locationName);

      const res = await api.post<UnloadingSchedule>(`/schedules/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchSchedules();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao fazer upload da imagem';
      throw err;
    }
  }

  async function deleteSchedule(id: number) {
    try {
      await api.delete(`/schedules/${id}`);
      await fetchSchedules();
      await fetchMetrics();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao remover agendamento';
      throw err;
    }
  }

  return {
    schedules,
    currentSchedule,
    metrics,
    loading,
    error,
    fetchSchedules,
    fetchOne,
    fetchMetrics,
    createSchedule,
    updateStage,
    updateLocation,
    addStageImage,
    uploadImage,
    deleteSchedule,
  };
});
