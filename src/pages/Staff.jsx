import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { employeeFirestoreService } from "../services/employeeFirestoreService";
import { enterpriseProductFirestoreService } from "../services/enterpriseProductFirestoreService";
import { ChevronLeft, Search } from "lucide-react";
import BookingOverlay from "../components/BookingOverlay";

function Staff() {
  console.log("📄 PÁGINA STAFF CARREGADA - Iniciando componente Staff");

  const navigate = useNavigate();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { currentEnterprise } = useEnterprise();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "Todos";
  const titleFromUrl = searchParams.get("title") || "Nossos Funcionários";

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    if (!currentEnterprise?.email) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const [emps, prods] = await Promise.all([
          employeeFirestoreService.list(currentEnterprise.email),
          enterpriseProductFirestoreService.list(currentEnterprise.email),
        ]);

        // Debug: log dos funcionários para identificar registros inválidos
        console.log("🔍 Funcionários carregados (RAW):", emps);

        // Debug detalhado de cada funcionário
        (emps || []).forEach((emp, index) => {
          console.log(`🔍 Funcionário ${index}:`, {
            id: emp?.id,
            name: emp?.name,
            email: emp?.email,
            position: emp?.position,
            isActive: emp?.isActive,
            specialty: emp?.specialty,
            fullData: emp,
          });
        });

        // Filtrar funcionários válidos com critérios mais rigorosos
        const validEmployees = (emps || []).filter((emp) => {
          // Lista de nomes genéricos que devem ser filtrados
          const genericNames = [
            "Funcionário",
            "funcionário",
            "FUNCIONÁRIO",
            "Staff",
            "Employee",
            "",
          ];

          // Validações mais rigorosas
          const hasValidName =
            emp &&
            emp.name &&
            emp.name.trim() !== "" &&
            !genericNames.includes(emp.name.trim()) &&
            emp.name.length > 2; // Nome deve ter mais de 2 caracteres

          const hasValidEmail =
            emp &&
            emp.email &&
            emp.email.trim() !== "" &&
            emp.email.includes("@"); // Email deve ter @

          const isActive = emp && emp.isActive !== false;

          const hasValidPosition =
            emp && emp.position && emp.position.trim() !== "";

          const hasValidId = emp && emp.id && emp.id.trim() !== "";

          const isValid =
            hasValidName &&
            hasValidEmail &&
            isActive &&
            hasValidPosition &&
            hasValidId;

          if (!isValid) {
            console.warn(`❌ Funcionário inválido REJEITADO:`, {
              id: emp?.id,
              name: emp?.name,
              email: emp?.email,
              position: emp?.position,
              isActive: emp?.isActive,
              validations: {
                hasValidName,
                hasValidEmail,
                hasValidPosition,
                hasValidId,
                isActive,
              },
              fullData: emp,
            });
          } else {
            console.log(`✅ Funcionário válido ACEITO:`, {
              id: emp.id,
              name: emp.name,
              email: emp.email,
              position: emp.position,
            });
          }

          return isValid;
        });

        console.log(
          `✅ ${validEmployees.length} funcionários válidos de ${
            emps?.length || 0
          } total`
        );

        setEmployees(validEmployees);
        setServices(Array.isArray(prods) ? prods : []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentEnterprise]);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set((services || []).map((s) => s.category).filter(Boolean))
    );
    return ["Todos", ...cats];
  }, [services]);

  const filteredStaff = useMemo(() => {
    console.log(
      `🔍 FILTRO FINAL: Processando ${employees.length} funcionários`
    );

    // Lista de nomes genéricos que devem ser filtrados
    const genericNames = [
      "Funcionário",
      "funcionário",
      "FUNCIONÁRIO",
      "Staff",
      "Employee",
      "",
    ];

    // Primeiro filtrar funcionários válidos com critérios rigorosos
    const validEmployees = employees.filter((emp) => {
      const hasValidName =
        emp &&
        emp.name &&
        emp.name.trim() !== "" &&
        !genericNames.includes(emp.name.trim()) &&
        emp.name.length > 2;

      const hasValidEmail =
        emp && emp.email && emp.email.trim() !== "" && emp.email.includes("@");

      const hasValidPosition =
        emp && emp.position && emp.position.trim() !== "";

      const isActive = emp && emp.isActive !== false;
      const hasValidId = emp && emp.id && emp.id.trim() !== "";

      const isValid =
        hasValidName &&
        hasValidEmail &&
        hasValidPosition &&
        isActive &&
        hasValidId;

      if (!isValid && emp) {
        console.warn(`❌ FILTRO FINAL - Funcionário rejeitado:`, {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          position: emp.position,
          isActive: emp.isActive,
          validations: {
            hasValidName,
            hasValidEmail,
            hasValidPosition,
            hasValidId,
            isActive,
          },
        });
      }

      return isValid;
    });

    console.log(
      `✅ FILTRO FINAL: ${validEmployees.length} funcionários válidos de ${employees.length}`
    );

    if (selectedCategory === "Todos") return validEmployees;

    // Se um funcionário tem skills com produtos de uma categoria específica, mantém
    const productIdsInCat = new Set(
      (services || [])
        .filter((s) => s.category === selectedCategory)
        .map((s) => s.id)
    );
    return validEmployees.filter((e) =>
      Array.isArray(e.skills)
        ? e.skills.some((sk) => productIdsInCat.has(sk.productId))
        : true
    );
  }, [employees, services, selectedCategory]);

  const getStaffServices = (emp) => {
    const ids = new Set(
      (emp.skills || []).map((sk) => sk.productId).filter(Boolean)
    );
    const list = (services || []).filter((s) => ids.has(s.id));
    return list.slice(0, 3);
  };

  const formatWorkDays = (emp) => {
    const ws = emp.workSchedule || {};
    const order = [
      ["monday", "Seg"],
      ["tuesday", "Ter"],
      ["wednesday", "Qua"],
      ["thursday", "Qui"],
      ["friday", "Sex"],
      ["saturday", "Sáb"],
      ["sunday", "Dom"],
    ];
    const days = order
      .filter(([k]) => ws[k]?.isWorking)
      .map(([, label]) => label);
    return days.length ? days.join(", ") : "Agenda não definida";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate mx-4">
          {titleFromUrl}
        </h1>
        <Search className="w-6 h-6 text-gray-900" />
      </header>

      <div className="px-4 sm:px-6 py-6">
        {/* Category Tabs */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Nossos Funcionários
          </h2>

          <div className="flex space-x-2 sm:space-x-3 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-3 sm:space-y-4">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 sm:h-28 bg-gray-50 rounded-xl animate-pulse"
                />
              ))
            : filteredStaff
                .filter((staff) => {
                  // Filtro final de segurança extremamente rigoroso
                  const genericNames = [
                    "Funcionário",
                    "funcionário",
                    "FUNCIONÁRIO",
                    "Staff",
                    "Employee",
                    "",
                  ];
                  const isValidForDisplay =
                    staff &&
                    staff.name &&
                    staff.name.trim() !== "" &&
                    !genericNames.includes(staff.name.trim()) &&
                    staff.name.length > 2 &&
                    staff.email &&
                    staff.email.includes("@");

                  if (!isValidForDisplay) {
                    console.error(
                      `🚫 RENDERIZAÇÃO BLOQUEADA - Funcionário inválido:`,
                      staff
                    );
                  }

                  return isValidForDisplay;
                })
                .map((staff) => {
                  const staffServices = getStaffServices(staff);

                  return (
                    <div
                      key={staff.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={staff.avatarUrl || staff.image}
                            alt={staff.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="w-full h-full bg-blue-100 rounded-full hidden items-center justify-center text-blue-600 font-bold text-base sm:text-lg">
                            {staff?.name?.charAt(0) || "F"}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="mb-2 sm:mb-3">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {staff.name}
                            </h3>
                            {staff.specialty && (
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {staff.specialty}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              Dias: {formatWorkDays(staff)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
                            {staffServices.slice(0, 2).map((service) => (
                              <span
                                key={service.id}
                                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full truncate"
                                style={{
                                  maxWidth: "100px",
                                }}
                                title={service.name}
                              >
                                {service.name}
                              </span>
                            ))}
                            {staffServices.length > 2 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex-shrink-0">
                                +{staffServices.length - 2}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Link
                              to={getEnterpriseUrl(
                                `staff-detail?id=${staff.id}`
                              )}
                              className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-center text-xs sm:text-sm font-medium"
                            >
                              Ver Perfil
                            </Link>
                            {staffServices[0] && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(staffServices[0]);
                                  setSelectedStaff(staff);
                                  setOverlayOpen(true);
                                }}
                                className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center text-xs sm:text-sm font-medium"
                              >
                                Agendar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
        </div>

        {/* Fallback quando não há funcionários na categoria */}
        {filteredStaff.length === 0 && !isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Nenhum funcionário encontrado
            </h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Não temos funcionários especializados nesta categoria no momento.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
            Dica
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Selecione um funcionário para ver seus serviços especializados e
            agendar diretamente.
          </p>
        </div>
      </div>
      {/* Booking Overlay */}
      <BookingOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        product={selectedProduct}
        employees={selectedStaff ? [selectedStaff] : []}
      />
    </div>
  );
}

export default Staff;
