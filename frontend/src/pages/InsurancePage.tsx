import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleWithDetails } from "../api/types";
import InsuranceSection from "../components/InsuranceSection";

export default function InsurancePage() {
  const { id } = useParams<{ id: string }>();
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!vehicle) return <p className="text-slate-500">Cargando…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={`/vehicles/${vehicle.id}`} className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Volver
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Seguros · {vehicle.alias}</h1>
      </div>

      <InsuranceSection vehicleId={vehicle.id} policies={vehicle.insurancePolicies} onChange={load} />
    </div>
  );
}
