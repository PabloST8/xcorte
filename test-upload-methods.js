// Teste para verificar qual método de upload funciona
// 1. Com autenticação anônima (se habilitada)
// 2. Sem autenticação (usando regras permissivas)

console.log("🧪 TESTANDO MÉTODOS DE UPLOAD");

import { enterprisePhotoService } from "./src/services/enterprisePhotoService.js";
import { enterprisePhotoServiceNoAuth } from "./src/services/enterprisePhotoServiceNoAuth.js";

// Função para criar arquivo de teste
function createTestFile() {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  // Desenhar teste
  ctx.fillStyle = "#10B981";
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = "white";
  ctx.font = "10px Arial";
  ctx.fillText("TEST", 35, 55);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], "test-upload.png", { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
}

// Teste 1: Com autenticação anônima
async function testWithAuth() {
  try {
    console.log("🔐 TESTE 1: Upload com autenticação anônima");
    const file = await createTestFile();
    const result = await enterprisePhotoService.uploadPhoto(
      "pablofafstar@gmail.com",
      file
    );
    console.log("✅ SUCESSO com autenticação:", result.photoURL);
    return true;
  } catch (error) {
    console.log("❌ FALHA com autenticação:", error.message);
    return false;
  }
}

// Teste 2: Sem autenticação
async function testWithoutAuth() {
  try {
    console.log("🔓 TESTE 2: Upload sem autenticação");
    const file = await createTestFile();
    const result = await enterprisePhotoServiceNoAuth.uploadPhoto(
      "pablofafstar@gmail.com",
      file
    );
    console.log("✅ SUCESSO sem autenticação:", result.photoURL);
    return true;
  } catch (error) {
    console.log("❌ FALHA sem autenticação:", error.message);
    return false;
  }
}

// Executar testes sequencialmente
async function runTests() {
  console.log("=".repeat(50));
  console.log("🎯 INICIANDO TESTES DE UPLOAD");
  console.log("=".repeat(50));

  const authResult = await testWithAuth();

  if (!authResult) {
    console.log("⚠️ Autenticação falhou, testando sem autenticação...");
    const noAuthResult = await testWithoutAuth();

    if (noAuthResult) {
      console.log("=".repeat(50));
      console.log("✅ SOLUÇÃO: Use enterprisePhotoServiceNoAuth");
      console.log("❗ OU: Habilite autenticação anônima no Firebase Console");
      console.log("=".repeat(50));
    } else {
      console.log("=".repeat(50));
      console.log("❌ AMBOS OS MÉTODOS FALHARAM");
      console.log("🔧 Verifique as regras do Firebase Storage");
      console.log("=".repeat(50));
    }
  } else {
    console.log("=".repeat(50));
    console.log("✅ AUTENTICAÇÃO ANÔNIMA FUNCIONANDO!");
    console.log("=".repeat(50));
  }
}

// Executar quando página carregar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runTests);
} else {
  runTests();
}

// Exportar para uso manual
window.testUploadMethods = runTests;
