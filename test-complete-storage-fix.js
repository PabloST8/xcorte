// Teste completo da correção de CORS + DNS no Firebase Storage
// Verifica: DNS (.appspot.com), Autenticação, Upload, CORS

console.log("🧪 TESTE COMPLETO: Firebase Storage - DNS + CORS + Auth");

// Importar o serviço corrigido
import { enterprisePhotoService } from "./src/services/enterprisePhotoService.js";
import { firebaseAuthService } from "./src/services/firebaseAuthService.js";

// Função para simular upload
async function testStorageUpload() {
  try {
    console.log("=".repeat(50));
    console.log("🎯 INICIANDO TESTE DE UPLOAD");
    console.log("=".repeat(50));

    // 1. Testar autenticação
    console.log("1️⃣ Testando autenticação anônima...");
    const user = await firebaseAuthService.ensureAnonymous();
    console.log("✅ Autenticação OK:", user.uid);

    // 2. Criar arquivo de teste (simular imagem)
    console.log("2️⃣ Criando arquivo de teste...");
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");

    // Desenhar algo simples
    ctx.fillStyle = "#4F46E5";
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("TEST", 35, 55);

    // Converter para blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    const testFile = new File([blob], "test-upload.png", { type: "image/png" });
    console.log(
      "✅ Arquivo de teste criado:",
      testFile.name,
      `${(testFile.size / 1024).toFixed(2)}KB`
    );

    // 3. Testar upload
    console.log("3️⃣ Testando upload para Storage...");
    const enterpriseId = "pablofafstar@gmail.com"; // ID de teste

    const result = await enterprisePhotoService.uploadPhoto(
      enterpriseId,
      testFile
    );

    console.log("✅ UPLOAD REALIZADO COM SUCESSO!");
    console.log("📷 URL da foto:", result.photoURL);
    console.log("📁 Path no Storage:", result.photoPath);

    // 4. Testar se a imagem carrega
    console.log("4️⃣ Testando carregamento da imagem...");
    const img = new Image();
    img.crossOrigin = "anonymous";

    const imageLoadTest = new Promise((resolve, reject) => {
      img.onload = () => {
        console.log("✅ Imagem carregou com sucesso!");
        resolve(true);
      };
      img.onerror = (error) => {
        console.error("❌ Erro ao carregar imagem:", error);
        reject(error);
      };
    });

    img.src = result.photoURL;
    await imageLoadTest;

    console.log("=".repeat(50));
    console.log("🎉 TODOS OS TESTES PASSARAM!");
    console.log("✅ DNS: Resolvido (.appspot.com)");
    console.log("✅ CORS: Configurado");
    console.log("✅ Auth: Funcionando");
    console.log("✅ Upload: Sucesso");
    console.log("✅ Download: Sucesso");
    console.log("=".repeat(50));

    return true;
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ ERRO NO TESTE:");
    console.error("=".repeat(50));
    console.error("Tipo:", error.constructor.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);

    if (error.code) {
      console.error("Código Firebase:", error.code);
    }

    console.error("=".repeat(50));
    return false;
  }
}

// Executar teste quando a página carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", testStorageUpload);
} else {
  testStorageUpload();
}

// Exportar para uso manual
window.testStorageUpload = testStorageUpload;
