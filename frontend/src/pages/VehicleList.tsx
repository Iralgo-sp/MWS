import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Vehicle } from "../api/types";
import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "../constants";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vehicles
      .list()
      .then(setVehicles)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehículos</h1>
        <Link
          to="/vehicles/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
        >
          + Añadir vehículo
        </Link>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!vehicles && !error && <p className="text-slate-500">Cargando…</p>}
      {vehicles?.length === 0 && (
        <p className="text-slate-500">Todavía no hay vehículos. Añade el primero.</p>
      )}

      <ul className="space-y-2">
        {vehicles?.map((v) => (
          <li key={v.id}>
            <Link
              to={`/vehicles/${v.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{VEHICLE_TYPE_ICONS[v.type]}</span>
                <div>
                  <p className="font-medium">{v.alias}</p>
                  <p className="text-sm text-slate-500">
                    {VEHICLE_TYPE_LABELS[v.type]}
                    {v.brand ? ` · ${v.brand}` : ""}
                    {v.model ? ` ${v.model}` : ""}
                  </p>
                </div>
              </div>
              {v.status === "vendido" && (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Vendido
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
