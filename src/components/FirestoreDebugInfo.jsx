import React, { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function FirestoreDebugInfo() {
  const [firestoreData, setFirestoreData] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkFirestore = async (identifier) => {
    if (!identifier) return;

    setLoading(true);
    try {
      console.log(`🔍 Verificando Firestore para: ${identifier}`);

      const docRef = doc(db, "enterprises", identifier);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ Documento encontrado:`, data);
        setFirestoreData(data);
      } else {
        console.log(`❌ Documento não encontrado para: ${identifier}`);
        setFirestoreData(null);
      }
    } catch (error) {
      console.error("❌ Erro ao verificar Firestore:", error);
      setFirestoreData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-purple-800 mb-3">
        🔍 Debug Firestore
      </h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={() => checkFirestore("pablofafstar@gmail.com")}
          disabled={loading}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Verificar por Email"}
        </button>

        <button
          onClick={() => checkFirestore("barbearia-do-pablo")}
          disabled={loading}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 ml-2"
        >
          {loading ? "Verificando..." : "Verificar por ID"}
        </button>
      </div>

      {firestoreData && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-purple-700 mb-2">
            Dados encontrados:
          </h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(firestoreData, null, 2)}
          </pre>

          {firestoreData.photoURL && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-600">
                ✅ Foto encontrada: {firestoreData.photoURL.substring(0, 50)}...
              </p>
              <div className="mt-2">
                <img
                  src={firestoreData.photoURL}
                  alt="Foto da empresa"
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-400"
                  onLoad={() => console.log("✅ Imagem carregada com sucesso")}
                  onError={(e) => {
                    console.error("❌ Erro ao carregar imagem:", e);
                    console.error("❌ URL da imagem:", firestoreData.photoURL);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
