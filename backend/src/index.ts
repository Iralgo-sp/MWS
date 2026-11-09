import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import vehicleRoutes from "./routes/vehicles.js";
import maintenanceRoutes from "./routes/maintenance.js";
import insuranceRoutes from "./routes/insurance.js";
import installmentRoutes from "./routes/installments.js";
import documentRoutes from "./routes/documents.js";
import odometerRoutes from "./routes/odometer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  /** Absolute path to built frontend files; enables static serving + SPA fallback. */
  staticDir?: string;
}

export async function startServer(options: ServerOptions = {}) {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(vehicleRoutes);
  await app.register(maintenanceRoutes);
  await app.register(insuranceRoutes);
  await app.register(installmentRoutes);
  await app.register(documentRoutes);
  await app.register(odometerRoutes);

  app.get("/api/health", async () => ({ ok: true }));

  if (options.staticDir) {
    const { default: fastifyStatic } = await import("@fastify/static");
    await app.register(fastifyStatic, {
      root: options.staticDir,
      prefix: "/",
    });
    // SPA fallback: unknown non-API routes → index.html
    app.setNotFoundHandler(async (req, reply) => {
      if (req.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not Found" });
      }
      return reply.sendFile("index.html");
    });
  }

  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(__dirname, "../uploads");
  await mkdir(uploadsDir, { recursive: true });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: "0.0.0.0" });

  return app;
}

// Only run when invoked directly (not imported as a module)
const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
