import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { MaintenanceType, VehicleWithDetails } from "../api/types";
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPES, inputClass } from "../constants";
import { useConfirm } from "../components/ConfirmDialog";
import RecordAttachments from "../components/RecordAttachments";

export default function MaintenanceRecordPage() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    type: "reparacion" as MaintenanceType,
    description: "",
    cost: "",
    workshop: "",
    mileage: "",
  });

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

  const record = vehicle?.maintenanceRecords.find((r) => r.id === recordId);

  useEffect(() => {
    if (!record) return;
    setForm({
      date: record.date.slice(0, 10),
      type: record.type,
      description: record.description,
      cost: record.cost != null ? String(record.cost) : "",
      workshop: record.workshop ?? "",
      mileage: record.mileage != null ? String(record.mileage) : "",
    });
  }, [record]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!recordId) return;
    setError(null);
    try {
      await api.maintenance.update(recordId, {
        date: form.date,
        type: form.type,
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
        workshop: form.workshop || undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete() {
    if (!recordId || !id) return;
    const ok = await confirmDialog({ message: "¿Eliminar este registro y su factura adjunta?", confirmLabel: "Eliminar" });
    if (!ok) return;
    await api.maintenance.remove(recordId);
    navigate(`/vehicles/${id}`);
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!vehicle) return <p className="text-slate-500">Cargando…</p>;
  if (!record) return <p className="text-slate-500">Registro no encontrado.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to={`/vehicles/${vehicle.id}`} className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Volver
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          {MAINTENANCE_TYPE_LABELS[record.type]} · {vehicle.alias}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="date"
            className={inputClass}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
          >
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {MAINTENANCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <input
          required
          placeholder="Descripción"
          className={inputClass}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Coste (€)"
            type="number"
            step="0.01"
            className={inputClass}
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
          />
          <input
            placeholder="Taller"
            className={inputClass}
            value={form.workshop}
            onChange={(e) => setForm({ ...form, workshop: e.target.value })}
          />
          <input
            placeholder="Km"
            type="number"
            className={inputClass}
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Guardar cambios
          </button>
          <button type="button" onClick={handleDelete} className="text-sm text-red-600">
            Eliminar registro
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Factura</h2>
        <RecordAttachments
          documents={record.documents}
          buttonLabel="+ Adjuntar factura"
          onUpload={(file) => api.documents.uploadToMaintenance(record.id, file, "Factura")}
          onChange={load}
        />
      </div>
    </div>
  );
}
