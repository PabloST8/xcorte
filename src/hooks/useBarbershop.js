import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  barbershopService,
  appointmentService,
} from "../services/barbershopService";

// Hook para obter serviços da barbearia
export const useServices = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: barbershopService.getServices,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obter detalhes de um serviço
export const useServiceDetails = (serviceId) => {
  return useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => barbershopService.getServiceDetails(serviceId),
    enabled: !!serviceId,
  });
};

// Hook para obter funcionários
export const useStaff = () => {
  return useQuery({
    queryKey: ["staff"],
    queryFn: barbershopService.getStaff,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook para obter detalhes de um funcionário
export const useStaffDetails = (staffId) => {
  return useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => barbershopService.getStaffDetails(staffId),
    enabled: !!staffId,
  });
};

// Hook para obter horários disponíveis
export const useAvailableSlots = (params) => {
  return useQuery({
    queryKey: ["available-slots", params],
    queryFn: () => barbershopService.getAvailableSlots(params),
    enabled: !!(params.date && params.serviceId),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obter agendamentos do usuário
export const useUserAppointments = (params = {}) => {
  return useQuery({
    queryKey: ["user-appointments", params],
    queryFn: () => appointmentService.getUserAppointments(params),
    staleTime: 30 * 1000, // 30 segundos
  });
};

// Hook para criar agendamento
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      // Invalidar cache dos agendamentos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["user-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
};

// Hook para cancelar agendamento
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, reason }) =>
      appointmentService.cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-appointments"] });
    },
  });
};

// Hook para reagendar agendamento
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, newDateTime }) =>
      appointmentService.rescheduleAppointment(appointmentId, newDateTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
};

// Hook para avaliar atendimento
export const useRateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, ratingData }) =>
      appointmentService.rateAppointment(appointmentId, ratingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-appointments"] });
    },
  });
};

// =====================
// CRUD de Serviços (Admin)
// =====================

// Criar serviço
export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: barbershopService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

// Atualizar serviço
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, serviceData }) =>
      barbershopService.updateService(serviceId, serviceData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      if (variables?.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", variables.serviceId],
        });
      }
    },
  });
};

// Deletar serviço
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: barbershopService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
};
