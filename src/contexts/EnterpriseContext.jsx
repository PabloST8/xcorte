import React, { createContext, useState, useContext, useEffect } from "react";
import { publicEnterpriseFirestoreService } from "../services/publicEnterpriseFirestoreService";
import Cookies from "js-cookie";

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

  // Email da empresa padrão - usando uma das existentes na API
  const DEFAULT_ENTERPRISE_EMAIL = "test@empresa.com";

  useEffect(() => {
    loadEnterprises();
  }, []);

  const loadEnterprises = async () => {
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
            id: "barbearia-xcortes",
            name: "Barbearia X-Cortes",
            email: "contato@barbearia-xcortes.com",
            phone: "(11) 99999-1111",
            address: "Rua das Barbearias, 123 - Centro",
            description: "Especialistas em cortes modernos",
          },
          {
            id: "barbearia-do-pablo",
            name: "Barbearia do Pablo",
            email: "pablo@barbearia-pablo.com",
            phone: "(11) 99999-2222",
            address: "Av. dos Cortes, 456 - Vila Nova",
            description: "Tradição em cortes clássicos",
          },
          {
            id: "barbearia-teste-v2",
            name: "Barbearia Teste V2",
            email: "teste@empresav2.com",
            phone: "(11) 99999-9999",
            address: "Rua das Flores, 123 - Centro",
            description: "A melhor barbearia da cidade - Versão 2",
          },
        ];
        console.log("📋 Usando empresas de teste V2:", enterprises.length);
      }

      setEnterprises(enterprises);

      // Verificar se há empresa salva nos cookies
      const savedEnterprise = Cookies.get("current_enterprise");
      if (savedEnterprise) {
        const enterprise = JSON.parse(savedEnterprise);
        setCurrentEnterprise(enterprise);
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

  const createEnterprise = async (enterpriseData) => {
    // API desabilitada - usar Firestore diretamente se necessário
    console.log("createEnterprise desabilitado - API não disponível");
    return { success: false, error: "Função não disponível" };
  };

  const updateEnterprise = async (email, enterpriseData) => {
    // API desabilitada - usar Firestore diretamente se necessário
    console.log("updateEnterprise desabilitado - API não disponível");
    return { success: false, error: "Função não disponível" };
  };

  const value = {
    currentEnterprise,
    enterprises,
    loading,
    selectEnterprise,
    createEnterprise,
    updateEnterprise,
    loadEnterprises,
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};
