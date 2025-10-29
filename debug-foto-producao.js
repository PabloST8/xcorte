/**
 * Script de diagnóstico para problema de fotos na produção
 *
 * PROBLEMA RELATADO:
 * - Local: foto aparece normalmente
 * - Produção: foto não aparece
 * - Log mostra: "📸 Nenhuma foto encontrada no Firestore"
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Configuração do Firebase (mesma do projeto)
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
 * Função para diagnosticar problemas de foto
 */
async function diagnosticarFoto(userId) {
  console.log("\n🔍 DIAGNÓSTICO DE FOTO - PRODUÇÃO");
  console.log("=".repeat(50));
  console.log("User ID a verificar:", userId);

  try {
    // 1. Verificar documento no Firestore
    console.log("\n1️⃣ Verificando documento no Firestore...");
    const userRef = doc(db, "users", String(userId));
    console.log("Referência do documento:", userRef.path);

    const snap = await getDoc(userRef);
    console.log("Documento existe?", snap.exists());

    if (snap.exists()) {
      const data = snap.data();
      console.log(
        "Dados completos do documento:",
        JSON.stringify(data, null, 2)
      );

      // 2. Verificar campos específicos de foto
      console.log("\n2️⃣ Verificando campos de foto...");
      console.log("photoURL:", data.photoURL || "NÃO ENCONTRADO");
      console.log("photoPath:", data.photoPath || "NÃO ENCONTRADO");
      console.log("photoVersion:", data.photoVersion || "NÃO ENCONTRADO");
      console.log(
        "photoUpdatedAt:",
        data.photoUpdatedAt?.toDate?.() ||
          data.photoUpdatedAt ||
          "NÃO ENCONTRADO"
      );

      // 3. Testar URL da foto
      if (data.photoURL) {
        console.log("\n3️⃣ Testando acessibilidade da URL da foto...");
        try {
          const response = await fetch(data.photoURL, { method: "HEAD" });
          console.log("Status da URL:", response.status);
          console.log("Headers importantes:");
          console.log("  Content-Type:", response.headers.get("content-type"));
          console.log(
            "  Content-Length:",
            response.headers.get("content-length")
          );
          console.log(
            "  Cache-Control:",
            response.headers.get("cache-control")
          );

          if (response.ok) {
            console.log("✅ URL da foto está acessível");
          } else {
            console.log("❌ URL da foto não está acessível");
          }
        } catch (error) {
          console.log("❌ Erro ao acessar URL da foto:", error.message);
        }
      }
    } else {
      console.log("❌ Documento do usuário não existe no Firestore");
    }

    // 4. Verificar variações do ID
    console.log("\n4️⃣ Testando variações do User ID...");
    const variations = [
      userId,
      userId.replace(/\D/g, ""), // apenas números
      `+55${userId}`, // com código do país
      `55${userId}`, // código sem +
    ];

    for (const variation of variations) {
      if (variation !== userId) {
        try {
          const varRef = doc(db, "users", String(variation));
          const varSnap = await getDoc(varRef);
          console.log(
            `ID "${variation}":`,
            varSnap.exists() ? "✅ EXISTE" : "❌ não existe"
          );
          if (varSnap.exists()) {
            const varData = varSnap.data();
            if (varData.photoURL) {
              console.log(`  🖼️ Tem foto: ${varData.photoURL}`);
            }
          }
        } catch (error) {
          console.log(`ID "${variation}": ❌ erro -`, error.message);
        }
      }
    }
  } catch (error) {
    console.log("❌ Erro no diagnóstico:", error);
  }
}

/**
 * Função para listar todos os usuários com foto
 */
async function listarUsuariosComFoto() {
  console.log("\n📋 LISTANDO USUÁRIOS COM FOTO");
  console.log("=".repeat(50));

  try {
    // Como não podemos usar queries sem índices, vamos tentar os IDs mais comuns
    const commonIds = [
      "88994464373", // Pablo
      "pablofafstar@gmail.com",
      "88994464373@email.com",
      // Adicione outros IDs conhecidos
    ];

    for (const id of commonIds) {
      try {
        const userRef = doc(db, "users", id);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          console.log(`\n📁 Usuário: ${id}`);
          console.log("  Nome:", data.name || "N/A");
          console.log("  Email:", data.email || "N/A");
          console.log("  Telefone:", data.phone || "N/A");
          console.log("  Foto:", data.photoURL ? "✅ SIM" : "❌ NÃO");
          if (data.photoURL) {
            console.log("  URL da foto:", data.photoURL);
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${id}:`, error.message);
      }
    }
  } catch (error) {
    console.log("❌ Erro ao listar usuários:", error);
  }
}

// Executar diagnósticos
(async () => {
  // ID do usuário Pablo que está com problema
  await diagnosticarFoto("88994464373");

  // Listar usuários com foto
  await listarUsuariosComFoto();

  console.log("\n✅ Diagnóstico concluído");
})();
