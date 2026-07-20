import { useEffect, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { PaymentMethod, VehicleStatus, VehicleType } from "../api/types";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  inputClass,
} from "../constants";

const emptyForm = {
  type: "coche" as VehicleType,
  alias: "",
  brand: "",
  model: "",
  year: "",
  plate: "",
  purchaseDate: "",
  purchasePrice: "",
  notes: "",
  status: "activo" as VehicleStatus,
  dealerName: "",
  dealerAddress: "",
  dealerAgent: "",
  paymentMethod: "contado" as PaymentMethod,
  financingLender: "",
  financingAmount: "",
  financingInterestRate: "",
  financingTermMonths: "",
  financingNotes: "",
};

export default function VehicleForm({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && id) {
      api.vehicles
        .get(id)
        .then((v) => {
          setForm({
            type: v.type,
            alias: v.alias,
            brand: v.brand ?? "",
            model: v.model ?? "",
            year: v.year?.toString() ?? "",
            plate: v.plate ?? "",
            purchaseDate: v.purchaseDate ? v.purchaseDate.slice(0, 10) : "",
            purchasePrice: v.purchasePrice?.toString() ?? "",
            notes: v.notes ?? "",
            status: v.status,
            dealerName: v.dealerName ?? "",
            dealerAddress: v.dealerAddress ?? "",
            dealerAgent: v.dealerAgent ?? "",
            paymentMethod: v.paymentMethod,
            financingLender: v.financingLender ?? "",
            financingAmount: v.financingAmount?.toString() ?? "",
            financingInterestRate: v.financingInterestRate?.toString() ?? "",
            financingTermMonths: v.financingTermMonths?.toString() ?? "",
            financingNotes: v.financingNotes ?? "",
          });
          setLoading(false);
        })
        .catch((e: Error) => {
          setError(e.message);
          setLoading(false);
        });
    }
  }, [mode, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const financed = form.paymentMethod === "financiado";
    const payload = {
      type: form.type,
      alias: form.alias,
      brand: form.brand || undefined,
      model: form.model || undefined,
      year: form.year ? Number(form.year) : undefined,
      plate: form.plate || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      notes: form.notes || undefined,
      status: form.status,
      dealerName: form.dealerName || undefined,
      dealerAddress: form.dealerAddress || undefined,
      dealerAgent: form.dealerAgent || undefined,
      paymentMethod: form.paymentMethod,
      financingLender: financed ? form.financingLender || undefined : undefined,
      financingAmount: financed && form.financingAmount ? Number(form.financingAmount) : undefined,
      financingInterestRate:
        financed && form.financingInterestRate ? Number(form.financingInterestRate) : undefined,
      financingTermMonths:
        financed && form.financingTermMonths ? Number(form.financingTermMonths) : undefined,
      financingNotes: financed ? form.financingNotes || undefined : undefined,
    };
    try {
      if (mode === "create") {
        const created = await api.vehicles.create(payload);
        navigate(`/vehicles/${created.id}`);
      } else if (id) {
        await api.vehicles.update(id, payload);
        navigate(`/vehicles/${id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Cargando…</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">
        {mode === "create" ? "Nuevo vehículo" : "Editar vehículo"}
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="Tipo">
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {VEHICLE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Alias / nombre *">
        <input
          className={inputClass}
          required
          value={form.alias}
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
          placeholder="p.ej. Coche familiar"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca">
          <input
            className={inputClass}
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </Field>
        <Field label="Modelo">
          <input
            className={inputClass}
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Año">
          <input
            className={inputClass}
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </Field>
        <Field label="Matrícula / bastidor">
          <input
            className={inputClass}
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de compra">
          <input
            className={inputClass}
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="Precio de compra (€)">
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
          />
        </Field>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold">Concesionario</legend>
        <Field label="Nombre del concesionario">
          <input
            className={inputClass}
            value={form.dealerName}
            onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
          />
        </Field>
        <Field label="Dirección">
          <input
            className={inputClass}
            value={form.dealerAddress}
            onChange={(e) => setForm({ ...form, dealerAddress: e.target.value })}
          />
        </Field>
        <Field label="Agente / comercial">
          <input
            className={inputClass}
            value={form.dealerAgent}
            onChange={(e) => setForm({ ...form, dealerAgent: e.target.value })}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold">Forma de pago</legend>
        <Field label="Forma de pago">
          <select
            className={inputClass}
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>

        {form.paymentMethod === "financiado" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Entidad financiera">
                <input
                  className={inputClass}
                  value={form.financingLender}
                  onChange={(e) => setForm({ ...form, financingLender: e.target.value })}
                />
              </Field>
              <Field label="Importe financiado (€)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  value={form.financingAmount}
                  onChange={(e) => setForm({ ...form, financingAmount: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Interés (%)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  value={form.financingInterestRate}
                  onChange={(e) => setForm({ ...form, financingInterestRate: e.target.value })}
                />
              </Field>
              <Field label="Plazo (meses)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.financingTermMonths}
                  onChange={(e) => setForm({ ...form, financingTermMonths: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notas de la financiación">
              <textarea
                className={inputClass}
                rows={2}
                value={form.financingNotes}
                onChange={(e) => setForm({ ...form, financingNotes: e.target.value })}
              />
            </Field>
            <p className="text-xs text-slate-500">
              Los pagos de cada cuota (base e intereses) se registran desde el detalle del
              vehículo, una vez creado.
            </p>
          </>
        )}
      </fieldset>

      <Field label="Estado">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
        >
          <option value="activo">Activo</option>
          <option value="vendido">Vendido</option>
        </select>
      </Field>

      <Field label="Notas">
        <textarea
          className={inputClass}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
