import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { FleetReport } from "../api/types";
import { VEHICLE_TYPE_LABELS, formatNumber } from "../constants";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtAge(years: number | null): string {
  if (years == null) return "—";
  if (years < 1) return `${Math.round(years * 12)} meses`;
  return `${years.toFixed(1)} años`;
}

export default function FleetReportPage() {
  const [report, setReport] = useState<FleetReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.reports.fleet().then(setReport).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Informe general de flota";
    return () => { document.title = prevTitle; };
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!report) return <p className="p-6 text-slate-500">Cargando…</p>;

  const { summary } = report;
  const vehicles = [...report.vehicles].sort((a, b) => b.tcoTotal - a.tcoTotal);

  return (
    <div className="bg-white min-h-full">
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
          section { break-inside: avoid-page; }
        }
      `}</style>

      {/* Toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <Link to="/" className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-slate-900">Informe general de flota</h1>
        <div className="ml-auto">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors"
          >
            Imprimir / Guardar como PDF
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-8 text-sm text-slate-800">
        {/* Header */}
        <header className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Informe de flota</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Resumen general</h1>
          </div>
          <p className="text-xs text-slate-400 shrink-0">Generado el {fmtDate(report.generatedAt)}</p>
        </header>

        {/* Resumen de la flota */}
        <section>
          <SectionTitle>Resumen de la flota</SectionTitle>
          <div className="grid grid-cols-4 gap-3 mt-2">
            <StatTile label="Vehículos totales" value={String(summary.totalVehicles)} />
            <StatTile label="Activos" value={String(summary.activeVehicles)} />
            <StatTile label="Vendidos" value={String(summary.soldVehicles)} />
            <StatTile label="Antigüedad media (activos)" value={fmtAge(summary.averageAgeYears)} />
          </div>
          {report.byType.length > 0 && (
            <div className="mt-3">
              <Table
                head={["Tipo", "Nº vehículos", "Coste acumulado (TCO)"]}
                rows={report.byType.map((t) => [
                  VEHICLE_TYPE_LABELS[t.type],
                  String(t.count),
                  `${formatNumber(t.tcoTotal)} €`,
                ])}
              />
            </div>
          )}
        </section>

        {/* Costes de la flota */}
        <section>
          <SectionTitle>Costes acumulados de la flota</SectionTitle>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-2 mt-2">
            <Field label="Valor de compra" value={`${formatNumber(summary.totalPurchaseValue)} €`} />
            <Field label="Mantenimiento" value={`${formatNumber(summary.totalMaintenanceCost)} €`} />
            <Field label="Seguros" value={`${formatNumber(summary.totalInsuranceCost)} €`} />
            <Field label="Intereses financiación" value={`${formatNumber(summary.totalInterestCost)} €`} />
            <Field label="Coste total (TCO)" value={`${formatNumber(summary.totalTco)} €`} />
          </dl>
        </section>

        {/* Antigüedad y kilometraje por vehículo */}
        <section>
          <SectionTitle>Antigüedad y kilometraje por vehículo</SectionTitle>
          {vehicles.length === 0 ? (
            <EmptyNote text="Todavía no hay vehículos registrados." />
          ) : (
            <Table
              head={["Vehículo", "Tipo", "Estado", "Compra", "Antigüedad", "Km"]}
              rows={vehicles.map((v) => [
                v.alias,
                VEHICLE_TYPE_LABELS[v.type],
                v.status === "activo" ? "Activo" : "Vendido",
                fmtDate(v.purchaseDate),
                fmtAge(v.ageYears),
                v.currentKm != null ? v.currentKm.toLocaleString("es-ES") : "—",
              ])}
            />
          )}
        </section>

        {/* Desglose de costes por vehículo */}
        <section>
          <SectionTitle>Desglose de costes por vehículo (ordenado por coste total)</SectionTitle>
          {vehicles.length === 0 ? (
            <EmptyNote text="Todavía no hay vehículos registrados." />
          ) : (
            <Table
              head={["Vehículo", "Compra", "Mantenimiento", "Seguros", "Intereses", "TCO", "€/mes", "€/km"]}
              rows={vehicles.map((v) => [
                v.alias,
                `${formatNumber(v.purchasePrice)} €`,
                `${formatNumber(v.totalMaintenance)} €`,
                `${formatNumber(v.totalInsurance)} €`,
                `${formatNumber(v.totalInterest)} €`,
                `${formatNumber(v.tcoTotal)} €`,
                v.eurPerMonth != null ? `${formatNumber(v.eurPerMonth)} €` : "—",
                v.eurPerKm != null ? `${v.eurPerKm.toFixed(3)} €` : "—",
              ])}
            />
          )}
        </section>

        <footer className="pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
          Informe generado automáticamente con MWS — Gestión de Vehículos
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">{children}</h2>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-lg px-3 py-2">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-lg font-semibold text-slate-900 mt-0.5">{value}</dd>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 mt-2">{text}</p>;
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-xs border-collapse mt-2">
      <thead>
        <tr className="bg-slate-50 text-left text-slate-500">
          {head.map((h) => (
            <th key={h} className="px-2 py-1.5 font-medium border-b border-slate-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="px-2 py-1.5 text-slate-700">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
