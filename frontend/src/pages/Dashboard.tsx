import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Vehicle } from "../api/types";
import {
  formatNumber,
  VEHICLE_TYPE_ICONS,
  VEHICLE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../constants";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vehicles
      .list()
      .then(setVehicles)
      .catch((e: Error) => setError(e.message));
  }, []);

  const active = vehicles?.filter((v) => v.status === "activo") ?? [];
  const total = vehicles?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen de tus vehículos</p>
        </div>
        <Link
          to="/vehicles/new"
          className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
        >
          + Añadir vehículo
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Vehículos activos" value={String(active.length)} />
        <StatTile label="Total vehículos" value={String(total)} />
        <StatTile label="Próximos vencimientos" value="—" note="Disponible en Prioridad 2" />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!vehicles && !error && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <p>Cargando…</p>
        </div>
      )}

      {vehicles?.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Todavía no hay vehículos.</p>
          <p className="text-slate-400 text-sm mt-1">Añade el primero para empezar.</p>
          <Link
            to="/vehicles/new"
            className="mt-4 inline-block px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium"
          >
            + Añadir vehículo
          </Link>
        </div>
      )}

      {vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1 font-variant-numeric tabular-nums">{value}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  );
}

function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5">{VEHICLE_TYPE_ICONS[v.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{v.alias}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  v.status === "activo"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {v.status === "activo" ? "Activo" : "Vendido"}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate">
              {VEHICLE_TYPE_LABELS[v.type]}
              {v.brand ? ` · ${v.brand}` : ""}
              {v.model ? ` ${v.model}` : ""}
              {v.year ? ` · ${v.year}` : ""}
            </p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {v.plate && <InfoRow label="Matrícula" value={v.plate} />}
          {v.purchaseDate && (
            <InfoRow
              label="Compra"
              value={new Date(v.purchaseDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          )}
          {v.purchasePrice != null && (
            <InfoRow label="Precio" value={`${formatNumber(v.purchasePrice)} €`} />
          )}
          <InfoRow label="Pago" value={PAYMENT_METHOD_LABELS[v.paymentMethod]} />
        </dl>
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Link
          to={`/vehicles/${v.id}`}
          className="flex-1 text-center py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
        >
          Ver detalle
        </Link>
        <Link
          to={`/vehicles/${v.id}/edit`}
          className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm transition-colors"
        >
          Editar
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd className="text-slate-700 font-medium truncate">{value}</dd>
    </div>
  );
}
