import React, { useEffect, useState } from "react";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { firestoreEnterpriseService } from "../services/firestoreEnterpriseService";

/**
 * Componente para depurar e testar o sistema de fotos de empresas
 */
const PhotoDebugger = () => {
  const { currentEnterprise } = useEnterprise();
  const [freshData, setFreshData] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshEnterpriseData = async () => {
    if (!currentEnterprise?.email) return;

    setLoading(true);
    try {
      console.log("🔄 Recarregando dados da empresa do Firestore...");
      const fresh = await firestoreEnterpriseService.getEnterpriseByEmail(
        currentEnterprise.email
      );
      setFreshData(fresh);
      console.log("✅ Dados atualizados:", fresh);
    } catch (error) {
      console.error("❌ Erro ao recarregar:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshEnterpriseData();
  }, [currentEnterprise?.email]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🖼️ Depuração de Fotos da Empresa
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados do Contexto */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            📋 Dados do Contexto (Memória)
          </h3>
          <div className="bg-gray-50 p-4 rounded border">
            <div>
              <strong>Nome:</strong> {currentEnterprise?.name || "N/A"}
            </div>
            <div>
              <strong>Email:</strong> {currentEnterprise?.email || "N/A"}
            </div>
            <div>
              <strong>ID:</strong> {currentEnterprise?.id || "N/A"}
            </div>
            <div>
              <strong>Tem photoURL:</strong>{" "}
              {currentEnterprise?.photoURL ? "✅ Sim" : "❌ Não"}
            </div>
            {currentEnterprise?.photoURL && (
              <div className="mt-2">
                <div>
                  <strong>Photo URL:</strong>
                </div>
                <div className="text-xs break-all bg-white p-2 rounded border mt-1">
                  {currentEnterprise.photoURL}
                </div>
              </div>
            )}
            {currentEnterprise?.photoPath && (
              <div className="mt-2">
                <div>
                  <strong>Photo Path:</strong>
                </div>
                <div className="text-xs break-all bg-white p-2 rounded border mt-1">
                  {currentEnterprise.photoPath}
                </div>
              </div>
            )}
            {currentEnterprise?.photoUpdatedAt && (
              <div className="mt-2">
                <div>
                  <strong>Atualizada em:</strong>
                </div>
                <div className="text-sm bg-white p-2 rounded border mt-1">
                  {new Date(currentEnterprise.photoUpdatedAt).toLocaleString(
                    "pt-BR"
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview da foto do contexto */}
          {currentEnterprise?.photoURL && (
            <div>
              <h4 className="font-medium mb-2">🖼️ Preview (Contexto)</h4>
              <div className="border-2 border-dashed border-gray-300 p-4 rounded">
                <img
                  src={currentEnterprise.photoURL}
                  alt="Foto da empresa (contexto)"
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                  onError={(e) => {
                    e.target.src = "";
                    e.target.alt = "Erro ao carregar imagem";
                    e.target.className =
                      "w-32 h-32 bg-red-100 border border-red-300 rounded-lg mx-auto flex items-center justify-center text-red-500 text-xs";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dados do Firestore */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              🔥 Dados do Firestore (Real)
            </h3>
            <button
              onClick={refreshEnterpriseData}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? "🔄" : "↻"} Atualizar
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded border">
            {freshData ? (
              <>
                <div>
                  <strong>Nome:</strong> {freshData.name || "N/A"}
                </div>
                <div>
                  <strong>Email:</strong> {freshData.email || "N/A"}
                </div>
                <div>
                  <strong>ID:</strong> {freshData.id || "N/A"}
                </div>
                <div>
                  <strong>Tem photoURL:</strong>{" "}
                  {freshData.photoURL ? "✅ Sim" : "❌ Não"}
                </div>
                {freshData.photoURL && (
                  <div className="mt-2">
                    <div>
                      <strong>Photo URL:</strong>
                    </div>
                    <div className="text-xs break-all bg-white p-2 rounded border mt-1">
                      {freshData.photoURL}
                    </div>
                  </div>
                )}
                {freshData.photoPath && (
                  <div className="mt-2">
                    <div>
                      <strong>Photo Path:</strong>
                    </div>
                    <div className="text-xs break-all bg-white p-2 rounded border mt-1">
                      {freshData.photoPath}
                    </div>
                  </div>
                )}
                {freshData.photoUpdatedAt && (
                  <div className="mt-2">
                    <div>
                      <strong>Atualizada em:</strong>
                    </div>
                    <div className="text-sm bg-white p-2 rounded border mt-1">
                      {new Date(
                        freshData.photoUpdatedAt.toDate()
                      ).toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500">
                {loading ? "Carregando..." : "Dados não carregados"}
              </div>
            )}
          </div>

          {/* Preview da foto do Firestore */}
          {freshData?.photoURL && (
            <div>
              <h4 className="font-medium mb-2">🖼️ Preview (Firestore)</h4>
              <div className="border-2 border-dashed border-gray-300 p-4 rounded">
                <img
                  src={freshData.photoURL}
                  alt="Foto da empresa (firestore)"
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                  onError={(e) => {
                    e.target.src = "";
                    e.target.alt = "Erro ao carregar imagem";
                    e.target.className =
                      "w-32 h-32 bg-red-100 border border-red-300 rounded-lg mx-auto flex items-center justify-center text-red-500 text-xs";
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparação */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">🔍 Análise</h4>
        <div className="text-sm space-y-1">
          {currentEnterprise?.photoURL && freshData?.photoURL ? (
            currentEnterprise.photoURL === freshData.photoURL ? (
              <div className="text-green-700">
                ✅ Contexto e Firestore estão sincronizados
              </div>
            ) : (
              <div className="text-red-700">
                ❌ Contexto e Firestore estão DIFERENTES!
              </div>
            )
          ) : currentEnterprise?.photoURL && !freshData?.photoURL ? (
            <div className="text-orange-700">
              ⚠️ Contexto tem foto mas Firestore não
            </div>
          ) : !currentEnterprise?.photoURL && freshData?.photoURL ? (
            <div className="text-orange-700">
              ⚠️ Firestore tem foto mas contexto não
            </div>
          ) : (
            <div className="text-gray-700">
              ℹ️ Nenhuma foto encontrada em ambos
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoDebugger;
