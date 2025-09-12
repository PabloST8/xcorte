import { useState } from "react";
import { Key, CheckCircle, XCircle, Loader } from "lucide-react";

function ApiKeyTester() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testApiKey = async () => {
    setTesting(true);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_WHATSAPP_EVOLUTION_API_KEY;
      const baseURL = import.meta.env.VITE_WHATSAPP_EVOLUTION_URL;

      if (!apiKey || !baseURL) {
        setResult({
          success: false,
          message: "API Key ou URL não configurados",
        });
        return;
      }

      // Teste 1: Endpoint básico de saúde
      try {
        const response = await fetch(`${baseURL}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
        });

        if (response.status === 401) {
          setResult({
            success: false,
            message: "API Key inválida ou expirada",
            details: "A chave da API não foi aceita pelo servidor",
          });
          return;
        }

        if (response.status === 403) {
          setResult({
            success: false,
            message: "Acesso negado",
            details: "A chave da API não tem permissões necessárias",
          });
          return;
        }

        // Teste 2: Endpoint específico de instâncias
        const instancesResponse = await fetch(
          `${baseURL}/instance/fetchInstances`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
          }
        );

        if (instancesResponse.ok) {
          const data = await instancesResponse.json();
          setResult({
            success: true,
            message: "API Key válida!",
            details: `Encontradas ${data.length || 0} instâncias`,
          });
        } else if (instancesResponse.status === 401) {
          setResult({
            success: false,
            message: "API Key inválida para este endpoint",
            details: "A chave não tem acesso às instâncias",
          });
        } else {
          setResult({
            success: true,
            message: "API Key aceita, mas endpoint diferente",
            details: `Status: ${instancesResponse.status}`,
          });
        }
      } catch (error) {
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          setResult({
            success: false,
            message: "Erro de conexão",
            details: "Não foi possível conectar ao servidor",
          });
        } else {
          setResult({
            success: false,
            message: "Erro inesperado",
            details: error.message,
          });
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Erro de configuração",
        details: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Key className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Teste da API Key
          </h3>
        </div>
        <button
          onClick={testApiKey}
          disabled={testing}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {testing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Testando...</span>
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              <span>Testar API Key</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message}
              </p>
              {result.details && (
                <p
                  className={`text-sm mt-1 ${
                    result.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {result.details}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">
          Configuração atual:
        </h4>
        <div className="text-sm font-mono text-gray-600 space-y-1">
          <div>
            URL:{" "}
            {import.meta.env.VITE_WHATSAPP_EVOLUTION_URL || "Não configurada"}
          </div>
          <div>
            API Key:{" "}
            {import.meta.env.VITE_WHATSAPP_EVOLUTION_API_KEY
              ? `${import.meta.env.VITE_WHATSAPP_EVOLUTION_API_KEY.substring(
                  0,
                  20
                )}...`
              : "Não configurada"}
          </div>
          <div>
            Instance:{" "}
            {import.meta.env.VITE_WHATSAPP_EVOLUTION_INSTANCE || "xcorte"}
          </div>
        </div>
      </div>

      {!result?.success && result && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Como obter uma API Key válida:
          </h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>
              Acesse{" "}
              <a
                href="https://evolution.hiarley.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://evolution.hiarley.me
              </a>
            </li>
            <li>Faça login ou crie uma conta</li>
            <li>Vá para a seção de API Keys</li>
            <li>Gere uma nova chave com permissões completas</li>
            <li>Substitua a chave no arquivo .env</li>
            <li>Reinicie o servidor de desenvolvimento</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default ApiKeyTester;
