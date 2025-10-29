/**
 * Script para testar e corrigir o salvamento de fotos no Firestore
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQRWWzHyNB7rJk44IVaOQLp2E-U3JBLsQ",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:b83d29b5c8b7b77b7e6d4f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Teste para simular salvamento de foto
 */
async function testarSalvamentoFoto() {
  console.log("🧪 TESTANDO SALVAMENTO DE FOTO NO FIRESTORE");
  console.log("=".repeat(50));

  const userId = "88994464373";
  const fotoTeste = {
    url: "https://firebasestorage.googleapis.com/v0/b/xcortes-e6f64.firebasestorage.app/o/user-photos%2F88994464373%2Fteste.jpg?alt=media&token=exemplo",
    path: "user-photos/88994464373/teste.jpg",
  };

  try {
    console.log("\n1️⃣ Verificando documento antes do update...");
    const ref = doc(db, "users", String(userId));
    const snapBefore = await getDoc(ref);
    console.log("Documento existe?", snapBefore.exists());
    console.log("Dados antes:", snapBefore.data());

    console.log("\n2️⃣ Tentando atualizar com metadados de foto...");
    const version = Date.now();

    await updateDoc(ref, {
      photoURL: fotoTeste.url,
      photoPath: fotoTeste.path,
      photoVersion: version,
      photoUpdatedAt: serverTimestamp(),
    });

    console.log("✅ Update realizado com sucesso!");

    console.log("\n3️⃣ Verificando documento após update...");
    const snapAfter = await getDoc(ref);
    console.log(
      "Dados após update:",
      JSON.stringify(snapAfter.data(), null, 2)
    );
  } catch (error) {
    console.log("❌ Erro no teste:", error);
    console.log("Código do erro:", error.code);
    console.log("Mensagem:", error.message);
  }
}

/**
 * Verificar permissões do Firestore
 */
async function verificarPermissoes() {
  console.log("\n🔐 VERIFICANDO PERMISSÕES DO FIRESTORE");
  console.log("=".repeat(50));

  try {
    // Tentar ler um documento existente
    const ref = doc(db, "users", "88994464373");
    const snap = await getDoc(ref);
    console.log("✅ Leitura permitida - documento existe:", snap.exists());

    // Tentar escrever dados de teste
    await updateDoc(ref, {
      testePermissao: new Date().toISOString(),
      testeTimestamp: serverTimestamp(),
    });
    console.log("✅ Escrita permitida - teste realizado com sucesso");

    // Verificar se foi salvo
    const snapVerif = await getDoc(ref);
    const data = snapVerif.data();
    console.log("Teste salvo em:", data.testePermissao);
  } catch (error) {
    console.log("❌ Problema de permissão:", error.code, error.message);
  }
}

// Executar testes
(async () => {
  await verificarPermissoes();
  await testarSalvamentoFoto();
})();
