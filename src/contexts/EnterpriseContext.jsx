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
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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
    console.log(
      "🔄 selectEnterprise chamado com:",
      enterprise?.name,
      enterprise?.email
    );
    console.log(
      "🔄 Empresa atual:",
      currentEnterprise?.name,
      currentEnterprise?.email
    );
    console.log(
      "🔄 Empresas são diferentes?",
      enterprise?.email !== currentEnterprise?.email
    );

    setCurrentEnterprise(enterprise);
    Cookies.set("current_enterprise", JSON.stringify(enterprise), {
      expires: 30,
    });

    // Invalidar cache do React Query quando mudar de empresa
    if (queryClient && enterprise?.email !== currentEnterprise?.email) {
      console.log(
        "🗑️ Invalidando cache do React Query para nova empresa:",
        enterprise?.email
      );
      console.log("🗑️ QueryClient disponível:", !!queryClient);

      // Verificar queries existentes antes da invalidação
      const allQueries = queryClient.getQueriesData();
      console.log(
        "📋 Total de queries no cache antes da invalidação:",
        allQueries.length
      );

      // Método mais agressivo: remover queries antigas e invalidar
      try {
        // 1. Remover todas as queries de admin da empresa anterior
        if (
          currentEnterprise?.email &&
          currentEnterprise.email !== enterprise.email
        ) {
          console.log(
            "🗑️ Removendo queries da empresa anterior:",
            currentEnterprise.email
          );
          queryClient.removeQueries({
            predicate: (query) => {
              const hasOldEmail = query.queryKey.includes(
                currentEnterprise.email
              );
              if (hasOldEmail) {
                console.log(
                  "🗑️ Removendo query com email antigo:",
                  query.queryKey
                );
              }
              return hasOldEmail;
            },
          });
        }

        // 2. Invalidar todas as queries de admin
        console.log("🗑️ Invalidando todas as queries de admin...");
        const invalidateResult = queryClient.invalidateQueries({
          predicate: (query) => {
            const shouldInvalidate =
              query.queryKey.includes("admin") ||
              query.queryKey.includes("staff") ||
              query.queryKey.includes("employees") ||
              query.queryKey.includes("products") ||
              query.queryKey.includes("services") ||
              query.queryKey.includes("appointments");

            if (shouldInvalidate) {
              console.log("🗑️ Invalidando query:", query.queryKey);
            }

            return shouldInvalidate;
          },
        });

        console.log("✅ Invalidação concluída, resultado:", invalidateResult);

        // 3. Forçar refetch das queries da nova empresa
        setTimeout(() => {
          console.log(
            "🔄 Forçando refetch para nova empresa:",
            enterprise.email
          );
          queryClient.refetchQueries({
            predicate: (query) => {
              const shouldRefetch =
                query.queryKey.includes("admin") &&
                query.queryKey.includes(enterprise.email);
              if (shouldRefetch) {
                console.log("🔄 Refetch query:", query.queryKey);
              }
              return shouldRefetch;
            },
          });
        }, 200);
      } catch (error) {
        console.error("❌ Erro durante invalidação do cache:", error);
      }

      // Verificar queries após invalidação
      setTimeout(() => {
        const queriesAfter = queryClient.getQueriesData();
        console.log(
          "📋 Total de queries no cache após invalidação:",
          queriesAfter.length
        );
      }, 300);
    } else if (!queryClient) {
      console.error("❌ QueryClient não está disponível para invalidação!");
    } else {
      console.log(
        "⚠️ Não invalidando cache - empresas são iguais ou não há mudança"
      );
    }
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
        console.log(
          "🔄 Empresa anterior:",
          currentEnterprise?.name,
          currentEnterprise?.email
        );
        console.log(
          "🔄 Empresa nova:",
          targetEnterprise.name,
          targetEnterprise.email
        );

        setCurrentEnterprise(targetEnterprise);
        Cookies.set("current_enterprise", JSON.stringify(targetEnterprise), {
          expires: 30,
        });

        // Invalidar cache do React Query quando sincronizar automaticamente
        if (queryClient) {
          console.log(
            "🗑️ Invalidando cache do React Query para empresa sincronizada:",
            targetEnterprise.email
          );
          console.log("🗑️ QueryClient disponível:", !!queryClient);

          // Verificar queries existentes antes da invalidação
          const allQueries = queryClient.getQueriesData();
          console.log(
            "📋 Total de queries no cache antes da invalidação:",
            allQueries.length
          );

          // Método mais agressivo: remover queries antigas e invalidar
          try {
            // 1. Remover todas as queries de admin da empresa anterior
            if (
              currentEnterprise?.email &&
              currentEnterprise.email !== targetEnterprise.email
            ) {
              console.log(
                "🗑️ Removendo queries da empresa anterior:",
                currentEnterprise.email
              );
              queryClient.removeQueries({
                predicate: (query) => {
                  const hasOldEmail = query.queryKey.includes(
                    currentEnterprise.email
                  );
                  if (hasOldEmail) {
                    console.log(
                      "🗑️ Removendo query com email antigo:",
                      query.queryKey
                    );
                  }
                  return hasOldEmail;
                },
              });
            }

            // 2. Invalidar todas as queries de admin
            console.log("🗑️ Invalidando todas as queries de admin...");
            const invalidateResult = queryClient.invalidateQueries({
              predicate: (query) => {
                const shouldInvalidate =
                  query.queryKey.includes("admin") ||
                  query.queryKey.includes("staff") ||
                  query.queryKey.includes("employees") ||
                  query.queryKey.includes("products") ||
                  query.queryKey.includes("services") ||
                  query.queryKey.includes("appointments");

                if (shouldInvalidate) {
                  console.log("🗑️ Invalidando query:", query.queryKey);
                }

                return shouldInvalidate;
              },
            });

            console.log(
              "✅ Invalidação concluída, resultado:",
              invalidateResult
            );

            // 3. Forçar refetch das queries da nova empresa
            setTimeout(() => {
              console.log(
                "🔄 Forçando refetch para nova empresa:",
                targetEnterprise.email
              );
              queryClient.refetchQueries({
                predicate: (query) => {
                  const shouldRefetch =
                    query.queryKey.includes("admin") &&
                    query.queryKey.includes(targetEnterprise.email);
                  if (shouldRefetch) {
                    console.log("🔄 Refetch query:", query.queryKey);
                  }
                  return shouldRefetch;
                },
              });
            }, 200);
          } catch (error) {
            console.error("❌ Erro durante invalidação do cache:", error);
          }

          // Verificar queries após invalidação
          setTimeout(() => {
            const queriesAfter = queryClient.getQueriesData();
            console.log(
              "📋 Total de queries no cache após invalidação:",
              queriesAfter.length
            );
          }, 300);
        } else {
          console.error("❌ QueryClient não está disponível para invalidação!");
        }
      } else if (!targetEnterprise) {
        console.warn("⚠️ Empresa não encontrada:", user.enterpriseEmail);
      } else {
        console.log("✅ Empresa já está correta:", currentEnterprise?.name);
      }
    },
    [enterprises, currentEnterprise, queryClient]
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
