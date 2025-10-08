import React, { useState } from "react";
import { Search, Users } from "lucide-react";
import { useEnterpriseClients } from "../../hooks/useEnterpriseClients";
import { formatPrice } from "../../types/api";
import UserAvatar from "../../components/UserAvatar";
import { useSearchWithDebounce } from "../../hooks/useDebounce";

export default function AdminClients() {
  const [sortBy, setSortBy] = useState("name");

  // Hook para busca manual apenas (sem debounce automático)
  const {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    triggerSearch,
    isSearching,
  } = useSearchWithDebounce("");

  const {
    data: clients,
    isLoading,
    error,
  } = useEnterpriseClients({
    search: debouncedSearchTerm, // Usar valor com debounce manual
    sortBy,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600 text-center">Erro ao carregar clientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-2">
              Gerencie sua base de clientes
              {clients && (
                <span className="ml-2 text-sm font-medium text-amber-600">
                  ({clients.length}{" "}
                  {clients.length === 1 ? "cliente" : "clientes"}
                  {searchTerm &&
                    ` encontrado${clients.length === 1 ? "" : "s"}`}
                  )
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  triggerSearch();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2">
            {/* Botão de Busca */}
            <button
              onClick={triggerSearch}
              disabled={isSearching}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isSearching
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              <option value="name">📝 Ordenar por Nome</option>
              <option value="created_at">🕐 Mais Recentes</option>
              <option value="last_appointment">📅 Último Agendamento</option>
              <option value="total_spent">💰 Valor Gasto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients?.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <UserAvatar
                    photoUrl={client.photoURL}
                    userName={client.name}
                    size="large"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Agendamentos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {client.appointmentsCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <p
                    className={`text-lg font-semibold ${
                      sortBy === "total_spent"
                        ? "text-amber-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatPrice(client.totalSpent || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-500">
                  Último agendamento:
                  <span
                    className={`ml-1 ${
                      sortBy === "last_appointment"
                        ? "font-medium text-amber-600"
                        : ""
                    }`}
                  >
                    {client.lastAppointment || "Nunca"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!clients || clients.length === 0) && !isLoading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {searchTerm ? (
            <div>
              <p className="text-gray-600 mb-2">
                Nenhum cliente encontrado para "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <p className="text-gray-600">Nenhum cliente encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
