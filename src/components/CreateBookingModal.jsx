import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Save,
  AlertCircle,
} from "lucide-react";
import { useBookings } from "../hooks/useBookings";
import { useStaff } from "../hooks/useAdmin";
import { useServices } from "../hooks/useAdmin";
import { useNotification } from "../hooks/useNotification";
import NotificationPopup from "./NotificationPopup";

/**
 * Modal para criar novo agendamento
 */
export default function CreateBookingModal({ isOpen, onClose, onSuccess }) {
  const { createBooking, isLoading } = useBookings();
  const { data: staff } = useStaff();
  const { data: services } = useServices();
  const { notification, showSuccess, showError, hideNotification } =
    useNotification();

  // Estados do formulário
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    productId: "",
    employeeId: "",
    date: "",
    startTime: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  // Reset form quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        productId: "",
        employeeId: "",
        date: "",
        startTime: "",
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Nome do cliente é obrigatório";
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = "Telefone é obrigatório";
    } else if (!/^[\d\s()-+]+$/.test(formData.clientPhone)) {
      newErrors.clientPhone = "Telefone deve conter apenas números";
    }

    if (
      formData.clientEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)
    ) {
      newErrors.clientEmail = "Email deve ter formato válido";
    }

    if (!formData.productId) {
      newErrors.productId = "Serviço é obrigatório";
    }

    if (!formData.date) {
      newErrors.date = "Data é obrigatória";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "Data não pode ser no passado";
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = "Horário é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Atualizar campo do formulário
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      const result = await createBooking(formData);

      if (result.success) {
        showSuccess(result.message || "Agendamento criado com sucesso!");
        onSuccess && onSuccess(result.data);
        onClose();
      } else {
        showError(result.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      showError(error.message || "Erro inesperado");
    }
  };

  // Gerar horários disponíveis
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Notificações */}
      <NotificationPopup
        notification={notification}
        onClose={hideNotification}
      />

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Novo Agendamento
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-amber-600" />
                Dados do Cliente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.clientName ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Digite o nome do cliente"
                  />
                  {errors.clientName && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.clientName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => updateField("clientPhone", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.clientPhone ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.clientPhone && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.clientPhone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => updateField("clientEmail", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.clientEmail ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="cliente@email.com"
                />
                {errors.clientEmail && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.clientEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Serviço e Funcionário */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-amber-600" />
                Serviço
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serviço *
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => updateField("productId", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.productId ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione um serviço</option>
                    {services?.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - R${" "}
                        {(service.price || 0).toFixed(2).replace(".", ",")}
                      </option>
                    ))}
                  </select>
                  {errors.productId && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.productId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funcionário (opcional)
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => updateField("employeeId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Qualquer funcionário</option>
                    {staff?.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Data e Horário */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-amber-600" />
                Data e Horário
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.date ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário *
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      errors.startTime ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione um horário</option>
                    {generateTimeSlots().map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.startTime && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.startTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Observações adicionais sobre o agendamento..."
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white px-6 py-2 rounded-md flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? "Criando..." : "Criar Agendamento"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
