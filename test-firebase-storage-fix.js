// Teste rápido para verificar se o bucket do Firebase Storage está funcionando
// Testando se a correção do DNS (.appspot.com) resolveu o problema

import { storage } from "./src/services/firebase.js";
import { ref, getDownloadURL } from "firebase/storage";

console.log("🧪 Testando Firebase Storage após correção DNS...");

// Test 1: Verificar se o storage foi inicializado
console.log("Storage inicializado:", !!storage);
console.log("Storage bucket:", storage.app.options.storageBucket);

// Test 2: Tentar acessar uma referência do Storage
try {
  const testRef = ref(storage, "test-image.jpg");
  console.log("✅ Referência criada com sucesso:", testRef.fullPath);
  console.log("✅ Bucket URL:", testRef.bucket);

  // Test 3: Verificar se conseguimos formar URLs (mesmo que o arquivo não exista)
  getDownloadURL(testRef)
    .then((url) => {
      console.log("✅ URL obtida:", url);
    })
    .catch((error) => {
      if (error.code === "storage/object-not-found") {
        console.log(
          "✅ Storage funciona! (arquivo não existe, mas conseguimos acessar)"
        );
        console.log("URL base:", error.serverResponse?.responseURL || "N/A");
      } else {
        console.log("❌ Erro de Storage:", error.code, error.message);
      }
    });
} catch (error) {
  console.log("❌ Erro ao criar referência:", error);
}

// Test 4: Verificar configuração do bucket
console.log("📊 Diagnóstico completo:");
console.log("- Storage bucket configurado:", storage.app.options.storageBucket);
console.log("- Projeto ID:", storage.app.options.projectId);
console.log(
  "- Usando domínio .appspot.com:",
  storage.app.options.storageBucket?.includes(".appspot.com")
);
