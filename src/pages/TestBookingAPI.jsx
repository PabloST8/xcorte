import React from "react";
import BookingAPIDebug from "../components/BookingAPIDebug";

/**
 * Página de teste para verificar se a API está funcionando
 * Acesse: http://localhost:4001/test-booking-api
 */
export default function TestBookingAPI() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Teste da API de Agendamentos
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📋 Status:</h2>
          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded">
            <p>
              <strong>URL da API:</strong>{" "}
              https://x-corte-api.codxis.com.br/api/bookings
            </p>
            <p>
              <strong>Endpoint:</strong> GET
              /api/bookings?enterpriseEmail=pablofafstar@gmail.com
            </p>
            <p>
              <strong>Método:</strong> Fetch API com CORS
            </p>
          </div>
        </div>

        <BookingAPIDebug />

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 Instruções:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
            <li>Abra o console do navegador (F12)</li>
            <li>Procure pelos logs que começam com 🎯, 📡, 🧪</li>
            <li>Se aparecerem, a API está funcionando</li>
            <li>Se não aparecerem, há algum erro de conexão</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
