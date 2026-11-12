import type {
  AcquisitionOffer,
  DashboardSummary,
  Installment,
  InsurancePolicy,
  MaintenanceRecord,
  OdometerReading,
  Vehicle,
  VehicleDocument,
  VehicleWithDetails,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  dashboard: {
    summary: () => request<DashboardSummary>("/dashboard/summary"),
  },
  vehicles: {
    list: () => request<Vehicle[]>("/vehicles"),
    get: (id: string) => request<VehicleWithDetails>(`/vehicles/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Vehicle>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/vehicles/${id}`, { method: "DELETE" }),
    uploadCover: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return upload<{ coverImage: string }>(`/vehicles/${id}/cover`, formData);
    },
    removeCover: (id: string) => request<void>(`/vehicles/${id}/cover`, { method: "DELETE" }),
    coverUrl: (id: string) => `${BASE}/vehicles/${id}/cover`,
  },
  maintenance: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<MaintenanceRecord>(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/maintenance/${id}`, { method: "DELETE" }),
  },
  insurance: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<InsurancePolicy>(`/vehicles/${vehicleId}/insurance`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<InsurancePolicy>(`/insurance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    select: (id: string) =>
      request<InsurancePolicy>(`/insurance/${id}/select`, { method: "PUT" }),
    copyToNextYear: (id: string) =>
      request<InsurancePolicy>(`/insurance/${id}/copy-year`, { method: "POST" }),
    remove: (id: string) => request<void>(`/insurance/${id}`, { method: "DELETE" }),
  },
  acquisitionOffers: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<AcquisitionOffer>(`/vehicles/${vehicleId}/acquisition-offers`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<AcquisitionOffer>(`/acquisition-offers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    select: (id: string) =>
      request<AcquisitionOffer>(`/acquisition-offers/${id}/select`, { method: "PUT" }),
    remove: (id: string) => request<void>(`/acquisition-offers/${id}`, { method: "DELETE" }),
  },
  installments: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<Installment>(`/vehicles/${vehicleId}/installments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    batchCreate: (vehicleId: string, installments: Record<string, unknown>[]) =>
      request<Installment[]>(`/vehicles/${vehicleId}/installments/batch`, {
        method: "POST",
        body: JSON.stringify({ installments }),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Installment>(`/installments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/installments/${id}`, { method: "DELETE" }),
    deleteAllCuotas: (vehicleId: string) =>
      request<void>(`/vehicles/${vehicleId}/installments?conceptFilter=cuota`, { method: "DELETE" }),
  },
  odometer: {
    list: (vehicleId: string) =>
      request<OdometerReading[]>(`/vehicles/${vehicleId}/odometer`),
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<OdometerReading>(`/vehicles/${vehicleId}/odometer`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<OdometerReading>(`/odometer/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/odometer/${id}`, { method: "DELETE" }),
  },
  documents: {
    uploadToVehicle: (vehicleId: string, file: File, label: string) => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);
      return upload<VehicleDocument>(`/vehicles/${vehicleId}/documents`, formData);
    },
    uploadToMaintenance: (maintenanceId: string, file: File, label: string) => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);
      return upload<VehicleDocument>(`/maintenance/${maintenanceId}/documents`, formData);
    },
    uploadToInsurance: (policyId: string, file: File, label: string) => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);
      return upload<VehicleDocument>(`/insurance/${policyId}/documents`, formData);
    },
    uploadToAcquisitionOffer: (offerId: string, file: File, label: string) => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);
      return upload<VehicleDocument>(`/acquisition-offers/${offerId}/documents`, formData);
    },
    remove: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
    downloadUrl: (id: string) => `${BASE}/documents/${id}/download`,
  },
};
