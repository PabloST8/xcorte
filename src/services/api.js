import axios from "axios";
import Cookies from "js-cookie";

// Base URL dinâmica:
// 1. Usa variável de ambiente VITE_API_BASE_URL se definida (produção build).
// 2. Em desenvolvimento (localhost) usa caminho relativo /api para passar pelo proxy do Vite.
// 3. Fallback final para domínio público.
const API_BASE_URL =
  import.meta?.env?.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "/api"
    : "https://x-corte-api.hiarley.me");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      Cookies.remove("auth_token");
      Cookies.remove("user_data");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;
