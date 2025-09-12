import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Hook para gerenciar a atualização forçada dos agendamentos
 * Fornece uma forma de forçar o refresh de todas as queries relacionadas aos agendamentos
 */
export const useAppointmentsRefresh = () => {
  const queryClient = useQueryClient();

  const forceRefreshAppointments = useCallback(async () => {
    console.log("🔄 Forçando refresh completo dos agendamentos...");

    try {
      // 1. Remover todas as queries de agendamentos do cache
      queryClient.removeQueries({ queryKey: ["user-appointments"] });

      // 2. Invalidar todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ["user-appointments"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "appointments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard-stats"],
      });

      // 3. Forçar refetch de todas as queries relacionadas
      await queryClient.refetchQueries({ queryKey: ["user-appointments"] });

      console.log("✅ Refresh dos agendamentos concluído");
    } catch (error) {
      console.error("❌ Erro ao fazer refresh dos agendamentos:", error);
    }
  }, [queryClient]);

  const clearAppointmentsCache = useCallback(() => {
    console.log("🗑️ Limpando cache dos agendamentos...");
    queryClient.removeQueries({ queryKey: ["user-appointments"] });
    queryClient.removeQueries({ queryKey: ["admin", "appointments"] });
  }, [queryClient]);

  return {
    forceRefreshAppointments,
    clearAppointmentsCache,
  };
};
