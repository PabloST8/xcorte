import axios from "axios";
import Cookies from "js-cookie";
import { USE_REMOTE_API, REMOTE_API_BASE_URL } from "../config";

// Se a API remota estiver desativada, usamos um baseURL fictício e interceptamos todas as requisições
const API_BASE_URL = USE_REMOTE_API ? REMOTE_API_BASE_URL : "/__api_disabled__";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

if (!USE_REMOTE_API) {
  // Intercepta qualquer requisição e cancela imediatamente
  api.interceptors.request.use(() => {
    throw new axios.Cancel("REMOTE_API_DISABLED");
  });
}

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    // Não enviar Authorization para sessões locais simples (token "simple-*")
    const isSimpleSession =
      typeof token === "string" && token.startsWith("simple-");
    if (token && !isSimpleSession) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
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
    if (axios.isCancel(error)) {
      return Promise.reject({
        message: "API remota desativada",
        code: "REMOTE_API_DISABLED",
      });
    }
    if (error.response?.status === 401) {
      const token = Cookies.get("auth_token");
      const hasToken = typeof token === "string" && token.length > 0;
      const isSimpleSession = hasToken && token.startsWith("simple-");
      // Só redireciona quando há um token real do backend e ele falhou
      if (hasToken && !isSimpleSession) {
        // Limpar cookies com diferentes configurações de path
        Cookies.remove("auth_token", { path: "/" });
        Cookies.remove("user_data", { path: "/" });
        Cookies.remove("auth_token");
        Cookies.remove("user_data");

        // Política: não usar localStorage

        // Deixe o ProtectedRoute cuidar de redirecionar para a rota correta
      }
    }
    return Promise.reject(error);
  }
);

export default api;
