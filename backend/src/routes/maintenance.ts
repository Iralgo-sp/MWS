import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { MAINTENANCE_TYPES } from "../types.js";

interface MaintenanceBody {
  date: string;
  type: string;
  description: string;
  cost?: number;
  workshop?: string;
  mileage?: number;
}

function validateBody(body: Partial<MaintenanceBody>, partial: boolean) {
  if (!partial || body.date !== undefined) {
    if (!body.date) return "date es obligatoria";
  }
  if (!partial || body.type !== undefined) {
    if (!body.type || !MAINTENANCE_TYPES.includes(body.type as any)) {
      return `type debe ser uno de: ${MAINTENANCE_TYPES.join(", ")}`;
    }
  }
  if (!partial || body.description !== undefined) {
    if (!body.description || !body.description.trim()) return "description es obligatoria";
  }
  return null;
}

export default async function maintenanceRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/maintenance", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const body = req.body as MaintenanceBody;
    const error = validateBody(body, false);
    if (error) return reply.code(400).send({ error });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        date: new Date(body.date),
        type: body.type,
        description: body.description.trim(),
        cost: body.cost,
        workshop: body.workshop,
        mileage: body.mileage,
      },
    });
    return reply.code(201).send(record);
  });

  app.put("/api/maintenance/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<MaintenanceBody>;
    const error = validateBody(body, true);
    if (error) return reply.code(400).send({ error });

    const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Registro no encontrado" });

    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data: {
        ...body,
        description: body.description?.trim(),
        date: body.date ? new Date(body.date) : undefined,
      },
    });
    return record;
  });

  app.delete("/api/maintenance/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Registro no encontrado" });

    await prisma.maintenanceRecord.delete({ where: { id } });
    return reply.code(204).send();
  });
}
