import { useEffect, useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { VehicleStatus, VehicleType } from "../api/types";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPES, inputClass } from "../constants";

const emptyForm = {
  type: "coche" as VehicleType,
  alias: "",
  brand: "",
  model: "",
  year: "",
  plate: "",
  purchaseDate: "",
  purchasePrice: "",
  notes: "",
  status: "activo" as VehicleStatus,
};

export default function VehicleForm({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && id) {
      api.vehicles
        .get(id)
        .then((v) => {
          setForm({
            type: v.type,
            alias: v.alias,
            brand: v.brand ?? "",
            model: v.model ?? "",
            year: v.year?.toString() ?? "",
            plate: v.plate ?? "",
            purchaseDate: v.purchaseDate ? v.purchaseDate.slice(0, 10) : "",
            purchasePrice: v.purchasePrice?.toString() ?? "",
            notes: v.notes ?? "",
            status: v.status,
          });
          setLoading(false);
        })
        .catch((e: Error) => {
          setError(e.message);
          setLoading(false);
        });
    }
  }, [mode, id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      type: form.type,
      alias: form.alias,
      brand: form.brand || undefined,
      model: form.model || undefined,
      year: form.year ? Number(form.year) : undefined,
      plate: form.plate || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      notes: form.notes || undefined,
      status: form.status,
    };
    try {
      if (mode === "create") {
        const created = await api.vehicles.create(payload);
        navigate(`/vehicles/${created.id}`);
      } else if (id) {
        await api.vehicles.update(id, payload);
        navigate(`/vehicles/${id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <p className="text-slate-500">Cargando…</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">
        {mode === "create" ? "Nuevo vehículo" : "Editar vehículo"}
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="Tipo">
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
        >
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {VEHICLE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Alias / nombre *">
        <input
          className={inputClass}
          required
          value={form.alias}
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
          placeholder="p.ej. Coche familiar"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Marca">
          <input
            className={inputClass}
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </Field>
        <Field label="Modelo">
          <input
            className={inputClass}
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Año">
          <input
            className={inputClass}
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </Field>
        <Field label="Matrícula / bastidor">
          <input
            className={inputClass}
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de compra">
          <input
            className={inputClass}
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="Precio de compra (€)">
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Estado">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
        >
          <option value="activo">Activo</option>
          <option value="vendido">Vendido</option>
        </select>
      </Field>

      <Field label="Notas">
        <textarea
          className={inputClass}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
