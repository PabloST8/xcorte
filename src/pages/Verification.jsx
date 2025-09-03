import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Tela de verificação de código (SMS/Email)
export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyCode } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phone = location.state?.phone;
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await verifyCode({ code, phone, email });
      if (result.success) {
        setSuccess("Verificação concluída! Redirecionando...");
        // Redirecionar após pequeno delay
        setTimeout(() => navigate("/"), 1200);
      } else {
        setError(result.error || "Código inválido");
      }
    } catch (err) {
      setError("Erro ao verificar código");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Verificação</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirme seu código
            </h1>
            <p className="text-gray-600 text-sm">
              Enviamos um código para {phone || email || "seu contato"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificação
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full px-4 py-3 text-center tracking-widest text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Digite o código de 6 dígitos
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <p className="text-gray-600">
              Não recebeu o código?{" "}
              <button
                type="button"
                className="text-amber-600 hover:text-amber-500"
              >
                Reenviar
              </button>
            </p>
            <p className="text-gray-500 mt-3">
              Errou seus dados?{" "}
              <Link
                to="/register"
                className="text-amber-600 hover:text-amber-500"
              >
                Cadastrar novamente
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
