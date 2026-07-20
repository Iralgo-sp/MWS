import { useRef, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { VehicleDocument } from "../api/types";
import { inputClass } from "../constants";

const LABEL_SUGGESTIONS = ["Factura de compra", "Contrato de financiación", "Póliza de seguro", "Otro"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsSection({
  vehicleId,
  documents,
  onChange,
}: {
  vehicleId: string;
  documents: VehicleDocument[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un fichero");
      return;
    }
    if (!label.trim()) {
      setError("Indica una etiqueta para el documento");
      return;
    }
    setUploading(true);
    try {
      await api.documents.upload(vehicleId, file, label.trim());
      setLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento?")) return;
    await api.documents.remove(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
        >
          {showForm ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            required
            list="document-label-suggestions"
            placeholder="Etiqueta (p.ej. Factura de compra)"
            className={inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <datalist id="document-label-suggestions">
            {LABEL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <input required type="file" ref={fileInputRef} className={inputClass} />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {uploading ? "Subiendo…" : "Subir"}
          </button>
        </form>
      )}

      {documents.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">Sin documentos adjuntos todavía.</p>
      )}

      <ul className="space-y-2">
        {documents.map((d) => (
          <li
            key={d.id}
            className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="font-medium">{d.label}</p>
              <a
                href={api.documents.downloadUrl(d.id)}
                download={d.originalName}
                className="text-slate-600 underline dark:text-slate-400"
              >
                {d.originalName}
              </a>
              <p className="text-xs text-slate-500">
                {formatSize(d.size)} · {new Date(d.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => handleDelete(d.id)} className="text-xs text-red-600">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
