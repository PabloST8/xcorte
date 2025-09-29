import React, { useEffect } from "react";
import { useBookings } from "../hooks/useBookings";

/**
 * Componente de debug para verificar se está usando a API
 */
export default function BookingAPIDebug() {
  const { bookings, isLoading, error, loadBookings } = useBookings();

  useEffect(() => {
    console.log("🧪 [BookingAPIDebug] Componente montado, testando API...");
    loadBookings();
  }, [loadBookings]);

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h2 className="text-lg font-bold text-yellow-800 mb-4">
        🧪 Debug: Teste da API de Agendamentos
      </h2>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Status:</strong>{" "}
          {isLoading ? "⏳ Carregando..." : "✅ Finalizado"}
        </p>
        <p>
          <strong>Endpoint:</strong>{" "}
          https://x-corte-api.codxis.com.br/api/bookings
        </p>
        <p>
          <strong>Erro:</strong> {error || "Nenhum"}
        </p>
        <p>
          <strong>Agendamentos:</strong> {bookings?.length || 0}
        </p>
      </div>

      {bookings?.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-yellow-700 mb-2">
            Primeiro agendamento:
          </h3>
          <pre className="bg-yellow-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(bookings[0], null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={() => loadBookings()}
        className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
      >
        🔄 Testar API Novamente
      </button>
    </div>
  );
}
