import type {
  Installment,
  InsurancePolicy,
  MaintenanceRecord,
  Vehicle,
  VehicleDocument,
  VehicleWithDetails,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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
  vehicles: {
    list: () => request<Vehicle[]>("/vehicles"),
    get: (id: string) => request<VehicleWithDetails>(`/vehicles/${id}`),
    create: (data: Record<string, unknown>) =>
      request<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Vehicle>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/vehicles/${id}`, { method: "DELETE" }),
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
    remove: (id: string) => request<void>(`/insurance/${id}`, { method: "DELETE" }),
  },
  installments: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      request<Installment>(`/vehicles/${vehicleId}/installments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Installment>(`/installments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/installments/${id}`, { method: "DELETE" }),
  },
  documents: {
    upload: (vehicleId: string, file: File, label: string) => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);
      return upload<VehicleDocument>(`/vehicles/${vehicleId}/documents`, formData);
    },
    remove: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
    downloadUrl: (id: string) => `${BASE}/documents/${id}/download`,
  },
};
