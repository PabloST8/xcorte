// Agendamentos em subcoleção: enterprises/{enterpriseEmail}/bookings
// Campos principais: clientName, clientEmail, clientPhone, productId, productName,
// productPrice (centavos), productDuration (min), date (YYYY-MM-DD), startTime, endTime,
// status (scheduled|confirmed|in_progress|completed|cancelled|no_show), notes, createdAt, updatedAt
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

// Função para garantir que o usuário esteja autenticado no Firebase Auth
async function ensureFirebaseAuth() {
  // Para agendamentos, vamos usar Firestore direto sem Firebase Auth
  // já que o usuário está autenticado no contexto da aplicação
  console.log(
    "🔍 Usando Firestore direto para agendamentos (sem Firebase Auth)"
  );
  return { uid: "app-user" }; // Simular user para usar Firestore
}

function bookingsRef(email) {
  return collection(db, "enterprises", email, "bookings");
}

// Map de status UI -> internos (mantemos igual por enquanto)
const STATUS_CANONICAL = {
  scheduled: "scheduled",
  confirmed: "confirmed",
  in_progress: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
  no_show: "no_show",
};

// Fallback em memória para desenvolvimento (no localStorage)
import { memoryStore } from "./memoryStore";
const STORAGE_PREFIX = "xcorte_bookings_";

function getMemKey(enterpriseEmail) {
  return `${STORAGE_PREFIX}${enterpriseEmail}`;
}

function getBookingsFromMemory(enterpriseEmail) {
  try {
    const raw = memoryStore.get(getMemKey(enterpriseEmail));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Erro ao carregar agendamentos em memória:", error);
    return [];
  }
}

function saveBookingsToMemory(enterpriseEmail, bookings) {
  try {
    memoryStore.set(getMemKey(enterpriseEmail), JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.error("Erro ao salvar agendamentos em memória:", error);
    return false;
  }
}

function filterBookingsLocally(bookings, params = {}) {
  const { date, status, search } = params;
  let filtered = [...bookings];

  // Filtro por data
  if (date && date !== "all") {
    const todayStr = new Date().toISOString().split("T")[0];

    if (date === "today") {
      filtered = filtered.filter((b) => b.date === todayStr);
    } else if (date === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      filtered = filtered.filter((b) => b.date === tomorrowStr);
    } else if (date === "week") {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 3);
      const end = new Date();
      end.setDate(today.getDate() + 3);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      filtered = filtered.filter((b) => b.date >= startStr && b.date <= endStr);
    } else if (date === "month") {
      const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
      filtered = filtered.filter((b) => b.date.startsWith(monthPrefix));
    } else if (date === "upcoming") {
      filtered = filtered.filter((b) => b.date >= todayStr);
    } else if (
      !["today", "tomorrow", "week", "month", "upcoming"].includes(date)
    ) {
      // Data específica
      filtered = filtered.filter((b) => b.date === date);
    }
  }

  // Filtro por status
  if (status && status !== "all") {
    filtered = filtered.filter(
      (b) => b.status === (STATUS_CANONICAL[status] || status)
    );
  }

  // Filtro por busca
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((b) =>
      (b.clientName || "").toLowerCase().includes(term)
    );
  }

  // Normalizar campos para compatibilidade
  return filtered
    .map((b) => ({
      ...b,
      price: b.productPrice ?? b.price ?? 0,
      serviceName: b.productName,
      time: b.startTime,
      staffName: b.staffName || "",
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const enterpriseBookingFirestoreService = {
  async list(enterpriseEmail, params = {}) {
    if (!enterpriseEmail) return [];

    console.log("🔍 enterpriseBookingFirestoreService.list called with:", {
      enterpriseEmail,
      params,
    });

    // Tentar Firebase primeiro, memória como fallback em dev
    const firebaseUser = await ensureFirebaseAuth();

    if (!firebaseUser) {
      console.log("📦 Carregando agendamentos do fallback em memória");
      const mem = getBookingsFromMemory(enterpriseEmail);
      return filterBookingsLocally(mem, params);
    }

    try {
      const { date, status } = params;
      let q = bookingsRef(enterpriseEmail);
      const constraints = [];

      if (
        date &&
        date !== "all" &&
        !["today", "tomorrow", "week", "month", "upcoming"].includes(date)
      ) {
        constraints.push(where("date", "==", date));
      }
      if (status && status !== "all") {
        constraints.push(
          where("status", "==", STATUS_CANONICAL[status] || status)
        );
      }
      if (constraints.length) {
        q = query(q, ...constraints);
      }

      console.log(
        "🔍 Querying Firestore path: enterprises/" +
          enterpriseEmail +
          "/bookings"
      );
      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      console.log("🔍 Raw Firestore bookings found:", data.length);

      // Aplicar filtros especiais client-side
      return filterBookingsLocally(data, params);
    } catch (error) {
      console.warn("⚠️ Firestore falhou, usando fallback em memória:", error);
      const mem = getBookingsFromMemory(enterpriseEmail);
      return filterBookingsLocally(mem, params);
    }
  },

  async create(enterpriseEmail, bookingData) {
    console.log("🔍 [enterpriseBookingFirestore] create chamado:", {
      enterpriseEmail,
      bookingData,
    });

    const firebaseUser = await ensureFirebaseAuth();
    console.log(
      "🔍 [enterpriseBookingFirestore] Firebase Auth resultado:",
      firebaseUser ? "disponível" : "não disponível"
    );

    const now = new Date().toISOString();
    const parseTime = (t) => {
      if (!t) return "09:00";
      if (typeof t === "string" && t.includes(":")) return t;
      return "09:00";
    };

    const startTime = parseTime(bookingData.startTime || bookingData.time);
    const endTime = parseTime(bookingData.endTime);

    const payload = {
      clientName: String(bookingData.clientName || "").trim(),
      clientEmail: String(bookingData.clientEmail || "").trim(),
      clientPhone: String(bookingData.clientPhone || "").replace(/\D/g, ""),
      productId: String(bookingData.productId || bookingData.serviceId || ""),
      productName: String(
        bookingData.productName || bookingData.serviceName || ""
      ),
      productPrice: Number(bookingData.productPrice || bookingData.price || 0),
      productDuration: Number(
        bookingData.productDuration || bookingData.duration || 60
      ),
      date: String(bookingData.date || ""),
      startTime,
      endTime,
      status: STATUS_CANONICAL[bookingData.status] || "scheduled",
      notes: String(bookingData.notes || "").trim(),
      staffName: String(bookingData.staffName || "").trim(),
      staffId: String(bookingData.staffId || "").trim(),
      employeeId: String(
        bookingData.employeeId || bookingData.staffId || ""
      ).trim(),
      createdAt: now,
      updatedAt: now,
    };

    console.log("🔍 [enterpriseBookingFirestore] Payload preparado:", payload);

    // ⚠️ VERIFICAÇÃO DE CONFLITOS ⚠️
    console.log("🔍 Verificando conflitos de agendamento...");
    const conflictCheck = await checkBookingConflict(enterpriseEmail, payload);
    console.log(
      "🔍 [enterpriseBookingFirestore] Resultado verificação de conflitos:",
      conflictCheck
    );

    if (conflictCheck.hasConflict) {
      console.error(
        "❌ [enterpriseBookingFirestore] Conflito detectado:",
        conflictCheck
      );
      const error = new Error(
        `Conflito de agendamento: ${conflictCheck.reason}`
      );
      error.type = "BOOKING_CONFLICT";
      error.conflictDetails = conflictCheck.conflictingBooking;
      throw error;
    }

    console.log(
      "� [enterpriseBookingFirestore] Sempre usando Firestore direto"
    );

    try {
      console.log(
        "💾 [enterpriseBookingFirestore] Tentando salvar no Firestore..."
      );
      console.log(
        "💾 [enterpriseBookingFirestore] Firestore payload:",
        payload
      );
      const ref = await addDoc(bookingsRef(enterpriseEmail), payload);
      const savedBooking = { id: ref.id, ...payload };
      console.log(
        "✅ [enterpriseBookingFirestore] Agendamento salvo no Firestore:",
        savedBooking
      );
      return savedBooking;
    } catch (error) {
      console.error(
        "❌ [enterpriseBookingFirestore] Erro ao salvar no Firestore:",
        error
      );
      throw error; // Propagar o erro em vez de usar fallback
    }
  },

  async updateStatus(enterpriseEmail, bookingId, status) {
    const firebaseUser = await ensureFirebaseAuth();

    if (!firebaseUser || bookingId.startsWith("local_")) {
      // Usar memória
      console.log("📦 Atualizando status no fallback de memória");
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      const bookingIndex = localBookings.findIndex((b) => b.id === bookingId);
      if (bookingIndex >= 0) {
        localBookings[bookingIndex].status = STATUS_CANONICAL[status] || status;
        localBookings[bookingIndex].updatedAt = new Date().toISOString();
        saveBookingsToMemory(enterpriseEmail, localBookings);
      }
      return true;
    }

    try {
      const ref = doc(
        db,
        "enterprises",
        enterpriseEmail,
        "bookings",
        bookingId
      );
      await updateDoc(ref, {
        status: STATUS_CANONICAL[status] || status,
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.warn(
        "⚠️ Firestore falhou para updateStatus, usando fallback de memória:",
        error
      );
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      const bookingIndex = localBookings.findIndex((b) => b.id === bookingId);
      if (bookingIndex >= 0) {
        localBookings[bookingIndex].status = STATUS_CANONICAL[status] || status;
        localBookings[bookingIndex].updatedAt = new Date().toISOString();
        saveBookingsToMemory(enterpriseEmail, localBookings);
      }
      return true;
    }
  },

  async remove(enterpriseEmail, bookingId) {
    const firebaseUser = await ensureFirebaseAuth();

    if (!firebaseUser || bookingId.startsWith("local_")) {
      // Usar memória
      console.log("📦 Removendo agendamento do fallback de memória");
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      const filteredBookings = localBookings.filter((b) => b.id !== bookingId);
      saveBookingsToMemory(enterpriseEmail, filteredBookings);
      return true;
    }

    try {
      const ref = doc(
        db,
        "enterprises",
        enterpriseEmail,
        "bookings",
        bookingId
      );
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.warn(
        "⚠️ Firestore falhou para remove, usando fallback de memória:",
        error
      );
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      const filteredBookings = localBookings.filter((b) => b.id !== bookingId);
      saveBookingsToMemory(enterpriseEmail, filteredBookings);
      return true;
    }
  },
};

// Função para verificar conflitos de agendamento (definida após o objeto principal)
async function checkBookingConflict(enterpriseEmail, newBooking) {
  try {
    const { date, startTime, employeeId, productDuration } = newBooking;

    if (!date || !startTime || !employeeId || !productDuration) {
      return {
        hasConflict: false,
        reason: "Dados insuficientes para verificação",
      };
    }

    // Buscar agendamentos do mesmo dia
    const existingBookings = await enterpriseBookingFirestoreService.list(
      enterpriseEmail,
      { date }
    );

    // Converter horários para minutos para facilitar comparação
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = parseTime(startTime);
    const newEnd = newStart + Number(productDuration);

    // Status que bloqueiam horários (não incluir cancelled, no_show, completed)
    const blockingStatuses = [
      "scheduled",
      "confirmed",
      "in_progress",
      "agendado",
      "confirmado",
    ];

    for (const booking of existingBookings) {
      // Verificar apenas agendamentos do mesmo funcionário com status ativo
      if (
        String(booking.employeeId) === String(employeeId) &&
        (!booking.status ||
          blockingStatuses.includes(booking.status.toLowerCase()))
      ) {
        const existingStart = parseTime(booking.startTime);
        const existingDuration = Number(
          booking.productDuration || booking.duration || 30
        );
        const existingEnd = existingStart + existingDuration;

        // Verificar sobreposição: novo agendamento sobrepõe com existente
        if (newStart < existingEnd && newEnd > existingStart) {
          return {
            hasConflict: true,
            reason: `Conflito com agendamento existente às ${booking.startTime} (${booking.productName})`,
            conflictingBooking: {
              id: booking.id,
              startTime: booking.startTime,
              productName: booking.productName,
              clientName: booking.clientName,
              status: booking.status,
            },
          };
        }
      }
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("Erro ao verificar conflito de agendamento:", error);
    return { hasConflict: false, reason: "Erro na verificação de conflito" };
  }
}
