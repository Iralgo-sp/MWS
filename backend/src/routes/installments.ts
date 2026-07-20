import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

interface InstallmentBody {
  paymentDate: string;
  installmentNumber?: number;
  principalAmount?: number;
  interestAmount?: number;
  totalAmount?: number;
  notes?: string;
}

function validateBody(body: Partial<InstallmentBody>, partial: boolean) {
  if (!partial || body.paymentDate !== undefined) {
    if (!body.paymentDate) return "paymentDate es obligatoria";
  }
  return null;
}

export default async function installmentRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/installments", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const body = req.body as InstallmentBody;
    const error = validateBody(body, false);
    if (error) return reply.code(400).send({ error });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const installment = await prisma.installment.create({
      data: {
        vehicleId,
        paymentDate: new Date(body.paymentDate),
        installmentNumber: body.installmentNumber,
        principalAmount: body.principalAmount,
        interestAmount: body.interestAmount,
        totalAmount: body.totalAmount,
        notes: body.notes,
      },
    });
    return reply.code(201).send(installment);
  });

  app.put("/api/installments/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<InstallmentBody>;
    const error = validateBody(body, true);
    if (error) return reply.code(400).send({ error });

    const existing = await prisma.installment.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Cuota no encontrada" });

    const installment = await prisma.installment.update({
      where: { id },
      data: {
        ...body,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      },
    });
    return installment;
  });

  app.delete("/api/installments/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.installment.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Cuota no encontrada" });

    await prisma.installment.delete({ where: { id } });
    return reply.code(204).send();
  });
}
