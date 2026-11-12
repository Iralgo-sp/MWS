import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useConfirm } from "./ConfirmDialog";
import type { AcquisitionOffer, AcquisitionSellerType } from "../api/types";
import {
  ACQUISITION_SELLER_TYPE_LABELS,
  ACQUISITION_SELLER_TYPES,
  formatNumber,
  inputClass,
} from "../constants";
import RecordAttachments from "./RecordAttachments";

const emptyForm = {
  sellerType: "concesionario" as AcquisitionSellerType,
  sellerName: "",
  sellerPhone: "",
  sellerAddress: "",
  offerDate: "",
  listPrice: "",
  negotiatedPrice: "",
  tradeInValue: "",
  taxesFees: "",
  warrantyMonths: "",
  includedExtras: "",
  notes: "",
};

type OfferForm = typeof emptyForm;

function offerToForm(o: AcquisitionOffer): OfferForm {
  return {
    sellerType: o.sellerType,
    sellerName: o.sellerName,
    sellerPhone: o.sellerPhone ?? "",
    sellerAddress: o.sellerAddress ?? "",
    offerDate: o.offerDate.slice(0, 10),
    listPrice: o.listPrice != null ? String(o.listPrice) : "",
    negotiatedPrice: o.negotiatedPrice != null ? String(o.negotiatedPrice) : "",
    tradeInValue: o.tradeInValue != null ? String(o.tradeInValue) : "",
    taxesFees: o.taxesFees != null ? String(o.taxesFees) : "",
    warrantyMonths: o.warrantyMonths != null ? String(o.warrantyMonths) : "",
    includedExtras: o.includedExtras ?? "",
    notes: o.notes ?? "",
  };
}

function operationCost(o: { listPrice?: number | null; negotiatedPrice?: number | null; tradeInValue?: number | null; taxesFees?: number | null }) {
  const base = o.negotiatedPrice ?? o.listPrice;
  if (base == null) return null;
  return base + (o.taxesFees ?? 0) - (o.tradeInValue ?? 0);
}

function OfferFormFields({
  form,
  setForm,
  onSubmit,
  onCancel,
  error,
  submitLabel,
}: {
  form: OfferForm;
  setForm: (f: OfferForm) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        <select
          className={inputClass}
          value={form.sellerType}
          onChange={(e) => setForm({ ...form, sellerType: e.target.value as AcquisitionSellerType })}
        >
          {ACQUISITION_SELLER_TYPES.map((t) => (
            <option key={t} value={t}>{ACQUISITION_SELLER_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <input
          required
          placeholder="Nombre del vendedor *"
          className={`${inputClass} col-span-2`}
          value={form.sellerName}
          onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="date"
          required
          className={inputClass}
          value={form.offerDate}
          onChange={(e) => setForm({ ...form, offerDate: e.target.value })}
        />
        <input
          placeholder="Teléfono"
          className={inputClass}
          value={form.sellerPhone}
          onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })}
        />
        <input
          placeholder="Dirección"
          className={inputClass}
          value={form.sellerAddress}
          onChange={(e) => setForm({ ...form, sellerAddress: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <input
          placeholder="Precio de lista (€)"
          type="number" step="0.01"
          className={inputClass}
          value={form.listPrice}
          onChange={(e) => setForm({ ...form, listPrice: e.target.value })}
        />
        <input
          placeholder="Precio negociado (€)"
          type="number" step="0.01"
          className={inputClass}
          value={form.negotiatedPrice}
          onChange={(e) => setForm({ ...form, negotiatedPrice: e.target.value })}
        />
        <input
          placeholder="Entrega/tasación (€)"
          type="number" step="0.01"
          className={inputClass}
          value={form.tradeInValue}
          onChange={(e) => setForm({ ...form, tradeInValue: e.target.value })}
        />
        <input
          placeholder="Imp. + gestoría (€)"
          type="number" step="0.01"
          className={inputClass}
          value={form.taxesFees}
          onChange={(e) => setForm({ ...form, taxesFees: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          placeholder="Garantía (meses)"
          type="number"
          className={inputClass}
          value={form.warrantyMonths}
          onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })}
        />
        <input
          placeholder="Extras incluidos"
          className={`${inputClass} col-span-2`}
          value={form.includedExtras}
          onChange={(e) => setForm({ ...form, includedExtras: e.target.value })}
        />
      </div>

      <textarea
        placeholder="Condiciones / notas"
        className={inputClass}
        rows={2}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AcquisitionSection({
  vehicleId,
  offers,
  onChange,
}: {
  vehicleId: string;
  offers: AcquisitionOffer[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OfferForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const confirmDialog = useConfirm();

  const accepted = offers.find((o) => o.isSelected);

  const costs = offers.map((o) => operationCost(o)).filter((c): c is number => c != null);
  const cheapest = costs.length > 1 ? Math.min(...costs) : null;

  function buildPayload(f: OfferForm) {
    return {
      sellerType: f.sellerType,
      sellerName: f.sellerName.trim(),
      sellerPhone: f.sellerPhone || undefined,
      sellerAddress: f.sellerAddress || undefined,
      offerDate: f.offerDate,
      listPrice: f.listPrice ? Number(f.listPrice) : undefined,
      negotiatedPrice: f.negotiatedPrice ? Number(f.negotiatedPrice) : undefined,
      tradeInValue: f.tradeInValue ? Number(f.tradeInValue) : undefined,
      taxesFees: f.taxesFees ? Number(f.taxesFees) : undefined,
      warrantyMonths: f.warrantyMonths ? Number(f.warrantyMonths) : undefined,
      includedExtras: f.includedExtras || undefined,
      notes: f.notes || undefined,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.acquisitionOffers.create(vehicleId, buildPayload(form));
      setForm(emptyForm);
      setShowForm(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(o: AcquisitionOffer) {
    setShowForm(false);
    setEditingId(o.id);
    setEditForm(offerToForm(o));
    setError(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      await api.acquisitionOffers.update(editingId, buildPayload(editForm));
      setEditingId(null);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirmDialog({ message: "¿Eliminar esta oferta?", confirmLabel: "Eliminar" }))) return;
    await api.acquisitionOffers.remove(id);
    onChange();
  }

  async function handleAccept(id: string) {
    const ok = await confirmDialog({
      message: "¿Marcar esta oferta como la compra realizada? Se actualizarán los datos de compra del vehículo.",
      confirmLabel: "Marcar como comprada",
      danger: false,
    });
    if (!ok) return;
    await api.acquisitionOffers.select(id);
    onChange();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Proceso de adquisición</h2>
          {accepted && (
            <p className="text-xs text-teal-700 font-medium mt-0.5">
              Comprado a {accepted.sellerName}
              {operationCost(accepted) != null ? ` · ${formatNumber(operationCost(accepted)!)} € (coste real)` : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setError(null);
            setShowForm((s) => !s);
          }}
          className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Añadir oferta"}
        </button>
      </div>

      {showForm && (
        <OfferFormFields
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          error={error}
          submitLabel="Guardar"
        />
      )}

      {offers.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Sin ofertas registradas. Añade cada concesionario o particular que ofrezcas comparar antes de decidir.
        </p>
      )}

      <ul className="space-y-2">
        {offers.map((o) =>
          editingId === o.id ? (
            <li key={o.id}>
              <OfferFormFields
                form={editForm}
                setForm={setEditForm}
                onSubmit={handleUpdate}
                onCancel={() => setEditingId(null)}
                error={error}
                submitLabel="Guardar cambios"
              />
            </li>
          ) : (
            <li
              key={o.id}
              className={`rounded-lg border overflow-hidden ${
                o.isSelected ? "border-teal-300 bg-teal-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {ACQUISITION_SELLER_TYPE_LABELS[o.sellerType]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(o.offerDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {o.isSelected && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-600 text-white">
                        Comprado aquí
                      </span>
                    )}
                    {!o.isSelected && cheapest != null && operationCost(o) === cheapest && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Más barata
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {o.sellerName}
                    {o.sellerPhone ? ` · ${o.sellerPhone}` : ""}
                  </p>
                  {o.sellerAddress && <p className="text-xs text-slate-500 mt-0.5">{o.sellerAddress}</p>}

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-slate-600">
                    {o.listPrice != null && <span>Lista: {formatNumber(o.listPrice)} €</span>}
                    {o.negotiatedPrice != null && (
                      <span className="font-medium text-slate-800">Negociado: {formatNumber(o.negotiatedPrice)} €</span>
                    )}
                    {o.tradeInValue != null && <span>Entrega: −{formatNumber(o.tradeInValue)} €</span>}
                    {o.taxesFees != null && <span>Imp./gestoría: +{formatNumber(o.taxesFees)} €</span>}
                    {o.warrantyMonths != null && <span>Garantía: {o.warrantyMonths} meses</span>}
                  </div>
                  {operationCost(o) != null && (
                    <p className="text-sm font-semibold text-slate-900 mt-1.5">
                      Coste real de la operación: {formatNumber(operationCost(o)!)} €
                    </p>
                  )}
                  {o.includedExtras && <p className="text-xs text-slate-500 mt-1">Extras: {o.includedExtras}</p>}
                  {o.notes && <p className="text-xs text-slate-500 mt-0.5">{o.notes}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {!o.isSelected && (
                    <button
                      onClick={() => handleAccept(o.id)}
                      className="text-xs text-teal-600 hover:text-teal-500 font-medium whitespace-nowrap"
                    >
                      Marcar como comprada
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(o)} className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(o.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3 border-t border-slate-100 pt-2">
                <RecordAttachments
                  documents={o.documents}
                  buttonLabel="+ Adjuntar documento"
                  onUpload={(file) => api.documents.uploadToAcquisitionOffer(o.id, file, file.name)}
                  onChange={onChange}
                />
              </div>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
