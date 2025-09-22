// API endpoints para verificação via WhatsApp
// Conecta com os endpoints reais do backend

class WhatsAppAPI {
  constructor() {
    this.baseURL = "/api";
  }

  // Endpoint POST /api/sendCode
  async sendCode(phoneNumber) {
    try {
      console.log("📞 Enviando código para:", phoneNumber);

      const requestBody = { phoneNumber };
      console.log("📦 Corpo da requisição:", JSON.stringify(requestBody));

      const response = await fetch("/api/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "📡 Resposta do servidor:",
        response.status,
        response.statusText
      );
      console.log(
        "📡 Headers da resposta:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro do servidor (texto completo):", errorText);

        // Tenta fazer parse se for JSON
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.log("📄 Erro parseado como JSON:", errorData);
        } catch (parseError) {
          console.log(
            "⚠️ Não foi possível parsear como JSON:",
            parseError.message
          );
          errorData = { message: errorText };
        }

        return {
          success: false,
          error: errorData.error || `Erro ${response.status}`,
          message:
            errorData.message || `Erro do servidor: ${response.statusText}`,
        };
      }

      const result = await response.json();
      console.log("✅ Resultado:", result);
      return result;
    } catch (error) {
      console.error("💥 Erro em sendCode:", error);
      console.error("💥 Stack trace:", error.stack);
      return {
        success: false,
        error: "Erro de conexão",
        message: "Erro ao conectar com o servidor. Tente novamente.",
      };
    }
  }

  // Endpoint POST /api/verifyCode
  async verifyCode(phoneNumber, userCode) {
    try {
      console.log("🔍 Verificando código:", userCode, "para:", phoneNumber);

      const response = await fetch("/api/verifyCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, userCode }),
      });

      console.log(
        "📡 Resposta da verificação:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na verificação:", errorText);

        return {
          success: false,
          error: `Erro ${response.status}`,
          message: `Erro do servidor: ${response.statusText}`,
        };
      }

      const result = await response.json();
      console.log("✅ Resultado da verificação:", result);
      return result;
    } catch (error) {
      console.error("💥 Erro em verifyCode:", error);
      return {
        success: false,
        error: "Erro de conexão",
        message: "Erro ao conectar com o servidor. Tente novamente.",
      };
    }
  }

  // Testa conexão direta com o backend
  async testDirectConnection(phoneNumber) {
    try {
      console.log("🔬 Testando conexão direta...");

      const response = await fetch(
        "https://x-corte-api.codxis.com.br/api/sendCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:4000",
          },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      console.log("🔬 Teste direto - Status:", response.status);
      const text = await response.text();
      console.log("🔬 Teste direto - Resposta:", text);

      return { status: response.status, response: text };
    } catch (error) {
      console.error("🔬 Erro no teste direto:", error);
      return { error: error.message };
    }
  }
}

// Instância da API
export const whatsAppAPI = new WhatsAppAPI();

// Função para enviar código de verificação
export const sendVerificationCode = async (phoneNumber) => {
  return await whatsAppAPI.sendCode(phoneNumber);
};

// Função para verificar código
export const verifyVerificationCode = async (phoneNumber, userCode) => {
  return await whatsAppAPI.verifyCode(phoneNumber, userCode);
};

// Função para verificar status da API
export const checkAPIStatus = async () => {
  return await whatsAppAPI.checkStatus();
};

// Função para testar conexão direta (debug)
export const testDirectConnection = async (phoneNumber) => {
  return await whatsAppAPI.testDirectConnection(phoneNumber);
};

export default whatsAppAPI;
