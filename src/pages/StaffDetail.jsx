import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, MapPin, Calendar, Phone } from "lucide-react";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { employeeFirestoreService } from "../services/employeeFirestoreService";
import { enterpriseProductFirestoreService } from "../services/enterpriseProductFirestoreService";
import { formatDuration, formatPrice } from "../types/api.js";
import BookingOverlay from "../components/BookingOverlay";

function StaffDetail() {
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { currentEnterprise } = useEnterprise();
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get("id");
  const [staff, setStaff] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (!staffId || !currentEnterprise?.email) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const [empList, prods] = await Promise.all([
          employeeFirestoreService.list(currentEnterprise.email),
          enterpriseProductFirestoreService.list(currentEnterprise.email),
        ]);
        const emp = (empList || []).find(
          (e) => String(e.id) === String(staffId)
        );
        setStaff(emp || null);
        setServices(Array.isArray(prods) ? prods : []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [staffId, currentEnterprise]);

  const staffServices = useMemo(() => {
    if (!staff) return [];
    const ids = new Set(
      (staff.skills || []).map((s) => s.productId).filter(Boolean)
    );
    return (services || []).filter((s) => ids.has(s.id));
  }, [staff, services]);

  const formatWorkDays = (emp) => {
    const ws = emp?.workSchedule || {};
    const order = [
      ["monday", "Seg"],
      ["tuesday", "Ter"],
      ["wednesday", "Qua"],
      ["thursday", "Qui"],
      ["friday", "Sex"],
      ["saturday", "Sáb"],
      ["sunday", "Dom"],
    ];
    const days = order.filter(([k]) => ws[k]?.isWorking).map(([, l]) => l);
    return days.length ? days.join(", ") : "Agenda não definida";
  };

  if (!isLoading && !staff) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Funcionário não encontrado
          </h2>
          <Link
            to={getEnterpriseUrl("staff")}
            className="text-blue-600 mt-2 block"
          >
            Voltar para funcionários
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to={getEnterpriseUrl("staff")}>
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">
          {staff?.name || "Perfil"}
        </h1>
        <div></div>
      </header>

      <div className="px-6 py-6">
        {/* Staff Profile */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200">
            {staff?.avatarUrl || staff?.image ? (
              <img
                src={staff.avatarUrl || staff.image}
                alt={staff?.name || "Funcionário"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div className="w-full h-full bg-blue-100 rounded-full hidden items-center justify-center text-blue-600 font-bold text-2xl">
              {staff?.name?.charAt(0) || "F"}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {staff?.name || "Funcionário"}
          </h2>
          {staff?.specialty && (
            <p className="text-gray-600 mb-2">{staff.specialty}</p>
          )}
          <p className="text-sm text-gray-600 mb-6">
            Dias: {formatWorkDays(staff)}
          </p>

          {staff?.description && (
            <p className="text-gray-600 mb-6">{staff.description}</p>
          )}

          <div className="flex justify-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>Agendar</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <Phone className="w-4 h-4" />
              <span>Contato</span>
            </button>
          </div>
        </div>

        {/* Dias de trabalho */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Dias de Trabalho
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 text-gray-700">
            {formatWorkDays(staff)}
          </div>
        </div>

        {/* Services */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Serviços Especializados
          </h3>
          <div className="space-y-3">
            {staffServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {service.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{formatDuration(service.duration || 30)}</span>
                    <span>•</span>
                    <span className="font-semibold">
                      {formatPrice(service.priceInCents || 0)}
                    </span>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  onClick={() => {
                    setSelectedProduct(service);
                    setOverlayOpen(true);
                  }}
                >
                  Agendar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Localização</h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Barbearia Corte</p>
                <p className="text-sm text-gray-600">
                  Rua das Flores, 123 - Centro
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Booking Overlay */}
      <BookingOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        product={selectedProduct}
        employees={staff ? [staff] : []}
      />
    </div>
  );
}

export default StaffDetail;
