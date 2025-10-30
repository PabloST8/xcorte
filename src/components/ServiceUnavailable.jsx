import React from "react";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

/**
 * Componente para exibir tela de serviço indisponível
 * @param {Object} props
 * @param {string} props.reason - Motivo da indisponibilidade ('not-found', 'blocked', 'error')
 * @param {string} props.title - Título personalizado (opcional)
 * @param {string} props.message - Mensagem personalizada (opcional)
 * @param {boolean} props.showRetry - Mostrar botão de tentar novamente
 * @param {Function} props.onRetry - Função chamada ao clicar em tentar novamente
 */
export default function ServiceUnavailable({
  reason = "error",
  title,
  message,
  showRetry = true,
  onRetry,
}) {
  // Configurações baseadas no motivo
  const getReasonConfig = () => {
    switch (reason) {
      case "not-found":
        return {
          icon: AlertTriangle,
          title: title || "Página Não Encontrada",
          message:
            message ||
            "A barbearia que você está procurando não foi encontrada ou não existe.",
          color: "amber",
          bgColor: "bg-amber-50",
          iconColor: "text-amber-500",
          buttonColor: "bg-amber-600 hover:bg-amber-700",
        };
      case "blocked":
        return {
          icon: AlertTriangle,
          title: title || "Serviço Temporariamente Indisponível",
          message:
            message ||
            "Esta barbearia está temporariamente indisponível. Por favor, tente novamente mais tarde.",
          color: "red",
          bgColor: "bg-red-50",
          iconColor: "text-red-500",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
      default:
        return {
          icon: Clock,
          title: title || "Serviço Indisponível",
          message:
            message ||
            "Nosso serviço está temporariamente indisponível. Estamos trabalhando para resolver o problema.",
          color: "blue",
          bgColor: "bg-blue-50",
          iconColor: "text-blue-500",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const config = getReasonConfig();
  const IconComponent = config.icon;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Comportamento padrão: recarregar a página
      window.location.reload();
    }
  };

  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className={`mx-auto flex justify-center w-24 h-24 rounded-full ${config.bgColor} mb-6`}
        >
          <IconComponent
            className={`w-12 h-12 ${config.iconColor} self-center`}
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {config.title}
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            {config.message}
          </p>

          <div className="space-y-4">
            {showRetry && (
              <button
                onClick={handleRetry}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500 transition-colors duration-200`}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Tentar Novamente
              </button>
            )}

            <div className="sm:ml-3">
              <button
                onClick={goHome}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Voltar ao Início
              </button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Se o problema persistir, entre em contato conosco ou tente
              novamente em alguns minutos.
            </p>
          </div>
        </div>
      </div>

      {/* Logo ou branding no rodapé */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          © 2025 XCorte - Sistema de Agendamentos
        </p>
      </div>
    </div>
  );
}
