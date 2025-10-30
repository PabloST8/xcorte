// Configuração e inicialização do Firebase
// Atualizado para resolver problemas de DNS e garantir funcionamento em produção

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirebaseConfig } from "../config/productionFirebase.js";

console.log("🔧 Inicializando Firebase com config inteligente...");

// Usar configuração inteligente que detecta produção
const firebaseConfig = getFirebaseConfig();

console.log("Firebase Config Final:", {
  projectId: firebaseConfig.projectId,
  bucket: firebaseConfig.storageBucket,
  domain: firebaseConfig.authDomain,
  environment: window.location.hostname,
});

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

console.log(
  "✅ Firebase inicializado com bucket:",
  firebaseConfig.storageBucket
);
