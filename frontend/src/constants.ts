import type { InsuranceType, MaintenanceType, VehicleType } from "./api/types";

export const VEHICLE_TYPES: VehicleType[] = ["bici", "moto", "coche", "otro"];
export const MAINTENANCE_TYPES: MaintenanceType[] = ["reparacion", "revision", "itv", "otro"];
export const INSURANCE_TYPES: InsuranceType[] = ["terceros", "todo_riesgo", "otro"];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  bici: "Bicicleta",
  moto: "Moto",
  coche: "Coche",
  otro: "Otro",
};

export const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  bici: "🚲",
  moto: "🏍️",
  coche: "🚗",
  otro: "🚙",
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  reparacion: "Reparación",
  revision: "Revisión",
  itv: "ITV",
  otro: "Otro",
};

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  terceros: "A terceros",
  todo_riesgo: "Todo riesgo",
  otro: "Otro",
};

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";
