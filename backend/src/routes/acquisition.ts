import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { ACQUISITION_SELLER_TYPES, ACQUISITION_STATUSES } from "../types.js";

interface AcquisitionOfferBody {
  sellerType?: string;
  sellerName: string;
  sellerPhone?: string;
  sellerAddress?: string;
  offerDate: string;
  status?: string;
  listPrice?: number;
  negotiatedPrice?: number;
  tradeInValue?: number;
  taxesFees?: number;
  warrantyMonths?: number;
  includedExtras?: string;
  notes?: string;
}

function validateBody(body: Partial<AcquisitionOfferBody>, partial: boolean) {
  if (!partial || body.sellerName !== undefined) {
    if (!body.sellerName || !body.sellerName.trim()) return "sellerName es obligatorio";
  }
  if (body.sellerType !== undefined && !ACQUISITION_SELLER_TYPES.includes(body.sellerType as never)) {
    return `sellerType debe ser uno de: ${ACQUISITION_SELLER_TYPES.join(", ")}`;
  }
  if (!partial || body.offerDate !== undefined) {
    if (!body.offerDate) return "offerDate es obligatoria";
  }
  if (body.status !== undefined && !ACQUISITION_STATUSES.includes(body.status as never)) {
    return `status debe ser uno de: ${ACQUISITION_STATUSES.join(", ")}`;
  }
  return null;
}

export default async function acquisitionRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/acquisition-offers", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const body = req.body as AcquisitionOfferBody;
    const error = validateBody(body, false);
    if (error) return reply.code(400).send({ error });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const offer = await prisma.acquisitionOffer.create({
      data: {
        vehicleId,
        sellerType: body.sellerType ?? "concesionario",
        sellerName: body.sellerName.trim(),
        sellerPhone: body.sellerPhone,
        sellerAddress: body.sellerAddress,
        offerDate: new Date(body.offerDate),
        status: body.status ?? "en_estudio",
        isSelected: false,
        listPrice: body.listPrice,
        negotiatedPrice: body.negotiatedPrice,
        tradeInValue: body.tradeInValue,
        taxesFees: body.taxesFees,
        warrantyMonths: body.warrantyMonths,
        includedExtras: body.includedExtras,
        notes: body.notes,
      },
      include: { documents: true },
    });
    return reply.code(201).send(offer);
  });

  app.put("/api/acquisition-offers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<AcquisitionOfferBody>;
    const error = validateBody(body, true);
    if (error) return reply.code(400).send({ error });

    const existing = await prisma.acquisitionOffer.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Oferta no encontrada" });

    const offer = await prisma.acquisitionOffer.update({
      where: { id },
      data: {
        ...(body.sellerType !== undefined && { sellerType: body.sellerType }),
        ...(body.sellerName !== undefined && { sellerName: body.sellerName.trim() }),
        ...(body.sellerPhone !== undefined && { sellerPhone: body.sellerPhone }),
        ...(body.sellerAddress !== undefined && { sellerAddress: body.sellerAddress }),
        ...(body.offerDate !== undefined && { offerDate: new Date(body.offerDate) }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.listPrice !== undefined && { listPrice: body.listPrice }),
        ...(body.negotiatedPrice !== undefined && { negotiatedPrice: body.negotiatedPrice }),
        ...(body.tradeInValue !== undefined && { tradeInValue: body.tradeInValue }),
        ...(body.taxesFees !== undefined && { taxesFees: body.taxesFees }),
        ...(body.warrantyMonths !== undefined && { warrantyMonths: body.warrantyMonths }),
        ...(body.includedExtras !== undefined && { includedExtras: body.includedExtras }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { documents: true },
    });
    return offer;
  });

  // Accept an offer as the one actually bought: deselects siblings and copies
  // the key purchase data onto the vehicle (without overwriting an already-set purchaseDate).
  app.put("/api/acquisition-offers/:id/select", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.acquisitionOffer.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Oferta no encontrada" });

    await prisma.acquisitionOffer.updateMany({
      where: { vehicleId: existing.vehicleId, id: { not: id } },
      data: { isSelected: false },
    });
    const offer = await prisma.acquisitionOffer.update({
      where: { id },
      data: { isSelected: true, status: "aceptada" },
      include: { documents: true },
    });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: existing.vehicleId } });
    await prisma.vehicle.update({
      where: { id: existing.vehicleId },
      data: {
        purchasePrice: offer.negotiatedPrice ?? offer.listPrice ?? undefined,
        dealerName: offer.sellerName,
        dealerAddress: offer.sellerAddress ?? undefined,
        purchaseDate: vehicle?.purchaseDate ?? offer.offerDate,
      },
    });

    return offer;
  });

  app.delete("/api/acquisition-offers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.acquisitionOffer.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Oferta no encontrada" });

    await prisma.acquisitionOffer.delete({ where: { id } });
    return reply.code(204).send();
  });
}
