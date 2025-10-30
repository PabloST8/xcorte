// Configuração e inicialização do Firebase
// Atualizado para resolver problemas de DNS com .firebasestorage.app

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

console.log("🔧 Inicializando Firebase...");

// Configuração do bucket - Força uso do .appspot.com para compatibilidade
const _projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// CORREÇÃO: Usar o bucket original .firebasestorage.app já que configuramos CORS nele
let _bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

// Se não especificado, usar o padrão .firebasestorage.app (o bucket real)
if (!_bucket && _projectId) {
  _bucket = `${_projectId}.firebasestorage.app`;
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

console.log("✅ Firebase inicializado com bucket:", _bucket);
