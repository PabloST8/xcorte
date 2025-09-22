import React, { useState } from "react";
import UserPhotoUpload from "../components/UserPhotoUpload";
import UserAvatar from "../components/UserAvatar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Página de teste para o sistema de fotos de usuário
 */
const PhotoTestPage = () => {
  const navigate = useNavigate();
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [testUser] = useState({
    id: "test-user-123",
    name: "Usuário Teste",
    email: "teste@exemplo.com",
  });

  const handlePhotoUpdate = (photoData) => {
    console.log("📸 Foto atualizada no teste:", photoData);
    setCurrentPhoto(photoData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          <h1 className="text-lg font-semibold">Teste de Fotos</h1>
          <div></div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Área de teste principal */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upload de Foto de Perfil</h2>

          <div className="flex flex-col items-center space-y-4">
            <UserPhotoUpload
              userId={testUser.id}
              currentPhotoUrl={currentPhoto?.url}
              onPhotoUpdate={handlePhotoUpdate}
              size="xlarge"
            />

            <div className="text-center">
              <p className="text-gray-600">
                Teste o sistema de upload de fotos
              </p>
              {currentPhoto && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>URL: {currentPhoto.url}</p>
                  <p>Arquivo: {currentPhoto.fileName}</p>
                  <p>Caminho: {currentPhoto.path}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview em diferentes tamanhos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Previews em Diferentes Tamanhos
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <UserAvatar
                photoUrl={currentPhoto?.url}
                userName={testUser.name}
                size="small"
              />
              <p className="mt-2 text-sm text-gray-600">Pequeno</p>
            </div>

            <div className="text-center">
              <UserAvatar
                photoUrl={currentPhoto?.url}
                userName={testUser.name}
                size="medium"
              />
              <p className="mt-2 text-sm text-gray-600">Médio</p>
            </div>

            <div className="text-center">
              <UserAvatar
                photoUrl={currentPhoto?.url}
                userName={testUser.name}
                size="large"
              />
              <p className="mt-2 text-sm text-gray-600">Grande</p>
            </div>

            <div className="text-center">
              <UserAvatar
                photoUrl={currentPhoto?.url}
                userName={testUser.name}
                size="xlarge"
              />
              <p className="mt-2 text-sm text-gray-600">Extra Grande</p>
            </div>
          </div>
        </div>

        {/* Informações técnicas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Informações Técnicas</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Firebase Storage Bucket:</span>
              <span className="font-mono">
                gs://xcortes-e6f64.firebasestorage.app
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Formatos aceitos:</span>
              <span>JPEG, PNG, WebP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tamanho máximo:</span>
              <span>5MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Redimensionamento:</span>
              <span>Automático (800x800px máx)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Qualidade:</span>
              <span>80%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoTestPage;
