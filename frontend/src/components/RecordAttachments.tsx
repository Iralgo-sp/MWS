import { useRef, useState, type ChangeEvent } from "react";
import { api } from "../api/client";
import type { VehicleDocument } from "../api/types";
import { useConfirm } from "./ConfirmDialog";

export default function RecordAttachments({
  documents,
  buttonLabel,
  onUpload,
  onChange,
}: {
  documents: VehicleDocument[];
  buttonLabel: string;
  onUpload: (file: File) => Promise<unknown>;
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmDialog = useConfirm();

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({ message: "¿Eliminar este documento?", confirmLabel: "Eliminar" });
    if (!ok) return;
    setError(null);
    try {
      await api.documents.remove(id);
      onChange();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mt-2 space-y-1">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {documents.map((d) => (
        <div key={d.id} className="flex items-center gap-2 text-xs">
          <a
            href={api.documents.downloadUrl(d.id)}
            download={d.originalName}
            className="truncate text-teal-600 underline hover:text-teal-500"
          >
            📎 {d.originalName}
          </a>
          <button onClick={() => handleDelete(d.id)} className="shrink-0 text-red-600">
            Eliminar
          </button>
        </div>
      ))}
      <label className="inline-block cursor-pointer text-xs font-medium text-teal-600 hover:text-teal-500">
        {uploading ? "Subiendo…" : buttonLabel}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
