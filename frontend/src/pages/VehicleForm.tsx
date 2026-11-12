import { useEffect, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { PaymentMethod, VehicleStatus, VehicleType } from "../api/types";
import {
  formatNumber,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  inputClass,
} from "../constants";
import { useConfirm } from "../components/ConfirmDialog";

function fmtPrice(n: number | null | undefined): string {
  return n != null ? formatNumber(n) : "";
}
function parsePrice(s: string): number | undefined {
  if (!s) return undefined;
  const clean = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? undefined : n;
}

const emptyForm = {
  type: "coche" as VehicleType,
  alias: "",
  brand: "",
  model: "",
  year: "",
  plate: "",
  chassis: "",
  color: "",
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
  nextItv: "",
  serviceIntervalKm: "",
};

export default function VehicleForm({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [originalStatus, setOriginalStatus] = useState<VehicleStatus | null>(null);

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
            chassis: v.chassis ?? "",
            color: v.color ?? "",
            purchaseDate: v.purchaseDate ? v.purchaseDate.slice(0, 10) : "",
            purchasePrice: fmtPrice(v.purchasePrice),
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
            nextItv: v.nextItv ? v.nextItv.slice(0, 10) : "",
            serviceIntervalKm: v.serviceIntervalKm?.toString() ?? "",
          });
          setOriginalStatus(v.status);
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
      brand: form.brand || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      plate: form.plate || null,
      chassis: form.chassis || null,
      color: form.color || null,
      purchaseDate: form.purchaseDate || null,
      purchasePrice: parsePrice(form.purchasePrice) ?? null,
      notes: form.notes || null,
      status: form.status,
      dealerName: form.dealerName || null,
      dealerAddress: form.dealerAddress || null,
      dealerAgent: form.dealerAgent || null,
      paymentMethod: form.paymentMethod,
      financingLender: financed ? form.financingLender || null : null,
      financingAmount: financed && form.financingAmount ? Number(form.financingAmount) : null,
      financingInterestRate:
        financed && form.financingInterestRate ? Number(form.financingInterestRate) : null,
      financingTermMonths:
        financed && form.financingTermMonths ? Number(form.financingTermMonths) : null,
      financingNotes: financed ? form.financingNotes || null : null,
      nextItv: form.nextItv || null,
      serviceIntervalKm: form.serviceIntervalKm ? Number(form.serviceIntervalKm) : null,
    };
    try {
      if (mode === "create") {
        const created = await api.vehicles.create(payload);
        navigate(`/vehicles/${created.id}`);
      } else if (id) {
        await api.vehicles.update(id, payload);
        const justSold = originalStatus === "activo" && form.status === "vendido";
        const wantsExport =
          justSold &&
          (await confirmDialog({
            title: "Vehículo marcado como vendido",
            message: "¿Quieres generar ahora el expediente en PDF para el comprador?",
            confirmLabel: "Generar expediente",
            cancelLabel: "Ahora no",
            danger: false,
          }));
        navigate(wantsExport ? `/vehicles/${id}/export` : `/vehicles/${id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="p-6 text-slate-500">Cargando…</p>;

  return (
    <form onSubmit={handleSubmit} className="min-h-full bg-slate-50">
      {/* ── Sticky page header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-slate-900">
          {mode === "create" ? "Nuevo vehículo" : "Editar vehículo"}
        </h1>
        {error && (
          <p className="text-sm text-red-600 ml-2">{error}</p>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* ── Form sections ─────────────────────────────────────────────── */}
      <div className="px-6 py-6 space-y-4 max-w-5xl mx-auto">

        {/* Identificación */}
        <FormSection title="Identificación">
          <div className="grid grid-cols-4 gap-4">
            <Field label="Tipo">
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <div className="col-span-3">
              <Field label="Alias / nombre *">
                <input
                  className={inputClass}
                  required
                  value={form.alias}
                  placeholder="p.ej. Coche familiar"
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-2">
              <Field label="Marca">
                <input className={inputClass} value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Modelo">
                <input className={inputClass} value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="Año">
                <input className={inputClass} type="text" inputMode="numeric" maxLength={4} placeholder="2026" value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Color">
                <input className={inputClass} value={form.color} placeholder="p.ej. Blanco perla"
                  onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Matrícula">
                <input className={inputClass} value={form.plate} placeholder="1234 ABC"
                  onChange={(e) => setForm({ ...form, plate: e.target.value })} />
              </Field>
            </div>
            <div className="col-span-3">
              <Field label="Bastidor / VIN">
                <input className={inputClass} value={form.chassis} placeholder="17 caracteres VIN"
                  onChange={(e) => setForm({ ...form, chassis: e.target.value })} />
              </Field>
            </div>
          </div>
        </FormSection>

        {/* Adquisición */}
        <FormSection title="Adquisición">
          <div className="grid grid-cols-3 gap-4">
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
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              />
            </Field>
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
          </div>
        </FormSection>

        {/* Concesionario */}
        <FormSection title="Concesionario">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Nombre del concesionario">
              <input
                className={inputClass}
                value={form.dealerName}
                onChange={(e) => setForm({ ...form, dealerName: e.target.value })}
              />
            </Field>
            <Field label="Agente / comercial">
              <input
                className={inputClass}
                value={form.dealerAgent}
                onChange={(e) => setForm({ ...form, dealerAgent: e.target.value })}
              />
            </Field>
            <Field label="Dirección">
              <input
                className={inputClass}
                value={form.dealerAddress}
                onChange={(e) => setForm({ ...form, dealerAddress: e.target.value })}
              />
            </Field>
          </div>
        </FormSection>

        {/* Financiación */}
        <FormSection title="Financiación">
          <Field label="Forma de pago">
            <select
              className={inputClass}
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </select>
          </Field>

          {form.paymentMethod === "financiado" && (
            <div className="mt-4 space-y-4">
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
                <Field label="Interés TIN (%)">
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
              <p className="text-xs text-slate-400">
                Las cuotas se registran desde el detalle del vehículo, una vez guardado.
              </p>
            </div>
          )}
        </FormSection>

        {/* Recordatorios */}
        <FormSection title="Recordatorios proactivos">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Próxima ITV">
              <input
                className={inputClass}
                type="date"
                value={form.nextItv}
                onChange={(e) => setForm({ ...form, nextItv: e.target.value })}
              />
            </Field>
            <Field label="Revisión cada (km)">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1000"
                placeholder="p.ej. 15000"
                value={form.serviceIntervalKm}
                onChange={(e) => setForm({ ...form, serviceIntervalKm: e.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Se mostrarán alertas en el panel cuando la ITV se acerque o se supere el intervalo de km.
          </p>
        </FormSection>

        {/* Notas */}
        <FormSection title="Notas">
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Observaciones generales del vehículo…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FormSection>

      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
