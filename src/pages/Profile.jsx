import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import ModernPhotoUpload from "../components/ModernPhotoUpload";
import { userPhotoProfileService } from "../services/userPhotoProfileService";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser, patchUser } = useAuth();

  /**
   * Manipula a atualização da foto do usuário
   */
  const handlePhotoUpdate = async (photoData) => {
    try {
      // Sempre derive o ID como telefone numérico; fallback para email
      const phoneDigits = String(user?.phone || user?.id || "").replace(
        /\D/g,
        ""
      );
      const userId = phoneDigits || user?.email;
      if (!userId) return;

      console.log("📸 handlePhotoUpdate - userId:", userId, "user:", user);

      if (photoData) {
        // 1) Atualiza localmente imediatamente (melhor UX e persiste no cookie)
        const clientVersion = Date.now();
        let clientVersioned = photoData.url;
        try {
          const u = new URL(photoData.url);
          u.searchParams.set("v", String(clientVersion));
          clientVersioned = u.toString();
        } catch {
          clientVersioned = `${photoData.url}${
            photoData.url.includes("?") ? "&" : "?"
          }v=${clientVersion}`;
        }
        console.log("📸 Atualizando foto localmente:", clientVersioned);
        (patchUser || updateUser)?.({
          photoURL: clientVersioned,
          photoPath: photoData.path,
          photoVersion: clientVersion,
        });

        // 2) Persiste no Firestore em segundo plano e revalida com versão do servidor
        console.log("📸 Salvando metadados no Firestore com userId:", userId);
        userPhotoProfileService
          .setUserPhoto(userId, photoData)
          .then(({ photoURL, photoPath, photoVersion }) => {
            let versioned = photoURL;
            try {
              const u = new URL(photoURL);
              u.searchParams.set("v", String(photoVersion));
              versioned = u.toString();
            } catch {
              versioned = `${photoURL}${
                photoURL.includes("?") ? "&" : "?"
              }v=${photoVersion}`;
            }
            console.log("📸 Metadados salvos no Firestore, sincronizando:", {
              versioned,
              photoPath,
              photoVersion,
              userId,
            });
            (patchUser || updateUser)?.({
              photoURL: versioned,
              photoPath,
              photoVersion,
            });
          })
          .catch((err) => {
            console.error("📸 Erro ao salvar metadados no Firestore:", err);
            // manter estado local se Firestore falhar
          });
      } else {
        // Remoção: zera local primeiro e tenta limpar no Firestore em segundo plano
        console.log("📸 Removendo foto");
        (patchUser || updateUser)?.({
          photoURL: null,
          photoPath: null,
          photoVersion: null,
        });
        userPhotoProfileService.clearUserPhoto(userId).catch(() => {});
      }
    } catch (err) {
      console.error("📸 Erro no handlePhotoUpdate:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();

      // Limpeza adicional para garantir
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      });

      // Remoção de storage local desabilitada por política: não usar localStorage/sessionStorage

      // Aguardar um pouco para garantir que o estado seja limpo
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Usar URL completa para funcionar tanto em localhost quanto em produção
      // Adicionar timestamp para forçar quebra de cache
      const timestamp = Date.now();
      const loginUrl = `${window.location.origin}/auth/login?t=${timestamp}`;

      // Forçar navegação usando window.location para contornar possíveis problemas de cache
      window.location.href = loginUrl;
    } catch {
      // Mesmo com erro, redirecionar para login
      const timestamp = Date.now();
      const loginUrl = `${window.location.origin}/auth/login?t=${timestamp}`;
      window.location.href = loginUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Meu Perfil</h1>
        <div className="w-10" />{" "}
        {/* Spacer para manter o título centralizado */}
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Foto de perfil centralizada */}
          <div className="flex flex-col items-center mb-6">
            {/** Deriva o ID do usuário como telefone numérico (preferência do sistema) **/}
            {(() => {
              const phoneDigits = String(user?.phone || user?.id || "").replace(
                /\D/g,
                ""
              );
              const userIdForPhoto = phoneDigits || user?.email || "user";
              console.log("📸 Profile render - user photo data:", {
                userIdForPhoto,
                currentPhotoURL: user?.photoURL,
                photoVersion: user?.photoVersion,
                photoPath: user?.photoPath,
              });
              return (
                <div className="flex flex-col items-center">
                  <ModernPhotoUpload
                    userId={userIdForPhoto}
                    currentPhotoURL={user?.photoURL}
                    onPhotoUpdated={handlePhotoUpdate}
                    className="mb-2"
                    showActions={false}
                    showInfo={false}
                  />
                  <p className="text-xs text-gray-500">
                    clique para trocar foto
                  </p>
                </div>
              );
            })()}
          </div>

          {/* User Name */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.name || "Usuário"}
            </h2>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {user?.phone || "(11) 99999-9999"}
              </span>
            </div>
          </div>
        </div>

        {/* Seção de testes removida */}

        {/* Quick Actions and Settings removed as requested */}

        {/* Logout Button */}
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
