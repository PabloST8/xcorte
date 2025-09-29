import React, { useState } from "react";

/**
 * Componente para testar e alternar entre API local e de produção
 */
export const ApiToggleTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApi = async (useLocal = true) => {
    setLoading(true);
    setTestResult(null);

    const apiUrl = useLocal
      ? "http://localhost:3001/api/bookings"
      : "https://x-corte-api.codxis.com.br/api/bookings";

    try {
      console.log(
        `🧪 Testando ${useLocal ? "API Local" : "API Produção"}:`,
        apiUrl
      );

      const response = await fetch(`${apiUrl}?enterpriseEmail=test@test.com`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        apiType: useLocal ? "local" : "production",
        url: apiUrl,
        corsEnabled: response.ok,
      });

      console.log(`✅ Resultado ${useLocal ? "API Local" : "API Produção"}:`, {
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (error) {
      console.error(
        `❌ Erro ${useLocal ? "API Local" : "API Produção"}:`,
        error
      );

      setTestResult({
        success: false,
        error: error.message,
        apiType: useLocal ? "local" : "production",
        url: apiUrl,
        corsEnabled: false,
        corsError:
          error.message.includes("CORS") || error.message.includes("blocked"),
      });
    } finally {
      setLoading(false);
    }
  };

  const testCorsOptions = async () => {
    setLoading(true);
    const apiUrl = "https://x-corte-api.codxis.com.br/api/bookings";

    try {
      console.log("🧪 Testando preflight (OPTIONS):", apiUrl);

      const response = await fetch(apiUrl, {
        method: "OPTIONS",
        headers: {
          Origin: window.location.origin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        apiType: "preflight",
        url: apiUrl,
        corsEnabled: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      console.log("✅ Resultado preflight:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error) {
      console.error("❌ Erro preflight:", error);

      setTestResult({
        success: false,
        error: error.message,
        apiType: "preflight",
        url: apiUrl,
        corsEnabled: false,
        corsError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Teste de APIs e CORS
      </h2>

      {/* Botões de Teste */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => testApi(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🏠"} Testar API Local
        </button>

        <button
          onClick={() => testApi(false)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🌐"} Testar API Produção
        </button>

        <button
          onClick={testCorsOptions}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "🔧"} Testar CORS (OPTIONS)
        </button>
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {testResult.success ? "✅" : "❌"}
            Resultado do Teste -{" "}
            {testResult.apiType === "local"
              ? "API Local"
              : testResult.apiType === "production"
              ? "API Produção"
              : "Preflight CORS"}
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>URL:</strong>{" "}
              <code className="bg-gray-200 px-2 py-1 rounded">
                {testResult.url}
              </code>
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={
                  testResult.success ? "text-green-600" : "text-red-600"
                }
              >
                {testResult.status || "N/A"} {testResult.statusText}
              </span>
            </div>

            {testResult.corsError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-red-800">
                  <strong>❌ Erro de CORS detectado!</strong>
                  <p className="text-sm mt-1">
                    O servidor precisa configurar CORS. Veja o guia{" "}
                    <code>CORS_CONFIGURATION_GUIDE.md</code>
                  </p>
                </div>
              </div>
            )}

            {testResult.success && testResult.corsEnabled && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-green-800">
                  <strong>✅ CORS funcionando!</strong>
                  <p className="text-sm mt-1">
                    API está acessível e configurada corretamente.
                  </p>
                </div>
              </div>
            )}

            {testResult.error && (
              <div>
                <strong>Erro:</strong>{" "}
                <code className="bg-red-100 px-2 py-1 rounded text-red-600">
                  {testResult.error}
                </code>
              </div>
            )}

            {testResult.data && (
              <div>
                <strong>Dados:</strong>
                <pre className="bg-gray-200 p-2 rounded text-xs mt-1 overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            {testResult.headers && (
              <div>
                <strong>Headers:</strong>
                <pre className="bg-gray-200 p-2 rounded text-xs mt-1 overflow-x-auto">
                  {JSON.stringify(testResult.headers, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Como usar:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>
            <strong>1.</strong> Teste a API Local para verificar se está
            funcionando
          </li>
          <li>
            <strong>2.</strong> Teste a API de Produção para verificar CORS
          </li>
          <li>
            <strong>3.</strong> Se houver erro CORS, configure o servidor
            conforme o guia
          </li>
          <li>
            <strong>4.</strong> Configure <code>.env</code>:{" "}
            <code>VITE_USE_LOCAL_API=false</code> para usar produção
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ApiToggleTest;
