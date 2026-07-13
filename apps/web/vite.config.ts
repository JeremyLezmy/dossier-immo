import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: [],
      manifest: {
        name: "Dossier Immo",
        short_name: "Dossier Immo",
        description: "Création locale d'un dossier bancaire immobilier.",
        theme_color: "#17324d",
        background_color: "#f4f7fb",
        display: "standalone",
        lang: "fr",
        start_url: "./",
      },
      workbox: {
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (["html2canvas", "css-line-break", "text-segmentation"].some((dependency) => id.includes(dependency)))
            return "pdf-canvas";
          if (["jspdf", "dompurify", "canvg", "fflate", "fast-png", "rgbcolor"].some((dependency) => id.includes(dependency)))
            return "pdf-writer";
          if (id.includes("react") || id.includes("scheduler")) return "react";
          if (id.includes("zod") || id.includes("hookform")) return "forms";
          if (id.includes("dexie")) return "persistence";
          if (id.includes("lucide")) return "icons";
          return "vendor";
        },
      },
    },
  },
});
