import { useState, useEffect } from "react";
import {
  Link,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ChevronLeft, Plus, MoreHorizontal } from "lucide-react";
import { paymentService } from "../services/paymentService";

function Payment() {
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [searchParams] = useSearchParams();
  const [appointmentData, setAppointmentData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se há dados vindos do estado de navegação (Appointment.jsx)
    if (location.state?.appointment) {
      const { appointment, service, price } = location.state;
      setAppointmentData({
        appointmentId: appointment.id,
        service: service?.name || appointment.service,
        price: price || appointment.price,
        duration: service?.duration || appointment.duration,
        staff: appointment.staff?.name || appointment.staffName,
        date: new Date(appointment.dateTime).toLocaleDateString(),
        time: new Date(appointment.dateTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } else {
      // Fallback para dados da URL (manter compatibilidade)
      const service = searchParams.get("service") || "Serviço";
      const price = searchParams.get("price") || "25";
      const duration = searchParams.get("duration") || "25 min";
      const staff = searchParams.get("staff") || "";
      const date = searchParams.get("date") || "";
      const time = searchParams.get("time") || "";

      setAppointmentData({
        service,
        price,
        duration,
        staff,
        date,
        time,
      });
    }
  }, [searchParams, location.state]);

  // Métodos de pagamento
  const paymentMethods = [
    {
      id: "card",
      type: "card",
      number: "•••• 2902",
      icon: "💳",
    },
    {
      id: "apple",
      type: "apple",
      name: "Apple Pay",
      icon: "🍎",
    },
    {
      id: "cash",
      type: "cash",
      name: "Dinheiro",
      icon: "💵",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to="/appointment">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Pagamento</h1>
        <button>
          <Plus className="w-6 h-6 text-gray-900" />
        </button>
      </header>

      <div className="px-6 py-6">
        {/* Appointment Summary */}
        {appointmentData.service && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Resumo do Agendamento
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Serviço:</span>
                <span className="font-medium">{appointmentData.service}</span>
              </div>
              {appointmentData.staff && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Funcionário:</span>
                  <span className="font-medium">{appointmentData.staff}</span>
                </div>
              )}
              {appointmentData.date && appointmentData.time && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data e Hora:</span>
                  <span className="font-medium">
                    {appointmentData.date} às {appointmentData.time}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duração:</span>
                <span className="font-medium">{appointmentData.duration}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {appointmentData.price}R$
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Forma de Pagamento
          </h3>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${
                selectedPayment === method.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-4">
                {method.type === "card" ? (
                  <div className="w-12 h-8 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MC</span>
                  </div>
                ) : method.type === "apple" ? (
                  <div className="w-12 h-8 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs">🍎</span>
                  </div>
                ) : (
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-600 text-xs">💵</span>
                  </div>
                )}

                <div className="text-left">
                  {method.type === "card" ? (
                    <div>
                      <p className="font-semibold text-gray-900">
                        {method.number}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-gray-900">
                        {method.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayment === method.id && (
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* More Options */}
        <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-xl mb-8">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-600">Mais opções</span>
        </button>

        {/* Pay Button */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={async () => {
            if (!appointmentData.appointmentId) {
              setError("Dados do agendamento não encontrados");
              return;
            }

            setLoading(true);
            setError("");

            try {
              const paymentData = {
                appointmentId: appointmentData.appointmentId,
                paymentMethod: selectedPayment,
                amount: parseFloat(appointmentData.price),
              };

              const result = await paymentService.processPayment(paymentData);

              if (result) {
                // Navegar para a tela inicial com mensagem de sucesso
                navigate("/", {
                  state: {
                    message:
                      "Pagamento realizado com sucesso! Agendamento confirmado.",
                  },
                });
              }
            } catch (error) {
              setError("Erro ao processar pagamento. Tente novamente.");
              console.error("Payment error:", error);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
            loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Processando..." : "Confirmar Pagamento"}
        </button>
      </div>
    </div>
  );
}

export default Payment;
