import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Search, Star, Clock, ChevronRight } from "lucide-react";
import {
  staffMembers,
  serviceCategories,
  allServices,
} from "../data/services.js";

function Staff() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "Todos";
  const titleFromUrl = searchParams.get("title") || "Nossos Funcionários";

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Filtrar funcionários baseado na categoria
  const getStaffByCategory = (category) => {
    if (category === "Todos") return staffMembers;

    return staffMembers.filter((staff) => {
      switch (category) {
        case "Cortes":
          return staff.specialty.includes("Cortes");
        case "Barba":
          return staff.specialty.includes("Barba");
        case "Pinturas":
          return (
            staff.specialty.includes("Pintura") ||
            staff.specialty.includes("Coloração")
          );
        default:
          return true;
      }
    });
  };

  const filteredStaff = getStaffByCategory(selectedCategory);

  // Obter serviços de um funcionário baseado na especialidade
  const getStaffServices = (staff) => {
    if (staff.specialty.includes("Cortes")) {
      return allServices
        .filter((service) => service.category === "Cortes")
        .slice(0, 3);
    }
    if (staff.specialty.includes("Barba")) {
      return allServices
        .filter((service) => service.category === "Barba")
        .slice(0, 3);
    }
    if (
      staff.specialty.includes("Pintura") ||
      staff.specialty.includes("Coloração")
    ) {
      return allServices
        .filter((service) => service.category === "Pinturas")
        .slice(0, 3);
    }
    return allServices.slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to="/">
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
            {serviceCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-4">
          {filteredStaff.map((staff) => {
            const staffServices = getStaffServices(staff);

            return (
              <div key={staff.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={staff.image}
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
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {staff.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {staff.specialty}
                        </p>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-700">
                              {staff.rating}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{staff.experience}</span>
                          </div>
                        </div>
                      </div>
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
                        to={`/staff-detail?id=${staff.id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center text-sm font-medium"
                      >
                        Ver Perfil
                      </Link>
                      <Link
                        to={`/cart?service=${encodeURIComponent(
                          staffServices[0]?.name || "Serviço"
                        )}&price=${
                          staffServices[0]?.price
                            .split("-")[0]
                            .replace("R$", "") || "25"
                        }&duration=${encodeURIComponent(
                          staffServices[0]?.duration || "30 min"
                        )}&category=${
                          staffServices[0]?.category || "Cortes"
                        }&staff=${encodeURIComponent(staff.name)}`}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-center text-sm font-medium"
                      >
                        Agendar
                      </Link>
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
    </div>
  );
}

export default Staff;
