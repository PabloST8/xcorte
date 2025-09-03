import api from "./api";

// Serviços de Funcionários
export const employeeService = {
  // Listar funcionários
  async getEmployees(enterpriseEmail) {
    try {
      const params = new URLSearchParams({ enterpriseEmail });
      const response = await api.get(`/employees?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter funcionário por ID
  async getEmployee(employeeId) {
    try {
      const response = await api.get(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Criar funcionário
  async createEmployee(employeeData) {
    try {
      const response = await api.post("/employees", employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar funcionário
  async updateEmployee(employeeId, employeeData) {
    try {
      const response = await api.put(`/employees/${employeeId}`, employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Deletar funcionário
  async deleteEmployee(employeeId) {
    try {
      const response = await api.delete(`/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Adicionar habilidade ao funcionário
  async addEmployeeSkill(employeeId, productId) {
    try {
      const response = await api.post(`/employees/${employeeId}/skills`, {
        productId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remover habilidade do funcionário
  async removeEmployeeSkill(employeeId, productId) {
    try {
      const response = await api.delete(
        `/employees/${employeeId}/skills/${productId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
