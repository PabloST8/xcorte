import api from "./api";

// Serviços de Empresas
export const enterpriseService = {
  // Listar todas as empresas
  async getEnterprises() {
    try {
      const response = await api.get("/enterprises");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter empresa por email
  async getEnterpriseByEmail(email) {
    try {
      const response = await api.get(`/enterprises/${email}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Criar empresa
  async createEnterprise(enterpriseData) {
    try {
      const response = await api.post("/enterprises", enterpriseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar empresa
  async updateEnterprise(email, enterpriseData) {
    try {
      const response = await api.put(`/enterprises/${email}`, enterpriseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
