/**
 * Utilitário para limpeza de dados inválidos do Firestore
 */

import { employeeFirestoreService } from "../services/employeeFirestoreService";

export const dataCleanupUtils = {
  /**
   * Identifica funcionários com dados inválidos
   */
  async findInvalidEmployees(enterpriseEmail) {
    try {
      const employees = await employeeFirestoreService.list(enterpriseEmail);

      const invalidEmployees = employees.filter((emp) => {
        // Funcionários sem nome ou com nome vazio
        if (!emp.name || emp.name.trim() === "") {
          console.warn("❌ Funcionário sem nome:", emp);
          return true;
        }

        // Funcionários sem email
        if (!emp.email || emp.email.trim() === "") {
          console.warn("❌ Funcionário sem email:", emp);
          return true;
        }

        // Funcionários com dados inconsistentes
        if (!emp.position || emp.position.trim() === "") {
          console.warn("❌ Funcionário sem cargo:", emp);
          return true;
        }

        return false;
      });

      console.log(
        `🔍 Encontrados ${invalidEmployees.length} funcionários inválidos de ${employees.length} total`
      );
      return invalidEmployees;
    } catch (error) {
      console.error("❌ Erro ao buscar funcionários inválidos:", error);
      throw error;
    }
  },

  /**
   * Remove funcionários com dados inválidos
   */
  async cleanupInvalidEmployees(enterpriseEmail, dryRun = true) {
    try {
      const invalidEmployees = await this.findInvalidEmployees(enterpriseEmail);

      if (invalidEmployees.length === 0) {
        console.log("✅ Nenhum funcionário inválido encontrado");
        return { removed: 0, errors: [] };
      }

      if (dryRun) {
        console.log(
          `🔍 MODO SIMULAÇÃO: ${invalidEmployees.length} funcionários seriam removidos:`,
          invalidEmployees.map((emp) => ({
            id: emp.id,
            name: emp.name,
            email: emp.email,
          }))
        );
        return {
          wouldRemove: invalidEmployees.length,
          employees: invalidEmployees,
        };
      }

      // Executar remoção real
      let removed = 0;
      const errors = [];

      for (const employee of invalidEmployees) {
        try {
          await employeeFirestoreService.remove(employee.id);
          console.log(
            `✅ Funcionário removido: ${employee.id} - ${employee.name}`
          );
          removed++;
        } catch (error) {
          console.error(
            `❌ Erro ao remover funcionário ${employee.id}:`,
            error
          );
          errors.push({ employee, error: error.message });
        }
      }

      console.log(
        `✅ Limpeza concluída: ${removed} funcionários removidos, ${errors.length} erros`
      );
      return { removed, errors };
    } catch (error) {
      console.error("❌ Erro na limpeza de funcionários:", error);
      throw error;
    }
  },
};

/**
 * Função global para usar no console do navegador
 */
window.cleanupInvalidEmployees = async (enterpriseEmail, dryRun = true) => {
  try {
    if (!enterpriseEmail) {
      console.error("❌ Email da empresa é obrigatório");
      return;
    }

    const result = await dataCleanupUtils.cleanupInvalidEmployees(
      enterpriseEmail,
      dryRun
    );
    console.log("📊 Resultado da limpeza:", result);
    return result;
  } catch (error) {
    console.error("❌ Erro na limpeza:", error);
  }
};
