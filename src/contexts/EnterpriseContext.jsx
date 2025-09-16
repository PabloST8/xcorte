import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { publicEnterpriseFirestoreService } from "../services/publicEnterpriseFirestoreService";
import Cookies from "js-cookie";
import { useAuth } from "../hooks/useAuth";

const EnterpriseContext = createContext();

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error(
      "useEnterprise deve ser usado dentro de EnterpriseProvider"
    );
  }
  return context;
};

export const EnterpriseProvider = ({ children }) => {
  const [currentEnterprise, setCurrentEnterprise] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Email da empresa padrão - usando empresaadmin@xcortes.com
  const DEFAULT_ENTERPRISE_EMAIL = "empresaadmin@xcortes.com";

  useEffect(() => {
    loadEnterprises();
  }, []);

  // Sincronizar automaticamente quando o usuário mudar
  useEffect(() => {
    if (
      enterprises.length > 0 &&
      user &&
      user.role === "admin" &&
      user.enterpriseEmail
    ) {
      console.log(
        "🔄 Auto-sincronizando empresa com usuário:",
        user.enterpriseEmail
      );
      syncEnterpriseWithUser(user);
    }
  }, [user, enterprises.length]);

  // Sincronizar automaticamente quando o usuário mudar
  useEffect(() => {
    if (
      enterprises.length > 0 &&
      user &&
      user.role === "admin" &&
      user.enterpriseEmail
    ) {
      console.log(
        "🔄 Auto-sincronizando empresa com usuário:",
        user.enterpriseEmail
      );
      syncEnterpriseWithUser(user);
    }
  }, [user, enterprises]);

  const loadEnterprises = async () => {
    // Após carregar as empresas, se já houver usuário logado, sincroniza imediatamente
    if (user && user.enterpriseEmail) {
      const found = enterprises.find((e) => e.email === user.enterpriseEmail);
      if (found) {
        setCurrentEnterprise(found);
        Cookies.set("current_enterprise", JSON.stringify(found), {
          expires: 30,
        });
        console.log(
          "🔄 Empresa sincronizada com usuário após carregar empresas:",
          found
        );
      }
    }
    try {
      setLoading(true);

      // USAR APENAS FIRESTORE - API desabilitada
      let enterprises = [];

      console.log("🔍 Carregando APENAS do Firestore (API desabilitada)...");
      try {
        const firestoreEnterprises =
          await publicEnterpriseFirestoreService.getEnterprises();
        console.log("📊 Resposta do Firestore:", firestoreEnterprises);

        if (firestoreEnterprises && firestoreEnterprises.length > 0) {
          enterprises = firestoreEnterprises;
          console.log(
            "✅ Empresas carregadas do Firestore:",
            enterprises.length
          );
          console.log(
            "📋 Empresas encontradas:",
            enterprises.map((e) => ({
              name: e.name,
              email: e.email,
              id: e.id,
            }))
          );
        } else {
          console.log("⚠️ Firestore retornou array vazio");
        }
      } catch (firestoreError) {
        console.warn("⚠️ Firestore falhou:", firestoreError);
      }

      // Se ainda não tem empresas, usa dados de teste
      if (enterprises.length === 0) {
        console.log("📋 Usando empresas de teste como último recurso");
        enterprises = [
          {
            id: "pablofafstar@gmail.com",
            name: "Barbearia do Pablo",
            email: "pablofafstar@gmail.com",
            phone: "(11) 99999-2222",
            address: "Av. dos Cortes, 456 - Vila Nova",
            description: "Barbearia do Pablo",
          },
          {
            id: "empresaadmin@xcortes.com",
            name: "XCorte Admin",
            email: "empresaadmin@xcortes.com",
            phone: "(11) 99999-1111",
            address: "Rua das Barbearias, 123 - Centro",
            description: "Empresa Admin XCortes",
          },
        ];
        console.log("📋 Usando empresas de teste V2:", enterprises.length);
      }

      setEnterprises(enterprises);

      // Sempre sincronizar empresa com usuário logado, ignorando cookie antigo se necessário
      const savedEnterprise = Cookies.get("current_enterprise");
      let initialEnterprise = null;
      if (user && user.enterpriseEmail) {
        // Se usuário logado, prioriza empresa do usuário
        initialEnterprise = enterprises.find(
          (e) => e.email === user.enterpriseEmail
        );
        if (initialEnterprise) {
          setCurrentEnterprise(initialEnterprise);
          Cookies.set("current_enterprise", JSON.stringify(initialEnterprise), {
            expires: 30,
          });
          console.log(
            "🔄 Empresa sincronizada com usuário logado:",
            initialEnterprise
          );
        }
      } else if (savedEnterprise) {
        const enterprise = JSON.parse(savedEnterprise);
        setCurrentEnterprise(enterprise);
        console.log("🍪 Empresa carregada dos cookies:", enterprise);
      } else {
        // Usar empresa padrão ou primeira da lista
        const defaultEnterprise =
          enterprises.find((e) => e.email === DEFAULT_ENTERPRISE_EMAIL) ||
          enterprises[0];
        if (defaultEnterprise) {
          setCurrentEnterprise(defaultEnterprise);
          Cookies.set("current_enterprise", JSON.stringify(defaultEnterprise), {
            expires: 30,
          });
          console.log("🏢 Definindo empresa padrão:", defaultEnterprise);
        }
      }
    } catch (error) {
      console.error("❌ Erro geral ao carregar empresas:", error);

      // Último recurso: empresa padrão mínima
      const fallbackEnterprise = {
        id: "1",
        name: "XCorte Barbearia",
        email: "test@empresa.com",
        phone: "(11) 99999-9999",
        address: "Rua das Flores, 123 - Centro",
      };

      setEnterprises([fallbackEnterprise]);
      setCurrentEnterprise(fallbackEnterprise);
      Cookies.set("current_enterprise", JSON.stringify(fallbackEnterprise), {
        expires: 30,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectEnterprise = (enterprise) => {
    setCurrentEnterprise(enterprise);
    Cookies.set("current_enterprise", JSON.stringify(enterprise), {
      expires: 30,
    });
  };

  const createEnterprise = async (_enterpriseData) => {
    // API desabilitada - usar Firestore diretamente se necessário
    console.log("createEnterprise desabilitado - API não disponível");
    return { success: false, error: "Função não disponível" };
  };

  const updateEnterprise = async (_email, _enterpriseData) => {
    // API desabilitada - usar Firestore diretamente se necessário
    console.log("updateEnterprise desabilitado - API não disponível");
    return { success: false, error: "Função não disponível" };
  };

  // Função para sincronizar empresa com usuário logado
  const syncEnterpriseWithUser = useCallback(
    (user) => {
      console.log("🔄 syncEnterpriseWithUser chamado:", {
        user,
        enterprises,
        currentEnterprise,
      });

      if (!user || !user.enterpriseEmail) {
        console.log("🔄 Usuário sem enterpriseEmail, usando empresa padrão");
        return;
      }

      const targetEnterprise = enterprises.find(
        (e) => e.email === user.enterpriseEmail
      );

      console.log(
        "🔍 Procurando empresa:",
        user.enterpriseEmail,
        "Encontrada:",
        targetEnterprise
      );

      if (
        targetEnterprise &&
        currentEnterprise?.email !== targetEnterprise.email
      ) {
        console.log(
          `🔄 Sincronizando empresa: ${targetEnterprise.name} (${targetEnterprise.email})`
        );
        setCurrentEnterprise(targetEnterprise);
        Cookies.set("current_enterprise", JSON.stringify(targetEnterprise), {
          expires: 30,
        });
      } else if (!targetEnterprise) {
        console.warn("⚠️ Empresa não encontrada:", user.enterpriseEmail);
      } else {
        console.log("✅ Empresa já está correta:", currentEnterprise?.name);
      }
    },
    [enterprises, currentEnterprise]
  );

  const value = {
    currentEnterprise,
    enterprises,
    loading,
    selectEnterprise,
    createEnterprise,
    updateEnterprise,
    loadEnterprises,
    syncEnterpriseWithUser,
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};
