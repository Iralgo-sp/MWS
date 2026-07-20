import { mkdir } from "node:fs/promises";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import vehicleRoutes from "./routes/vehicles.js";
import maintenanceRoutes from "./routes/maintenance.js";
import insuranceRoutes from "./routes/insurance.js";
import installmentRoutes from "./routes/installments.js";
import documentRoutes from "./routes/documents.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por documento
});

await app.register(vehicleRoutes);
await app.register(maintenanceRoutes);
await app.register(insuranceRoutes);
await app.register(installmentRoutes);
await app.register(documentRoutes);

app.get("/api/health", async () => ({ ok: true }));

await mkdir(path.resolve("uploads"), { recursive: true });

const port = Number(process.env.PORT ?? 3001);
// Escucha en 0.0.0.0 para poder acceder desde el móvil en la misma red local.
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
