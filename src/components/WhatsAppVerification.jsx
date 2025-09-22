import { useState, useEffect } from "react";
import { MessageCircle, Clock, Shield, AlertCircle, Bug } from "lucide-react";
import {
  sendVerificationCode,
  verifyVerificationCode,
} from "../services/whatsappAPI";

const WhatsAppVerification = ({
  phoneNumber,
  onVerificationSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState("send"); // 'send', 'verify', 'success'
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [codeSent, setCodeSent] = useState(false);

  // Formatar número para exibição
  const formatPhoneForDisplay = (phone) => {
    // Remove caracteres não numéricos
    const clean = phone.replace(/\D/g, "");

    // Se tem 13 dígitos (55 + 11), formata como +55 (XX) 9XXXX-XXXX
    if (clean.length === 13 && clean.startsWith("55")) {
      const ddd = clean.slice(2, 4);
      const firstPart = clean.slice(4, 9);
      const secondPart = clean.slice(9);
      return `+55 (${ddd}) ${firstPart}-${secondPart}`;
    }

    // Se tem 11 dígitos, adiciona +55 e formata
    if (clean.length === 11) {
      const ddd = clean.slice(0, 2);
      const firstPart = clean.slice(2, 7);
      const secondPart = clean.slice(7);
      return `+55 (${ddd}) ${firstPart}-${secondPart}`;
    }

    // Retorna o número original se não conseguir formatar
    return phoneNumber;
  };

  // Timer para expiração do código
  useEffect(() => {
    if (codeSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setError("Código expirado. Solicite um novo código.");
      setStep("send");
      setCodeSent(false);
    }
  }, [timeLeft, codeSent]);

  // Formatar tempo restante
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Enviar código
  const handleSendCode = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await sendVerificationCode(phoneNumber);

      if (result.success) {
        setStep("verify");
        setCodeSent(true);
        setTimeLeft(300); // Reset timer
        setAttemptsLeft(3); // Reset attempts
      } else {
        setError(result.message || "Erro ao enviar código");
      }
    } catch (error) {
      setError("Erro inesperado. Tente novamente.");
      console.error("Erro ao enviar código:", error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar código
  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError("Código deve ter 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyVerificationCode(phoneNumber, code);

      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onVerificationSuccess(phoneNumber);
        }, 1500);
      } else {
        setError(result.message || "Código inválido");

        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }

        // Se não há mais tentativas, volta para o início
        if (result.attemptsLeft === 0) {
          setTimeout(() => {
            setStep("send");
            setCodeSent(false);
            setCode("");
          }, 2000);
        }
      }
    } catch (error) {
      setError("Erro inesperado. Tente novamente.");
      console.error("Erro ao verificar código:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = () => {
    setCode("");
    setError("");
    setStep("send");
    setCodeSent(false);
  };

  // Input do código com formatação
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  };

  if (step === "success") {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verificação concluída!
        </h3>
        <p className="text-gray-600">Seu número foi verificado com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verificação por WhatsApp
        </h3>
        <p className="text-gray-600 text-sm">
          Vamos verificar seu número:{" "}
          <span className="font-medium">
            {formatPhoneForDisplay(phoneNumber)}
          </span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {step === "send" && (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm text-center">
            Enviaremos um código de 6 dígitos para seu WhatsApp
          </p>

          <button
            onClick={handleSendCode}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-2" />
                Enviar código
              </>
            )}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Digite o código de 6 dígitos enviado para seu WhatsApp
            </p>

            {codeSent && (
              <div className="flex items-center justify-center text-orange-600 text-sm mb-4">
                <Clock className="w-4 h-4 mr-1" />
                Expira em: {formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-wider px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verificando...
              </div>
            ) : (
              "Verificar código"
            )}
          </button>

          <div className="text-center space-y-2">
            {attemptsLeft < 3 && (
              <p className="text-orange-600 text-sm">
                {attemptsLeft} tentativa(s) restante(s)
              </p>
            )}

            <button
              onClick={handleResendCode}
              className="text-green-600 hover:text-green-500 text-sm font-medium transition-colors"
            >
              Reenviar código
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          Cancelar verificação
        </button>
      </div>
    </div>
  );
};

export default WhatsAppVerification;
