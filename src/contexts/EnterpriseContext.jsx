import React, { createContext, useContext, useState, useEffect } from "react";
import { enterpriseService } from "../services/enterpriseService";
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
      const response = await enterpriseService.getEnterprises();

      if (response.success && response.data) {
        setEnterprises(response.data);

        // Verificar se há empresa salva nos cookies
        const savedEnterprise = Cookies.get("current_enterprise");
        if (savedEnterprise) {
          const enterprise = JSON.parse(savedEnterprise);
          setCurrentEnterprise(enterprise);
        } else {
          // Usar empresa padrão ou primeira da lista
          const defaultEnterprise =
            response.data.find((e) => e.email === DEFAULT_ENTERPRISE_EMAIL) ||
            response.data[0];
          if (defaultEnterprise) {
            setCurrentEnterprise(defaultEnterprise);
            Cookies.set(
              "current_enterprise",
              JSON.stringify(defaultEnterprise),
              { expires: 30 }
            );
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
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
    try {
      const response = await enterpriseService.createEnterprise(enterpriseData);
      if (response.success && response.data) {
        await loadEnterprises(); // Recarregar lista
        return { success: true, data: response.data };
      }
      return {
        success: false,
        error: response.message || "Erro ao criar empresa",
      };
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      return {
        success: false,
        error: error.message || "Erro ao criar empresa",
      };
    }
  };

  const updateEnterprise = async (email, enterpriseData) => {
    try {
      const response = await enterpriseService.updateEnterprise(
        email,
        enterpriseData
      );
      if (response.success && response.data) {
        await loadEnterprises(); // Recarregar lista

        // Se a empresa atual foi atualizada, atualizar também
        if (currentEnterprise && currentEnterprise.email === email) {
          setCurrentEnterprise(response.data);
          Cookies.set("current_enterprise", JSON.stringify(response.data), {
            expires: 30,
          });
        }

        return { success: true, data: response.data };
      }
      return {
        success: false,
        error: response.message || "Erro ao atualizar empresa",
      };
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      return {
        success: false,
        error: error.message || "Erro ao atualizar empresa",
      };
    }
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
