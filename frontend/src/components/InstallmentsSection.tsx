import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Installment } from "../api/types";
import { formatNumber, inputClass } from "../constants";

const emptyForm = {
  paymentDate: "",
  installmentNumber: "",
  principalAmount: "",
  interestAmount: "",
  totalAmount: "",
  notes: "",
};

type InstallmentForm = typeof emptyForm;

function installmentToForm(i: Installment): InstallmentForm {
  return {
    paymentDate: i.paymentDate.slice(0, 10),
    installmentNumber: i.installmentNumber != null ? String(i.installmentNumber) : "",
    principalAmount: i.principalAmount != null ? String(i.principalAmount) : "",
    interestAmount: i.interestAmount != null ? String(i.interestAmount) : "",
    totalAmount: i.totalAmount != null ? String(i.totalAmount) : "",
    notes: i.notes ?? "",
  };
}

function InstallmentFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  error,
  submitLabel,
}: {
  form: InstallmentForm;
  setForm: (f: InstallmentForm) => void;
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
          value={form.paymentDate}
          onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
        />
        <input
          placeholder="Nº cuota"
          type="number"
          className={inputClass}
          value={form.installmentNumber}
          onChange={(e) => setForm({ ...form, installmentNumber: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          placeholder="Base (€)"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.principalAmount}
          onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
        />
        <input
          placeholder="Intereses (€)"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.interestAmount}
          onChange={(e) => setForm({ ...form, interestAmount: e.target.value })}
        />
        <input
          placeholder="Total (€)"
          type="number"
          step="0.01"
          className={inputClass}
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
        />
      </div>
      <input
        placeholder="Notas"
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

export default function InstallmentsSection({
  vehicleId,
  installments,
  onChange,
}: {
  vehicleId: string;
  installments: Installment[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InstallmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InstallmentForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const totalPaid = installments.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
  const totalInterest = installments.reduce((sum, i) => sum + (i.interestAmount ?? 0), 0);

  function buildPayload(f: InstallmentForm) {
    return {
      paymentDate: f.paymentDate,
      installmentNumber: f.installmentNumber ? Number(f.installmentNumber) : undefined,
      principalAmount: f.principalAmount ? Number(f.principalAmount) : undefined,
      interestAmount: f.interestAmount ? Number(f.interestAmount) : undefined,
      totalAmount: f.totalAmount ? Number(f.totalAmount) : undefined,
      notes: f.notes || undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.installments.create(vehicleId, buildPayload(form));
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(i: Installment) {
    setShowForm(false);
    setEditingId(i.id);
    setEditForm(installmentToForm(i));
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await api.installments.update(editingId, buildPayload(editForm));
      setEditingId(null);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuota?")) return;
    await api.installments.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Cuotas de la financiación</h2>
          {installments.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {installments.length} cuotas · Total pagado: {formatNumber(totalPaid)} €
              {totalInterest > 0 && ` · Intereses: ${formatNumber(totalInterest)} €`}
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
        <InstallmentFormFields
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={error}
          submitLabel="Guardar"
        />
      )}

      {installments.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">Sin cuotas registradas todavía.</p>
      )}

      <ul className="space-y-2">
        {installments.map((i) =>
          editingId === i.id ? (
            <li key={i.id}>
              <InstallmentFormFields
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
              key={i.id}
              className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {i.installmentNumber != null ? `Cuota ${i.installmentNumber} · ` : ""}
                  {new Date(i.paymentDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {i.principalAmount != null ? `Base: ${formatNumber(i.principalAmount)} €` : ""}
                  {i.interestAmount != null ? ` · Intereses: ${formatNumber(i.interestAmount)} €` : ""}
                  {i.totalAmount != null ? ` · Total: ${formatNumber(i.totalAmount)} €` : ""}
                </p>
                {i.notes && <p className="text-xs text-slate-400 mt-0.5">{i.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-2 ml-3">
                <button
                  onClick={() => startEdit(i)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(i.id)}
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
