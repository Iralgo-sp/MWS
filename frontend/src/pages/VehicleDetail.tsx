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

type TabId = "mantenimiento" | "seguros" | "pagos" | "kilometraje" | "documentos";

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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await api.vehicles.uploadCover(id, file);
    load();
    e.target.value = "";
  }

  async function handleCoverRemove() {
    if (!id) return;
    await api.vehicles.removeCover(id);
    load();
  }

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
    { id: "pagos", label: "Pagos" },
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
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 truncate">{vehicle.alias}</h1>
          <p className="text-sm text-slate-500">
            {VEHICLE_TYPE_LABELS[vehicle.type]}
            {vehicle.brand ? ` · ${vehicle.brand}` : ""}
            {vehicle.model ? ` ${vehicle.model}` : ""}
            {vehicle.year ? ` · ${vehicle.year}` : ""}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
            {vehicle.plate ? ` · ${vehicle.plate}` : ""}
            {vehicle.chassis ? ` · ${vehicle.chassis}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
        <aside className="w-80 shrink-0 space-y-4">
          {/* Cover photo */}
          <div className="relative group rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm" style={{ aspectRatio: "16/9" }}>
            {vehicle.coverImage ? (
              <img
                src={`${api.vehicles.coverUrl(vehicle.id)}?t=${vehicle.updatedAt}`}
                alt={vehicle.alias}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl opacity-10">{VEHICLE_TYPE_ICONS[vehicle.type]}</span>
              </div>
            )}
            <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Cambiar foto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-xs font-medium">{vehicle.coverImage ? "Cambiar foto" : "Añadir foto"}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
            </label>
            {vehicle.coverImage && (
              <button
                onClick={handleCoverRemove}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Quitar foto"
              >×</button>
            )}
          </div>

          <InfoCard title="Datos del vehículo">
            {vehicle.plate && <InfoField label="Matrícula" value={vehicle.plate} />}
            {vehicle.chassis && <InfoField label="Bastidor / VIN" value={vehicle.chassis} />}
            {vehicle.color && <InfoField label="Color" value={vehicle.color} />}
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

          <TcoPanel vehicle={vehicle} />
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
            {tab === "pagos" && (
              <InstallmentsSection
                vehicleId={vehicle.id}
                installments={vehicle.installments}
                onChange={load}
                paymentMethod={vehicle.paymentMethod}
                purchasePrice={vehicle.purchasePrice ?? undefined}
                financingAmount={vehicle.financingAmount ?? undefined}
                financingInterestRate={vehicle.financingInterestRate ?? undefined}
                financingTermMonths={vehicle.financingTermMonths ?? undefined}
              />
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

function TcoPanel({ vehicle }: { vehicle: VehicleWithDetails }) {
  const purchasePrice = vehicle.purchasePrice ?? 0;
  const totalMaintenance = vehicle.maintenanceRecords.reduce((s, r) => s + (r.cost ?? 0), 0);
  const totalInsurance = vehicle.insurancePolicies
    .filter((p) => p.isSelected)
    .reduce((s, p) => s + (p.annualCost ?? 0), 0);
  const totalInterest = vehicle.installments
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + (i.interestAmount ?? 0), 0);
  const tcoTotal = purchasePrice + totalMaintenance + totalInsurance + totalInterest;

  if (tcoTotal === 0) return null;

  const monthsOwned = vehicle.purchaseDate
    ? Math.max(1, Math.round((Date.now() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    : null;
  const euroPerMonth = monthsOwned ? tcoTotal / monthsOwned : null;

  const sortedReadings = [...vehicle.odometerReadings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const totalKm =
    sortedReadings.length >= 2
      ? sortedReadings[sortedReadings.length - 1].mileage - sortedReadings[0].mileage
      : sortedReadings.length === 1
      ? sortedReadings[0].mileage
      : null;
  const euroPerKm = totalKm && totalKm > 0 ? tcoTotal / totalKm : null;

  return (
    <InfoCard title="Coste total (TCO)">
      <InfoField label="Precio de compra" value={`${formatNumber(purchasePrice)} €`} />
      {totalMaintenance > 0 && <InfoField label="Mantenimiento" value={`${formatNumber(totalMaintenance)} €`} />}
      {totalInsurance > 0 && <InfoField label="Seguros" value={`${formatNumber(totalInsurance)} €`} />}
      {totalInterest > 0 && <InfoField label="Intereses financiación" value={`${formatNumber(totalInterest)} €`} />}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
        <dt className="text-xs text-slate-400">Total acumulado</dt>
        <dd className="text-sm font-semibold text-slate-900 mt-0.5">{formatNumber(tcoTotal)} €</dd>
      </div>
      {(euroPerMonth != null || euroPerKm != null) && (
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
          {euroPerMonth != null && (
            <div className="px-4 py-2.5 text-center">
              <p className="text-xs text-slate-400">€ / mes</p>
              <p className="text-sm font-semibold text-teal-700 mt-0.5">{formatNumber(euroPerMonth)}</p>
            </div>
          )}
          {euroPerKm != null && (
            <div className="px-4 py-2.5 text-center">
              <p className="text-xs text-slate-400">€ / km</p>
              <p className="text-sm font-semibold text-teal-700 mt-0.5">{euroPerKm.toFixed(3)}</p>
            </div>
          )}
        </div>
      )}
    </InfoCard>
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
