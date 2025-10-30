import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";

/**
 * Hook para verificar se a empresa/URL é válida e acessível
 * @returns {Object} Status da verificação
 */
export function useEnterpriseValidation() {
  const [status, setStatus] = useState({
    isValid: null, // null = verificando, true = válida, false = inválida
    reason: null, // 'not-found', 'blocked', 'error'
    loading: true,
    error: null,
  });

  const params = useParams();
  const location = useLocation();
  const { enterprises, currentEnterprise, loading: enterpriseLoading } = useEnterprise();

  useEffect(() => {
    const validateEnterprise = async () => {
      try {
        // Se ainda está carregando empresas, aguardar
        if (enterpriseLoading) {
          return;
        }

        // Verificar se é uma rota que precisa de empresa específica
        const needsEnterpriseValidation = 
          location.pathname.includes('/empresa/') || 
          location.pathname.includes('/agendamento/') ||
          params.enterpriseId ||
          params.enterpriseSlug;

        // Se não precisa de validação de empresa, é válida
        if (!needsEnterpriseValidation) {
          setStatus({
            isValid: true,
            reason: null,
            loading: false,
            error: null,
          });
          return;
        }

        // Extrair identificador da empresa da URL ou parâmetros
        const enterpriseIdentifier = 
          params.enterpriseId || 
          params.enterpriseSlug || 
          extractEnterpriseFromPath(location.pathname);

        console.log("🔍 Validando empresa:", {
          identifier: enterpriseIdentifier,
          currentPath: location.pathname,
          hasEnterprises: !!enterprises?.length,
          enterprisesCount: enterprises?.length || 0,
        });

        // Se não há identificador, URL inválida
        if (!enterpriseIdentifier) {
          setStatus({
            isValid: false,
            reason: "not-found",
            loading: false,
            error: "Identificador da empresa não encontrado na URL",
          });
          return;
        }

        // Se não há empresas carregadas, erro de carregamento
        if (!enterprises || enterprises.length === 0) {
          setStatus({
            isValid: false,
            reason: "error",
            loading: false,
            error: "Não foi possível carregar as empresas",
          });
          return;
        }

        // Procurar empresa por ID, email ou slug
        const foundEnterprise = enterprises.find(
          (enterprise) =>
            enterprise.id === enterpriseIdentifier ||
            enterprise.email === enterpriseIdentifier ||
            enterprise.slug === enterpriseIdentifier ||
            enterprise.name?.toLowerCase().replace(/\s+/g, "-") === enterpriseIdentifier
        );

        console.log("🔍 Resultado da busca:", {
          found: !!foundEnterprise,
          enterpriseName: foundEnterprise?.name,
          isActive: foundEnterprise?.active,
          isBlocked: foundEnterprise?.isBlocked,
        });

        // Se empresa não encontrada
        if (!foundEnterprise) {
          setStatus({
            isValid: false,
            reason: "not-found",
            loading: false,
            error: "Empresa não encontrada",
          });
          return;
        }

        // Verificar se empresa está bloqueada ou inativa
        if (foundEnterprise.isBlocked || foundEnterprise.active === false) {
          setStatus({
            isValid: false,
            reason: "blocked",
            loading: false,
            error: "Empresa bloqueada ou inativa",
          });
          return;
        }

        // Empresa válida e ativa
        setStatus({
          isValid: true,
          reason: null,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error("❌ Erro na validação da empresa:", error);
        setStatus({
          isValid: false,
          reason: "error",
          loading: false,
          error: error.message,
        });
      }
    };

    validateEnterprise();
  }, [params, location.pathname, enterprises, enterpriseLoading, currentEnterprise]);

  return status;
}

/**
 * Extrair identificador da empresa do caminho da URL
 * @param {string} pathname - Caminho da URL
 * @returns {string|null} Identificador da empresa
 */
function extractEnterpriseFromPath(pathname) {
  // Padrões de URL que contêm identificador da empresa
  const patterns = [
    /\/empresa\/([^/]+)/, // /empresa/{id}
    /\/agendamento\/([^/]+)/, // /agendamento/{id}
    /\/barbearia\/([^/]+)/, // /barbearia/{slug}
  ];

  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export default useEnterpriseValidation;