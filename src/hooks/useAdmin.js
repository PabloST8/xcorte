import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/adminService";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      const response = await adminService.getDashboardStats();
      return response.success ? response.data : null;
    },
    staleTime: 60 * 1000,
  });
};

// Hook para obter todos os agendamentos (admin)
export const useAllAppointments = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "appointments", params],
    queryFn: async () => {
      const response = await adminService.getAllAppointments(params);
      return response.success ? response.data : [];
    },
    staleTime: 30 * 1000, // 30 segundos
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

// Hook para obter todos os serviços
export const useServices = () => {
  return useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const response = await adminService.getServices();
      return response.success ? response.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter todos os funcionários
export const useStaff = () => {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const response = await adminService.getStaff();
      return response.success ? response.data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para criar serviço
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para atualizar serviço
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, serviceData }) =>
      adminService.updateService(serviceId, serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para deletar serviço
export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });
};

// Hook para criar funcionário
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para atualizar funcionário
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, staffData }) =>
      adminService.updateStaff(staffId, staffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para deletar funcionário
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });
};

// Hook para obter todos os clientes
export const useAllClients = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "clients", params],
    queryFn: async () => {
      const response = await adminService.getAllClients(params);
      return response.success ? response.data : [];
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

// Hook para obter relatório financeiro
export const useFinancialReport = (params) => {
  return useQuery({
    queryKey: ["admin", "financial-report", params],
    queryFn: async () => {
      const response = await adminService.getFinancialReport(params);
      return response.success ? response.data : null;
    },
    enabled: !!(params.startDate && params.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter relatório de agendamentos
export const useAppointmentsReport = (params) => {
  return useQuery({
    queryKey: ["admin", "appointments-report", params],
    queryFn: async () => {
      const response = await adminService.getAppointmentsReport(params);
      return response.success ? response.data : null;
    },
    enabled: !!(params.startDate && params.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
