import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4000,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://x-corte-api.codxis.com.br",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 4000,
    host: "0.0.0.0",
    allowedHosts: ["xcorte.app.codxis.com.br"],
  },
});
