import api from "./api";
import { validateProduct } from "../types/api.js";

// Serviços de Produtos/Serviços
export const productService = {
  // Listar produtos de uma empresa
  async getProducts(enterpriseEmail, category = null, active = true) {
    try {
      const params = new URLSearchParams({
        enterpriseEmail,
        ...(category && { category }),
        ...(active !== null && { active: active.toString() }),
      });

      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Listar apenas produtos ativos
  async getActiveProducts(enterpriseEmail = null) {
    try {
      const params = new URLSearchParams();
      if (enterpriseEmail) {
        params.append("enterpriseEmail", enterpriseEmail);
      }

      const response = await api.get(`/products/active?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Criar produto (apenas admins)
  async createProduct(productData) {
    try {
      // Validar dados do produto antes de enviar
      const errors = validateProduct(productData);
      if (errors.length > 0) {
        throw new Error(`Dados inválidos: ${errors.join(", ")}`);
      }

      const response = await api.post("/products", productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar produto (apenas admins)
  async updateProduct(productId, productData) {
    try {
      // Validar dados do produto antes de enviar
      const errors = validateProduct(productData);
      if (errors.length > 0) {
        throw new Error(`Dados inválidos: ${errors.join(", ")}`);
      }

      const response = await api.put(`/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Deletar produto (apenas admins)
  async deleteProduct(productId) {
    try {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
