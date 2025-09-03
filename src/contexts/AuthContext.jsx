import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authService } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get("auth_token");
        const userData = Cookies.get("user_data");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Erro ao verificar status de autenticação:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = Cookies.get("auth_token");
      const userData = Cookies.get("user_data");

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);

      // A API retorna { success: true, data: { token } }
      if (response.success && response.data && response.data.token) {
        // Salvar token primeiro
        Cookies.set("auth_token", response.data.token, { expires: 7 });

        if (response.data.user) {
          // Cenário ideal: token + user
          Cookies.set("user_data", JSON.stringify(response.data.user), {
            expires: 7,
          });
          setUser(response.data.user);
          setIsAuthenticated(true);
          return { success: true, user: response.data.user };
        } else {
          // Cenário real: apenas token, buscar dados do usuário
          try {
            const profileResponse = await authService.getProfile();
            if (profileResponse.success && profileResponse.data) {
              Cookies.set("user_data", JSON.stringify(profileResponse.data), {
                expires: 7,
              });
              setUser(profileResponse.data);
              setIsAuthenticated(true);
              return { success: true, user: profileResponse.data };
            } else {
              // Fallback: login sem dados do usuário
              setIsAuthenticated(true);
              return { success: true, user: null };
            }
          } catch (profileError) {
            console.error("Erro ao buscar perfil:", profileError);
            // Fallback: login sem dados do usuário
            setIsAuthenticated(true);
            return { success: true, user: null };
          }
        }
      } else {
        console.error("Estrutura de resposta inválida:", response);
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, error: error.message || "Erro no login" };
    }
  };

  const register = async (userData) => {
    try {
      // Backend exige 'role'; definir padrão se não vier do formulário
      // API só aceita "admin" ou "client", não "user"
      const payload = { role: "client", ...userData };
      const response = await authService.register(payload);

      // A API retorna { success: true, data: { uid, email, name, ... } }
      if (response.success && response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: true, data: response }; // Fallback para compatibilidade
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      return { success: false, error: error.message || "Erro no registro" };
    }
  };

  const verifyCode = async (verificationData) => {
    try {
      const response = await authService.verifyCode(verificationData);

      if (response.token && response.user) {
        // Salvar token e dados do usuário nos cookies
        Cookies.set("auth_token", response.token, { expires: 7 });
        Cookies.set("user_data", JSON.stringify(response.user), { expires: 7 });

        setUser(response.user);
        setIsAuthenticated(true);

        return { success: true, user: response.user };
      }

      return { success: true, data: response };
    } catch (error) {
      console.error("Erro na verificação:", error);
      return { success: false, error: error.message || "Erro na verificação" };
    }
  };

  const logout = async () => {
    try {
      // Tentar fazer logout no servidor
      await authService.logout();
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      // Limpar dados locais independentemente do resultado
      Cookies.remove("auth_token");
      Cookies.remove("user_data");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    Cookies.set("user_data", JSON.stringify(updatedUser), { expires: 7 });
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    verifyCode,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
