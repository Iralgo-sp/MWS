import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleDocument, VehicleWithDetails } from "../api/types";
import {
  ACQUISITION_SELLER_TYPE_LABELS,
  INSURANCE_TYPE_LABELS,
  MAINTENANCE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  VEHICLE_TYPE_LABELS,
  formatNumber,
} from "../constants";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function operationCost(o: { listPrice?: number | null; negotiatedPrice?: number | null; tradeInValue?: number | null; taxesFees?: number | null }) {
  const base = o.negotiatedPrice ?? o.listPrice;
  if (base == null) return null;
  return base + (o.taxesFees ?? 0) - (o.tradeInValue ?? 0);
}

interface DocRow extends VehicleDocument {
  context: string;
}

function collectDocuments(v: VehicleWithDetails): DocRow[] {
  const rows: DocRow[] = [];
  v.documents.forEach((d) => rows.push({ ...d, context: "General" }));
  v.acquisitionOffers.forEach((o) =>
    o.documents.forEach((d) => rows.push({ ...d, context: `Adquisición · ${o.sellerName}` }))
  );
  v.maintenanceRecords.forEach((r) =>
    r.documents.forEach((d) => rows.push({ ...d, context: `Mantenimiento · ${fmtDate(r.date)}` }))
  );
  v.insurancePolicies
    .filter((p) => p.isSelected)
    .forEach((p) => p.documents.forEach((d) => rows.push({ ...d, context: `Seguro · ${p.company} ${p.year}` })));
  return rows.sort((a, b) => +new Date(a.uploadedAt) - +new Date(b.uploadedAt));
}

export default function VehicleExport() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.vehicles.get(id).then(setVehicle).catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!vehicle) return;
    const prevTitle = document.title;
    document.title = `Expediente - ${vehicle.alias}`;
    return () => { document.title = prevTitle; };
  }, [vehicle]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!vehicle) return <p className="p-6 text-slate-500">Cargando…</p>;

  const acceptedOffer = vehicle.acquisitionOffers.find((o) => o.isSelected);
  const otherOffers = vehicle.acquisitionOffers.filter((o) => !o.isSelected);

  const maintenance = [...vehicle.maintenanceRecords].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const totalMaintenanceCost = maintenance.reduce((s, r) => s + (r.cost ?? 0), 0);

  const insuranceHistory = [...vehicle.insurancePolicies]
    .filter((p) => p.isSelected)
    .sort((a, b) => a.year - b.year);

  const odometer = [...vehicle.odometerReadings].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const cuotas = vehicle.installments.filter((i) => i.concept === "cuota").sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));
  const extraPayments = vehicle.installments.filter((i) => i.concept !== "cuota").sort((a, b) => +new Date(a.paymentDate) - +new Date(b.paymentDate));
  const totalPaidInstallments = vehicle.installments.filter((i) => i.isPaid).reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalPendingInstallments = vehicle.installments.filter((i) => !i.isPaid).reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  const totalInsuranceCost = insuranceHistory.reduce((s, p) => s + (p.annualCost ?? 0), 0);
  const totalInterest = vehicle.installments.filter((i) => i.isPaid).reduce((s, i) => s + (i.interestAmount ?? 0), 0);
  const tcoTotal = (vehicle.purchasePrice ?? 0) + totalMaintenanceCost + totalInsuranceCost + totalInterest;

  const documents = collectDocuments(vehicle);

  return (
    <div className="bg-white">
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
        <Link to={`/vehicles/${vehicle.id}`} className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-slate-900">Expediente exportable</h1>
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
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8 text-sm text-slate-800">
        {/* Header */}
        <header className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Expediente del vehículo</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{vehicle.alias}</h1>
            <p className="text-slate-500 mt-0.5">
              {VEHICLE_TYPE_LABELS[vehicle.type]}
              {vehicle.brand ? ` · ${vehicle.brand}` : ""}
              {vehicle.model ? ` ${vehicle.model}` : ""}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
              vehicle.status === "activo" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-600 border border-slate-300"
            }`}>
              {vehicle.status === "activo" ? "Activo" : "Vendido"}
            </span>
            <p className="text-xs text-slate-400 mt-1.5">Generado el {fmtDate(new Date().toISOString())}</p>
          </div>
        </header>

        {/* Ficha técnica */}
        <section>
          <SectionTitle>Ficha técnica</SectionTitle>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-2 mt-2">
            <Field label="Matrícula" value={vehicle.plate} />
            <Field label="Bastidor / VIN" value={vehicle.chassis} />
            <Field label="Color" value={vehicle.color} />
          </dl>
        </section>

        {/* Adquisición */}
        <section>
          <SectionTitle>Adquisición</SectionTitle>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-2 mt-2">
            <Field label="Fecha de compra" value={fmtDate(vehicle.purchaseDate)} />
            <Field label="Precio de compra" value={vehicle.purchasePrice != null ? `${formatNumber(vehicle.purchasePrice)} €` : undefined} />
            <Field label="Forma de pago" value={PAYMENT_METHOD_LABELS[vehicle.paymentMethod]} />
            <Field label="Vendedor" value={vehicle.dealerName} />
            <Field label="Dirección" value={vehicle.dealerAddress} />
          </dl>

          {acceptedOffer && (
            <p className="text-xs text-slate-500 mt-2">
              Comprado a {ACQUISITION_SELLER_TYPE_LABELS[acceptedOffer.sellerType].toLowerCase()} tras comparar{" "}
              {vehicle.acquisitionOffers.length} oferta{vehicle.acquisitionOffers.length !== 1 ? "s" : ""}
              {operationCost(acceptedOffer) != null ? ` · coste real de la operación: ${formatNumber(operationCost(acceptedOffer)!)} €` : ""}.
            </p>
          )}

          {otherOffers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Ofertas comparadas durante la compra</p>
              <Table
                head={["Vendedor", "Tipo", "Fecha", "Negociado", "Coste real"]}
                rows={otherOffers.map((o) => [
                  o.sellerName,
                  ACQUISITION_SELLER_TYPE_LABELS[o.sellerType],
                  fmtDate(o.offerDate),
                  o.negotiatedPrice != null ? `${formatNumber(o.negotiatedPrice)} €` : "—",
                  operationCost(o) != null ? `${formatNumber(operationCost(o)!)} €` : "—",
                ])}
              />
            </div>
          )}
        </section>

        {/* Financiación */}
        {vehicle.paymentMethod === "financiado" && (
          <section>
            <SectionTitle>Financiación</SectionTitle>
            <dl className="grid grid-cols-3 gap-x-6 gap-y-2 mt-2">
              <Field label="Entidad" value={vehicle.financingLender} />
              <Field label="Importe financiado" value={vehicle.financingAmount != null ? `${formatNumber(vehicle.financingAmount)} €` : undefined} />
              <Field label="Interés (TIN)" value={vehicle.financingInterestRate != null ? `${vehicle.financingInterestRate} %` : undefined} />
              <Field label="Plazo" value={vehicle.financingTermMonths != null ? `${vehicle.financingTermMonths} meses` : undefined} />
              <Field label="Pagado" value={`${formatNumber(totalPaidInstallments)} €`} />
              <Field
                label="Saldo pendiente"
                value={totalPendingInstallments > 0 ? `${formatNumber(totalPendingInstallments)} €` : "Liquidado"}
              />
            </dl>
            {totalPendingInstallments > 0 && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
                ⚠ Queda financiación pendiente de cancelar antes de formalizar la venta.
              </p>
            )}
            {extraPayments.length > 0 && (
              <div className="mt-3">
                <Table
                  head={["Concepto", "Fecha", "Importe", "Pagado"]}
                  rows={extraPayments.map((i) => [
                    i.concept,
                    fmtDate(i.paymentDate),
                    i.totalAmount != null ? `${formatNumber(i.totalAmount)} €` : "—",
                    i.isPaid ? "Sí" : "No",
                  ])}
                />
              </div>
            )}
            {cuotas.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Cuadro de amortización ({cuotas.length} cuotas)</p>
                <Table
                  head={["Nº", "Fecha", "Cuota", "Capital", "Intereses", "Saldo", "Pagada"]}
                  rows={cuotas.map((i) => [
                    String(i.installmentNumber ?? "—"),
                    fmtDate(i.paymentDate),
                    i.totalAmount != null ? formatNumber(i.totalAmount) : "—",
                    i.principalAmount != null ? formatNumber(i.principalAmount) : "—",
                    i.interestAmount != null ? formatNumber(i.interestAmount) : "—",
                    i.remainingBalance != null ? formatNumber(i.remainingBalance) : "—",
                    i.isPaid ? "Sí" : "No",
                  ])}
                />
              </div>
            )}
          </section>
        )}

        {/* Mantenimiento */}
        <section>
          <SectionTitle>Historial de mantenimiento{totalMaintenanceCost > 0 ? ` (${formatNumber(totalMaintenanceCost)} € en total)` : ""}</SectionTitle>
          {maintenance.length === 0 ? (
            <EmptyNote text="Sin registros de mantenimiento." />
          ) : (
            <Table
              head={["Fecha", "Tipo", "Descripción", "Taller", "Km", "Coste"]}
              rows={maintenance.map((r) => [
                fmtDate(r.date),
                MAINTENANCE_TYPE_LABELS[r.type],
                r.description,
                r.workshop ?? "—",
                r.mileage != null ? r.mileage.toLocaleString("es-ES") : "—",
                r.cost != null ? `${formatNumber(r.cost)} €` : "—",
              ])}
            />
          )}
        </section>

        {/* Seguros */}
        <section>
          <SectionTitle>Historial de seguros</SectionTitle>
          {insuranceHistory.length === 0 ? (
            <EmptyNote text="Sin pólizas registradas." />
          ) : (
            <Table
              head={["Año", "Compañía", "Tipo", "Vigencia", "Prima/año", "Franquicia"]}
              rows={insuranceHistory.map((p) => [
                String(p.year),
                p.company,
                INSURANCE_TYPE_LABELS[p.type],
                `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}`,
                p.annualCost != null ? `${formatNumber(p.annualCost)} €` : "—",
                p.hasFranchise && p.franchiseAmount != null ? `${formatNumber(p.franchiseAmount)} €` : "Sin franquicia",
              ])}
            />
          )}
        </section>

        {/* Kilometraje */}
        <section>
          <SectionTitle>Histórico de kilometraje</SectionTitle>
          {odometer.length === 0 ? (
            <EmptyNote text="Sin lecturas de odómetro registradas." />
          ) : (
            <Table
              head={["Fecha", "Km", "Notas"]}
              rows={odometer.map((o) => [fmtDate(o.date), o.mileage.toLocaleString("es-ES"), o.notes ?? "—"])}
            />
          )}
        </section>

        {/* TCO */}
        <section>
          <SectionTitle>Coste total de propiedad (TCO)</SectionTitle>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-2 mt-2">
            <Field label="Precio de compra" value={`${formatNumber(vehicle.purchasePrice ?? 0)} €`} />
            <Field label="Mantenimiento" value={`${formatNumber(totalMaintenanceCost)} €`} />
            <Field label="Seguros" value={`${formatNumber(totalInsuranceCost)} €`} />
            <Field label="Intereses financiación" value={`${formatNumber(totalInterest)} €`} />
            <Field label="Total acumulado" value={`${formatNumber(tcoTotal)} €`} />
          </dl>
        </section>

        {/* Documentos */}
        <section>
          <SectionTitle>Documentos adjuntos ({documents.length})</SectionTitle>
          {documents.length === 0 ? (
            <EmptyNote text="Sin documentos adjuntos en el expediente." />
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                  {d.mimeType.startsWith("image/") ? (
                    <img src={api.documents.downloadUrl(d.id)} alt={d.label} className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0" />
                  ) : (
                    <span className="w-10 h-10 flex items-center justify-center rounded bg-slate-100 text-slate-400 shrink-0 text-xs">
                      {d.mimeType === "application/pdf" ? "PDF" : "DOC"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">{d.label}</p>
                    <p className="text-xs text-slate-500 truncate">{d.context} · {d.originalName} · {fmtDate(d.uploadedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {vehicle.notes && (
          <section>
            <SectionTitle>Notas</SectionTitle>
            <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{vehicle.notes}</p>
          </section>
        )}

        <footer className="pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
          Expediente generado automáticamente con MWS — Gestión de Vehículos
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
