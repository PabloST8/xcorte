// Configuração Firebase para servidor Node.js (sem Vite)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";
import process from "process";

// Carregar variáveis de ambiente do .env
dotenv.config();

// Configurações Firebase - usando variáveis de ambiente padrão (sem prefixo VITE_)
const firebaseConfig = {
  apiKey:
    process.env.FIREBASE_API_KEY || "AIzaSyBvOQi3YvXBVnmR8vJtHMuXM5MEgKa-wq0",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || "xcortes-e6f64.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "xcortes-e6f64",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcd1234efgh5678",
};

console.log("🔥 [Server] Firebase Config:", {
  projectId: firebaseConfig.projectId,
  bucket: firebaseConfig.storageBucket,
  domain: firebaseConfig.authDomain,
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log("🔥 [Server] Firebase inicializado para servidor Node.js");

export { db, storage, auth, app };
