export type VehicleType = "bici" | "moto" | "coche" | "otro";
export type VehicleStatus = "activo" | "vendido";
export type MaintenanceType = "reparacion" | "revision" | "itv" | "otro";
export type InsuranceType = "todo_riesgo_cf" | "todo_riesgo_sf" | "terceros" | "ampliado" | "irl";
export type PaymentMethod = "contado" | "financiado";

export interface Vehicle {
  id: string;
  type: VehicleType;
  alias: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  plate?: string | null;
  chassis?: string | null;
  color?: string | null;
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
  nextItv?: string | null;
  serviceIntervalKm?: number | null;
  coverImage?: string | null;
  _count?: {
    maintenanceRecords: number;
    insurancePolicies: number;
    installments: number;
    documents: number;
  };
}

export interface OdometerReading {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  notes?: string | null;
  createdAt: string;
}

export interface VehicleWithDetails extends Vehicle {
  maintenanceRecords: MaintenanceRecord[];
  insurancePolicies: InsurancePolicy[];
  installments: Installment[];
  documents: VehicleDocument[];
  odometerReadings: OdometerReading[];
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
  year: number;
  status: string; // "presupuesto" | "activa" | "descartada"
  isSelected: boolean;
  company: string;
  policyNumber: string;
  type: InsuranceType;
  startDate: string;
  endDate?: string | null;
  annualCost?: number | null;
  hasFranchise: boolean;
  franchiseAmount?: number | null;
  notes?: string | null;
  createdAt: string;
  documents: VehicleDocument[];
}

export interface Installment {
  id: string;
  vehicleId: string;
  paymentDate: string;
  concept: string; // "entrada" | "pago_previo" | "pago_final" | "cuota" | "otro"
  isPaid: boolean;
  installmentNumber?: number | null;
  principalAmount?: number | null;
  interestAmount?: number | null;
  totalAmount?: number | null;
  remainingBalance?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface KmAlert {
  id: string; alias: string; type: string;
  currentKm: number; lastRevisionKm: number;
  serviceIntervalKm: number; kmOverdue: number;
}

export interface DashboardSummary {
  expiringPolicies: (InsurancePolicy & { vehicle: { id: string; alias: string; type: string } })[];
  upcomingItv: { id: string; alias: string; type: string; nextItv: string }[];
  kmAlerts: KmAlert[];
  pendingThisMonth: (Installment & { vehicle: { id: string; alias: string; type: string } })[];
  monthlyExpenses: {
    maintenance: number;
    insurance: number;
    installments: number;
    total: number;
  };
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
