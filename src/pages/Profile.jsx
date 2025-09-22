import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Phone, Calendar, Star, Edit, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useUserAppointments } from "../hooks/useBarbershop";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { bookingService } from "../services/bookingService";
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";
import ModernPhotoUpload from "../components/ModernPhotoUpload";
import { userPhotoProfileService } from "../services/userPhotoProfileService";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser, patchUser } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [isEditing, setIsEditing] = useState(false);
  const [fallbackAppointments, setFallbackAppointments] = useState([]);
  const [loadingFallback, setLoadingFallback] = useState(false);

  // Debug logs removed

  const { data: appointments, isLoading } = useUserAppointments({
    enterpriseEmail: currentEnterprise?.email,
    clientEmail: user?.email,
    clientName: user?.name,
    clientPhone: user?.phone || user?.phoneNumber,
    userEmail: user?.email,
    userName: user?.name,
    userPhone: user?.phone || user?.phoneNumber,
  });

  // Debug logs removed

  const { getEnterpriseUrl } = useEnterpriseNavigation();

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

  // Fallback para carregar agendamentos quando a API principal não funciona
  React.useEffect(() => {
    if (isLoading) {
      return;
    }
    if ((appointments || []).length > 0) {
      return;
    }
    if (!currentEnterprise?.email) {
      return;
    }
    const hasIdentifier = !!(
      user?.email ||
      user?.name ||
      user?.phone ||
      user?.phoneNumber
    );
    if (!hasIdentifier) {
      return;
    }
    let cancelled = false;
    setLoadingFallback(true);
    (async () => {
      try {
        // Tentar buscar do Firestore primeiro - BUSCAR EM TODAS AS EMPRESAS
        let firestoreAppointments = [];
        try {
          // Lista de todas as empresas conhecidas
          const allEnterprises = [
            "empresaadmin@xcortes.com",
            "pablofafstar@gmail.com",
            "admin@teste.com",
          ];

          // Buscar em todas as empresas
          const allPromises = allEnterprises.map(async (enterpriseEmail) => {
            try {
              const bookings = await enterpriseBookingFirestoreService.list(
                enterpriseEmail
              );
              return bookings.map((b) => ({
                ...b,
                sourceEnterprise: enterpriseEmail,
              }));
            } catch {
              return [];
            }
          });

          const allResults = await Promise.all(allPromises);
          firestoreAppointments = allResults.flat();
        } catch {
          // Silenciar erros de fallback do Firestore
        }

        // Fallback para o bookingService (usado na UserAppointments) - APENAS SE A API ESTIVER FUNCIONANDO
        let apiAppointments = [];
        try {
          const unwrap = (val) =>
            Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];

          const allRaw = await bookingService.getBookings(
            currentEnterprise.email
          );

          const today = new Date().toISOString().split("T")[0];
          const todayRaw = await bookingService.getBookings(
            currentEnterprise.email,
            today
          );

          apiAppointments = [...unwrap(allRaw), ...unwrap(todayRaw)];
        } catch {
          // Silenciar erros da API no fallback
          // Não é um erro crítico, apenas seguimos sem dados da API
        }

        const map = new Map();

        // Adicionar agendamentos do Firestore
        firestoreAppointments.forEach((b) => {
          const key = `${b.id || b._id || b.date}-${b.startTime || b.start}`;
          if (!map.has(key)) map.set(key, b);
        });

        // Adicionar agendamentos da API (se houver)
        apiAppointments.forEach((b) => {
          const key = `${b.id || b._id || b.date}-${b.startTime || b.start}`;
          if (!map.has(key)) map.set(key, b);
        });

        const uEmail = user?.email || "";
        const uName = user?.name || "";
        const uPhone = user?.phone || user?.phoneNumber || "";

        const merged = Array.from(map.values()).filter((b) => {
          const bEmail = b.clientEmail || b.email || "";
          const bName = b.clientName || b.name || "";
          const bPhone = b.clientPhone || b.phone || "";

          const emailMatch = uEmail && bEmail === uEmail;
          const nameMatch = uName && bName === uName;
          const phoneMatch = uPhone && bPhone === uPhone;

          return emailMatch || nameMatch || phoneMatch;
        });
        if (!cancelled) setFallbackAppointments(merged);
      } catch {
        // Silenciar erros de fallback
        if (!cancelled) setFallbackAppointments([]);
      } finally {
        if (!cancelled) setLoadingFallback(false);
      }
    })();
    return () => {
      cancelled = true;
      setLoadingFallback(false);
    };
  }, [
    appointments,
    isLoading,
    currentEnterprise?.email,
    currentEnterprise?.name,
    user?.email,
    user?.name,
    user?.phone,
    user?.phoneNumber,
  ]);

  // Usar agendamentos da API ou fallback
  const allAppointments =
    appointments?.length > 0 ? appointments : fallbackAppointments;

  // Ordenar agendamentos por data (mais recentes primeiro)
  const sortedAppointments = allAppointments?.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime || a.time || "00:00"}`);
    const dateB = new Date(`${b.date} ${b.startTime || b.time || "00:00"}`);
    return dateB - dateA; // ordem decrescente (mais recente primeiro)
  });

  const recentAppointments = sortedAppointments?.slice(0, 3) || [];

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
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            {/* Foto de perfil */}
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
                <ModernPhotoUpload
                  userId={userIdForPhoto}
                  currentPhotoURL={user?.photoURL}
                  onPhotoUpdated={handlePhotoUpdate}
                  className="mb-4"
                  showActions={false}
                  showInfo={false}
                />
              );
            })()}

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.name || "Usuário"}
              </h2>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">
                  Cliente desde{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).getFullYear()
                    : "2024"}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {user?.phone || "(11) 99999-9999"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {allAppointments?.length || 0} agendamentos realizados
              </span>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agendamentos Recentes
          </h3>

          {isLoading || loadingFallback ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment, index) => {
                // Formatação da data
                const formatDate = (dateStr) => {
                  if (!dateStr) return "Data não informada";
                  try {
                    const [year, month, day] = dateStr.split("-");
                    return `${day}/${month}/${year}`;
                  } catch {
                    return dateStr;
                  }
                };

                // Formatação do status
                const formatStatus = (status) => {
                  const statusMap = {
                    scheduled: "Agendado",
                    confirmed: "Confirmado",
                    in_progress: "Em andamento",
                    completed: "Concluído",
                    cancelled: "Cancelado",
                    no_show: "Não compareceu",
                  };
                  return statusMap[status] || status || "Agendado";
                };

                return (
                  <div
                    key={appointment.id || appointment._id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.serviceName ||
                          appointment.productName ||
                          appointment.service ||
                          "Serviço"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.staffName ||
                          appointment.employeeName ||
                          appointment.professional ||
                          "Profissional"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.date)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointment.startTime ||
                          appointment.time ||
                          "Horário não informado"}
                      </p>
                      <p className="text-xs text-green-600">
                        {formatStatus(appointment.status)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhum agendamento ainda</p>
              <p className="text-sm text-gray-500 mb-4">
                Que tal agendar seu primeiro corte?
              </p>
              <Link
                to={getEnterpriseUrl(
                  "service-details?category=Todos&title=Serviços"
                )}
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Fazer Primeiro Agendamento
              </Link>
            </div>
          )}

          {recentAppointments.length > 0 && (
            <Link
              to={getEnterpriseUrl(
                "service-details?category=Todos&title=Serviços"
              )}
              className="block text-center mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              Fazer Novo Agendamento
            </Link>
          )}
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
