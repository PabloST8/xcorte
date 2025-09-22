// Configuração e inicialização do Firebase
// Atualizado para setembro 2025 - Suporte para novos domínios .firebasestorage.app

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Configuração do bucket - Suporta tanto .appspot.com quanto .firebasestorage.app
const _projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
let _bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

// Se não especificado, usa o padrão
if (!_bucket && _projectId) {
  _bucket = `${_projectId}.appspot.com`;
}

console.log("Firebase Config:", {
  projectId: _projectId,
  bucket: _bucket,
  domain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: _projectId,
  storageBucket: _bucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Log para debug
console.log("Firebase inicializado com bucket:", _bucket);
