import React, { useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Scissors,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useUserAppointments, useStaff } from "../hooks/useBarbershop";
import { useAppointmentsRefresh } from "../hooks/useAppointmentsRefresh";
import { bookingService } from "../services/bookingService";
import { formatDateLongBR } from "../utils/dateUtils";

export default function MyAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const { data: staff = [] } = useStaff(currentEnterprise?.email);
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
  const [staffInfo, setStaffInfo] = React.useState({});

  // Load staff info from bookingStaffInfo collection
  React.useEffect(() => {
    const loadStaffInfo = async () => {
      if (!fallback.length) return;

      try {
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../services/firebase");

        const bookingIds = fallback.map((a) => a.id).filter(Boolean);
        if (bookingIds.length === 0) return;

        console.log(
          "🔍 Buscando informações de funcionários para:",
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

        console.log("✅ Informações de funcionários carregadas:", staffData);
        setStaffInfo(staffData);
      } catch (error) {
        console.error(
          "❌ Erro ao carregar informações de funcionários:",
          error
        );
      }
    };

    loadStaffInfo();
  }, [fallback]);

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
        console.log("🔍 Fazendo fallback search via bookingApiService...");
        const allRaw = await bookingService.getBookings(
          currentEnterprise.email
        );
        console.log("📊 Todos os agendamentos encontrados:", allRaw);

        const today = new Date().toISOString().split("T")[0];
        const todayRaw = await bookingService.getBookings(
          currentEnterprise.email,
          today
        );
        console.log("📊 Agendamentos de hoje:", todayRaw);

        const unwrap = (val) =>
          Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
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
        console.log("📊 Agendamentos filtrados para o usuário:", merged);
        if (!cancelled) setFallback(merged);
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
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

    console.log("🔍 Debug MyAppointments:", {
      appointmentsLength: appointments?.length || 0,
      fallbackLength: fallback?.length || 0,
      staffLength: staff?.length || 0,
      baseData: base,
      staffData: staff,
    });

    return (base || [])
      .map((a) => {
        console.log("📋 Processando agendamento:", a);

        const dateStr = a.date || a.startDate || a.createdAt || "";
        let dateObj;
        try {
          if (dateStr) {
            // Fix timezone issue: handle YYYY-MM-DD format explicitly to avoid UTC interpretation
            if (
              typeof dateStr === "string" &&
              dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
            ) {
              const [year, month, day] = dateStr.split("-");
              dateObj = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
              console.log("📅 Data processada (formato YYYY-MM-DD):", {
                original: dateStr,
                processed: dateObj,
                formatted: dateObj.toLocaleDateString("pt-BR"),
              });
            } else {
              dateObj = new Date(dateStr);
              console.log("📅 Data processada (formato genérico):", {
                original: dateStr,
                processed: dateObj,
                formatted: dateObj.toLocaleDateString("pt-BR"),
              });
            }
          } else {
            dateObj = null;
          }
        } catch (error) {
          console.warn("❌ Erro ao processar data:", error, dateStr);
          dateObj = null;
        }
        const productName =
          a.productName ||
          a.serviceName ||
          a.service ||
          a.product?.name ||
          "Serviço";

        // Try multiple strategies to get employee name
        let employeeName =
          a.employeeName ||
          a.staffName ||
          a.barberName ||
          a.employee?.name ||
          a.staff?.name;

        // 🆕 NEW: Try to get staff info from bookingStaffInfo collection
        if (!employeeName && staffInfo[a.id]) {
          employeeName = staffInfo[a.id].staffName;
          console.log("✅ Nome encontrado via bookingStaffInfo:", employeeName);
        }

        console.log("👤 Tentativas de resolução de nome:", {
          employeeName,
          employeeId: a.employeeId,
          staffId: a.staffId,
          staffCount: staff?.length || 0,
          staffInfoFound: !!staffInfo[a.id],
          allStaffFields: {
            employeeName: a.employeeName,
            staffName: a.staffName,
            barberName: a.barberName,
            employeeName2: a.employee?.name,
            staffName2: a.staff?.name,
            fromStaffInfo: staffInfo[a.id]?.staffName,
          },
        });

        // If no name found and we have staff data, try to match by employeeId
        if (!employeeName && staff?.length > 0) {
          const employeeId = a.employeeId || a.staffId;
          if (employeeId) {
            const foundStaff = staff.find(
              (s) => s.id === employeeId || s._id === employeeId
            );
            if (foundStaff) {
              employeeName = foundStaff.name;
              console.log("✅ Nome encontrado via ID:", foundStaff.name);
            }
          }

          // If still no name and only one staff member, use that
          if (!employeeName && staff.length === 1) {
            employeeName = staff[0].name;
            console.log("✅ Usando único funcionário:", staff[0].name);
          }
        }

        // Final fallback
        if (!employeeName) {
          employeeName = "Profissional";
          console.log("⚠️ Usando fallback: Profissional");
        }

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

        // 🕒 NOVA LÓGICA: Verificar se o agendamento já passou do horário
        let finalStatus =
          statusMap[statusRaw] || (statusRaw ? statusRaw : "Agendado");

        // Só aplicar lógica automática para agendamentos que não foram cancelados
        if (finalStatus !== "Cancelado" && finalStatus !== "Concluído") {
          const now = new Date();

          if (dateObj && start) {
            try {
              // Criar data/hora do agendamento
              const appointmentDateTime = new Date(dateObj);
              const [hours, minutes] = start
                .split(":")
                .map((num) => parseInt(num, 10));

              if (!isNaN(hours) && !isNaN(minutes)) {
                appointmentDateTime.setHours(hours, minutes, 0, 0);

                // Se o agendamento foi há mais de 1 hora, marcar como concluído
                const oneHourAfterAppointment = new Date(
                  appointmentDateTime.getTime() + 60 * 60 * 1000
                );

                if (now > oneHourAfterAppointment) {
                  finalStatus = "Concluído";
                  console.log(
                    "✅ Agendamento automaticamente marcado como concluído:",
                    {
                      id: a.id,
                      appointmentTime:
                        appointmentDateTime.toLocaleString("pt-BR"),
                      currentTime: now.toLocaleString("pt-BR"),
                      originalStatus: statusRaw,
                      newStatus: finalStatus,
                    }
                  );
                }
              }
            } catch (timeError) {
              console.warn(
                "⚠️ Erro ao processar horário do agendamento:",
                timeError
              );
            }
          }
        }

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
          status: finalStatus,
        };
      })
      .sort(
        (a, b) => (b.dateObj?.getTime() || 0) - (a.dateObj?.getTime() || 0)
      );
  }, [appointments, fallback, staff, staffInfo]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 bg-white shadow-sm border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 mx-2 text-center flex-1 min-w-0 truncate">
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
          className="text-gray-600 text-xs sm:text-sm font-medium hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-1 rounded-full transition-colors flex-shrink-0"
          disabled={isLoading}
        >
          {isLoading ? "..." : "Atualizar"}
        </button>
      </div>
      <div className="px-3 sm:px-6 pb-24 pt-4 sm:pt-6">
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
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-start sm:items-center overflow-hidden"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden pr-2">
                  <p
                    className="font-semibold text-gray-900 text-sm sm:text-base leading-tight"
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {appt.productName}
                  </p>
                  <div
                    className="text-xs text-gray-500 mt-1 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:flex-wrap sm:gap-1"
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                      {appt.start || "--:--"}
                    </span>
                    {appt.end && (
                      <>
                        <span className="text-gray-400 hidden sm:inline">
                          •
                        </span>
                        <span className="block sm:inline">{appt.end}</span>
                      </>
                    )}
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span
                      className="block sm:inline"
                      style={{
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {appt.employeeName}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 overflow-hidden min-w-0">
                  <span
                    className="block text-xs sm:text-sm font-medium text-gray-900 leading-tight"
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      maxWidth: "100px",
                    }}
                  >
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
      className={`inline-block mt-1 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded-full border ${cls}`}
      style={{
        wordWrap: "break-word",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        maxWidth: "80px",
        fontSize: "9px",
        lineHeight: "1.2",
      }}
    >
      {status}
    </span>
  );
}
