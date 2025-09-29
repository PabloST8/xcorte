import { useState, useCallback } from "react";
import { bookingApiService } from "../services/bookingApiService";
import { useEnterprise } from "../contexts/EnterpriseContext";

/**
 * Hook para gerenciar agendamentos com a API
 * 🚀 USA A API: https://x-corte-api.codxis.com.br/api/bookings
 */
export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentEnterprise } = useEnterprise();

  const enterpriseEmail = currentEnterprise?.email;

  console.log("🎯 [useBookings] Hook inicializado:", {
    enterpriseEmail,
    usando: "API Local (temporário - aguardando CORS)",
    endpoint: "http://localhost:3001/api/bookings",
  });

  /**
   * Carregar agendamentos
   */
  const loadBookings = useCallback(
    async (date = null, status = null) => {
      console.log("🔄 [useBookings] loadBookings chamado:", {
        enterpriseEmail,
        date,
        status,
      });

      if (!enterpriseEmail) {
        setError("Email da empresa não encontrado");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("📡 [useBookings] Chamando API Fastify...");
        const result = await bookingApiService.getBookings(
          enterpriseEmail,
          date,
          status
        );

        console.log("📊 [useBookings] Resultado da API:", result);

        if (result.success) {
          setBookings(result.data || []);
          console.log(
            "✅ [useBookings] Agendamentos carregados:",
            result.data?.length || 0
          );
        } else {
          setError(result.error || "Erro ao carregar agendamentos");
          console.error("❌ [useBookings] Erro da API:", result.error);
        }
      } catch (err) {
        setError(err.message || "Erro inesperado");
        console.error("💥 [useBookings] Erro inesperado:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [enterpriseEmail]
  );

  /**
   * Criar agendamento
   */
  const createBooking = useCallback(
    async (bookingData) => {
      console.log("🆕 [useBookings] createBooking chamado:", bookingData);

      if (!enterpriseEmail) {
        throw new Error("Email da empresa não encontrado");
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("📡 [useBookings] Criando via API Fastify...");
        const result = await bookingApiService.createBooking({
          ...bookingData,
          enterpriseEmail,
        });

        console.log("📊 [useBookings] Resultado criação:", result);

        if (result.success) {
          console.log(
            "✅ [useBookings] Agendamento criado, recarregando lista..."
          );
          // Recarregar lista de agendamentos
          await loadBookings();
          return result;
        } else {
          setError(result.error || "Erro ao criar agendamento");
          console.error("❌ [useBookings] Erro ao criar:", result.error);
          return result;
        }
      } catch (err) {
        const error = err.message || "Erro inesperado";
        setError(error);
        console.error("💥 [useBookings] Erro inesperado ao criar:", err);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [enterpriseEmail, loadBookings]
  );

  /**
   * Confirmar agendamento
   */
  const confirmBooking = useCallback(
    async (bookingId) => {
      if (!enterpriseEmail) {
        throw new Error("Email da empresa não encontrado");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await bookingApiService.confirmBooking(
          enterpriseEmail,
          bookingId
        );

        if (result.success) {
          // Recarregar lista de agendamentos
          await loadBookings();
          return result;
        } else {
          setError(result.error || "Erro ao confirmar agendamento");
          return result;
        }
      } catch (err) {
        const error = err.message || "Erro inesperado";
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [enterpriseEmail, loadBookings]
  );

  /**
   * Cancelar agendamento
   */
  const cancelBooking = useCallback(
    async (bookingId) => {
      if (!enterpriseEmail) {
        throw new Error("Email da empresa não encontrado");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await bookingApiService.cancelBooking(
          enterpriseEmail,
          bookingId
        );

        if (result.success) {
          // Recarregar lista de agendamentos
          await loadBookings();
          return result;
        } else {
          setError(result.error || "Erro ao cancelar agendamento");
          return result;
        }
      } catch (err) {
        const error = err.message || "Erro inesperado";
        setError(error);
        return { success: false, error };
      } finally {
        setIsLoading(false);
      }
    },
    [enterpriseEmail, loadBookings]
  );

  /**
   * Buscar funcionários disponíveis
   */
  const getAvailableEmployees = useCallback(
    async (productId, date, startTime) => {
      if (!enterpriseEmail) {
        throw new Error("Email da empresa não encontrado");
      }

      try {
        const result = await bookingApiService.getAvailableEmployees(
          enterpriseEmail,
          productId,
          date,
          startTime
        );
        return result;
      } catch (err) {
        return {
          success: false,
          error: err.message || "Erro ao buscar funcionários disponíveis",
        };
      }
    },
    [enterpriseEmail]
  );

  return {
    // Estado
    bookings,
    isLoading,
    error,

    // Ações
    loadBookings,
    createBooking,
    confirmBooking,
    cancelBooking,
    getAvailableEmployees,

    // Limpeza de erro
    clearError: () => setError(null),
  };
};

/**
 * Hook para gerenciar lembretes
 */
export const useReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carregar lembretes ativos
   */
  const loadActiveReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookingApiService.getActiveReminders();

      if (result.success) {
        setReminders(result.reminders || []);
      } else {
        setError(result.error || "Erro ao carregar lembretes");
      }
    } catch (err) {
      setError(err.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Testar lembrete simples
   */
  const testReminder = useCallback(async (phone) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookingApiService.testSimpleReminder(phone);
      return result;
    } catch (err) {
      const error = err.message || "Erro ao testar lembrete";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado
    reminders,
    isLoading,
    error,

    // Ações
    loadActiveReminders,
    testReminder,

    // Limpeza de erro
    clearError: () => setError(null),
  };
};
