<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useSchedulesStore } from '../stores/schedules';
import { useI18n } from '../i18n';
import { ScheduleStage, UnloadingSchedule, StageImageItem } from '../types';
import StageBadge from '../components/common/StageBadge.vue';
import PriorityBadge from '../components/common/PriorityBadge.vue';
import TimeCounter from '../components/common/TimeCounter.vue';
import LanguageSelector from '../components/common/LanguageSelector.vue';
import {
  Truck,
  Compass,
  Navigation,
  MapPin,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  Warehouse,
  FileText,
  Calendar,
  LogOut,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Play,
  Pause,
  ArrowRight,
  ShieldAlert,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const schedulesStore = useSchedulesStore();
const { t, formatDate } = useI18n();

const selectedScheduleId = ref<number | null>(null);
const isHistoryExpanded = ref(false);
const isStopModalOpen = ref(false);
const isSuccessToastVisible = ref(false);
const toastMessage = ref('');

// Location state
const isLocating = ref(false);
const currentLatitude = ref<number | null>(null);
const currentLongitude = ref<number | null>(null);
const locationNameInput = ref('');
const locationAccuracy = ref<number | null>(null);
const isSavingLocation = ref(false);

// Photo upload state
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedPhotoDataUrl = ref<string | null>(null);
const selectedPhotoFile = ref<File | null>(null);
const photoCaption = ref('');
const photoCategory = ref(t('driverView.photoCategories.deliveryProof'));
const isUploadingPhoto = ref(false);
const previewImage = ref<{ url: string; caption?: string } | null>(null);

// Stop reason state
const stopReason = ref('');
const stopNotes = ref('');
const isSubmittingStop = ref(false);

// Active schedule
const activeSchedule = computed<UnloadingSchedule | null>(() => {
  if (!selectedScheduleId.value) return null;
  return schedulesStore.schedules.find((s) => s.id === selectedScheduleId.value) || null;
});

// All available schedules for selection
const availableSchedules = computed(() => {
  return schedulesStore.schedules.filter(
    (s) => s.currentStage !== ScheduleStage.COMPLETED && s.currentStage !== ScheduleStage.CANCELLED,
  );
});

// Auto-select schedule assigned to this driver or active schedule
function autoSelectSchedule() {
  if (schedulesStore.schedules.length === 0) return;

  // 1. Try to find a schedule assigned to this driver's user ID
  if (authStore.user?.id) {
    const driverAssigned = schedulesStore.schedules.find(
      (s) =>
        s.driverId === authStore.user?.id &&
        s.currentStage !== ScheduleStage.COMPLETED &&
        s.currentStage !== ScheduleStage.CANCELLED,
    );
    if (driverAssigned) {
      selectedScheduleId.value = driverAssigned.id;
      return;
    }
  }

  // 2. Try to match by driver name in truck
  if (authStore.user?.name) {
    const nameLower = authStore.user.name.toLowerCase();
    const truckMatch = schedulesStore.schedules.find(
      (s) =>
        s.truck?.driverName?.toLowerCase().includes(nameLower) ||
        nameLower.includes(s.truck?.driverName?.toLowerCase() || '___'),
    );
    if (truckMatch) {
      selectedScheduleId.value = truckMatch.id;
      return;
    }
  }

  // 3. Fallback: first active schedule
  const firstActive = availableSchedules.value[0] || schedulesStore.schedules[0];
  if (firstActive) {
    selectedScheduleId.value = firstActive.id;
  }
}

onMounted(async () => {
  await schedulesStore.fetchSchedules();
  autoSelectSchedule();
});

watch(
  () => schedulesStore.schedules,
  () => {
    if (!selectedScheduleId.value) {
      autoSelectSchedule();
    }
  },
);

function showToast(msg: string) {
  toastMessage.value = msg;
  isSuccessToastVisible.value = true;
  setTimeout(() => {
    isSuccessToastVisible.value = false;
  }, 3500);
}

// ----------------- Geolocation Functions -----------------
function handleGetGpsLocation() {
  if (!navigator.geolocation) {
    alert(t('driverView.gpsNotSupported'));
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLatitude.value = position.coords.latitude;
      currentLongitude.value = position.coords.longitude;
      locationAccuracy.value = Math.round(position.coords.accuracy);
      isLocating.value = false;

      if (!locationNameInput.value) {
        locationNameInput.value = t('driverView.gpsCapturedAt', {
          time: new Date().toLocaleTimeString().slice(0, 5),
        });
      }
      showToast(t('driverView.gpsSuccess'));
    },
    (err) => {
      isLocating.value = false;
      alert(t('driverView.gpsError', { message: err.message }));
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

async function handleSaveLocation() {
  if (!activeSchedule.value) return;
  if (currentLatitude.value === null || currentLongitude.value === null) {
    alert(t('driverView.needGpsFirst'));
    return;
  }

  isSavingLocation.value = true;
  try {
    await schedulesStore.updateLocation(activeSchedule.value.id, {
      latitude: currentLatitude.value,
      longitude: currentLongitude.value,
      locationName: locationNameInput.value.trim() || undefined,
    });
    showToast(t('driverView.locationSavedToast'));
  } catch (err: any) {
    alert(err.response?.data?.message || t('driverView.errorSavingLocation'));
  } finally {
    isSavingLocation.value = false;
  }
}

// ----------------- Image / Photo Functions -----------------
function handlePhotoFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  selectedPhotoFile.value = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    selectedPhotoDataUrl.value = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function clearSelectedPhoto() {
  selectedPhotoFile.value = null;
  selectedPhotoDataUrl.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function handleUploadPhoto() {
  if (!activeSchedule.value || !selectedPhotoDataUrl.value) return;

  isUploadingPhoto.value = true;
  try {
    const fullCaption = photoCategory.value
      ? `[${photoCategory.value}] ${photoCaption.value}`.trim()
      : photoCaption.value.trim();

    await schedulesStore.addStageImage(activeSchedule.value.id, {
      url: selectedPhotoDataUrl.value,
      caption: fullCaption || undefined,
      stage: activeSchedule.value.currentStage,
      latitude: currentLatitude.value || undefined,
      longitude: currentLongitude.value || undefined,
      locationName: locationNameInput.value.trim() || undefined,
    });

    clearSelectedPhoto();
    photoCaption.value = '';
    showToast(t('driverView.photoSentToast'));
  } catch (err: any) {
    alert(err.response?.data?.message || t('driverView.errorSendingPhoto'));
  } finally {
    isUploadingPhoto.value = false;
  }
}

// ----------------- Stage Transition Functions -----------------
async function transitionToStage(stage: ScheduleStage, reason?: string, notes?: string) {
  if (!activeSchedule.value) return;

  try {
    await schedulesStore.updateStage(activeSchedule.value.id, {
      stage,
      reason,
      notes,
      latitude: currentLatitude.value || undefined,
      longitude: currentLongitude.value || undefined,
      locationName: locationNameInput.value.trim() || undefined,
    });
    showToast(t('driverView.stageUpdatedToast', { stage: t(`stages.${getStageI18nKey(stage)}`) }));
  } catch (err: any) {
    alert(err.response?.data?.message || t('driverView.errorUpdatingStage'));
  }
}

function getStageI18nKey(stage: ScheduleStage) {
  switch (stage) {
    case ScheduleStage.IN_TRANSIT:
      return 'inTransit';
    case ScheduleStage.STOPPED:
      return 'stopped';
    case ScheduleStage.WAITING_YARD:
      return 'waitingYard';
    case ScheduleStage.AT_DOCK:
      return 'atDock';
    case ScheduleStage.UNLOADING:
      return 'unloading';
    case ScheduleStage.COMPLETED:
      return 'completed';
    case ScheduleStage.CANCELLED:
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

function openStopModal() {
  stopReason.value = '';
  stopNotes.value = '';
  isStopModalOpen.value = true;
}

async function handleConfirmStop() {
  if (!stopReason.value) {
    alert(t('driverView.stopReasonRequired'));
    return;
  }
  isSubmittingStop.value = true;
  try {
    await transitionToStage(ScheduleStage.STOPPED, stopReason.value, stopNotes.value || undefined);
    isStopModalOpen.value = false;
  } finally {
    isSubmittingStop.value = false;
  }
}

const quickStopReasons = computed(() => [
  t('driverView.stopReasons.traffic'),
  t('driverView.stopReasons.fuel'),
  t('driverView.stopReasons.mechanical'),
  t('driverView.stopReasons.inspection'),
  t('driverView.stopReasons.rest'),
]);

const photoCategories = computed(() => [
  t('driverView.photoCategories.deliveryProof'),
  t('driverView.photoCategories.seal'),
  t('driverView.photoCategories.cargo'),
  t('driverView.photoCategories.odometer'),
  t('driverView.photoCategories.incident'),
]);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <!-- Top Header Bar -->
    <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center shadow-md">
          <Truck class="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-white tracking-tight">{{ t('driverView.appTitle') }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
              {{ t('roles.driver') }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400">{{ authStore.user?.name }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <LanguageSelector variant="segmented" />
        <button
          @click="handleLogout"
          class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          :title="t('nav.logout')"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Success Toast Floating -->
    <div
      v-if="isSuccessToastVisible"
      class="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce"
    >
      <CheckCircle class="w-4 h-4" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Main Mobile Content Area -->
    <main class="flex-1 max-w-xl w-full mx-auto p-4 space-y-4 pb-20">
      <!-- Schedule Selector Header -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm">
        <div class="flex items-center gap-2 overflow-hidden">
          <Compass class="w-4 h-4 text-amber-400 shrink-0" />
          <span class="text-xs font-medium text-slate-300 shrink-0">{{ t('driverView.tripSelectLabel') }}:</span>
          <select
            v-model="selectedScheduleId"
            class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 font-mono truncate max-w-[200px]"
          >
            <option v-for="sch in schedulesStore.schedules" :key="sch.id" :value="sch.id">
              {{ sch.code }} - {{ sch.truck?.plate }} ({{ t(`stages.${getStageI18nKey(sch.currentStage)}`) }})
            </option>
          </select>
        </div>

        <button
          @click="schedulesStore.fetchSchedules()"
          class="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          :title="t('common.refresh')"
        >
          <RefreshCw class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- If no schedule is available -->
      <div
        v-if="!activeSchedule"
        class="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3"
      >
        <AlertTriangle class="w-10 h-10 text-amber-400 mx-auto" />
        <h3 class="text-sm font-semibold text-white">{{ t('driverView.noActiveScheduleTitle') }}</h3>
        <p class="text-xs text-slate-400">{{ t('driverView.noActiveScheduleDesc') }}</p>
      </div>

      <template v-else>
        <!-- CURRENT STATUS BANNER CARD (Large, High Contrast) -->
        <div class="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <!-- Card Header: Code, Priority, Stage -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-white border border-slate-700 font-semibold">
                {{ activeSchedule.code }}
              </span>
              <PriorityBadge :priority="activeSchedule.priority" />
            </div>
            <StageBadge :stage="activeSchedule.currentStage" show-dot />
          </div>

          <!-- Active Stage Big Title & Timer -->
          <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                {{ t('driverView.currentStage') }}
              </span>
              <h2 class="text-xl font-black text-white mt-0.5">
                {{ t(`stages.${getStageI18nKey(activeSchedule.currentStage)}`) }}
              </h2>
            </div>
            <div class="text-right">
              <span class="text-[11px] text-slate-400 block">{{ t('driverView.timeInCurrentStage') }}</span>
              <TimeCounter
                :minutes="activeSchedule.metrics?.activeStageDurationMinutes || 0"
                :highlight-warning="activeSchedule.currentStage === ScheduleStage.STOPPED"
              />
            </div>
          </div>

          <!-- Trip Details Grid -->
          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span class="text-[10px] text-slate-400 block mb-0.5">{{ t('trucks.plate') }} & {{ t('trucks.truckType') }}</span>
              <span class="font-bold font-mono text-white text-sm">{{ activeSchedule.truck?.plate }}</span>
              <span class="text-[11px] text-slate-400 block truncate">{{ activeSchedule.truck?.truckType }}</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span class="text-[10px] text-slate-400 block mb-0.5">{{ t('docks.title') }}</span>
              <span class="font-bold text-emerald-400 text-sm">
                {{ activeSchedule.dock ? activeSchedule.dock.code : t('common.unassigned') }}
              </span>
              <span v-if="activeSchedule.dock" class="text-[11px] text-slate-400 block truncate">
                {{ activeSchedule.dock.name }}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
              <span class="text-[10px] text-slate-400 block mb-0.5">{{ t('schedules.scheduledWindow') }}</span>
              <div class="flex items-center gap-2 font-mono text-xs text-white">
                <Calendar class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{{ formatDate(activeSchedule.scheduledStartTime) }} - {{ formatDate(activeSchedule.scheduledEndTime) }}</span>
              </div>
              <div v-if="activeSchedule.metrics?.isOverdue" class="text-rose-400 text-[11px] font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle class="w-3 h-3" />
                <span>{{ t('schedules.delay', { minutes: activeSchedule.metrics.delayMinutes }) }}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800 col-span-2">
              <span class="text-[10px] text-slate-400 block mb-0.5">{{ t('driverView.cargoDescription') }}</span>
              <p class="text-xs text-slate-200 font-medium">
                {{ activeSchedule.cargoDescription }}
                <span v-if="activeSchedule.cargoWeightKg" class="text-slate-400 text-[11px]">
                  ({{ activeSchedule.cargoWeightKg.toLocaleString() }} kg)
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- 1. STAGE TRANSITION ACTIONS (Big Touch Buttons) -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ArrowRight class="w-4 h-4 text-emerald-400" />
            {{ t('driverView.actionsTitle') }}
          </h3>

          <div class="grid grid-cols-2 gap-2.5">
            <!-- Em Trânsito -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.IN_TRANSIT"
              type="button"
              @click="transitionToStage(ScheduleStage.IN_TRANSIT)"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Play class="w-5 h-5 mb-1" />
              <span>{{ t('driverView.btnInTransit') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnInTransitDesc') }}</span>
            </button>

            <!-- Reportar Parada (Alert) -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.STOPPED"
              type="button"
              @click="openStopModal"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Pause class="w-5 h-5 mb-1 text-white" />
              <span>{{ t('driverView.btnReportStop') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnReportStopDesc') }}</span>
            </button>

            <!-- Cheguei no Pátio -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.WAITING_YARD"
              type="button"
              @click="transitionToStage(ScheduleStage.WAITING_YARD)"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Warehouse class="w-5 h-5 mb-1" />
              <span>{{ t('driverView.btnArrivedYard') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnArrivedYardDesc') }}</span>
            </button>

            <!-- Encostei na Doca -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.AT_DOCK"
              type="button"
              @click="transitionToStage(ScheduleStage.AT_DOCK)"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Truck class="w-5 h-5 mb-1" />
              <span>{{ t('driverView.btnAtDock') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnAtDockDesc') }}</span>
            </button>

            <!-- Em Descarga -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.UNLOADING"
              type="button"
              @click="transitionToStage(ScheduleStage.UNLOADING)"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <RefreshCw class="w-5 h-5 mb-1" />
              <span>{{ t('driverView.btnUnloading') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnUnloadingDesc') }}</span>
            </button>

            <!-- Finalizar / Liberado -->
            <button
              v-if="activeSchedule.currentStage !== ScheduleStage.COMPLETED"
              type="button"
              @click="transitionToStage(ScheduleStage.COMPLETED)"
              class="flex flex-col items-center justify-center p-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <CheckCircle class="w-5 h-5 mb-1" />
              <span>{{ t('driverView.btnComplete') }}</span>
              <span class="text-[10px] font-normal opacity-80">{{ t('driverView.btnCompleteDesc') }}</span>
            </button>
          </div>
        </div>

        <!-- 2. GEOLOCATION SECTION -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin class="w-4 h-4 text-sky-400" />
              {{ t('driverView.locationSectionTitle') }}
            </h3>
            <span
              v-if="activeSchedule.lastLocationName || activeSchedule.lastLatitude"
              class="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 truncate max-w-[150px]"
            >
              {{ activeSchedule.lastLocationName || `${activeSchedule.lastLatitude?.toFixed(3)}, ${activeSchedule.lastLongitude?.toFixed(3)}` }}
            </span>
          </div>

          <p class="text-xs text-slate-400">
            {{ t('driverView.locationSectionDesc') }}
          </p>

          <div class="flex gap-2">
            <button
              type="button"
              @click="handleGetGpsLocation"
              :disabled="isLocating"
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Navigation :class="['w-4 h-4', isLocating ? 'animate-spin' : '']" />
              <span>{{ isLocating ? t('driverView.capturingGps') : t('driverView.btnCaptureGps') }}</span>
            </button>

            <a
              v-if="currentLatitude && currentLongitude"
              :href="`https://www.google.com/maps?q=${currentLatitude},${currentLongitude}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2.5 rounded-xl bg-slate-800 text-sky-400 hover:text-white flex items-center justify-center"
              :title="t('common.viewOnMap')"
            >
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>

          <!-- GPS Coordinates feedback -->
          <div v-if="currentLatitude && currentLongitude" class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
            <div class="flex justify-between text-slate-300 font-mono">
              <span>Lat: {{ currentLatitude.toFixed(5) }}</span>
              <span>Lng: {{ currentLongitude.toFixed(5) }}</span>
              <span v-if="locationAccuracy" class="text-slate-400">±{{ locationAccuracy }}m</span>
            </div>
          </div>

          <!-- Optional Checkpoint / Location Name Input -->
          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1">
              {{ t('driverView.locationNamePlaceholder') }}
            </label>
            <input
              v-model="locationNameInput"
              type="text"
              :placeholder="t('driverView.locationNameExample')"
              class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="button"
            @click="handleSaveLocation"
            :disabled="isSavingLocation || currentLatitude === null"
            class="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 transition-colors"
          >
            {{ isSavingLocation ? t('common.loading') : t('driverView.btnSaveLocation') }}
          </button>
        </div>

        <!-- 3. SEND IMAGES / PHOTOS SECTION -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Camera class="w-4 h-4 text-emerald-400" />
            {{ t('driverView.photosSectionTitle') }}
          </h3>

          <p class="text-xs text-slate-400">
            {{ t('driverView.photosSectionDesc') }}
          </p>

          <!-- Hidden native file input with camera capture support -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            @change="handlePhotoFileSelected"
            class="hidden"
          />

          <!-- Capture / Select Button -->
          <div v-if="!selectedPhotoDataUrl">
            <button
              type="button"
              @click="fileInputRef?.click()"
              class="w-full border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all bg-slate-950/40"
            >
              <div class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Camera class="w-5 h-5" />
              </div>
              <span class="text-xs font-bold text-slate-200">{{ t('driverView.btnTakePhoto') }}</span>
              <span class="text-[10px] text-slate-500">{{ t('driverView.takePhotoSubtext') }}</span>
            </button>
          </div>

          <!-- Photo Selected Preview & Metadata Input -->
          <div v-else class="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div class="relative rounded-lg overflow-hidden border border-slate-700 aspect-video max-h-56 bg-black flex items-center justify-center">
              <img :src="selectedPhotoDataUrl" alt="Preview" class="w-full h-full object-contain" />
              <button
                type="button"
                @click="clearSelectedPhoto"
                class="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Category Pills -->
            <div>
              <span class="text-[10px] font-medium text-slate-400 block mb-1.5">{{ t('driverView.selectPhotoCategory') }}</span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="cat in photoCategories"
                  :key="cat"
                  type="button"
                  @click="photoCategory = cat"
                  :class="[
                    'text-[10px] px-2.5 py-1 rounded-full border transition-all',
                    photoCategory === cat
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700',
                  ]"
                >
                  {{ cat }}
                </button>
              </div>
            </div>

            <!-- Caption Input -->
            <div>
              <label class="block text-[10px] font-medium text-slate-400 mb-1">{{ t('driverView.photoCaptionLabel') }}</label>
              <input
                v-model="photoCaption"
                type="text"
                :placeholder="t('driverView.photoCaptionPlaceholder')"
                class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Submit Photo Button -->
            <button
              type="button"
              @click="handleUploadPhoto"
              :disabled="isUploadingPhoto"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Upload class="w-4 h-4" />
              <span>{{ isUploadingPhoto ? t('common.loading') : t('driverView.btnSendPhoto') }}</span>
            </button>
          </div>

          <!-- Current Stage Photos Gallery -->
          <div
            v-if="activeSchedule.stageLogs?.some((l) => l.images && l.images.length > 0)"
            class="pt-2 border-t border-slate-800/80"
          >
            <span class="text-[11px] font-semibold text-slate-400 block mb-2">
              {{ t('driverView.recentTripPhotos') }}
            </span>
            <div class="grid grid-cols-3 gap-2">
              <template v-for="log in activeSchedule.stageLogs" :key="log.id">
                <div
                  v-for="(img, idx) in log.images || []"
                  :key="img.id || idx"
                  @click="previewImage = img"
                  class="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-emerald-500/50"
                >
                  <img :src="img.url" class="w-full h-full object-cover" loading="lazy" />
                  <div
                    v-if="img.caption"
                    class="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5 text-[8px] text-slate-200 truncate"
                  >
                    {{ img.caption }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 4. TRIP TIMELINE / STAGE HISTORY (Collapsible) -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            @click="isHistoryExpanded = !isHistoryExpanded"
            class="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-300 hover:text-white"
          >
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-purple-400" />
              <span>{{ t('driverView.tripTimelineTitle') }}</span>
              <span class="text-[10px] text-slate-400 font-mono">({{ activeSchedule.stageLogs?.length || 0 }})</span>
            </div>
            <component :is="isHistoryExpanded ? ChevronUp : ChevronDown" class="w-4 h-4 text-slate-400" />
          </button>

          <div v-if="isHistoryExpanded" class="p-4 pt-0 border-t border-slate-800/60 space-y-3">
            <div
              v-for="log in activeSchedule.stageLogs"
              :key="log.id"
              class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <StageBadge :stage="log.stage" />
                <span class="text-[10px] font-mono text-slate-400">
                  {{ formatDate(log.startedAt) }}
                  <template v-if="log.durationMinutes">
                    • {{ log.durationMinutes }} min
                  </template>
                </span>
              </div>

              <p v-if="log.reason" class="text-xs text-rose-300 bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                {{ log.reason }}
              </p>
              <p v-if="log.notes" class="text-[11px] text-slate-400 italic">
                {{ log.notes }}
              </p>

              <div v-if="log.locationName" class="flex items-center gap-1 text-[10px] text-sky-400">
                <MapPin class="w-3 h-3" />
                <span>{{ log.locationName }}</span>
              </div>

              <!-- Thumbnails in history -->
              <div v-if="log.images && log.images.length > 0" class="flex gap-1.5 pt-1">
                <img
                  v-for="(img, idx) in log.images"
                  :key="idx"
                  :src="img.url"
                  @click="previewImage = img"
                  class="w-10 h-10 rounded-md object-cover border border-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Modal for Reporting Stop -->
    <div
      v-if="isStopModalOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle class="w-5 h-5" />
            <span>{{ t('driverView.modalStopTitle') }}</span>
          </div>
          <button @click="isStopModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-400">
          {{ t('driverView.modalStopDesc') }}
        </p>

        <!-- Quick Reason Selection Pills -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="r in quickStopReasons"
            :key="r"
            type="button"
            @click="stopReason = r"
            :class="[
              'text-xs px-2.5 py-1.5 rounded-lg border transition-all',
              stopReason === r
                ? 'bg-rose-500 text-white border-rose-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700',
            ]"
          >
            {{ r }}
          </button>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('driverView.stopReasonCustomLabel') }}</label>
          <input
            v-model="stopReason"
            type="text"
            required
            :placeholder="t('driverView.stopReasonCustomPlaceholder')"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">{{ t('driverView.stopNotesOptional') }}</label>
          <textarea
            v-model="stopNotes"
            rows="2"
            :placeholder="t('driverView.stopNotesPlaceholder')"
            class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white resize-none"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="isStopModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleConfirmStop"
            :disabled="isSubmittingStop"
            class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-lg shadow-rose-600/20"
          >
            {{ isSubmittingStop ? t('common.loading') : t('driverView.btnConfirmStop') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div
      v-if="previewImage"
      @click="previewImage = null"
      class="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-pointer"
    >
      <div class="relative max-w-lg max-h-[85vh] flex flex-col items-center" @click.stop>
        <button
          @click="previewImage = null"
          class="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
        >
          <X class="w-6 h-6" />
        </button>
        <img
          :src="previewImage.url"
          class="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-700"
        />
        <p v-if="previewImage.caption" class="text-sm text-slate-200 mt-3 text-center">
          {{ previewImage.caption }}
        </p>
      </div>
    </div>
  </div>
</template>
