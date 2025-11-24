import React from "react";
import { useEnterpriseValidation } from "../hooks/useEnterpriseValidation";
import ServiceUnavailable from "./ServiceUnavailable";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Wrapper que valida o acesso à empresa e mostra tela de erro quando necessário
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos a serem renderizados se válido
 * @param {boolean} props.showLoadingSpinner - Mostrar spinner durante validação
 */
export default function EnterpriseValidationWrapper({
  children,
  showLoadingSpinner = true,
}) {
  const { isValid, reason, loading, error } = useEnterpriseValidation();

  // Exibir loading durante validação
  if (loading) {
    if (showLoadingSpinner) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Verificando disponibilidade..." />
        </div>
      );
    }
    return null; // Não exibir nada durante loading
  }

  // Se inválido, mostrar tela de serviço indisponível
  if (isValid === false) {
    const retryAction = () => {
      // Forçar recarregamento da página para tentar novamente
      window.location.reload();
    };

    // Configurar mensagens baseadas no motivo
    const getErrorConfig = () => {
      switch (reason) {
        case "not-found":
          return {
            title: "Barbearia Não Encontrada",
            message:
              "A barbearia que você está procurando não foi encontrada. Verifique se a URL está correta ou se a barbearia ainda está ativa.",
            showRetry: true,
          };
        case "blocked":
          return {
            title: "Serviço Temporariamente Indisponível",
            message:
              "Esta barbearia está temporariamente indisponível para agendamentos. Entre em contato diretamente com o estabelecimento ou tente novamente mais tarde.",
            showRetry: false,
          };
        case "error":
          return {
            title: "Erro de Conexão",
            message:
              "Ocorreu um erro ao verificar a disponibilidade do serviço. Verifique sua conexão com a internet e tente novamente.",
            showRetry: true,
          };
        default:
          return {
            title: "Serviço Indisponível",
            message:
              "O serviço está temporariamente indisponível. Estamos trabalhando para resolver o problema.",
            showRetry: true,
          };
      }
    };

    const errorConfig = getErrorConfig();

    console.error("🚫 Acesso negado:", { reason, error, isValid });

    return (
      <ServiceUnavailable
        reason={reason}
        title={errorConfig.title}
        message={errorConfig.message}
        showRetry={errorConfig.showRetry}
        onRetry={errorConfig.showRetry ? retryAction : undefined}
      />
    );
  }

  // Se válido, renderizar children normalmente
  return <>{children}</>;
}
