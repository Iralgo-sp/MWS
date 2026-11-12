import path from "node:path";
import { createReadStream } from "node:fs";
import { mkdir, rm, unlink, writeFile } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";
import { VEHICLE_TYPES, VEHICLE_STATUSES, PAYMENT_METHODS } from "../types.js";

const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? path.resolve("uploads");
const COVER_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
};

interface VehicleBody {
  type: string;
  alias: string;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  chassis?: string;
  color?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  status?: string;
  dealerName?: string;
  dealerAddress?: string;
  dealerAgent?: string;
  paymentMethod?: string;
  financingLender?: string;
  financingAmount?: number;
  financingInterestRate?: number;
  financingTermMonths?: number;
  financingNotes?: string;
  nextItv?: string | null;
  serviceIntervalKm?: number | null;
}

function validateVehicleBody(body: Partial<VehicleBody>, partial: boolean) {
  if (!partial || body.type !== undefined) {
    if (!body.type || !VEHICLE_TYPES.includes(body.type as any)) {
      return `type debe ser uno de: ${VEHICLE_TYPES.join(", ")}`;
    }
  }
  if (!partial || body.alias !== undefined) {
    if (!body.alias || !body.alias.trim()) {
      return "alias es obligatorio";
    }
  }
  if (body.status !== undefined && !VEHICLE_STATUSES.includes(body.status as any)) {
    return `status debe ser uno de: ${VEHICLE_STATUSES.join(", ")}`;
  }
  if (body.paymentMethod !== undefined && !PAYMENT_METHODS.includes(body.paymentMethod as any)) {
    return `paymentMethod debe ser uno de: ${PAYMENT_METHODS.join(", ")}`;
  }
  return null;
}

export default async function vehicleRoutes(app: FastifyInstance) {
  app.get("/api/vehicles", async () => {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { maintenanceRecords: true, insurancePolicies: true, installments: true, documents: true },
        },
      },
    });
    return vehicles;
  });

  app.get("/api/vehicles/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        maintenanceRecords: {
          orderBy: { date: "desc" },
          include: { documents: { orderBy: { uploadedAt: "desc" } } },
        },
        insurancePolicies: {
          orderBy: { startDate: "desc" },
          include: { documents: { orderBy: { uploadedAt: "desc" } } },
        },
        installments: { orderBy: { paymentDate: "desc" } },
        odometerReadings: { orderBy: { date: "desc" } },
        acquisitionOffers: {
          orderBy: { offerDate: "desc" },
          include: { documents: { orderBy: { uploadedAt: "desc" } } },
        },
        documents: {
          where: { maintenanceRecordId: null, insurancePolicyId: null, acquisitionOfferId: null },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });
    return vehicle;
  });

  app.post("/api/vehicles", async (req, reply) => {
    const body = req.body as VehicleBody;
    const error = validateVehicleBody(body, false);
    if (error) return reply.code(400).send({ error });

    const vehicle = await prisma.vehicle.create({
      data: {
        type: body.type,
        alias: body.alias.trim(),
        brand: body.brand,
        model: body.model,
        year: body.year,
        plate: body.plate,
        chassis: body.chassis,
        color: body.color,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        notes: body.notes,
        status: body.status ?? "activo",
        dealerName: body.dealerName,
        dealerAddress: body.dealerAddress,
        dealerAgent: body.dealerAgent,
        paymentMethod: body.paymentMethod ?? "contado",
        financingLender: body.financingLender,
        financingAmount: body.financingAmount,
        financingInterestRate: body.financingInterestRate,
        financingTermMonths: body.financingTermMonths,
        financingNotes: body.financingNotes,
        nextItv: body.nextItv ? new Date(body.nextItv) : undefined,
        serviceIntervalKm: body.serviceIntervalKm,
      },
    });
    return reply.code(201).send(vehicle);
  });

  app.put("/api/vehicles/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<VehicleBody>;
    const error = validateVehicleBody(body, true);
    if (error) return reply.code(400).send({ error });

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Vehículo no encontrado" });

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...body,
        alias: body.alias?.trim(),
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : body.purchaseDate,
        nextItv: body.nextItv ? new Date(body.nextItv) : body.nextItv,
      },
    });
    return vehicle;
  });

  app.delete("/api/vehicles/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Vehículo no encontrado" });

    await prisma.vehicle.delete({ where: { id } });
    await rm(path.resolve("uploads", id), { recursive: true, force: true });
    return reply.code(204).send();
  });

  app.post("/api/vehicles/:id/cover", async (req, reply) => {
    const { id } = req.params as { id: string };
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    let fileInfo: { filename: string; mimeType: string; buffer: Buffer } | undefined;
    for await (const part of req.parts()) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
        fileInfo = { filename: part.filename, mimeType: part.mimetype, buffer };
      }
    }
    if (!fileInfo) return reply.code(400).send({ error: "Falta el fichero" });
    if (!fileInfo.mimeType.startsWith("image/")) return reply.code(400).send({ error: "El fichero debe ser una imagen" });

    if (vehicle.coverImage) {
      await unlink(path.join(UPLOADS_ROOT, id, vehicle.coverImage)).catch(() => {});
    }

    const ext = path.extname(fileInfo.filename).toLowerCase() || ".jpg";
    const coverFilename = `cover${ext}`;
    const dir = path.join(UPLOADS_ROOT, id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, coverFilename), fileInfo.buffer);

    const updated = await prisma.vehicle.update({ where: { id }, data: { coverImage: coverFilename } });
    return { coverImage: updated.coverImage };
  });

  app.get("/api/vehicles/:id/cover", async (req, reply) => {
    const { id } = req.params as { id: string };
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { coverImage: true } });
    if (!vehicle?.coverImage) return reply.code(404).send({ error: "Sin foto" });

    const filePath = path.join(UPLOADS_ROOT, id, vehicle.coverImage);
    const ext = path.extname(vehicle.coverImage).toLowerCase();
    reply.type(COVER_MIME_TYPES[ext] ?? "image/jpeg");
    return reply.send(createReadStream(filePath));
  });

  app.delete("/api/vehicles/:id/cover", async (req, reply) => {
    const { id } = req.params as { id: string };
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    if (vehicle.coverImage) {
      await unlink(path.join(UPLOADS_ROOT, id, vehicle.coverImage)).catch(() => {});
      await prisma.vehicle.update({ where: { id }, data: { coverImage: null } });
    }
    return reply.code(204).send();
  });
}
