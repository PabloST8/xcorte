import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { slugify, enterpriseCandidates } from "../utils/slug";
import LoadingSpinner from "./LoadingSpinner";
import ServiceUnavailable from "./ServiceUnavailable";

/**
 * Componente que detecta automaticamente a empresa pela URL
 */
export default function EnterpriseDetector({ children }) {
  const { enterpriseSlug } = useParams();
  const { enterprises, selectEnterprise, loadEnterprises } = useEnterprise();
  const [isReady, setIsReady] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    isValid: true,
    reason: null,
    error: null,
  });

  useEffect(() => {
    const initializeEnterprise = async () => {
      try {
        // Carrega as empresas se ainda não carregou
        if (!enterprises || enterprises.length === 0) {
          console.log("🔄 Carregando empresas...");
          // Só chama loadEnterprises se realmente precisar, para evitar loops
          if (loadEnterprises) {
            await loadEnterprises();
          }
          return;
        }

        // Se não há slug na URL, não redireciona automaticamente
        // Deixa o usuário na página principal sem empresa específica
        if (!enterpriseSlug) {
          // Se há empresas carregadas, seleciona a primeira como padrão mas não redireciona
          const firstEnterprise = enterprises[0];
          if (firstEnterprise) {
            selectEnterprise(firstEnterprise);
          }
          setValidationStatus({ isValid: true, reason: null, error: null });
          setIsReady(true);
          return;
        }

        // Se há slug na URL, verifica se a empresa existe
        if (enterpriseSlug && enterprises.length > 0) {
          const slug = slugify(enterpriseSlug);
          const foundEnterprise = enterprises.find((enterprise) =>
            enterpriseCandidates(enterprise).includes(slug)
          );

          if (foundEnterprise) {
            console.log("🏢 Empresa encontrada:", foundEnterprise);
            console.log("✅ Status isActive:", foundEnterprise.isActive);
            console.log("🔒 Status isBlocked:", foundEnterprise.isBlocked);

            // Verificar se a empresa está bloqueada ou inativa
            // Se isBlocked for undefined, considera como false (não bloqueada)
            const isEnterpriseBlocked = foundEnterprise.isBlocked === true;
            const isEnterpriseInactive = foundEnterprise.isActive === false;

            if (isEnterpriseBlocked || isEnterpriseInactive) {
              console.log(
                "🚫 Empresa bloqueada ou inativa:",
                foundEnterprise.name,
                {
                  isBlocked: isEnterpriseBlocked,
                  isActive: foundEnterprise.isActive,
                }
              );
              setValidationStatus({
                isValid: false,
                reason: "blocked",
                error: `Empresa ${
                  isEnterpriseBlocked ? "bloqueada" : "inativa"
                }`,
              });
              setIsReady(true);
              return;
            } else {
              console.log(
                "✅ Empresa válida, permitindo acesso:",
                foundEnterprise.name
              );
            }

            selectEnterprise(foundEnterprise);
            setValidationStatus({ isValid: true, reason: null, error: null });
            setIsReady(true);
          } else {
            console.log("❌ Empresa não encontrada para slug:", enterpriseSlug);
            // Empresa não encontrada
            setValidationStatus({
              isValid: false,
              reason: "not-found",
              error: `Empresa não encontrada: ${enterpriseSlug}`,
            });
            setIsReady(true);
          }
        }
      } catch (error) {
        console.error("❌ Erro ao inicializar empresa:", error);
        setValidationStatus({
          isValid: false,
          reason: "error",
          error: error.message,
        });
        setIsReady(true);
      }
    };

    initializeEnterprise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterprises.length, enterpriseSlug]); // Apenas length e slug - funções causam loop

  // Mostra loading enquanto não está pronto
  if (!isReady) {
    return <LoadingSpinner fullScreen message="Inicializando..." />;
  }

  // Mostra tela de serviço indisponível se a validação falhou
  if (!validationStatus.isValid) {
    return (
      <ServiceUnavailable
        reason={validationStatus.reason}
        message={validationStatus.error}
      />
    );
  }

  return children;
}
