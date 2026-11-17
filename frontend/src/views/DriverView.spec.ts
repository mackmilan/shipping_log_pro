import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import DriverView from './DriverView.vue';
import { useAuthStore } from '../stores/auth';
import { useSchedulesStore } from '../stores/schedules';
import { UserRole, ScheduleStage, SchedulePriority } from '../types';
import { setLocale } from '../i18n';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('DriverView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setLocale('pt-BR');
  });

  const createSampleSchedule = () => ({
    id: 1,
    code: 'AGD-26101',
    truckId: 10,
    truck: {
      id: 10,
      plate: 'BRA2E19',
      driverName: 'Carlos Santos',
      carrierName: 'Rodonaves Express',
      truckType: 'Carreta Baú',
      createdAt: '',
    },
    dockId: 2,
    dock: {
      id: 2,
      code: 'DOCA-02',
      name: 'Doca Frigorificada',
      type: 'REFRIGERATED' as any,
      status: 'OCCUPIED' as any,
      createdAt: '',
    },
    driverId: 4,
    scheduledStartTime: '2026-11-17T10:00:00Z',
    scheduledEndTime: '2026-11-17T12:00:00Z',
    currentStage: ScheduleStage.IN_TRANSIT,
    priority: SchedulePriority.HIGH,
    cargoDescription: 'Peças industriais e automotivas',
    cargoWeightKg: 18500,
    estimatedDurationMinutes: 60,
    stageLogs: [
      {
        id: 101,
        scheduleId: 1,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: '2026-11-17T10:00:00Z',
        endedAt: null,
        durationMinutes: 15,
        locationName: 'BR-116 KM 220',
        latitude: -24.4967,
        longitude: -47.8447,
        images: [
          {
            id: 'img1',
            url: 'https://example.com/truck.jpg',
            caption: 'Foto de saída',
            stage: ScheduleStage.IN_TRANSIT,
            capturedAt: '2026-11-17T10:05:00Z',
          },
        ],
        createdAt: '',
      },
    ],
    metrics: {
      totalInTransitMinutes: 15,
      totalStoppedMinutes: 0,
      totalYardMinutes: 0,
      totalUnloadingMinutes: 0,
      activeStageDurationMinutes: 15,
      isOverdue: false,
      delayMinutes: 0,
    },
    createdAt: '',
    updatedAt: '',
  });

  it('renders driver screen and active trip details correctly', async () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 4,
      name: 'Carlos Santos (Motorista)',
      email: 'motorista@shippinglog.local',
      role: UserRole.DRIVER,
      active: true,
      createdAt: '',
    };
    authStore.token = 'test-token';

    const schedulesStore = useSchedulesStore();
    const sample = createSampleSchedule();
    schedulesStore.schedules = [sample];
    vi.spyOn(schedulesStore, 'fetchSchedules').mockImplementation(async () => {});

    const wrapper = mount(DriverView, {
      global: {
        stubs: {
          LanguageSelector: true,
        },
      },
    });

    await flushPromises();
    await nextTick();

    // Check header
    expect(wrapper.text()).toContain('ShippingLog Motorista');
    expect(wrapper.text()).toContain('Motorista');
    expect(wrapper.text()).toContain('Carlos Santos');

    // Check active trip banner
    expect(wrapper.text()).toContain('AGD-26101');
    expect(wrapper.text()).toContain('BRA2E19');
    expect(wrapper.text()).toContain('DOCA-02');
    expect(wrapper.text()).toContain('Peças industriais e automotivas');

    // Check actions section
    expect(wrapper.text()).toContain('Avançar Etapa do Caminhão');
    expect(wrapper.text()).toContain('Reportar Parada');
    expect(wrapper.text()).toContain('Cheguei no Pátio');

    // Check geolocation and photo sections
    expect(wrapper.text()).toContain('Localização GPS em Tempo Real');
    expect(wrapper.text()).toContain('Fotos & Comprovantes da Etapa');
  });

  it('opens stop report modal with reason pills when clicking Reportar Parada', async () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 4,
      name: 'Carlos Santos',
      email: 'motorista@shippinglog.local',
      role: UserRole.DRIVER,
      active: true,
      createdAt: '',
    };
    authStore.token = 'test-token';

    const schedulesStore = useSchedulesStore();
    schedulesStore.schedules = [createSampleSchedule()];
    vi.spyOn(schedulesStore, 'fetchSchedules').mockImplementation(async () => {});

    const wrapper = mount(DriverView, {
      global: {
        stubs: {
          LanguageSelector: true,
        },
      },
    });

    await flushPromises();
    await nextTick();

    // Find and click "Reportar Parada" button
    const stopButton = wrapper.findAll('button').find((btn) => btn.text().includes('Reportar Parada'));
    expect(stopButton).toBeDefined();
    await stopButton?.trigger('click');

    // Verify modal is open
    expect(wrapper.text()).toContain('Reportar Parada do Caminhão');
    expect(wrapper.text()).toContain('Congestionamento / Trânsito');
    expect(wrapper.text()).toContain('Abastecimento / Refeição');
  });

  it('translates driver operational screen into English when locale is en', async () => {
    setLocale('en');

    const authStore = useAuthStore();
    authStore.user = {
      id: 4,
      name: 'Carlos Santos',
      email: 'motorista@shippinglog.local',
      role: UserRole.DRIVER,
      active: true,
      createdAt: '',
    };
    authStore.token = 'test-token';

    const schedulesStore = useSchedulesStore();
    schedulesStore.schedules = [createSampleSchedule()];
    vi.spyOn(schedulesStore, 'fetchSchedules').mockImplementation(async () => {});

    const wrapper = mount(DriverView, {
      global: {
        stubs: {
          LanguageSelector: true,
        },
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('ShippingLog Driver');
    expect(wrapper.text()).toContain('Driver');
    expect(wrapper.text()).toContain('Advance Truck Stage');
    expect(wrapper.text()).toContain('Report Stop');
    expect(wrapper.text()).toContain('Arrived at Yard');
    expect(wrapper.text()).toContain('Real-Time GPS Location');
    expect(wrapper.text()).toContain('Stage Photos & Receipts');
  });
});
