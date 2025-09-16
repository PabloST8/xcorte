import api from "./api";

// Serviços de Pagamento
export const paymentService = {
  // Criar sessão de pagamento
  async createPaymentSession(paymentData) {
    try {
      const response = await api.post("/payments/create-session", paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirmar pagamento
  async confirmPayment(sessionId) {
    try {
      const response = await api.post(`/payments/confirm/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter status do pagamento
  async getPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/payments/status/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter histórico de pagamentos do usuário
  async getPaymentHistory(params = {}) {
    try {
      const response = await api.get("/payments/history", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Processar reembolso (admin)
  async processRefund(paymentId, refundData) {
    try {
      const response = await api.post(
        `/payments/refund/${paymentId}`,
        refundData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Processar pagamento (método principal)
  async processPayment(paymentData) {
    try {
      // Para desenvolvimento, simular sucesso do pagamento
      console.log("Processing payment:", paymentData);

      // Simular delay do processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retornar sucesso
      return {
        success: true,
        paymentId: `payment_${Date.now()}`,
        status: "completed",
        message: "Pagamento processado com sucesso",
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
      };
    } catch (error) {
      console.error("Payment processing error:", error);
      return {
        success: false,
        error: error.message || "Erro no processamento do pagamento",
      };
    }
  },
};

// Serviços de Notificação
export const notificationService = {
  // Obter notificações do usuário
  async getUserNotifications(params = {}) {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Marcar notificação como lida
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead() {
    try {
      const response = await api.put("/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Configurações de notificação
  async updateNotificationSettings(settings) {
    try {
      const response = await api.put("/notifications/settings", settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
