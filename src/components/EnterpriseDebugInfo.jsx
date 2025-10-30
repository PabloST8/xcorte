import React from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useAuth } from "../hooks/useAuth";

const EnterpriseDebugInfo = () => {
  const { currentEnterprise, enterprises } = useEnterprise();
  const { user } = useAuth();

  const enterpriseData = {
    // Dados do contexto Enterprise
    currentEnterprise: {
      exists: !!currentEnterprise,
      name: currentEnterprise?.name,
      email: currentEnterprise?.email,
      id: currentEnterprise?.id,
      photoURL: currentEnterprise?.photoURL,
      hasPhoto: !!currentEnterprise?.photoURL,
      keys: currentEnterprise ? Object.keys(currentEnterprise) : [],
    },

    // Lista de empresas
    enterprises: {
      count: enterprises?.length || 0,
      list:
        enterprises?.slice(0, 3).map((e) => ({
          name: e.name,
          email: e.email,
          id: e.id,
        })) || [],
    },

    // Dados do usuário
    user: {
      exists: !!user,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      uid: user?.uid,
    },

    // Identificador recomendado
    recommendedId:
      currentEnterprise?.id ||
      currentEnterprise?.email ||
      user?.email ||
      "NENHUM",
  };

  return (
    <div className="p-4 border border-red-300 rounded-lg bg-red-50 mb-4">
      <h3 className="text-lg font-bold mb-4 text-red-800">
        🔍 Debug - Status da Empresa
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2 text-blue-700">
            👤 Dados do Usuário
          </h4>
          <div className="text-xs space-y-1">
            <div>
              <strong>Existe:</strong>{" "}
              {enterpriseData.user.exists ? "✅ Sim" : "❌ Não"}
            </div>
            <div>
              <strong>Email:</strong> {enterpriseData.user.email || "N/A"}
            </div>
            <div>
              <strong>Nome:</strong> {enterpriseData.user.name || "N/A"}
            </div>
            <div>
              <strong>Role:</strong> {enterpriseData.user.role || "N/A"}
            </div>
            <div>
              <strong>UID:</strong> {enterpriseData.user.uid || "N/A"}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2 text-green-700">
            🏢 Empresa Atual
          </h4>
          <div className="text-xs space-y-1">
            <div>
              <strong>Existe:</strong>{" "}
              {enterpriseData.currentEnterprise.exists ? "✅ Sim" : "❌ Não"}
            </div>
            <div>
              <strong>Nome:</strong>{" "}
              {enterpriseData.currentEnterprise.name || "N/A"}
            </div>
            <div>
              <strong>Email:</strong>{" "}
              {enterpriseData.currentEnterprise.email || "N/A"}
            </div>
            <div>
              <strong>ID:</strong>{" "}
              {enterpriseData.currentEnterprise.id || "N/A"}
            </div>
            <div>
              <strong>Tem Foto:</strong>{" "}
              {enterpriseData.currentEnterprise.hasPhoto ? "✅ Sim" : "❌ Não"}
            </div>
            <div>
              <strong>Campos:</strong>{" "}
              {enterpriseData.currentEnterprise.keys.join(", ")}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2 text-purple-700">
            📋 Lista de Empresas
          </h4>
          <div className="text-xs space-y-1">
            <div>
              <strong>Total:</strong> {enterpriseData.enterprises.count}
            </div>
            {enterpriseData.enterprises.list.map((ent, index) => (
              <div key={index} className="bg-gray-50 p-1 rounded">
                <div>
                  <strong>{index + 1}:</strong> {ent.name}
                </div>
                <div className="text-gray-600">Email: {ent.email}</div>
                <div className="text-gray-600">ID: {ent.id || "N/A"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2 text-orange-700">
            🔧 Recomendação
          </h4>
          <div className="text-xs space-y-1">
            <div>
              <strong>ID Recomendado:</strong>
            </div>
            <div className="font-mono bg-gray-100 p-2 rounded">
              {enterpriseData.recommendedId}
            </div>
            <div className="text-gray-600">
              {enterpriseData.recommendedId === "NENHUM"
                ? "❌ Nenhum identificador válido encontrado"
                : "✅ Este ID deve ser usado para operações"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Diagnóstico</h4>
        <div className="text-sm text-yellow-700">
          {!currentEnterprise ? (
            <div>
              ❌ <strong>Problema:</strong> currentEnterprise está
              null/undefined
            </div>
          ) : !currentEnterprise.id && !currentEnterprise.email ? (
            <div>
              ❌ <strong>Problema:</strong> Empresa existe mas não tem ID nem
              email
            </div>
          ) : (
            <div>
              ✅ <strong>OK:</strong> Empresa carregada corretamente
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDebugInfo;
