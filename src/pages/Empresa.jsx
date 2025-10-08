import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import EnterpriseAvatar from "../components/EnterpriseAvatar";

export default function Empresa() {
  const navigate = useNavigate();
  const { currentEnterprise } = useEnterprise();

  if (!currentEnterprise)
    return <div className="p-8 text-center">Empresa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Empresa</h1>
        <div />
      </header>

      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow mt-8">
        <div className="flex flex-col items-center gap-3 mb-4">
          <EnterpriseAvatar
            enterprise={currentEnterprise}
            size="xl"
            className="shadow-lg"
          />
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
