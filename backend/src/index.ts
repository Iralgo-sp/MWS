import { mkdir } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import vehicleRoutes from "./routes/vehicles.js";
import maintenanceRoutes from "./routes/maintenance.js";
import insuranceRoutes from "./routes/insurance.js";
import acquisitionRoutes from "./routes/acquisition.js";
import installmentRoutes from "./routes/installments.js";
import documentRoutes from "./routes/documents.js";
import odometerRoutes from "./routes/odometer.js";
import dashboardRoutes from "./routes/dashboard.js";
import reportRoutes from "./routes/reports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, "../prisma/migrations");
  if (!existsSync(migrationsDir)) return;

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  TEXT NOT NULL PRIMARY KEY,
        "checksum"            TEXT NOT NULL,
        "finished_at"         DATETIME,
        "migration_name"      TEXT NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      DATETIME,
        "started_at"          DATETIME NOT NULL DEFAULT current_timestamp,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);

    const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;
    const appliedSet = new Set(applied.map((r) => r.migration_name));

    for (const dir of readdirSync(migrationsDir).sort()) {
      if (appliedSet.has(dir)) continue;
      const sqlFile = path.join(migrationsDir, dir, "migration.sql");
      if (!existsSync(sqlFile)) continue;

      const sql = readFileSync(sqlFile, "utf-8");
      for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
        await prisma.$executeRawUnsafe(stmt);
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
         VALUES ('${randomUUID()}', '', '${dir}', datetime('now'), 1)`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

export interface ServerOptions {
  /** Absolute path to built frontend files; enables static serving + SPA fallback. */
  staticDir?: string;
}

export async function startServer(options: ServerOptions = {}) {
  await runMigrations();

  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  await app.register(vehicleRoutes);
  await app.register(maintenanceRoutes);
  await app.register(insuranceRoutes);
  await app.register(acquisitionRoutes);
  await app.register(installmentRoutes);
  await app.register(documentRoutes);
  await app.register(odometerRoutes);
  await app.register(dashboardRoutes);
  await app.register(reportRoutes);

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
