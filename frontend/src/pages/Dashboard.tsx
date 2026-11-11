import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { DashboardSummary, KmAlert, Vehicle } from "../api/types";
import {
  formatNumber,
  VEHICLE_TYPE_ICONS,
  VEHICLE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../constants";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vehicles.list().then(setVehicles).catch((e: Error) => setError(e.message));
    api.dashboard.summary().then(setSummary).catch(() => {/* silent */});
  }, []);

  const active = vehicles?.filter((v) => v.status === "activo") ?? [];
  const total = vehicles?.length ?? 0;
  const expiringCount = summary?.expiringPolicies.length ?? 0;
  const itvCount = summary?.upcomingItv.length ?? 0;
  const alertCount = expiringCount + itvCount + (summary?.kmAlerts.length ?? 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen de tus vehículos</p>
        </div>
        <Link
          to="/vehicles/new"
          className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
        >
          + Añadir vehículo
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Vehículos activos" value={String(active.length)} />
        <StatTile label="Total vehículos" value={String(total)} />
        <StatTile
          label="Alertas activas"
          value={summary ? String(alertCount) : "…"}
          accent={alertCount > 0 ? "amber" : undefined}
        />
        <StatTile
          label="Gastos del mes"
          value={summary ? `${formatNumber(summary.monthlyExpenses.total)} €` : "…"}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Alertas: vencimientos + cuotas del mes */}
      {summary && alertCount > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Próximos vencimientos de seguros */}
          {expiringCount > 0 && (
            <AlertCard
              title="Seguros próximos a vencer"
              icon="🛡️"
              accent="amber"
            >
              <ul className="divide-y divide-slate-100">
                {summary.expiringPolicies.map((p) => {
                  const daysLeft = Math.ceil(
                    (new Date(p.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const urgent = daysLeft <= 15;
                  return (
                    <li key={p.id} className="flex items-center justify-between py-2.5 px-4">
                      <div className="min-w-0">
                        <Link to={`/vehicles/${p.vehicle.id}`} className="text-sm font-medium text-slate-800 hover:text-teal-700 truncate">
                          {VEHICLE_TYPE_ICONS[p.vehicle.type as keyof typeof VEHICLE_TYPE_ICONS]} {p.vehicle.alias}
                        </Link>
                        <p className="text-xs text-slate-500 truncate">{p.company} · {p.policyNumber || "sin nº póliza"}</p>
                      </div>
                      <div className="shrink-0 ml-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {daysLeft === 0 ? "hoy" : daysLeft === 1 ? "mañana" : `${daysLeft} días`}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(p.endDate!).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AlertCard>
          )}

          {/* Próximas ITV */}
          {itvCount > 0 && (
            <AlertCard title="ITV próxima" icon="🔍" accent="amber">
              <ul className="divide-y divide-slate-100">
                {summary.upcomingItv.map((v) => {
                  const daysLeft = Math.ceil(
                    (new Date(v.nextItv).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const urgent = daysLeft <= 15;
                  return (
                    <li key={v.id} className="flex items-center justify-between py-2.5 px-4">
                      <Link to={`/vehicles/${v.id}`} className="text-sm font-medium text-slate-800 hover:text-teal-700 truncate">
                        {VEHICLE_TYPE_ICONS[v.type as keyof typeof VEHICLE_TYPE_ICONS]} {v.alias}
                      </Link>
                      <div className="shrink-0 ml-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {daysLeft === 0 ? "hoy" : daysLeft === 1 ? "mañana" : `${daysLeft} días`}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(v.nextItv).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AlertCard>
          )}

          {/* Alertas de kilometraje */}
          {summary.kmAlerts.length > 0 && (
            <AlertCard title="Revisión por km" icon="🔧" accent="teal">
              <ul className="divide-y divide-slate-100">
                {summary.kmAlerts.map((a: KmAlert) => (
                  <li key={a.id} className="flex items-center justify-between py-2.5 px-4">
                    <div className="min-w-0">
                      <Link to={`/vehicles/${a.id}`} className="text-sm font-medium text-slate-800 hover:text-teal-700 truncate">
                        {VEHICLE_TYPE_ICONS[a.type as keyof typeof VEHICLE_TYPE_ICONS]} {a.alias}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.currentKm.toLocaleString()} km actuales · revisión cada {a.serviceIntervalKm.toLocaleString()} km
                      </p>
                    </div>
                    <span className="shrink-0 ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      +{a.kmOverdue.toLocaleString()} km
                    </span>
                  </li>
                ))}
              </ul>
            </AlertCard>
          )}

          {/* Cuotas pendientes este mes */}
          {summary.pendingThisMonth.length > 0 && (
            <AlertCard
              title={`Cuotas pendientes este mes (${summary.pendingThisMonth.length})`}
              icon="📅"
              accent="teal"
            >
              <ul className="divide-y divide-slate-100">
                {summary.pendingThisMonth.map((inst) => (
                  <li key={inst.id} className="flex items-center justify-between py-2.5 px-4">
                    <div className="min-w-0">
                      <Link to={`/vehicles/${inst.vehicle.id}`} className="text-sm font-medium text-slate-800 hover:text-teal-700 truncate">
                        {VEHICLE_TYPE_ICONS[inst.vehicle.type as keyof typeof VEHICLE_TYPE_ICONS]} {inst.vehicle.alias}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {new Date(inst.paymentDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                        {inst.installmentNumber ? ` · Cuota ${inst.installmentNumber}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 ml-3 text-sm font-semibold text-slate-700 tabular-nums">
                      {inst.totalAmount != null ? `${formatNumber(inst.totalAmount)} €` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-right">
                <span className="text-xs font-semibold text-slate-700">
                  Total: {formatNumber(summary.pendingThisMonth.reduce((s, i) => s + (i.totalAmount ?? 0), 0))} €
                </span>
              </div>
            </AlertCard>
          )}
        </div>
      )}

      {/* Desglose de gastos del mes */}
      {summary && summary.monthlyExpenses.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Gastos del mes</span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <ExpenseCell label="Mantenimiento" value={summary.monthlyExpenses.maintenance} icon="🔧" />
            <ExpenseCell label="Seguros" value={summary.monthlyExpenses.insurance} icon="🛡️" />
            <ExpenseCell label="Financiación" value={summary.monthlyExpenses.installments} icon="💳" />
          </div>
        </div>
      )}

      {/* Vehicle cards */}
      {!vehicles && !error && (
        <div className="flex items-center justify-center py-20 text-slate-400"><p>Cargando…</p></div>
      )}
      {vehicles?.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Todavía no hay vehículos.</p>
          <p className="text-slate-400 text-sm mt-1">Añade el primero para empezar.</p>
          <Link to="/vehicles/new" className="mt-4 inline-block px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium">
            + Añadir vehículo
          </Link>
        </div>
      )}
      {vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatTile({ label, value, accent }: { label: string; value: string; accent?: "amber" }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent === "amber" ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function AlertCard({ title, icon, accent, children }: {
  title: string; icon: string; accent: "amber" | "teal"; children: React.ReactNode;
}) {
  const border = accent === "amber" ? "border-amber-200" : "border-teal-200";
  const headerBg = accent === "amber" ? "bg-amber-50 border-amber-100" : "bg-teal-50 border-teal-100";
  const titleColor = accent === "amber" ? "text-amber-800" : "text-teal-800";
  return (
    <div className={`bg-white rounded-xl border ${border} shadow-sm overflow-hidden`}>
      <div className={`px-4 py-2.5 border-b ${headerBg} flex items-center gap-2`}>
        <span>{icon}</span>
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ExpenseCell({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-4 text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      <p className="text-lg font-bold text-slate-800 tabular-nums mt-0.5">{formatNumber(value)} €</p>
    </div>
  );
}

function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all overflow-hidden">
      {/* Photo */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {v.coverImage ? (
          <img
            src={`${api.vehicles.coverUrl(v.id)}?t=${v.updatedAt}`}
            alt={v.alias}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-10">{VEHICLE_TYPE_ICONS[v.type]}</span>
          </div>
        )}
        <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
          v.status === "activo" ? "bg-teal-500/90 text-white" : "bg-slate-600/80 text-white"
        }`}>
          {v.status === "activo" ? "Activo" : "Vendido"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900 text-base">{v.alias}</h3>
          <p className="text-sm text-slate-500 truncate">
            {VEHICLE_TYPE_LABELS[v.type]}
            {v.brand ? ` · ${v.brand}` : ""}
            {v.model ? ` ${v.model}` : ""}
            {v.year ? ` · ${v.year}` : ""}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {v.plate && <InfoRow label="Matrícula" value={v.plate} />}
          {v.chassis && <InfoRow label="Bastidor" value={v.chassis} />}
          {v.color && <InfoRow label="Color" value={v.color} />}
          {v.purchaseDate && (
            <InfoRow label="Compra" value={new Date(v.purchaseDate).toLocaleDateString("es-ES", {
              day: "numeric", month: "short", year: "numeric",
            })} />
          )}
          {v.purchasePrice != null && (
            <InfoRow label="Precio" value={`${formatNumber(v.purchasePrice)} €`} />
          )}
          <InfoRow label="Pago" value={PAYMENT_METHOD_LABELS[v.paymentMethod]} />
        </dl>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <Link to={`/vehicles/${v.id}`}
          className="flex-1 text-center py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
          Ver detalle
        </Link>
        <Link to={`/vehicles/${v.id}/edit`}
          className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm transition-colors">
          Editar
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd className="text-slate-700 font-medium truncate">{value}</dd>
    </div>
  );
}
