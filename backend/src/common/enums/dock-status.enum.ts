export enum DockStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DockType {
  DRY = 'DRY',             // Carga Seca
  REFRIGERATED = 'REFRIGERATED', // Refrigerada / Congelada
  HAZARDOUS = 'HAZARDOUS', // Carga Perigosa / Química
  BULK = 'BULK',           // Granel
}
