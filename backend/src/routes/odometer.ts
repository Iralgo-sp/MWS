import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

interface OdometerBody {
  date: string;
  mileage: number;
  notes?: string;
}

export default async function odometerRoutes(app: FastifyInstance) {
  app.get("/api/vehicles/:vehicleId/odometer", async (req) => {
    const { vehicleId } = req.params as { vehicleId: string };
    return prisma.odometerReading.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
    });
  });

  app.post("/api/vehicles/:vehicleId/odometer", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const body = req.body as OdometerBody;
    if (!body.date) return reply.code(400).send({ error: "date es obligatorio" });
    if (!body.mileage || body.mileage <= 0)
      return reply.code(400).send({ error: "mileage debe ser un número positivo" });

    const reading = await prisma.odometerReading.create({
      data: {
        vehicleId,
        date: new Date(body.date),
        mileage: body.mileage,
        notes: body.notes,
      },
    });
    return reply.code(201).send(reading);
  });

  app.put("/api/odometer/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<OdometerBody>;

    const existing = await prisma.odometerReading.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Lectura no encontrada" });

    const reading = await prisma.odometerReading.update({
      where: { id },
      data: {
        ...(body.date ? { date: new Date(body.date) } : {}),
        ...(body.mileage ? { mileage: body.mileage } : {}),
        notes: body.notes ?? existing.notes,
      },
    });
    return reading;
  });

  app.delete("/api/odometer/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.odometerReading.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Lectura no encontrada" });

    await prisma.odometerReading.delete({ where: { id } });
    return reply.code(204).send();
  });
}
