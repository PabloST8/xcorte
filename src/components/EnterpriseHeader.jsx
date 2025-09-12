import React from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { Building2, MapPin, ExternalLink } from "lucide-react";

/**
 * Componente que exibe informações da empresa atual
 * Pode ser usado no header das páginas
 */
export default function EnterpriseHeader({ showSelector = false }) {
  const { currentEnterprise, enterprises } = useEnterprise();
  const { navigateToEnterpriseSelector } = useEnterpriseNavigation();

  if (!currentEnterprise) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Informações da empresa */}
          <div className="flex items-center space-x-3">
            {/* Logo ou ícone */}
            {currentEnterprise.logoUrl ? (
              <img
                src={currentEnterprise.logoUrl}
                alt={`Logo da ${currentEnterprise.name}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Nome e endereço */}
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentEnterprise.name}
              </h1>
              {currentEnterprise.address && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{currentEnterprise.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seletor de empresas */}
          {showSelector && enterprises.length > 1 && (
            <button
              onClick={() => navigateToEnterpriseSelector()}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Trocar empresa</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {enterprises.length}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
