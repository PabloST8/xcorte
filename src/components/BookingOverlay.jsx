import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { availabilityService } from "../services/availabilityService";
// bookingService no longer used here; relying on Firestore lists for availability
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useCart } from "../contexts/useCart";
import PaymentOverlay from "./PaymentOverlay";
import { useAuth } from "../hooks/useAuth";
import NotificationPopup from "./NotificationPopup";
import { useNotification } from "../hooks/useNotification";

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
  const { addItem } = useCart();
  const { user: authUser } = useAuth();
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

  useEffect(() => {
    if (!open) {
      setSelectedEmployeeId("");
      setSelectedDate("");
      setSlots([]);
      setSelectedTime("");
      setAvailableDates([]);
      // Limpar notificação quando fechar
      hideNotification();
    } else {
      // Limpar notificação quando abrir
      hideNotification();
    }
  }, [open, hideNotification]);

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
    if (!product?.id) return Array.isArray(employees) ? employees : [];
    const list = Array.isArray(employees) ? employees : [];
    return list.filter((e) => {
      const skills = Array.isArray(e.skills) ? e.skills : [];
      return skills.some(
        (sk) =>
          String(sk.productId) === String(product.id) && sk.canPerform !== false
      );
    });
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
            if (currentEnterprise?.email) {
              try {
                const dayBookings =
                  await enterpriseBookingFirestoreService.list(
                    currentEnterprise.email,
                    { date: selectedDate }
                  );
                const parseM = (time) => {
                  const [h, m] = String(time || "00:00")
                    .split(":")
                    .map(Number);
                  return h * 60 + m;
                };
                bookedIntervals = (dayBookings || [])
                  .filter(
                    (b) => String(b.employeeId) === String(selectedEmployeeId)
                  )
                  .map((b) => {
                    const s = parseM(b.startTime);
                    const d = Number(b.productDuration || b.duration || 30);
                    let e = b.endTime ? parseM(b.endTime) : s + d;
                    if (e <= s) e = s + d;
                    return [s, e];
                  });
              } catch {
                bookedIntervals = [];
              }
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
              const conflict = bookedIntervals.some(
                ([s, e]) => startM < e && endM > s
              );
              return {
                startTime: t,
                isAvailable: !past && !conflict,
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
          const list = await enterpriseBookingFirestoreService.list(
            currentEnterprise?.email,
            { date: "upcoming" }
          );
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
    if (!canConfirm) return;
    setShowPaymentOverlay(true);
  };

  // Função para adicionar ao carrinho e ir para serviços
  const handleAddAndChooseMore = () => {
    if (!canConfirm) return;

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

    // Fechar overlay atual
    onClose();

    // Navegar para página de serviços (aba Todos)
    // A navegação será feita através de uma prop ou context
    if (typeof window !== "undefined") {
      // Vamos navegar para a página de serviços
      window.location.href = getEnterpriseUrl("service-details?category=Todos");
    }
  };

  // Função chamada quando pagamento é confirmado
  const handlePaymentConfirm = async (result) => {
    console.log("🎯 handlePaymentConfirm chamado com:", result);
    if (result.success) {
      // Criar agendamento no Firestore
      try {
        console.log("🔄 Criando agendamento...");
        await enterpriseBookingFirestoreService.create(
          currentEnterprise?.email,
          {
            clientName: authUser?.name || "Cliente",
            clientEmail: authUser?.email || "",
            clientPhone: authUser?.phone || "",
            productId: product?.id,
            productName: product?.name,
            productPrice: product?.priceInCents ?? product?.price ?? 0,
            productDuration: Number(product?.duration) || 30,
            date: selectedDate,
            startTime: selectedTime,
            status: "scheduled",
            staffName: selectedEmployee?.name,
            staffId: selectedEmployee?.id,
            paymentMethod: result.paymentMethod,
            paymentId: result.paymentId,
          }
        );
        console.log("✅ Agendamento criado, mostrando notificação...");
        if (typeof window !== "undefined") {
          showSuccess("Agendamento confirmado com sucesso!", 4000); // 4 segundos
        }
        // Aguardar um pouco antes de fechar para o usuário ver a notificação
        setTimeout(() => {
          hideNotification(); // Limpar notificação antes de fechar
          onClose();
        }, 2000);
      } catch (err) {
        console.log("❌ Erro ao criar agendamento:", err);
        showError("Erro ao criar agendamento: " + (err?.message || err), 6000);
      }
    } else {
      console.log("❌ Pagamento não foi bem-sucedido:", result);
      showError("Falha no pagamento. Tente novamente.", 6000);
    }
  };

  if (!open) return null;

  const canConfirm = Boolean(
    selectedEmployeeId && selectedDate && selectedTime
  );

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
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Agendar: {product?.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

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
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                const label = `${weekday} ${d.slice(5).replace("-", "/")}`; // MM-DD -> MM/DD
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`px-3 py-2 rounded-xl border whitespace-nowrap ${
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
              <div className="flex gap-2 flex-wrap">
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
                        className={`px-3 py-2 rounded-lg border text-sm ${
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
              <div className="mt-4 space-y-2">
                {mode === "edit" ? (
                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={saveSelection}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
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
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
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
                      className={`w-full py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 ${
                        !canConfirm ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Adicionar e escolher mais serviços
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
