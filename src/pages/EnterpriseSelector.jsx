import React from "react";
import { useNavigate } from "react-router-dom";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { enterpriseCandidates } from "../utils/slug";
import { ArrowLeft, Check } from "lucide-react";

/**
 * Página que lista todas as empresas disponíveis
 * Útil para quando o usuário quer escolher uma empresa específica
 */
export default function EnterpriseSelector() {
  const navigate = useNavigate();
  const { enterprises, loading, currentEnterprise } = useEnterprise();
  const { navigateToHome, forceNavigateToEnterprise } =
    useEnterpriseNavigation();
  const [switchingTo, setSwitchingTo] = React.useState(null);

  const handleEnterpriseSelect = (enterprise) => {
    // Mostra indicador de loading para a empresa sendo selecionada
    setSwitchingTo(enterprise.id);

    // Usa força de navegação para garantir que a empresa seja trocada
    setTimeout(() => {
      forceNavigateToEnterprise(enterprise);
    }, 100);
  };

  const handleGoBack = () => {
    if (currentEnterprise) {
      navigateToHome();
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header com botão voltar */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha uma Empresa
          </h1>
          <p className="text-xl text-gray-600">
            Selecione a empresa que você deseja acessar
          </p>
          {currentEnterprise && (
            <p className="text-sm text-blue-600 mt-2">
              Atualmente em: <strong>{currentEnterprise.name}</strong>
            </p>
          )}
        </div>

        {enterprises.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500">Nenhuma empresa encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enterprises.map((enterprise) => {
              const isCurrentEnterprise =
                currentEnterprise && currentEnterprise.id === enterprise.id;
              const isSwitching = switchingTo === enterprise.id;

              return (
                <div
                  key={enterprise.id}
                  onClick={() =>
                    !isSwitching && handleEnterpriseSelect(enterprise)
                  }
                  className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 border-2 relative ${
                    isSwitching
                      ? "cursor-wait opacity-75 border-orange-500 bg-orange-50"
                      : isCurrentEnterprise
                      ? "cursor-pointer border-blue-500 bg-blue-50 hover:shadow-lg"
                      : "cursor-pointer border-transparent hover:border-blue-500 hover:shadow-lg"
                  }`}
                >
                  {/* Indicador de empresa atual */}
                  {isCurrentEnterprise && !isSwitching && (
                    <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  {/* Indicador de loading */}
                  {isSwitching && (
                    <div className="absolute top-3 right-3 text-orange-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  )}

                  <div className="text-center">
                    {enterprise.logoUrl ? (
                      <img
                        src={enterprise.logoUrl}
                        alt={`Logo da ${enterprise.name}`}
                        className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          isCurrentEnterprise ? "bg-blue-600" : "bg-blue-500"
                        }`}
                      >
                        <span className="text-white text-xl font-bold">
                          {enterprise.name?.charAt(0)?.toUpperCase() || "E"}
                        </span>
                      </div>
                    )}

                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isSwitching
                          ? "text-orange-700"
                          : isCurrentEnterprise
                          ? "text-blue-900"
                          : "text-gray-900"
                      }`}
                    >
                      {enterprise.name}
                      {isCurrentEnterprise && !isSwitching && (
                        <span className="block text-sm font-normal text-blue-600 mt-1">
                          (Empresa Atual)
                        </span>
                      )}
                      {isSwitching && (
                        <span className="block text-sm font-normal text-orange-600 mt-1">
                          (Trocando...)
                        </span>
                      )}
                    </h3>

                    {enterprise.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {enterprise.description}
                      </p>
                    )}

                    {enterprise.address && (
                      <p className="text-gray-500 text-sm">
                        📍 {enterprise.address}
                      </p>
                    )}

                    {enterprise.phone && (
                      <p className="text-gray-500 text-sm">
                        📞 {enterprise.phone}
                      </p>
                    )}

                    <div className="mt-4">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded ${
                          isSwitching
                            ? "bg-orange-200 text-orange-900"
                            : isCurrentEnterprise
                            ? "bg-blue-200 text-blue-900"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        /{enterpriseCandidates(enterprise)[0]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Cada empresa terá sua própria URL:{" "}
            <code>localhost:5174/nome-da-empresa</code>
          </p>
        </div>
      </div>
    </div>
  );
}
