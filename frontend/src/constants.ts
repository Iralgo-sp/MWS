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

export type PaymentConcept = "entrada" | "pago_previo" | "pago_final" | "cuota" | "otro";
export const PAYMENT_CONCEPTS: PaymentConcept[] = ["entrada", "pago_previo", "pago_final", "cuota", "otro"];
export const PAYMENT_CONCEPT_LABELS: Record<PaymentConcept, string> = {
  entrada: "Entrada",
  pago_previo: "Pago previo a entrega",
  pago_final: "Pago final",
  cuota: "Cuota mensual",
  otro: "Otro",
};

export type InsuranceStatus = "presupuesto" | "activa" | "descartada";
export const INSURANCE_STATUSES: InsuranceStatus[] = ["presupuesto", "activa", "descartada"];
export const INSURANCE_STATUS_LABELS: Record<InsuranceStatus, string> = {
  presupuesto: "Presupuesto",
  activa: "Activa",
  descartada: "Descartada",
};

export function formatNumber(n: number): string {
  const [integer, decimal] = n.toFixed(2).split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + decimal;
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors";
