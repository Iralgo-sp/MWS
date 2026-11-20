import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: [
      {
        // Replace any relative import of ./api/client or ../api/client etc.
        // with the HomeCore IPC-based client.
        find: /^(.+)\/api\/client$/,
        replacement: path.resolve(__dirname, "src/api/client.homecore.ts"),
      },
    ],
  },
  define: {
    "import.meta.env.VITE_HOMECORE": '"1"',
  },
  build: {
    outDir:      "../../HomeCore/mws/dist",
    emptyOutDir: true,
  },
});
