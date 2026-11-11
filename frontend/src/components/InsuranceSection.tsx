import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import type { InsurancePolicy } from "../api/types";
import { INSURANCE_TYPE_LABELS, INSURANCE_TYPES, formatNumber } from "../constants";

const TYPE_COLORS: Record<string, { select: string }> = {
  todo_riesgo_cf: { select: "bg-emerald-50" },
  todo_riesgo_sf: { select: "bg-blue-100" },
  terceros:       { select: "bg-amber-50" },
  ampliado:       { select: "bg-rose-50" },
  irl:            { select: "bg-violet-50" },
};

// ── Inline-editable row ────────────────────────────────────────────────────────

function InsuranceRow({
  policy,
  onSave,
  onDelete,
  onSelect,
  onCopyToNext,
}: {
  policy: InsurancePolicy;
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onCopyToNext: (id: string) => void;
}) {
  const [fields, setFields] = useState({
    startDate: policy.startDate.slice(0, 10),
    company: policy.company,
    type: policy.type,
    franchiseAmount: policy.franchiseAmount != null ? String(policy.franchiseAmount) : "",
    annualCost: policy.annualCost != null ? String(policy.annualCost) : "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    setFields({
      startDate: policy.startDate.slice(0, 10),
      company: policy.company,
      type: policy.type,
      franchiseAmount: policy.franchiseAmount != null ? String(policy.franchiseAmount) : "",
      annualCost: policy.annualCost != null ? String(policy.annualCost) : "",
    });
    dirtyRef.current = false;
  }, [policy.startDate, policy.company, policy.type, policy.franchiseAmount, policy.annualCost]);

  function update<K extends keyof typeof fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    dirtyRef.current = true;
  }

  async function saveIfDirty() {
    if (!dirtyRef.current) return;
    setSaving(true);
    try {
      await onSave(policy.id, {
        startDate: fields.startDate,
        company: fields.company.trim(),
        type: fields.type,
        hasFranchise: !!fields.franchiseAmount,
        franchiseAmount: fields.franchiseAmount ? Number(fields.franchiseAmount) : undefined,
        annualCost: fields.annualCost ? Number(fields.annualCost) : undefined,
      });
    } finally {
      dirtyRef.current = false;
      setSaving(false);
    }
  }

  const cell =
    "w-full bg-transparent border border-transparent rounded px-1.5 py-0.5 text-sm text-slate-700 " +
    "hover:border-slate-200 hover:bg-white focus:border-teal-400 focus:bg-white focus:outline-none transition-colors";

  return (
    <tr
      className={`group ${policy.isSelected ? "bg-teal-50/60" : "hover:bg-slate-50/50"} border-b border-slate-100 last:border-0`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          saveIfDirty();
          setConfirmingDelete(false);
        }
      }}
    >
      <td className="px-2 py-1">
        <input type="date" value={fields.startDate} onChange={(e) => update("startDate", e.target.value)} className={cell} />
      </td>
      <td className="px-2 py-1">
        <input value={fields.company} onChange={(e) => update("company", e.target.value)} placeholder="Compañía" className={cell} />
      </td>
      <td className={`px-2 py-1 ${TYPE_COLORS[fields.type]?.select ?? ""}`}>
        <select
          value={fields.type}
          onChange={(e) => update("type", e.target.value)}
          className={cell}
        >
          {INSURANCE_TYPES.map((t) => (
            <option key={t} value={t}>{INSURANCE_TYPE_LABELS[t]}</option>
          ))}
          {!INSURANCE_TYPES.includes(fields.type as never) && (
            <option value={fields.type}>{fields.type}</option>
          )}
        </select>
      </td>
      <td className="px-2 py-1">
        <div className="flex items-center gap-0.5">
          <input
            type="number" step="0.01" min="0"
            value={fields.franchiseAmount}
            onChange={(e) => update("franchiseAmount", e.target.value)}
            placeholder="—"
            className={`${cell} text-right tabular-nums`}
          />
          <span className="text-xs text-slate-400 shrink-0">€</span>
        </div>
      </td>
      <td className="px-2 py-1">
        <div className="flex items-center gap-0.5">
          <input
            type="number" step="0.01" min="0"
            value={fields.annualCost}
            onChange={(e) => update("annualCost", e.target.value)}
            placeholder="0,00"
            className={`${cell} text-right tabular-nums`}
          />
          <span className="text-xs text-slate-400 shrink-0">€</span>
        </div>
      </td>
      <td className="px-3 py-1 text-center">
        <button
          onClick={() => !policy.isSelected && onSelect(policy.id)}
          title={policy.isSelected ? "Póliza activa" : "Marcar como definitiva"}
          className="inline-flex"
        >
          {policy.isSelected ? (
            <svg className="w-5 h-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-200 group-hover:text-slate-300 hover:!text-teal-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </td>
      <td className="px-2 py-1">
        {confirmingDelete ? (
          <div className="flex items-center justify-end gap-1 text-xs">
            <span className="text-slate-500 whitespace-nowrap">¿Eliminar?</span>
            <button
              tabIndex={-1}
              onClick={() => { setConfirmingDelete(false); onDelete(policy.id); }}
              className="px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 font-medium"
            >Sí</button>
            <button
              tabIndex={-1}
              onClick={() => setConfirmingDelete(false)}
              className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 font-medium"
            >No</button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {saving && <span className="text-xs text-slate-400">…</span>}
            {policy.isSelected && (
              <button
                tabIndex={-1}
                onClick={() => onCopyToNext(policy.id)}
                className="text-xs text-slate-400 hover:text-teal-600 font-medium whitespace-nowrap"
                title="Copiar al año siguiente como presupuesto"
              >→+1</button>
            )}
            <button
              tabIndex={-1}
              onClick={() => setConfirmingDelete(true)}
              className="text-slate-300 hover:text-red-500"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── New-row entry ──────────────────────────────────────────────────────────────

function NewInsuranceRow({
  year,
  vehicleId,
  onCreated,
  onCancel,
}: {
  year: number;
  vehicleId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState({
    startDate: `${year}-01-01`,
    company: "",
    type: INSURANCE_TYPES[0],
    franchiseAmount: "",
    annualCost: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!fields.company.trim() || !fields.startDate) return;
    setSaving(true);
    try {
      await api.insurance.create(vehicleId, {
        year,
        company: fields.company.trim(),
        type: fields.type,
        startDate: fields.startDate,
        hasFranchise: !!fields.franchiseAmount,
        franchiseAmount: fields.franchiseAmount ? Number(fields.franchiseAmount) : undefined,
        annualCost: fields.annualCost ? Number(fields.annualCost) : undefined,
      });
      onCreated();
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  }

  const cell =
    "w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-sm " +
    "focus:border-teal-400 focus:outline-none transition-colors";

  return (
    <tr className="bg-teal-50/40 border-b border-slate-100">
      <td className="px-2 py-1.5">
        <input type="date" value={fields.startDate} onChange={(e) => setFields((f) => ({ ...f, startDate: e.target.value }))} className={cell} />
      </td>
      <td className="px-2 py-1.5">
        <input
          autoFocus
          value={fields.company}
          onChange={(e) => setFields((f) => ({ ...f, company: e.target.value }))}
          placeholder="Compañía *"
          className={cell}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
      </td>
      <td className="px-2 py-1.5">
        <select value={fields.type} onChange={(e) => setFields((f) => ({ ...f, type: e.target.value }))} className={cell}>
          {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{INSURANCE_TYPE_LABELS[t]}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <input
            type="number" step="0.01" min="0"
            value={fields.franchiseAmount}
            onChange={(e) => setFields((f) => ({ ...f, franchiseAmount: e.target.value }))}
            placeholder="—"
            className={`${cell} text-right tabular-nums`}
          />
          <span className="text-xs text-slate-400 shrink-0">€</span>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <input
            type="number" step="0.01" min="0"
            value={fields.annualCost}
            onChange={(e) => setFields((f) => ({ ...f, annualCost: e.target.value }))}
            placeholder="0,00"
            className={`${cell} text-right tabular-nums`}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <span className="text-xs text-slate-400 shrink-0">€</span>
        </div>
      </td>
      <td className="px-3 py-1.5 text-center">
        <button
          onClick={create}
          disabled={!fields.company.trim() || saving}
          className="text-teal-600 hover:text-teal-500 disabled:opacity-30"
          title="Confirmar (Enter)"
        >
          {saving ? (
            <span className="text-xs">…</span>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </td>
      <td className="px-2 py-1.5 text-center">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600" title="Cancelar">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

export default function InsuranceSection({
  vehicleId,
  policies,
  onChange,
}: {
  vehicleId: string;
  policies: InsurancePolicy[];
  onChange: () => void;
}) {
  const calYear = new Date().getFullYear();

  const [currentYear, setCurrentYear] = useState(() => {
    const ys = policies.map((p) => p.year);
    return ys.length > 0 ? Math.max(...ys) : calYear;
  });

  const allYears = useMemo(() => {
    const ys = new Set(policies.map((p) => p.year));
    ys.add(calYear);
    ys.add(currentYear);
    return [...ys].sort((a, b) => a - b);
  }, [policies, calYear, currentYear]);

  const [addingRow, setAddingRow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveYear = allYears.includes(currentYear) ? currentYear : allYears[allYears.length - 1];
  const yearIdx = allYears.indexOf(effectiveYear);

  const yearPolicies = useMemo(
    () =>
      policies
        .filter((p) => p.year === effectiveYear)
        .sort((a, b) => {
          if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }),
    [policies, effectiveYear],
  );

  const selected = yearPolicies.find((p) => p.isSelected);

  async function handleSave(id: string, data: Record<string, unknown>) {
    try { await api.insurance.update(id, data); onChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function handleSelect(id: string) {
    try { await api.insurance.select(id); onChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function handleDelete(id: string) {
    try { await api.insurance.remove(id); onChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function handleCopyToNext(id: string) {
    try {
      await api.insurance.copyToNextYear(id);
      onChange();
      setCurrentYear(effectiveYear + 1);
    } catch (e) { setError((e as Error).message); }
  }

  function navPrev() { setCurrentYear(allYears[yearIdx - 1]); setAddingRow(false); }
  function navNext() {
    if (yearIdx < allYears.length - 1) setCurrentYear(allYears[yearIdx + 1]);
    else setCurrentYear(effectiveYear + 1);
    setAddingRow(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Seguros</h2>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        {/* Year navigation */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          <button
            onClick={navPrev}
            disabled={yearIdx === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-25 text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center leading-tight">
            <span className="text-sm font-semibold text-slate-700">{effectiveYear}</span>
            {selected && (
              <span className="ml-2 text-xs text-teal-700 font-medium">
                {selected.company}
                {selected.annualCost != null ? ` · ${formatNumber(selected.annualCost)} €/año` : ""}
              </span>
            )}
          </div>

          <button onClick={navNext} className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 w-32">Fecha inicio</th>
              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2">Compañía</th>
              <th className="text-left text-xs font-medium text-slate-400 px-3 py-2 w-40">Tipo</th>
              <th className="text-right text-xs font-medium text-slate-400 px-3 py-2 w-24">Franquicia</th>
              <th className="text-right text-xs font-medium text-slate-400 px-3 py-2 w-24">Prima/año</th>
              <th className="text-center text-xs font-medium text-slate-400 px-3 py-2 w-10">✓</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {yearPolicies.map((p) => (
              <InsuranceRow
                key={p.id}
                policy={p}
                onSave={handleSave}
                onDelete={handleDelete}
                onSelect={handleSelect}
                onCopyToNext={handleCopyToNext}
              />
            ))}
            {yearPolicies.length === 0 && !addingRow && (
              <tr>
                <td colSpan={7} className="text-center text-sm text-slate-400 py-6">
                  Sin presupuestos para {effectiveYear}
                </td>
              </tr>
            )}
            {addingRow && (
              <NewInsuranceRow
                year={effectiveYear}
                vehicleId={vehicleId}
                onCreated={() => { setAddingRow(false); onChange(); }}
                onCancel={() => setAddingRow(false)}
              />
            )}
          </tbody>
        </table>

        {/* Footer */}
        {!addingRow && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setAddingRow(true)}
              className="text-sm text-teal-600 hover:text-teal-500 font-medium"
            >
              + Añadir fila
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
