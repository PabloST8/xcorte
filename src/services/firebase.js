// Configuração e inicialização do Firebase
// Preencha as variáveis de ambiente Vite (VITE_*) no seu .env.local
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Normalize storageBucket: it must be like "<projectId>.appspot.com"
const _projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
let _bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
if (_bucket && /\.firebasestorage\.app$/i.test(_bucket)) {
  // User likely copied the download domain instead of bucket name
  const pid = _projectId || _bucket.replace(/\.firebasestorage\.app$/i, "");
  _bucket = `${pid}.appspot.com`;
}
if (!_bucket && _projectId) {
  _bucket = `${_projectId}.appspot.com`;
}

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
