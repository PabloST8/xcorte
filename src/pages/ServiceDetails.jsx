import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Scissors,
  Brush,
  Palette,
  ChevronRight,
} from "lucide-react";
import { serviceCategories, allServices } from "../data/services.js";

function Services() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "Todos";
  const titleFromUrl =
    searchParams.get("title") ||
    serviceCategories.find((cat) => cat.id === categoryFromUrl)?.displayName ||
    "Serviços";

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Função para obter ícone baseado na categoria
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

  // Filtrar serviços baseado na categoria selecionada
  const filteredServices =
    selectedCategory === "Todos"
      ? allServices.map((service) => ({
          ...service,
          icon: getServiceIcon(service.category),
        }))
      : allServices
          .filter((service) => service.category === selectedCategory)
          .map((service) => ({
            ...service,
            icon: getServiceIcon(service.category),
          }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
        <Link to="/">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold">{titleFromUrl}</h1>
        <Search className="w-6 h-6" />
      </header>

      <div className="px-6 py-6">
        {/* Quiz Section */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl font-bold mb-2">
            What kind of hair suits you?
          </h2>
          <p className="text-blue-100 mb-4 text-sm">
            Start now to find out what kind of hair suits you
          </p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold">
            Start
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Nossos
            <br />
            Serviços
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

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.map((service) => (
            <Link
              key={service.id}
              to={`/cart?service=${encodeURIComponent(
                service.name
              )}&price=${service.price
                .split("-")[0]
                .replace("R$", "")}&duration=${encodeURIComponent(
                service.duration
              )}&category=${service.category}`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">{service.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{service.duration}</span>
                    <span>•</span>
                    <span className="font-semibold">{service.price}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;
