import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { availabilityService } from "../services/availabilityService";
import { bookingApiService } from "../services/bookingApiService";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useCart } from "../contexts/useCart";
import PaymentOverlay from "./PaymentOverlay";
import { useAuth } from "../hooks/useAuth";
import NotificationPopup from "./NotificationPopup";
import { useNotification } from "../hooks/useNotification";
import { formatDateBR } from "../utils/dateUtils";

// Props:
// - open: boolean
// - onClose: () => void
// - enterpriseEmail: string
// - product: { id, name, duration, category, priceInCents|price }
// - employees: array of employees eligible to perform this product
export default function BookingOverlay({
  open,
  onClose,
  product,
  employees = [],
  mode = "create", // 'create' | 'edit'
  initialSelection, // { employeeId, date, time }
  onSave, // (sel) => void when mode==='edit'
}) {
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { currentEnterprise } = useEnterprise();
  const { addItem, items: cartItems } = useCart();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { notification, showSuccess, showError, hideNotification } =
    useNotification();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDates, setAvailableDates] = useState([]); // YYYY-MM-DD[]
  const [loadingDates, setLoadingDates] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  // Estados para dados do cliente (quando admin/staff faz agendamento para cliente)
  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [useClientForm, setUseClientForm] = useState(false);

  // Robust local date parser for either YYYY-MM-DD (input value) or DD/MM/YYYY (locale UI)
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("/").map(Number);
      return new Date(y, m - 1, d);
    }
    // Fallback: let JS try
    return new Date(dateStr);
  };

  // useEffect separado para limpeza quando fecha
  useEffect(() => {
    if (!open) {
      setSelectedEmployeeId("");
      setSelectedDate("");
      setSlots([]);
      setSelectedTime("");
      setAvailableDates([]);
      // Reset dados do cliente
      setClientData({ name: "", phone: "", email: "" });
      setUseClientForm(false);
      // Limpar notificação quando fechar
      hideNotification();
    }
  }, [open, hideNotification]);

  // useEffect separado para verificação de autenticação
  useEffect(() => {
    if (open && !authUser) {
      console.log(
        "🚫 [BookingOverlay] Usuário não autenticado, redirecionando para login"
      );

      // Redirecionar para login
      const loginUrl = getEnterpriseUrl("auth/login");
      navigate(loginUrl);
    }
  }, [open, authUser, getEnterpriseUrl, navigate]);

  // useEffect separado para configuração inicial quando abre
  useEffect(() => {
    if (open && authUser) {
      // Limpar notificação quando abrir
      hideNotification();

      // Verificar se usuário é admin/staff para mostrar opção de cliente
      const isAdminOrStaff =
        authUser?.role === "admin" || authUser?.role === "staff";
      if (isAdminOrStaff) {
        setUseClientForm(true);
      }
    }
  }, [open, authUser, hideNotification]);

  // Seed initial selection when opening in edit mode
  useEffect(() => {
    if (!open || !initialSelection) return;
    const { employeeId, date, time } = initialSelection || {};
    if (employeeId) setSelectedEmployeeId(String(employeeId));
    if (date) setSelectedDate(date);
    if (time) setSelectedTime(time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    initialSelection?.employeeId,
    initialSelection?.date,
    initialSelection?.time,
  ]);

  // Reset selected time when employee or date changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedEmployeeId, selectedDate]);

  // Show only employees that can perform the selected product
  const eligibleEmployees = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];

    // Sempre filtrar funcionários inativos primeiro
    const activeEmployees = list.filter((e) => e.isActive !== false);

    // Se não há produto selecionado, retornar todos os funcionários ativos
    if (!product?.id) return activeEmployees;

    // Filtrar por habilidades específicas do produto
    const eligibleBySkills = activeEmployees.filter((e) => {
      const skills = Array.isArray(e.skills) ? e.skills : [];
      return skills.some(
        (sk) =>
          String(sk.productId) === String(product.id) && sk.canPerform !== false
      );
    });

    return eligibleBySkills;
  }, [employees, product?.id]);

  // Keep selection valid when the filtered list changes
  useEffect(() => {
    if (!selectedEmployeeId) return;
    const exists = eligibleEmployees.some(
      (e) => String(e.id) === String(selectedEmployeeId)
    );
    if (!exists) setSelectedEmployeeId("");
  }, [eligibleEmployees, selectedEmployeeId]);

  const selectedEmployee = useMemo(
    () =>
      eligibleEmployees.find(
        (e) => String(e.id) === String(selectedEmployeeId)
      ),
    [eligibleEmployees, selectedEmployeeId]
  );

  const workDays = useMemo(() => {
    const ws =
      selectedEmployee?.workSchedule || selectedEmployee?.workingHours || {};
    const order = [
      ["monday", "Seg"],
      ["tuesday", "Ter"],
      ["wednesday", "Qua"],
      ["thursday", "Qui"],
      ["friday", "Sex"],
      ["saturday", "Sáb"],
      ["sunday", "Dom"],
    ];
    const isWorkingLike = (cfg) =>
      cfg?.isWorking ||
      (cfg?.morningStart && cfg?.morningEnd) ||
      (cfg?.afternoonStart && cfg?.afternoonEnd) ||
      (cfg?.startTime && cfg?.endTime) ||
      (cfg?.start && cfg?.end);
    const days = order.filter(([k]) => isWorkingLike(ws[k])).map(([, l]) => l);
    return { labels: days, map: ws };
  }, [selectedEmployee]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedEmployeeId || !selectedDate || !product?.id) return;
      try {
        setIsLoadingSlots(true);
        let mapped = [];
        try {
          const data = await availabilityService.getEmployeeServiceSlots(
            selectedEmployeeId,
            selectedDate,
            product.id,
            currentEnterprise?.email
          );
          const arr = Array.isArray(data) ? data : data?.slots || [];
          mapped = arr.filter(Boolean).map((s) => ({
            startTime: s.startTime || s.time,
            endTime: s.endTime,
            isAvailable: s.isAvailable !== false,
          }));
        } catch (err) {
          console.debug(
            "[Overlay] API employee service slots falhou, usando fallback",
            err
          );
          mapped = [];
        }

        // Fallback 1: tentar endpoint geral de slots por empresa
        if ((!mapped || mapped.length === 0) && currentEnterprise?.email) {
          try {
            const data2 = await availabilityService.getAvailableSlots(
              currentEnterprise.email,
              selectedDate,
              product.id,
              selectedEmployeeId,
              Number(product?.duration) || 30
            );
            const arr2 = Array.isArray(data2) ? data2 : data2?.slots || [];
            mapped = arr2.map((s) => ({
              startTime: s.startTime || s.time,
              endTime: s.endTime,
              isAvailable: s.isAvailable !== false,
            }));
          } catch {
            // ignore and proceed to next fallback
          }
        }

        // Fallback 2: gerar slots a partir da escala do funcionário e remover os já reservados
        if (!mapped || mapped.length === 0) {
          try {
            const selEmp = employees.find(
              (e) => String(e.id) === String(selectedEmployeeId)
            );
            const ws = selEmp?.workSchedule || selEmp?.workingHours || {};
            const d = parseLocalDate(selectedDate);
            const dow = d.getDay();
            // Mapear chaves pt/en comuns
            const mapKeys = [
              ["sunday", ["sunday", "sun", "dom", "domingo"]],
              ["monday", ["monday", "mon", "seg", "segunda"]],
              ["tuesday", ["tuesday", "tue", "ter", "terca", "terça"]],
              ["wednesday", ["wednesday", "wed", "qua", "quarta"]],
              ["thursday", ["thursday", "thu", "qui", "quinta"]],
              ["friday", ["friday", "fri", "sex", "sexta"]],
              ["saturday", ["saturday", "sat", "sab", "sábado", "sabado"]],
            ];
            const keyEn = [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ][dow];
            // Procurar dia correspondente no objeto ws
            const findDayCfg = () => {
              const normalize = (k) =>
                (k || "").toString().trim().toLowerCase();
              const wsNormalized = {};
              Object.keys(ws || {}).forEach((k) => {
                wsNormalized[normalize(k)] = ws[k];
              });
              if (wsNormalized[normalize(keyEn)])
                return wsNormalized[normalize(keyEn)];
              for (const [std, aliases] of mapKeys) {
                if (std === keyEn) {
                  for (const alias of aliases) {
                    const nk = normalize(alias);
                    if (wsNormalized[nk]) return wsNormalized[nk];
                  }
                }
              }
              return null;
            };
            const dayCfg = findDayCfg();
            const step = 30; // minutos
            const dur = Number(product?.duration) || 30;
            const toMins = (t) => {
              const [h, m] = (t || "00:00").split(":").map(Number);
              return h * 60 + m;
            };
            const toHHMM = (mins) =>
              `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
                mins % 60
              ).padStart(2, "0")}`;

            let candidateTimes = [];
            const hasExplicitTimes =
              !!dayCfg &&
              (dayCfg.morningStart ||
                dayCfg.afternoonStart ||
                dayCfg.startTime ||
                dayCfg.endTime ||
                dayCfg.start ||
                dayCfg.end);
            const worksToday =
              dayCfg?.isWorking || (!!dayCfg && hasExplicitTimes);
            if (worksToday) {
              const ranges = [];
              if (dayCfg.morningStart && dayCfg.morningEnd) {
                ranges.push([
                  toMins(dayCfg.morningStart),
                  toMins(dayCfg.morningEnd),
                ]);
              }
              if (dayCfg.afternoonStart && dayCfg.afternoonEnd) {
                ranges.push([
                  toMins(dayCfg.afternoonStart),
                  toMins(dayCfg.afternoonEnd),
                ]);
              }
              // Suporte a formatos antigos (start/end únicos)
              if (dayCfg.startTime && dayCfg.endTime) {
                ranges.push([toMins(dayCfg.startTime), toMins(dayCfg.endTime)]);
              }
              if (dayCfg.start && dayCfg.end) {
                ranges.push([toMins(dayCfg.start), toMins(dayCfg.end)]);
              }
              // Fallback: isWorking=true sem horários explícitos -> usar 09:00-18:00
              if (ranges.length === 0 && dayCfg?.isWorking) {
                ranges.push([toMins("09:00"), toMins("18:00")]);
              }
              for (const [start, end] of ranges) {
                for (let t = start; t + dur <= end; t += step) {
                  candidateTimes.push(toHHMM(t));
                }
              }
            }
            if (candidateTimes.length === 0) {
              console.debug(
                "[Overlay Fallback] Nenhum horário gerado a partir da escala",
                {
                  selectedEmployeeId,
                  selectedDate,
                  productDuration: dur,
                  dayCfg,
                  wsKeys: Object.keys(ws || {}),
                  keyEn,
                  dow,
                }
              );
            }

            // Buscar bookings do dia para filtrar horários ocupados (por funcionário) usando Firestore
            let bookedIntervals = [];

            // Primeiro, adicionar agendamentos temporários do carrinho
            console.log(
              "🛒 Verificando itens do carrinho como agendamentos temporários:",
              cartItems
            );
            const cartBookings = (cartItems || []).filter((item) => {
              // Filtrar apenas itens do mesmo funcionário e data
              const sameEmployee = item.employeeId === selectedEmployeeId;
              const sameDate = item.date === selectedDate;

              console.log("🛒 Item do carrinho:", {
                serviceName: item.serviceName,
                employeeId: item.employeeId,
                selectedEmployeeId,
                date: item.date,
                selectedDate,
                time: item.time,
                sameEmployee,
                sameDate,
                willInclude: sameEmployee && sameDate,
              });

              return sameEmployee && sameDate;
            });

            // Converter itens do carrinho para intervalos ocupados
            const cartIntervals = cartBookings.map((item) => {
              const parseM = (time) => {
                const [h, m] = String(time || "00:00")
                  .split(":")
                  .map(Number);
                return h * 60 + m;
              };
              const start = parseM(item.time);
              const duration = Number(item.duration) || 30;
              const end = start + duration;

              console.log("🛒 Intervalo ocupado pelo carrinho:", {
                time: item.time,
                start,
                end,
                duration,
                serviceName: item.serviceName,
              });

              return [start, end];
            });

            console.log(
              "🛒 Total de intervalos do carrinho:",
              cartIntervals.length
            );

            if (currentEnterprise?.email) {
              try {
                console.log(
                  "📋 Buscando agendamentos existentes via API para:",
                  selectedDate
                );
                const dayBookingsResult = await bookingApiService.getBookings(
                  currentEnterprise.email,
                  selectedDate
                );
                const dayBookings = dayBookingsResult.success
                  ? dayBookingsResult.data
                  : [];

                console.log("🔍 Debug: Resultado da API para o dia:", {
                  success: dayBookingsResult.success,
                  totalBookings: dayBookings.length,
                  bookings: dayBookings,
                });

                // Log detalhado de cada agendamento ANTES do filtro
                console.log("📊 Agendamentos ANTES do filtro de funcionário:");
                dayBookings.forEach((booking, index) => {
                  console.log(`   ${index + 1}. ID: ${booking.id}`, {
                    employeeId: booking.employeeId,
                    employeeName: booking.employeeName,
                    staffName: booking.staffName,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    status: booking.status,
                    clientName: booking.clientName,
                    productName: booking.productName,
                  });
                });
                const parseM = (time) => {
                  const [h, m] = String(time || "00:00")
                    .split(":")
                    .map(Number);
                  return h * 60 + m;
                };

                // Filtrar apenas agendamentos do mesmo funcionário que não foram cancelados
                const activeStatuses = [
                  "scheduled",
                  "confirmed",
                  "in_progress",
                  "agendado",
                  "confirmado",
                  "pending", // ADICIONADO: pending deve ser considerado ativo/ocupado
                ];

                console.log(
                  "🔍 Debug: Todos os agendamentos do dia:",
                  dayBookings
                );
                console.log("🔍 Debug: Funcionário selecionado:", {
                  selectedEmployeeId,
                  selectedEmployeeName: selectedEmployee?.name,
                  selectedEmployeeEmail: selectedEmployee?.email,
                  fullSelectedEmployee: selectedEmployee,
                });

                // Log detalhado de cada agendamento
                dayBookings.forEach((booking, index) => {
                  console.log(`📅 Agendamento ${index + 1}:`, {
                    id: booking.id,
                    employeeId: booking.employeeId,
                    employeeName: booking.employeeName,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    productName: booking.productName,
                    productDuration: booking.productDuration,
                    duration: booking.duration,
                    status: booking.status,
                    clientName: booking.clientName,
                    // Dados completos do agendamento para análise
                    fullBooking: booking,
                  });
                });

                bookedIntervals = (dayBookings || [])
                  .filter((b) => {
                    // Log cada agendamento sendo analisado
                    console.log(`📋 Analisando agendamento ${b.id}:`, {
                      employeeId: b.employeeId,
                      employeeName: b.employeeName,
                      staffName: b.staffName,
                      startTime: b.startTime,
                      endTime: b.endTime,
                      status: b.status,
                      clientName: b.clientName,
                      productName: b.productName,
                    });

                    // Estratégias para identificar se o agendamento é do mesmo funcionário
                    let matchFound = false;
                    let matchReason = "";

                    // 1. Se há employeeId válido, usar comparação direta
                    if (
                      b.employeeId !== undefined &&
                      b.employeeId !== null &&
                      b.employeeId !== ""
                    ) {
                      const sameEmployee =
                        String(b.employeeId) === String(selectedEmployeeId);

                      if (sameEmployee) {
                        matchFound = true;
                        matchReason = "employeeId_exact_match";
                      }

                      console.log("🔍 Strategy 1 - employeeId comparison:", {
                        bookingId: b.id,
                        employeeId: b.employeeId,
                        selectedEmployeeId,
                        sameEmployee,
                        matchFound,
                      });
                    }

                    // 2. Verificar por employeeName se disponível
                    if (
                      !matchFound &&
                      b.employeeName &&
                      selectedEmployee?.name
                    ) {
                      const nameMatch =
                        b.employeeName
                          .toLowerCase()
                          .includes(selectedEmployee.name.toLowerCase()) ||
                        selectedEmployee.name
                          .toLowerCase()
                          .includes(b.employeeName.toLowerCase());

                      if (nameMatch) {
                        matchFound = true;
                        matchReason = "employeeName_partial_match";
                      }

                      console.log("🔍 Strategy 2 - employeeName comparison:", {
                        bookingId: b.id,
                        employeeName: b.employeeName,
                        selectedEmployeeName: selectedEmployee?.name,
                        nameMatch,
                        matchFound,
                      });
                    }

                    // 3. Verificar por staffName se disponível
                    if (!matchFound && b.staffName && selectedEmployee?.name) {
                      const staffNameMatch =
                        b.staffName
                          .toLowerCase()
                          .includes(selectedEmployee.name.toLowerCase()) ||
                        selectedEmployee.name
                          .toLowerCase()
                          .includes(b.staffName.toLowerCase());

                      if (staffNameMatch) {
                        matchFound = true;
                        matchReason = "staffName_partial_match";
                      }

                      console.log("🔍 Strategy 3 - staffName comparison:", {
                        bookingId: b.id,
                        staffName: b.staffName,
                        selectedEmployeeName: selectedEmployee?.name,
                        staffNameMatch,
                        matchFound,
                      });
                    }

                    // 4. Verificar por email do funcionário
                    if (!matchFound && selectedEmployee?.email) {
                      const emailInBooking =
                        b.employeeEmail === selectedEmployee.email ||
                        b.staffEmail === selectedEmployee.email ||
                        b.employeeId === selectedEmployee.email;

                      if (emailInBooking) {
                        matchFound = true;
                        matchReason = "employee_email_match";
                      }

                      console.log("🔍 Strategy 4 - email comparison:", {
                        bookingId: b.id,
                        employeeEmail: b.employeeEmail,
                        staffEmail: b.staffEmail,
                        selectedEmployeeEmail: selectedEmployee.email,
                        emailInBooking,
                        matchFound,
                      });
                    }

                    // 5. ESTRATÉGIA AGRESSIVA: Se não tem employeeId e funcionário específico selecionado
                    // Assumir que agendamentos sem employeeId pertencem ao funcionário selecionado
                    if (
                      !matchFound &&
                      (!b.employeeId ||
                        b.employeeId === "" ||
                        b.employeeId === null) &&
                      selectedEmployee?.name
                    ) {
                      // Esta é uma estratégia mais agressiva que assume que agendamentos sem ID
                      // pertencem ao funcionário selecionado (útil para dados legados)
                      matchFound = true;
                      matchReason = "aggressive_fallback_no_employeeId";

                      console.log(
                        "🔍 Strategy 5 - aggressive fallback (no employeeId):",
                        {
                          bookingId: b.id,
                          employeeId: b.employeeId,
                          selectedEmployeeName: selectedEmployee?.name,
                          assumingMatch: true,
                          matchFound,
                        }
                      );
                    }

                    // Verificar se agendamento está ativo (não cancelado)
                    const isActive =
                      !b.status ||
                      activeStatuses.includes(b.status.toLowerCase());

                    const finalInclude = matchFound && isActive;

                    console.log(`🎯 DECISÃO FINAL para agendamento ${b.id}:`, {
                      bookingTime: b.startTime,
                      matchFound,
                      matchReason,
                      isActive,
                      bookingStatus: b.status,
                      FINAL_INCLUDED: finalInclude,
                    });

                    return finalInclude;
                  })
                  .map((b) => {
                    const s = parseM(b.startTime);
                    const d = Number(b.productDuration || b.duration || 30);
                    let e = b.endTime ? parseM(b.endTime) : s + d;
                    if (e <= s) e = s + d;

                    console.log("📅 Booked interval:", {
                      booking: b.productName,
                      startTime: b.startTime,
                      startMinutes: s,
                      endMinutes: e,
                      duration: d,
                      productDuration: b.productDuration,
                      duration_field: b.duration,
                    });

                    return [s, e];
                  });

                console.log("🎯 RESULTADO FINAL DA FILTRAGEM:", {
                  dataAtual: selectedDate,
                  funcionarioSelecionado: {
                    id: selectedEmployeeId,
                    name: selectedEmployee?.name,
                    email: selectedEmployee?.email,
                  },
                  totalBookingsOriginal: dayBookings.length,
                  bookingsFilteredForEmployee: bookedIntervals.length,
                  cartIntervalsCount: cartIntervals.length,
                  selectedEmployeeId,
                  selectedEmployeeName: selectedEmployee?.name,
                  bookedIntervalsDetails: bookedIntervals,
                  cartIntervalsDetails: cartIntervals,
                  // Agendamentos que foram EXCLUÍDOS (para debug)
                  excludedBookings: dayBookings
                    .filter((b) => {
                      const included = bookedIntervals.some((interval) => {
                        const parseM = (time) => {
                          const [h, m] = String(time || "00:00")
                            .split(":")
                            .map(Number);
                          return h * 60 + m;
                        };
                        const bookingStart = parseM(b.startTime);
                        return interval[0] === bookingStart;
                      });
                      return !included;
                    })
                    .map((b) => ({
                      id: b.id,
                      startTime: b.startTime,
                      employeeId: b.employeeId,
                      employeeName: b.employeeName,
                      staffName: b.staffName,
                      status: b.status,
                      productName: b.productName,
                    })),
                });

                // COMBINAR intervalos do Firebase com intervalos do carrinho
                bookedIntervals = [...bookedIntervals, ...cartIntervals];

                console.log("🔗 INTERVALOS COMBINADOS (Firebase + Carrinho):", {
                  totalIntervals: bookedIntervals.length,
                  intervalDetails: bookedIntervals,
                  firebaseIntervals:
                    bookedIntervals.length - cartIntervals.length,
                  cartIntervals: cartIntervals.length,
                });
              } catch (error) {
                console.error(
                  "❌ Error fetching bookings for conflict check:",
                  error
                );
                // Em caso de erro, usar apenas intervalos do carrinho
                bookedIntervals = cartIntervals;
                console.log(
                  "🔄 Usando apenas intervalos do carrinho devido ao erro:",
                  bookedIntervals
                );
              }
            } else {
              // Se não há enterprise email, usar apenas intervalos do carrinho
              bookedIntervals = cartIntervals;
              console.log(
                "🔄 Usando apenas intervalos do carrinho (sem enterprise):",
                bookedIntervals
              );
            }

            // Remover horários passados se a data selecionada for hoje
            const todayStr = new Date().toISOString().split("T")[0];
            const now = new Date();
            const nowMins =
              selectedDate === todayStr
                ? now.getHours() * 60 + now.getMinutes()
                : -1;
            const durSel = Number(product?.duration) || 30;

            mapped = candidateTimes.map((t) => {
              const [hh, mm] = t.split(":").map(Number);
              const startM = hh * 60 + mm;
              const endM = startM + durSel;
              const past = nowMins >= 0 && startM <= nowMins;

              console.log(`🕐 Verificando horário ${t}:`, {
                startMinutes: startM,
                endMinutes: endM,
                durSel,
                bookedIntervals: bookedIntervals.length,
                bookedIntervals_data: bookedIntervals,
              });

              const conflict = bookedIntervals.some(([s, e]) => {
                // Verifica se há sobreposição: novo agendamento começa antes do fim de um existente
                // E termina depois do início de um existente
                const hasConflict = startM < e && endM > s;

                if (hasConflict) {
                  console.log("⚠️ Conflict detected:", {
                    candidateTime: t,
                    candidateStart: startM,
                    candidateEnd: endM,
                    existingStart: s,
                    existingEnd: e,
                    overlap: true,
                  });
                }

                return hasConflict;
              });

              const isAvailable = !past && !conflict;

              if (!isAvailable) {
                console.log("❌ Time slot not available:", {
                  time: t,
                  past,
                  conflict,
                  reason: past
                    ? "time_passed"
                    : conflict
                    ? "booking_conflict"
                    : "unknown",
                });
              }

              return {
                startTime: t,
                isAvailable,
              };
            });
          } catch {
            mapped = [];
          }
        }

        setSlots(mapped);
      } catch (e) {
        console.error("Erro ao carregar horários:", e);
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadSlots();
  }, [
    selectedEmployeeId,
    selectedDate,
    product?.id,
    product?.duration,
    currentEnterprise?.email,
    employees,
    selectedEmployee,
    cartItems,
  ]);

  // Compute available dates forward (e.g., next 45 days) where the employee works and there is at least one free slot
  useEffect(() => {
    const computeAvailableDates = async () => {
      setAvailableDates([]);
      if (!open || !selectedEmployee) return;
      try {
        setLoadingDates(true);
        const ws =
          selectedEmployee?.workSchedule ||
          selectedEmployee?.workingHours ||
          {};
        const dur = Number(product?.duration) || 30;
        const horizonDays = 45;
        const today = new Date();
        const toLocalYMD = (dt) => {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, "0");
          const d = String(dt.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };
        const todayStr = toLocalYMD(today);

        // Load upcoming bookings once and filter by employee
        let bookings = [];
        try {
          console.log(
            "📋 Buscando agendamentos futuros via API para funcionário:",
            selectedEmployee.id
          );
          const listResult = await bookingApiService.getBookings(
            currentEnterprise?.email,
            null, // date = null para todos
            null // status = null para todos
          );
          const list = listResult.success ? listResult.data : [];
          bookings = Array.isArray(list)
            ? list.filter(
                (b) => String(b.employeeId) === String(selectedEmployee.id)
              )
            : [];
        } catch {
          bookings = [];
        }
        // Build intervals per date for accurate overlap checks
        const bookedByDate = new Map(); // dateStr -> Array<[startM,endM]>
        const parseM = (t) => {
          const [h, m] = String(t || "00:00")
            .split(":")
            .map(Number);
          return h * 60 + m;
        };
        for (const b of bookings) {
          if (!b?.date || !b?.startTime) continue;
          const key = b.date;
          const s = parseM(b.startTime);
          const dur = Number(b.productDuration || b.duration || 30);
          let e = b.endTime ? parseM(b.endTime) : s + dur;
          if (e <= s) e = s + dur;
          if (!bookedByDate.has(key)) bookedByDate.set(key, []);
          bookedByDate.get(key).push([s, e]);
        }

        const toMins = (t) => {
          const [h, m] = String(t || "00:00")
            .split(":")
            .map(Number);
          return h * 60 + m;
        };
        // toHHMM no longer needed in this computation
        const normalizeKeys = (obj = {}) => {
          const out = {};
          Object.keys(obj).forEach(
            (k) => (out[String(k).toLowerCase()] = obj[k])
          );
          return out;
        };
        const wsNorm = normalizeKeys(ws);
        const dayAliases = {
          sunday: ["sunday", "sun", "dom", "domingo"],
          monday: ["monday", "mon", "seg", "segunda"],
          tuesday: ["tuesday", "tue", "ter", "terca", "terça"],
          wednesday: ["wednesday", "wed", "qua", "quarta"],
          thursday: ["thursday", "thu", "qui", "quinta"],
          friday: ["friday", "fri", "sex", "sexta"],
          saturday: ["saturday", "sat", "sab", "sábado", "sabado"],
        };
        const getCfgForDate = (d) => {
          const dow = d.getDay();
          const key = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ][dow];
          if (wsNorm[key]) return wsNorm[key];
          for (const alias of dayAliases[key] || []) {
            if (wsNorm[String(alias)]) return wsNorm[String(alias)];
          }
          return null;
        };

        const outDates = [];
        for (let i = 0; i < horizonDays; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dateStr = toLocalYMD(d);
          const cfg = getCfgForDate(d);
          const ranges = [];
          if (!cfg) continue;
          if (cfg.isWorking === false) continue;
          if (cfg.morningStart && cfg.morningEnd)
            ranges.push([toMins(cfg.morningStart), toMins(cfg.morningEnd)]);
          if (cfg.afternoonStart && cfg.afternoonEnd)
            ranges.push([toMins(cfg.afternoonStart), toMins(cfg.afternoonEnd)]);
          if (cfg.startTime && cfg.endTime)
            ranges.push([toMins(cfg.startTime), toMins(cfg.endTime)]);
          if (cfg.start && cfg.end)
            ranges.push([toMins(cfg.start), toMins(cfg.end)]);
          // Fallback: isWorking=true sem horários explícitos -> usar 09:00-18:00
          if (!ranges.length && cfg?.isWorking) {
            ranges.push([toMins("09:00"), toMins("18:00")]);
          }
          if (!ranges.length) continue;

          // Generate candidate start times in 30-min steps where the service fits fully
          const step = 30;
          const nowMins =
            dateStr === todayStr
              ? today.getHours() * 60 + today.getMinutes()
              : -1;
          const bookedIntervals = bookedByDate.get(dateStr) || [];
          let hasFree = false;
          outer: for (const [rs, re] of ranges) {
            for (let t = rs; t + dur <= re; t += step) {
              if (nowMins >= 0 && t <= nowMins) continue; // skip past times today
              // check interval overlap: [t, t+dur) vs any booked [s,e)
              const tEnd = t + dur;
              const conflict = bookedIntervals.some(
                ([s, e]) => t < e && tEnd > s
              );
              if (!conflict) {
                hasFree = true;
                break outer;
              }
            }
          }
          if (hasFree) outDates.push(dateStr);
        }
        setAvailableDates(outDates);
        // Auto-select first available date if none selected
        if (!selectedDate && outDates.length) {
          setSelectedDate(outDates[0]);
        } else if (selectedDate && !outDates.includes(selectedDate)) {
          // if previous selection became invalid, move to nearest future available
          setSelectedDate(outDates[0] || "");
        }
      } finally {
        setLoadingDates(false);
      }
    };
    computeAvailableDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedEmployeeId, product?.duration, currentEnterprise?.email]);

  // removed unused canPickDate helper

  // Navegação direta para appointment foi substituída por adicionar ao carrinho

  // Função para agendar diretamente com pagamento
  const handleScheduleNow = () => {
    if (!authUser) {
      navigate(getEnterpriseUrl("login"));
      return;
    }
    if (!canConfirm) return;
    setShowPaymentOverlay(true);
  };

  // Função para adicionar ao carrinho e ir para serviços
  const handleAddAndChooseMore = () => {
    console.log("🛒 [BookingOverlay] handleAddAndChooseMore chamado");

    if (!authUser) {
      navigate(getEnterpriseUrl("login"));
      return;
    }

    console.log("🛒 [BookingOverlay] canConfirm:", canConfirm);
    console.log("🛒 [BookingOverlay] Dados para adicionar:", {
      productId: product?.id,
      serviceName: product?.name,
      priceInCents: product?.priceInCents ?? product?.price ?? 0,
      duration: Number(product?.duration) || 30,
      employeeId: selectedEmployee?.id,
      employeeName: selectedEmployee?.name,
      date: selectedDate,
      time: selectedTime,
    });

    if (!canConfirm) {
      console.log(
        "🚫 [BookingOverlay] Não pode confirmar - canConfirm é false"
      );
      return;
    }

    try {
      console.log("🛒 [BookingOverlay] Chamando addItem...");
      // Adicionar ao carrinho
      addItem({
        productId: product?.id,
        serviceName: product?.name,
        priceInCents: product?.priceInCents ?? product?.price ?? 0,
        duration: Number(product?.duration) || 30,
        employeeId: selectedEmployee?.id,
        employeeName: selectedEmployee?.name,
        date: selectedDate,
        time: selectedTime,
      });

      console.log("🛒 [BookingOverlay] addItem executado com sucesso");

      // Fechar overlay primeiro
      onClose();

      // Disparar evento customizado para notificar sucesso
      setTimeout(() => {
        console.log("🎉 [BookingOverlay] Disparando evento de sucesso...");
        const event = new CustomEvent("cartItemAdded", {
          detail: { message: "✅ Serviço adicionado ao carrinho com sucesso!" },
        });
        window.dispatchEvent(event);
        console.log("🎉 [BookingOverlay] Evento disparado!");
      }, 300);

      // Navegar para página de serviços após um delay maior
      setTimeout(() => {
        navigate(getEnterpriseUrl("service-details?category=Todos"));
      }, 1000);
    } catch (error) {
      console.error(
        "🚫 [BookingOverlay] Erro ao adicionar item ao carrinho:",
        error
      );

      // Verificar se é erro de duplicata
      if (error?.type === "CART_DUPLICATE") {
        showError(`❌ ${error.message}`, 6000);
      } else {
        showError("❌ Erro ao adicionar ao carrinho. Tente novamente.", 4000);
      }
    }
  };

  // Função chamada quando pagamento é confirmado
  const handlePaymentConfirm = async (result) => {
    console.log("🎯 handlePaymentConfirm chamado com:", result);

    if (!authUser) {
      navigate(getEnterpriseUrl("login"));
      return;
    }

    if (result.success) {
      // Criar agendamento via API
      try {
        console.log("🔄 Criando agendamento via API...");

        console.log("🏢 Debug - Empresa atual:", {
          currentEnterprise: currentEnterprise?.email,
          currentEnterpriseName: currentEnterprise?.name,
        });

        // 🔥 DADOS REAIS - SEM MAPEAMENTOS
        const employeeId = selectedEmployee?.id;
        console.log("🔥 TESTE COM DADOS REAIS:", {
          employeeId,
          enterprise: currentEnterprise?.email,
          product: product?.name,
        });
        console.log("🔍 Debug - Funcionário selecionado:", {
          selectedEmployee,
          selectedEmployeeId,
          staffName: selectedEmployee?.name,
          staffId: selectedEmployee?.id,
          finalEmployeeId: employeeId,
        });

        // 🐛 DEBUG: Verificar dados do usuário autenticado
        console.log("👤 DEBUG - Dados do usuário logado:", {
          authUser: authUser,
          name: authUser?.name,
          phone: authUser?.phone,
          email: authUser?.email,
          role: authUser?.role,
          useClientForm: useClientForm,
          clientData: clientData,
        });

        const bookingData = {
          clientName:
            useClientForm && clientData.name
              ? clientData.name
              : authUser?.name || "Cliente",
          clientPhone:
            useClientForm && clientData.phone
              ? clientData.phone
              : authUser?.phone || "",
          productId: product?.id, // Usar o produto original, não mapear
          productName: product?.name,
          productPrice: product?.priceInCents ?? product?.price ?? 0,
          productDuration: Number(product?.duration) || 30,
          date: selectedDate,
          startTime: selectedTime,
          status: "scheduled",
          staffName: selectedEmployee?.name,
          staffId: employeeId, // Usar employeeId mapeado
          paymentMethod: result.paymentMethod,
          paymentId: result.paymentId,
          notes: result.paymentMethod
            ? `pagamento: ${result.paymentMethod}`
            : "",
        };

        // Só adicionar email se for válido
        const email =
          useClientForm && clientData.email
            ? clientData.email
            : authUser?.email;
        if (email && email.includes("@") && email.includes(".")) {
          bookingData.clientEmail = email;
        }

        console.log("📤 Enviando dados para API:", {
          enterpriseEmail: currentEnterprise?.email,
          bookingData,
        });

        // 🐛 DEBUG: Verificar dados específicos do cliente
        console.log("🔍 DEBUG - Dados do cliente enviados:", {
          clientName: bookingData.clientName,
          clientPhone: bookingData.clientPhone,
          clientEmail: bookingData.clientEmail,
          source: useClientForm ? "formulário admin" : "usuário logado",
          authUserName: authUser?.name,
          authUserPhone: authUser?.phone,
        });
        console.log("🔍 Debug - Funcionário selecionado:", {
          selectedEmployee,
          selectedEmployeeId,
          staffName: selectedEmployee?.name,
          staffId: selectedEmployee?.id,
        });
        console.log("🏢 Debug - Empresa atual:", {
          currentEnterprise: currentEnterprise?.email,
          currentEnterpriseName: currentEnterprise?.name,
        });

        console.log("✅ Funcionário final para API:", employeeId);

        // 🔥 REMOVENDO MAPEAMENTOS - USANDO DADOS REAIS
        let finalEnterpriseEmail = currentEnterprise?.email;
        let finalBookingData = bookingData;

        console.log("🔥 DADOS FINAIS REAIS:", {
          finalEnterpriseEmail,
          employeeId,
          productId: finalBookingData.productId,
          productName: finalBookingData.productName,
        });

        // 🔎 Pré-validação: resolver o employeeId esperado pela API via endpoint de disponibilidade
        let apiEmployeeId = employeeId;
        try {
          const avail = await bookingApiService.getAvailableEmployeesForService(
            finalEnterpriseEmail,
            finalBookingData.productId,
            selectedDate,
            selectedTime
          );
          console.log("🧪 Disponibilidade (API service):", avail);
          if (avail?.success) {
            const list = Array.isArray(avail.data) ? avail.data : [];
            const byId = list.find((e) => String(e.id) === String(employeeId));
            const byName =
              byId ||
              list.find(
                (e) =>
                  String(e.name || "").toLowerCase() ===
                  String(selectedEmployee?.name || "").toLowerCase()
              );
            if (byName?.id) apiEmployeeId = byName.id;
            if (!byName) {
              console.warn(
                "⚠️ Funcionário selecionado não aparece disponível na API para este slot.",
                {
                  selectedEmployee,
                  candidateIds: list.map((e) => ({ id: e.id, name: e.name })),
                }
              );
            }
          } else {
            // Fallback: listar funcionários por enterprise + productId para mapear nome/email -> id
            try {
              const empList = await bookingApiService.listEmployees(
                finalEnterpriseEmail,
                {
                  productId: finalBookingData.productId,
                  isActive: true,
                }
              );
              console.log("👥 Fallback employees (by product):", empList);
              if (empList?.success) {
                let all = empList.data || [];
                let byId = all.find((e) => String(e.id) === String(employeeId));
                let byEmail =
                  byId ||
                  all.find(
                    (e) =>
                      String(e.email || "").toLowerCase() ===
                      String(selectedEmployee?.id || "").toLowerCase()
                  );
                let byName =
                  byEmail ||
                  all.find(
                    (e) =>
                      String(e.name || "").toLowerCase() ===
                      String(selectedEmployee?.name || "").toLowerCase()
                  );
                if (byName?.id) {
                  apiEmployeeId = byName.id;
                } else {
                  // Segunda tentativa: buscar sem filtrar por produto
                  try {
                    const empAll = await bookingApiService.listEmployees(
                      finalEnterpriseEmail,
                      {
                        isActive: true,
                      }
                    );
                    console.log("👥 Fallback employees (all active):", empAll);
                    if (empAll?.success) {
                      all = empAll.data || [];
                      byId = all.find(
                        (e) => String(e.id) === String(employeeId)
                      );
                      byEmail =
                        byId ||
                        all.find(
                          (e) =>
                            String(e.email || "").toLowerCase() ===
                            String(selectedEmployee?.id || "").toLowerCase()
                        );
                      byName =
                        byEmail ||
                        all.find(
                          (e) =>
                            String(e.name || "").toLowerCase() ===
                            String(selectedEmployee?.name || "").toLowerCase()
                        );
                      if (byName?.id) apiEmployeeId = byName.id;
                    }
                  } catch (innerError) {
                    console.warn(
                      "⚠️ Falha ao buscar todos os funcionários:",
                      innerError
                    );
                  }
                }
              }
            } catch (outerError) {
              console.warn(
                "⚠️ Falha ao buscar funcionários por produto:",
                outerError
              );
            }
          }
        } catch (e) {
          console.warn(
            "⚠️ Falha ao consultar disponibilidade por serviço/lista de funcionários:",
            e
          );
        }

        // Se não conseguimos resolver um ID interno, não enviar employeeId (evita rejeição por email)
        const looksLikeEmail =
          typeof apiEmployeeId === "string" && apiEmployeeId.includes("@");
        const effectiveEmployeeId = looksLikeEmail ? undefined : apiEmployeeId;
        console.log("🧩 EmployeeId efetivo para API:", {
          apiEmployeeId,
          effectiveEmployeeId,
        });

        // Criar booking apenas com campos aceitos pela API
        const apiResult = await bookingApiService.createBooking({
          enterpriseEmail: finalEnterpriseEmail,
          clientName: bookingData.clientName,
          clientPhone: bookingData.clientPhone,
          clientEmail: bookingData.clientEmail,
          productId: finalBookingData.productId,
          employeeId: effectiveEmployeeId,
          employeeName: selectedEmployee?.name || "",
          date: selectedDate,
          startTime: selectedTime,
          notes: finalBookingData.notes,
        });

        console.log("✅ Agendamento criado via API:", apiResult);
        if (!apiResult?.success) {
          console.warn("❌ Falha ao criar agendamento:", apiResult?.error);
          showError(
            apiResult?.error || "Não foi possível criar o agendamento.",
            6000
          );
          return; // não fechar o overlay em caso de erro
        }

        // 🔧 SOLUÇÃO: Salvar informações do funcionário no Firestore
        // Como a API externa não está retornando essas informações,
        // vamos salvá-las localmente para uso posterior
        try {
          if (selectedEmployee && apiResult?.data?.id) {
            const { doc, setDoc } = await import("firebase/firestore");
            const { db } = await import("../services/firebase");

            const bookingStaffInfoRef = doc(
              db,
              "bookingStaffInfo",
              apiResult.data.id
            );
            await setDoc(bookingStaffInfoRef, {
              bookingId: apiResult.data.id,
              staffId: selectedEmployeeId,
              staffName: selectedEmployee.name,
              staffEmail: selectedEmployee.email,
              enterpriseEmail: finalEnterpriseEmail,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            console.log("✅ Informações do funcionário salvas no Firestore:", {
              bookingId: apiResult.data.id,
              staffName: selectedEmployee.name,
            });
          }
        } catch (firestoreError) {
          console.warn(
            "⚠️ Erro ao salvar informações do funcionário no Firestore:",
            firestoreError
          );
          // Não interromper o fluxo por este erro
        }

        console.log("✅ Agendamento criado, mostrando notificação...");
        showSuccess("Agendamento confirmado com sucesso!", 4000);
        // Aguardar um pouco antes de fechar e redirecionar para meus agendamentos
        setTimeout(() => {
          hideNotification(); // Limpar notificação antes de fechar
          onClose();
          // Redirecionar para página de agendamentos
          const myAppointmentsUrl = getEnterpriseUrl("my-appointments");
          navigate(myAppointmentsUrl);
        }, 2000);
      } catch (err) {
        console.log("❌ Erro ao criar agendamento:", err);

        // Tratamento específico para conflitos de agendamento
        if (
          err?.type === "BOOKING_CONFLICT" ||
          err?.message?.includes("Conflito")
        ) {
          showError(
            `❌ Conflito de agendamento: ${
              err.message || "Este horário já está ocupado!"
            }`,
            8000
          );
        } else if (
          err?.message?.includes("network") ||
          err?.message?.includes("fetch")
        ) {
          showError(
            "❌ Problema de conexão. Verifique sua internet e tente novamente.",
            6000
          );
        } else {
          showError(
            "❌ Erro ao criar agendamento: " + (err?.message || err),
            6000
          );
        }
      }
    } else {
      console.log("❌ Pagamento não foi bem-sucedido:", result);
      showError("Falha no pagamento. Tente novamente.", 6000);
    }
  };

  if (!open) return null;

  const canConfirm = Boolean(
    selectedEmployeeId &&
      selectedDate &&
      selectedTime &&
      // Validar dados do cliente se formulário estiver ativo
      (!useClientForm || (clientData.name.trim() && clientData.phone.trim()))
  );

  // Debug para canConfirm
  console.log("🔍 [BookingOverlay] Estado de confirmação:", {
    canConfirm,
    selectedEmployeeId,
    selectedDate,
    selectedTime,
    selectedEmployee: selectedEmployee?.name,
    product: product?.name,
  });

  const saveSelection = () => {
    if (!canConfirm) return;
    const payload = {
      employeeId: selectedEmployee?.id,
      employeeName: selectedEmployee?.name,
      date: selectedDate,
      time: selectedTime,
      productId: product?.id,
      productName: product?.name,
      duration: Number(product?.duration) || 30,
      priceInCents: product?.priceInCents ?? product?.price ?? 0,
    };
    if (mode === "edit" && typeof onSave === "function") {
      onSave(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-3 sm:p-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
              <span className="block sm:inline">Agendar:</span>
              <span className="block sm:inline sm:ml-1 break-anywhere">
                {product?.name}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 -mt-1"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Formulário de dados do cliente (para admin/staff) */}
        {useClientForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-3 text-blue-900 font-medium">
              <UserIcon className="w-4 h-4 mr-2" /> Dados do Cliente
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) =>
                    setClientData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nome completo do cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) =>
                    setClientData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="(xx) xxxxx-xxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) =>
                    setClientData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Employee */}
        <div className="mb-4">
          <div className="flex items-center mb-2 text-gray-900 font-medium">
            <UserIcon className="w-4 h-4 mr-2" /> Escolha o profissional
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {eligibleEmployees.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEmployeeId(e.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  selectedEmployeeId === e.id
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                  {e.avatarUrl ? (
                    <img
                      src={e.avatarUrl}
                      alt={e.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <span className="text-sm whitespace-nowrap">{e.name}</span>
              </button>
            ))}
            {eligibleEmployees.length === 0 && (
              <div className="text-sm text-gray-500">
                Nenhum profissional habilitado para este serviço
              </div>
            )}
          </div>
          {selectedEmployee && workDays.labels.length > 0 && (
            <div className="text-xs text-gray-600 mt-2">
              Dias de trabalho: {workDays.labels.join(", ")}
            </div>
          )}
        </div>

        {/* Step 2: Date */}
        <div className="mb-4">
          <div className="flex items-center mb-2 text-gray-900 font-medium">
            <CalendarIcon className="w-4 h-4 mr-2" /> Escolha a data
          </div>
          {loadingDates ? (
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-20 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-sm text-gray-500">
              Sem dias disponíveis nas próximas semanas.
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {availableDates.map((d) => {
                const active = selectedDate === d;
                const dt = new Date(d + "T00:00:00");
                const weekday = [
                  "Dom",
                  "Seg",
                  "Ter",
                  "Qua",
                  "Qui",
                  "Sex",
                  "Sáb",
                ][dt.getDay()];
                const label = `${weekday} ${formatDateBR(d).slice(0, 5)}`; // dd/mm formato brasileiro
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`px-2 sm:px-3 py-2 rounded-xl border whitespace-nowrap text-xs sm:text-sm min-w-0 flex-shrink-0 ${
                      active
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Slots */}
        <div className="mb-2">
          <div className="flex items-center mb-2 text-gray-900 font-medium">
            <Clock className="w-4 h-4 mr-2" /> Horários disponíveis
          </div>
          {!selectedEmployeeId || !selectedDate ? (
            <div className="text-sm text-gray-500">
              Selecione profissional e data para ver horários.
            </div>
          ) : isLoadingSlots ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-16 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-gray-500">
              Sem horários disponíveis.
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                {slots
                  .filter((s) => s.isAvailable !== false)
                  .map((s, i) => {
                    const active = selectedTime === s.startTime;
                    return (
                      <button
                        key={`${s.startTime || i}`}
                        type="button"
                        onClick={() =>
                          setSelectedTime((prev) =>
                            prev === s.startTime ? "" : s.startTime
                          )
                        }
                        className={`px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm whitespace-nowrap ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-blue-600 text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        {s.startTime}
                      </button>
                    );
                  })}
              </div>
              <div className="mt-4 space-y-3">
                {mode === "edit" ? (
                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={saveSelection}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                      canConfirm
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Salvar edição
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!canConfirm}
                      onClick={handleScheduleNow}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                        canConfirm
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Agendar agora
                    </button>
                    <button
                      type="button"
                      disabled={!canConfirm}
                      onClick={handleAddAndChooseMore}
                      className={`w-full py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base ${
                        !canConfirm ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <span className="block sm:hidden">
                        Adicionar ao carrinho
                      </span>
                      <span className="hidden sm:block">
                        Adicionar e escolher mais serviços
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Overlay */}
      <PaymentOverlay
        isOpen={showPaymentOverlay}
        onClose={() => setShowPaymentOverlay(false)}
        appointmentData={{
          serviceName: product?.name,
          priceInCents: product?.priceInCents ?? product?.price ?? 0,
          employeeName: selectedEmployee?.name,
          date: selectedDate,
          time: selectedTime,
        }}
        onConfirm={handlePaymentConfirm}
      />
      <NotificationPopup
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={notification.duration}
      />
    </div>
  );
}
