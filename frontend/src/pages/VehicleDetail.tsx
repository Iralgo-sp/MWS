import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleWithDetails } from "../api/types";
import { formatNumber, PAYMENT_METHOD_LABELS, VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "../constants";
import MaintenanceSection from "../components/MaintenanceSection";
import InsuranceSection from "../components/InsuranceSection";
import InstallmentsSection from "../components/InstallmentsSection";
import OdometerSection from "../components/OdometerSection";
import DocumentsSection from "../components/DocumentsSection";

type TabId = "mantenimiento" | "seguros" | "financiacion" | "kilometraje" | "documentos";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("mantenimiento");

  const load = useCallback(() => {
    if (!id) return;
    api.vehicles
      .get(id)
      .then(setVehicle)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!id || !vehicle) return;
    if (!confirm(`¿Eliminar "${vehicle.alias}" y todo su historial? Esta acción no se puede deshacer.`)) return;
    await api.vehicles.remove(id);
    navigate("/");
  }

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!vehicle) return <p className="p-6 text-slate-500">Cargando…</p>;

  const tabs: { id: TabId; label: string }[] = [
    { id: "mantenimiento", label: "Mantenimiento" },
    { id: "seguros", label: "Seguros" },
    ...(vehicle.paymentMethod === "financiado" ? [{ id: "financiacion" as TabId, label: "Financiación" }] : []),
    { id: "kilometraje", label: "Kilometraje" },
    { id: "documentos", label: "Documentos" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-3xl leading-none">{VEHICLE_TYPE_ICONS[vehicle.type]}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 truncate">{vehicle.alias}</h1>
          <p className="text-sm text-slate-500">
            {VEHICLE_TYPE_LABELS[vehicle.type]}
            {vehicle.brand ? ` · ${vehicle.brand}` : ""}
            {vehicle.model ? ` ${vehicle.model}` : ""}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
            {vehicle.plate ? ` · ${vehicle.plate}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              vehicle.status === "activo"
                ? "bg-teal-50 text-teal-700 border border-teal-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {vehicle.status === "activo" ? "Activo" : "Vendido"}
          </span>
          <Link
            to={`/vehicles/${vehicle.id}/edit`}
            className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm transition-colors"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-red-600 text-sm transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left panel: vehicle info */}
        <aside className="w-72 shrink-0 space-y-4">
          <InfoCard title="Datos del vehículo">
            <InfoField label="Matrícula / bastidor" value={vehicle.plate ?? undefined} />
            <InfoField
              label="Fecha de compra"
              value={
                vehicle.purchaseDate
                  ? new Date(vehicle.purchaseDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : undefined
              }
            />
            <InfoField
              label="Precio de compra"
              value={vehicle.purchasePrice != null ? `${formatNumber(vehicle.purchasePrice)} €` : undefined}
            />
            <InfoField label="Forma de pago" value={PAYMENT_METHOD_LABELS[vehicle.paymentMethod]} />
            {vehicle.dealerName && <InfoField label="Concesionario" value={vehicle.dealerName} />}
            {vehicle.dealerAddress && <InfoField label="Dirección" value={vehicle.dealerAddress} />}
            {vehicle.dealerAgent && <InfoField label="Agente" value={vehicle.dealerAgent} />}
            {vehicle.notes && <InfoField label="Notas" value={vehicle.notes} />}
          </InfoCard>

          {vehicle.paymentMethod === "financiado" && (
            <InfoCard title="Financiación">
              {vehicle.financingLender && <InfoField label="Entidad" value={vehicle.financingLender} />}
              <InfoField
                label="Importe financiado"
                value={vehicle.financingAmount != null ? `${formatNumber(vehicle.financingAmount)} €` : undefined}
              />
              <InfoField
                label="Interés (TIN)"
                value={
                  vehicle.financingInterestRate != null ? `${vehicle.financingInterestRate} %` : undefined
                }
              />
              <InfoField
                label="Plazo"
                value={
                  vehicle.financingTermMonths != null ? `${vehicle.financingTermMonths} meses` : undefined
                }
              />
              {vehicle.financingNotes && <InfoField label="Notas" value={vehicle.financingNotes} />}
            </InfoCard>
          )}
        </aside>

        {/* Right panel: tabs */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab bar */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {tab === "mantenimiento" && (
              <MaintenanceSection vehicleId={vehicle.id} records={vehicle.maintenanceRecords} onChange={load} />
            )}
            {tab === "seguros" && (
              <InsuranceSection vehicleId={vehicle.id} policies={vehicle.insurancePolicies} onChange={load} />
            )}
            {tab === "financiacion" && vehicle.paymentMethod === "financiado" && (
              <InstallmentsSection vehicleId={vehicle.id} installments={vehicle.installments} onChange={load} />
            )}
            {tab === "kilometraje" && (
              <OdometerSection vehicleId={vehicle.id} readings={vehicle.odometerReadings} onChange={load} />
            )}
            {tab === "documentos" && (
              <DocumentsSection vehicleId={vehicle.id} documents={vehicle.documents} onChange={load} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="px-4 py-2.5">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 mt-0.5">{value}</dd>
    </div>
  );
}
