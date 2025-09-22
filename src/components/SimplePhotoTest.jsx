import React, { useState } from "react";
import { storage } from "../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { v4 as uuidv4 } from "uuid";

/**
 * Componente de teste simples para upload sem autenticação
 */
const SimplePhotoTest = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      console.log("🧪 Teste simples de upload iniciado...");
      console.log("📁 Arquivo:", file.name, file.type, file.size);

      // Garantir autenticação
      console.log("🔐 Verificando autenticação...");
      await firebaseAuthService.ensureAnonymous();

      // Gerar nome único simples
      const fileName = `test_${Date.now()}_${uuidv4().substring(
        0,
        8
      )}.${file.name.split(".").pop()}`;
      const filePath = `test-uploads/${fileName}`;

      console.log("📍 Caminho:", filePath);

      // Criar referência
      const storageRef = ref(storage, filePath);

      console.log("🔧 Storage Ref criada:", storageRef);

      // Upload simples
      const snapshot = await uploadBytes(storageRef, file);

      console.log("✅ Upload concluído:", snapshot);

      // Obter URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log("🔗 URL obtida:", downloadURL);

      setResult({
        url: downloadURL,
        path: filePath,
        fileName: fileName,
        size: file.size,
      });
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      setError(`Erro: ${error.code || "unknown"} - ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Teste Simples de Upload</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {uploading && (
        <div className="text-blue-600 mb-4">📤 Fazendo upload...</div>
      )}

      {error && (
        <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="text-green-600 text-sm mb-4 p-2 bg-green-50 rounded">
          <p>✅ Upload realizado com sucesso!</p>
          <p className="text-xs mt-1">Arquivo: {result.fileName}</p>
          <p className="text-xs">
            Tamanho: {(result.size / 1024).toFixed(1)} KB
          </p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs"
          >
            Ver imagem
          </a>
        </div>
      )}
    </div>
  );
};

export default SimplePhotoTest;
