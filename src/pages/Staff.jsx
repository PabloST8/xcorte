import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { employeeFirestoreService } from "../services/employeeFirestoreService";
import { enterpriseProductFirestoreService } from "../services/enterpriseProductFirestoreService";
import { ChevronLeft, Search } from "lucide-react";
import BookingOverlay from "../components/BookingOverlay";

function Staff() {
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
        setEmployees(Array.isArray(emps) ? emps : []);
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
    if (selectedCategory === "Todos") return employees;
    // Se um funcionário tem skills com produtos de uma categoria específica, mantém
    const productIdsInCat = new Set(
      (services || [])
        .filter((s) => s.category === selectedCategory)
        .map((s) => s.id)
    );
    return employees.filter((e) =>
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
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to={getEnterpriseUrl("")}>
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{titleFromUrl}</h1>
        <Search className="w-6 h-6 text-gray-900" />
      </header>

      <div className="px-6 py-6">
        {/* Category Tabs */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Nossos
            <br />
            <span className="text-2xl">Funcionários</span>
          </h2>

          <div className="flex space-x-3 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
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
        <div className="space-y-4">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-50 rounded-xl animate-pulse"
                />
              ))
            : filteredStaff.map((staff) => {
                const staffServices = getStaffServices(staff);

                return (
                  <div key={staff.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={staff.avatarUrl || staff.image}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="w-full h-full bg-blue-100 rounded-full hidden items-center justify-center text-blue-600 font-bold text-lg">
                          {staff.name.charAt(0)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900">
                            {staff.name}
                          </h3>
                          {staff.specialty && (
                            <p className="text-sm text-gray-600">
                              {staff.specialty}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">
                            Dias: {formatWorkDays(staff)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {staffServices.slice(0, 2).map((service) => (
                            <span
                              key={service.id}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {service.name}
                            </span>
                          ))}
                          {staffServices.length > 2 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{staffServices.length - 2} mais
                            </span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            to={getEnterpriseUrl(`staff-detail?id=${staff.id}`)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center text-sm font-medium"
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
                              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center text-sm font-medium"
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
        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum funcionário encontrado
            </h3>
            <p className="text-gray-600">
              Não temos funcionários especializados nesta categoria no momento.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Dica</h3>
          <p className="text-sm text-gray-600">
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
