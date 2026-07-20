import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { INSURANCE_TYPES } from "../types.js";

interface InsuranceBody {
  company: string;
  policyNumber: string;
  type: string;
  startDate: string;
  endDate?: string;
  annualCost?: number;
  notes?: string;
}

function validateBody(body: Partial<InsuranceBody>, partial: boolean) {
  if (!partial || body.company !== undefined) {
    if (!body.company || !body.company.trim()) return "company es obligatoria";
  }
  if (!partial || body.policyNumber !== undefined) {
    if (!body.policyNumber || !body.policyNumber.trim()) return "policyNumber es obligatorio";
  }
  if (!partial || body.type !== undefined) {
    if (!body.type || !INSURANCE_TYPES.includes(body.type as any)) {
      return `type debe ser uno de: ${INSURANCE_TYPES.join(", ")}`;
    }
  }
  if (!partial || body.startDate !== undefined) {
    if (!body.startDate) return "startDate es obligatoria";
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

    const policy = await prisma.insurancePolicy.create({
      data: {
        vehicleId,
        company: body.company.trim(),
        policyNumber: body.policyNumber.trim(),
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        annualCost: body.annualCost,
        notes: body.notes,
      },
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
        ...body,
        company: body.company?.trim(),
        policyNumber: body.policyNumber?.trim(),
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });
    return policy;
  });

  app.delete("/api/insurance/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Póliza no encontrada" });

    await prisma.insurancePolicy.delete({ where: { id } });
    return reply.code(204).send();
  });
}
