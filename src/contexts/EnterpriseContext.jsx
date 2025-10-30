import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { publicEnterpriseFirestoreService } from "../services/publicEnterpriseFirestoreService";
import { firestoreEnterpriseService } from "../services/firestoreEnterpriseService";
import { enterprisePhotoSyncService } from "../services/enterprisePhotoSyncService";
import { USE_REMOTE_API } from "../config";
import { barbershopService } from "../services/barbershopService";
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

  // Listener para atualizações de foto em tempo real
  useEffect(() => {
    const handlePhotoUpdate = (event) => {
      const { enterpriseId, photoData } = event.detail;

      console.log("📸 Foto atualizada via listener:", enterpriseId, photoData);

      // Atualizar empresa atual se for a mesma (usar ID ou email como identificador)
      if (
        currentEnterprise &&
        (currentEnterprise.id === enterpriseId ||
          currentEnterprise.email === enterpriseId)
      ) {
        console.log("📸 Atualizando foto da empresa atual");
        setCurrentEnterprise((prev) => ({
          ...prev,
          ...photoData,
        }));

        // Atualizar cookie
        const updatedEnterprise = { ...currentEnterprise, ...photoData };
        Cookies.set("current_enterprise", JSON.stringify(updatedEnterprise), {
          expires: 30,
        });
      }

      // Atualizar na lista de empresas (usar ID ou email como identificador)
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === enterpriseId || enterprise.email === enterpriseId
            ? { ...enterprise, ...photoData }
            : enterprise
        )
      );
    };

    window.addEventListener("enterprisePhotoUpdated", handlePhotoUpdate);

    return () => {
      window.removeEventListener("enterprisePhotoUpdated", handlePhotoUpdate);
    };
  }, [currentEnterprise]);

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
      let enterprises = [];

      if (USE_REMOTE_API) {
        console.log("🔍 Tentando carregar empresas da API remota...");
        try {
          const apiEnterprises = await barbershopService.getEnterprises();
          if (apiEnterprises && apiEnterprises.length > 0) {
            enterprises = apiEnterprises;
            console.log("✅ Empresas carregadas da API:", enterprises.length);
          } else {
            console.log("⚠️ API retornou array vazio, usando Firestore...");
            throw new Error("API vazia");
          }
        } catch (apiError) {
          console.warn("⚠️ API falhou, usando Firestore:", apiError.message);

          // Fallback para Firestore
          console.log("🔍 Carregando do Firestore (fallback da API)...");
          const firestoreEnterprises =
            await publicEnterpriseFirestoreService.getEnterprises();
          console.log("📊 Resposta do Firestore:", firestoreEnterprises);

          if (firestoreEnterprises && firestoreEnterprises.length > 0) {
            enterprises = firestoreEnterprises;
            console.log(
              "✅ Empresas carregadas do Firestore (fallback):",
              enterprises.length
            );
          }
        }
      } else {
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
            address: "Rua Augusta, 1234 - Consolação, São Paulo - SP",
            description: "Barbearia do Pablo",
          },
          {
            id: "empresaadmin@xcortes.com",
            name: "XCorte Admin",
            email: "empresaadmin@xcortes.com",
            phone: "(11) 99999-1111",
            address: "Av. Paulista, 567 - Bela Vista, São Paulo - SP",
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
        address: "Av. Faria Lima, 1000 - Itaim Bibi, São Paulo - SP",
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

  const selectEnterprise = useCallback(async (enterprise) => {
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

    // Sincronizar foto da empresa antes de definir como atual
    let enterpriseWithPhoto = enterprise;
    if (enterprise?.id || enterprise?.email) {
      try {
        console.log("📸 Sincronizando foto da empresa selecionada...");
        enterpriseWithPhoto =
          await enterprisePhotoSyncService.syncPhotoWithEnterprise(enterprise);

        // Inicializar listener de foto para esta empresa (usar ID ou email)
        const enterpriseIdentifier = enterprise.id || enterprise.email;
        enterprisePhotoSyncService.initializePhotoSync(enterpriseIdentifier);
      } catch (error) {
        console.error("❌ Erro ao sincronizar foto da empresa:", error);
      }
    }

    setCurrentEnterprise(enterpriseWithPhoto);
    Cookies.set("current_enterprise", JSON.stringify(enterpriseWithPhoto), {
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
  }, [currentEnterprise, queryClient]); // Dependencies: currentEnterprise e queryClient

  const createEnterprise = async (enterpriseData) => {
    try {
      console.log(
        "🏢 Criando nova empresa através do contexto:",
        enterpriseData
      );

      // Usar o serviço Firestore para criar a empresa
      const newEnterprise = await firestoreEnterpriseService.createEnterprise(
        enterpriseData
      );

      // Atualizar a lista de empresas localmente
      setEnterprises((prev) => [newEnterprise, ...prev]);

      // Invalidar cache do React Query para recarregar a lista
      await queryClient.invalidateQueries({ queryKey: ["enterprises"] });

      console.log("✅ Empresa criada com sucesso:", newEnterprise);
      return { success: true, enterprise: newEnterprise };
    } catch (error) {
      console.error("❌ Erro ao criar empresa:", error);
      throw error;
    }
  };

  // Função para atualizar empresa atual (para casos como upload de foto)
  const updateCurrentEnterprise = useCallback(
    async (updatedData) => {
      if (!currentEnterprise) return;

      console.log("🔄 Atualizando empresa atual:", updatedData);

      // Se há dados de foto, sincronizar com o serviço de foto
      let finalUpdatedData = updatedData;
      if (
        updatedData.photoURL ||
        updatedData.photoPath ||
        updatedData.photoUpdatedAt
      ) {
        console.log("📸 Sincronizando foto da empresa...");
        try {
          // Usar ID se disponível, senão usar email como identificador
          const enterpriseIdentifier =
            currentEnterprise.id || currentEnterprise.email;

          // Inicializar sincronização de foto para esta empresa
          await enterprisePhotoSyncService.initializePhotoSync(
            enterpriseIdentifier
          );

          // Obter dados mais recentes da foto
          const latestPhotoData =
            await enterprisePhotoSyncService.getCurrentPhotoFromFirestore(
              enterpriseIdentifier
            );

          // Mesclar com dados atualizados
          finalUpdatedData = {
            ...updatedData,
            ...latestPhotoData,
          };

          console.log("✅ Foto sincronizada:", finalUpdatedData);
        } catch (error) {
          console.error("❌ Erro ao sincronizar foto:", error);
        }
      }

      const updatedEnterprise = {
        ...currentEnterprise,
        ...finalUpdatedData,
      };

      setCurrentEnterprise(updatedEnterprise);

      // Atualizar também na lista de empresas
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === currentEnterprise.id
            ? updatedEnterprise
            : enterprise
        )
      );

      // Salvar nos cookies
      Cookies.set("current_enterprise", JSON.stringify(updatedEnterprise), {
        expires: 30,
      });
    },
    [currentEnterprise]
  );

  const updateEnterprise = async (email, enterpriseData) => {
    try {
      console.log(
        "🔄 Atualizando empresa através do contexto:",
        email,
        enterpriseData
      );

      // Usar o serviço Firestore para atualizar a empresa
      const updatedEnterprise =
        await firestoreEnterpriseService.updateEnterprise(
          email,
          enterpriseData
        );

      // Atualizar a lista de empresas localmente
      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise.id === email ? updatedEnterprise : enterprise
        )
      );

      // Se for a empresa atual, atualizar também
      if (currentEnterprise && currentEnterprise.id === email) {
        setCurrentEnterprise(updatedEnterprise);
      }

      // Invalidar cache do React Query
      await queryClient.invalidateQueries({ queryKey: ["enterprises"] });

      console.log("✅ Empresa atualizada com sucesso:", updatedEnterprise);
      return { success: true, enterprise: updatedEnterprise };
    } catch (error) {
      console.error("❌ Erro ao atualizar empresa:", error);
      throw error;
    }
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
    updateCurrentEnterprise,
    loadEnterprises,
    syncEnterpriseWithUser,
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};
