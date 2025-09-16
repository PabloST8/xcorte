import { useState, useCallback } from "react";
import { superAdminService } from "../services/superAdminService";

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
      const data = await superAdminService.getEnterprises();
      // Filtrar empresas não deletadas por padrão
      const activeEnterprises = data.filter((e) => !e.isDeleted);
      setEnterprises(activeEnterprises);

      // Carregar estatísticas
      const statsData = await superAdminService.getEnterpriseStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message || "Erro ao carregar empresas");
      console.error("Erro ao carregar empresas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova empresa
  const createEnterprise = useCallback(async (enterpriseData) => {
    setLoading(true);
    setError(null);
    try {
      const newEnterprise = await superAdminService.createEnterprise(
        enterpriseData
      );
      setEnterprises((prev) => [newEnterprise, ...prev]);

      // Atualizar estatísticas
      const statsData = await superAdminService.getEnterpriseStats();
      setStats(statsData);

      return newEnterprise;
    } catch (err) {
      setError(err.message || "Erro ao criar empresa");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
            ? { ...enterprise, isBlocked: newStatus }
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
          return enterprises.filter((e) => e.isActive && !e.isBlocked);
        case "blocked":
          return enterprises.filter((e) => e.isBlocked);
        case "inactive":
          return enterprises.filter((e) => !e.isActive);
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
