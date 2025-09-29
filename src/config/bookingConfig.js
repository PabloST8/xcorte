/**
 * Configuração para alternar entre Firestore e API
 */

// Configuração: true = usar API, false = usar Firestore
export const USE_BOOKING_API = true;

// URL da API
export const BOOKING_API_URL = "https://x-corte-api.codxis.com.br/api";

// Log da configuração atual
console.log("🔧 [BookingConfig]", {
  useAPI: USE_BOOKING_API,
  apiUrl: USE_BOOKING_API ? BOOKING_API_URL : "Firestore direto",
  timestamp: new Date().toISOString(),
});

export default {
  USE_BOOKING_API,
  BOOKING_API_URL,
};
