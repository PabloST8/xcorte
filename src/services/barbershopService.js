import api from "./api";
import { productService } from "./productService";
// import { enterpriseService } from "./enterpriseService"; // DESABILITADO
import { publicEnterpriseFirestoreService } from "./publicEnterpriseFirestoreService";
import { firestoreAppointmentsService } from "./firestoreAppointmentsService";
import { USE_REMOTE_API } from "../config";

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
    console.log("🔍 barbershopService.getServices para:", enterpriseEmail);

    try {
      const apiResponse = await productService.getProducts(enterpriseEmail);
      console.log("✅ API de produtos respondeu:", apiResponse);
      return apiResponse;
    } catch (error) {
      console.warn(
        "⚠️ API de produtos não disponível, tentando Firestore:",
        error
      );

      // Tentar buscar do Firestore
      try {
        const services = await publicEnterpriseFirestoreService.getServices(
          enterpriseEmail
        );
        console.log("🔍 Firestore retornou serviços:", services);

        if (services && services.length > 0) {
          console.log("✅ Usando serviços do Firestore");
          return {
            success: true,
            data: services,
          };
        }

        console.log("⚠️ Firestore não retornou serviços, usando lista vazia");
        // Se não há serviços no Firestore, retornar lista vazia em vez de fallback
        return {
          success: true,
          data: [],
        };
      } catch (firestoreError) {
        console.warn("❌ Firestore de produtos também falhou:", firestoreError);

        // Retornar lista vazia em vez de fallback
        console.log("❌ Retornando lista vazia - nenhum serviço encontrado");
        return {
          success: true,
          data: [],
        };
      }
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
      // Tentar o endpoint de employees
      const response = await api.get(
        `/employees?enterpriseEmail=${enterpriseEmail}`
      );
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
    if (USE_REMOTE_API) {
      try {
        const response = await api.post("/appointments", appointmentData);
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    } else {
      // Usar Firestore quando API estiver desabilitada
      console.log(
        "🔄 API desabilitada, usando Firestore para criar agendamento"
      );
      return await firestoreAppointmentsService.createAppointment(
        appointmentData
      );
    }
  },

  // Obter agendamentos do usuário
  async getUserAppointments(params = {}) {
    if (USE_REMOTE_API) {
      try {
        // Usar o mesmo endpoint que o bookingApiService
        const response = await api.get("/bookings", { params });
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    } else {
      // Usar Firestore quando API estiver desabilitada
      console.log(
        "🔄 API desabilitada, usando Firestore para buscar agendamentos"
      );
      return await firestoreAppointmentsService.getAppointments(params);
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
