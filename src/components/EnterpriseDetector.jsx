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

  return children;
}
