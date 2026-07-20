export type VehicleType = "bici" | "moto" | "coche" | "otro";
export type VehicleStatus = "activo" | "vendido";
export type MaintenanceType = "reparacion" | "revision" | "itv" | "otro";
export type InsuranceType = "terceros" | "todo_riesgo" | "otro";

export interface Vehicle {
  id: string;
  type: VehicleType;
  alias: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  plate?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  notes?: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { maintenanceRecords: number; insurancePolicies: number };
}

export interface VehicleWithDetails extends Vehicle {
  maintenanceRecords: MaintenanceRecord[];
  insurancePolicies: InsurancePolicy[];
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  cost?: number | null;
  workshop?: string | null;
  mileage?: number | null;
  createdAt: string;
}

export interface InsurancePolicy {
  id: string;
  vehicleId: string;
  company: string;
  policyNumber: string;
  type: InsuranceType;
  startDate: string;
  endDate?: string | null;
  annualCost?: number | null;
  notes?: string | null;
  createdAt: string;
}
