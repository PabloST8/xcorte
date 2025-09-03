import api from "./api";
import {
  validateBooking,
  calculateEndTime,
  BOOKING_STATUS,
} from "../types/api.js";

// Serviços de Agendamentos/Reservas
export const bookingService = {
  // Listar agendamentos
  async getBookings(enterpriseEmail, date = null, status = null) {
    try {
      // Convert "today" to actual date format
      let formattedDate = date;
      if (date === "today") {
        formattedDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      }

      const params = new URLSearchParams({
        enterpriseEmail,
        ...(formattedDate && { date: formattedDate }),
        ...(status && { status }),
      });

      const response = await api.get(`/bookings?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Criar agendamento
  async createBooking(bookingData) {
    try {
      // Calcular endTime automaticamente se não fornecido
      if (
        !bookingData.endTime &&
        bookingData.startTime &&
        bookingData.productDuration
      ) {
        bookingData.endTime = calculateEndTime(
          bookingData.startTime,
          bookingData.productDuration
        );
      }

      // Definir status padrão se não fornecido
      if (!bookingData.status) {
        bookingData.status = BOOKING_STATUS.AGENDADO;
      }

      // Validar dados do agendamento
      const errors = validateBooking(bookingData);
      if (errors.length > 0) {
        throw new Error(`Dados inválidos: ${errors.join(", ")}`);
      }

      const response = await api.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirmar agendamento
  async confirmBooking(bookingId) {
    try {
      const response = await api.put(`/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar status do agendamento
  async updateBookingStatus(bookingId, status) {
    try {
      if (!Object.values(BOOKING_STATUS).includes(status)) {
        throw new Error(
          `Status inválido. Use: ${Object.values(BOOKING_STATUS).join(", ")}`
        );
      }

      const response = await api.put(`/bookings/${bookingId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancelar agendamento
  async cancelBooking(bookingId, reason = "") {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Marcar como concluído (se backend suportar endpoint /complete)
  async completeBooking(bookingId, notes = "") {
    try {
      const response = await api.put(`/bookings/${bookingId}/complete`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Listar funcionários disponíveis
  async getAvailableEmployees(enterpriseEmail) {
    try {
      const params = new URLSearchParams({ enterpriseEmail });
      const response = await api.get(
        `/bookings/available-employees?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
