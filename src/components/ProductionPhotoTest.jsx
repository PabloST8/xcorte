import React, { useState, useEffect } from "react";
import { storage } from "../services/firebase";
import { getFirebaseConfig, isProduction } from "../config/productionFirebase";

const ProductionPhotoTest = () => {
  const [configInfo, setConfigInfo] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    console.log("🧪 Iniciando teste de produção...");

    // Obter informações de configuração
    const config = getFirebaseConfig();
    const info = {
      environment: isProduction ? "🌐 PRODUÇÃO" : "💻 LOCAL",
      hostname: window.location.hostname,
      bucket: config.storageBucket,
      projectId: config.projectId,
      storageRef: storage ? "✅ Storage inicializado" : "❌ Storage falhou",
    };

    setConfigInfo(info);
    console.log("📊 Config Info:", info);

    // Testes básicos
    runTests();
  }, []);

  const runTests = async () => {
    const results = {};

    // Teste 1: Configuração Firebase
    try {
      const config = getFirebaseConfig();
      results.firebaseConfig = config.storageBucket ? "✅ OK" : "❌ Falhou";
    } catch (error) {
      results.firebaseConfig = "❌ Erro: " + error.message;
    }

    // Teste 2: Storage inicialização
    try {
      results.storageInit = storage ? "✅ Storage OK" : "❌ Storage falhou";
    } catch (error) {
      results.storageInit = "❌ Erro: " + error.message;
    }

    // Teste 3: Conectividade com Firebase Storage
    try {
      const testRef = storage.ref ? storage.ref("test-connection") : null;
      results.connectivity = testRef ? "✅ Ref OK" : "❌ Ref falhou";
    } catch (error) {
      results.connectivity = "❌ Erro: " + error.message;
    }

    console.log("🧪 Resultados dos testes:", results);
    setTestResults(results);
  };

  if (!configInfo) {
    return (
      <div className="p-4 border border-blue-200 rounded">
        Carregando teste...
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-300 rounded-lg bg-gray-50 mb-4">
      <h3 className="text-lg font-bold mb-4">
        🧪 Teste de Produção - Firebase Storage
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold mb-2">📊 Informações do Ambiente</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Ambiente:</strong> {configInfo.environment}
            </div>
            <div>
              <strong>Hostname:</strong> {configInfo.hostname}
            </div>
            <div>
              <strong>Bucket:</strong> {configInfo.bucket}
            </div>
            <div>
              <strong>Project ID:</strong> {configInfo.projectId}
            </div>
            <div>
              <strong>Storage:</strong> {configInfo.storageRef}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold mb-2">🧪 Resultados dos Testes</h4>
          <div className="text-sm space-y-1">
            <div>
              <strong>Config Firebase:</strong>{" "}
              {testResults.firebaseConfig || "⏳ Testando..."}
            </div>
            <div>
              <strong>Storage Init:</strong>{" "}
              {testResults.storageInit || "⏳ Testando..."}
            </div>
            <div>
              <strong>Conectividade:</strong>{" "}
              {testResults.connectivity || "⏳ Testando..."}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">
          💡 Status da Configuração
        </h4>
        <div className="text-sm text-yellow-700">
          {isProduction ? (
            <div>
              ✅ <strong>Configuração de produção ativa!</strong>
              <br />
              Usando configuração hardcoded para garantir funcionamento.
            </div>
          ) : (
            <div>
              💻 <strong>Ambiente de desenvolvimento</strong>
              <br />
              Usando variáveis de ambiente padrão.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={runTests}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        🔄 Executar Testes Novamente
      </button>
    </div>
  );
};

export default ProductionPhotoTest;
