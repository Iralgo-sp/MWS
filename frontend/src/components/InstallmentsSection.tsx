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
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.installments.create(vehicleId, {
        paymentDate: form.paymentDate,
        installmentNumber: form.installmentNumber ? Number(form.installmentNumber) : undefined,
        principalAmount: form.principalAmount ? Number(form.principalAmount) : undefined,
        interestAmount: form.interestAmount ? Number(form.interestAmount) : undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
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
    if (!confirm("¿Eliminar esta cuota?")) return;
    await api.installments.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cuotas de la financiación</h2>
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
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Guardar
          </button>
        </form>
      )}

      {installments.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">Sin cuotas registradas todavía.</p>
      )}

      <ul className="space-y-2">
        {installments.map((i) => (
          <li
            key={i.id}
            className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="font-medium">
                {i.installmentNumber != null ? `Cuota ${i.installmentNumber} · ` : ""}
                {new Date(i.paymentDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500">
                {i.principalAmount != null ? `Base: ${formatNumber(i.principalAmount)} € · ` : ""}
                {i.interestAmount != null ? `Intereses: ${formatNumber(i.interestAmount)} € · ` : ""}
                {i.totalAmount != null ? `Total: ${formatNumber(i.totalAmount)} €` : ""}
              </p>
              {i.notes && <p className="text-slate-600 dark:text-slate-400">{i.notes}</p>}
            </div>
            <button onClick={() => handleDelete(i.id)} className="text-xs text-red-600">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
