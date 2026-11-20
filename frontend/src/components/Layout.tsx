import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { Vehicle } from "../api/types";
import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS, VEHICLE_TYPES } from "../constants";
import { HcStatusBar } from "./HcStatusBar";

const isElectron = typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).electronAPI;
const isHomeCore = !!import.meta.env.VITE_HOMECORE;

export default function Layout({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const location = useLocation();

  useEffect(() => {
    api.vehicles.list().then(setVehicles).catch(() => {});
  }, [location.pathname]);

  const groupedVehicles = VEHICLE_TYPES
    .map((type) => ({ type, items: vehicles.filter((v) => v.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)", paddingBottom: isHomeCore ? "36px" : "0" }}>
      <aside
        className="no-print w-60 shrink-0 flex flex-col overflow-y-auto"
        style={{ backgroundColor: "var(--mws-nav-bg)", borderRight: "1px solid var(--mws-nav-border)" }}
      >

        <div className="px-4 py-5 border-b" style={{ borderColor: "var(--mws-nav-border)" }}>
          <Link
            to="/"
            className="font-bold text-xl tracking-wide hover:opacity-80 transition-opacity"
            style={{ color: "var(--primary)", fontFamily: "var(--font-serif)" }}
          >
            MWS
          </Link>
          <p className="text-xs mt-0.5" style={{ color: "var(--mws-nav-text-muted)" }}>
            Gestión de vehículos
          </p>
        </div>

        <nav className="px-2 py-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mws-nav-link${isActive ? " active" : ""}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Panel
          </NavLink>
          <NavLink
            to="/reports/fleet"
            className={({ isActive }) => `mws-nav-link${isActive ? " active" : ""}`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Informes
          </NavLink>
        </nav>

        {vehicles.length > 0 && (
          <div className="px-2 flex-1">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--mws-nav-text-muted)" }}>
              Vehículos
            </p>
            {groupedVehicles.map((group) => (
              <div key={group.type} className="mt-1">
                {groupedVehicles.length > 1 && (
                  <p className="px-3 py-1 text-[11px] font-medium flex items-center gap-1.5" style={{ color: "var(--mws-nav-text-muted)" }}>
                    <span>{VEHICLE_TYPE_ICONS[group.type]}</span>
                    {VEHICLE_TYPE_LABELS[group.type]}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((v) => (
                    <li key={v.id}>
                      <NavLink
                        to={`/vehicles/${v.id}`}
                        className={({ isActive }) => `mws-nav-link mws-vehicle-link${isActive ? " active" : ""}`}
                      >
                        {v.coverImage ? (
                          <img
                            src={isHomeCore ? api.vehicles.coverUrl(v.id) : `/api/vehicles/${v.id}/cover?t=${v.updatedAt}`}
                            alt=""
                            className="w-20 h-10 rounded-md object-contain shrink-0"
                          />
                        ) : (
                          <span className="text-xl leading-none shrink-0">{VEHICLE_TYPE_ICONS[v.type]}</span>
                        )}
                        <span className="truncate">{v.alias}</span>
                        {v.status === "vendido" && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--mws-nav-bg) 80%, black)", color: "var(--mws-nav-text-muted)" }}>
                            Vend.
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 mt-auto space-y-2" style={{ borderTop: "1px solid var(--mws-nav-border)" }}>
          <Link to="/vehicles/new" className="mws-btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir vehículo
          </Link>
          {isElectron && (
            <>
              <NavLink
                to="/settings"
                className={({ isActive }) => `mws-nav-link${isActive ? " active" : ""}`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ajustes
              </NavLink>
              <button
                onClick={() => window.electronAPI?.quit()}
                className="mws-nav-link"
                style={{ border: "1px solid var(--mws-nav-border)" }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Salir
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--bg)" }}>
        {children}
      </main>
      {isHomeCore && <HcStatusBar />}
    </div>
  );
}
