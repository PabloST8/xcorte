import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Calendar,
  Phone,
} from "lucide-react";
import { staffMembers, allServices } from "../data/services.js";

function StaffDetail() {
  const [searchParams] = useSearchParams();
  const staffId = parseInt(searchParams.get("id"));
  const [staff, setStaff] = useState(null);
  const [staffServices, setStaffServices] = useState([]);

  useEffect(() => {
    const foundStaff = staffMembers.find((s) => s.id === staffId);
    if (foundStaff) {
      setStaff(foundStaff);

      // Obter serviços baseado na especialidade
      let services = [];
      if (foundStaff.specialty.includes("Cortes")) {
        services = allServices.filter(
          (service) => service.category === "Cortes"
        );
      } else if (foundStaff.specialty.includes("Barba")) {
        services = allServices.filter(
          (service) => service.category === "Barba"
        );
      } else if (
        foundStaff.specialty.includes("Pintura") ||
        foundStaff.specialty.includes("Coloração")
      ) {
        services = allServices.filter(
          (service) => service.category === "Pinturas"
        );
      } else {
        services = allServices.slice(0, 4);
      }
      setStaffServices(services);
    }
  }, [staffId]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Funcionário não encontrado
          </h2>
          <Link to="/staff" className="text-blue-600 mt-2 block">
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
        <Link to="/staff">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{staff.name}</h1>
        <div></div>
      </header>

      <div className="px-6 py-6">
        {/* Staff Profile */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200">
            <img
              src={staff.image}
              alt={staff.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="w-full h-full bg-blue-100 rounded-full hidden items-center justify-center text-blue-600 font-bold text-2xl">
              {staff.name.charAt(0)}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {staff.name}
          </h2>
          <p className="text-gray-600 mb-4">{staff.specialty}</p>

          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-1 font-semibold text-gray-900">
                {staff.rating}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-1" />
              <span>{staff.experience}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{staff.description}</p>

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

        {/* Availability */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Disponibilidade
          </h3>
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="font-semibold text-green-800">Disponível Hoje</p>
                <p className="text-sm text-green-600">Próximo horário: 14:30</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Serviços Especializados
          </h3>
          <div className="space-y-3">
            {staffServices.map((service) => (
              <Link
                key={service.id}
                to={`/cart?service=${encodeURIComponent(
                  service.name
                )}&price=${service.price
                  .split("-")[0]
                  .replace("R$", "")}&duration=${encodeURIComponent(
                  service.duration
                )}&category=${service.category}&staff=${encodeURIComponent(
                  staff.name
                )}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {service.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{service.duration}</span>
                    <span>•</span>
                    <span className="font-semibold">{service.price}</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Agendar
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Reviews Preview */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Avaliações Recentes
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold text-sm">
                      M
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">Marcos</span>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                "Excelente profissional! Sempre sou muito bem atendido e o
                resultado fica perfeito."
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold text-sm">
                      R
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">Roberto</span>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                "Pontual, técnico e muito atencioso. Recomendo!"
              </p>
            </div>
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
    </div>
  );
}

export default StaffDetail;
