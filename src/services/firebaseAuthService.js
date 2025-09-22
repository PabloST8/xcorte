// Serviço de autenticação Firebase (email/senha) + helpers de token
// Usa as variáveis VITE_FIREBASE_* já configuradas e o db exportado em firebase.js
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

const auth = getAuth();

async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  // Documento de usuário é indexado pelo email (padrão atual do projeto)
  let userDocData = null;
  try {
    // Tenta buscar por ID = email (padrão antigo)
    const ref = doc(db, "users", email);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      userDocData = snap.data();
    } else {
      // Fallback: consultar por campo email
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        limit(1)
      );
      const qs = await getDocs(q);
      if (!qs.empty) userDocData = qs.docs[0].data();
    }
  } catch (e) {
    console.warn("[firebaseAuthService] Falha ao buscar doc de usuário:", e);
  }
  const mergedUser = {
    uid: cred.user.uid,
    email: cred.user.email,
    ...userDocData,
  };
  return { user: mergedUser, token: idToken };
}

// Cria usuário de cliente no Firebase Auth e documento em 'users'
async function signUp(email, password, extraData = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  const baseDoc = {
    email,
    role: "client",
    status: "active",
    createdAt: new Date().toISOString(),
    ...extraData,
  };
  try {
    await setDoc(doc(db, "users", email), baseDoc, { merge: true });
  } catch (e) {
    console.error("[firebaseAuthService] Falha ao criar doc de usuário:", e);
  }
  return { user: { uid: cred.user.uid, email, ...baseDoc }, token: idToken };
}

async function getCurrentUserToken(forceRefresh = false) {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}

function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

async function doSignOut() {
  await signOut(auth);
}

// Login específico para admin com validação de role
async function adminSignIn(email, password) {
  const result = await signIn(email, password);

  // Verificar se o usuário tem role de admin
  if (result.user.role !== "admin" && result.user.role !== "owner") {
    await signOut(auth); // Deslogar se não for admin
    throw new Error(
      "Acesso negado. Apenas administradores podem acessar esta área."
    );
  }

  return result;
}

export const firebaseAuthService = {
  signIn,
  signUp,
  signOut: doSignOut,
  adminSignIn,
  getCurrentUserToken,
  subscribeAuth,
  async ensureAnonymous() {
    try {
      // Verificar se já está autenticado
      if (auth.currentUser) {
        console.log("✅ Usuário já autenticado:", auth.currentUser.uid);
        return auth.currentUser;
      }

      // Fazer login anônimo
      console.log("🔑 Iniciando autenticação anônima...");
      const result = await signInAnonymously(auth);
      console.log("✅ Autenticação anônima realizada:", result.user.uid);
      return result.user;
    } catch (error) {
      console.error("❌ Erro na autenticação anônima:", error);
      throw new Error(`Falha na autenticação: ${error.message}`);
    }
  },
};
