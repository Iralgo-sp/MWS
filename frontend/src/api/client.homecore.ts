/**
 * API client for MWS running inside HomeCore.
 * Replaces HTTP fetch calls with Electron IPC via window.__mws.
 * Active when built with vite.config.homecore.ts (alias swaps this for client.ts).
 */
import type {
  AcquisitionOffer,
  DashboardSummary,
  FleetReport,
  Installment,
  InsurancePolicy,
  MaintenanceRecord,
  OdometerReading,
  Vehicle,
  VehicleDocument,
  VehicleWithDetails,
} from "./types";

declare global {
  interface Window {
    __mws: {
      invoke: (channel: string, args?: unknown) => Promise<unknown>
    }
  }
}

function invoke<T>(channel: string, args?: unknown): Promise<T> {
  return window.__mws.invoke(channel, args ?? {}) as Promise<T>
}

async function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export const api = {
  dashboard: {
    summary: () => invoke<DashboardSummary>("mws:dashboard:summary"),
  },
  reports: {
    fleet: () => invoke<FleetReport>("mws:reports:fleet"),
  },
  vehicles: {
    list: () => invoke<Vehicle[]>("mws:vehicles:list"),
    get:  (id: string) => invoke<VehicleWithDetails>("mws:vehicles:get", { id }),
    create: (data: Record<string, unknown>) =>
      invoke<Vehicle>("mws:vehicles:create", data),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<Vehicle>("mws:vehicles:update", { id, ...data }),
    remove: (id: string) => invoke<void>("mws:vehicles:delete", { id }),

    uploadCover: async (id: string, file: File) => {
      const arrayBuffer = await readFileAsBuffer(file)
      return invoke<{ coverImage: string }>("mws:vehicles:upload-cover", {
        id,
        arrayBuffer,
        mimeType: file.type,
        filename: file.name,
      })
    },
    removeCover: (id: string) => invoke<void>("mws:vehicles:delete-cover", { id }),
    // Returns a URL served by the mws-asset:// custom protocol
    coverUrl: (id: string) => `mws-asset://cover/${id}`,
  },
  maintenance: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      invoke<MaintenanceRecord>("mws:maintenance:create", { vehicleId, ...data }),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<MaintenanceRecord>("mws:maintenance:update", { id, ...data }),
    remove: (id: string) => invoke<void>("mws:maintenance:delete", { id }),
  },
  insurance: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      invoke<InsurancePolicy>("mws:insurance:create", { vehicleId, ...data }),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<InsurancePolicy>("mws:insurance:update", { id, ...data }),
    select: (id: string) =>
      invoke<InsurancePolicy>("mws:insurance:select", { id }),
    copyToNextYear: (id: string) =>
      invoke<InsurancePolicy>("mws:insurance:copy-year", { id }),
    remove: (id: string) => invoke<void>("mws:insurance:delete", { id }),
  },
  acquisitionOffers: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      invoke<AcquisitionOffer>("mws:acquisition-offers:create", { vehicleId, ...data }),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<AcquisitionOffer>("mws:acquisition-offers:update", { id, ...data }),
    select: (id: string) =>
      invoke<AcquisitionOffer>("mws:acquisition-offers:select", { id }),
    remove: (id: string) => invoke<void>("mws:acquisition-offers:delete", { id }),
  },
  installments: {
    create: (vehicleId: string, data: Record<string, unknown>) =>
      invoke<Installment>("mws:installments:create", { vehicleId, ...data }),
    batchCreate: (vehicleId: string, installments: Record<string, unknown>[]) =>
      invoke<Installment[]>("mws:installments:batch-create", { vehicleId, installments }),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<Installment>("mws:installments:update", { id, ...data }),
    remove: (id: string) => invoke<void>("mws:installments:delete", { id }),
    deleteAllCuotas: (vehicleId: string) =>
      invoke<void>("mws:installments:delete-all", { vehicleId, conceptFilter: "cuota" }),
  },
  odometer: {
    list: (vehicleId: string) =>
      invoke<OdometerReading[]>("mws:odometer:list", { vehicleId }),
    create: (vehicleId: string, data: Record<string, unknown>) =>
      invoke<OdometerReading>("mws:odometer:create", { vehicleId, ...data }),
    update: (id: string, data: Record<string, unknown>) =>
      invoke<OdometerReading>("mws:odometer:update", { id, ...data }),
    remove: (id: string) => invoke<void>("mws:odometer:delete", { id }),
  },
  documents: {
    uploadToVehicle: async (vehicleId: string, file: File, label: string) =>
      invoke<VehicleDocument>("mws:documents:upload-to-vehicle", {
        vehicleId, label,
        arrayBuffer: await readFileAsBuffer(file),
        mimeType:    file.type,
        originalName: file.name,
      }),
    uploadToMaintenance: async (maintenanceId: string, file: File, label: string) =>
      invoke<VehicleDocument>("mws:documents:upload-to-maintenance", {
        maintenanceId, label,
        arrayBuffer:  await readFileAsBuffer(file),
        mimeType:     file.type,
        originalName: file.name,
      }),
    uploadToInsurance: async (insuranceId: string, file: File, label: string) =>
      invoke<VehicleDocument>("mws:documents:upload-to-insurance", {
        insuranceId, label,
        arrayBuffer: await readFileAsBuffer(file),
        mimeType:    file.type,
        originalName: file.name,
      }),
    uploadToAcquisitionOffer: async (acquisitionOfferId: string, file: File, label: string) =>
      invoke<VehicleDocument>("mws:documents:upload-to-acquisition-offer", {
        acquisitionOfferId, label,
        arrayBuffer: await readFileAsBuffer(file),
        mimeType:    file.type,
        originalName: file.name,
      }),
    remove:      (id: string) => invoke<void>("mws:documents:delete", { id }),
    // Returns a URL served by the mws-asset:// custom protocol
    downloadUrl: (id: string) => `mws-asset://doc/${id}`,
  },
};
