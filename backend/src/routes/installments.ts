import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

interface InstallmentBody {
  paymentDate: string;
  concept?: string;
  isPaid?: boolean;
  installmentNumber?: number;
  principalAmount?: number;
  interestAmount?: number;
  totalAmount?: number;
  remainingBalance?: number;
  notes?: string;
}

interface BatchInstallmentBody {
  installments: InstallmentBody[];
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
        concept: body.concept ?? "cuota",
        isPaid: body.isPaid ?? false,
        installmentNumber: body.installmentNumber,
        principalAmount: body.principalAmount,
        interestAmount: body.interestAmount,
        totalAmount: body.totalAmount,
        remainingBalance: body.remainingBalance,
        notes: body.notes,
      },
    });
    return reply.code(201).send(installment);
  });

  // Batch create (amortization schedule generation)
  app.post("/api/vehicles/:vehicleId/installments/batch", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const { installments } = req.body as BatchInstallmentBody;
    if (!Array.isArray(installments) || installments.length === 0) {
      return reply.code(400).send({ error: "installments array required" });
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const created = await prisma.$transaction(
      installments.map((item) =>
        prisma.installment.create({
          data: {
            vehicleId,
            paymentDate: new Date(item.paymentDate),
            concept: item.concept ?? "cuota",
            isPaid: item.isPaid ?? false,
            installmentNumber: item.installmentNumber,
            principalAmount: item.principalAmount,
            interestAmount: item.interestAmount,
            totalAmount: item.totalAmount,
            remainingBalance: item.remainingBalance,
            notes: item.notes,
          },
        })
      )
    );
    return reply.code(201).send(created);
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
        ...(body.paymentDate !== undefined && { paymentDate: new Date(body.paymentDate) }),
        ...(body.concept !== undefined && { concept: body.concept }),
        ...(body.isPaid !== undefined && { isPaid: body.isPaid }),
        ...(body.installmentNumber !== undefined && { installmentNumber: body.installmentNumber }),
        ...(body.principalAmount !== undefined && { principalAmount: body.principalAmount }),
        ...(body.interestAmount !== undefined && { interestAmount: body.interestAmount }),
        ...(body.totalAmount !== undefined && { totalAmount: body.totalAmount }),
        ...(body.remainingBalance !== undefined && { remainingBalance: body.remainingBalance }),
        ...(body.notes !== undefined && { notes: body.notes }),
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

  // Delete all installments of a vehicle (to regenerate amortization)
  app.delete("/api/vehicles/:vehicleId/installments", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const { conceptFilter } = req.query as { conceptFilter?: string };
    const where = conceptFilter
      ? { vehicleId, concept: conceptFilter }
      : { vehicleId };
    await prisma.installment.deleteMany({ where });
    return reply.code(204).send();
  });
}
