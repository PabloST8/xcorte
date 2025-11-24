import React, { useEffect, useState } from "react";
import { Users, Calendar, DollarSign, Clock, Camera } from "lucide-react";
import { useDashboardStats } from "../../hooks/useAdmin";
import { useEnterprise } from "../../contexts/EnterpriseContext";
import { debugFirestoreData } from "../../utils/debugFirestore";
import { formatDateBR } from "../../utils/dateUtils";
import { enterprisePhotoServiceNoAuth } from "../../services/enterprisePhotoServiceNoAuth";
import { firestoreEnterpriseService } from "../../services/firestoreEnterpriseService";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { currentEnterprise, updateCurrentEnterprise, loadEnterprises } =
    useEnterprise();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Função para lidar com upload da foto da barbearia
  const handleUploadPhoto = async () => {
    if (!currentEnterprise) {
      alert("Nenhuma empresa selecionada");
      return;
    }

    // Debug para verificar a estrutura da empresa
    console.log("🔍 Empresa atual para upload:", {
      currentEnterprise,
      id: currentEnterprise.id,
      email: currentEnterprise.email,
      hasId: !!currentEnterprise.id,
      hasEmail: !!currentEnterprise.email,
    });

    // Usar email como ID se id não estiver disponível
    const enterpriseId = currentEnterprise.id || currentEnterprise.email;

    if (!enterpriseId) {
      alert("Erro: ID da empresa não encontrado");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploadingPhoto(true);

      try {
        console.log("📤 Fazendo upload com enterpriseId:", enterpriseId);

        // Usar o serviço SEM autenticação anônima (temporário)
        const result = await enterprisePhotoServiceNoAuth.uploadPhoto(
          enterpriseId,
          file
        );

        if (result.success) {
          console.log("✅ Upload realizado com sucesso:", result);

          // Método 1: Atualizar empresa no contexto com a nova foto
          updateCurrentEnterprise({
            photoURL: result.photoURL,
            photoPath: result.photoPath,
            photoUpdatedAt: new Date(),
          });

          // Método 2: Recarregar empresa do Firestore para garantir sincronização
          try {
            const updatedEnterprise =
              await firestoreEnterpriseService.getEnterpriseByEmail(
                currentEnterprise.email
              );
            if (updatedEnterprise) {
              console.log(
                "🔄 Empresa recarregada do Firestore:",
                updatedEnterprise
              );
              updateCurrentEnterprise(updatedEnterprise);
            }
          } catch (reloadError) {
            console.warn("⚠️ Erro ao recarregar empresa:", reloadError);
          }

          alert(
            `✅ Foto da barbearia "${currentEnterprise.name}" atualizada com sucesso!`
          );
        }
      } catch (error) {
        console.error("❌ Erro ao fazer upload da foto:", error);
        alert(`Erro ao fazer upload da foto: ${error.message}`);
      } finally {
        setUploadingPhoto(false);
      }
    };

    input.click();
  };

  // Debug dos dados do Firestore
  useEffect(() => {
    if (currentEnterprise?.email) {
      debugFirestoreData(currentEnterprise.email);
    }
  }, [currentEnterprise?.email]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600 text-center">
            Erro ao carregar dados do dashboard
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${((stats?.monthlyRevenue || 0) / 100)
        .toFixed(2)
        .replace(".", ",")}`,
      icon: DollarSign,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Clientes",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              {currentEnterprise
                ? `Painel administrativo - ${currentEnterprise.name}`
                : "Bem-vindo ao painel administrativo da barbearia"}
            </p>
          </div>

          {/* Botão de Upload da Foto da Barbearia */}
          <button
            onClick={handleUploadPhoto}
            disabled={uploadingPhoto}
            className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">
              {uploadingPhoto ? "Enviando..." : "Foto da Barbearia"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} flex-shrink-0 ml-3`}
              >
                <stat.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Próximos Agendamentos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Próximos Agendamentos
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {stats?.upcomingAppointments?.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2 sm:mt-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {appointment.clientName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {appointment.productName}
                        </p>
                        {appointment.status && (
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                              appointment.status === "CONFIRMADO"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "AGENDADO"
                                ? "bg-blue-100 text-blue-800"
                                : appointment.status === "CANCELADO"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {appointment.startTime}
                      </p>
                      {appointment.date && (
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDateBR(appointment.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600">
                  Nenhum agendamento para hoje
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
