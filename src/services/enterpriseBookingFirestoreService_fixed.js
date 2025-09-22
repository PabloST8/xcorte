// Agendamentos em subcoleção: enterprises/{enterpriseEmail}/bookings
// Campos principais: clientName, clientEmail, clientPhone, productId, productName,
// productPrice (centavos), productDuration (min), date (YYYY-MM-DD), startTime, endTime,
// status (scheduled|confirmed|in_progress|completed|cancelled|no_show), notes, createdAt, updatedAt
import { db, auth } from "./firebase";
import { memoryStore } from "./memoryStore";
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
  if (auth.currentUser) {
    return auth.currentUser;
  }

  console.log(
    "⚠️ Firebase Auth não disponível para agendamentos. Usando dados locais."
  );
  return null; // Indicar que Firebase Auth não está disponível
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

// Fallback em memória (sem localStorage)
const STORAGE_PREFIX = "xcorte_bookings_";

function getLocalStorageKey(enterpriseEmail) {
  return `${STORAGE_PREFIX}${enterpriseEmail}`;
}

function getBookingsFromMemory(enterpriseEmail) {
  try {
    const stored = memoryStore.get(getLocalStorageKey(enterpriseEmail));
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn(
      "Erro ao carregar agendamentos do fallback em memória:",
      error
    );
    return [];
  }
}

function saveBookingsToMemory(enterpriseEmail, bookings) {
  try {
    memoryStore.set(
      getLocalStorageKey(enterpriseEmail),
      JSON.stringify(bookings)
    );
    return true;
  } catch (error) {
    console.error("Erro ao salvar agendamentos no fallback em memória:", error);
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

    // Tentar Firebase primeiro, fallback em memória
    const firebaseUser = await ensureFirebaseAuth();

    if (!firebaseUser) {
      console.log("📦 Carregando agendamentos do fallback em memória");
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      return filterBookingsLocally(localBookings, params);
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
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      return filterBookingsLocally(localBookings, params);
    }
  },

  async create(enterpriseEmail, bookingData) {
    const firebaseUser = await ensureFirebaseAuth();

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
      createdAt: now,
      updatedAt: now,
    };

    // Função para verificar conflito
    const hasConflict = (bookings, staffId, date, startTime) => {
      return bookings.some(
        (b) =>
          String(b.staffId) === String(staffId) &&
          String(b.date) === String(date) &&
          String(b.startTime) === String(startTime)
      );
    };

    if (!firebaseUser) {
      // Usar fallback em memória
      console.log("📦 Salvando agendamento no fallback em memória");
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      if (
        hasConflict(
          localBookings,
          payload.staffId,
          payload.date,
          payload.startTime
        )
      ) {
        throw new Error(
          "Já existe um agendamento para este profissional neste horário."
        );
      }
      const newBooking = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...payload,
      };
      localBookings.push(newBooking);
      saveBookingsToMemory(enterpriseEmail, localBookings);
      return newBooking;
    }

    try {
      // Buscar conflitos no Firestore
      const { query, where, getDocs } = await import("firebase/firestore");
      const q = query(
        bookingsRef(enterpriseEmail),
        where("staffId", "==", payload.staffId),
        where("date", "==", payload.date),
        where("startTime", "==", payload.startTime)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error(
          "Já existe um agendamento para este profissional neste horário."
        );
      }
      console.log("💾 Firestore payload preparado:", payload);
      const ref = await addDoc(bookingsRef(enterpriseEmail), payload);
      return { id: ref.id, ...payload };
    } catch (error) {
      console.warn(
        "⚠️ Firestore falhou, salvando no fallback em memória:",
        error
      );
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      if (
        hasConflict(
          localBookings,
          payload.staffId,
          payload.date,
          payload.startTime
        )
      ) {
        throw new Error(
          "Já existe um agendamento para este profissional neste horário."
        );
      }
      const newBooking = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...payload,
      };
      localBookings.push(newBooking);
      saveBookingsToMemory(enterpriseEmail, localBookings);
      return newBooking;
    }
  },

  async updateStatus(enterpriseEmail, bookingId, status) {
    const firebaseUser = await ensureFirebaseAuth();

    if (!firebaseUser || bookingId.startsWith("local_")) {
      // Usar fallback em memória
      console.log("📦 Atualizando status no fallback em memória");
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
        "⚠️ Firestore falhou para updateStatus, usando fallback em memória:",
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
      // Usar fallback em memória
      console.log("📦 Removendo agendamento do fallback em memória");
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
        "⚠️ Firestore falhou para remove, usando fallback em memória:",
        error
      );
      const localBookings = getBookingsFromMemory(enterpriseEmail);
      const filteredBookings = localBookings.filter((b) => b.id !== bookingId);
      saveBookingsToMemory(enterpriseEmail, filteredBookings);
      return true;
    }
  },
};
