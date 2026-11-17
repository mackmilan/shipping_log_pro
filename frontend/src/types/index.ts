export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  USER = 'USER',
  DRIVER = 'DRIVER',
}

export enum ScheduleStage {
  SCHEDULED = 'SCHEDULED',         // Agendado
  IN_TRANSIT = 'IN_TRANSIT',       // Em trânsito
  STOPPED = 'STOPPED',             // Parado (trânsito, quebra, etc.)
  WAITING_YARD = 'WAITING_YARD',   // No pátio / Fila
  AT_DOCK = 'AT_DOCK',             // Na doca
  UNLOADING = 'UNLOADING',         // Em descarga
  COMPLETED = 'COMPLETED',         // Finalizado
  CANCELLED = 'CANCELLED',         // Cancelado
}

export enum SchedulePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DockStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DockType {
  DRY = 'DRY',
  REFRIGERATED = 'REFRIGERATED',
  HAZARDOUS = 'HAZARDOUS',
  BULK = 'BULK',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Truck {
  id: number;
  plate: string;
  driverName: string;
  driverPhone?: string;
  carrierName: string;
  truckType: string;
  createdAt: string;
}

export interface Dock {
  id: number;
  code: string;
  name: string;
  type: DockType;
  status: DockStatus;
  notes?: string;
  schedules?: UnloadingSchedule[];
  createdAt: string;
}

export interface StageImageItem {
  id?: string;
  url: string;
  caption?: string;
  stage?: ScheduleStage;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface StageLog {
  id: number;
  scheduleId: number;
  stage: ScheduleStage;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes: number;
  reason?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  images?: StageImageItem[];
  recordedById?: number;
  recordedBy?: {
    id: number;
    name: string;
    role: UserRole;
  };
  createdAt: string;
}

export interface ScheduleMetrics {
  totalInTransitMinutes: number;
  totalStoppedMinutes: number;
  totalYardMinutes: number;
  totalUnloadingMinutes: number;
  activeStageDurationMinutes: number;
  isOverdue: boolean;
  delayMinutes: number;
}

export interface UnloadingSchedule {
  id: number;
  code: string;
  truckId: number;
  truck: Truck;
  dockId?: number | null;
  dock?: Dock | null;
  driverId?: number | null;
  driver?: User | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualArrivalAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  currentStage: ScheduleStage;
  priority: SchedulePriority;
  cargoDescription: string;
  cargoWeightKg?: number | null;
  invoiceNumber?: string | null;
  estimatedDurationMinutes: number;
  notes?: string | null;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastLocationName?: string | null;
  stageLogs: StageLog[];
  metrics: ScheduleMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  activeCounts: {
    inTransit: number;
    stopped: number;
    waitingYard: number;
    unloading: number;
    completedToday: number;
    overdue: number;
    totalActive: number;
  };
  averages: {
    avgStoppedMinutes: number;
    avgUnloadingMinutes: number;
    avgTransitMinutes: number;
    avgYardWaitMinutes: number;
    windowAdherenceRate: number;
  };
  docks: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
}
