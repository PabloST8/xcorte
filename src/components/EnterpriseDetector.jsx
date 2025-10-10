import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { slugify, enterpriseCandidates } from "../utils/slug";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Componente que detecta automaticamente a empresa pela URL
 */
export default function EnterpriseDetector({ children }) {
  const navigate = useNavigate();
  const { enterpriseSlug } = useParams();
  const { enterprises, selectEnterprise, loadEnterprises } = useEnterprise();
  const [isReady, setIsReady] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const initializeEnterprise = async () => {
      // Carrega as empresas se ainda não carregou
      if (!enterprises || enterprises.length === 0) {
        try {
          await loadEnterprises(false);
        } catch (error) {
          console.error("Erro ao carregar empresas:", error);
          setIsReady(true);
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

          // Verificar se a empresa está bloqueada
          // Se isBlocked for undefined, considera como false (não bloqueada)
          const isEnterpriseBlocked = foundEnterprise.isBlocked === true;

          if (isEnterpriseBlocked) {
            console.log(
              "🚫 Empresa bloqueada (isBlocked = true):",
              foundEnterprise.name
            );
            setIsBlocked(true);
            setIsReady(true);
            return;
          } else {
            console.log(
              "✅ Empresa não bloqueada, permitindo acesso:",
              foundEnterprise.name
            );
          }

          selectEnterprise(foundEnterprise);
          setIsReady(true);
        } else {
          // Empresa não encontrada: não redirecionar mais automaticamente para evitar confusão
          // Apenas seleciona a primeira (se existir) internamente para dados, mantendo a URL original
          const firstEnterprise = enterprises[0];
          if (firstEnterprise) {
            selectEnterprise(firstEnterprise);
          }
        }
      }

      setIsReady(true);
    };

    initializeEnterprise();
  }, [
    enterprises,
    enterpriseSlug,
    selectEnterprise,
    loadEnterprises,
    navigate,
  ]);

  // Mostra loading enquanto não está pronto
  if (!isReady) {
    return <LoadingSpinner fullScreen message="Inicializando..." />;
  }

  // Mostra mensagem de indisponibilidade se a empresa estiver bloqueada
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Serviço Indisponível
            </h1>
            <p className="text-gray-600">
              Serviço indisponível por tempo indeterminado
            </p>
          </div>
          <div className="text-sm text-gray-500">Agradecemos a compreensão</div>
        </div>
      </div>
    );
  }

  return children;
}
