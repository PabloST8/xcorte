import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";

export default function Empresa() {
  const { currentEnterprise } = useEnterprise();
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  if (!currentEnterprise)
    return <div className="p-8 text-center">Empresa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to={getEnterpriseUrl("")}>
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Empresa</h1>
        <div />
      </header>

      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow mt-8">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-yellow-400">
            {currentEnterprise.logoUrl ? (
              <img
                src={currentEnterprise.logoUrl}
                alt={currentEnterprise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-gray-500">
                {currentEnterprise.name?.[0] || "?"}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 text-center">
            {currentEnterprise.name}
          </div>
          {currentEnterprise.address && (
            <div className="text-gray-600 text-base text-center">
              {currentEnterprise.address}
            </div>
          )}
          {(currentEnterprise.city || currentEnterprise.state) && (
            <div className="text-gray-500 text-sm text-center">
              {[currentEnterprise.city, currentEnterprise.state]
                .filter(Boolean)
                .join(" - ")}
            </div>
          )}
          {currentEnterprise.phone && (
            <div className="text-gray-500 text-sm mt-1">
              {currentEnterprise.phone}
            </div>
          )}
          {currentEnterprise.email && (
            <div className="text-gray-400 text-xs mt-2">
              {currentEnterprise.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
