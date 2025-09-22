import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Trash2, Edit3, ChevronLeft } from "lucide-react";
import { useCart } from "../contexts/useCart";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../types/api";
import { employeeFirestoreService } from "../services/employeeFirestoreService";
import { bookingService } from "../services/bookingService";
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";
import Cookies from "js-cookie";
import { availabilityService } from "../services/availabilityService";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import BookingOverlay from "../components/BookingOverlay";
import NotificationPopup from "../components/NotificationPopup";
import { useNotification } from "../hooks/useNotification";
import { formatDateBR } from "../utils/dateUtils";

function Cart() {
  const {
    items,
    addItem,
    removeItem,
    updateItem,
    clear,
    paymentMethod,
    setPaymentMethod,
  } = useCart();
  const { currentEnterprise } = useEnterprise();
  const { user, isAuthenticated, ensureFirebaseAuth } = useAuth();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const {
    notification,
    showSuccess,
    showError,
    hideNotification,
  } = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isSimpleSession = (() => {
    const t = Cookies.get("auth_token") || "";
    return t.startsWith("simple-");
  })();

  // Legacy compatibility: if someone navigates to /cart with query params from old links, add a draft item
  useEffect(() => {
    console.log("🛒 [Cart] Estado atual dos itens:", items);
    console.log("🛒 [Cart] Quantidade de itens:", items?.length || 0);
    console.log("🛒 [Cart] useCart hook funcionando:", !!useCart);

    const service = searchParams.get("service");
    const price = searchParams.get("price"); // in reais
    const durationStr = searchParams.get("duration"); // e.g., "30 min"
    const staff = searchParams.get("staff");
    if (service || price || durationStr || staff) {
      const parseMinutes = (s) => {
        if (!s) return 30;
        const m = String(s).match(/(\d+)/);
        return m ? Number(m[1]) : 30;
      };
      const priceInCents = Math.round(Number(price || 0) * 100);
      addItem({
        serviceName: service || "Serviço",
        priceInCents,
        duration: parseMinutes(durationStr),
        employeeName: staff || "",
      });
      // Clean URL to avoid re-adding on refresh
      navigate(getEnterpriseUrl("cart"), { replace: true });
    }
  }, [items, searchParams, addItem, navigate, getEnterpriseUrl]);

  useEffect(() => {
    if (!currentEnterprise?.email) return;
    (async () => {
      try {
        const list = await employeeFirestoreService.list(
          currentEnterprise.email
        );
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
      }
    })();
  }, [currentEnterprise]);

  const onEdit = (it) => setEditingItem(it);
  const onSaveEdit = (sel) => {
    if (!editingItem) return;
    updateItem(editingItem.id, {
      employeeId: sel.employeeId,
      employeeName: sel.employeeName,
      date: sel.date,
      time: sel.time,
    });
    setEditingItem(null);
  };

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.priceInCents) || 0), 0),
    [items]
  );

  const isWithinWorkHours = (it) => {
    try {
      const emp = employees.find((e) => String(e.id) === String(it.employeeId));
      if (!emp) return true; // sem dados, não bloqueia
      const ws = emp.workSchedule || emp.workingHours || {};
      const d = new Date(`${it.date}T00:00:00`);
      const dow = d.getDay();
      const keyEn = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][dow];
      const aliasesMap = {
        sunday: ["sunday", "sun", "dom", "domingo"],
        monday: ["monday", "mon", "seg", "segunda"],
        tuesday: ["tuesday", "tue", "ter", "terca", "terça"],
        wednesday: ["wednesday", "wed", "qua", "quarta"],
        thursday: ["thursday", "thu", "qui", "quinta"],
        friday: ["friday", "fri", "sex", "sexta"],
        saturday: ["saturday", "sat", "sab", "sábado", "sabado"],
      };
      const norm = (k) =>
        String(k || "")
          .trim()
          .toLowerCase();
      const wsNorm = Object.fromEntries(
        Object.entries(ws || {}).map(([k, v]) => [norm(k), v])
      );
      let cfg = wsNorm[norm(keyEn)];
      if (!cfg) {
        for (const a of aliasesMap[keyEn] || []) {
          if (wsNorm[norm(a)]) {
            cfg = wsNorm[norm(a)];
            break;
          }
        }
      }
      if (!cfg) return false; // sem configuração para o dia
      const toMins = (t) => {
        const [h, m] = String(t || "00:00")
          .split(":")
          .map(Number);
        return h * 60 + m;
      };
      const start = toMins(it.time);
      const dur = Number(it.duration) || Number(it.productDuration) || 30;
      const end = start + dur;
      const ranges = [];
      if (cfg.morningStart && cfg.morningEnd)
        ranges.push([toMins(cfg.morningStart), toMins(cfg.morningEnd)]);
      if (cfg.afternoonStart && cfg.afternoonEnd)
        ranges.push([toMins(cfg.afternoonStart), toMins(cfg.afternoonEnd)]);
      if (cfg.startTime && cfg.endTime)
        ranges.push([toMins(cfg.startTime), toMins(cfg.endTime)]);
      if (cfg.start && cfg.end)
        ranges.push([toMins(cfg.start), toMins(cfg.end)]);
      if (!ranges.length && cfg.isWorking === false) return false;
      if (!ranges.length) return true;
      return ranges.some(([rs, re]) => start >= rs && end <= re);
    } catch {
      return true;
    }
  };

  const canConfirm = useMemo(() => {
    if (!currentEnterprise?.email) return false;
    if (!items.length) return false;
    // require each item have date/time and employee and not be in the past
    const now = new Date();
    const toDate = (d, t) => new Date(`${d}T${t || "00:00"}:00`);
    return items.every((it) => {
      if (!it.date || !it.time || !it.employeeId) return false;
      try {
        const dt = toDate(it.date, it.time);
        if (dt.getTime() < now.getTime()) return false;
        return true;
      } catch {
        return false;
      }
    });
  }, [items, currentEnterprise]);

  const clientName = user?.name || "";
  const clientPhone = user?.phone || "";
  const clientEmail = user?.email || "";

  const confirmAll = async () => {
    if (!canConfirm) return;
    if (!clientName || !clientPhone) {
      showError(
        "Dados do cliente ausentes. Faça login ou cadastre nome e telefone no perfil."
      );
      return;
    }

    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      showError("Você precisa estar logado para confirmar o agendamento.");
      return;
    }

    // Garantir que o Firebase Auth esteja sincronizado
    try {
      await ensureFirebaseAuth();
      console.log(
        "✅ Firebase Auth verificado para confirmação de agendamento"
      );
    } catch (authError) {
      console.error("❌ Erro de autenticação:", authError);
      showError("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    const isValidEmail = (email) =>
      /.+@.+\..+/.test(String(email || "").trim());
    setSubmitting(true);
    try {
      for (const it of items) {
        // Validação local de expediente do funcionário
        if (!isWithinWorkHours(it)) {
          const dateObj = new Date(`${it.date}T00:00:00`);
          showError(
            `Este profissional não trabalha no horário ${formatDateBR(dateObj)} ${it.time}. Escolha outro horário.`
          );
          setSubmitting(false);
          return;
        }
        // Sanitize fields
        const productId = String(it.productId || "");
        const durationRaw = it.duration ?? it.productDuration;
        let durationMin = Number.parseInt(
          String(durationRaw ?? "").replace(/[^0-9]/g, ""),
          10
        );
        if (!Number.isFinite(durationMin) || durationMin <= 0) {
          durationMin = Number(it.duration) || Number(it.productDuration) || 30;
        }
        if (!Number.isFinite(durationMin) || durationMin <= 0) durationMin = 30;
        const priceCents =
          Number.parseInt(
            String(it.priceInCents ?? it.productPrice ?? 0),
            10
          ) || 0;
        const startTime = (it.time || "").slice(0, 5); // HH:MM

        // Pre-check de slots: só chama API se NÃO for sessão simples
        if (!isSimpleSession) {
          try {
            const slotsRes = await availabilityService.getEmployeeServiceSlots(
              it.employeeId,
              it.date,
              productId,
              currentEnterprise?.email
            );
            const slots = Array.isArray(slotsRes)
              ? slotsRes
              : Array.isArray(slotsRes?.data)
              ? slotsRes.data
              : Array.isArray(slotsRes?.slots)
              ? slotsRes.slots
              : [];
            const ok = slots.some(
              (s) =>
                (s.startTime || s.time) === startTime && (s.isAvailable ?? true)
            );
            if (!ok) {
              throw new Error("Horário ocupado ou fora do expediente");
            }
          } catch (preErr) {
            const msg =
              (typeof preErr === "object" &&
                (preErr.message || preErr.error || preErr.msg)) ||
              String(preErr || "");
            const m = msg.toLowerCase();
            const looksLikeSchedule =
              m.includes("ocupado") ||
              m.includes("expediente") ||
              m.includes("valida");
            if (looksLikeSchedule) {
              const empLabel =
                it.employeeName || it.employeeId || "funcionário";
              const dateObj = new Date(`${it.date}T00:00:00`);
              showError(
                `O horário ${formatDateBR(dateObj)} ${startTime} com ${empLabel} não está disponível: ${msg}.\nEdite o item e escolha outro horário.`
              );
              setSubmitting(false);
              return;
            }
          }
        }

        const payload = {
          enterpriseEmail: currentEnterprise.email,
          clientName,
          clientPhone,
          productId,
          productName: it.serviceName,
          productDuration: durationMin,
          productPrice: priceCents,
          date: it.date,
          startTime,
          // Backend pode esperar employeeEmail; nosso employeeId é o e-mail do funcionário
          employeeEmail: it.employeeId || undefined,
          employeeId: it.employeeId || undefined,
          employeeName: it.employeeName || undefined,
          staffId: it.employeeId || undefined,
          staffName: it.employeeName || undefined,
          notes: it.notes
            ? `${it.notes} | pagamento: ${paymentMethod}`
            : `pagamento: ${paymentMethod}`,
        };
        if (isValidEmail(clientEmail)) payload.clientEmail = clientEmail;
        // Criação: em sessão simples, ir direto ao Firestore; caso contrário, tenta API e cai para Firestore quando fizer sentido
        if (isSimpleSession) {
          console.log(
            "🔍 [Cart] Sessão simples - criando no Firestore diretamente"
          );
          console.log("🔍 [Cart] Payload para Firestore:", payload);
          try {
            const result = await enterpriseBookingFirestoreService.create(
              currentEnterprise.email,
              payload
            );
            console.log("✅ [Cart] Agendamento criado no Firestore:", result);
          } catch (fbErr) {
            console.error("❌ [Cart] Erro ao criar no Firestore:", fbErr);
            const m2 = (
              (typeof fbErr === "object" &&
                (fbErr.message || fbErr.error || fbErr.msg)) ||
              String(fbErr || "")
            ).toLowerCase();
            if (
              fbErr?.code === "conflict" ||
              m2.includes("conflit") ||
              m2.includes("ocupado")
            ) {
              const empLabel =
                it.employeeName || it.employeeId || "funcionário";
              const dateObj = new Date(`${it.date}T00:00:00`);
              showError(
                `O horário ${formatDateBR(dateObj)} ${startTime} com ${empLabel} não está disponível. Edite o item e escolha outro horário.`
              );
              setSubmitting(false);
              return;
            }
            throw fbErr;
          }
        } else {
          // Tenta criar via API; se falhar, decide se cai para Firestore
          try {
            await bookingService.createBooking(payload);
          } catch {
            // Independente da mensagem da API, tentar fallback para Firestore; só bloquear se Firestore acusar conflito
            try {
              await enterpriseBookingFirestoreService.create(
                currentEnterprise.email,
                payload
              );
            } catch (fbErr) {
              const m2 = (
                (typeof fbErr === "object" &&
                  (fbErr.message || fbErr.error || fbErr.msg)) ||
                String(fbErr || "")
              ).toLowerCase();
              if (
                fbErr?.code === "conflict" ||
                m2.includes("conflit") ||
                m2.includes("ocupado")
              ) {
                const empLabel =
                  it.employeeName || it.employeeId || "funcionário";
                const dateObj = new Date(`${it.date}T00:00:00`);
                showError(
                  `O horário ${formatDateBR(dateObj)} ${startTime} com ${empLabel} não está disponível. Edite o item e escolha outro horário.`
                );
                setSubmitting(false);
                return;
              }
              throw fbErr;
            }
          }
        }
      }
      console.log(
        "✅ [Cart] Todos os agendamentos foram processados com sucesso"
      );
      clear();
      showSuccess("Agendamentos confirmados!");
    } catch (e) {
      console.error(e);
      const msg =
        (typeof e === "object" && (e.message || e.error || e.msg)) || String(e);
      showError(`Falha ao confirmar: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatItemLine = (it) => {
    const emp = employees.find((e) => String(e.id) === String(it.employeeId));
    const empName = it.employeeName || emp?.name || "";
    
    let when = "Sem data/hora";
    if (it.date && it.time) {
      const dateObj = new Date(`${it.date}T00:00:00`);
      when = `${formatDateBR(dateObj)} ${it.time}`;
    }
    
    return `${empName ? empName + " • " : ""}${when}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to={getEnterpriseUrl("")}>
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Carrinho</h1>
        <button
          className="text-red-600 font-medium"
          onClick={clear}
          disabled={!items.length}
        >
          Esvaziar
        </button>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Itens */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-gray-600">Seu carrinho está vazio.</div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="p-4 bg-gray-50 rounded-xl flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {it.serviceName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatItemLine(it)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Number(it.duration) || 30} min
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 mr-2">
                    {formatPrice(Number(it.priceInCents) || 0)}
                  </div>
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    onClick={() => onEdit(it)}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => removeItem(it.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagamento */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">
            Forma de pagamento
          </h3>
          <div className="flex gap-4">
            {[
              { key: "card", label: "Cartão" },
              { key: "pix", label: "Pix" },
              { key: "cash", label: "Dinheiro físico" },
            ].map((opt) => (
              <label
                key={opt.key}
                className={`px-3 py-2 rounded-lg border cursor-pointer ${
                  paymentMethod === opt.key
                    ? "border-blue-600 text-blue-700"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.key}
                  checked={paymentMethod === opt.key}
                  onChange={() => setPaymentMethod(opt.key)}
                  className="mr-2"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Total + Confirmar */}
        <div className="flex items-center justify-between">
          <div className="text-gray-700">
            Total: <span className="font-bold">{formatPrice(subtotal)}</span>
          </div>
          <button
            onClick={confirmAll}
            disabled={!canConfirm || submitting}
            className={`px-5 py-3 rounded-lg font-semibold ${
              canConfirm && !submitting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {submitting ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </div>
      </div>

      {/* Edit Overlay (reuse BookingOverlay) */}
      {editingItem && (
        <BookingOverlay
          open={true}
          onClose={() => setEditingItem(null)}
          product={{
            id: editingItem.productId,
            name: editingItem.serviceName,
            duration: editingItem.duration,
            priceInCents: editingItem.priceInCents,
          }}
          employees={employees}
          mode="edit"
          initialSelection={{
            employeeId: editingItem.employeeId,
            date: editingItem.date,
            time: editingItem.time,
          }}
          onSave={onSaveEdit}
        />
      )}
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

export default Cart;
