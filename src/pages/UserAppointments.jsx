import React, { useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Scissors,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useUserAppointments } from "../hooks/useBarbershop";
import { useAppointmentsRefresh } from "../hooks/useAppointmentsRefresh";
import { bookingService } from "../services/bookingService";
import { formatDateLongBR } from "../utils/dateUtils";

export default function UserAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const { forceRefreshAppointments } = useAppointmentsRefresh();
  const {
    data: appointments,
    isLoading,
    refetch,
  } = useUserAppointments({
    enterpriseEmail: currentEnterprise?.email,
    clientEmail: user?.email,
    clientName: user?.name,
    clientPhone: user?.phone || user?.phoneNumber,
    // Duplicates as fallback-friendly aliases the service already understands
    userEmail: user?.email,
    userName: user?.name,
    userPhone: user?.phone || user?.phoneNumber,
  });

  // Forçar refetch quando a página ganha foco para garantir dados atualizados
  React.useEffect(() => {
    const handleFocus = () => {
      if (refetch) {
        refetch();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);
  const [fallback, setFallback] = React.useState([]);

  React.useEffect(() => {
    if (isLoading) return;
    if ((appointments || []).length > 0) return;
    if (!currentEnterprise?.email) return;
    const hasIdentifier = !!(
      user?.email ||
      user?.name ||
      user?.phone ||
      user?.phoneNumber
    );
    if (!hasIdentifier) return;
    let cancelled = false;
    (async () => {
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
        const map = new Map();
        [...unwrap(allRaw), ...unwrap(todayRaw)].forEach((b) => {
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
          return (
            (uEmail && bEmail === uEmail) ||
            (uName && bName === uName) ||
            (uPhone && bPhone === uPhone)
          );
        });
        if (!cancelled) setFallback(merged);
      } catch {
        if (!cancelled) setFallback([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    appointments,
    isLoading,
    currentEnterprise?.email,
    user?.email,
    user?.name,
    user?.phone,
    user?.phoneNumber,
  ]);

  const normalized = useMemo(() => {
    const base = appointments?.length ? appointments : fallback;
    return (base || [])
      .map((a) => {
        const dateStr = a.date || a.startDate || a.createdAt || "";
        let dateObj;
        try {
          dateObj = dateStr ? new Date(dateStr) : null;
        } catch {
          dateObj = null;
        }
        const productName =
          a.productName ||
          a.serviceName ||
          a.service ||
          a.product?.name ||
          "Serviço";
        const employeeName =
          a.employeeName ||
          a.staffName ||
          a.barberName ||
          a.employee?.name ||
          a.staff?.name ||
          "Profissional";
        const start = a.startTime || a.time || a.start || "";
        const end = a.endTime || a.end || "";
        const statusRaw = (a.status || "").toString().toLowerCase();
        const statusMap = {
          agendado: "Agendado",
          confirmado: "Confirmado",
          pending: "Agendado",
          cancelado: "Cancelado",
          canceled: "Cancelado",
          concluido: "Concluído",
          completed: "Concluído",
        };
        const status =
          statusMap[statusRaw] || (statusRaw ? statusRaw : "Agendado");
        return {
          id: a.id || a._id || `${productName}-${dateStr}-${start}`,
          productName,
          employeeName,
          dateObj,
          dateDisplay: dateObj
            ? formatDateLongBR(dateObj)
            : formatDateLongBR(dateStr),
          start,
          end,
          status,
        };
      })
      .sort(
        (a, b) => (b.dateObj?.getTime() || 0) - (a.dateObj?.getTime() || 0)
      );
  }, [appointments, fallback]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-4 bg-white shadow-sm border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          Meus Agendamentos
        </h1>
        <button
          onClick={() => {
            console.log(
              "🔄 Forçando refetch dos agendamentos na página UserAppointments"
            );
            forceRefreshAppointments();
            refetch();
          }}
          className="text-gray-600 text-sm font-medium hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "..." : "Atualizar"}
        </button>
      </div>
      <div className="px-6 pb-24 pt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : normalized.length ? (
          <div className="space-y-3">
            {normalized.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
                  <Scissors className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {appt.productName}
                  </p>
                  <p className="text-xs text-gray-500 truncate flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {appt.start || "--:--"}
                    {appt.end && <span className="mx-1">•</span>}
                    {appt.end && appt.end}
                    <span className="mx-1">•</span>
                    {appt.employeeName}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <span className="block text-sm font-medium text-gray-900">
                    {appt.dateDisplay}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum agendamento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Agendado: "bg-blue-50 text-blue-600 border-blue-200",
    Confirmado: "bg-green-50 text-green-600 border-green-200",
    Cancelado: "bg-red-50 text-red-600 border-red-200",
    Concluído: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const cls = map[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${cls}`}
    >
      {status}
    </span>
  );
}
