import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

// node:sqlite is built into Node 22.5+ / Electron 33+
interface SqliteDB {
  exec(sql: string): void;
  close(): void;
}
interface SqliteModule {
  DatabaseSync: new (location: string, options?: { open?: boolean }) => SqliteDB;
}

const isDev = process.env.NODE_ENV === "development";
const PORT = 3001;
let win: BrowserWindow | null = null;

/**
 * Initialize SQLite DB from Prisma migration files.
 * Only runs when the database file does not yet exist.
 */
function initDatabase(dbPath: string, migrationsDir: string): void {
  if (existsSync(dbPath)) return;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require("node:sqlite") as SqliteModule;

  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);

  // Prisma migrations tracking table
  db.exec(`
    CREATE TABLE "_prisma_migrations" (
      "id"                  TEXT NOT NULL PRIMARY KEY,
      "checksum"            TEXT NOT NULL,
      "finished_at"         DATETIME,
      "migration_name"      TEXT NOT NULL,
      "logs"                TEXT,
      "rolled_back_at"      DATETIME,
      "started_at"          DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);

  const dirs = readdirSync(migrationsDir).sort();
  for (const dir of dirs) {
    const sqlFile = path.join(migrationsDir, dir, "migration.sql");
    if (!existsSync(sqlFile)) continue;

    const sql = readFileSync(sqlFile, "utf-8");
    db.exec(sql);

    // Record the applied migration
    const id = randomUUID();
    db.exec(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, migration_name, finished_at, applied_steps_count)
       VALUES ('${id}', '', '${dir}', datetime('now'), 1)`
    );
  }

  db.close();
}

async function startBackend(): Promise<void> {
  const appPath = app.getAppPath();
  const userData = app.getPath("userData");

  // ── Prisma native engine binary (asarUnpack) ──────────────────────────────
  const prismaClientDir = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "backend",
    "node_modules",
    ".prisma",
    "client"
  );
  if (existsSync(prismaClientDir)) {
    const engineFile = readdirSync(prismaClientDir).find((f) => f.endsWith(".node"));
    if (engineFile) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaClientDir, engineFile);
    }
  }

  // ── Database in userData so it survives app updates ───────────────────────
  const dbPath = path.join(userData, "mws.db");
  process.env.DATABASE_URL = `file:${dbPath}`;

  // ── Uploads in userData ───────────────────────────────────────────────────
  process.env.UPLOADS_DIR = path.join(userData, "uploads");
  process.env.PORT = String(PORT);

  // ── Initialize DB from migrations if first run ────────────────────────────
  const migrationsDir = path.join(appPath, "backend", "prisma", "migrations");
  initDatabase(dbPath, migrationsDir);

  // ── Static frontend files are in extraResources (outside ASAR) ───────────
  const staticDir = path.join(process.resourcesPath, "frontend-dist");

  // ── Import compiled backend (ESM) dynamically from CJS context ───────────
  const backendEntry = path.join(appPath, "backend", "dist", "index.js");
  const { startServer } = (await import(
    pathToFileURL(backendEntry).href
  )) as { startServer: (opts: { staticDir: string }) => Promise<unknown> };
  await startServer({ staticDir });
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    title: "MWS — Gestión de Vehículos",
    backgroundColor: "#f8fafc",
  });

  const url = isDev ? "http://localhost:5173" : `http://localhost:${PORT}`;
  win.loadURL(url);
  win.once("ready-to-show", () => { win?.maximize(); win?.show(); });
  win.on("closed", () => {
    win = null;
  });
}

ipcMain.on("app:quit", () => app.quit());

app.whenReady().then(async () => {
  if (!isDev) {
    await startBackend();
    // Brief pause for Fastify to finish binding to the port
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
