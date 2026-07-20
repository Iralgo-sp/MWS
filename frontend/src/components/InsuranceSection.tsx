import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { InsurancePolicy, InsuranceType } from "../api/types";
import { INSURANCE_TYPE_LABELS, INSURANCE_TYPES, inputClass } from "../constants";

const emptyForm = {
  company: "",
  policyNumber: "",
  type: "terceros" as InsuranceType,
  startDate: "",
  endDate: "",
  annualCost: "",
  notes: "",
};

export default function InsuranceSection({
  vehicleId,
  policies,
  onChange,
}: {
  vehicleId: string;
  policies: InsurancePolicy[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.insurance.create(vehicleId, {
        company: form.company,
        policyNumber: form.policyNumber,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        annualCost: form.annualCost ? Number(form.annualCost) : undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta póliza?")) return;
    await api.insurance.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Seguros</h2>
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
              placeholder="Compañía"
              className={inputClass}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <input
              required
              placeholder="Nº de póliza"
              className={inputClass}
              value={form.policyNumber}
              onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
            />
          </div>
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as InsuranceType })}
          >
            {INSURANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {INSURANCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm text-slate-600 dark:text-slate-400">
              Inicio
              <input
                required
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm text-slate-600 dark:text-slate-400">
              Fin
              <input
                type="date"
                className={inputClass}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
          </div>
          <input
            placeholder="Coste anual (€)"
            type="number"
            step="0.01"
            className={inputClass}
            value={form.annualCost}
            onChange={(e) => setForm({ ...form, annualCost: e.target.value })}
          />
          <textarea
            placeholder="Notas"
            className={inputClass}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Guardar
          </button>
        </form>
      )}

      {policies.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">Sin pólizas registradas.</p>
      )}

      <ul className="space-y-2">
        {policies.map((p) => (
          <li
            key={p.id}
            className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="font-medium">
                {p.company} · {INSURANCE_TYPE_LABELS[p.type]}
              </p>
              <p className="text-slate-600 dark:text-slate-400">Póliza {p.policyNumber}</p>
              <p className="text-xs text-slate-500">
                {new Date(p.startDate).toLocaleDateString()} –{" "}
                {p.endDate ? new Date(p.endDate).toLocaleDateString() : "sin fecha fin"}
                {p.annualCost != null ? ` · ${p.annualCost} €/año` : ""}
              </p>
            </div>
            <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
