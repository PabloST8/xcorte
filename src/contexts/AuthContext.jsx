import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { authService } from "../services/authService";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { AuthContext } from "./AuthContextProvider";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Atualiza apenas dados do usuário (cookie user_data), sem tocar no token
  const patchUser = (patch) => {
    const updated = { ...(user || {}), ...patch };
    setUser(updated);
    Cookies.set("user_data", JSON.stringify(updated), { expires: 7 });
  };
  const patchUserRef = useRef(patchUser);
  patchUserRef.current = patchUser;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get("auth_token");
        const userData = Cookies.get("user_data");

        if (token && userData) {
          let parsedUser = JSON.parse(userData);
          // Corrigir enterpriseEmail para admins
          if (parsedUser.role === "admin") {
            let correctEnterpriseEmail = null;

            // Pablo admin -> sua própria empresa
            if (parsedUser.email === "pablofafstar@gmail.com") {
              correctEnterpriseEmail = "pablofafstar@gmail.com";
            }
            // Admin da XCortes -> empresa XCortes
            else if (parsedUser.email === "empresaadmin@xcortes.com") {
              correctEnterpriseEmail = "empresaadmin@xcortes.com";
            }

            if (
              correctEnterpriseEmail &&
              (!parsedUser.enterpriseEmail ||
                parsedUser.enterpriseEmail !== correctEnterpriseEmail)
            ) {
              parsedUser = {
                ...parsedUser,
                enterpriseEmail: correctEnterpriseEmail,
              };
              Cookies.set("user_data", JSON.stringify(parsedUser), {
                expires: 7,
                path: "/",
                sameSite: "strict",
              });
              console.log(
                `🛠️ Corrigido enterpriseEmail para ${parsedUser.email} -> ${correctEnterpriseEmail}`
              );
            }
          }
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Firebase Auth está desabilitado para desenvolvimento
          console.log("✅ Usuário autenticado sem Firebase Auth");

          // Sincronizar campos de foto do Firestore para persistir após reload
          try {
            const idCandidate = parsedUser.phone || parsedUser.id || "";
            const cleanPhone = String(idCandidate).replace(/\D/g, "");
            const userDocId = cleanPhone || parsedUser.id || parsedUser.email;
            console.log(
              "📸 Tentando sincronizar foto do Firestore - userDocId:",
              userDocId,
              "parsedUser:",
              parsedUser
            );
            if (userDocId) {
              const userRef = doc(db, "users", String(userDocId));
              const snap = await getDoc(userRef);
              if (snap.exists()) {
                const data = snap.data() || {};
                console.log(
                  "📸 Dados do usuário encontrados no Firestore:",
                  data
                );
                if (data.photoURL) {
                  let versioned = data.photoURL;
                  try {
                    const u = new URL(data.photoURL);
                    if (data.photoVersion)
                      u.searchParams.set("v", String(data.photoVersion));
                    versioned = u.toString();
                  } catch {
                    if (data.photoVersion) {
                      versioned = `${data.photoURL}${
                        data.photoURL.includes("?") ? "&" : "?"
                      }v=${data.photoVersion}`;
                    }
                  }
                  // Atualiza somente se diferente para evitar loops
                  if (parsedUser.photoURL !== versioned) {
                    console.log(
                      "📸 Sincronizando foto do Firestore:",
                      versioned
                    );
                    patchUserRef.current?.({
                      photoURL: versioned,
                      photoPath: data.photoPath || null,
                      photoVersion: data.photoVersion || null,
                    });
                  } else {
                    console.log("📸 Foto já está sincronizada");
                  }
                } else {
                  console.log("📸 Nenhuma foto encontrada no Firestore");
                }
              } else {
                console.log(
                  "📸 Documento do usuário não encontrado no Firestore"
                );
              }
            }
          } catch (syncErr) {
            console.warn("📸 Falha ao sincronizar foto do Firestore:", syncErr);
          }
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
        Cookies.set("auth_token", response.data.token, {
          expires: 7,
          path: "/",
          sameSite: "strict",
        });

        if (response.data.user) {
          // Cenário ideal: token + user
          Cookies.set("user_data", JSON.stringify(response.data.user), {
            expires: 7,
            path: "/",
            sameSite: "strict",
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
                path: "/",
                sameSite: "strict",
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

      console.log("📸 simplePhoneLogin - cleanPhone:", cleanPhone);

      const userRef = doc(db, "users", cleanPhone);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return {
          success: false,
          error: "Usuário não encontrado. Faça o cadastro.",
        };
      }

      const data = snap.data() || {};
      console.log("📸 Dados carregados do Firestore no login:", data);

      let userObj = {
        id: data.id || snap.id || cleanPhone,
        name: data.name || "Cliente",
        phone: data.phone || cleanPhone,
        role: data.role || "client",
        createdAt: data.createdAt || new Date().toISOString(),
        ...data,
      };

      // Se tem foto no Firestore, aplicar cache-busting
      if (data.photoURL && data.photoVersion) {
        let versioned = data.photoURL;
        try {
          const u = new URL(data.photoURL);
          u.searchParams.set("v", String(data.photoVersion));
          versioned = u.toString();
        } catch {
          versioned = `${data.photoURL}${
            data.photoURL.includes("?") ? "&" : "?"
          }v=${data.photoVersion}`;
        }
        userObj.photoURL = versioned;
        console.log("📸 Foto carregada do Firestore no login:", versioned);
      } else {
        console.log(
          "📸 Nenhuma foto encontrada no Firestore para este usuário"
        );
      }

      // Firebase Auth está desabilitado para desenvolvimento
      console.log("✅ Usuário autenticado sem Firebase Auth");

      // Mantém token simples sem tocar ao atualizar apenas foto
      Cookies.set("auth_token", `simple-${userObj.id}`, {
        expires: 30,
        path: "/",
        sameSite: "strict",
      });
      Cookies.set("user_data", JSON.stringify(userObj), {
        expires: 30,
        path: "/",
        sameSite: "strict",
      });
      setUser(userObj);
      setIsAuthenticated(true);
      setLoading(false);
      return { success: true, user: userObj };
    } catch (error) {
      console.error("📸 Erro no simplePhoneLogin:", error);
      return { success: false, error: error.message || "Falha no login" };
    }
  };

  // Registro simples: nome + telefone (sem senha)
  const simpleRegister = async ({ name, phone }) => {
    try {
      let cleanPhone = String(phone || "").replace(/\D/g, "");
      const displayName = String(name || "").trim();

      // Se o número tem 13 dígitos e começa com 55 (Brasil), remover o código do país
      if (cleanPhone.length === 13 && cleanPhone.startsWith("55")) {
        cleanPhone = cleanPhone.slice(2); // Remove os 2 primeiros dígitos (55)
      }

      if (!cleanPhone || !displayName) {
        throw new Error("Nome e telefone são obrigatórios");
      }

      console.log("🔍 Verificando usuário para registro:");
      console.log("📱 Telefone original:", phone);
      console.log("📱 Telefone limpo:", cleanPhone);

      // Verificar se o usuário já existe
      const userRef = doc(db, "users", cleanPhone);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const existingUser = userSnapshot.data();
        console.log("❌ Usuário já existe:", existingUser);
        throw new Error(
          "Este número de telefone já está registrado. Faça login ao invés de se cadastrar."
        );
      }

      // Para desenvolvimento: usar auth anônimo para permitir escrita no Firestore
      let currentUser = auth.currentUser;
      if (!currentUser) {
        try {
          // Import signInAnonymously
          const { signInAnonymously } = await import("firebase/auth");
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
          console.log("✅ Autenticação anônima realizada para registro");
        } catch (authError) {
          console.warn(
            "⚠️ Falha na autenticação anônima, tentando criar sem auth:",
            authError
          );
        }
      }

      // Criar novo usuário
      await setDoc(userRef, {
        id: cleanPhone,
        name: displayName,
        phone: cleanPhone,
        role: "client",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Usuário registrado no Firestore");

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
    }

    try {
      // Also sign out from Firebase Auth
      await auth.signOut();
      console.log("✅ Logout do Firebase Auth realizado");
    } catch (firebaseError) {
      console.warn("⚠️ Erro ao fazer logout do Firebase Auth:", firebaseError);
    }

    // Limpar dados locais independentemente do resultado
    Cookies.remove("auth_token", { path: "/" });
    Cookies.remove("user_data", { path: "/" });
    Cookies.remove("current_enterprise", { path: "/" });

    // Limpar também cookies sem especificar path como fallback
    Cookies.remove("auth_token");
    Cookies.remove("user_data");
    Cookies.remove("current_enterprise");
    Cookies.remove("auth_token");
    Cookies.remove("user_data");
    Cookies.remove("current_enterprise");

    // Política: não usar localStorage

    // Resetar estado
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    setIsAuthenticated(true);

    // 🔧 Configuração melhorada de cookies para persistir no F5
    Cookies.set("auth_token", `admin-${updatedUser.id}`, {
      expires: 7,
      path: "/",
      sameSite: "strict",
    });
    Cookies.set("user_data", JSON.stringify(updatedUser), {
      expires: 7,
      path: "/",
      sameSite: "strict",
    });

    // Limpar cookies da empresa para forçar nova sincronização
    console.log("🗑️ Limpando cookies da empresa para nova sincronização");
    Cookies.remove("current_enterprise", { path: "/" });
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
        Cookies.set("auth_token", result.token, {
          expires: 7,
          path: "/",
          sameSite: "strict",
        });
        Cookies.set("user_data", JSON.stringify(result.user), {
          expires: 7,
          path: "/",
          sameSite: "strict",
        });

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
          enterpriseEmail: "empresaadmin@xcortes.com", // Admin gerencia a XCortes
        };

        updateUser(adminUser);
        return { success: true, user: adminUser };
      }

      // Suporte para login direto do Pablo
      if (
        credentials.email === "pablofafstar@gmail.com" &&
        credentials.password === "123123"
      ) {
        let pabloUser = {
          id: "pablo-1",
          name: "Pablo",
          email: credentials.email,
          role: "admin",
          enterpriseEmail: "pablofafstar@gmail.com", // Própria empresa
        };

        // Tentar carregar dados do Pablo do Firestore
        try {
          const userRef = doc(db, "users", credentials.email);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            pabloUser = { ...pabloUser, ...data };

            // Aplicar cache-busting na foto se existir
            if (data.photoURL && data.photoVersion) {
              let versioned = data.photoURL;
              try {
                const u = new URL(data.photoURL);
                u.searchParams.set("v", String(data.photoVersion));
                versioned = u.toString();
              } catch {
                versioned = `${data.photoURL}${
                  data.photoURL.includes("?") ? "&" : "?"
                }v=${data.photoVersion}`;
              }
              pabloUser.photoURL = versioned;
              console.log(
                "📸 Foto do Pablo carregada no admin login:",
                versioned
              );
            }
          }
        } catch (err) {
          console.warn("Falha ao carregar dados do Pablo do Firestore:", err);
        }

        updateUser(pabloUser);
        return { success: true, user: pabloUser };
      }

      return {
        success: false,
        error: error.message || "Usuário ou senha inválidos",
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
        enterpriseEmail: "pablofafstar@gmail.com", // Admin gerencia a Barbearia do Pablo
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

  // Função para garantir que o Firebase Auth esteja sincronizado
  const ensureFirebaseAuth = async () => {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    if (isAuthenticated) {
      console.log(
        "⚠️ Firebase Auth não disponível. Usando autenticação local."
      );
      return null; // Indicar que Firebase Auth não está disponível
    }

    throw new Error("Usuário não está logado na aplicação.");
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
    ensureFirebaseAuth,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
