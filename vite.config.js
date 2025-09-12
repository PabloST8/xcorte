import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4000,           // Define a porta como 4000
    host: '0.0.0.0',      // Permite acesso externo (todas as interfaces)
    strictPort: true,     // Falha se a porta 4000 estiver ocupada
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
  preview: {
    port: 4000,
    host: '0.0.0.0',
  },
});
