import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { MaintenanceRecord, MaintenanceType } from "../api/types";
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPES, formatNumber, inputClass } from "../constants";
import RecordAttachments from "./RecordAttachments";

const emptyForm = {
  date: "",
  type: "reparacion" as MaintenanceType,
  description: "",
  cost: "",
  workshop: "",
  mileage: "",
};

type RecordForm = typeof emptyForm;

function recordToForm(r: MaintenanceRecord): RecordForm {
  return {
    date: r.date.slice(0, 10),
    type: r.type,
    description: r.description,
    cost: r.cost != null ? String(r.cost) : "",
    workshop: r.workshop ?? "",
    mileage: r.mileage != null ? String(r.mileage) : "",
  };
}

function MaintenanceFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  error,
  submitLabel,
}: {
  form: RecordForm;
  setForm: (f: RecordForm) => void;
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
  const [form, setForm] = useState<RecordForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RecordForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const totalCost = records.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  function buildPayload(f: RecordForm) {
    return {
      date: f.date,
      type: f.type,
      description: f.description,
      cost: f.cost ? Number(f.cost) : undefined,
      workshop: f.workshop || undefined,
      mileage: f.mileage ? Number(f.mileage) : undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.maintenance.create(vehicleId, buildPayload(form));
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(r: MaintenanceRecord) {
    setShowForm(false);
    setEditingId(r.id);
    setEditForm(recordToForm(r));
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await api.maintenance.update(editingId, buildPayload(editForm));
      setEditingId(null);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro de mantenimiento?")) return;
    await api.maintenance.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Mantenimiento y reparaciones</h2>
          {totalCost > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Total: {formatNumber(totalCost)} €
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
        <MaintenanceFormFields
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={error}
          submitLabel="Guardar"
        />
      )}

      {records.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">Sin registros todavía.</p>
      )}

      <ul className="space-y-2">
        {records.map((r) =>
          editingId === r.id ? (
            <li key={r.id}>
              <MaintenanceFormFields
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
              className="rounded-lg border border-slate-200 bg-white overflow-hidden"
            >
              <div className="flex items-start justify-between p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {MAINTENANCE_TYPE_LABELS[r.type]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(r.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {r.mileage != null && (
                      <span className="text-xs text-slate-400">{formatNumber(r.mileage)} km</span>
                    )}
                    {r.cost != null && (
                      <span className="text-xs font-medium text-slate-700">
                        {formatNumber(r.cost)} €
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{r.description}</p>
                  {r.workshop && (
                    <p className="text-xs text-slate-500 mt-0.5">{r.workshop}</p>
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
              </div>
              {/* Adjuntos inline */}
              <div className="px-3 pb-3 border-t border-slate-100 pt-2">
                <RecordAttachments
                  documents={r.documents}
                  buttonLabel="+ Adjuntar documento"
                  onUpload={(file) => api.documents.uploadToMaintenance(r.id, file, file.name)}
                  onChange={onChange}
                />
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
