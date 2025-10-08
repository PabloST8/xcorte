import { useState, useCallback } from "react";
import { superAdminService } from "../services/superAdminService";
import { firestoreEnterpriseService } from "../services/firestoreEnterpriseService";

export const useSuperAdmin = () => {
  const [enterprises, setEnterprises] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    inactive: 0,
    deleted: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar todas as empresas
  const loadEnterprises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Tentar carregar do Firestore primeiro
      const data = await firestoreEnterpriseService.getEnterprises();
      setEnterprises(data);

      // Debug: Log das empresas para verificar status
      console.log("📊 Debug empresas para estatísticas:");
      data.forEach((e) => {
        const isActive = e.isActive && !e.isBlocked;
        const status = e.isBlocked
          ? "BLOQUEADA"
          : e.isActive
          ? "ATIVA"
          : "INATIVA";
        console.log(
          `- ${e.name}: isActive=${e.isActive}, isBlocked=${e.isBlocked} → ${status}`
        );

        if (!isActive) {
          console.log(`  ⚠️ Esta empresa não está sendo contada como ativa!`);
        }
      });

      // Calcular estatísticas localmente
      const statsData = {
        total: data.length,
        active: data.filter((e) => e.isActive && !e.isBlocked).length,
        blocked: data.filter((e) => e.isBlocked).length,
        inactive: data.filter((e) => !e.isActive).length,
        deleted: 0, // Para compatibilidade
      };

      console.log("📊 Estatísticas calculadas:", statsData);
      setStats(statsData);
    } catch (err) {
      console.log("⚠️ Firestore falhou, tentando serviço alternativo:", err);
      try {
        // Fallback para o serviço original se disponível
        const data = await superAdminService.getEnterprises();
        const activeEnterprises = data.filter((e) => !e.isDeleted);
        setEnterprises(activeEnterprises);

        const statsData = await superAdminService.getEnterpriseStats();
        setStats(statsData);
      } catch (fallbackErr) {
        setError(fallbackErr.message || "Erro ao carregar empresas");
        console.error("Erro ao carregar empresas:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova empresa
  const createEnterprise = useCallback(
    async (enterpriseData) => {
      setLoading(true);
      setError(null);
      try {
        // Usar Firestore diretamente
        const newEnterprise = await firestoreEnterpriseService.createEnterprise(
          enterpriseData
        );
        setEnterprises((prev) => [newEnterprise, ...prev]);

        // Recalcular estatísticas
        const updatedEnterprises = [newEnterprise, ...enterprises];
        const statsData = {
          total: updatedEnterprises.length,
          active: updatedEnterprises.filter((e) => e.isActive && !e.isBlocked)
            .length,
          blocked: updatedEnterprises.filter((e) => e.isBlocked).length,
          inactive: updatedEnterprises.filter((e) => !e.isActive).length,
          deleted: 0,
        };
        setStats(statsData);

        return newEnterprise;
      } catch (err) {
        setError(err.message || "Erro ao criar empresa");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [enterprises]
  );

  // Atualizar empresa
  const updateEnterprise = useCallback(async (enterpriseId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedEnterprise = await superAdminService.updateEnterprise(
        enterpriseId,
        updateData
      );
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === enterpriseId ? updatedEnterprise : enterprise
        )
      );
      return updatedEnterprise;
    } catch (err) {
      setError(err.message || "Erro ao atualizar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bloquear/desbloquear empresa
  const toggleBlockEnterprise = useCallback(async (enterpriseId) => {
    try {
      const newStatus = await superAdminService.toggleBlockEnterprise(
        enterpriseId
      );
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === enterpriseId
            ? { ...enterprise, blocked: newStatus }
            : enterprise
        )
      );

      // Atualizar estatísticas
      const statsData = await superAdminService.getEnterpriseStats();
      setStats(statsData);

      return newStatus;
    } catch (err) {
      setError(err.message || "Erro ao alterar status da empresa");
      throw err;
    }
  }, []);

  // Ativar/desativar empresa
  const toggleActiveEnterprise = useCallback(async (enterpriseId) => {
    try {
      const newStatus = await superAdminService.toggleActiveEnterprise(
        enterpriseId
      );
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === enterpriseId
            ? { ...enterprise, isActive: newStatus }
            : enterprise
        )
      );

      // Atualizar estatísticas
      const statsData = await superAdminService.getEnterpriseStats();
      setStats(statsData);

      return newStatus;
    } catch (err) {
      setError(err.message || "Erro ao alterar status ativo da empresa");
      throw err;
    }
  }, []);

  // Excluir empresa
  const deleteEnterprise = useCallback(async (enterpriseId) => {
    try {
      await superAdminService.deleteEnterprise(enterpriseId);
      setEnterprises((prev) =>
        prev.filter((enterprise) => enterprise.id !== enterpriseId)
      );

      // Atualizar estatísticas
      const statsData = await superAdminService.getEnterpriseStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message || "Erro ao excluir empresa");
      throw err;
    }
  }, []);

  // Buscar empresa por ID
  const getEnterpriseById = useCallback(async (enterpriseId) => {
    try {
      return await superAdminService.getEnterpriseById(enterpriseId);
    } catch (err) {
      setError(err.message || "Erro ao buscar empresa");
      throw err;
    }
  }, []);

  // Filtrar empresas por status
  const filterEnterprisesByStatus = useCallback(
    (statusFilter) => {
      switch (statusFilter) {
        case "active":
          return enterprises.filter(
            (e) => e.isActive && !e.isBlocked && !e.isDeleted
          );
        case "blocked":
          return enterprises.filter((e) => e.isBlocked && !e.isDeleted);
        case "inactive":
          return enterprises.filter(
            (e) => !e.isActive && !e.isBlocked && !e.isDeleted
          );
        case "deleted":
          return enterprises.filter((e) => e.isDeleted);
        case "all":
        default:
          return enterprises;
      }
    },
    [enterprises]
  );

  return {
    enterprises,
    stats,
    loading,
    error,
    loadEnterprises,
    createEnterprise,
    updateEnterprise,
    toggleBlockEnterprise,
    toggleActiveEnterprise,
    deleteEnterprise,
    getEnterpriseById,
    filterEnterprisesByStatus,
  };
};
