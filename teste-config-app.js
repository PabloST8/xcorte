/**
 * Teste usando as mesmas configurações da aplicação React
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Configurações da aplicação (mesmas do .env)
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

async function testarComConfiguracaoApp() {
  console.log("🔧 TESTANDO COM CONFIGURAÇÃO DA APLICAÇÃO");
  console.log("=".repeat(50));
  console.log("API Key:", firebaseConfig.apiKey);
  console.log("App ID:", firebaseConfig.appId);

  const userId = "88994464373";

  try {
    const userRef = doc(db, "users", String(userId));
    console.log("\n📋 Verificando documento do usuário...");

    const snap = await getDoc(userRef);
    console.log("Documento existe?", snap.exists());

    if (snap.exists()) {
      const data = snap.data();
      console.log("\n📸 Dados de foto:");
      console.log("  photoURL:", data.photoURL || "NÃO ENCONTRADO");
      console.log("  photoPath:", data.photoPath || "NÃO ENCONTRADO");
      console.log("  photoVersion:", data.photoVersion || "NÃO ENCONTRADO");
      console.log(
        "  photoUpdatedAt:",
        data.photoUpdatedAt?.toDate?.() ||
          data.photoUpdatedAt ||
          "NÃO ENCONTRADO"
      );

      if (data.photoURL) {
        console.log("\n✅ FOTO ENCONTRADA! URL:", data.photoURL);

        // Testar se a URL é acessível
        try {
          const response = await fetch(data.photoURL, { method: "HEAD" });
          console.log("Status da URL:", response.status);
          if (response.ok) {
            console.log("✅ URL da foto está acessível");
          } else {
            console.log("❌ URL da foto não está acessível");
          }
        } catch (fetchErr) {
          console.log("❌ Erro ao acessar URL:", fetchErr.message);
        }
      } else {
        console.log("\n❌ NENHUMA FOTO ENCONTRADA");
        console.log(
          'Isso explica porque a aplicação mostra "📸 Nenhuma foto encontrada no Firestore"'
        );
      }
    } else {
      console.log("❌ Documento do usuário não existe");
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testarComConfiguracaoApp();
