import React, { useState } from "react";
import { Plus, Trash2, Search, Edit } from "lucide-react";
import {
  useServices,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from "../../hooks/useAdmin";

export default function AdminServices() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const { data: services, isLoading, error } = useServices();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: 30, // minutos
    price: 25, // reais
    category: "",
    isActive: true,
  });

  const [priceInput, setPriceInput] = useState("2500"); // centavos (R$ 25,00)
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Função para formatar o input de preço
  const formatPrice = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Converte para centavos
    const cents = parseInt(numbers) || 0;

    // Converte para reais (centavos / 100)
    const reais = cents / 100;

    // Formata para exibição
    return reais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para atualizar o preço
  const handlePriceChange = (value) => {
    const numbers = value.replace(/\D/g, "");

    // Limita a 5 dígitos (99900 centavos = R$ 999,00)
    const limitedNumbers = numbers.slice(0, 5);
    setPriceInput(limitedNumbers);

    const cents = parseInt(limitedNumbers) || 0;
    const reais = cents / 100;

    setNewService((prev) => ({ ...prev, price: reais }));
  };

  // Função para atualizar a duração
  const updateDuration = (hours, minutes) => {
    const totalMinutes = hours * 60 + minutes;
    // Não permitir duração zero
    if (totalMinutes === 0) {
      return;
    }
    setNewService((prev) => ({ ...prev, duration: totalMinutes }));
  };

  // Função para validar se pode criar o serviço
  const canCreateService = () => {
    return (
      newService.duration > 0 &&
      newService.price > 0 &&
      newService.name.trim() !== ""
    );
  };

  // Usar serviços diretamente do Firestore
  const displayServices = services || [];

  const filteredServices = displayServices.filter(
    (service) =>
      (service.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      // Usar dados diretamente do newService (já em reais)
      await createServiceMutation.mutateAsync(newService);

      setShowCreateModal(false);
      setNewService({
        name: "",
        description: "",
        duration: 30,
        price: 25,
        category: "",
        isActive: true,
      });
      setPriceInput("2500"); // Reset para R$ 25,00
      setDurationHours(0);
      setDurationMinutes(30);
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
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

  const handleEditService = (service) => {
    setEditingService(service);
    setIsEditMode(true);

    // Preencher o formulário com os dados do serviço
    setNewService({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive,
    });

    // Calcular horas e minutos
    const hours = Math.floor(service.duration / 60);
    const minutes = service.duration % 60;
    setDurationHours(hours);
    setDurationMinutes(minutes);

    // Calcular preço em centavos para o input
    const priceInCents = Math.round(service.price * 100);
    setPriceInput(priceInCents.toString());

    setShowCreateModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await updateServiceMutation.mutateAsync({
        id: editingService.id,
        ...newService,
      });

      // Reset form
      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingService(null);
      setNewService({
        name: "",
        description: "",
        duration: 30,
        price: 25,
        category: "",
        isActive: true,
      });
      setPriceInput("2500");
      setDurationHours(0);
      setDurationMinutes(30);
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
    }
  };

  const handleCancelEdit = () => {
    setShowCreateModal(false);
    setIsEditMode(false);
    setEditingService(null);
    setNewService({
      name: "",
      description: "",
      duration: 30,
      price: 25,
      category: "",
      isActive: true,
    });
    setPriceInput("2500");
    setDurationHours(0);
    setDurationMinutes(30);
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
                    onClick={() => handleEditService(service)}
                    className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
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
                    {Math.floor(service.duration / 60) > 0 &&
                      `${Math.floor(service.duration / 60)}h `}
                    {service.duration % 60 > 0 && `${service.duration % 60}min`}
                    {service.duration === 0 && "0min"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Preço</p>
                  <p className="font-medium text-gray-900">
                    R${" "}
                    {
                      // Se o valor for muito alto (>100), provavelmente está em centavos
                      (service.price > 100
                        ? service.price / 100
                        : service.price || 0
                      ).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }
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
                {isEditMode ? "Editar Serviço" : "Novo Serviço"}
              </h3>

              <form
                onSubmit={
                  isEditMode ? handleUpdateService : handleCreateService
                }
                className="space-y-4"
              >
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
                      Duração
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Horas
                        </label>
                        <select
                          value={durationHours}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value);
                            setDurationHours(hours);
                            // Se for 0h e minutos for 0, muda para 15min
                            const newMinutes =
                              hours === 0 && durationMinutes === 0
                                ? 15
                                : durationMinutes;
                            if (hours === 0 && durationMinutes === 0) {
                              setDurationMinutes(15);
                            }
                            updateDuration(hours, newMinutes);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                            <option key={h} value={h}>
                              {h}h
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Minutos
                        </label>
                        <select
                          value={durationMinutes}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value);
                            setDurationMinutes(minutes);
                            // Se for 0min e horas for 0, muda para 1h
                            const newHours =
                              minutes === 0 && durationHours === 0
                                ? 1
                                : durationHours;
                            if (minutes === 0 && durationHours === 0) {
                              setDurationHours(1);
                            }
                            updateDuration(newHours, minutes);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          {[0, 15, 30, 45].map((m) => (
                            <option key={m} value={m}>
                              {m}min
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {Math.floor(newService.duration / 60)}h{" "}
                      {newService.duration % 60}min
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço
                    </label>
                    <input
                      type="text"
                      value={formatPrice(priceInput)}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite os centavos (ex: 2500 = R$ 25,00) - máximo R$
                      999,00
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={
                      isEditMode
                        ? handleCancelEdit
                        : () => setShowCreateModal(false)
                    }
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      (isEditMode
                        ? updateServiceMutation.isLoading
                        : createServiceMutation.isLoading) ||
                      !canCreateService()
                    }
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:bg-amber-300"
                  >
                    {isEditMode
                      ? updateServiceMutation.isLoading
                        ? "Atualizando..."
                        : "Atualizar Serviço"
                      : createServiceMutation.isLoading
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
