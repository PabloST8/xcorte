import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCancelAppointment } from "../hooks/useBarbershop";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import LoadingSpinner from "../components/LoadingSpinner";
import { USE_REMOTE_API } from "../config";
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";
import { formatDateBR, formatTimeBR } from "../utils/dateUtils";

export default function MyAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [firestoreAppointments, setFirestoreAppointments] = useState(null);
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState(null);

  console.log("🔍 [MyAppointments] Componente renderizado com:", {
    user,
    userPhone: user?.phone,
    userId: user?.id,
    userEmail: user?.email,
    currentEnterprise: currentEnterprise?.email,
    firestoreAppointments: firestoreAppointments?.length || 0,
  });

  // Função para recarregar agendamentos do Firestore
  const refetchFirestoreAppointments = useCallback(() => {
    if (currentEnterprise?.email && user?.id) {
      console.log("🔍 [MyAppointments] Carregando agendamentos do Firestore:", {
        enterpriseEmail: currentEnterprise.email,
        userId: user.id,
        userPhone: user.phone,
        userEmail: user.email,
      });

      setFirestoreLoading(true);
      setFirestoreError(null);

      enterpriseBookingFirestoreService
        .list(currentEnterprise.email, {})
        .then((appointments) => {
          console.log(
            "📊 [MyAppointments] Agendamentos recebidos do Firestore:",
            appointments
          );

          if (Array.isArray(appointments)) {
            // Filtrar agendamentos do usuário logado
            const userAppointments = appointments.filter((appointment) => {
              const matchPhone =
                appointment.clientPhone === user.phone ||
                appointment.clientPhone === user.id ||
                appointment.clientPhone?.replace(/\D/g, "") ===
                  user.phone?.replace(/\D/g, "");

              const matchEmail =
                user.email &&
                appointment.clientEmail &&
                appointment.clientEmail.toLowerCase() ===
                  user.email.toLowerCase();

              const match = matchPhone || matchEmail;

              console.log("🔍 [MyAppointments] Verificando agendamento:", {
                appointmentId: appointment.id,
                clientPhone: appointment.clientPhone,
                clientEmail: appointment.clientEmail,
                userPhone: user.phone,
                userEmail: user.email,
                matchPhone,
                matchEmail,
                finalMatch: match,
              });

              return match;
            });

            console.log(
              "✅ [MyAppointments] Agendamentos filtrados do usuário:",
              userAppointments
            );
            setFirestoreAppointments(userAppointments);
          } else {
            console.log(
              "⚠️ [MyAppointments] Resposta não é array:",
              appointments
            );
            setFirestoreAppointments([]);
          }
        })
        .catch((error) => {
          console.error(
            "❌ [MyAppointments] Erro ao carregar agendamentos:",
            error
          );
          setFirestoreError("Erro ao carregar agendamentos");
          setFirestoreAppointments([]);
        })
        .finally(() => {
          setFirestoreLoading(false);
        });
    } else {
      console.log(
        "⚠️ [MyAppointments] Dados insuficientes para carregar agendamentos:",
        {
          enterpriseEmail: currentEnterprise?.email,
          userId: user?.id,
        }
      );
    }
  }, [currentEnterprise?.email, user?.id, user?.phone, user?.email]);

  // Buscar agendamentos do Firestore (fonte principal)
  useEffect(() => {
    console.log("🔍 Estado de autenticação e empresa:", {
      user: user
        ? {
            id: user.id,
            uid: user.uid,
            email: user.email,
            phoneNumber: user.phoneNumber,
            phone: user.phone,
          }
        : null,
      currentEnterprise: currentEnterprise
        ? {
            email: currentEnterprise.email,
            name: currentEnterprise.name,
          }
        : null,
    });

    if (currentEnterprise?.email && (user?.id || user?.uid)) {
      setFirestoreLoading(true);
      setFirestoreError(null);

      console.log("🔍 Buscando agendamentos do Firestore para:", {
        enterpriseEmail: currentEnterprise.email,
        userEmail: user.email,
        userId: user.id || user.uid,
        userPhone: user.phoneNumber || user.phone,
        userPhoneAlt: user.phone,
        userObject: user,
      });

      // Já implementado na função refetchFirestoreAppointments acima
      refetchFirestoreAppointments();
    }
  }, [currentEnterprise, user, refetchFirestoreAppointments]);

  // Hook para cancelar agendamento
  const cancelAppointmentMutation = useCancelAppointment();

  // Usar Firestore como fonte principal (sem fallback para mock)
  const appointments = firestoreAppointments || [];

  // Estados de loading e error do Firestore
  const isLoadingCombined = firestoreLoading;
  const errorCombined = firestoreError;

  // Função para formatar data (usando utilitário centralizado)
  const formatDate = formatDateBR;

  // Função para formatar hora (usando utilitário centralizado)
  const formatTime = formatTimeBR;

  // Função para determinar status de um agendamento
  const getAppointmentStatus = (appointment) => {
    const now = new Date();
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);

    if (appointment.status === "cancelled") {
      return {
        label: "Cancelado",
        color: "text-red-600 bg-red-50",
        canCancel: false,
      };
    }

    if (appointment.status === "completed") {
      return {
        label: "Concluído",
        color: "text-green-600 bg-green-50",
        canCancel: false,
      };
    }

    if (appointmentDate < now) {
      return {
        label: "Expirado",
        color: "text-gray-600 bg-gray-50",
        canCancel: false,
      };
    }

    return {
      label: "Agendado",
      color: "text-blue-600 bg-blue-50",
      canCancel: true,
    };
  };

  // Função para abrir modal de cancelamento (desabilitada para Firestore por enquanto)
  // const handleCancelClick = (appointment) => {
  //   setSelectedAppointment(appointment);
  //   setShowCancelModal(true);
  // };

  // Função para confirmar cancelamento
  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);

    try {
      await cancelAppointmentMutation.mutateAsync(selectedAppointment.id);
      setShowCancelModal(false);
      setSelectedAppointment(null);
      refetchFirestoreAppointments(); // Atualizar lista
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert("Erro ao cancelar agendamento. Tente novamente.");
    } finally {
      setCancellingId(null);
    }
  };

  // Loading state
  if (isLoadingCombined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (errorCombined) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar agendamentos
            </h2>
            <p className="text-red-600 mb-4">
              {errorCombined?.message || "Ocorreu um erro inesperado"}
            </p>
            <button
              onClick={() => refetchFirestoreAppointments()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(getEnterpriseUrl("/"))}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Meus Agendamentos
            </h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {/* Aviso sobre fonte dos dados */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-800 text-sm">
            📋 <strong>Firestore Database:</strong>{" "}
            {firestoreAppointments
              ? `${firestoreAppointments.length} agendamento(s) encontrado(s) para seu perfil.`
              : firestoreLoading
              ? "Carregando agendamentos..."
              : "Nenhum agendamento encontrado."}
          </p>
        </div>

        {!appointments || appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum agendamento encontrado
            </h2>
            <p className="text-gray-500 mb-6">
              Você ainda não possui agendamentos.
            </p>
            <button
              onClick={() => navigate(getEnterpriseUrl("/"))}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Fazer agendamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const status = getAppointmentStatus(appointment);

              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {status.canCancel && (
                      <div className="text-sm">
                        {firestoreAppointments ? (
                          <span className="text-gray-500">
                            (Cancelamento via Firestore não implementado)
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            (Demo - cancelamento desabilitado)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-2">
                    {/* Service */}
                    <div className="flex items-center text-gray-800">
                      <div className="font-semibold">
                        {appointment.serviceName ||
                          appointment.service?.name ||
                          "Serviço"}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {formatDate(appointment.date)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {formatTime(appointment.time)}
                      </span>
                    </div>

                    {/* Staff */}
                    {appointment.staffName && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span className="text-sm">{appointment.staffName}</span>
                      </div>
                    )}

                    {/* Price */}
                    {appointment.price && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="font-semibold text-gray-800">
                          R$ {(appointment.price / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Cancelar Agendamento
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Tem certeza que deseja cancelar este agendamento?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="font-medium text-gray-800">
                  {selectedAppointment.serviceName || "Serviço"}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(selectedAppointment.date)} às{" "}
                  {formatTime(selectedAppointment.time)}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200"
              >
                Manter agendamento
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId === selectedAppointment.id}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingId === selectedAppointment.id
                  ? "Cancelando..."
                  : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
