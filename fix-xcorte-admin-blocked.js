/**
 * Script para corrigir o status de bloqueio da empresa XCorte Admin
 *
 * Problema: A empresa tem isBlocked: true no Firestore
 * Solução: Atualizar para isBlocked: false e blocked: false
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:abc123",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixXCorteAdmin() {
  try {
    const enterpriseEmail = "empresaadmin@xcortes.com";
    const enterpriseRef = doc(db, "enterprises", enterpriseEmail);

    console.log("🔍 Verificando empresa:", enterpriseEmail);

    // Buscar dados atuais
    const enterpriseSnap = await getDoc(enterpriseRef);

    if (!enterpriseSnap.exists()) {
      console.error("❌ Empresa não encontrada:", enterpriseEmail);
      return;
    }

    const currentData = enterpriseSnap.data();
    console.log("📊 Dados atuais:", {
      isBlocked: currentData.isBlocked,
      blocked: currentData.blocked,
      isActive: currentData.isActive,
      active: currentData.active,
    });

    // Atualizar para desbloquear
    await updateDoc(enterpriseRef, {
      isBlocked: false,
      blocked: false,
      isActive: true,
      active: true,
      updatedAt: new Date(),
    });

    console.log("✅ Empresa desbloqueada com sucesso!");

    // Verificar atualização
    const updatedSnap = await getDoc(enterpriseRef);
    const updatedData = updatedSnap.data();
    console.log("📊 Dados após atualização:", {
      isBlocked: updatedData.isBlocked,
      blocked: updatedData.blocked,
      isActive: updatedData.isActive,
      active: updatedData.active,
    });
  } catch (error) {
    console.error("❌ Erro ao corrigir empresa:", error);
  }
}

fixXCorteAdmin();
