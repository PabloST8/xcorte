import React, { useState } from "react";

export default function CorsTestComponent() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testCors = async () => {
    setLoading(true);
    setResult("Testando...");

    try {
      console.log("🧪 [CORS Test] Iniciando teste CORS direto...");

      const response = await fetch(
        "http://localhost:3001/api/bookings?enterpriseEmail=pablofafstar@gmail.com",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🧪 [CORS Test] Response status:", response.status);
      console.log("🧪 [CORS Test] Response headers:", response.headers);

      const data = await response.json();
      console.log("🧪 [CORS Test] Response data:", data);

      setResult(
        `✅ Sucesso! Status: ${response.status}, Data: ${JSON.stringify(
          data,
          null,
          2
        )}`
      );
    } catch (error) {
      console.error("🧪 [CORS Test] Erro:", error);
      setResult(`❌ Erro: ${error.message}`);
    }

    setLoading(false);
  };

  const testOptions = async () => {
    setLoading(true);
    setResult("Testando OPTIONS...");

    try {
      console.log("🧪 [OPTIONS Test] Testando preflight...");

      const response = await fetch("http://localhost:3001/api/bookings", {
        method: "OPTIONS",
      });

      console.log("🧪 [OPTIONS Test] Response status:", response.status);
      console.log("🧪 [OPTIONS Test] Response headers:", {
        "Access-Control-Allow-Origin": response.headers.get(
          "Access-Control-Allow-Origin"
        ),
        "Access-Control-Allow-Methods": response.headers.get(
          "Access-Control-Allow-Methods"
        ),
        "Access-Control-Allow-Headers": response.headers.get(
          "Access-Control-Allow-Headers"
        ),
      });

      setResult(`✅ OPTIONS OK! Status: ${response.status}`);
    } catch (error) {
      console.error("🧪 [OPTIONS Test] Erro:", error);
      setResult(`❌ OPTIONS Erro: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-4 border rounded bg-yellow-50">
      <h3 className="text-lg font-bold mb-4">
        🧪 Teste API Local (aguardando CORS da nuvem)
      </h3>

      <div className="space-x-2 mb-4">
        <button
          onClick={testCors}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? "Testando..." : "Testar GET"}
        </button>

        <button
          onClick={testOptions}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? "Testando..." : "Testar OPTIONS"}
        </button>
      </div>

      <div className="bg-gray-100 p-3 rounded">
        <strong>Resultado:</strong>
        <pre className="whitespace-pre-wrap text-sm mt-2">
          {result || "Clique em um botão para testar"}
        </pre>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Status esperado:</strong>
        </p>
        <ul className="list-disc ml-4">
          <li>OPTIONS deve retornar 200/204 com headers CORS</li>
          <li>GET deve funcionar ou retornar dados válidos</li>
          <li>Verifique o console para logs detalhados</li>
        </ul>
      </div>
    </div>
  );
}
