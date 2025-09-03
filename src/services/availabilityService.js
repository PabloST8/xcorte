import api from "./api";

// Serviços de Disponibilidade
export const availabilityService = {
  // Verificar disponibilidade
  async checkAvailability(
    date,
    enterpriseEmail,
    productId = null,
    employeeId = null
  ) {
    try {
      const requestData = {
        date,
        enterpriseEmail,
        ...(productId && { productId }),
        ...(employeeId && { employeeId }),
      };

      const response = await api.post("/availability/check", requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter slots disponíveis
  async getAvailableSlots(
    enterpriseEmail,
    date = null,
    productId = null,
    employeeId = null
  ) {
    try {
      const params = new URLSearchParams({
        enterpriseEmail,
        ...(date && { date }),
        ...(productId && { productId }),
        ...(employeeId && { employeeId }),
      });

      const response = await api.get(
        `/availability/slots?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verificar disponibilidade de funcionário para serviço
  async checkEmployeeServiceAvailability(date, employeeId, productId) {
    try {
      const requestData = { date, employeeId, productId };
      const response = await api.post(
        "/employees/availability/check",
        requestData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter disponibilidade de funcionário para serviço
  async getEmployeeServiceAvailability(
    enterpriseEmail,
    date = null,
    productId = null
  ) {
    try {
      const params = new URLSearchParams({
        enterpriseEmail,
        ...(date && { date }),
        ...(productId && { productId }),
      });

      const response = await api.get(
        `/employees/availability/service?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter slots de funcionário
  async getEmployeeSlots(enterpriseEmail, date = null, employeeId = null) {
    try {
      const params = new URLSearchParams({
        enterpriseEmail,
        ...(date && { date }),
        ...(employeeId && { employeeId }),
      });

      const response = await api.get(
        `/employees/availability/slots?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter slots de funcionário para serviço específico
  async getEmployeeServiceSlots(employeeId, date = null, productId = null) {
    try {
      const params = new URLSearchParams({
        ...(date && { date }),
        ...(productId && { productId }),
      });

      const response = await api.get(
        `/employees/${employeeId}/availability/service-slots?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
