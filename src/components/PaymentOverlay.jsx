import { useState } from "react";
import { X } from "lucide-react";
import { paymentService } from "../services/paymentService";
import NotificationPopup from "./NotificationPopup";
import { useNotification } from "../hooks/useNotification";
import { formatDateBR } from "../utils/dateUtils";

function PaymentOverlay({ isOpen, onClose, appointmentData, onConfirm }) {
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { notification, showError, hideNotification } = useNotification();

  const paymentMethods = [
    { key: "card", label: "Cartão" },
    { key: "pix", label: "Pix" },
    { key: "cash", label: "Dinheiro físico" },
  ];

  const handleConfirmPayment = async () => {
    if (!appointmentData) return;

    setLoading(true);
    setError("");

    try {
      const paymentData = {
        appointmentId: appointmentData.appointmentId || Date.now().toString(),
        paymentMethod: selectedPayment,
        amount: appointmentData.priceInCents || appointmentData.price || 0,
        service: appointmentData.serviceName || appointmentData.service,
        staff: appointmentData.employeeName || appointmentData.staff,
        date: appointmentData.date,
        time: appointmentData.time,
      };

      const result = await paymentService.processPayment(paymentData);

      if (result && result.success) {
        console.log("💳 Pagamento bem-sucedido, chamando onConfirm...");
        onConfirm && onConfirm(result);
        // Não fechar imediatamente para dar tempo da notificação aparecer
        setTimeout(() => onClose(), 1000);
      } else {
        console.log("💳 Erro no pagamento:", result);
        showError(result?.error || "Erro no processamento do pagamento", 6000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      showError("Erro inesperado. Tente novamente.", 6000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Finalizar Agendamento</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Resumo do agendamento */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Resumo do agendamento
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p
                className="break-words"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                <span className="font-medium">Serviço:</span>{" "}
                {appointmentData?.serviceName || appointmentData?.service}
              </p>
              <p
                className="break-words"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                <span className="font-medium">Profissional:</span>{" "}
                {appointmentData?.employeeName || appointmentData?.staff}
              </p>
              <p
                className="break-words"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <span className="font-medium">Data:</span>{" "}
                {appointmentData?.date
                  ? formatDateBR(new Date(`${appointmentData.date}T00:00:00`))
                  : ""}
              </p>
              <p
                className="break-words"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <span className="font-medium">Horário:</span>{" "}
                {appointmentData?.time}
              </p>
              <p
                className="break-words"
                style={{
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <span className="font-medium">Valor:</span> R${" "}
                {(
                  (appointmentData?.priceInCents ||
                    appointmentData?.price ||
                    0) / 100
                )
                  .toFixed(2)
                  .replace(".", ",")}
              </p>
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Forma de pagamento
            </h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg border cursor-pointer text-center text-sm ${
                    selectedPayment === opt.key
                      ? "border-blue-600 text-blue-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.key}
                    checked={selectedPayment === opt.key}
                    onChange={() => setSelectedPayment(opt.key)}
                    className="mr-2"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botões */}
        </div>

        {/* Área de botões fixada */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Processando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
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

export default PaymentOverlay;
