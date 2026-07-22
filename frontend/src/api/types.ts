export type VehicleType = "bici" | "moto" | "coche" | "otro";
export type VehicleStatus = "activo" | "vendido";
export type MaintenanceType = "reparacion" | "revision" | "itv" | "otro";
export type InsuranceType = "terceros" | "terceros_ampliado" | "todo_riesgo" | "otro";
export type PaymentMethod = "contado" | "financiado";

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
  dealerName?: string | null;
  dealerAddress?: string | null;
  dealerAgent?: string | null;
  paymentMethod: PaymentMethod;
  financingLender?: string | null;
  financingAmount?: number | null;
  financingInterestRate?: number | null;
  financingTermMonths?: number | null;
  financingNotes?: string | null;
  _count?: {
    maintenanceRecords: number;
    insurancePolicies: number;
    installments: number;
    documents: number;
  };
}

export interface VehicleWithDetails extends Vehicle {
  maintenanceRecords: MaintenanceRecord[];
  insurancePolicies: InsurancePolicy[];
  installments: Installment[];
  documents: VehicleDocument[];
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
  documents: VehicleDocument[];
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
  documents: VehicleDocument[];
}

export interface Installment {
  id: string;
  vehicleId: string;
  paymentDate: string;
  installmentNumber?: number | null;
  principalAmount?: number | null;
  interestAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  maintenanceRecordId?: string | null;
  insurancePolicyId?: string | null;
  label: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}
