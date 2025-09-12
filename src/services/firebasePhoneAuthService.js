// Serviço para autenticação via telefone (Firebase Phone Auth)
// Requer habilitar Phone Authentication no console Firebase.
// Usa reCAPTCHA invisível inicializado on-demand.
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const auth = getAuth();
let recaptchaVerifier = null;

function getOrCreateRecaptcha() {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {},
  });
  return recaptchaVerifier;
}

export async function sendPhoneCode(rawPhone) {
  // Espera telefone brasileiro sem formatação ou com +55
  let phone = rawPhone.replace(/\D/g, "");
  if (phone.length === 11) phone = "+55" + phone; // Ex: 11999999999 -> +5511999999999
  if (!phone.startsWith("+")) throw new Error("Telefone inválido");
  const verifier = getOrCreateRecaptcha();
  const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
  return confirmation; // objeto confirmation com método confirm(code)
}

export async function confirmPhoneCode(confirmation, code, extraData = {}) {
  const cred = await confirmation.confirm(code);
  const user = cred.user; // user.phoneNumber
  const phone = user.phoneNumber;
  const digits = phone.replace(/\D/g, "");
  const userId = digits; // doc id por telefone puro
  const now = new Date().toISOString();
  // Criar/merge doc do usuário
  const ref = doc(db, "users", userId);
  let existing = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existing = snap.data();
  } catch {
    // ignore
  }
  const base = {
    phone,
    id: userId,
    role: existing?.role || "client",
    name: existing?.name || extraData.name || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...extraData,
  };
  try {
    await setDoc(ref, base, { merge: true });
  } catch {
    // ignore
  }
  return { firebaseUser: user, profile: base };
}
