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

export const enterpriseBookingFirestoreService = {
  async list(enterpriseEmail, params = {}) {
    if (!enterpriseEmail) return [];

    console.log('🔍 enterpriseBookingFirestoreService.list called with:', {
      enterpriseEmail,
      params
    });

    const { date, status } = params;
    let q = bookingsRef(enterpriseEmail);
    const constraints = [];
    if (
      date &&
      date !== "all" &&
      !["today", "tomorrow", "week", "month"].includes(date)
    ) {
      constraints.push(where("date", "==", date));
    }
    if (status) {
      constraints.push(
        where("status", "==", STATUS_CANONICAL[status] || status)
      );
    }
    if (constraints.length) {
      q = query(q, ...constraints);
    }
    
    console.log('🔍 Querying Firestore path: enterprises/' + enterpriseEmail + '/bookings');
    const snap = await getDocs(q);
    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    console.log('🔍 Raw Firestore bookings found:', data.length);
    console.log('🔍 Raw Firestore bookings data:', data);

    // Filtros especiais (today, tomorrow, week, month) aplicados client-side
    const todayStr = new Date().toISOString().split("T")[0];
    if (date === "today") {
      data = data.filter((b) => b.date === todayStr);
    } else if (date === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tStr = tomorrow.toISOString().split("T")[0];
      data = data.filter((b) => b.date === tStr);
    } else if (date === "week") {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 3);
      const end = new Date();
      end.setDate(today.getDate() + 3);
      data = data.filter(
        (b) =>
          b.date >= start.toISOString().split("T")[0] &&
          b.date <= end.toISOString().split("T")[0]
      );
    } else if (date === "month") {
      const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
      data = data.filter((b) => b.date.startsWith(monthPrefix));
    } else if (date === "upcoming") {
      data = data.filter((b) => b.date >= todayStr);
    }

    // Search (clientName) client-side
    if (params.search) {
      const term = params.search.toLowerCase();
      data = data.filter((b) =>
        (b.clientName || "").toLowerCase().includes(term)
      );
    }

    // Normalizar campos ausentes para compatibilidade com UI
    const result = data.map((b) => ({
      ...b,
      price: b.productPrice ?? b.price ?? 0,
      serviceName: b.productName,
      time: b.startTime,
      staffName: b.staffName || "",
    }));

    return result;
  },

  async create(enterpriseEmail, bookingData) {
    const now = new Date().toISOString();
    const parseTime = (t) => {
      const [h, m] = (t || "00:00").split(":").map(Number);
      return h * 60 + m;
    };
    const formatTime = (mins) =>
      `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
        mins % 60
      ).padStart(2, "0")}`;
    const payload = {
      clientName: bookingData.clientName || "",
      clientEmail: bookingData.clientEmail || "",
      clientPhone: bookingData.clientPhone || "",
      productId: bookingData.productId || "",
      productName: bookingData.productName || bookingData.serviceName || "",
      productPrice: bookingData.productPrice ?? bookingData.price ?? 0,
      productDuration:
        bookingData.productDuration ?? bookingData.duration ?? 30,
      date: bookingData.date || now.split("T")[0],
      startTime: bookingData.startTime || bookingData.time || "09:00",
      endTime: bookingData.endTime || null, // calculada abaixo
      status: STATUS_CANONICAL[bookingData.status] || "scheduled",
      notes: bookingData.notes || "",
      staffName: bookingData.staffName || "",
      employeeId: bookingData.employeeId || bookingData.staffId || "",
      enterpriseEmail,
      createdAt: now,
      updatedAt: now,
    };
    // Calcular endTime correto
    const startM = parseTime(payload.startTime);
    const endM = startM + (payload.productDuration || 30);
    payload.endTime = formatTime(endM);

    // Verificar conflito simples (mesmo funcionário / mesmo dia / sobreposição)
    if (payload.employeeId) {
      try {
        const qConflict = query(
          bookingsRef(enterpriseEmail),
          where("date", "==", payload.date),
          where("employeeId", "==", payload.employeeId)
        );
        const snap = await getDocs(qConflict);
        const overlap = snap.docs.some((d) => {
          const b = d.data();
          const bStart = parseTime(b.startTime);
          const bDur = b.productDuration || 30;
          let bEnd = b.endTime ? parseTime(b.endTime) : bStart + bDur;
          if (bEnd < bStart) bEnd = bStart + bDur; // corrige dados antigos
          return startM < bEnd && endM > bStart;
        });
        if (overlap) {
          throw {
            code: "conflict",
            message: "Horário já ocupado para este profissional.",
          };
        }
      } catch (confErr) {
        if (confErr?.code === "conflict") throw confErr;
        // silencia outros erros de verificação (segue criação)
      }
    }

    console.log("💾 Firestore payload preparado:", payload);

    const ref = await addDoc(bookingsRef(enterpriseEmail), payload);
    const result = { id: ref.id, ...payload };

    return result;
  },

  async updateStatus(enterpriseEmail, bookingId, status) {
    const ref = doc(db, "enterprises", enterpriseEmail, "bookings", bookingId);
    await updateDoc(ref, {
      status: STATUS_CANONICAL[status] || status,
      updatedAt: new Date().toISOString(),
    });
    return true;
  },
  async remove(enterpriseEmail, bookingId) {
    const ref = doc(db, "enterprises", enterpriseEmail, "bookings", bookingId);
    await deleteDoc(ref);
    return true;
  },
};
