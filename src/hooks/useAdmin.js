import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";
import { firestoreDashboardService } from "../services/firestoreDashboardService";
import { firestoreAppointmentsService } from "../services/firestoreAppointmentsService";
import { firestoreClientsService } from "../services/firestoreClientsService";
import { firestoreProductsService } from "../services/firestoreProductsService";
import { employeeFirestoreService } from "../services/employeeFirestoreService";

export const useDashboardStats = () => {
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useQuery({
    queryKey: ["admin", "dashboard-stats", enterpriseEmail],
    queryFn: async () => {
      // Tentar buscar dados do Firestore primeiro
      try {
        const response = await firestoreDashboardService.getDashboardStats(
          enterpriseEmail
        );
        if (response.success && response.data) {
          return response.data;
        }
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para dados mockados se Firestore falhar
      const fallbackResponse = await adminService.getDashboardStats();
      return fallbackResponse.success ? fallbackResponse.data : null;
    },
    staleTime: 60 * 1000, // 1 minuto
    retry: 1,
  });
};

// Hook para obter todos os agendamentos (admin) - usando Firestore
export const useAllAppointments = (params = {}) => {
  // Fixar o email da empresa para evitar mudanças durante o carregamento
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useQuery({
    queryKey: ["admin", "appointments", params, enterpriseEmail],
    queryFn: async () => {
      // Tentar buscar do Firestore primeiro
      try {
        const filters = {
          enterpriseEmail: enterpriseEmail, // Usar email fixo
          ...params,
        };

        const response = await firestoreAppointmentsService.getAppointments(
          filters
        );

        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.log(
          "Firestore indisponível para agendamentos, usando fallback:",
          error
        );
      }

      // Fallback para dados mockados se Firestore falhar
      const fallbackResponse = await adminService.getAllAppointments(params);
      return fallbackResponse.success ? fallbackResponse.data : [];
    },
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  });
};

// Hook para atualizar status do agendamento
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, status }) =>
      adminService.updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
    },
  });
};

// Hook para deletar agendamento
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  // Fixar o email da empresa
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async (appointmentId) => {
      // Tentar deletar do Firestore primeiro
      try {
        const response = await firestoreAppointmentsService.deleteAppointment(
          appointmentId,
          enterpriseEmail
        );
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.log("Erro ao deletar do Firestore:", error);
      }

      // Se falhar, poderia ter fallback para API, mas por ora apenas retorna erro
      throw new Error("Falha ao deletar agendamento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
    },
  });
};

// Hook para obter todos os serviços
export const useServices = () => {
  // Fixar o email da empresa
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useQuery({
    queryKey: ["admin", "services", enterpriseEmail],
    queryFn: async () => {
      // Tentar buscar do Firestore primeiro
      try {
        const filters = {
          enterpriseEmail: enterpriseEmail,
        };

        const response = await firestoreProductsService.getProducts(filters);

        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.log(
          "Firestore indisponível para serviços, usando fallback:",
          error
        );
      }

      // Fallback para dados mockados se Firestore falhar
      const fallbackResponse = await adminService.getServices();
      return fallbackResponse.success ? fallbackResponse.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter todos os funcionários
export const useStaff = () => {
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useQuery({
    queryKey: ["admin", "staff", enterpriseEmail],
    queryFn: async () => {
      // Tentar buscar do Firestore primeiro
      try {
        const response = await employeeFirestoreService.list(enterpriseEmail);
        return response || [];
      } catch (error) {
        console.log(
          "Firestore indisponível para funcionários, usando fallback:",
          error
        );
      }

      // Fallback para dados mockados se Firestore falhar
      const fallbackResponse = await adminService.getStaff();
      return fallbackResponse.success ? fallbackResponse.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
};

// Hook para criar serviço
export const useCreateService = () => {
  const queryClient = useQueryClient();
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async (serviceData) => {
      // Tentar criar no Firestore primeiro
      try {
        const response = await firestoreProductsService.createProduct(
          serviceData,
          enterpriseEmail
        );
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.createService(serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para atualizar serviço
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async ({ serviceId, serviceData }) => {
      // Tentar atualizar no Firestore primeiro
      try {
        const response = await firestoreProductsService.updateProduct(
          serviceId,
          serviceData,
          enterpriseEmail
        );
        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.updateService(serviceId, serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para deletar serviço
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async (serviceId) => {
      // Tentar deletar do Firestore primeiro
      try {
        const response = await firestoreProductsService.deleteProduct(
          serviceId,
          enterpriseEmail
        );
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.deleteService(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para criar funcionário
export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async (staffData) => {
      // Tentar criar no Firestore primeiro
      try {
        const dataWithEnterprise = {
          ...staffData,
          enterpriseEmail: enterpriseEmail,
        };
        const result = await employeeFirestoreService.create(
          dataWithEnterprise
        );
        return result;
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.createStaff(staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para atualizar funcionário
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useMutation({
    mutationFn: async ({ id, ...staffData }) => {
      // Tentar atualizar no Firestore primeiro
      try {
        const dataWithEnterprise = {
          ...staffData,
          enterpriseEmail: enterpriseEmail,
        };
        const result = await employeeFirestoreService.update(
          id,
          dataWithEnterprise
        );
        return result;
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.updateStaff(id, staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para deletar funcionário
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId) => {
      // Tentar deletar do Firestore primeiro
      try {
        const result = await employeeFirestoreService.delete(staffId);
        return result;
      } catch (error) {
        console.log("Firestore indisponível, usando fallback:", error);
      }

      // Fallback para adminService
      return adminService.deleteStaff(staffId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para obter todos os clientes
export const useAllClients = (params = {}) => {
  // Fixar o email da empresa
  const enterpriseEmail = "empresaadmin@xcortes.com";

  return useQuery({
    queryKey: ["admin", "clients", params, enterpriseEmail],
    queryFn: async () => {
      // Tentar buscar do Firestore primeiro
      try {
        const filters = {
          enterpriseEmail: enterpriseEmail,
          ...params,
        };

        const response = await firestoreClientsService.getClients(filters);

        if (response.success) {
          return response.data;
        }
      } catch (error) {
        console.log(
          "Firestore indisponível para clientes, usando fallback:",
          error
        );
      }

      // Fallback para dados mockados se Firestore falhar
      const fallbackResponse = await adminService.getAllClients(params);
      return fallbackResponse.success ? fallbackResponse.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter detalhes do cliente
export const useClientDetails = (clientId) => {
  return useQuery({
    queryKey: ["admin", "client-details", clientId],
    queryFn: async () => {
      const response = await adminService.getClientDetails(clientId);
      return response.success ? response.data : null;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
