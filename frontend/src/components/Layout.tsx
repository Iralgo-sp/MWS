import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { Vehicle } from "../api/types";
import { VEHICLE_TYPE_ICONS } from "../constants";

const isElectron = typeof window !== "undefined" && !!(window as Record<string, unknown>).electronAPI;

export default function Layout({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const location = useLocation();

  useEffect(() => {
    api.vehicles.list().then(setVehicles).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col overflow-y-auto">
        <div className="px-4 py-5 border-b border-slate-800">
          <Link to="/" className="text-teal-400 font-bold text-xl tracking-wide hover:text-teal-300 transition-colors">
            MWS
          </Link>
          <p className="text-slate-500 text-xs mt-0.5">Gestión de vehículos</p>
        </div>

        <nav className="px-2 py-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-teal-600 text-white font-medium"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`
            }
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Panel
          </NavLink>
        </nav>

        {vehicles.length > 0 && (
          <div className="px-2 flex-1">
            <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vehículos
            </p>
            <ul className="mt-1 space-y-0.5">
              {vehicles.map((v) => (
                <li key={v.id}>
                  <NavLink
                    to={`/vehicles/${v.id}`}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      }`
                    }
                  >
                    <span className="text-base leading-none shrink-0">{VEHICLE_TYPE_ICONS[v.type]}</span>
                    <span className="truncate">{v.alias}</span>
                    {v.status === "vendido" && (
                      <span className="ml-auto text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                        Vend.
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-3 border-t border-slate-800 mt-auto space-y-2">
          <Link
            to="/vehicles/new"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir vehículo
          </Link>
          {isElectron && (
            <button
              onClick={() => (window as Record<string, { quit: () => void }>).electronAPI.quit()}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
