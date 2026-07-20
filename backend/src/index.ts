import Fastify from "fastify";
import cors from "@fastify/cors";
import vehicleRoutes from "./routes/vehicles.js";
import maintenanceRoutes from "./routes/maintenance.js";
import insuranceRoutes from "./routes/insurance.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await app.register(vehicleRoutes);
await app.register(maintenanceRoutes);
await app.register(insuranceRoutes);

app.get("/api/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
// Escucha en 0.0.0.0 para poder acceder desde el móvil en la misma red local.
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
