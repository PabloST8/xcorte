import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { useCreateAppointment } from "../hooks/useBarbershop";
import { BOOKING_STATUS } from "../types/api.js";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useDailySlots } from "../hooks/useDailySlots";
import { useAuth } from "../contexts/AuthContext";

function Appointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentData, setAppointmentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentEnterprise } = useEnterprise();
  const { user } = useAuth();

  // Hooks para API
  const { slots: dailySlots } = useDailySlots({
    enterpriseEmail: currentEnterprise?.email,
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
    const dateStr = searchParams.get("date");
    const timeStr = searchParams.get("time");

    setAppointmentData({
      productName: serviceName,
      productId,
      productPrice: price,
      productDuration: duration,
      staffName,
      employeeId,
    });

    if (dateStr) {
      const parsed = new Date(`${dateStr}T00:00:00`);
      if (!isNaN(parsed)) setSelectedDate(parsed);
    } else {
      // default hoje
      const today = new Date();
      const base = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      );
      setSelectedDate(base);
    }
    if (timeStr) setSelectedTime(timeStr);

    console.log("Dados do agendamento (API format):", {
      productName: serviceName,
      productId,
      productPrice: price,
      productDuration: duration,
      staffName,
      employeeId,
      dateStr,
      timeStr,
    });
  }, [searchParams]);

  // Horários disponíveis (usar hook de slots diários)
  const timeSlots = (dailySlots || []).map((s) => ({
    time: s.time || s.startTime,
    available: s.isAvailable !== false,
  }));

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
        enterpriseEmail: currentEnterprise?.email || "",
        clientName: user?.name || user?.displayName || "Cliente",
        clientPhone: user?.phone || user?.phoneNumber || "",
        clientEmail: user?.email || "",
        productId: appointmentData.productId,
        productName: appointmentData.productName,
        productDuration: appointmentData.productDuration,
        productPrice: appointmentData.productPrice,
        date:
          typeof selectedDate?.toISOString === "function"
            ? selectedDate.toISOString().split("T")[0]
            : String(selectedDate),
        startTime: selectedTime, // HH:MM
        employeeId: appointmentData.employeeId || "",
        staffName: appointmentData.staffName || "",
        status: BOOKING_STATUS.AGENDADO,
        notes: "",
      };

      const result = await createAppointmentMutation.mutateAsync(bookingData);

      if (result) {
        // Redirecionar para página de confirmação ou pagamento
        navigate(getEnterpriseUrl("payment"), {
          state: {
            appointment: result,
            service: {
              name: appointmentData.productName,
              duration: appointmentData.productDuration,
            },
            price: appointmentData.productPrice / 100,
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
        <Link to={getEnterpriseUrl("service-details")}>
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Agendamento</h1>
        <div></div>
      </header>

      <div className="px-6 py-6">
        {/* Service Summary */}
        {appointmentData.productName && (
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
                  R{" "}
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
          <h3 className="text-lg font-bold text-gray-900 mb-3">Data</h3>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
            value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const parsed = new Date(`${v}T00:00:00`);
              if (!isNaN(parsed)) setSelectedDate(parsed);
            }}
          />
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
            {(!timeSlots || timeSlots.length === 0) && (
              <div className="col-span-4 text-sm text-gray-500">
                Selecione uma data para ver horários disponíveis.
              </div>
            )}
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
