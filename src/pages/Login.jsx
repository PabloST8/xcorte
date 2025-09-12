import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { simplePhoneLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setPhone(formatPhone(e.target.value));
    // Limpar erro e mensagem de sucesso quando usuário começar a digitar
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Informe um telefone válido");
        return;
      }
      const result = await simplePhoneLogin({ phone });

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Erro ao fazer login");
      }
    } catch (error) {
      setError("Erro inesperado. Tente novamente.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Entrar</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta!
            </h2>
            <p className="text-gray-600">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={16}
                required
              />
            </div>

            {/* Sem senha/OTP. Mantemos apenas nome e telefone. */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/auth/register")}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Fazer cadastro
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Login só com telefone. O nome é coletado no cadastro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
