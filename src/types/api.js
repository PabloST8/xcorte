// Tipos para o sistema de agendamento conforme API

export const ProductSchema = {
  id: String,
  name: String,
  price: Number, // em centavos (ex: 3000 = R$ 30,00)
  duration: Number, // em minutos
  description: String,
  category: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
};

export const BookingSchema = {
  id: String,
  enterpriseEmail: String,
  clientName: String,
  clientPhone: String,
  clientEmail: String,
  productId: String,
  productName: String,
  productDuration: Number,
  productPrice: Number,
  date: String, // YYYY-MM-DD
  startTime: String, // HH:MM
  endTime: String, // HH:MM
  status: String, // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: String,
  createdAt: Date,
  updatedAt: Date,
};

export const TimeSlotSchema = {
  startTime: String,
  endTime: String,
  isAvailable: Boolean,
  bookingId: String,
};

export const ScheduleSchema = {
  id: String,
  name: String,
  timeZone: String,
  availability: Array,
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date,
};

export const EnterpriseSchema = {
  email: String,
  name: String,
  phone: String,
  address: String,
  createdAt: Date,
  updatedAt: Date,
};

// Interfaces JavaScript (objetos modelo)
export const Product = {
  id: "",
  name: "",
  price: 0, // centavos
  duration: 0, // minutos
  description: "",
  category: "",
  isActive: true,
  createdAt: null,
  updatedAt: null,
};

export const Booking = {
  id: "",
  enterpriseEmail: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  productId: "",
  productName: "",
  productDuration: 0,
  productPrice: 0,
  date: "", // YYYY-MM-DD
  startTime: "", // HH:MM
  endTime: "", // HH:MM
  status: "pending", // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: "",
  createdAt: null,
  updatedAt: null,
};

export const TimeSlot = {
  startTime: "",
  endTime: "",
  isAvailable: true,
  bookingId: "",
};

export const Schedule = {
  id: "",
  name: "",
  timeZone: "",
  availability: [],
  isDefault: false,
  createdAt: null,
  updatedAt: null,
};

export const Enterprise = {
  email: "",
  name: "",
  phone: "",
  address: "",
  createdAt: null,
  updatedAt: null,
};

// Utilitários para horários
export const AvailabilityCheck = {
  date: "",
  enterpriseEmail: "",
  duration: 0, // em minutos
};

export const AvailableSlot = {
  startTime: "",
  endTime: "",
  duration: 0,
};

// Status válidos para Booking
// Status conforme novo backend (Português) + mapa de compatibilidade
export const BOOKING_STATUS = {
  AGENDADO: "agendado",
  CONFIRMADO: "confirmado",
  CANCELADO: "cancelado",
  CONCLUIDO: "concluido",
};

// Mapa para aceitar valores antigos e convertê-los ao novo padrão
export const LEGACY_STATUS_MAP = {
  pending: BOOKING_STATUS.AGENDADO,
  confirmed: BOOKING_STATUS.CONFIRMADO,
  cancelled: BOOKING_STATUS.CANCELADO,
  canceled: BOOKING_STATUS.CANCELADO,
  completed: BOOKING_STATUS.CONCLUIDO,
};

// Utilitários de conversão
export const formatPrice = (priceInCents) => {
  return `R$ ${(priceInCents / 100).toFixed(2).replace(".", ",")}`;
};

export const parsePrice = (priceString) => {
  // Converte "R$ 30,00" ou "30.00" para centavos
  const cleanPrice = priceString.replace(/[R$\s]/g, "").replace(",", ".");
  return Math.round(parseFloat(cleanPrice) * 100);
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
};

export const parseDuration = (durationString) => {
  // Converte "30 min", "1h 30min", "1h" para minutos
  if (typeof durationString === "number") return durationString;

  const hourMatch = durationString.match(/(\d+)h/);
  const minuteMatch = durationString.match(/(\d+)\s*min/);

  let totalMinutes = 0;
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);

  return totalMinutes || 30; // fallback para 30 min
};

// Validadores
export const validateProduct = (product) => {
  const errors = [];

  if (!product.name || typeof product.name !== "string") {
    errors.push("Nome é obrigatório e deve ser string");
  }

  if (typeof product.price !== "number" || product.price < 0) {
    errors.push("Preço deve ser um número positivo em centavos");
  }

  if (typeof product.duration !== "number" || product.duration <= 0) {
    errors.push("Duração deve ser um número positivo em minutos");
  }

  if (typeof product.isActive !== "boolean") {
    errors.push("isActive deve ser boolean");
  }

  return errors;
};

export const validateBooking = (booking) => {
  const errors = [];

  // Normalizar status legado se necessário
  if (booking.status && LEGACY_STATUS_MAP[booking.status]) {
    booking.status = LEGACY_STATUS_MAP[booking.status];
  }

  if (!booking.enterpriseEmail || typeof booking.enterpriseEmail !== "string") {
    errors.push("Email da empresa é obrigatório");
  }

  if (!booking.clientName || typeof booking.clientName !== "string") {
    errors.push("Nome do cliente é obrigatório");
  }

  if (!booking.clientPhone || typeof booking.clientPhone !== "string") {
    errors.push("Telefone do cliente é obrigatório");
  }

  if (!booking.productId || typeof booking.productId !== "string") {
    errors.push("ID do produto é obrigatório");
  }

  if (typeof booking.productPrice !== "number" || booking.productPrice < 0) {
    errors.push("Preço do produto deve ser número positivo em centavos");
  }

  if (
    typeof booking.productDuration !== "number" ||
    booking.productDuration <= 0
  ) {
    errors.push("Duração do produto deve ser número positivo em minutos");
  }

  if (!booking.date || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
    errors.push("Data deve estar no formato YYYY-MM-DD");
  }

  if (!booking.startTime || !/^\d{2}:\d{2}$/.test(booking.startTime)) {
    errors.push("Horário de início deve estar no formato HH:MM");
  }

  if (!Object.values(BOOKING_STATUS).includes(booking.status)) {
    errors.push(
      "Status deve ser um dos valores válidos: " +
        Object.values(BOOKING_STATUS).join(", ")
    );
  }

  return errors;
};

// Helpers para cálculo de endTime
export const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, "0")}:${endDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};
