import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleWithDetails } from "../api/types";
import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "../constants";
import MaintenanceSection from "../components/MaintenanceSection";
import InsuranceSection from "../components/InsuranceSection";

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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
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
        <div className="flex shrink-0 gap-2">
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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3">
        <Info label="Matrícula / bastidor" value={vehicle.plate ?? undefined} />
        <Info
          label="Fecha de compra"
          value={vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : undefined}
        />
        <Info
          label="Precio de compra"
          value={vehicle.purchasePrice != null ? `${vehicle.purchasePrice} €` : undefined}
        />
        <Info label="Estado" value={vehicle.status === "activo" ? "Activo" : "Vendido"} />
        {vehicle.notes && <Info label="Notas" value={vehicle.notes} className="col-span-full" />}
      </dl>

      <MaintenanceSection vehicleId={vehicle.id} records={vehicle.maintenanceRecords} onChange={load} />
      <InsuranceSection vehicleId={vehicle.id} policies={vehicle.insurancePolicies} onChange={load} />
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
