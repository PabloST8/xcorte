import React, { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "../../hooks/useAdmin";
import { DataAdapters } from "../../utils/dataAdapters.js";

export default function AdminServices() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: services, isLoading, error } = useServices();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: 30, // minutos
    price: 3000, // centavos
    category: "",
    isActive: true,
  });

  // Converte serviços da API para display
  const displayServices =
    services?.map((service) => DataAdapters.serviceFromAPI(service)) || [];

  const filteredServices = displayServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      // Garantir que os dados estão no formato correto da API
      const serviceData = DataAdapters.serviceToAPI(newService);
      await createServiceMutation.mutateAsync(serviceData);

      setShowCreateModal(false);
      setNewService({
        name: "",
        description: "",
        duration: 30,
        price: 3000,
        category: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      // Converter para formato API
      const serviceData = DataAdapters.serviceToAPI(editingService);

      await updateServiceMutation.mutateAsync({
        serviceId: editingService.id,
        serviceData,
      });
      setEditingService(null);
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteServiceMutation.mutateAsync(serviceId);
      } catch (error) {
        console.error("Erro ao deletar serviço:", error);
      }
    }
  };

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
          <p className="text-red-600 text-center">Erro ao carregar serviços</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.name}
                  </h3>
                  <p className="text-sm text-amber-600 mt-1">
                    {service.category}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingService(service)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    disabled={deleteServiceMutation.isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                {service.description}
              </p>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Duração</p>
                  <p className="font-medium text-gray-900">
                    {service.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Preço</p>
                  <p className="font-medium text-gray-900">
                    R$ {service.price}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">Nenhum serviço encontrado</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Primeiro Serviço</span>
          </button>
        </div>
      )}

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Novo Serviço
              </h3>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={newService.category}
                    onChange={(e) =>
                      setNewService({ ...newService, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Cortes">Corte de Cabelo</option>
                    <option value="Barba">Serviços de Barba</option>
                    <option value="Pinturas">Pintura e Coloração</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          duration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newService.price}
                      onChange={(e) =>
                        setNewService({ ...newService, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createServiceMutation.isLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:bg-amber-300"
                  >
                    {createServiceMutation.isLoading
                      ? "Criando..."
                      : "Criar Serviço"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
