import api from "./api";

// Serviços de Autenticação
export const authService = {
  // Registro de usuário
  async register(userData) {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login
  async login(credentials) {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verificação de código (SMS/Email)
  async verifyCode(verificationData) {
    try {
      const response = await api.post("/auth/verify", verificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reenviar código de verificação
  async resendCode(data) {
    try {
      const response = await api.post("/auth/resend-code", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  async logout() {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Recuperação de senha
  async forgotPassword(email) {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reset de senha
  async resetPassword(resetData) {
    try {
      const response = await api.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obter perfil do usuário autenticado
  async getProfile() {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Serviços de Usuário
export const userService = {
  // Obter perfil do usuário
  async getProfile() {
    try {
      const response = await api.get("/users/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atualizar perfil
  async updateProfile(userData) {
    try {
      const response = await api.put("/users/profile", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload de foto de perfil
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await api.post("/users/profile/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
