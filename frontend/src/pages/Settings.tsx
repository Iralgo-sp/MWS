import { useEffect, useState } from "react";

export default function Settings() {
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isElectron = !!window.electronAPI;

  useEffect(() => {
    if (window.electronAPI?.getDataDir) {
      window.electronAPI.getDataDir().then(setDataDir);
    }
  }, []);

  if (!isElectron) {
    return (
      <div className="p-6">
        <p className="text-slate-500 text-sm">Los ajustes de carpeta solo están disponibles en la aplicación de escritorio.</p>
      </div>
    );
  }

  async function handleChange() {
    setLoading(true);
    await window.electronAPI!.changeDataDir();
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ajustes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configuración de la aplicación</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Carpeta de datos</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            La base de datos y los archivos adjuntos se guardan en esta carpeta. Puedes cambiarla
            para trabajar con una carpeta existente o crear una nueva base de datos vacía.
          </p>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-md truncate">
              {dataDir ?? "…"}
            </code>
            <button
              onClick={() => window.electronAPI!.openDataDir()}
              className="shrink-0 px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm transition-colors"
              title="Abrir en el explorador"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          <div className="flex items-start gap-3">
            <button
              onClick={handleChange}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Cambiando…" : "Cambiar carpeta…"}
            </button>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
              La aplicación se reiniciará al seleccionar una carpeta nueva.
              Si la carpeta ya contiene una base de datos MWS, se abrirá esa.
              Si está vacía, se creará una nueva base de datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
