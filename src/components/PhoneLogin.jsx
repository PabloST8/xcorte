import React, { useState } from "react";
import {
  sendPhoneCode,
  confirmPhoneCode,
} from "../services/firebasePhoneAuthService";
import Cookies from "js-cookie";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

// Componente isolado para autenticação via telefone (OTP)
export function PhoneLogin({ onSuccess, askName = true }) {
  const [step, setStep] = useState("enter"); // enter | code
  const [phone, setPhone] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if (!phone) return;
    setLoading(true);
    try {
      const conf = await sendPhoneCode(phone);
      setConfirmation(conf);
      setStep("code");
    } catch (err) {
      setError(err.message || "Falha ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!confirmation || !code) return;
    setLoading(true);
    setError("");
    try {
      const extra = askName && name ? { name } : {};
      const { profile } = await confirmPhoneCode(confirmation, code, extra);
      Cookies.set("auth_token", "phone-auth-placeholder", { expires: 7 });
      Cookies.set("user_data", JSON.stringify(profile), { expires: 7 });
      // Recupera doc caso já exista e tenha nome
      try {
        const snap = await getDoc(doc(db, "users", profile.id));
        if (snap.exists()) {
          const data = snap.data();
          Cookies.set("user_data", JSON.stringify({ ...profile, ...data }), {
            expires: 7,
          });
        }
      } catch {
        // ignore
      }
      onSuccess && onSuccess(profile);
    } catch (err) {
      setError(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div id="recaptcha-container" />
      {step === "enter" && (
        <form onSubmit={handleSend} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {askName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Seu nome"
                required={askName}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">+55</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-3 py-2 border rounded-lg"
                placeholder="11999999999"
                maxLength={13}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg"
          >
            {loading ? "Enviando..." : "Enviar Código"}
          </button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-gray-600">
            Enviamos um código para o número informado.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg tracking-widest text-center"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg"
          >
            {loading ? "Verificando..." : "Confirmar"}
          </button>
        </form>
      )}
    </div>
  );
}
