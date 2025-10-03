/**
 * Serviço para integração com a API de agendamentos
 * Configuração flexível: L      const payload = {
        enterpriseEmail: bookingData.enterpriseEmail,
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        productId: bookingData.productId,
        employeeId: bookingData.employeeId || bookingData.staffId,
        date: bookingData.date, // YYYY-MM-DD
        startTime: bookingData.startTime, // HH:MM
        notes: bookingData.notes || ''
      };

      // Só adicionar email se for válido
      if (bookingData.clientEmail && bookingData.clientEmail.includes('@')) {
        payload.clientEmail = bookingData.clientEmail;
      }

      const response = await fetch(`${this.baseURL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),mento) ou Produção (nuvem)
 */

// Configuração da API
const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === "true";
const LOCAL_API_URL = "http://localhost:3001/api";
const PRODUCTION_API_URL = "https://x-corte-api.codxis.com.br/api";
// Permitir override via variável de ambiente (ex.: https://api.x-corte.com/api)
const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL =
  ENV_API_BASE_URL || (USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL);

console.log("🔧 [bookingApiService] Configuração da API:", {
  useLocal: USE_LOCAL_API,
  apiUrl: API_BASE_URL,
  envOverride: Boolean(ENV_API_BASE_URL),
  environment: USE_LOCAL_API ? "development" : "production",
});

import Cookies from "js-cookie";

class BookingApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  buildHeaders(extra = {}) {
    const headers = { "Content-Type": "application/json", ...extra };
    try {
      const token = Cookies.get("auth_token");
      const userData = Cookies.get("user_data");
      const isSimple = typeof token === "string" && token.startsWith("simple-");

      console.log("🔑 [bookingApiService] Token debug:", {
        token: token ? `${token.substring(0, 20)}...` : null,
        isSimple,
        hasUserData: !!userData,
        willAddAuth: !!token,
      });

      // Debug: show all cookies
      console.log("🍪 [bookingApiService] All cookies:", document.cookie);

      if (token) {
        if (isSimple) {
          // Para tokens simples, usar o token como está (para desenvolvimento)
          headers.Authorization = `Bearer ${token}`;
          console.log(
            "✅ [bookingApiService] Simple token added as Authorization"
          );
        } else {
          // Para tokens reais, usar Bearer
          headers.Authorization = `Bearer ${token}`;
          console.log("✅ [bookingApiService] Bearer token added");
        }

        // Adicionar informações do usuário se disponível
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.id) {
              headers["X-User-ID"] = user.id;
            }
            if (user.phone) {
              headers["X-User-Phone"] = user.phone;
            }
            console.log("✅ [bookingApiService] User headers added");
          } catch (parseErr) {
            console.log(
              "⚠️ [bookingApiService] Error parsing user data:",
              parseErr
            );
          }
        }
      } else {
        console.log(
          "⚠️ [bookingApiService] No token found for Authorization header"
        );
      }
    } catch (err) {
      console.log("❌ [bookingApiService] Error accessing cookies:", err);
    }
    return headers;
  }

  /**
   * Método para definir um token de teste manualmente
   */
  setTestToken(token) {
    try {
      Cookies.set("auth_token", token);
      console.log(
        "🔧 [bookingApiService] Test token set:",
        token ? `${token.substring(0, 20)}...` : null
      );
    } catch (err) {
      console.log("❌ [bookingApiService] Error setting test token:", err);
    }
  }

  /**
   * Buscar agendamentos
   * @param {string} enterpriseEmail
   * @param {string} date - Formato YYYY-MM-DD (opcional)
   * @param {string} status - 'pending', 'confirmed', 'cancelled', 'completed' (opcional)
   */
  async getBookings(enterpriseEmail, date = null, status = null) {
    try {
      console.log("📅 [bookingApiService] Buscando agendamentos:", {
        enterpriseEmail,
        date,
        status,
      });
      console.log(
        "🌐 [bookingApiService] URL completa:",
        `${this.baseURL}/bookings`
      );

      const params = new URLSearchParams({
        enterpriseEmail,
      });

      if (date) params.append("date", date);
      if (status) params.append("status", status);

      const url = `${this.baseURL}/bookings?${params}`;
      console.log("📡 [bookingApiService] Fazendo fetch para:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Agendamentos carregados:", data);

      return {
        success: true,
        data: data.data || [],
      };
    } catch (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Criar novo agendamento
   * @param {Object} bookingData
   */
  async createBooking(bookingData) {
    try {
      console.log("🔄 Criando agendamento:", bookingData);

      // Alinhar com contrato oficial (OpenAPI):
      // Campos aceitos: enterpriseEmail, clientName, clientPhone, clientEmail(opcional),
      // productId, employeeId(opcional), employeeName(opcional), date, startTime, notes(opcional)
      const payload = {
        enterpriseEmail: bookingData.enterpriseEmail,
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        productId: bookingData.productId,
        // employeeId deve ser o ID interno da API (não email)
        ...(bookingData.employeeId && { employeeId: bookingData.employeeId }),
        // employeeName para facilitar identificação
        ...(bookingData.employeeName && {
          employeeName: bookingData.employeeName,
        }),
        date: bookingData.date, // YYYY-MM-DD
        startTime: bookingData.startTime, // HH:MM
        ...(bookingData.notes && { notes: bookingData.notes }),
      };

      // Só adicionar email se for válido
      if (bookingData.clientEmail && bookingData.clientEmail.includes("@")) {
        payload.clientEmail = bookingData.clientEmail;
      }

      const postParams = new URLSearchParams({
        enterpriseEmail: String(payload.enterpriseEmail || ""),
      });
      const postUrl = `${this.baseURL}/bookings?${postParams.toString()}`;
      console.log("🌐 [bookingApiService] POST URL:", postUrl);

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let json;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn("⚠️ [createBooking] Resposta não-JSON:", text, e);
        json = { message: text };
      }

      if (!response.ok) {
        const msg = json?.message || `HTTP error! status: ${response.status}`;
        throw new Error(msg);
      }

      console.log("✅ Agendamento criado:", json);
      return { success: true, data: json.data, message: json.message };
    } catch (error) {
      console.error("❌ Erro ao criar agendamento:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Confirmar agendamento
   * @param {string} enterpriseEmail
   * @param {string} bookingId
   */
  async confirmBooking(enterpriseEmail, bookingId) {
    try {
      console.log("✅ Confirmando agendamento:", {
        enterpriseEmail,
        bookingId,
      });

      const params = new URLSearchParams({ enterpriseEmail });

      const response = await fetch(
        `${this.baseURL}/bookings/${bookingId}/confirm?${params}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Agendamento confirmado:", data);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("❌ Erro ao confirmar agendamento:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancelar agendamento
   * @param {string} enterpriseEmail
   * @param {string} bookingId
   */
  async cancelBooking(enterpriseEmail, bookingId) {
    try {
      console.log("❌ Cancelando agendamento:", { enterpriseEmail, bookingId });

      const params = new URLSearchParams({ enterpriseEmail });

      const response = await fetch(
        `${this.baseURL}/bookings/${bookingId}/cancel?${params}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Agendamento cancelado:", data);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("❌ Erro ao cancelar agendamento:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Buscar funcionários disponíveis
   * @param {string} enterpriseEmail
   * @param {string} productId
   * @param {string} date - YYYY-MM-DD
   * @param {string} startTime - HH:MM
   */
  async getAvailableEmployees(enterpriseEmail, productId, date, startTime) {
    try {
      console.log("👥 Buscando funcionários disponíveis:", {
        enterpriseEmail,
        productId,
        date,
        startTime,
      });

      const params = new URLSearchParams({
        enterpriseEmail,
        productId,
        date,
        startTime,
      });

      const response = await fetch(
        `${this.baseURL}/bookings/available-employees?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Funcionários disponíveis:", data);

      return {
        success: true,
        data: data.data || [],
      };
    } catch (error) {
      console.error("❌ Erro ao buscar funcionários disponíveis:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Listar funcionários disponíveis para um serviço em uma data/hora específica
   * Usa rota: GET /employees/availability/service
   * @param {string} enterpriseEmail
   * @param {string} productId
   * @param {string} date - YYYY-MM-DD
   * @param {string} startTime - HH:MM
   */
  async getAvailableEmployeesForService(
    enterpriseEmail,
    productId,
    date,
    startTime
  ) {
    try {
      const params = new URLSearchParams({
        enterpriseEmail,
        productId,
        date,
        startTime,
      });
      const url = `${
        this.baseURL
      }/employees/availability/service?${params.toString()}`;
      console.log(
        "👥 [bookingApiService] GET available employees for service:",
        url
      );
      const response = await fetch(url, {
        method: "GET",
        headers: this.buildHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.message || `HTTP error! status: ${response.status}`
        );
      }
      // API retorna { success, data: { productId, date, startTime, availableEmployees: [...] } }
      const list = data?.data?.availableEmployees || [];
      return { success: true, data: list };
    } catch (error) {
      console.error(
        "❌ Erro ao buscar funcionários disponíveis (service):",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar funcionários da empresa (admin/publico conforme backend)
   * Usa rota: GET /employees com enterpriseEmail obrigatório e filtros opcionais
   * @param {string} enterpriseEmail
   * @param {Object} filters - { productId, position, isActive }
   */
  async listEmployees(enterpriseEmail, filters = {}) {
    try {
      const params = new URLSearchParams({ enterpriseEmail });
      if (filters.productId)
        params.append("productId", String(filters.productId));
      if (typeof filters.isActive === "boolean")
        params.append("isActive", String(filters.isActive));
      if (filters.position) params.append("position", String(filters.position));
      const url = `${this.baseURL}/employees?${params.toString()}`;
      console.log("👥 [bookingApiService] GET employees:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: this.buildHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.message || `HTTP error! status: ${response.status}`
        );
      }
      // API retorna { success, data: [...] }
      return {
        success: true,
        data: Array.isArray(data?.data) ? data.data : [],
      };
    } catch (error) {
      console.error("❌ Erro ao listar funcionários:", error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Buscar lembretes ativos
   */
  async getActiveReminders() {
    try {
      console.log("🔔 Buscando lembretes ativos...");

      const response = await fetch(
        `${this.baseURL}/bookings/reminders/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Lembretes ativos:", data);

      return {
        success: true,
        total: data.total || 0,
        reminders: data.reminders || [],
      };
    } catch (error) {
      console.error("❌ Erro ao buscar lembretes ativos:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Testar lembrete simples (desenvolvimento)
   * @param {string} phone
   */
  async testSimpleReminder(phone) {
    try {
      console.log("🧪 Testando lembrete para:", phone);

      const params = new URLSearchParams({ phone });

      const response = await fetch(
        `${this.baseURL}/bookings/test-simple?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("✅ Teste de lembrete:", data);

      return {
        success: true,
        message: data.message,
        testId: data.testId,
        phone: data.phone,
      };
    } catch (error) {
      console.error("❌ Erro ao testar lembrete:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const bookingApiService = new BookingApiService();

// Para debugging no console do browser
if (typeof window !== "undefined") {
  window.bookingApiService = bookingApiService;
}
