import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { InsurancePolicy, InsuranceType } from "../api/types";
import {
  INSURANCE_STATUS_LABELS,
  INSURANCE_TYPE_LABELS,
  INSURANCE_TYPES,
  formatNumber,
  inputClass,
} from "../constants";
import RecordAttachments from "./RecordAttachments";

const emptyForm = {
  year: new Date().getFullYear().toString(),
  company: "",
  policyNumber: "",
  type: "terceros" as InsuranceType,
  startDate: "",
  endDate: "",
  annualCost: "",
  hasFranchise: false,
  franchiseAmount: "",
  notes: "",
};

type PolicyForm = typeof emptyForm;

function policyToForm(p: InsurancePolicy): PolicyForm {
  return {
    year: p.year.toString(),
    company: p.company,
    policyNumber: p.policyNumber,
    type: p.type,
    startDate: p.startDate.slice(0, 10),
    endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    annualCost: p.annualCost != null ? String(p.annualCost) : "",
    hasFranchise: p.hasFranchise,
    franchiseAmount: p.franchiseAmount != null ? String(p.franchiseAmount) : "",
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
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Año</label>
          <input
            required
            type="number"
            className={inputClass}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Compañía *</label>
          <input
            required
            placeholder="Mapfre, Axa…"
            className={inputClass}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº póliza</label>
          <input
            placeholder="Dejar vacío en presupuesto"
            className={inputClass}
            value={form.policyNumber}
            onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de seguro *</label>
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as InsuranceType })}
          >
            {INSURANCE_TYPES.map((t) => (
              <option key={t} value={t}>{INSURANCE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Prima anual (€)</label>
          <input
            placeholder="0,00"
            type="number"
            step="0.01"
            className={inputClass}
            value={form.annualCost}
            onChange={(e) => setForm({ ...form, annualCost: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Inicio vigencia *</label>
          <input
            required
            type="date"
            className={inputClass}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fin vigencia</label>
          <input
            type="date"
            className={inputClass}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>
      {/* Franquicia — solo visible cuando tipo es todo_riesgo */}
      {form.type === "todo_riesgo" && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-teal-600"
              checked={form.hasFranchise}
              onChange={(e) => setForm({ ...form, hasFranchise: e.target.checked, franchiseAmount: e.target.checked ? form.franchiseAmount : "" })}
            />
            <span className="text-sm font-medium text-slate-700">Con franquicia</span>
          </label>
          {form.hasFranchise && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Importe franquicia (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className={inputClass}
                value={form.franchiseAmount}
                onChange={(e) => setForm({ ...form, franchiseAmount: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
        <textarea
          placeholder="Coberturas adicionales…"
          className={inputClass}
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
  const [newForm, setNewForm] = useState<PolicyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PolicyForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function toPayload(f: PolicyForm) {
    return {
      year: Number(f.year),
      company: f.company,
      policyNumber: f.policyNumber,
      type: f.type,
      startDate: f.startDate,
      endDate: f.endDate || undefined,
      annualCost: f.annualCost ? Number(f.annualCost) : undefined,
      hasFranchise: f.type === "todo_riesgo" ? f.hasFranchise : false,
      franchiseAmount: f.type === "todo_riesgo" && f.hasFranchise && f.franchiseAmount
        ? Number(f.franchiseAmount)
        : undefined,
      notes: f.notes || undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.insurance.create(vehicleId, toPayload(newForm));
      setNewForm(emptyForm);
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

  async function handleSelect(id: string) {
    try {
      await api.insurance.select(id);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleCopyToNextYear(id: string) {
    try {
      await api.insurance.copyToNextYear(id);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este presupuesto/póliza?")) return;
    await api.insurance.remove(id);
    onChange();
  }

  // Group by year descending
  const years = [...new Set(policies.map((p) => p.year))].sort((a, b) => b - a);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Seguros</h2>
          {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setError(null);
            setShowForm((s) => !s);
          }}
          className="text-sm font-medium text-teal-600 hover:text-teal-500"
        >
          {showForm ? "Cancelar" : "+ Añadir presupuesto"}
        </button>
      </div>

      {showForm && (
        <PolicyFormFields
          form={newForm}
          setForm={setNewForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={null}
          submitLabel="Guardar"
        />
      )}

      {policies.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">Sin seguros registrados todavía.</p>
      )}

      {/* Year groups */}
      {years.map((year) => {
        const yearPolicies = policies.filter((p) => p.year === year);
        const selected = yearPolicies.find((p) => p.isSelected);
        return (
          <div key={year} className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Year header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">{year}</span>
              <div className="flex items-center gap-3">
                {selected && (
                  <span className="text-xs text-teal-700 font-medium">
                    Activa: {selected.company}
                    {selected.annualCost != null ? ` · ${formatNumber(selected.annualCost)} €/año` : ""}
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setNewForm({ ...emptyForm, year: year.toString() });
                    setShowForm(true);
                  }}
                  className="text-xs text-teal-600 hover:text-teal-500 font-medium"
                >
                  + Presupuesto
                </button>
                {selected && (
                  <button
                    onClick={() => handleCopyToNextYear(selected.id)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    title={`Copiar a ${year + 1}`}
                  >
                    Copiar a {year + 1} →
                  </button>
                )}
              </div>
            </div>

            {/* Quotes list */}
            <ul className="divide-y divide-slate-100 bg-white">
              {yearPolicies.map((p) =>
                editingId === p.id ? (
                  <li key={p.id} className="p-4">
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
                  <li key={p.id} className={`flex items-start justify-between p-3.5 text-sm ${p.isSelected ? "bg-teal-50" : ""}`}>
                    <div className="flex gap-2.5 items-start min-w-0">
                      {/* Status indicator */}
                      <div className="mt-0.5 shrink-0">
                        {p.isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                            ✓ Activa
                          </span>
                        ) : (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                            p.status === "descartada"
                              ? "bg-slate-100 text-slate-400"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {INSURANCE_STATUS_LABELS[p.status as keyof typeof INSURANCE_STATUS_LABELS] ?? p.status}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          {p.company}
                          {p.policyNumber ? <span className="text-slate-400 font-normal"> · {p.policyNumber}</span> : null}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {INSURANCE_TYPE_LABELS[p.type]}
                          {p.type === "todo_riesgo" && (
                            <span className={`ml-1 ${p.hasFranchise ? "text-amber-600" : "text-slate-400"}`}>
                              {p.hasFranchise
                                ? `· Franquicia: ${p.franchiseAmount != null ? formatNumber(p.franchiseAmount) + " €" : "sí"}`
                                : "· Sin franquicia"}
                            </span>
                          )}
                          {p.annualCost != null ? ` · ${formatNumber(p.annualCost)} €/año` : ""}
                          {" · "}{new Date(p.startDate).toLocaleDateString("es-ES")}
                          {p.endDate ? ` – ${new Date(p.endDate).toLocaleDateString("es-ES")}` : ""}
                        </p>
                        {p.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{p.notes}</p>}
                        <RecordAttachments
                          documents={p.documents}
                          buttonLabel="+ Adjuntar póliza"
                          onUpload={(file) => api.documents.uploadToInsurance(p.id, file, "Póliza")}
                          onChange={onChange}
                        />
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex shrink-0 gap-2 ml-3 mt-0.5 items-center">
                      {!p.isSelected && (
                        <button
                          onClick={() => handleSelect(p.id)}
                          className="text-xs font-medium text-teal-600 hover:text-teal-500"
                        >
                          Seleccionar
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
