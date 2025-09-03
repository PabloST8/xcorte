import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  LogOut,
  Edit,
  Camera,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useUserAppointments } from "../hooks/useBarbershop";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { data: appointments, isLoading } = useUserAppointments();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const recentAppointments = appointments?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Meu Perfil</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.name || "Usuário"}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">
                  Cliente desde{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).getFullYear()
                    : "2024"}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {user?.email || "email@exemplo.com"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {user?.phone || "(11) 99999-9999"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {appointments?.length || 0} agendamentos realizados
              </span>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agendamentos Recentes
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.serviceName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.staffName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.date}
                    </p>
                    <p className="text-xs text-gray-600">
                      {appointment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum agendamento ainda</p>
              <Link
                to="/service-details?category=Todos&title=Serviços"
                className="mt-4 inline-block bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Fazer Primeiro Agendamento
              </Link>
            </div>
          )}

          {recentAppointments.length > 0 && (
            <Link
              to="/calendar"
              className="block text-center mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              Ver Todos os Agendamentos
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/service-details?category=Todos&title=Serviços"
              className="flex items-center justify-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Calendar className="w-6 h-6 text-amber-600 mr-2" />
              <span className="text-amber-700 font-medium">Agendar</span>
            </Link>
            <Link
              to="/calendar"
              className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium">Minha Agenda</span>
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Notificações</span>
              <div className="w-5 h-5 border border-gray-300 rounded"></div>
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Privacidade</span>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-gray-700">Ajuda e Suporte</span>
              <span className="text-gray-400">→</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <span>Sair da Conta</span>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
