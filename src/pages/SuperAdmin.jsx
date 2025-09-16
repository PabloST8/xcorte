import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useSuperAdmin } from "../hooks/useSuperAdmin";
import { useNotification } from "../hooks/useNotification";
import { superAdminAuthService } from "../services/superAdminAuthService";
import SuperAdminLogin from "../components/SuperAdminLogin";
import NotificationPopup from "../components/NotificationPopup";

const SuperAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const {
    stats,
    loading,
    error,
    loadEnterprises,
    createEnterprise,
    updateEnterprise,
    toggleBlockEnterprise,
    toggleActiveEnterprise,
    deleteEnterprise,
    filterEnterprisesByStatus,
  } = useSuperAdmin();

  const { notification, showSuccess, showError, hideNotification } =
    useNotification();

  // Estados do componente
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    displayName: "",
  });

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = superAdminAuthService.isAuthenticated();
        if (isAuth) {
          const isSuperAdmin = await superAdminAuthService.isSuperAdmin();
          setIsAuthenticated(isSuperAdmin);
        }
      } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Monitor auth state changes
    const unsubscribe = superAdminAuthService.onAuthStateChanged((user) => {
      if (user) {
        superAdminAuthService.isSuperAdmin().then((isSuperAdmin) => {
          setIsAuthenticated(isSuperAdmin);
        });
      } else {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Carregar empresas quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadEnterprises();
    }
  }, [isAuthenticated, loadEnterprises]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await superAdminAuthService.signOut();
      setIsAuthenticated(false);
      showSuccess("Logout realizado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error);
      showError("Erro ao fazer logout");
    }
  };

  // Loading da autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - mostrar tela de login
  if (!isAuthenticated) {
    return <SuperAdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Filtrar empresas por busca e status
  const filteredEnterprises = filterEnterprisesByStatus(statusFilter).filter(
    (enterprise) =>
      enterprise.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enterprise.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enterprise.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      displayName: "",
    });
  };

  const handleCreateEnterprise = async (e) => {
    e.preventDefault();
    try {
      await createEnterprise(formData);
      showSuccess("Empresa criada com sucesso!");
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      showError(error.message || "Erro ao criar empresa");
    }
  };

  const handleEditEnterprise = async (e) => {
    e.preventDefault();
    try {
      await updateEnterprise(selectedEnterprise.id, formData);
      showSuccess("Empresa atualizada com sucesso!");
      setShowEditModal(false);
      setSelectedEnterprise(null);
      resetForm();
    } catch (error) {
      showError(error.message || "Erro ao atualizar empresa");
    }
  };

  const handleToggleBlock = async (enterprise) => {
    try {
      const newStatus = await toggleBlockEnterprise(enterprise.id);
      showSuccess(
        `Empresa ${newStatus ? "bloqueada" : "desbloqueada"} com sucesso!`
      );
    } catch (error) {
      showError(error.message || "Erro ao alterar status da empresa");
    }
  };

  const handleToggleActive = async (enterprise) => {
    try {
      const newStatus = await toggleActiveEnterprise(enterprise.id);
      showSuccess(
        `Empresa ${newStatus ? "ativada" : "desativada"} com sucesso!`
      );
    } catch (error) {
      showError(error.message || "Erro ao alterar status da empresa");
    }
  };

  const handleDeleteEnterprise = async (enterprise) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a empresa "${enterprise.name}"?`
      )
    ) {
      try {
        await deleteEnterprise(enterprise.id);
        showSuccess("Empresa excluída com sucesso!");
      } catch (error) {
        showError(error.message || "Erro ao excluir empresa");
      }
    }
  };

  const openEditModal = (enterprise) => {
    setSelectedEnterprise(enterprise);
    setFormData({
      name: enterprise.name || "",
      email: enterprise.email || "",
      phone: enterprise.phone || "",
      address: enterprise.address || "",
      displayName: enterprise.displayName || "",
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (enterprise) => {
    if (enterprise.isBlocked) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          Bloqueada
        </span>
      );
    }
    if (!enterprise.isActive) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          Inativa
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Ativa
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Super Admin - Gerenciar Empresas
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie todas as empresas do sistema
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Bloqueadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.blocked}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inativas</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>

              {/* Filtro de Status */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">Todas</option>
                  <option value="active">Ativas</option>
                  <option value="blocked">Bloqueadas</option>
                  <option value="inactive">Inativas</option>
                </select>
              </div>
            </div>

            {/* Botão Nova Empresa */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando empresas...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabela de Empresas */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criada em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnterprises.map((enterprise) => (
                    <tr key={enterprise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enterprise.displayName || enterprise.name}
                          </div>
                          {enterprise.address && (
                            <div className="text-sm text-gray-500">
                              {enterprise.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enterprise.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enterprise.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(enterprise)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enterprise.createdAt
                          ? new Date(
                              enterprise.createdAt.seconds * 1000
                            ).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(enterprise)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(enterprise)}
                            className={`p-1 ${
                              enterprise.isActive
                                ? "text-gray-600 hover:text-gray-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={enterprise.isActive ? "Desativar" : "Ativar"}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(enterprise)}
                            className={`p-1 ${
                              enterprise.isBlocked
                                ? "text-green-600 hover:text-green-900"
                                : "text-red-600 hover:text-red-900"
                            }`}
                            title={
                              enterprise.isBlocked ? "Desbloquear" : "Bloquear"
                            }
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEnterprise(enterprise)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEnterprises.length === 0 && !loading && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma empresa encontrada</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Criar Empresa */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nova Empresa
              </h3>
              <form onSubmit={handleCreateEnterprise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Criando..." : "Criar Empresa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Empresa */}
        {showEditModal && selectedEnterprise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Empresa
              </h3>
              <form onSubmit={handleEditEnterprise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email*
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEnterprise(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <NotificationPopup
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
          duration={notification.duration}
        />
      </div>
    </div>
  );
};

export default SuperAdmin;
