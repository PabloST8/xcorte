// Teste de conectividade Firebase
// Cole no console da página do navegador

const testFirebaseConnection = async () => {
  console.log("🔧 TESTE DE CONECTIVIDADE FIREBASE");
  console.log("================================");

  try {
    // Verificar se as variáveis estão carregadas
    console.log("🔍 Verificando variáveis de ambiente...");
    console.log(
      "VITE_FIREBASE_PROJECT_ID:",
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
    console.log(
      "VITE_FIREBASE_API_KEY:",
      import.meta.env.VITE_FIREBASE_API_KEY ? "***definida***" : "❌ undefined"
    );
    console.log(
      "VITE_FIREBASE_AUTH_DOMAIN:",
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    );

    // Tentar importar Firebase
    const { db } = await import("./src/services/firebase.js");
    console.log("✅ Firebase importado com sucesso");

    // Testar conectividade básica
    const { getDocs, collection } = await import("firebase/firestore");

    console.log("🔍 Testando acesso à coleção enterprises...");
    const querySnapshot = await getDocs(collection(db, "enterprises"));

    console.log(
      `✅ Conectividade OK! Encontradas ${querySnapshot.size} empresas`
    );

    if (querySnapshot.size > 0) {
      console.log("📋 Empresas encontradas:");
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ${data.name || "Sem nome"} (${doc.id})`);
      });
    } else {
      console.log("⚠️ Nenhuma empresa encontrada no Firestore");
    }

    return true;
  } catch (error) {
    console.error("❌ Erro na conectividade:", error);
    return false;
  }
};

// Disponibilizar globalmente
window.testFirebaseConnection = testFirebaseConnection;

console.log("💡 Execute: testFirebaseConnection() para testar a conectividade");
