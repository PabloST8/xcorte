import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Brush,
  Scissors,
  Palette,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { allServices, staffMembers } from "../data/services.js";

function Cart() {
  const [searchParams] = useSearchParams();
  const [cartItems, setCartItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedStaffName, setSelectedStaffName] = useState(
    "Selecione o Funcionário"
  );
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  useEffect(() => {
    // Simular item adicionado baseado nos parâmetros da URL
    const serviceName = searchParams.get("service") || "Corte de cabelo";
    const servicePrice = parseInt(searchParams.get("price")) || 25;
    const serviceDuration = searchParams.get("duration") || "25 min";
    const serviceCategory = searchParams.get("category") || "Cortes";
    const staffFromUrl = searchParams.get("staff");

    // Definir funcionário se veio da URL
    if (staffFromUrl) {
      const staff = staffMembers.find((s) => s.name === staffFromUrl);
      if (staff) {
        setSelectedStaff(staff);
        setSelectedStaffName(staff.name);
      }
    }

    let serviceIcon = <Brush className="w-8 h-8 text-blue-600" />;
    if (serviceCategory === "Cortes") {
      serviceIcon = <Scissors className="w-8 h-8 text-blue-600" />;
    } else if (serviceCategory === "Pinturas") {
      serviceIcon = <Palette className="w-8 h-8 text-blue-600" />;
    }

    setCartItems([
      {
        id: 1,
        name: serviceName,
        duration: serviceDuration,
        price: servicePrice,
        category: serviceCategory,
        icon: serviceIcon,
      },
    ]);

    // Gerar sugestões baseadas na categoria do serviço
    const relatedServices = allServices
      .filter(
        (service) =>
          service.category !== serviceCategory && service.name !== serviceName
      )
      .slice(0, 2);

    const suggestionItems = relatedServices.map((service) => {
      let suggestionIcon = <Brush className="w-8 h-8 text-blue-600" />;
      if (service.category === "Cortes") {
        suggestionIcon = <Scissors className="w-8 h-8 text-blue-600" />;
      } else if (service.category === "Pinturas") {
        suggestionIcon = <Palette className="w-8 h-8 text-blue-600" />;
      }

      return {
        ...service,
        icon: suggestionIcon,
      };
    });

    setSuggestions(suggestionItems);
  }, [searchParams]);

  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    setSelectedStaffName(staff.name);
    setIsStaffDropdownOpen(false);
  };

  const toggleStaffDropdown = () => {
    setIsStaffDropdownOpen(!isStaffDropdownOpen);
  };

  const addSuggestionToCart = (suggestion) => {
    const newItem = {
      id: cartItems.length + 1,
      name: suggestion.name,
      duration: suggestion.duration,
      price: parseInt(suggestion.price.split("-")[0].replace("R$", "")),
      category: suggestion.category,
      icon: suggestion.icon,
    };
    setCartItems([...cartItems, newItem]);
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <Link to="/service-details">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Carrinho</h1>
        <button className="text-blue-600 font-medium">Editar</button>
      </header>

      <div className="px-6 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{item.price}R$</p>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Selecionar
            <br />
            Funcionário
          </h3>

          <div className="relative">
            <button
              onClick={toggleStaffDropdown}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {selectedStaff?.image ? (
                    <img
                      src={selectedStaff.image}
                      alt={selectedStaff.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-lg">
                      {selectedStaffName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {selectedStaffName}
                  </span>
                  {selectedStaff && (
                    <p className="text-sm text-gray-600">
                      {selectedStaff.specialty}
                    </p>
                  )}
                </div>
              </div>
              {isStaffDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Staff Dropdown */}
            {isStaffDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                {staffMembers.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleStaffSelect(staff)}
                    className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={staff.image}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-sm text-gray-600">{staff.specialty}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>⭐ {staff.rating}</span>
                        <span>•</span>
                        <span>{staff.experience}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Suggestions</h3>

          <div className="space-y-3">
            {suggestions.slice(0, 1).map((suggestion) => (
              <div key={suggestion.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {suggestion.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{suggestion.duration}</span>
                      <span>•</span>
                      <span className="font-semibold">{suggestion.price}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addSuggestionToCart(suggestion)}
                    className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Link
          to={`/appointment?service=${encodeURIComponent(
            cartItems[0]?.name || "Serviço"
          )}&price=${cartItems[0]?.price || 25}&duration=${encodeURIComponent(
            cartItems[0]?.duration || "25 min"
          )}&staff=${encodeURIComponent(selectedStaff?.name || "")}&staffId=${
            selectedStaff?.id || ""
          }`}
          className={`block w-full py-4 rounded-xl font-semibold text-lg text-center transition-colors ${
            selectedStaff
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={(e) => {
            if (!selectedStaff) {
              e.preventDefault();
              alert("Por favor, selecione um funcionário antes de continuar.");
            }
          }}
        >
          Continuar
        </Link>

        {/* Total */}
        <div className="text-center">
          <p className="text-gray-600">
            Total: <span className="font-bold text-gray-900">{subtotal}R$</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Cart;
