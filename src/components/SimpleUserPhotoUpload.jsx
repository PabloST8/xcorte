import React, { useState } from "react";
import { simpleUploadService } from "../services/simpleUploadService";
import { Camera, Upload, X, User, Loader2 } from "lucide-react";

/**
 * Componente simplificado de upload sem autenticação
 */
const SimpleUserPhotoUpload = ({
  userId,
  currentPhotoUrl,
  onPhotoUpdate,
  size = "large",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);

  // Tamanhos do componente
  const sizes = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
    xlarge: "w-48 h-48",
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
  };

  /**
   * Manipula a seleção de arquivo
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    setIsUploading(true);

    try {
      // Criar preview da imagem
      const previewURL = URL.createObjectURL(file);
      setPreviewUrl(previewURL);

      console.log("🚀 Iniciando upload simples...");

      // Fazer upload sem autenticação
      const result = await simpleUploadService.uploadPhoto(userId, file);

      if (result.success) {
        // Atualizar preview com URL final
        setPreviewUrl(result.url);

        // Notificar componente pai
        if (onPhotoUpdate) {
          onPhotoUpdate({
            url: result.url,
            path: result.path,
            fileName: result.fileName,
          });
        }

        // Limpar preview temporário
        URL.revokeObjectURL(previewURL);
      }
    } catch (error) {
      console.error("❌ Erro no upload:", error);
      setError(error.message);
      // Restaurar foto anterior em caso de erro
      setPreviewUrl(currentPhotoUrl);
    } finally {
      setIsUploading(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Remove a foto atual
   */
  const handleRemovePhoto = async () => {
    if (!previewUrl || isUploading) return;

    setError("");
    setIsUploading(true);

    try {
      setPreviewUrl(null);

      // Notificar componente pai sobre remoção
      if (onPhotoUpdate) {
        onPhotoUpdate(null);
      }
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      setError("Erro ao remover foto");
      setPreviewUrl(currentPhotoUrl);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Abre o seletor de arquivos
   */
  const openFileSelector = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Container da foto */}
      <div
        className={`relative ${sizes[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-gray-300 transition-colors`}
      >
        {/* Foto ou placeholder */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Foto do usuário"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <User size={iconSizes[size]} className="text-gray-400" />
          </div>
        )}

        {/* Overlay de loading */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2
              size={iconSizes[size]}
              className="text-white animate-spin"
            />
          </div>
        )}

        {/* Botão de remover foto */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            title="Remover foto"
          >
            <X size={14} />
          </button>
        )}

        {/* Botão de upload (overlay) */}
        <button
          onClick={openFileSelector}
          disabled={isUploading}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          title="Alterar foto"
        >
          <div className="opacity-0 hover:opacity-100 transition-opacity">
            <Camera
              size={iconSizes[size]}
              className="text-white drop-shadow-lg"
            />
          </div>
        </button>
      </div>

      {/* Botões de ação */}
      <div className="flex space-x-2">
        <button
          onClick={openFileSelector}
          disabled={isUploading}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
        >
          <Upload size={14} />
          <span>{previewUrl ? "Alterar" : "Adicionar"}</span>
        </button>

        {previewUrl && (
          <button
            onClick={handleRemovePhoto}
            disabled={isUploading}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
          >
            Remover
          </button>
        )}
      </div>

      {/* Input de arquivo (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="text-red-500 text-sm text-center max-w-xs bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Status */}
      {!previewUrl && !error && !isUploading && (
        <div className="text-gray-500 text-xs text-center max-w-xs">
          📷 JPEG, PNG ou WebP até 5MB
          <br />
          🚀 Upload direto (desenvolvimento)
        </div>
      )}
    </div>
  );
};

export default SimpleUserPhotoUpload;
