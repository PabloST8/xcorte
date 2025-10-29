/**
 * Script para simular o problema e testar a solução
 * Vamos identificar exatamente onde está o problema
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Configurações da aplicação
const firebaseConfig = {
  apiKey: "AIzaSyBYKvlk8ioYDecLYg-yupH1Oyy5U_ury9s",
  authDomain: "xcortes-e6f64.firebaseapp.com",
  projectId: "xcortes-e6f64",
  storageBucket: "xcortes-e6f64.firebasestorage.app",
  messagingSenderId: "1016197568464",
  appId: "1:1016197568464:web:f6ee67ab1ffbdb333d4bd5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Simula exatamente o que a aplicação faz no AuthContext
 */
async function simularAuthContext() {
  console.log("🔄 SIMULANDO PROCESSO DO AuthContext");
  console.log("=".repeat(50));

  // Simular dados do usuário (como vem dos cookies)
  const parsedUser = {
    id: "88994464373",
    name: "Pablo Felipe Araújo Ferreira",
    phone: "88994464373",
    role: "client",
  };

  console.log("👤 Usuário simulado:", parsedUser);

  try {
    // Reproduzir exatamente o código do AuthContext.jsx linhas 76-85
    const idCandidate = parsedUser.phone || parsedUser.id || "";
    const cleanPhone = String(idCandidate).replace(/\D/g, "");
    const userDocId = cleanPhone || parsedUser.id || parsedUser.email;

    console.log(`🔍 ID para busca: "${userDocId}"`);
    console.log(`📱 Phone original: "${parsedUser.phone}"`);
    console.log(`🆔 ID original: "${parsedUser.id}"`);

    if (userDocId) {
      console.log(`\n📂 Buscando documento: users/${userDocId}`);
      const userRef = doc(db, "users", String(userDocId));
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() || {};
        console.log("✅ Documento encontrado!");
        console.log("📸 Dados de foto:", {
          photoURL: data.photoURL || "NÃO ENCONTRADO",
          photoPath: data.photoPath || "NÃO ENCONTRADO",
          photoVersion: data.photoVersion || "NÃO ENCONTRADO",
        });

        if (data.photoURL) {
          console.log("\n🎯 FOTO ENCONTRADA!");
          console.log("🔗 URL:", data.photoURL);

          // Testar a URL
          try {
            const response = await fetch(data.photoURL, { method: "HEAD" });
            console.log("📊 Status da URL:", response.status);
            if (response.ok) {
              console.log("✅ Foto acessível - problema resolvido!");
            } else {
              console.log("❌ Foto não acessível - problema no Storage");
            }
          } catch (fetchErr) {
            console.log("❌ Erro ao acessar URL:", fetchErr.message);
          }
        } else {
          console.log("\n❌ PROBLEMA IDENTIFICADO!");
          console.log("O documento existe mas não tem photoURL");
          console.log(
            "Isso explica o log: '📸 Nenhuma foto encontrada no Firestore'"
          );
        }
      } else {
        console.log("❌ Documento não encontrado!");
        console.log("Isso seria um erro mais grave");
      }
    }
  } catch (error) {
    console.error("❌ Erro na simulação:", error);
  }
}

async function verificarTodasVariacoes() {
  console.log("\n🔀 VERIFICANDO TODAS AS VARIAÇÕES DE ID");
  console.log("=".repeat(50));

  const variations = [
    "88994464373",
    "pablofafstar@gmail.com",
    "88994464373@email.com",
    "+5588994464373",
    "5588994464373",
  ];

  for (const id of variations) {
    try {
      const userRef = doc(db, "users", id);
      const snap = await getDoc(userRef);

      console.log(`\n📁 ID: "${id}"`);
      console.log(`   Existe: ${snap.exists() ? "✅" : "❌"}`);

      if (snap.exists()) {
        const data = snap.data();
        console.log(`   Nome: ${data.name || "N/A"}`);
        console.log(`   Foto: ${data.photoURL ? "✅ SIM" : "❌ NÃO"}`);
      }
    } catch (error) {
      console.log(`   Erro: ${error.message}`);
    }
  }
}

// Executar simulação
(async () => {
  await simularAuthContext();
  await verificarTodasVariacoes();
})();
