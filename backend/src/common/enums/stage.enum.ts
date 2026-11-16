export enum ScheduleStage {
  SCHEDULED = 'SCHEDULED',         // Agendado
  IN_TRANSIT = 'IN_TRANSIT',       // Em trânsito
  STOPPED = 'STOPPED',             // Parado (trânsito, problema, etc.)
  WAITING_YARD = 'WAITING_YARD',   // Chegou / No pátio aguardando doca
  AT_DOCK = 'AT_DOCK',             // Encostado na doca
  UNLOADING = 'UNLOADING',         // Em descarga
  COMPLETED = 'COMPLETED',         // Descarga finalizada / Liberado
  CANCELLED = 'CANCELLED',         // Cancelado
}

export enum SchedulePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
