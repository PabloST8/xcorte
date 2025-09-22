import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  Clock,
  Calendar,
  UserX,
  UserCheck,
  Camera,
} from "lucide-react";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useServices,
} from "../../hooks/useAdmin";
import { formatDateBR } from "../../utils/dateUtils";
import { useEnterprise } from "../../contexts/EnterpriseContext";
import StaffPhotoUpload from "../../components/StaffPhotoUpload";
import StaffAvatar from "../../components/StaffAvatar";
import staffPhotoService from "../../services/staffPhotoService";

const WEEK_DAYS = [
  { key: "monday", label: "Seg", name: "Segunda" },
  { key: "tuesday", label: "Ter", name: "Terça" },
  { key: "wednesday", label: "Qua", name: "Quarta" },
  { key: "thursday", label: "Qui", name: "Quinta" },
  { key: "friday", label: "Sex", name: "Sexta" },
  { key: "saturday", label: "Sáb", name: "Sábado" },
  { key: "sunday", label: "Dom", name: "Domingo" },
];

export default function AdminStaff() {
  const { data: staff, isLoading, error } = useStaff();
  const { data: services } = useServices();
  const { currentEnterprise } = useEnterprise();
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  // Obter email da empresa atual
  const currentEnterpriseEmail =
    currentEnterprise?.email || "empresaadmin@xcortes.com";

  // Função helper para filtrar habilidades válidas
  const getValidSkills = (employeeSkills) => {
    if (!employeeSkills || !services) return [];

    return employeeSkills.filter((skill) => {
      const serviceId = skill.productId || skill.serviceId;
      return services.some((service) => service.id === serviceId);
    });
  };

  // Validações em tempo real
  const validateEmail = (email) => {
    if (!email.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "E-mail deve ter formato válido (exemplo: usuario@dominio.com)";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return "";
    const phoneNumbers = phone.replace(/\D/g, "");
    if (phoneNumbers.length < 10) {
      return "Telefone deve ter pelo menos 10 dígitos";
    }
    if (phoneNumbers.length > 11) {
      return "Telefone deve ter no máximo 11 dígitos";
    }
    return "";
  };

  // Atualizar erro de campo específico
  const updateFieldError = (field, error) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Função de validação do funcionário
  const validateStaff = (staffData) => {
    const errors = [];

    // Validar campos obrigatórios básicos
    if (!staffData.name?.trim()) {
      errors.push("Nome é obrigatório");
    } else if (staffData.name.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    // Validar email
    if (!staffData.email?.trim()) {
      errors.push("E-mail é obrigatório");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData.email.trim())) {
        errors.push(
          "E-mail deve ter um formato válido (exemplo: usuario@dominio.com)"
        );
      }
    }

    // Validar telefone
    if (!staffData.phone?.trim()) {
      errors.push("Telefone é obrigatório");
    } else {
      // Remover formatação e verificar se tem pelo menos 10 dígitos
      const phoneNumbers = staffData.phone.replace(/\D/g, "");
      if (phoneNumbers.length < 10) {
        errors.push("Telefone deve ter pelo menos 10 dígitos");
      } else if (phoneNumbers.length > 11) {
        errors.push("Telefone deve ter no máximo 11 dígitos");
      }
    }

    // Validar cargo
    if (!staffData.position?.trim()) {
      errors.push("Cargo é obrigatório");
    }

    // Validar se tem pelo menos um serviço/habilidade
    const validSkills = getValidSkills(staffData.skills || []);
    if (validSkills.length === 0) {
      errors.push("Funcionário deve ter pelo menos uma especialidade/serviço");
    }

    // Validar se tem pelo menos um dia de trabalho configurado
    const workingDays = Object.entries(staffData.workSchedule || {}).filter(
      ([, schedule]) => schedule?.isWorking === true
    );
    if (workingDays.length === 0) {
      errors.push("Funcionário deve trabalhar em pelo menos um dia da semana");
    }

    // Validar horários dos dias de trabalho
    workingDays.forEach(([day, schedule]) => {
      const dayName = WEEK_DAYS.find((d) => d.key === day)?.name || day;

      if (!schedule.morningStart || !schedule.morningEnd) {
        errors.push(`Horário da manhã é obrigatório para ${dayName}`);
      }

      if (schedule.morningStart && schedule.morningEnd) {
        if (schedule.morningStart >= schedule.morningEnd) {
          errors.push(
            `Horário de início deve ser menor que o fim em ${dayName} (manhã)`
          );
        }
      }

      // Validar horário da tarde se informado
      if (schedule.afternoonStart && schedule.afternoonEnd) {
        if (schedule.afternoonStart >= schedule.afternoonEnd) {
          errors.push(
            `Horário de início deve ser menor que o fim em ${dayName} (tarde)`
          );
        }
        if (schedule.afternoonStart <= schedule.morningEnd) {
          errors.push(
            `Horário da tarde deve ser após o horário da manhã em ${dayName}`
          );
        }
      }
    });

    return errors;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBlockedStaff, setShowBlockedStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [blockingStaff, setBlockingStaff] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    avatarUrl: "",
    skills: [],
    workSchedule: {},
    isActive: true,
    enterpriseEmail: currentEnterpriseEmail,
  });

  const [blockForm, setBlockForm] = useState({
    reason: "Férias",
    blockedUntil: "",
  });

  // Filtrar funcionários
  const filteredStaff = (staff || []).filter((employee) => {
    if (!showBlockedStaff && !employee.isActive) return false;
    if (showBlockedStaff && employee.isActive) return false;

    return (
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Formatação de telefone
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  // Criar funcionário
  const handleCreateStaff = async (e) => {
    e.preventDefault();

    // Limpar erros anteriores
    setValidationErrors([]);

    // Validar dados antes de enviar
    const errors = validateStaff(newStaff);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    console.log("Tentando criar funcionário:", newStaff);
    try {
      const result = await createStaffMutation.mutateAsync(newStaff);
      console.log("Funcionário criado com sucesso:", result);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
      alert("Erro ao criar funcionário: " + error.message);
    }
  };

  // Editar funcionário
  const handleEditStaff = async (employee) => {
    setEditingStaff(employee);
    setIsEditMode(true);

    // Carregar foto do Firestore se existir
    let photoUrl = employee.avatarUrl;
    try {
      const photoData = await staffPhotoService.getStaffPhoto(
        currentEnterprise?.email || "empresaadmin@xcortes.com",
        employee.email
      );
      if (photoData?.url) {
        photoUrl = photoData.url;
      }
    } catch {
      console.log("Nenhuma foto encontrada no Firestore para este funcionário");
    }

    // CORREÇÃO: Manter o enterpriseEmail original do funcionário
    // Também limpar habilidades órfãs antes de editar
    const cleanedEmployee = {
      ...employee,
      avatarUrl: photoUrl,
      skills: getValidSkills(employee.skills || []),
    };
    setNewStaff(cleanedEmployee);
    setShowCreateModal(true);
  };

  // Atualizar funcionário
  const handleUpdateStaff = async (e) => {
    e.preventDefault();

    // Limpar erros anteriores
    setValidationErrors([]);

    // Validar dados antes de enviar
    const errors = validateStaff(newStaff);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await updateStaffMutation.mutateAsync({
        id: editingStaff.id,
        ...newStaff,
      });

      // Se há foto, salvar/atualizar metadados no Firestore
      if (newStaff.avatarUrl && editingStaff?.email) {
        await staffPhotoService.setStaffPhoto(
          currentEnterprise?.email || "empresaadmin@xcortes.com",
          editingStaff.email,
          {
            url: newStaff.avatarUrl,
            uploadedAt: new Date().toISOString(),
          }
        );
      }

      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingStaff(null);
      resetForm();
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      alert("Erro ao atualizar funcionário: " + error.message);
    }
  };

  // Deletar funcionário
  const handleDeleteStaff = async (staffId) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        console.log("🗑️ Tentando deletar funcionário:", staffId);
        await deleteStaffMutation.mutateAsync(staffId);
        console.log("✅ Funcionário deletado com sucesso");
      } catch (error) {
        console.error("❌ Erro ao deletar funcionário:", error);
        alert(
          "Erro ao deletar funcionário: " +
            (error.message || "Erro desconhecido")
        );
      }
    }
  };

  // Bloquear funcionário
  const handleBlockStaff = (employee) => {
    setBlockingStaff(employee);
    setShowBlockModal(true);
  };

  // Confirmar bloqueio
  const handleConfirmBlock = async () => {
    try {
      await updateStaffMutation.mutateAsync({
        id: blockingStaff.id,
        ...blockingStaff,
        isActive: false,
        blockedReason: blockForm.reason,
        blockedUntil: blockForm.blockedUntil,
      });
      setShowBlockModal(false);
      setBlockingStaff(null);
      setBlockForm({ reason: "Férias", blockedUntil: "" });
    } catch (error) {
      console.error("Erro ao bloquear funcionário:", error);
    }
  };

  // Desbloquear funcionário
  const handleUnblockStaff = async (employee) => {
    try {
      await updateStaffMutation.mutateAsync({
        id: employee.id,
        ...employee,
        isActive: true,
        blockedReason: null,
        blockedUntil: null,
      });
    } catch (error) {
      console.error("Erro ao desbloquear funcionário:", error);
      alert("Erro ao desbloquear funcionário: " + error.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      position: "",
      avatarUrl: "",
      skills: [],
      workSchedule: {},
      isActive: true,
      enterpriseEmail: currentEnterpriseEmail,
    });
    setValidationErrors([]);
    setFieldErrors({});
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setShowCreateModal(false);
    setIsEditMode(false);
    setEditingStaff(null);
    setValidationErrors([]);
    setFieldErrors({});
    resetForm();
  };

  // Adicionar habilidade
  const handleAddSkill = (service) => {
    if (!newStaff.skills.find((skill) => skill.productId === service.id)) {
      setNewStaff((prev) => ({
        ...prev,
        skills: [
          ...prev.skills,
          {
            productId: service.id,
            productName: service.name,
            canPerform: true,
            estimatedDuration: service.duration || 30,
            experienceLevel: "intermediate",
          },
        ],
      }));
      // Limpar erros relacionados a skills quando adicionar uma habilidade
      setValidationErrors((prev) =>
        prev.filter(
          (error) =>
            !error.includes("especialidade") && !error.includes("serviço")
        )
      );
    }
  };

  // Remover habilidade
  const handleRemoveSkill = (productId) => {
    setNewStaff((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.productId !== productId),
    }));
  };

  // Adicionar dia de trabalho
  const handleAddWorkDay = (dayKey) => {
    setNewStaff((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [dayKey]: {
          isWorking: true,
          morningStart: "08:00",
          morningEnd: "12:00",
          afternoonStart: "13:00",
          afternoonEnd: "17:00",
        },
      },
    }));
    // Limpar erros relacionados a dias de trabalho quando adicionar um dia
    setValidationErrors((prev) =>
      prev.filter(
        (error) => !error.includes("dia") && !error.includes("trabalhar")
      )
    );
  };

  // Remover dia de trabalho
  const handleRemoveWorkDay = (dayKey) => {
    const newSchedule = { ...newStaff.workSchedule };
    delete newSchedule[dayKey];
    setNewStaff((prev) => ({
      ...prev,
      workSchedule: newSchedule,
    }));
  };

  // Atualizar horário de trabalho
  const handleUpdateWorkTime = (dayKey, field, value) => {
    setNewStaff((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [dayKey]: {
          ...prev.workSchedule[dayKey],
          [field]: value,
        },
      },
    }));
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
          <p className="text-red-600 text-center">
            Erro ao carregar funcionários
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-600">Gerencie a equipe da barbearia</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => setShowBlockedStaff(!showBlockedStaff)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showBlockedStaff
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {showBlockedStaff ? "Mostrar Ativos" : "Mostrar Bloqueados"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">
            Erro ao carregar funcionários: {error.message}
          </p>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStaff.map((employee) => (
          <div
            key={employee.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="p-4">
              {/* Header with Avatar and Actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {employee.avatarUrl ? (
                      <img
                        src={employee.avatarUrl}
                        alt={employee.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {employee.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-amber-600">
                      {employee.position}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditStaff(employee)}
                    className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Mostrar botão de desbloquear para funcionários bloqueados */}
                  {showBlockedStaff ? (
                    <button
                      onClick={() => handleUnblockStaff(employee)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Desbloquear funcionário"
                      disabled={updateStaffMutation.isLoading}
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlockStaff(employee)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Bloquear funcionário"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      console.log("🎯 Funcionário selecionado para exclusão:", {
                        id: employee.id,
                        email: employee.email,
                        name: employee.name,
                        fullEmployee: employee,
                      });
                      handleDeleteStaff(employee.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    disabled={deleteStaffMutation.isLoading}
                    title="Deletar funcionário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 mb-3">
                <p className="text-sm text-gray-600">{employee.email}</p>
                <p className="text-sm text-gray-600">{employee.phone}</p>
              </div>

              {/* Blocked Status */}
              {!employee.isActive && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-700 mb-1">
                    🚫 Funcionário Bloqueado
                  </p>
                  <p className="text-xs text-red-600">
                    Motivo: {employee.blockedReason || "Não especificado"}
                  </p>
                  {employee.blockedUntil && (
                    <p className="text-xs text-red-600">
                      Até: {formatDateBR(employee.blockedUntil)}
                    </p>
                  )}
                </div>
              )}

              {/* Skills */}
              {employee.skills && employee.skills.length > 0 ? (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Especialidades ✓
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getValidSkills(employee.skills)
                      .slice(0, 3)
                      .map((skill, index) => {
                        // Garantir que sempre temos uma string para renderizar
                        let skillName = "Serviço";

                        if (typeof skill === "string") {
                          skillName = skill;
                        } else if (
                          typeof skill === "object" &&
                          skill !== null
                        ) {
                          skillName =
                            skill.productName ||
                            skill.serviceName ||
                            skill.name ||
                            "Serviço";
                        }

                        return (
                          <span
                            key={index}
                            className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                          >
                            {skillName}
                          </span>
                        );
                      })}
                    {getValidSkills(employee.skills).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{getValidSkills(employee.skills).length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Especialidades
                  </p>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    Corte masculino
                  </span>
                </div>
              )}

              {/* Work Schedule */}
              {employee.workSchedule &&
              Object.keys(employee.workSchedule).length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Horários
                  </p>
                  <div className="space-y-1">
                    {WEEK_DAYS.map((dayInfo) => {
                      const schedule = employee.workSchedule[dayInfo.key];
                      if (!schedule || !schedule.isWorking) return null;
                      return (
                        <div
                          key={dayInfo.key}
                          className="text-xs text-gray-600"
                        >
                          <span className="font-medium text-gray-700">
                            {dayInfo.label}:
                          </span>
                          <div className="grid grid-cols-2 gap-x-2 ml-2">
                            <span>
                              M: {schedule.morningStart}-{schedule.morningEnd}
                            </span>
                            {schedule.afternoonStart &&
                              schedule.afternoonEnd && (
                                <span>
                                  T: {schedule.afternoonStart}-
                                  {schedule.afternoonEnd}
                                </span>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Horários
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Seg:</span>
                      <div className="grid grid-cols-2 gap-x-2 ml-2">
                        <span>M: 08:00-12:00</span>
                        <span>T: 13:00-17:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">
            {showBlockedStaff
              ? "Nenhum funcionário bloqueado encontrado"
              : "Nenhum funcionário encontrado"}
          </p>
          {!showBlockedStaff && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeiro Funcionário</span>
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {isEditMode ? "Editar Funcionário" : "Novo Funcionário"}
              </h3>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Corrija os seguintes problemas:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form
                onSubmit={isEditMode ? handleUpdateStaff : handleCreateStaff}
                className="space-y-6"
              >
                {/* Photo Section */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Foto do Funcionário
                  </p>
                  <StaffPhotoUpload
                    enterpriseEmail={
                      currentEnterprise?.email || "empresaadmin@xcortes.com"
                    }
                    staffId={editingStaff?.email || newStaff?.email || "temp"}
                    currentPhotoURL={newStaff.avatarUrl}
                    onPhotoUpdated={(result) => {
                      setNewStaff((prev) => ({
                        ...prev,
                        avatarUrl: result?.url || "",
                      }));
                    }}
                    size="large"
                    className="mb-4"
                  />
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Digite o nome completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewStaff((prev) => ({
                          ...prev,
                          email: value,
                        }));
                        // Validação em tempo real
                        const error = validateEmail(value);
                        updateFieldError("email", error);
                      }}
                      placeholder="exemplo@email.com"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        fieldErrors.email ? "border-red-300" : "border-gray-300"
                      }`}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-red-600 text-xs mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={newStaff.phone}
                      onChange={(e) => {
                        const formattedPhone = formatPhone(e.target.value);
                        setNewStaff((prev) => ({
                          ...prev,
                          phone: formattedPhone,
                        }));
                        // Validação em tempo real
                        const error = validatePhone(formattedPhone);
                        updateFieldError("phone", error);
                      }}
                      placeholder="(88) 99999-9999"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        fieldErrors.phone ? "border-red-300" : "border-gray-300"
                      }`}
                      required
                    />
                    {fieldErrors.phone && (
                      <p className="text-red-600 text-xs mt-1">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    <input
                      type="text"
                      value={newStaff.position}
                      onChange={(e) =>
                        setNewStaff((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      placeholder="Ex: Barbeiro, Cabeleireiro, Manicure"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Skills/Services */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Habilidades / Serviços *
                  </label>

                  {/* Available Services */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {services?.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleAddSkill(service)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          newStaff.skills.find(
                            (skill) => skill.serviceId === service.id
                          )
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>

                  {/* Selected Skills */}
                  {newStaff.skills.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-2">
                        Selecionados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getValidSkills(newStaff.skills).map((skill) => (
                          <span
                            key={skill.productId || skill.serviceId}
                            className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>
                              {skill.productName || skill.serviceName}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSkill(
                                  skill.productId || skill.serviceId
                                )
                              }
                              className="text-amber-600 hover:text-amber-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Work Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dias de Trabalho *
                  </label>

                  {/* Day Selection */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => {
                          if (newStaff.workSchedule[day.key]) {
                            handleRemoveWorkDay(day.key);
                          } else {
                            handleAddWorkDay(day.key);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          newStaff.workSchedule[day.key]
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  {/* Work Schedule Details */}
                  {Object.keys(newStaff.workSchedule).length > 0 && (
                    <div className="space-y-4">
                      {WEEK_DAYS.filter(
                        (dayInfo) => newStaff.workSchedule[dayInfo.key]
                      ).map((dayInfo) => {
                        const schedule = newStaff.workSchedule[dayInfo.key];
                        return (
                          <div
                            key={dayInfo.key}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                {dayInfo.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveWorkDay(dayInfo.key)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remover
                              </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Manhã
                                </label>
                                <input
                                  type="time"
                                  value={schedule.morningStart}
                                  onChange={(e) =>
                                    handleUpdateWorkTime(
                                      dayInfo.key,
                                      "morningStart",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  às
                                </label>
                                <input
                                  type="time"
                                  value={schedule.morningEnd}
                                  onChange={(e) =>
                                    handleUpdateWorkTime(
                                      dayInfo.key,
                                      "morningEnd",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Tarde
                                </label>
                                <input
                                  type="time"
                                  value={schedule.afternoonStart}
                                  onChange={(e) =>
                                    handleUpdateWorkTime(
                                      dayInfo.key,
                                      "afternoonStart",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  às
                                </label>
                                <input
                                  type="time"
                                  value={schedule.afternoonEnd}
                                  onChange={(e) =>
                                    handleUpdateWorkTime(
                                      dayInfo.key,
                                      "afternoonEnd",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
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
                        ? updateStaffMutation.isLoading
                        : createStaffMutation.isLoading) ||
                      !newStaff.name ||
                      !newStaff.email ||
                      !newStaff.phone ||
                      !newStaff.position
                    }
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                  >
                    {isEditMode
                      ? updateStaffMutation.isLoading
                        ? "Salvando..."
                        : "Salvar"
                      : createStaffMutation.isLoading
                      ? "Criando..."
                      : "Criar Funcionário"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Block Staff Modal */}
      {showBlockModal && blockingStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bloquear Funcionário
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo do Bloqueio
                  </label>
                  <select
                    value={blockForm.reason}
                    onChange={(e) =>
                      setBlockForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="Férias">Férias</option>
                    <option value="Licença médica">Licença médica</option>
                    <option value="Suspensão">Suspensão</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bloqueado até
                  </label>
                  <input
                    type="date"
                    value={blockForm.blockedUntil}
                    onChange={(e) =>
                      setBlockForm((prev) => ({
                        ...prev,
                        blockedUntil: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockingStaff(null);
                    setBlockForm({ reason: "Férias", blockedUntil: "" });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmBlock}
                  disabled={
                    updateStaffMutation.isLoading || !blockForm.blockedUntil
                  }
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  {updateStaffMutation.isLoading ? "Bloqueando..." : "Bloquear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
