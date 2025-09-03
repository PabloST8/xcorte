import api from "./api";
import { productService } from "./productService";
import { enterpriseService } from "./enterpriseService";

// Serviços da Barbearia (usando os novos serviços da API)
export const barbershopService = {
  // Obter informações da barbearia
  async getBarbershopInfo(enterpriseEmail) {
    return await enterpriseService.getEnterpriseByEmail(enterpriseEmail);
  },

  // Obter serviços disponíveis
  async getServices(enterpriseEmail) {
    return await productService.getProducts(enterpriseEmail);
  },

  // Obter detalhes de um serviço (usar produto por ID)
  async getServiceDetails(serviceId) {
    try {
      // Como não temos endpoint específico, vamos usar uma busca geral
      // e filtrar pelo ID se necessário
      const response = await api.get(`/products/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter funcionários disponíveis
  async getStaff() {
    try {
      const response = await api.get("/barbershop/staff");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter detalhes de um funcionário
  async getStaffDetails(staffId) {
    try {
      const response = await api.get(`/barbershop/staff/${staffId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter horários disponíveis
  async getAvailableSlots(params) {
    try {
      const response = await api.get("/barbershop/available-slots", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Criar novo serviço
  async createService(serviceData) {
    try {
      const response = await api.post("/barbershop/services", serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar serviço existente
  async updateService(serviceId, serviceData) {
    try {
      const response = await api.put(
        `/barbershop/services/${serviceId}`,
        serviceData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Deletar serviço
  async deleteService(serviceId) {
    try {
      const response = await api.delete(`/barbershop/services/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Serviços de Agendamento
export const appointmentService = {
  // Criar agendamento
  async createAppointment(appointmentData) {
    try {
      const response = await api.post("/appointments", appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter agendamentos do usuário
  async getUserAppointments(params = {}) {
    try {
      const response = await api.get("/appointments/user", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter detalhes de um agendamento
  async getAppointmentDetails(appointmentId) {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancelar agendamento
  async cancelAppointment(appointmentId, reason) {
    try {
      const response = await api.put(`/appointments/${appointmentId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reagendar agendamento
  async rescheduleAppointment(appointmentId, newDateTime) {
    try {
      const response = await api.put(
        `/appointments/${appointmentId}/reschedule`,
        {
          newDateTime,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Avaliar atendimento
  async rateAppointment(appointmentId, ratingData) {
    try {
      const response = await api.post(
        `/appointments/${appointmentId}/rating`,
        ratingData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
