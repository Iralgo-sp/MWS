export const VEHICLE_TYPES = ["bici", "moto", "coche", "otro"] as const;
export const VEHICLE_STATUSES = ["activo", "vendido"] as const;
export const MAINTENANCE_TYPES = ["reparacion", "revision", "itv", "otro"] as const;
export const INSURANCE_TYPES = ["terceros", "todo_riesgo", "otro"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
export type InsuranceType = (typeof INSURANCE_TYPES)[number];
