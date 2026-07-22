import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            🚗 Vehículos del hogar
          </Link>
        </div>
      </header>
      <main className="px-4 py-6">{children}</main>
    </div>
  );
}
