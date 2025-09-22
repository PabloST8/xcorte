import {
  formatPrice,
  formatDuration,
  parseDuration,
  parsePrice,
  BOOKING_STATUS,
} from "../types/api.js";
import { formatDateBR } from "./dateUtils";

// Utilitários para conversão entre formatos antigos e API
export const DataAdapters = {
  // Converte serviço do formato antigo para API
  serviceToAPI: (oldService) => {
    return {
      id: oldService.id?.toString() || "",
      name: oldService.name || "",
      price:
        typeof oldService.price === "string"
          ? parsePrice(oldService.price)
          : oldService.price || 0,
      duration:
        typeof oldService.duration === "string"
          ? parseDuration(oldService.duration)
          : oldService.duration || 0,
      description: oldService.description || "",
      category: oldService.category || "",
      isActive: oldService.isActive ?? true,
      createdAt: oldService.createdAt || new Date().toISOString(),
      updatedAt: oldService.updatedAt || new Date().toISOString(),
    };
  },

  // Converte serviço da API para display
  serviceFromAPI: (apiService) => {
    return {
      id: apiService.id,
      name: apiService.name,
      price: formatPrice(apiService.price),
      duration: formatDuration(apiService.duration),
      priceRaw: apiService.price,
      durationRaw: apiService.duration,
      description: apiService.description,
      category: apiService.category,
      isActive: apiService.isActive,
    };
  },

  // Converte agendamento do formato antigo para API
  bookingToAPI: (oldBooking) => {
    return {
      id: oldBooking.id?.toString() || "",
      enterpriseEmail: oldBooking.enterpriseEmail || "test@empresa.com",
      clientName: oldBooking.clientName || "",
      clientPhone: oldBooking.clientPhone || "",
      clientEmail: oldBooking.clientEmail || "",
      productId:
        oldBooking.productId?.toString() ||
        oldBooking.serviceId?.toString() ||
        "",
      productName: oldBooking.productName || oldBooking.service || "",
      productDuration:
        oldBooking.productDuration ||
        (typeof oldBooking.duration === "string"
          ? parseDuration(oldBooking.duration)
          : oldBooking.duration) ||
        30,
      productPrice:
        oldBooking.productPrice ||
        (typeof oldBooking.price === "string"
          ? parsePrice(oldBooking.price)
          : oldBooking.price * 100) ||
        3000,
      date: oldBooking.date || new Date().toISOString().split("T")[0],
      startTime: oldBooking.startTime || oldBooking.time || "09:00",
      endTime: oldBooking.endTime || "09:30",
      status:
        (() => {
          if (!oldBooking.status) return BOOKING_STATUS.AGENDADO;
          const legacyMap = {
            pending: BOOKING_STATUS.AGENDADO,
            confirmed: BOOKING_STATUS.CONFIRMADO,
            completed: BOOKING_STATUS.CONCLUIDO,
            cancelled: BOOKING_STATUS.CANCELADO,
            canceled: BOOKING_STATUS.CANCELADO,
          };
            const normalized = legacyMap[oldBooking.status] || oldBooking.status;
            return Object.values(BOOKING_STATUS).includes(normalized)
              ? normalized
              : BOOKING_STATUS.AGENDADO;
        })(),
      notes: oldBooking.notes || "",
      createdAt: oldBooking.createdAt || new Date().toISOString(),
      updatedAt: oldBooking.updatedAt || new Date().toISOString(),
    };
  },

  // Converte agendamento da API para display
  bookingFromAPI: (apiBooking) => {
    return {
      id: apiBooking.id,
      clientName: apiBooking.clientName,
      clientPhone: apiBooking.clientPhone,
      clientEmail: apiBooking.clientEmail,
      productName: apiBooking.productName,
      productPrice: formatPrice(apiBooking.productPrice),
      productPriceRaw: apiBooking.productPrice,
      productDuration: formatDuration(apiBooking.productDuration),
      productDurationRaw: apiBooking.productDuration,
      date: apiBooking.date,
      startTime: apiBooking.startTime,
      endTime: apiBooking.endTime,
      status: apiBooking.status,
      statusLabel: getStatusLabel(apiBooking.status),
      notes: apiBooking.notes,
      createdAt: apiBooking.createdAt,
    };
  },

  // Converte funcionário do formato antigo para API
  employeeToAPI: (oldEmployee) => {
    return {
      id: oldEmployee.id?.toString() || "",
      name: oldEmployee.name || "",
      email: oldEmployee.email || "",
      phone: oldEmployee.phone || "",
      specialty: oldEmployee.specialty || "",
      isActive: oldEmployee.isActive ?? true,
      createdAt: oldEmployee.createdAt || new Date().toISOString(),
      updatedAt: oldEmployee.updatedAt || new Date().toISOString(),
    };
  },

  // Converte funcionário da API para display
  employeeFromAPI: (apiEmployee) => {
    return {
      id: apiEmployee.id,
      name: apiEmployee.name,
      email: apiEmployee.email,
      phone: apiEmployee.phone,
      specialty: apiEmployee.specialty,
      isActive: apiEmployee.isActive,
      rating: apiEmployee.rating || 0,
      image: apiEmployee.image || "",
      experience: apiEmployee.experience || "",
      description: apiEmployee.description || "",
    };
  },

  // TimeSlot para API
  timeSlotToAPI: (timeSlot) => {
    return {
      startTime: timeSlot.startTime || timeSlot.time || "",
      endTime: timeSlot.endTime || "",
      isAvailable: timeSlot.isAvailable ?? timeSlot.available ?? true,
      bookingId: timeSlot.bookingId || "",
    };
  },

  // TimeSlot da API
  timeSlotFromAPI: (apiTimeSlot) => {
    return {
      startTime: apiTimeSlot.startTime,
      endTime: apiTimeSlot.endTime,
      isAvailable: apiTimeSlot.isAvailable,
      bookingId: apiTimeSlot.bookingId,
      // Campos para compatibilidade
      time: apiTimeSlot.startTime,
      available: apiTimeSlot.isAvailable,
    };
  },
};

// Labels para status
function getStatusLabel(status) {
  const legacy = {
    pending: BOOKING_STATUS.AGENDADO,
    confirmed: BOOKING_STATUS.CONFIRMADO,
    completed: BOOKING_STATUS.CONCLUIDO,
    cancelled: BOOKING_STATUS.CANCELADO,
    canceled: BOOKING_STATUS.CANCELADO,
  };
  const normalized = legacy[status] || status;
  const labels = {
    [BOOKING_STATUS.AGENDADO]: "Agendado",
    [BOOKING_STATUS.CONFIRMADO]: "Confirmado",
    [BOOKING_STATUS.CANCELADO]: "Cancelado",
    [BOOKING_STATUS.CONCLUIDO]: "Concluído",
  };
  return labels[normalized] || "Desconhecido";
}

// Validadores
export const Validators = {
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidPhone: (phone) => {
    return /^\d{10,11}$/.test(phone.replace(/\D/g, ""));
  },

  isValidDate: (dateString) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  },

  isValidTime: (timeString) => {
    return /^\d{2}:\d{2}$/.test(timeString);
  },

  isValidStatus: (status) => {
    return Object.values(BOOKING_STATUS).includes(status);
  },
};

// Helpers para datas
export const DateHelpers = {
  formatToAPI: (date) => {
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  },

  formatToDisplay: (dateString) => {
    return formatDateBR(dateString);
  },

  isToday: (dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString === today;
  },

  isFuture: (dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString > today;
  },

  isPast: (dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString < today;
  },
};

export default DataAdapters;
