// Configurações globais da aplicação
// Para produção, forçar API remota como TRUE

// Debug da configuração
console.log("🔧 [config.js] Variáveis de ambiente do Vite:");
console.log(
  "🔧 [config.js] VITE_USE_REMOTE_API:",
  import.meta.env.VITE_USE_REMOTE_API
);
console.log("🔧 [config.js] MODE:", import.meta.env.MODE);
console.log("🔧 [config.js] PROD:", import.meta.env.PROD);

// Para produção, sempre usar API remota
// Para desenvolvimento, pode ser controlado via VITE_USE_REMOTE_API
export const USE_REMOTE_API = import.meta.env.PROD
  ? true // Sempre TRUE em produção
  : (import.meta.env.VITE_USE_REMOTE_API || "false").toLowerCase() === "true";

console.log("🔧 [config.js] USE_REMOTE_API final:", USE_REMOTE_API);

// Endpoint padrão - incluindo /api
export const REMOTE_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://x-corte-api.codxis.com.br/api";

console.log("🔧 [config.js] REMOTE_API_BASE_URL final:", REMOTE_API_BASE_URL);

export const APP_BUILD_INFO = {
  buildTime: new Date().toISOString(),
};
