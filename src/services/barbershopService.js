import api from "./api";
import { productService } from "./productService";
// import { enterpriseService } from "./enterpriseService"; // DESABILITADO
import { publicEnterpriseFirestoreService } from "./publicEnterpriseFirestoreService";

// Serviços da Barbearia (usando os novos serviços da API)
export const barbershopService = {
  // Obter informações da barbearia
  async getBarbershopInfo(enterpriseEmail) {
    // API desabilitada - usar Firestore diretamente
    console.log("getBarbershopInfo: API desabilitada, usando Firestore");
    try {
      const enterprises =
        await publicEnterpriseFirestoreService.getEnterprises();
      const enterprise = enterprises.find((e) => e.email === enterpriseEmail);
      return enterprise || null;
    } catch (_error) {
      console.error("Erro ao buscar empresa do Firestore:", _error);
      return null;
    }
  },

  // Obter serviços disponíveis
  async getServices(enterpriseEmail) {
    try {
      return await productService.getProducts(enterpriseEmail);
    } catch (error) {
      console.warn(
        "API de produtos não disponível, tentando Firestore:",
        error
      );

      // Tentar buscar do Firestore
      try {
        const services = await publicEnterpriseFirestoreService.getServices(
          enterpriseEmail
        );
        if (services && services.length > 0) {
          return {
            success: true,
            data: services,
          };
        }
      } catch (firestoreError) {
        console.warn("Firestore de produtos também falhou:", firestoreError);
      }

      // Último recurso: retornar serviços padrão
      console.log("Usando serviços padrão como último recurso");
      return {
        success: true,
        data: [
          {
            id: "1",
            name: "Corte Tradicional",
            description: "Corte de cabelo masculino tradicional",
            priceInCents: 3000, // R$ 30,00
            durationInMinutes: 30,
            category: "Cortes",
            image: "",
          },
          {
            id: "2",
            name: "Barba Completa",
            description: "Aparar e modelar a barba",
            priceInCents: 2000, // R$ 20,00
            durationInMinutes: 20,
            category: "Barba",
            image: "",
          },
          {
            id: "3",
            name: "Corte + Barba",
            description: "Pacote completo: corte de cabelo e barba",
            priceInCents: 4500, // R$ 45,00
            durationInMinutes: 45,
            category: "Pacotes",
            image: "",
          },
          {
            id: "4",
            name: "Sobrancelha",
            description: "Design e aparar sobrancelha masculina",
            priceInCents: 1500, // R$ 15,00
            durationInMinutes: 15,
            category: "Acabamento",
            image: "",
          },
        ],
      };
    }
  },

  // Obter detalhes de um serviço (usar produto por ID)
  async getServiceDetails(serviceId) {
    try {
      const response = await api.get(`/products/${serviceId}`);
      return response.data;
    } catch {
      // Fallback quando API desativada ou falhou
      return {
        id: serviceId,
        name: "Serviço (offline)",
        description: "Detalhes indisponíveis sem API remota",
        priceInCents: 0,
        durationInMinutes: 30,
        category: "Geral",
      };
    }
  },

  // Obter funcionários disponíveis
  async getStaff(enterpriseEmail) {
    try {
      const response = await api.get("/barbershop/staff");
      return response.data;
    } catch (error) {
      console.warn(
        "API de funcionários não disponível, tentando Firestore:",
        error
      );

      // Tentar buscar do Firestore
      try {
        const staff = await publicEnterpriseFirestoreService.getStaff(
          enterpriseEmail
        );
        if (staff && staff.length > 0) {
          return {
            success: true,
            data: staff,
          };
        }
      } catch (firestoreError) {
        console.warn(
          "Firestore de funcionários também falhou:",
          firestoreError
        );
      }

      // Último recurso: retornar funcionários padrão
      console.log("Usando funcionários padrão como último recurso");
      return {
        success: true,
        data: [
          {
            id: "staff1",
            name: "João Silva",
            email: "joao@xcorte.com",
            phone: "(11) 99999-1111",
            specialties: ["Cortes", "Barba"],
            rating: 4.8,
            avatar: "",
            schedule: {
              monday: { start: "08:00", end: "18:00", available: true },
              tuesday: { start: "08:00", end: "18:00", available: true },
              wednesday: { start: "08:00", end: "18:00", available: true },
              thursday: { start: "08:00", end: "18:00", available: true },
              friday: { start: "08:00", end: "18:00", available: true },
              saturday: { start: "08:00", end: "16:00", available: true },
              sunday: { start: "08:00", end: "14:00", available: false },
            },
          },
          {
            id: "staff2",
            name: "Pedro Santos",
            email: "pedro@xcorte.com",
            phone: "(11) 99999-2222",
            specialties: ["Cortes", "Sobrancelha"],
            rating: 4.9,
            avatar: "",
            schedule: {
              monday: { start: "09:00", end: "19:00", available: true },
              tuesday: { start: "09:00", end: "19:00", available: true },
              wednesday: { start: "09:00", end: "19:00", available: true },
              thursday: { start: "09:00", end: "19:00", available: true },
              friday: { start: "09:00", end: "19:00", available: true },
              saturday: { start: "09:00", end: "17:00", available: true },
              sunday: { start: "09:00", end: "15:00", available: true },
            },
          },
        ],
      };
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
