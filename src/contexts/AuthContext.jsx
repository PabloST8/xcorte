import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authService } from "../services/authService";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

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

  // Login simples: telefone (sem senha/OTP); carrega usuário existente do Firestore
  const simplePhoneLogin = async ({ phone }) => {
    try {
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      if (!cleanPhone) throw new Error("Telefone obrigatório");

      const userRef = doc(db, "users", cleanPhone);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return {
          success: false,
          error: "Usuário não encontrado. Faça o cadastro.",
        };
      }

      const data = snap.data() || {};
      const userObj = {
        id: data.id || snap.id || cleanPhone,
        name: data.name || "Cliente",
        phone: data.phone || cleanPhone,
        role: data.role || "client",
        createdAt: data.createdAt || new Date().toISOString(),
        ...data,
      };

      Cookies.set("auth_token", `simple-${userObj.id}`, { expires: 30 });
      Cookies.set("user_data", JSON.stringify(userObj), { expires: 30 });
      setUser(userObj);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, user: userObj };
    } catch (error) {
      return { success: false, error: error.message || "Falha no login" };
    }
  };

  // Registro simples: nome + telefone (sem senha)
  const simpleRegister = async ({ name, phone }) => {
    try {
      const cleanPhone = String(phone || "").replace(/\D/g, "");
      const displayName = String(name || "").trim();
      if (!cleanPhone || !displayName) {
        throw new Error("Nome e telefone são obrigatórios");
      }
      const userRef = doc(db, "users", cleanPhone);
      // Cria/atualiza mantendo o mesmo ID do telefone puro
      await setDoc(
        userRef,
        {
          id: cleanPhone,
          name: displayName,
          phone: cleanPhone,
          role: "client",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Falha no registro" };
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
      Cookies.remove("auth_token", { path: "/" });
      Cookies.remove("user_data", { path: "/" });
      Cookies.remove("current_enterprise", { path: "/" });
      
      // Limpar também cookies sem especificar path como fallback
      Cookies.remove("auth_token");
      Cookies.remove("user_data");
      Cookies.remove("current_enterprise");
      
      // Limpar localStorage também por precaução
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("current_enterprise");
      
      // Resetar estado
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    setIsAuthenticated(true);
    Cookies.set("auth_token", `admin-${updatedUser.id}`, { expires: 7 });
    Cookies.set("user_data", JSON.stringify(updatedUser), { expires: 7 });
  };

  // Login específico para admin
  const adminLogin = async (credentials) => {
    try {
      // Tentar autenticar com Firebase
      const result = await firebaseAuthService.adminSignIn(
        credentials.email,
        credentials.password
      );

      if (result.user && result.token) {
        // Salvar token e dados do usuário
        Cookies.set("auth_token", result.token, { expires: 7 });
        Cookies.set("user_data", JSON.stringify(result.user), { expires: 7 });

        setUser(result.user);
        setIsAuthenticated(true);

        return { success: true, user: result.user };
      } else {
        return {
          success: false,
          error: "Falha na autenticação",
        };
      }
    } catch (error) {
      console.error("Erro no login admin:", error);

      // Se o Firebase falhar, usar fallback local para desenvolvimento
      if (
        credentials.email === "empresaadmin@xcortes.com" &&
        credentials.password === "admin123"
      ) {
        const adminUser = {
          id: "admin-1",
          name: "Administrador",
          email: credentials.email,
          role: "admin",
          enterpriseEmail: "test@empresa.com",
        };

        updateUser(adminUser);
        return { success: true, user: adminUser };
      }

      return {
        success: false,
        error: error.message || "Credenciais inválidas",
      };
    }
  };

  // Função para criar usuário admin no Firestore (para desenvolvimento)
  const createAdminUser = async () => {
    try {
      const adminData = {
        email: "empresaadmin@xcortes.com",
        name: "Administrador XCortes",
        role: "admin",
        status: "active",
        enterpriseEmail: "test@empresa.com",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: {
          dashboard: true,
          appointments: true,
          clients: true,
          services: true,
          staff: true,
        },
      };

      // Criar documento do usuário admin no Firestore
      await setDoc(doc(db, "users", "empresaadmin@xcortes.com"), adminData);

      console.log("✅ Usuário admin criado no Firestore!");
      console.log("📧 Email: empresaadmin@xcortes.com");
      console.log(
        "🔐 Agora crie o usuário no Firebase Authentication com senha: admin123"
      );

      return { success: true, data: adminData };
    } catch (error) {
      console.error("❌ Erro ao criar usuário admin:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    simplePhoneLogin,
    simpleRegister,
    register,
    verifyCode,
    logout,
    updateUser,
    adminLogin,
    createAdminUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
