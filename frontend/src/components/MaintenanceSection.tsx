import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { MaintenanceRecord, MaintenanceType } from "../api/types";
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPES, formatNumber, inputClass } from "../constants";

const emptyForm = {
  date: "",
  type: "reparacion" as MaintenanceType,
  description: "",
  cost: "",
  workshop: "",
  mileage: "",
};

export default function MaintenanceSection({
  vehicleId,
  records,
  onChange,
}: {
  vehicleId: string;
  records: MaintenanceRecord[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.maintenance.create(vehicleId, {
        date: form.date,
        type: form.type,
        description: form.description,
        cost: form.cost ? Number(form.cost) : undefined,
        workshop: form.workshop || undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mantenimiento y reparaciones</h2>
          {totalCost > 0 && (
            <p className="text-sm text-slate-500">Total gastado: {formatNumber(totalCost)} €</p>
          )}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
        >
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {showForm && (
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
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Guardar
          </button>
        </form>
      )}

      {records.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">Sin registros todavía.</p>
      )}

      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id}>
            <Link
              to={`/vehicles/${vehicleId}/maintenance/${r.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <div>
                <p className="font-medium">
                  {MAINTENANCE_TYPE_LABELS[r.type]} · {new Date(r.date).toLocaleDateString()}
                </p>
                {r.workshop && <p className="text-slate-600 dark:text-slate-400">{r.workshop}</p>}
              </div>
              <span className="text-slate-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
