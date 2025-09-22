import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";

function Name() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  const phone = location.state?.phone || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setLoading(true);

    // Simular cadastro do usuário
    const userData = {
      phone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      registeredAt: new Date().toISOString(),
    };

    // Aqui você salvaria no backend (política: não usar localStorage)

    setTimeout(() => {
      setLoading(false);
      // Redirecionar para home ou dashboard
      navigate(getEnterpriseUrl(""), {
        state: {
          message: `Bem-vindo(a), ${firstName}! Seu cadastro foi realizado com sucesso.`,
          user: userData,
        },
      });
    }, 2000);
  };

  const handleBack = () => {
    navigate("/auth/login");
  };

  if (!phone) {
    // Se não tem telefone, redireciona para registro
    navigate("/register");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Quase pronto!
          </h1>
          <p className="text-gray-600">Como você gostaria de ser chamado?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome *
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Digite seu primeiro nome"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Sobrenome (opcional)
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Digite seu sobrenome"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              Número verificado: +55 {phone}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !firstName.trim()}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Finalizando cadastro...
              </div>
            ) : (
              "Finalizar Cadastro"
            )}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
          >
            ← Voltar
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Ao finalizar, você estará criando sua conta e concordando com nossos
            termos de serviço.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Name;
