import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleWithDetails } from "../api/types";
import { formatNumber, PAYMENT_METHOD_LABELS, VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "../constants";
import MaintenanceSection from "../components/MaintenanceSection";
import InstallmentsSection from "../components/InstallmentsSection";
import DocumentsSection from "../components/DocumentsSection";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!vehicle) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 lg:max-w-7xl">
      <div className="flex items-start justify-between gap-4 lg:grid lg:grid-cols-3 lg:items-start">
        <div className="flex items-center gap-3 lg:col-start-2 lg:justify-self-center">
          <span className="text-3xl">{VEHICLE_TYPE_ICONS[vehicle.type]}</span>
          <div>
            <h1 className="text-xl font-semibold">{vehicle.alias}</h1>
            <p className="text-sm text-slate-500">
              {VEHICLE_TYPE_LABELS[vehicle.type]}
              {vehicle.brand ? ` · ${vehicle.brand}` : ""}
              {vehicle.model ? ` ${vehicle.model}` : ""}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 lg:col-start-3 lg:justify-self-end">
          <Link
            to={`/vehicles/${vehicle.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-900"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:w-[30%] lg:shrink-0">
          <InsuranceSummaryCard vehicleId={vehicle.id} count={vehicle.insurancePolicies.length} />
        </div>

        <div className="space-y-8 lg:flex-1">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
            <Info label="Matrícula / bastidor" value={vehicle.plate ?? undefined} />
            <Info
              label="Fecha de compra"
              value={vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : undefined}
            />
            <Info
              label="Precio de compra"
              value={vehicle.purchasePrice != null ? `${formatNumber(vehicle.purchasePrice)} €` : undefined}
            />
            <Info label="Estado" value={vehicle.status === "activo" ? "Activo" : "Vendido"} />
            <Info label="Forma de pago" value={PAYMENT_METHOD_LABELS[vehicle.paymentMethod]} />
            <Info label="Concesionario" value={vehicle.dealerName ?? undefined} />
            <Info label="Dirección del concesionario" value={vehicle.dealerAddress ?? undefined} />
            <Info label="Agente / comercial" value={vehicle.dealerAgent ?? undefined} />
            {vehicle.paymentMethod === "financiado" && (
              <>
                <Info label="Entidad financiera" value={vehicle.financingLender ?? undefined} />
                <Info
                  label="Importe financiado"
                  value={vehicle.financingAmount != null ? `${formatNumber(vehicle.financingAmount)} €` : undefined}
                />
                <Info
                  label="Interés"
                  value={vehicle.financingInterestRate != null ? `${vehicle.financingInterestRate} %` : undefined}
                />
                <Info
                  label="Plazo"
                  value={vehicle.financingTermMonths != null ? `${vehicle.financingTermMonths} meses` : undefined}
                />
                {vehicle.financingNotes && (
                  <Info label="Notas de la financiación" value={vehicle.financingNotes} className="col-span-full" />
                )}
              </>
            )}
            {vehicle.notes && <Info label="Notas" value={vehicle.notes} className="col-span-full" />}
          </dl>

          <DocumentsSection vehicleId={vehicle.id} documents={vehicle.documents} onChange={load} />

          <MaintenanceSection vehicleId={vehicle.id} records={vehicle.maintenanceRecords} onChange={load} />

          {vehicle.paymentMethod === "financiado" && (
            <InstallmentsSection vehicleId={vehicle.id} installments={vehicle.installments} onChange={load} />
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value?: string; className?: string }) {
  if (!value) return null;
  return (
    <div className={className}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function InsuranceSummaryCard({ vehicleId, count }: { vehicleId: string; count: number }) {
  return (
    <Link
      to={`/vehicles/${vehicleId}/insurance`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <div>
        <h2 className="text-lg font-semibold">Seguros</h2>
        <p className="text-slate-500">
          {count === 0 ? "Sin pólizas registradas" : count === 1 ? "1 póliza registrada" : `${count} pólizas registradas`}
        </p>
      </div>
      <span className="text-slate-400">→</span>
    </Link>
  );
}
