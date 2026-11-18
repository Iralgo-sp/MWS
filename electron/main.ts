import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";


// Keep userData consistent between dev and prod (productName changes the default path)
app.setPath("userData", path.join(app.getPath("appData"), "mws"));

const isDev = process.env.NODE_ENV === "development";
const PORT = 3001;
let win: BrowserWindow | null = null;

interface AppSettings { dataDir?: string }

function settingsPath() { return path.join(app.getPath("userData"), "app-settings.json"); }

function readSettings(): AppSettings {
  try { return JSON.parse(readFileSync(settingsPath(), "utf-8")); } catch { return {}; }
}

function writeSettings(s: AppSettings) {
  writeFileSync(settingsPath(), JSON.stringify(s, null, 2), "utf-8");
}

function getDataDir(): string {
  return readSettings().dataDir ?? app.getPath("userData");
}


async function startBackend(): Promise<void> {
  const appPath = app.getAppPath();

  // ── Prisma native engine binary (extraResources, real filesystem) ─────────
  const prismaClientDir = path.join(process.resourcesPath, "backend", "node_modules", ".prisma", "client");
  if (existsSync(prismaClientDir)) {
    const engineFile = readdirSync(prismaClientDir).find((f) => f.endsWith(".node"));
    if (engineFile) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaClientDir, engineFile);
    }
  }

  const dataDir = getDataDir();

  // Prisma/SQLite can't open paths with non-ASCII characters on Windows.
  // If dataDir has accents or special chars, create a directory junction at a safe
  // ASCII path so SQLite can reach the file without encoding issues.
  let dbPath = path.join(dataDir, "mws.db");
  if (/[^\x00-\x7F]/.test(dataDir)) {
    const jctPath = path.join(app.getPath("userData"), "jct");
    try {
      if (existsSync(jctPath)) {
        execSync(`cmd /c rmdir "${jctPath}"`, { windowsHide: true, timeout: 3000 });
      }
      execSync(`cmd /c mklink /J "${jctPath}" "${dataDir}"`, { windowsHide: true, timeout: 3000 });
      dbPath = path.join(jctPath, "mws.db");
    } catch {
      // Junction failed; fall back to userData
      const fallback = path.join(app.getPath("userData"), "mws.db");
      if (existsSync(path.join(dataDir, "mws.db")) && !existsSync(fallback)) {
        copyFileSync(path.join(dataDir, "mws.db"), fallback);
      }
      dbPath = fallback;
    }
  }

  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
  process.env.UPLOADS_DIR = path.join(dataDir, "uploads");
  process.env.PORT = String(PORT);

  // ── Static frontend files are in extraResources (outside ASAR) ───────────
  const staticDir = path.join(process.resourcesPath, "frontend-dist");

  // ── Import ESM bundle from extraResources (real filesystem) ───────────────
  const esmImport = new Function("s", "return import(s)") as (s: string) => Promise<unknown>;
  const backendEntry = path.join(process.resourcesPath, "backend", "dist", "index.mjs");
  const { startServer } = await esmImport(pathToFileURL(backendEntry).href) as {
    startServer: (opts: { staticDir: string }) => Promise<unknown>;
  };
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

ipcMain.handle("app:getDataDir", () => getDataDir());

ipcMain.handle("app:openDataDir", () => shell.openPath(getDataDir()));

ipcMain.handle("app:changeDataDir", async () => {
  const result = await dialog.showOpenDialog(win!, {
    title: "Elegir carpeta de datos",
    defaultPath: getDataDir(),
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };

  const newDir = result.filePaths[0];
  const newDbPath = path.join(newDir, "mws.db");

  // Copy the existing database to the new location (if not already there)
  if (!existsSync(newDbPath)) {
    const currentDataDir = getDataDir();
    // Look for the current DB: via junction if accented, else directly in dataDir or userData
    const candidates = [
      path.join(app.getPath("userData"), "jct", "mws.db"),
      path.join(currentDataDir, "mws.db"),
      path.join(app.getPath("userData"), "mws.db"),
    ];
    const src = candidates.find(existsSync);
    if (src) {
      mkdirSync(newDir, { recursive: true });
      copyFileSync(src, newDbPath);
    }
  }

  writeSettings({ dataDir: newDir });
  app.relaunch();
  app.exit(0);
  return { canceled: false };
});

app.whenReady().then(async () => {
  if (!isDev) {
    try {
      await startBackend();
      // Brief pause for Fastify to finish binding to the port
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
    } catch (err) {
      dialog.showErrorBox(
        "Error al iniciar el servidor",
        String(err instanceof Error ? err.stack : err)
      );
      app.quit();
      return;
    }
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
