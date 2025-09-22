import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import WhatsAppVerification from "../components/WhatsAppVerification";

function Register() {
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const navigate = useNavigate();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { simpleRegister } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Nome e telefone são obrigatórios");
      return;
    }

    // Se o telefone não foi verificado, mostrar tela de verificação
    if (!phoneVerified) {
      setShowVerification(true);
      return;
    }

    // Se chegou aqui, o telefone foi verificado, proceder com o registro
    await proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await simpleRegister({
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ""),
        phoneVerified: true, // Indica que o telefone foi verificado
      });

      if (result.success) {
        // Registro bem-sucedido, navegar para login centralizado
        navigate("/auth/login");
      } else {
        setError(result.error || "Erro ao criar conta");
      }
    } catch (error) {
      setError("Erro inesperado. Tente novamente.");
      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setPhoneVerified(true);
    setShowVerification(false);
    // Automaticamente proceder com o registro após verificação
    proceedWithRegistration();
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setPhoneVerified(false);
  };

  const formatPhone = (value) => {
    const digits = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => {
            if (showVerification) {
              setShowVerification(false);
            } else {
              navigate(getEnterpriseUrl(""));
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {showVerification ? "Verificação WhatsApp" : "Criar Conta"}
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {showVerification ? (
          <WhatsAppVerification
            phoneNumber={`55${formData.phone.replace(/\D/g, "")}`}
            onVerificationSuccess={handleVerificationSuccess}
            onCancel={handleVerificationCancel}
          />
        ) : (
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo!
              </h1>
              <p className="text-gray-600">
                Crie sua conta para agendar seus horários
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nome completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* Registro só com Nome e Telefone */}

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número do celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">🇧🇷 +55</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="block w-full pl-16 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              {/* Sem senha */}

              <button
                type="submit"
                disabled={loading || !formData.name || !formData.phone}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Já tem uma conta?{" "}
                <Link
                  to="/auth/login"
                  className="text-amber-600 hover:text-amber-500 font-medium transition-colors"
                >
                  Entrar
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Ao criar uma conta, você concorda com nossos{" "}
                <a href="#" className="text-amber-600 hover:text-amber-500">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="text-amber-600 hover:text-amber-500">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
