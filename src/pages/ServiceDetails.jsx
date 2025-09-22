import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { enterpriseProductFirestoreService } from "../services/enterpriseProductFirestoreService";
import { formatPrice, formatDuration } from "../types/api.js";
import {
  ChevronLeft,
  Search,
  Scissors,
  Brush,
  Palette,
  ChevronRight,
} from "lucide-react";
import { employeeFirestoreService } from "../services/employeeFirestoreService";
import BookingOverlay from "../components/BookingOverlay";

function Services() {
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { currentEnterprise } = useEnterprise();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "Todos";
  const titleFromUrl = searchParams.get("title") || "Serviços";

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    if (!currentEnterprise?.email) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await enterpriseProductFirestoreService.list(
          currentEnterprise.email
        );
        setServices(Array.isArray(data) ? data : []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentEnterprise]);

  // Load employees for this enterprise
  useEffect(() => {
    if (!currentEnterprise?.email) return;
    const run = async () => {
      try {
        const list = await employeeFirestoreService.list(
          currentEnterprise.email
        );
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
        setEmployees([]);
      }
    };
    run();
  }, [currentEnterprise]);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set((services || []).map((s) => s.category).filter(Boolean))
    );
    return ["Todos", ...cats];
  }, [services]);

  const getServiceIcon = (category) => {
    switch (category) {
      case "Cortes":
        return <Scissors className="w-8 h-8 text-blue-600" />;
      case "Barba":
        return <Brush className="w-8 h-8 text-blue-600" />;
      case "Pinturas":
        return <Palette className="w-8 h-8 text-blue-600" />;
      default:
        return <Scissors className="w-8 h-8 text-blue-600" />;
    }
  };

  const filteredServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    const filteredByCategory = (
      selectedCategory === "Todos"
        ? list
        : list.filter((s) => s.category === selectedCategory)
    ).map((s) => {
      console.log(
        `[ServiceDetails] Serviço: ${s.name}, priceInCents:`,
        s.priceInCents,
        "price:",
        s.price,
        "formatPrice result:",
        formatPrice(s.priceInCents || 0)
      );
      return {
        ...s,
        icon: getServiceIcon(s.category),
        priceInCents: s.priceInCents ?? s.price,
      };
    });

    // Filtrar apenas serviços que têm profissionais vinculados
    return filteredByCategory.filter((service) => {
      // Verificar se há funcionários com skills específicas para este serviço
      const hasSpecificEmployees =
        Array.isArray(employees) &&
        employees.some((employee) => {
          const skills = Array.isArray(employee.skills) ? employee.skills : [];
          return skills.some(
            (skill) =>
              String(skill.productId) === String(service.id) &&
              skill.canPerform !== false
          );
        });

      return hasSpecificEmployees;
    });
  }, [services, selectedCategory, employees]);

  const eligibleEmployeesForProduct = (product) => {
    const list = Array.isArray(employees) ? employees : [];
    if (!product?.id) return list;
    const filtered = list.filter((e) => {
      const skills = Array.isArray(e.skills) ? e.skills : [];
      return skills.some(
        (sk) =>
          String(sk.productId) === String(product.id) && sk.canPerform !== false
      );
    });
    return filtered.length ? filtered : list;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
        <Link to={getEnterpriseUrl("")}>
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold">{titleFromUrl}</h1>
        <Search className="w-6 h-6" />
      </header>

      <div className="px-6 py-6">
        {/* Category Tabs */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Nossos
            <br />
            Serviços
          </h2>

          <div className="flex space-x-3 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-50 rounded-xl animate-pulse"
              />
            ))
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Nenhum serviço disponível no momento
              </p>
              <p className="text-sm text-gray-500">
                Os serviços ficam disponíveis quando há profissionais
                especializados
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedProduct(service);
                  setOverlayOpen(true);
                }}
                className="w-full text-left flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{formatDuration(service.duration || 30)}</span>
                      <span>•</span>
                      <span className="font-semibold">
                        {formatPrice(service.priceInCents || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Booking Overlay */}
      <BookingOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        product={selectedProduct}
        employees={
          selectedProduct
            ? eligibleEmployeesForProduct(selectedProduct)
            : employees
        }
      />
    </div>
  );
}

export default Services;
