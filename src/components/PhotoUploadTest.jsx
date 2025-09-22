import React, { useState } from "react";
import modernPhotoService from "../services/modernPhotoService";

const PhotoUploadTest = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError("");
      setUploading(true);
      setResult(null);

      console.log("🔧 Iniciando teste de upload...", file);

      const uploadResult = await modernPhotoService.uploadUserPhoto(
        "test-user-123",
        file,
        (progress) => {
          console.log(`📈 Progresso: ${progress}%`);
        }
      );

      console.log("✅ Upload concluído:", uploadResult);
      setResult(uploadResult);
    } catch (error) {
      console.error("❌ Erro no upload:", error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 Teste de Upload Moderno</h3>

      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {uploading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          🔄 Fazendo upload... Aguarde...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          ❌ Erro: {error}
        </div>
      )}

      {result && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="mb-2">✅ Upload realizado com sucesso!</div>
          <div className="text-sm">
            <div>
              <strong>URL:</strong>{" "}
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Ver imagem
              </a>
            </div>
            <div>
              <strong>Path:</strong> {result.path}
            </div>
            <div>
              <strong>Tamanho:</strong> {Math.round(result.size / 1024)} KB
            </div>
          </div>
          <div className="mt-3">
            <img
              src={result.url}
              alt="Upload"
              className="max-w-xs max-h-48 object-cover rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploadTest;
