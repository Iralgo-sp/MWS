import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { OdometerReading } from "../api/types";
import { formatNumber, inputClass } from "../constants";

const emptyForm = {
  date: "",
  mileage: "",
  notes: "",
};

type OdometerForm = typeof emptyForm;

function readingToForm(r: OdometerReading): OdometerForm {
  return {
    date: r.date.slice(0, 10),
    mileage: String(r.mileage),
    notes: r.notes ?? "",
  };
}

function OdometerFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  error,
  submitLabel,
}: {
  form: OdometerForm;
  setForm: (f: OdometerForm) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fecha</label>
          <input
            required
            type="date"
            className={inputClass}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Kilómetros</label>
          <input
            required
            placeholder="Lectura del odómetro"
            type="number"
            min="0"
            className={inputClass}
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: e.target.value })}
          />
        </div>
      </div>
      <input
        placeholder="Notas (opcional)"
        className={inputClass}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function OdometerSection({
  vehicleId,
  readings,
  onChange,
}: {
  vehicleId: string;
  readings: OdometerReading[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OdometerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OdometerForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  // readings is ordered by date desc — oldest is last
  const latestReading = readings[0];
  const oldestReading = readings[readings.length - 1];
  const totalRange =
    readings.length >= 2 ? latestReading.mileage - oldestReading.mileage : null;

  function buildPayload(f: OdometerForm) {
    return {
      date: f.date,
      mileage: Number(f.mileage),
      notes: f.notes || undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.odometer.create(vehicleId, buildPayload(form));
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(r: OdometerReading) {
    setShowForm(false);
    setEditingId(r.id);
    setEditForm(readingToForm(r));
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await api.odometer.update(editingId, buildPayload(editForm));
      setEditingId(null);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta lectura del odómetro?")) return;
    await api.odometer.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Kilometraje</h2>
          {readings.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {readings.length} {readings.length === 1 ? "lectura" : "lecturas"} ·{" "}
              Último odómetro: {formatNumber(latestReading.mileage)} km
              {totalRange != null && totalRange > 0 && (
                <> · Recorrido registrado: {formatNumber(totalRange)} km</>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setError(null);
            setShowForm((s) => !s);
          }}
          className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {showForm && (
        <OdometerFormFields
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={error}
          submitLabel="Guardar"
        />
      )}

      {readings.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Sin lecturas de odómetro todavía.
        </p>
      )}

      <ul className="space-y-2">
        {readings.map((r) =>
          editingId === r.id ? (
            <li key={r.id}>
              <OdometerFormFields
                form={editForm}
                setForm={setEditForm}
                onSubmit={handleUpdate}
                onCancel={() => setEditingId(null)}
                error={error}
                submitLabel="Guardar cambios"
              />
            </li>
          ) : (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-slate-800 tabular-nums">
                    {formatNumber(r.mileage)} km
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {r.notes && (
                  <p className="text-xs text-slate-500 italic">{r.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => startEdit(r)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
