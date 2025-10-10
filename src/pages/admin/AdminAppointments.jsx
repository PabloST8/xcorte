import React, { useState } from "react";
import { Trash2, Calendar, Search } from "lucide-react";
import {
  useAllAppointments,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from "../../hooks/useAdmin";
import { BOOKING_STATUS, formatPrice } from "../../types/api.js";
import { useEnterprise } from "../../contexts/EnterpriseContext";
import { formatDateTableBR, formatTimeBR } from "../../utils/dateUtils";
import UserAvatar from "../../components/UserAvatar";
import { useStaff } from "../../hooks/useBarbershop";
import { useSearchWithDebounce } from "../../hooks/useDebounce";

// Função helper para formatar tipo de pagamento
const formatPaymentMethod = (appointment) => {
  // Tentar extrair do campo notes primeiro (formato: "pagamento: pix")
  let paymentMethod = null;

  // 1. Verificar campo notes
  if (appointment.notes) {
    const notesLower = appointment.notes.toLowerCase();

    // Padrão principal: "pagamento: pix"
    let paymentMatch = notesLower.match(/pagamento:\s*([^|]+)/);

    // Padrão alternativo: "pagamento pix" (sem dois pontos)
    if (!paymentMatch) {
      paymentMatch = notesLower.match(/pagamento\s+([^|]+)/);
    }

    if (paymentMatch) {
      paymentMethod = paymentMatch[1].trim();
    }
  }

  // 2. Fallback para campos diretos
  if (!paymentMethod) {
    paymentMethod =
      appointment.paymentMethod ||
      appointment.payment_method ||
      appointment.payment ||
      appointment.paymentType;
  }

  // 3. Último resort: tentar extrair qualquer menção a pagamento das notes
  if (!paymentMethod && appointment.notes) {
    const notesLower = appointment.notes.toLowerCase();
    if (notesLower.includes("pix")) paymentMethod = "pix";
    else if (notesLower.includes("dinheiro")) paymentMethod = "dinheiro";
    else if (notesLower.includes("cartão") || notesLower.includes("cartao"))
      paymentMethod = "cartão";
    else if (notesLower.includes("débito") || notesLower.includes("debito"))
      paymentMethod = "débito";
    else if (notesLower.includes("crédito") || notesLower.includes("credito"))
      paymentMethod = "crédito";
  }

  // Debug apenas quando não encontrar
  if (!paymentMethod) {
    console.log("⚠️ [Payment] No payment found for appointment:", {
      id: appointment.id,
      clientName: appointment.clientName,
      notes: appointment.notes,
      allFields: Object.keys(appointment).filter((key) =>
        key.toLowerCase().includes("pay")
      ),
    });
    return { text: "Não informado", color: "bg-gray-100 text-gray-800" };
  }

  const method = paymentMethod.toLowerCase();

  switch (method) {
    case "dinheiro":
    case "cash":
      return { text: "Dinheiro", color: "bg-green-100 text-green-800" };
    case "cartao":
    case "cartão":
    case "card":
    case "cartao_credito":
    case "cartão_crédito":
      return { text: "Cartão", color: "bg-blue-100 text-blue-800" };
    case "pix":
      return { text: "PIX", color: "bg-purple-100 text-purple-800" };
    case "debito":
    case "débito":
    case "debit":
      return { text: "Débito", color: "bg-orange-100 text-orange-800" };
    case "credito":
    case "crédito":
    case "credit":
      return { text: "Crédito", color: "bg-indigo-100 text-indigo-800" };
    default:
      return { text: paymentMethod, color: "bg-gray-100 text-gray-800" };
  }
};

export default function AdminAppointments() {
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffInfo, setStaffInfo] = useState({});

  // Hook para busca manual apenas (sem debounce automático)
  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    triggerSearch,
    isSearching,
  } = useSearchWithDebounce("");

  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();

  const {
    data: appointments,
    isLoading,
    error,
  } = useAllAppointments({
    date: dateFilter,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearchTerm, // Usar valor com debounce
  });

  // 🆕 Carregar dados dos funcionários
  const { data: staff = [] } = useStaff(currentEnterprise?.email);

  // 🆕 Carregar informações adicionais dos funcionários do Firestore
  React.useEffect(() => {
    const loadStaffInfo = async () => {
      if (!appointments?.length) return;

      try {
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../../services/firebase");

        const bookingIds = appointments.map((a) => a.id).filter(Boolean);
        if (bookingIds.length === 0) return;

        console.log(
          "🔍 [AdminAppointments] Buscando informações de funcionários para:",
          bookingIds
        );

        const staffInfoRef = collection(db, "bookingStaffInfo");
        const q = query(staffInfoRef, where("bookingId", "in", bookingIds));
        const snapshot = await getDocs(q);

        const staffData = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          staffData[data.bookingId] = data;
        });

        console.log(
          "✅ [AdminAppointments] Informações de funcionários carregadas:",
          staffData
        );
        setStaffInfo(staffData);
      } catch (error) {
        console.error(
          "❌ [AdminAppointments] Erro ao carregar informações de funcionários:",
          error
        );
      }
    };

    loadStaffInfo();
  }, [appointments]);

  const { mutate: updateStatus, isLoading: isUpdating } =
    useUpdateAppointmentStatus();

  const { mutate: deleteAppointment, isLoading: isDeleting } =
    useDeleteAppointment();

  // 🕒 NOVA LÓGICA: Processar agendamentos para atualizar status automaticamente E resolver nomes de funcionários
  const processedAppointments = React.useMemo(() => {
    if (!appointments) return [];

    const now = new Date();

    return appointments.map((appointment) => {
      const statusRaw = (appointment.status || "").toString().toLowerCase();

      // 🆕 LÓGICA DE RESOLUÇÃO DE NOME DO FUNCIONÁRIO MELHORADA
      let employeeName = "Funcionário"; // Default

      // 1. Tentar campos diretos do agendamento primeiro
      const directName =
        appointment.staffName ||
        appointment.employeeName ||
        appointment.staff_name ||
        appointment.employee_name ||
        appointment.staff?.name ||
        appointment.employee?.name;

      if (directName && directName !== "Funcionário") {
        employeeName = directName;
        console.log(
          "✅ [AdminAppointments] Nome via campos diretos:",
          directName
        );
      }

      // 2. Se não tem nome direto, tentar staffInfo do Firestore
      else if (staffInfo[appointment.id]) {
        const staffData = staffInfo[appointment.id];
        const firestoreName =
          staffData.staffName || staffData.employeeName || staffData.name;

        if (firestoreName) {
          employeeName = firestoreName;
          console.log("✅ [AdminAppointments] Nome via Firestore staffInfo:", {
            appointmentId: appointment.id,
            staffName: firestoreName,
            fullStaffData: staffData,
          });
        }
      }

      // 3. Se ainda não tem nome e temos dados de staff, tentar mapear por ID
      else if (staff?.length > 0) {
        const employeeId = appointment.employeeId || appointment.staffId;
        if (employeeId) {
          const foundStaff = staff.find(
            (s) => s.id === employeeId || s._id === employeeId
          );
          if (foundStaff) {
            employeeName = foundStaff.name;
            console.log(
              "✅ [AdminAppointments] Nome via lista de staff:",
              foundStaff.name
            );
          }
        }

        // Se ainda não tem nome e só há um funcionário, usar esse
        if (employeeName === "Funcionário" && staff.length === 1) {
          employeeName = staff[0].name;
          console.log(
            "✅ [AdminAppointments] Usando único funcionário:",
            staff[0].name
          );
        }
      }

      console.log("🔍 [AdminAppointments] Resultado final da resolução:", {
        appointmentId: appointment.id,
        finalEmployeeName: employeeName,
        hadDirectName: !!directName,
        hadStaffInfo: !!staffInfo[appointment.id],
        staffCount: staff?.length || 0,
        allTried: {
          direct: directName,
          firestore: staffInfo[appointment.id]?.staffName,
          staffListAvailable: staff?.length > 0,
        },
      });

      // Aplicar lógica de status automático (já existente)
      let processedStatus = appointment.status;
      if (
        statusRaw !== "cancelado" &&
        statusRaw !== "canceled" &&
        statusRaw !== "concluido" &&
        statusRaw !== "completed"
      ) {
        const dateStr = appointment.date || appointment.appointmentDate;
        const timeStr = appointment.startTime || appointment.time;

        if (dateStr && timeStr) {
          try {
            // Criar data/hora do agendamento
            let appointmentDate;

            // Processar data corretamente
            if (
              typeof dateStr === "string" &&
              dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
            ) {
              const [year, month, day] = dateStr.split("-");
              appointmentDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            } else {
              appointmentDate = new Date(dateStr);
            }

            // Processar horário
            const [hours, minutes] = timeStr
              .split(":")
              .map((num) => parseInt(num, 10));

            if (
              !isNaN(hours) &&
              !isNaN(minutes) &&
              appointmentDate &&
              !isNaN(appointmentDate.getTime())
            ) {
              appointmentDate.setHours(hours, minutes, 0, 0);

              // Se o agendamento foi há mais de 1 hora, marcar como concluído
              const oneHourAfterAppointment = new Date(
                appointmentDate.getTime() + 60 * 60 * 1000
              );

              if (now > oneHourAfterAppointment) {
                console.log(
                  "✅ [AdminAppointments] Agendamento automaticamente marcado como concluído:",
                  {
                    id: appointment.id,
                    client: appointment.clientName,
                    appointmentTime: appointmentDate.toLocaleString("pt-BR"),
                    currentTime: now.toLocaleString("pt-BR"),
                    originalStatus: statusRaw,
                  }
                );

                processedStatus = BOOKING_STATUS.CONCLUIDO;
              }
            }
          } catch (timeError) {
            console.warn(
              "⚠️ [AdminAppointments] Erro ao processar horário:",
              timeError
            );
          }
        }
      }

      return {
        ...appointment,
        status: processedStatus,
        resolvedEmployeeName: employeeName, // 🆕 Campo adicional com nome resolvido
        _debugInfo: {
          // 🆕 Info de debug para verificar dados
          originalStaffName: appointment.staffName,
          originalEmployeeName: appointment.employeeName,
          staffInfoExists: !!staffInfo[appointment.id],
          staffInfoName: staffInfo[appointment.id]?.staffName,
          finalResolved: employeeName,
        },
      };
    });
  }, [appointments, staffInfo, staff]);

  const handleDelete = async (appointmentId, clientName) => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar o agendamento de ${clientName}?`
      )
    ) {
      try {
        await deleteAppointment(appointmentId);
        // O hook já invalidará as queries automaticamente
      } catch (error) {
        alert("Erro ao deletar agendamento: " + error.message);
      }
    }
  };

  const handleStatusChange = (
    appointmentId,
    newStatus,
    appointmentInfo = {}
  ) => {
    console.log("🔄 handleStatusChange iniciado:", {
      appointmentId,
      newStatus,
      appointmentInfo,
      isUpdating,
    });

    // Verificar se já está atualizando
    if (isUpdating) {
      console.log("⏸️ Atualização já em andamento, ignorando...");
      return;
    }

    // Garantir que enviamos os status canônicos do backend (pt-BR)
    const mapOut = (s) => {
      switch (s) {
        case "scheduled":
          return BOOKING_STATUS.AGENDADO;
        case "confirmed":
          return BOOKING_STATUS.CONFIRMADO;
        case "completed":
          return BOOKING_STATUS.CONCLUIDO;
        case "cancelled":
        case "canceled":
          return BOOKING_STATUS.CANCELADO;
        default:
          return s; // já deve estar em pt-BR
      }
    };

    const mappedStatus = mapOut(newStatus);
    console.log("📝 Status mapeado:", {
      original: newStatus,
      mapped: mappedStatus,
      availableStatuses: Object.values(BOOKING_STATUS),
    });

    // Verificar se o status é válido
    if (!Object.values(BOOKING_STATUS).includes(mappedStatus)) {
      console.error("❌ Status inválido:", mappedStatus);
      alert("Status inválido: " + mappedStatus);
      return;
    }

    // Verificar se está tentando cancelar
    if (mappedStatus === BOOKING_STATUS.CANCELADO) {
      const clientName = appointmentInfo.clientName || "Cliente";
      const serviceDate = appointmentInfo.date || "";
      const serviceTime = appointmentInfo.time || "";

      const confirmMessage = `Tem certeza que deseja CANCELAR o agendamento?

Cliente: ${clientName}
Data: ${serviceDate}
Horário: ${serviceTime}

Esta ação não pode ser desfeita.`;

      if (window.confirm(confirmMessage)) {
        console.log("✅ Confirmação de cancelamento recebida");
        updateStatus({ appointmentId, status: mappedStatus });
      } else {
        console.log("❌ Cancelamento não confirmado");
      }
      // Se não confirmou, não faz nada (mantém o status atual)
      return;
    }

    // Para outros status, atualiza diretamente
    console.log("🚀 Executando updateStatus...");
    updateStatus({ appointmentId, status: mappedStatus });
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "scheduled":
      case "agendado":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
      case "confirmado":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "em_andamento":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "concluido":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
      case "canceled":
      case "cancelado":
        return "bg-red-100 text-red-800";
      case "no_show":
      case "faltou":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Status text formatting is handled inline via getStatusColor and normalized values

  if (isLoading || enterpriseLoading || !currentEnterprise) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600 text-center">
            Erro ao carregar agendamentos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os agendamentos da barbearia
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                console.log("🔄 Filtro de período alterado:", e.target.value);
                setDateFilter(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="today">Hoje</option>
              <option value="tomorrow">Amanhã</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                console.log("🔄 Filtro de status alterado:", e.target.value);
                setStatusFilter(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Nome do cliente..."
                value={searchTerm}
                onChange={(e) => {
                  console.log("🔍 Campo de busca alterado:", e.target.value);
                  setSearchTerm(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    console.log("⏎ Enter pressionado, disparando busca");
                    triggerSearch();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  console.log("🔍 Botão de busca clicado");
                  triggerSearch();
                }}
                disabled={isSearching}
                className={`px-3 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 ${
                  isSearching
                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
                title="Buscar (ou pressione Enter)"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            {debouncedSearchTerm && (
              <div className="text-sm text-gray-500 mt-1">
                Buscando por: "{debouncedSearchTerm}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedAppointments?.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserAvatar
                        photoUrl={appointment.clientPhotoUrl}
                        userName={appointment.clientName}
                        size="medium"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.clientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.clientPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {appointment.productName || appointment.serviceName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(appointment.productDuration || appointment.duration) ??
                        ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTableBR(appointment.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeBR(appointment.startTime || appointment.time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.resolvedEmployeeName || "Funcionário"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={
                        // Normalizar para os valores canônicos com debug
                        (() => {
                          const originalStatus = appointment.status;
                          const normalized = ((s) => {
                            switch ((s || "").toLowerCase()) {
                              case "scheduled":
                                return BOOKING_STATUS.AGENDADO;
                              case "confirmed":
                                return BOOKING_STATUS.CONFIRMADO;
                              case "completed":
                                return BOOKING_STATUS.CONCLUIDO;
                              case "cancelled":
                              case "canceled":
                                return BOOKING_STATUS.CANCELADO;
                              default:
                                return s;
                            }
                          })(originalStatus);

                          // Debug - só loga se não está normalizado corretamente
                          if (
                            !Object.values(BOOKING_STATUS).includes(normalized)
                          ) {
                            console.log("⚠️ Status não reconhecido:", {
                              originalStatus,
                              normalized,
                            });
                          }

                          return normalized || BOOKING_STATUS.AGENDADO;
                        })()
                      }
                      onChange={(e) => {
                        console.log("🔄 Select onChange disparado:", {
                          appointmentId: appointment.id,
                          newValue: e.target.value,
                          clientName: appointment.clientName,
                        });
                        handleStatusChange(appointment.id, e.target.value, {
                          clientName: appointment.clientName,
                          date: formatDateTableBR(
                            appointment.appointmentDate || appointment.date
                          ),
                          time: formatTimeBR(appointment.startTime),
                        });
                      }}
                      disabled={isUpdating}
                      className={`text-xs font-medium px-2 py-1 rounded-full border focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer ${getStatusColor(
                        appointment.status
                      )}`}
                      style={{
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 4px center",
                        backgroundSize: "16px",
                        paddingRight: "24px",
                      }}
                    >
                      <option value={BOOKING_STATUS.AGENDADO}>Agendado</option>
                      <option value={BOOKING_STATUS.CONFIRMADO}>
                        Confirmado
                      </option>
                      <option value={BOOKING_STATUS.CONCLUIDO}>
                        Concluído
                      </option>
                      <option value={BOOKING_STATUS.CANCELADO}>
                        Cancelado
                      </option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(
                      Number(appointment.productPrice ?? appointment.price ?? 0)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {(() => {
                      const payment = formatPaymentMethod(appointment);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.color}`}
                        >
                          {payment.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() =>
                          handleDelete(appointment.id, appointment.clientName)
                        }
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                        title="Deletar agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!appointments || appointments.length === 0) && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum agendamento encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
