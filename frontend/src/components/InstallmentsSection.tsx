import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useConfirm } from "./ConfirmDialog";
import type { Installment } from "../api/types";
import {
  PAYMENT_CONCEPTS,
  PAYMENT_CONCEPT_LABELS,
  type PaymentConcept,
  formatNumber,
  inputClass,
} from "../constants";

function parseSpanish(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// ── Amortization helpers ────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface AmortRow {
  installmentNumber: number;
  paymentDate: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
  concept: "cuota" | "pago_final";
}

// `balloon` > 0 models a VFG/PCP-style loan: the regular cuotas only amortize the
// principal down to the balloon (not to 0), and a separate final lump-sum payment
// (concept "pago_final") settles the rest one month after the last cuota.
function computeAmortization(
  principal: number,
  annualRatePct: number,
  months: number,
  firstPaymentDate: string,
  balloon = 0
): AmortRow[] {
  const r = annualRatePct / 100 / 12;
  const first = new Date(firstPaymentDate);
  const rows: AmortRow[] = [];
  let balance = principal;

  const monthlyPayment =
    r === 0
      ? (principal - balloon) / months
      : ((principal - balloon / Math.pow(1 + r, months)) * r) / (1 - Math.pow(1 + r, -months));

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const principalPart = monthlyPayment - interest;
    balance = i === months ? balloon : balance - principalPart;
    rows.push({
      installmentNumber: i,
      paymentDate: toDateString(addMonths(first, i - 1)),
      totalAmount: Math.round(monthlyPayment * 100) / 100,
      principalAmount: Math.round(principalPart * 100) / 100,
      interestAmount: Math.round(interest * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
      concept: "cuota",
    });
  }

  if (balloon > 0) {
    rows.push({
      installmentNumber: months + 1,
      paymentDate: toDateString(addMonths(first, months)),
      totalAmount: Math.round(balloon * 100) / 100,
      principalAmount: Math.round(balloon * 100) / 100,
      interestAmount: 0,
      remainingBalance: 0,
      concept: "pago_final",
    });
  }

  return rows;
}

// ── Simple payment form ─────────────────────────────────────────────────────

const emptySimple = { paymentDate: "", concept: "entrada" as PaymentConcept, totalAmount: "", notes: "" };

function SimplePaymentForm({
  onSave,
  onCancel,
  error,
}: {
  onSave: (data: typeof emptySimple) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}) {
  const [form, setForm] = useState(emptySimple);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSave(form);
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Concepto</label>
          <select
            className={inputClass}
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value as PaymentConcept })}
          >
            {PAYMENT_CONCEPTS.map((c) => (
              <option key={c} value={c}>{PAYMENT_CONCEPT_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fecha *</label>
          <input required type="date" className={inputClass} value={form.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Importe (€) *</label>
          <input required type="number" step="0.01" placeholder="0,00" className={inputClass}
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
        <input className={inputClass} placeholder="Opcional" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors">Guardar</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
      </div>
    </form>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function InstallmentsSection({
  vehicleId,
  installments,
  onChange,
  paymentMethod,
  purchasePrice,
  purchaseDate,
  financingAmount,
  financingInterestRate,
  financingTermMonths,
}: {
  vehicleId: string;
  installments: Installment[];
  onChange: () => void;
  paymentMethod: string;
  purchasePrice?: number;
  purchaseDate?: string;
  financingAmount?: number;
  financingInterestRate?: number;
  financingTermMonths?: number;
}) {
  const [mode, setMode] = useState<"simple" | "financiado">(
    paymentMethod === "financiado" ? "financiado" : "simple"
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const confirmDialog = useConfirm();

  // Amortization generator state
  const [genPrincipal, setGenPrincipal] = useState(financingAmount != null ? formatNumber(financingAmount) : "");
  const [genRate, setGenRate] = useState(financingInterestRate?.toString() ?? "");
  const [genMonths, setGenMonths] = useState(financingTermMonths?.toString() ?? "");
  const [genFirstDate, setGenFirstDate] = useState("");
  const [genBalloon, setGenBalloon] = useState("");
  const [genPreview, setGenPreview] = useState<AmortRow[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Default the first-payment date from the "entrada" payment, or failing that the
  // purchase date, so "⚡ Generar tabla" works without the user typing a date first.
  useEffect(() => {
    if (genFirstDate) return;
    const entrada = installments.find((i) => i.concept === "entrada");
    const fallback = entrada?.paymentDate ?? purchaseDate;
    if (fallback) setGenFirstDate(fallback.slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments, purchaseDate]);

  // Inline date editing for cuota rows
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState("");

  const cuotas = installments.filter((i) => i.concept === "cuota");
  // A generated balloon/VFG payment carries installmentNumber (months+1); a manually
  // added "pago_final" entry never does, so it still belongs in extraPayments below.
  const generatedFinalPayment = installments.find(
    (i) => i.concept === "pago_final" && i.installmentNumber != null
  );
  const scheduleRows = generatedFinalPayment ? [...cuotas, generatedFinalPayment] : cuotas;
  const extraPayments = installments.filter(
    (i) => i.concept !== "cuota" && i.id !== generatedFinalPayment?.id
  );
  const totalPaid = installments.filter((i) => i.isPaid).reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalScheduledPending = installments.filter((i) => !i.isPaid).reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const remainingDebt = purchasePrice != null ? Math.max(0, purchasePrice - totalPaid) : null;

  async function handleAddSimple(form: typeof emptySimple) {
    setAddError(null);
    try {
      await api.installments.create(vehicleId, {
        paymentDate: form.paymentDate,
        concept: form.concept,
        isPaid: true,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        notes: form.notes || undefined,
      });
      setShowAddForm(false);
      onChange();
    } catch (e) {
      setAddError((e as Error).message);
    }
  }

  function previewAmortization() {
    setGenError(null);
    const p = parseSpanish(genPrincipal);
    const r = parseSpanish(genRate);
    const n = Number(genMonths);
    const balloon = genBalloon ? parseSpanish(genBalloon) : 0;
    if (!p || p <= 0) return setGenError("Indica el importe financiado");
    if (r < 0) return setGenError("El interés no puede ser negativo");
    if (!n || n <= 0 || !Number.isInteger(n)) return setGenError("El plazo debe ser un número entero de meses");
    if (!genFirstDate) return setGenError("Indica la fecha del primer pago");
    if (balloon < 0) return setGenError("La cuota final no puede ser negativa");
    if (balloon >= p) return setGenError("La cuota final debe ser menor que el importe financiado");
    setGenPreview(computeAmortization(p, r, n, genFirstDate, balloon));
  }

  async function confirmGenerate() {
    if (!genPreview) return;
    setGenerating(true);
    setGenError(null);
    try {
      // Remove any previously generated schedule first (regular cuotas + its balloon, if any)
      const existingCount = cuotas.length + (generatedFinalPayment ? 1 : 0);
      if (existingCount > 0) {
        const ok = await confirmDialog({
          message: `Se eliminarán las ${existingCount} cuotas existentes y se generará la nueva tabla. ¿Continuar?`,
          confirmLabel: "Regenerar",
        });
        if (!ok) {
          setGenerating(false);
          return;
        }
        await api.installments.deleteAllCuotas(vehicleId);
        if (generatedFinalPayment) await api.installments.remove(generatedFinalPayment.id);
      }
      await api.installments.batchCreate(
        vehicleId,
        genPreview.map((r) => ({
          paymentDate: r.paymentDate,
          concept: r.concept,
          installmentNumber: r.installmentNumber,
          principalAmount: r.principalAmount,
          interestAmount: r.interestAmount,
          totalAmount: r.totalAmount,
          remainingBalance: r.remainingBalance,
          isPaid: false,
        }))
      );
      setGenPreview(null);
      onChange();
    } catch (e) {
      setGenError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function togglePaid(i: Installment) {
    await api.installments.update(i.id, { isPaid: !i.isPaid });
    onChange();
  }

  async function handleDateEdit(i: Installment) {
    if (!editDateValue) return;
    await api.installments.update(i.id, { paymentDate: editDateValue });
    setEditingDateId(null);
    onChange();
  }

  async function handleDelete(id: string) {
    if (!(await confirmDialog({ message: "¿Eliminar este pago?", confirmLabel: "Eliminar" }))) return;
    await api.installments.remove(id);
    onChange();
  }

  async function handleDeleteAllCuotas() {
    const total = cuotas.length + (generatedFinalPayment ? 1 : 0);
    const ok = await confirmDialog({
      message: `¿Eliminar las ${total} cuotas generadas? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar tabla",
    });
    if (!ok) return;
    await api.installments.deleteAllCuotas(vehicleId);
    if (generatedFinalPayment) await api.installments.remove(generatedFinalPayment.id);
    onChange();
  }

  return (
    <section className="space-y-4">
      {/* Mode selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setMode("simple")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "simple" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sin financiación
          </button>
          <button
            onClick={() => setMode("financiado")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "financiado" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Con financiación
          </button>
        </div>
        {(installments.length > 0 || remainingDebt != null) && (
          <div className="text-xs text-slate-500 text-right space-y-0.5">
            {installments.length > 0 && (
              <div>
                <span className="text-teal-700 font-medium">Pagado: {formatNumber(totalPaid)} €</span>
                {totalScheduledPending > 0 && (
                  <span className="ml-2 text-amber-600 font-medium">Sin pagar: {formatNumber(totalScheduledPending)} €</span>
                )}
              </div>
            )}
            {remainingDebt != null && (
              <div className={remainingDebt > 0 ? "text-slate-500" : "text-teal-600 font-medium"}>
                {remainingDebt > 0
                  ? `Saldo pendiente: ${formatNumber(remainingDebt)} €`
                  : "✓ Vehículo totalmente pagado"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SIN FINANCIACIÓN ── */}
      {mode === "simple" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Pagos realizados</h3>
            <button
              onClick={() => { setShowAddForm((s) => !s); setAddError(null); }}
              className="text-sm font-medium text-teal-600 hover:text-teal-500"
            >
              {showAddForm ? "Cancelar" : "+ Añadir pago"}
            </button>
          </div>
          {showAddForm && (
            <SimplePaymentForm onSave={handleAddSimple} onCancel={() => setShowAddForm(false)} error={addError} />
          )}
          {installments.length === 0 && !showAddForm && (
            <p className="text-sm text-slate-400 py-4 text-center">Sin pagos registrados todavía.</p>
          )}
          <PaymentList installments={installments} onTogglePaid={togglePaid} onDelete={handleDelete} />
        </div>
      )}

      {/* ── CON FINANCIACIÓN ── */}
      {mode === "financiado" && (
        <div className="space-y-4">
          {/* Partial payments (entrada, pago_previo, etc.) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Pagos parciales previos</h3>
              <button
                onClick={() => { setShowAddForm((s) => !s); setAddError(null); }}
                className="text-sm font-medium text-teal-600 hover:text-teal-500"
              >
                {showAddForm ? "Cancelar" : "+ Añadir"}
              </button>
            </div>
            {showAddForm && (
              <SimplePaymentForm onSave={handleAddSimple} onCancel={() => setShowAddForm(false)} error={addError} />
            )}
            {extraPayments.length === 0 && !showAddForm && (
              <p className="text-xs text-slate-400 py-2">Sin pagos parciales (entrada, pago previo…)</p>
            )}
            <PaymentList installments={extraPayments} onTogglePaid={togglePaid} onDelete={handleDelete} />
          </div>

          {/* Auto-generate prompt when financing data is complete but no cuotas yet */}
          {cuotas.length === 0 && financingAmount && financingInterestRate != null && financingTermMonths && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-800">Datos de financiación listos</p>
                <p className="text-xs text-teal-600 mt-0.5">
                  {formatNumber(financingAmount)} € · {financingInterestRate} % TIN · {financingTermMonths} meses
                </p>
              </div>
              <button
                onClick={previewAmortization}
                className="shrink-0 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
              >
                ⚡ Generar tabla
              </button>
            </div>
          )}

          {/* Amortization generator box */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Tabla de amortización</h3>
              {(cuotas.length > 0 || generatedFinalPayment) && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {cuotas.length} cuotas{generatedFinalPayment ? " + cuota final" : ""} generadas
                  </span>
                  <button
                    onClick={handleDeleteAllCuotas}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Eliminar tabla
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              {/* Generator form */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Importe (€)</label>
                  <input type="text" inputMode="decimal" placeholder="0,00" className={inputClass}
                    value={genPrincipal} onChange={(e) => { setGenPrincipal(e.target.value); setGenPreview(null); }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Interés TIN (%)</label>
                  <input type="number" step="0.01" placeholder="0,00" className={inputClass}
                    value={genRate} onChange={(e) => { setGenRate(e.target.value); setGenPreview(null); }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Plazo (meses)</label>
                  <input type="number" placeholder="60" className={inputClass}
                    value={genMonths} onChange={(e) => { setGenMonths(e.target.value); setGenPreview(null); }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">1er pago</label>
                  <input type="date" className={inputClass}
                    value={genFirstDate} onChange={(e) => { setGenFirstDate(e.target.value); setGenPreview(null); }} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cuota final / VFG (€, opcional)</label>
                  <input type="text" inputMode="decimal" placeholder="Sin cuota final" className={inputClass}
                    value={genBalloon} onChange={(e) => { setGenBalloon(e.target.value); setGenPreview(null); }} />
                </div>
              </div>
              {genBalloon && !genError && (
                <p className="text-xs text-slate-500 -mt-2">
                  Financiación tipo PCP/VFG: las cuotas solo amortizan hasta la cuota final, que se paga aparte al
                  terminar el plazo (opción de compra, devolución o refinanciación).
                </p>
              )}
              {genError && <p className="text-sm text-red-600">{genError}</p>}
              <div className="flex gap-2">
                <button onClick={previewAmortization}
                  className="px-4 py-1.5 rounded-lg border border-teal-300 text-teal-700 text-sm font-medium hover:bg-teal-50 transition-colors">
                  Previsualizar tabla
                </button>
                {genPreview && (
                  <button onClick={confirmGenerate} disabled={generating}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                    {generating ? "Guardando…" : `Generar ${genPreview.length} cuotas`}
                  </button>
                )}
              </div>

              {/* Preview table */}
              {genPreview && (
                <div className="overflow-auto rounded-lg border border-slate-200 max-h-72">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Nº</th>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium text-right">Cuota</th>
                        <th className="px-3 py-2 font-medium text-right">Capital</th>
                        <th className="px-3 py-2 font-medium text-right">Intereses</th>
                        <th className="px-3 py-2 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {genPreview.map((row) => (
                        <tr
                          key={row.installmentNumber}
                          className={row.concept === "pago_final" ? "bg-amber-50 font-semibold" : "bg-white"}
                        >
                          <td className="px-3 py-1.5 text-slate-500">
                            {row.concept === "pago_final" ? "Final" : row.installmentNumber}
                          </td>
                          <td className="px-3 py-1.5">{fmtDate(row.paymentDate)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">{formatNumber(row.totalAmount)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{formatNumber(row.principalAmount)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{formatNumber(row.interestAmount)}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-400">{formatNumber(row.remainingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Saved cuotas table */}
              {!genPreview && scheduleRows.length > 0 && (
                <div className="overflow-auto max-h-72 rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium w-8">✓</th>
                        <th className="px-3 py-2 font-medium">Nº</th>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium text-right">Cuota</th>
                        <th className="px-3 py-2 font-medium text-right">Capital</th>
                        <th className="px-3 py-2 font-medium text-right">Intereses</th>
                        <th className="px-3 py-2 font-medium text-right">Saldo</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scheduleRows.map((i) => (
                        <tr
                          key={i.id}
                          className={
                            i.concept === "pago_final"
                              ? i.isPaid ? "bg-teal-50 font-semibold" : "bg-amber-50 font-semibold"
                              : i.isPaid ? "bg-teal-50" : "bg-white"
                          }
                        >
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={i.isPaid}
                              onChange={() => togglePaid(i)}
                              className="accent-teal-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-slate-500">
                            {i.concept === "pago_final" ? "Final" : i.installmentNumber ?? "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            {editingDateId === i.id ? (
                              <div className="flex items-center gap-1">
                                <input type="date" className="border border-slate-300 rounded px-1 py-0.5 text-xs"
                                  defaultValue={i.paymentDate.slice(0, 10)}
                                  onChange={(e) => setEditDateValue(e.target.value)} />
                                <button onClick={() => handleDateEdit(i)} className="text-teal-600 font-medium">✓</button>
                                <button onClick={() => setEditingDateId(null)} className="text-slate-400">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingDateId(i.id); setEditDateValue(i.paymentDate.slice(0, 10)); }}
                                className={`text-left hover:text-teal-700 transition-colors ${i.isPaid ? "line-through text-slate-400" : ""}`}
                              >
                                {new Date(i.paymentDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                            {i.totalAmount != null ? formatNumber(i.totalAmount) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                            {i.principalAmount != null ? formatNumber(i.principalAmount) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                            {i.interestAmount != null ? formatNumber(i.interestAmount) : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-400">
                            {i.remainingBalance != null ? formatNumber(i.remainingBalance) : "—"}
                          </td>
                          <td className="px-3 py-1.5">
                            <button onClick={() => handleDelete(i.id)} className="text-red-400 hover:text-red-600">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-medium text-slate-700">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-xs">
                          {scheduleRows.filter((i) => i.isPaid).length} / {scheduleRows.length} pagadas
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          {formatNumber(scheduleRows.reduce((s, i) => s + (i.totalAmount ?? 0), 0))}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          {formatNumber(scheduleRows.reduce((s, i) => s + (i.principalAmount ?? 0), 0))}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          {formatNumber(scheduleRows.reduce((s, i) => s + (i.interestAmount ?? 0), 0))}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Shared payment list (simple rows with paid toggle) ──────────────────────

function PaymentList({
  installments,
  onTogglePaid,
  onDelete,
}: {
  installments: Installment[];
  onTogglePaid: (i: Installment) => void;
  onDelete: (id: string) => void;
}) {
  if (installments.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {installments.map((i) => (
        <li key={i.id}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
            i.isPaid ? "bg-teal-50 border-teal-100" : "bg-white border-slate-200"
          }`}
        >
          <input
            type="checkbox"
            checked={i.isPaid}
            onChange={() => onTogglePaid(i)}
            className="accent-teal-600 cursor-pointer shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className={`font-medium ${i.isPaid ? "line-through text-slate-400" : "text-slate-800"}`}>
              {PAYMENT_CONCEPT_LABELS[(i.concept as PaymentConcept) ?? "otro"]}
            </span>
            <span className="text-slate-400 ml-2 text-xs">
              {new Date(i.paymentDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
            {i.notes && <span className="text-slate-400 ml-2 text-xs italic">{i.notes}</span>}
          </div>
          {i.totalAmount != null && (
            <span className={`tabular-nums text-sm font-semibold shrink-0 ${i.isPaid ? "text-slate-400" : "text-slate-800"}`}>
              {formatNumber(i.totalAmount)} €
            </span>
          )}
          <button onClick={() => onDelete(i.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0 text-xs">✕</button>
        </li>
      ))}
    </ul>
  );
}
