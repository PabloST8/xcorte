import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

/**
 * Componente para testar e depurar conexão Firebase
 */
const FirebaseDebugger = () => {
  const [status, setStatus] = useState("Testando conexão...");
  const [enterprises, setEnterprises] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      console.log("🔧 Testando conexão Firebase...");
      setStatus("Conectando ao Firebase...");

      // Testar consulta simples
      const enterprisesRef = collection(db, "enterprises");
      const snapshot = await getDocs(enterprisesRef);

      console.log("📊 Documentos encontrados:", snapshot.docs.length);

      const enterprisesList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        enterprisesList.push({
          id: doc.id,
          name: data.name || "Nome não definido",
          email: data.email || "Email não definido",
          ...data,
        });
      });

      setEnterprises(enterprisesList);
      setStatus(`Sucesso! ${enterprisesList.length} empresas encontradas.`);
      setError(null);
    } catch (err) {
      console.error("❌ Erro na conexão Firebase:", err);
      setError(err.message);
      setStatus("Erro na conexão");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🔧 Depuração Firebase
      </h2>

      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Status:</span>
          <span
            className={`px-2 py-1 rounded text-sm ${
              error
                ? "bg-red-100 text-red-800"
                : status.includes("Sucesso")
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Erro:</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Configuração Firebase:</h3>
        <div className="bg-gray-50 p-4 rounded text-sm">
          <div>
            <strong>Project ID:</strong>{" "}
            {import.meta.env.VITE_FIREBASE_PROJECT_ID || "❌ Não definido"}
          </div>
          <div>
            <strong>Auth Domain:</strong>{" "}
            {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "❌ Não definido"}
          </div>
          <div>
            <strong>API Key:</strong>{" "}
            {import.meta.env.VITE_FIREBASE_API_KEY
              ? "✅ Definida"
              : "❌ Não definida"}
          </div>
        </div>
      </div>

      {enterprises.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Empresas encontradas:</h3>
          <div className="space-y-2">
            {enterprises.map((enterprise, index) => (
              <div
                key={enterprise.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded"
              >
                <div className="font-medium">
                  {index + 1}. {enterprise.name}
                </div>
                <div className="text-sm text-gray-600">ID: {enterprise.id}</div>
                <div className="text-sm text-gray-600">
                  Email: {enterprise.email}
                </div>
                {enterprise.phone && (
                  <div className="text-sm text-gray-600">
                    Telefone: {enterprise.phone}
                  </div>
                )}
                {enterprise.address && (
                  <div className="text-sm text-gray-600">
                    Endereço: {enterprise.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={testFirebaseConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Testar Novamente
        </button>
      </div>
    </div>
  );
};

export default FirebaseDebugger;
