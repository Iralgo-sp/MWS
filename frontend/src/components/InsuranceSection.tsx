import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { InsurancePolicy, InsuranceType } from "../api/types";
import { INSURANCE_TYPE_LABELS, INSURANCE_TYPES, formatNumber, inputClass } from "../constants";
import RecordAttachments from "./RecordAttachments";

const emptyForm = {
  company: "",
  policyNumber: "",
  type: "terceros" as InsuranceType,
  startDate: "",
  endDate: "",
  annualCost: "",
  notes: "",
};

type PolicyForm = typeof emptyForm;

function policyToForm(p: InsurancePolicy): PolicyForm {
  return {
    company: p.company,
    policyNumber: p.policyNumber,
    type: p.type,
    startDate: p.startDate.slice(0, 10),
    endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    annualCost: p.annualCost != null ? String(p.annualCost) : "",
    notes: p.notes ?? "",
  };
}

function PolicyFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  error,
  submitLabel,
}: {
  form: PolicyForm;
  setForm: (f: PolicyForm) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
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
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

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
  const [form, setForm] = useState<PolicyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PolicyForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function toPayload(f: PolicyForm) {
    return {
      company: f.company,
      policyNumber: f.policyNumber,
      type: f.type,
      startDate: f.startDate,
      endDate: f.endDate || undefined,
      annualCost: f.annualCost ? Number(f.annualCost) : undefined,
      notes: f.notes || undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.insurance.create(vehicleId, toPayload(form));
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(p: InsurancePolicy) {
    setShowForm(false);
    setEditingId(p.id);
    setEditForm(policyToForm(p));
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await api.insurance.update(editingId, toPayload(editForm));
      setEditingId(null);
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
          onClick={() => {
            setEditingId(null);
            setError(null);
            setShowForm((s) => !s);
          }}
          className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
        >
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {showForm && (
        <PolicyFormFields
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={error}
          submitLabel="Guardar"
        />
      )}

      {policies.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">Sin pólizas registradas.</p>
      )}

      <ul className="space-y-2">
        {policies.map((p) =>
          editingId === p.id ? (
            <li key={p.id}>
              <PolicyFormFields
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
                  {p.annualCost != null ? ` · ${formatNumber(p.annualCost)} €/año` : ""}
                </p>
                <RecordAttachments
                  documents={p.documents}
                  buttonLabel="+ Adjuntar póliza"
                  onUpload={(file) => api.documents.uploadToInsurance(p.id, file, "Póliza")}
                  onChange={onChange}
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => startEdit(p)} className="text-xs text-slate-600 underline dark:text-slate-400">
                  Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600">
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
