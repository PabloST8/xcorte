import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Upload } from "lucide-react";
import modernPhotoService from "../services/modernPhotoService";

const StaffPhotoUpload = ({
  enterpriseEmail,
  staffId,
  currentPhotoURL,
  onPhotoUpdated,
  className = "",
  size = "large", // "small", "medium", "large"
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [previewURL, setPreviewURL] = useState(currentPhotoURL);
  const fileInputRef = useRef(null);

  // Mantém a preview sincronizada quando a prop currentPhotoURL mudar
  useEffect(() => {
    setPreviewURL(currentPhotoURL || null);
  }, [currentPhotoURL]);

  // Tamanhos responsivos
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-12 h-12 text-sm";
      case "medium":
        return "w-16 h-16 text-lg";
      case "large":
      default:
        return "w-20 h-20 text-xl";
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError("");
      setUploading(true);
      setProgress(0);

      // Preview imediato
      const reader = new FileReader();
      reader.onload = (e) => setPreviewURL(e.target.result);
      reader.readAsDataURL(file);

      // Upload
      const result = await modernPhotoService.uploadStaffPhoto(
        enterpriseEmail,
        staffId,
        file,
        (progressPercent) => setProgress(progressPercent)
      );

      setPreviewURL(result.url);
      onPhotoUpdated && onPhotoUpdated(result);
    } catch (error) {
      setError(error.message);
      setPreviewURL(currentPhotoURL); // Volta ao original
    } finally {
      setUploading(false);
      setProgress(0);
      // Limpar o input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setPreviewURL(null);
    onPhotoUpdated && onPhotoUpdated(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Avatar/Preview */}
      <div
        className={`${getSizeClasses()} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors relative group`}
        onClick={triggerFileInput}
      >
        {previewURL ? (
          <>
            <img
              src={previewURL}
              alt="Avatar do funcionário"
              className="w-full h-full object-cover"
            />
            {/* Overlay com ícone de câmera */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Camera className="w-6 h-6 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">Foto</span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-xs">{Math.round(progress)}%</div>
          </div>
        )}
      </div>

      {/* Botão de remover foto */}
      {previewURL && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemovePhoto();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Erro */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs whitespace-nowrap z-10">
          {error}
        </div>
      )}

      {/* Indicador de progresso */}
      {uploading && progress > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default StaffPhotoUpload;
