import React, { useState } from "react";
import { Trash2, Calendar } from "lucide-react";
import {
  useAllAppointments,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from "../../hooks/useAdmin";
import { BOOKING_STATUS, formatPrice } from "../../types/api.js";
import { useEnterprise } from "../../contexts/EnterpriseContext";
import { formatDateTableBR, formatTimeBR } from "../../utils/dateUtils";

export default function AdminAppointments() {
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: appointments,
    isLoading,
    error,
  } = useAllAppointments({
    date: dateFilter,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm,
  });

  const { mutate: updateStatus, isLoading: isUpdating } =
    useUpdateAppointmentStatus();

  const { mutate: deleteAppointment, isLoading: isDeleting } =
    useDeleteAppointment();

  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();

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

  const handleStatusChange = (appointmentId, newStatus) => {
    console.log("🔄 Alterando status:", { appointmentId, newStatus });

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
    });

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
              onChange={(e) => setDateFilter(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments?.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {appointment.clientName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
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
                    {appointment.staffName ||
                      appointment.employeeName ||
                      appointment.staff_name ||
                      appointment.employee_name ||
                      appointment.staff?.name ||
                      appointment.employee?.name ||
                      appointment.employeeEmail ||
                      appointment.employee_email ||
                      appointment.staffEmail ||
                      appointment.staff_email ||
                      appointment.employeeId ||
                      appointment.employee_id ||
                      appointment.staffId ||
                      appointment.staff_id ||
                      appointment.funcionarioNome ||
                      appointment.funcionarioEmail ||
                      "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={
                        // Normalizar para os valores canônicos
                        ((s) => {
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
                        })(appointment.status)
                      }
                      onChange={(e) =>
                        handleStatusChange(appointment.id, e.target.value)
                      }
                      disabled={isUpdating}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-amber-500 ${getStatusColor(
                        appointment.status
                      )}`}
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
