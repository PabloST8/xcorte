import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy das chamadas /api para o backend em desenvolvimento para evitar CORS
      "/api": {
        target: "https://x-corte-api.hiarley.me",
        changeOrigin: true,
        secure: true,
        // Mantém o prefixo /api porque o backend provavelmente expõe rotas sob /api
      },
    },
  },
});
