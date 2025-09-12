// Configurações globais da aplicação
// Pode ser sobrescrito via variáveis de ambiente Vite: VITE_USE_REMOTE_API
export const USE_REMOTE_API =
  (import.meta.env.VITE_USE_REMOTE_API || "false").toLowerCase() === "true";

// Endpoint padrão (caso volte a habilitar no futuro)
export const REMOTE_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://x-corte-api.codxis.com.br";

export const APP_BUILD_INFO = {
  buildTime: new Date().toISOString(),
};
