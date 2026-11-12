import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../prisma.js";

const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? path.resolve("uploads");

function vehicleUploadDir(vehicleId: string) {
  return path.join(UPLOADS_ROOT, vehicleId);
}

async function handleUpload(
  req: FastifyRequest,
  reply: FastifyReply,
  vehicleId: string,
  extra: { maintenanceRecordId?: string; insurancePolicyId?: string; acquisitionOfferId?: string },
) {
  let label: string | undefined;
  let fileInfo: { filename: string; mimeType: string; buffer: Buffer } | undefined;

  for await (const part of req.parts()) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      fileInfo = { filename: part.filename, mimeType: part.mimetype, buffer };
    } else if (part.fieldname === "label") {
      label = part.value as string;
    }
  }

  if (!fileInfo) return reply.code(400).send({ error: "Falta el fichero" });
  if (!label || !label.trim()) return reply.code(400).send({ error: "label es obligatoria" });

  const safeName = path.basename(fileInfo.filename).replace(/[^\w.\-]/g, "_");
  const storedFilename = `${randomUUID()}-${safeName}`;
  const dir = vehicleUploadDir(vehicleId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedFilename), fileInfo.buffer);

  const document = await prisma.document.create({
    data: {
      vehicleId,
      maintenanceRecordId: extra.maintenanceRecordId,
      insurancePolicyId: extra.insurancePolicyId,
      acquisitionOfferId: extra.acquisitionOfferId,
      label: label.trim(),
      originalName: fileInfo.filename,
      storedFilename,
      mimeType: fileInfo.mimeType,
      size: fileInfo.buffer.length,
    },
  });
  return reply.code(201).send(document);
}

export default async function documentRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/documents", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

    return handleUpload(req, reply, vehicleId, {});
  });

  app.post("/api/maintenance/:id/documents", async (req, reply) => {
    const { id } = req.params as { id: string };
    const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) return reply.code(404).send({ error: "Registro no encontrado" });

    return handleUpload(req, reply, record.vehicleId, { maintenanceRecordId: id });
  });

  app.post("/api/insurance/:id/documents", async (req, reply) => {
    const { id } = req.params as { id: string };
    const policy = await prisma.insurancePolicy.findUnique({ where: { id } });
    if (!policy) return reply.code(404).send({ error: "Póliza no encontrada" });

    return handleUpload(req, reply, policy.vehicleId, { insurancePolicyId: id });
  });

  app.post("/api/acquisition-offers/:id/documents", async (req, reply) => {
    const { id } = req.params as { id: string };
    const offer = await prisma.acquisitionOffer.findUnique({ where: { id } });
    if (!offer) return reply.code(404).send({ error: "Oferta no encontrada" });

    return handleUpload(req, reply, offer.vehicleId, { acquisitionOfferId: id });
  });

  app.get("/api/documents/:id/download", async (req, reply) => {
    const { id } = req.params as { id: string };
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return reply.code(404).send({ error: "Documento no encontrado" });

    const filePath = path.join(vehicleUploadDir(document.vehicleId), document.storedFilename);
    reply.header(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
    );
    reply.type(document.mimeType);
    return reply.send(createReadStream(filePath));
  });

  app.delete("/api/documents/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return reply.code(404).send({ error: "Documento no encontrado" });

    await prisma.document.delete({ where: { id } });
    await unlink(path.join(vehicleUploadDir(document.vehicleId), document.storedFilename)).catch(
      () => {},
    );
    return reply.code(204).send();
  });
}
