import React from "react";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
} from "lucide-react";
import { useDashboardStats } from "../../hooks/useAdmin";

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600 text-center">
            Erro ao carregar dados do dashboard
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Agendamentos Hoje",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${stats?.monthlyRevenue || 0}`,
      icon: DollarSign,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Clientes",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Avaliação Média",
      value: `${stats?.averageRating || 0}/5`,
      icon: Star,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo ao painel administrativo da barbearia
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Agendamentos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Próximos Agendamentos
            </h2>
          </div>
          <div className="p-6">
            {stats?.upcomingAppointments?.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.clientName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.serviceName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {appointment.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.staffName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum agendamento para hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertas e Notificações */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
          </div>
          <div className="p-6">
            {stats?.alerts?.length > 0 ? (
              <div className="space-y-4">
                {stats.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {alert.title}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum alerta no momento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Performance dos Últimos 7 Dias
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {stats?.weeklyStats?.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-600 mb-2">{day.day}</div>
                <div
                  className="bg-amber-200 rounded-t mx-auto"
                  style={{
                    height: `${Math.max(20, (day.appointments / 10) * 100)}px`,
                    width: "20px",
                  }}
                ></div>
                <div className="text-sm font-medium text-gray-900 mt-2">
                  {day.appointments}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
