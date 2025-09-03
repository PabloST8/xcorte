import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import {
  useAvailableSlots,
  useCreateAppointment,
} from "../hooks/useBarbershop";
import { BOOKING_STATUS } from "../types/api.js";

function Appointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentData, setAppointmentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hooks para API
  const { data: availableSlots } = useAvailableSlots({
    date: selectedDate,
    productId: appointmentData.productId,
    employeeId: appointmentData.employeeId,
  });

  const createAppointmentMutation = useCreateAppointment();

  useEffect(() => {
    // Capturar dados do serviço e funcionário seguindo estrutura da API
    const serviceName = searchParams.get("service") || "Serviço";
    const productId =
      searchParams.get("productId") || searchParams.get("serviceId") || "";
    const price = parseInt(searchParams.get("price")) || 2500; // em centavos
    const duration = parseInt(searchParams.get("duration")) || 25; // em minutos
    const staffName = searchParams.get("staff") || "";
    const employeeId =
      searchParams.get("employeeId") || searchParams.get("staffId") || "";

    setAppointmentData({
      productName: serviceName,
      productId,
      productPrice: price,
      productDuration: duration,
      staffName,
      employeeId,
    });

    console.log("Dados do agendamento (API format):", {
      productName: serviceName,
      productId,
      productPrice: price,
      productDuration: duration,
      staffName,
      employeeId,
    });
  }, [searchParams]);

  // Dados do calendário - Nov 2024 (12-18)
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const calendarDays = [
    { day: 12, available: true },
    { day: 13, available: true },
    { day: 14, available: true },
    { day: 15, available: true },
    { day: 16, available: true },
    { day: 17, available: true },
    { day: 18, available: true },
  ];

  // Horários disponíveis (usar da API se disponível)
  const timeSlots = availableSlots || [
    { time: "9:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: true },
    { time: "12:00", available: true },
    { time: "13:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
    { time: "16:00", available: true },
  ];

  const monthName = "Nov 12 (12 - 18)";

  const handleCreateAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Selecione uma data e horário");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Montar dados do agendamento conforme API
      const bookingData = {
        enterpriseEmail: "test@empresa.com", // TODO: pegar do contexto
        clientName: "Cliente Teste", // TODO: pegar do usuário logado
        clientPhone: "11999999999", // TODO: pegar do usuário logado
        clientEmail: "cliente@email.com", // TODO: pegar do usuário logado
        productId: appointmentData.productId,
        productName: appointmentData.productName,
        productDuration: appointmentData.productDuration,
        productPrice: appointmentData.productPrice,
        date: selectedDate.toISOString().split("T")[0], // YYYY-MM-DD
        startTime: selectedTime, // HH:MM
        status: BOOKING_STATUS.PENDING,
        notes: "",
      };

      const result = await createAppointmentMutation.mutateAsync(bookingData);

      if (result) {
        // Redirecionar para página de confirmação ou pagamento
        navigate("/payment", {
          state: {
            appointment: result,
            productName: appointmentData.productName,
            productPrice: appointmentData.productPrice,
          },
        });
      }
    } catch (error) {
      setError("Erro ao criar agendamento. Tente novamente.");
      console.error("Create appointment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to="/cart">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Agendamento</h1>
        <div></div>
      </header>

      <div className="px-6 py-6">
        {/* Service Summary */}
        {appointmentData.service && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Resumo do Serviço
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Serviço:</span>
                <span className="font-medium">
                  {appointmentData.productName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duração:</span>
                <span className="font-medium">
                  {appointmentData.productDuration} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Preço:</span>
                <span className="font-medium text-blue-600">
                  R${" "}
                  {(appointmentData.productPrice / 100)
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>
              {appointmentData.staffName && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Funcionário:</span>
                  <span className="font-medium">
                    {appointmentData.staffName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Data</h3>

          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6">
            <button>
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{monthName}</span>
              <button className="text-blue-600 font-medium">Abril</button>
            </div>
            <button>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {calendarDays.map((dayObj) => (
              <button
                key={dayObj.day}
                onClick={() => setSelectedDate(dayObj.day)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg font-medium ${
                  selectedDate === dayObj.day
                    ? "bg-blue-600 text-white"
                    : dayObj.available
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!dayObj.available}
              >
                {dayObj.day}
              </button>
            ))}
          </div>
        </div>

        {/* Hora Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Hora</h3>

          <div className="grid grid-cols-4 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => setSelectedTime(slot.time)}
                className={`py-3 px-4 rounded-xl text-sm font-medium border ${
                  selectedTime === slot.time
                    ? "bg-blue-600 text-white border-blue-600"
                    : slot.available
                    ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                    : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                }`}
                disabled={!slot.available}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Forma de pagamento
          </h3>

          <div className="relative">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    •••• 2902
                  </span>
                </div>
                <span className="font-medium text-gray-900">•••• 2902</span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Continue Button */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleCreateAppointment}
          disabled={
            !selectedDate ||
            !selectedTime ||
            loading ||
            createAppointmentMutation.isPending
          }
          className={`block w-full py-4 rounded-xl font-semibold text-lg text-center transition-colors ${
            selectedDate &&
            selectedTime &&
            !loading &&
            !createAppointmentMutation.isPending
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading || createAppointmentMutation.isPending
            ? "Agendando..."
            : "Confirmar Agendamento"}
        </button>
      </div>
    </div>
  );
}

export default Appointment;
