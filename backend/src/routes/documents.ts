import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

const UPLOADS_ROOT = path.resolve("uploads");

function vehicleUploadDir(vehicleId: string) {
  return path.join(UPLOADS_ROOT, vehicleId);
}

export default async function documentRoutes(app: FastifyInstance) {
  app.post("/api/vehicles/:vehicleId/documents", async (req, reply) => {
    const { vehicleId } = req.params as { vehicleId: string };
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return reply.code(404).send({ error: "Vehículo no encontrado" });

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
        label: label.trim(),
        originalName: fileInfo.filename,
        storedFilename,
        mimeType: fileInfo.mimeType,
        size: fileInfo.buffer.length,
      },
    });
    return reply.code(201).send(document);
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
