import React, { useState, useRef, useEffect } from "react";
import modernPhotoService from "../services/modernPhotoService";

const ModernPhotoUpload = ({
  userId,
  currentPhotoURL,
  onPhotoUpdated,
  className = "",
  showActions = true,
  showInfo = true,
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
      const result = await modernPhotoService.uploadUserPhoto(
        userId,
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
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoURL) return;

    try {
      setError("");
      setUploading(true);

      // Extrai o path da URL
      const url = new URL(currentPhotoURL);
      const path = decodeURIComponent(
        url.pathname.split("/o/")[1].split("?")[0]
      );

      await modernPhotoService.deleteUserPhoto(path);

      setPreviewURL(null);
      onPhotoUpdated && onPhotoUpdated(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarActivate = (e) => {
    if (uploading) return;
    e?.preventDefault?.();
    fileInputRef.current?.click();
  };

  const containerSpacing = showActions || showInfo ? "space-y-4" : "";

  return (
    <div
      className={`flex flex-col items-center ${containerSpacing} ${className}`}
    >
      {/* Avatar Display (click to upload) */}
      <div
        className="relative group cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={previewURL ? "Alterar foto" : "Adicionar foto"}
        onClick={handleAvatarActivate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAvatarActivate(e);
        }}
      >
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {previewURL ? (
            <img
              src={previewURL}
              alt="Foto do usuário"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-16 h-16 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">{Math.round(progress)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {previewURL ? "Alterar Foto" : "Adicionar Foto"}
          </button>

          {previewURL && (
            <button
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Info Text */}
      {showInfo && (
        <p className="text-xs text-gray-500 text-center max-w-sm">
          Formatos aceitos: JPEG, PNG, WebP. Máximo 5MB.
          <br />A imagem será redimensionada automaticamente.
        </p>
      )}
    </div>
  );
};

export default ModernPhotoUpload;
