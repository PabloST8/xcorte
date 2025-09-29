/**
 * Utilitários para debugar a API em produção
 */

import { bookingApiService } from "../services/bookingApiService.js";

// Disponibilizar no console global para debugging
window.apiDebug = {
  // Testar diferentes tokens
  async testTokens() {
    const testTokens = [
      "test-token-123",
      "bearer-token-test",
      "admin-token",
      "enterprise-token",
    ];

    console.log("🔧 Testando diferentes tokens...");

    for (const token of testTokens) {
      console.log(`\n🔑 Testando token: ${token}`);
      bookingApiService.setTestToken(token);

      try {
        const result = await bookingApiService.listEmployees(
          "pablofafstar@gmail.com",
          { isActive: true }
        );
        console.log(`✅ Token ${token} funcionou:`, result);
        return token; // Retorna o primeiro token que funcionar
      } catch (error) {
        console.log(`❌ Token ${token} falhou:`, error.message);
      }
    }

    console.log("❌ Nenhum token de teste funcionou");
    return null;
  },

  // Testar sem token
  async testNoAuth() {
    console.log("🔧 Testando sem autenticação...");
    bookingApiService.setTestToken(""); // Remove token

    try {
      const result = await bookingApiService.listEmployees(
        "pablofafstar@gmail.com",
        { isActive: true }
      );
      console.log("✅ API funciona sem auth:", result);
      return true;
    } catch (error) {
      console.log("❌ API requer autenticação:", error.message);
      return false;
    }
  },

  // Ver o que há nos cookies
  checkCookies() {
    console.log("🍪 Cookies atuais:", document.cookie);
    const authToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];
    console.log(
      "🔑 Auth token encontrado:",
      authToken ? `${authToken.substring(0, 20)}...` : "Nenhum"
    );
    return authToken;
  },

  // Teste completo
  async runDiagnostic() {
    console.log("🏥 === DIAGNÓSTICO COMPLETO DA API ===");

    // 1. Verificar cookies
    const existingToken = this.checkCookies();

    // 2. Testar token existente se houver
    if (existingToken) {
      console.log("\n🔑 Testando token existente...");
      try {
        const result = await bookingApiService.listEmployees(
          "pablofafstar@gmail.com",
          { isActive: true }
        );
        console.log("✅ Token existente funciona:", result);
        return { success: true, token: existingToken, result };
      } catch (error) {
        console.log("❌ Token existente falhou:", error.message);
      }
    }

    // 3. Testar sem auth
    const noAuthWorks = await this.testNoAuth();
    if (noAuthWorks) {
      return {
        success: true,
        token: null,
        message: "API não requer autenticação",
      };
    }

    // 4. Testar tokens de teste
    const workingToken = await this.testTokens();
    if (workingToken) {
      return {
        success: true,
        token: workingToken,
        message: "Token de teste funciona",
      };
    }

    return {
      success: false,
      message: "Nenhuma forma de autenticação funcionou",
    };
  },
};

console.log(
  "🔧 API Debug tools loaded. Use window.apiDebug.runDiagnostic() para diagnóstico completo"
);
