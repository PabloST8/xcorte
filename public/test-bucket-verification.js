// Teste rápido para verificar qual bucket está sendo usado
console.log("🔍 VERIFICAÇÃO DO BUCKET FIREBASE:");

// Aguardar um pouco para o Firebase carregar
setTimeout(() => {
  // Verificar se o window tem Firebase
  if (window.__FIREBASE_SDK__) {
    console.log("📱 Firebase SDK encontrado");
  }

  // Tentar acessar o storage através do window (se disponível)
  if (window.firebase) {
    console.log("🔥 Firebase global encontrado");
  }

  // Log das variáveis de ambiente (Vite expõe as VITE_*)
  console.log("🌍 Variáveis de ambiente:");
  console.log(
    "- VITE_FIREBASE_PROJECT_ID:",
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
  console.log(
    "- VITE_FIREBASE_STORAGE_BUCKET:",
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  );

  // Importar e verificar Firebase config dinamicamente
  import("./src/services/firebase.js")
    .then(({ storage }) => {
      console.log("✅ Firebase storage configurado:");
      console.log("- Bucket:", storage.app.options.storageBucket);
      console.log("- App name:", storage.app.name);
      console.log("- Project ID:", storage.app.options.projectId);

      // Verificar se é o bucket correto (.firebasestorage.app)
      if (storage.app.options.storageBucket.includes(".firebasestorage.app")) {
        console.log(
          "✅ CORRETO: Usando bucket .firebasestorage.app (com CORS configurado)"
        );
      } else {
        console.log("❌ PROBLEMA: Ainda usando bucket diferente");
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao importar Firebase:", error);
    });
}, 2000);

console.log("⏳ Aguardando Firebase carregar...");
