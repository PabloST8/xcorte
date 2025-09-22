import React, { useState } from "react";
import { simpleUploadService } from "../services/simpleUploadService";

/**
 * Teste simples de upload sem autenticação
 */
const DirectUploadTest = () => {
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
      console.log("🧪 Teste de upload direto iniciado...");
      console.log("📁 Arquivo:", file.name, file.type, file.size);

      // Upload direto sem autenticação
      const uploadResult = await simpleUploadService.uploadPhoto(
        "test-user",
        file
      );

      console.log("✅ Upload realizado:", uploadResult);

      setResult(uploadResult);
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      setError(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="font-semibold text-green-800 mb-2">
        🚀 Upload Direto (Sem Auth)
      </h4>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />

      {uploading && (
        <div className="text-green-600 mb-3">📤 Fazendo upload direto...</div>
      )}

      {error && (
        <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="text-green-600 text-sm mb-3 p-2 bg-green-100 rounded border border-green-300">
          <p>✅ Upload realizado com sucesso!</p>
          <p className="text-xs mt-1">Arquivo: {result.fileName}</p>
          <p className="text-xs">
            Tamanho: {(result.size / 1024).toFixed(1)} KB
          </p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline text-xs"
          >
            🔗 Ver imagem
          </a>
        </div>
      )}

      <div className="text-xs text-green-700">
        📋 Este teste usa regras públicas do Storage
      </div>
    </div>
  );
};

export default DirectUploadTest;
