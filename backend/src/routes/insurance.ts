import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { INSURANCE_TYPES } from "../types.js";

const INSURANCE_STATUSES = ["presupuesto", "activa", "descartada"] as const;

interface InsuranceBody {
  year?: number;
  status?: string;
  company: string;
  policyNumber?: string;
  type: string;
  startDate: string;
  endDate?: string;
  annualCost?: number;
  hasFranchise?: boolean;
  franchiseAmount?: number;
  notes?: string;
}

function validateBody(body: Partial<InsuranceBody>, partial: boolean) {
  if (!partial || body.company !== undefined) {
    if (!body.company || !body.company.trim()) return "company es obligatoria";
  }
  if (!partial || body.type !== undefined) {
    if (!body.type || !INSURANCE_TYPES.includes(body.type as never)) {
      return `type debe ser uno de: ${INSURANCE_TYPES.join(", ")}`;
    }
  }
  if (!partial || body.startDate !== undefined) {
    if (!body.startDate) return "startDate es obligatoria";
  }
  if (body.status !== undefined && !INSURANCE_STATUSES.includes(body.status as never)) {
    return `status debe ser uno de: ${INSURANCE_STATUSES.join(", ")}`;
  }
  return null;
}

export default async function insuranceRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/insurance", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const body = req.body as InsuranceBody;
    const error = validateBody(body, false);
    if (error) return reply.code(400).send({ error });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const startDate = new Date(body.startDate);
    const year = body.year ?? startDate.getFullYear();

    const policy = await prisma.insurancePolicy.create({
      data: {
        vehicleId,
        year,
        status: body.status ?? "presupuesto",
        isSelected: false,
        company: body.company.trim(),
        policyNumber: body.policyNumber?.trim() ?? "",
        type: body.type,
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        annualCost: body.annualCost,
        hasFranchise: body.hasFranchise ?? false,
        franchiseAmount: body.franchiseAmount,
        notes: body.notes,
      },
      include: { documents: true },
    });
    return reply.code(201).send(policy);
  });

  app.put("/api/insurance/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<InsuranceBody>;
    const error = validateBody(body, true);
    if (error) return reply.code(400).send({ error });

    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Póliza no encontrada" });

    const policy = await prisma.insurancePolicy.update({
      where: { id },
      data: {
        ...(body.year !== undefined && { year: body.year }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.company !== undefined && { company: body.company.trim() }),
        ...(body.policyNumber !== undefined && { policyNumber: body.policyNumber.trim() }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.annualCost !== undefined && { annualCost: body.annualCost }),
        ...(body.hasFranchise !== undefined && { hasFranchise: body.hasFranchise }),
        ...(body.franchiseAmount !== undefined && { franchiseAmount: body.franchiseAmount }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { documents: true },
    });
    return policy;
  });

  // Select a quote as winner for its year (deselects all others in the same vehicle+year)
  app.put("/api/insurance/:id/select", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Póliza no encontrada" });

    // Deselect all other quotes for the same vehicle+year
    await prisma.insurancePolicy.updateMany({
      where: { vehicleId: existing.vehicleId, year: existing.year, id: { not: id } },
      data: { isSelected: false },
    });
    // Select and mark as activa
    const policy = await prisma.insurancePolicy.update({
      where: { id },
      data: { isSelected: true, status: "activa" },
      include: { documents: true },
    });
    return policy;
  });

  // Copy selected policy to next year as a new quote
  app.post("/api/insurance/:id/copy-year", async (req, reply) => {
    const { id } = req.params as { id: string };
    const source = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!source) return reply.code(404).send({ error: "Póliza no encontrada" });

    const nextYear = source.year + 1;
    const newStartDate = new Date(source.startDate);
    newStartDate.setFullYear(nextYear);
    const newEndDate = source.endDate ? new Date(source.endDate) : null;
    if (newEndDate) newEndDate.setFullYear(nextYear);

    const copy = await prisma.insurancePolicy.create({
      data: {
        vehicleId: source.vehicleId,
        year: nextYear,
        status: "presupuesto",
        isSelected: false,
        company: source.company,
        policyNumber: "",
        type: source.type,
        startDate: newStartDate,
        endDate: newEndDate ?? undefined,
        annualCost: null,
        notes: source.notes,
      },
      include: { documents: true },
    });
    return reply.code(201).send(copy);
  });

  app.delete("/api/insurance/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Póliza no encontrada" });

    await prisma.insurancePolicy.delete({ where: { id } });
    return reply.code(204).send();
  });
}
