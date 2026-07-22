import type { InsuranceType, MaintenanceType, PaymentMethod, VehicleType } from "./api/types";

export const VEHICLE_TYPES: VehicleType[] = ["bici", "moto", "coche", "otro"];
export const MAINTENANCE_TYPES: MaintenanceType[] = ["reparacion", "revision", "itv", "otro"];
export const INSURANCE_TYPES: InsuranceType[] = ["terceros", "terceros_ampliado", "todo_riesgo", "otro"];
export const PAYMENT_METHODS: PaymentMethod[] = ["contado", "financiado"];

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
  terceros_ampliado: "A terceros ampliado",
  todo_riesgo: "Todo riesgo",
  otro: "Otro",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  contado: "Al contado",
  financiado: "Financiado",
};

export function formatNumber(n: number): string {
  return n.toLocaleString("es-ES");
}

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";
