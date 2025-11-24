// Configuração de produção para Firebase Storage
// Garante que as fotos funcionem em https://agendamentos.codxis.com.br

console.log("🌐 Detectando ambiente de produção...");

// Detectar se estamos em produção
const isProduction = window.location.hostname === "agendamentos.codxis.com.br";
const isLocal = window.location.hostname === "localhost";

console.log("🌐 Ambiente detectado:", {
  hostname: window.location.hostname,
  isProduction,
  isLocal,
  origin: window.location.origin,
});

// Configurações Firebase para produção
const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app", // Bucket com CORS configurado
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:f6ee67ab1ffbdb333d4bd5",
};

// Forçar configuração em produção
if (isProduction) {
  console.log("🚀 PRODUÇÃO: Forçando configuração Firebase correta");

  // Sobrescrever variáveis de ambiente para produção
  window.__FIREBASE_PRODUCTION_CONFIG__ = PRODUCTION_FIREBASE_CONFIG;

  // Definir variáveis globais para garantia
  window.VITE_FIREBASE_PROJECT_ID = PRODUCTION_FIREBASE_CONFIG.projectId;
  window.VITE_FIREBASE_STORAGE_BUCKET =
    PRODUCTION_FIREBASE_CONFIG.storageBucket;
  window.VITE_FIREBASE_AUTH_DOMAIN = PRODUCTION_FIREBASE_CONFIG.authDomain;
  window.VITE_FIREBASE_API_KEY = PRODUCTION_FIREBASE_CONFIG.apiKey;
  window.VITE_FIREBASE_MESSAGING_SENDER_ID =
    PRODUCTION_FIREBASE_CONFIG.messagingSenderId;
  window.VITE_FIREBASE_APP_ID = PRODUCTION_FIREBASE_CONFIG.appId;

  console.log(
    "✅ Configuração de produção aplicada:",
    PRODUCTION_FIREBASE_CONFIG
  );
} else {
  console.log("💻 DESENVOLVIMENTO: Usando configuração padrão");
}

// Função para obter configuração correta
export function getFirebaseConfig() {
  if (isProduction && window.__FIREBASE_PRODUCTION_CONFIG__) {
    console.log("📱 Retornando config de produção");
    return window.__FIREBASE_PRODUCTION_CONFIG__;
  }

  // Configuração padrão (desenvolvimento)
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

// Validar configuração
const currentConfig = getFirebaseConfig();
console.log("🔧 Configuração Firebase final:", currentConfig);

// Verificar se bucket está correto
if (
  currentConfig.storageBucket &&
  currentConfig.storageBucket.includes(".firebasestorage.app")
) {
  console.log("✅ Bucket correto para CORS:", currentConfig.storageBucket);
} else {
  console.warn(
    "⚠️ Bucket pode ter problemas de CORS:",
    currentConfig.storageBucket
  );
}

export { isProduction, isLocal, PRODUCTION_FIREBASE_CONFIG };
