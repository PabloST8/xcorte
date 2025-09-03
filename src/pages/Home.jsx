import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Scissors,
  Brush,
  Palette,
  Bell,
  Home as HomeIcon,
  ShoppingBag,
  User,
  Calendar as CalendarIcon,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { productService } from "../services/productService";

function Home() {
  const location = useLocation();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();

  useEffect(() => {
    // Verificar se há mensagem de boas-vindas
    if (location.state?.message) {
      setWelcomeMessage(location.state.message);
    }
  }, [location]);

  useEffect(() => {
    loadServices();
  }, [currentEnterprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadServices = async () => {
    if (!currentEnterprise) return;

    try {
      setIsLoading(true);
      const response = await productService.getProducts(
        currentEnterprise.email
      );

      if (response.success && response.data) {
        setServices(response.data);

        // Extrair categorias únicas dos produtos
        const uniqueCategories = [
          ...new Set(
            response.data.map((service) => service.category).filter(Boolean)
          ),
        ];
        setCategories([
          { id: "Todos", name: "Todos", displayName: "Todos os Serviços" },
          ...uniqueCategories.map((cat) => ({
            id: cat,
            name: cat,
            displayName: cat,
          })),
        ]);
      } else {
        // Usar dados de fallback se não houver produtos
        setServices([]);
        setCategories([
          { id: "Todos", name: "Todos", displayName: "Todos os Serviços" },
          { id: "Cortes", name: "Cortes", displayName: "Corte de Cabelo" },
          { id: "Barba", name: "Barba", displayName: "Serviços de Barba" },
          {
            id: "Pinturas",
            name: "Pinturas",
            displayName: "Pintura e Coloração",
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      // Usar dados de fallback em caso de erro
      setServices([]);
      setCategories([
        { id: "Todos", name: "Todos", displayName: "Todos os Serviços" },
        { id: "Cortes", name: "Cortes", displayName: "Corte de Cabelo" },
        { id: "Barba", name: "Barba", displayName: "Serviços de Barba" },
        {
          id: "Pinturas",
          name: "Pinturas",
          displayName: "Pintura e Coloração",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Dados de serviços de fallback para exibir quando não há produtos da API
  const fallbackServices = [
    {
      id: 1,
      name: "Cabelo",
      category: "Cortes",
      icon: <Scissors className="w-12 h-12 text-blue-500" />,
    },
    {
      id: 2,
      name: "Barba",
      category: "Barba",
      icon: <Brush className="w-12 h-12 text-blue-500" />,
    },
    {
      id: 3,
      name: "Pintura",
      category: "Pinturas",
      icon: <Palette className="w-12 h-12 text-blue-500" />,
    },
  ];

  // Usar serviços da API ou fallback se não houver dados
  const displayServices =
    services.length > 0
      ? services.map((service) => ({
          id: service.id,
          name: service.name,
          category: service.category,
          price: `R$ ${service.price}`,
          duration: `${service.duration} min`,
          description: service.description,
          // Usar ícones baseados na categoria
          icon:
            service.category === "Cortes" ? (
              <Scissors className="w-12 h-12 text-blue-500" />
            ) : service.category === "Barba" ? (
              <Brush className="w-12 h-12 text-blue-500" />
            ) : service.category === "Pinturas" ? (
              <Palette className="w-12 h-12 text-blue-500" />
            ) : (
              <Scissors className="w-12 h-12 text-blue-500" />
            ),
        }))
      : fallbackServices;

  // Dados dos funcionários (fallback)
  const staff = [
    {
      id: 1,
      name: "Carlos",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      name: "Pedro",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      name: "João",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Corte</h1>
        <div className="flex items-center space-x-3">
          {/* Botão Admin (só aparece para administradores) */}
          {user && (user.role === "admin" || user.role === "owner") && (
            <Link
              to="/admin/dashboard"
              className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              title="Painel Administrativo"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}

          {/* Botão de Login/Logout */}
          {user ? (
            <Link
              to="/profile"
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium"
              title={user.name}
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Entrar
            </Link>
          )}

          <div className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </header>

      <div className="px-6 pb-20">
        {/* Mensagem de boas-vindas */}
        {welcomeMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-500">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{welcomeMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Promoção do Dia */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Promoção do Dia</h2>
            <p className="text-blue-100 mb-4">
              Corte + Barba com 25% de desconto
            </p>
            <Link
              to="/service-details?category=Todos&title=Serviços"
              className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Agendar Agora
            </Link>
          </div>
          {/* Elementos decorativos de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="text-6xl font-bold text-blue-400 transform rotate-12">
              25
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 rounded-full opacity-30"></div>
          <div className="absolute top-6 right-16 w-12 h-12 bg-blue-400 rounded-full opacity-40"></div>
        </div>

        {/* Nossos Serviços */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Nossos
              <br />
              <span className="text-2xl">Serviços</span>
            </h2>
            <Link
              to="/service-details?category=Todos&title=Todos os Serviços"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Ver Todos
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {isLoading
              ? // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center animate-pulse"
                  >
                    <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-4"></div>
                    <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))
              : displayServices.slice(0, 3).map((service) => (
                  <Link
                    key={service.id}
                    to={`/service-details?category=${service.category}&title=${service.name}`}
                    className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="mb-4 p-4 bg-blue-100 rounded-2xl">
                      {service.icon || (
                        <Scissors className="w-12 h-12 text-blue-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-center text-sm">
                      {service.name}
                    </h3>
                    {service.price && (
                      <p className="text-xs text-gray-600 mt-1">
                        R$ {service.price}
                      </p>
                    )}
                  </Link>
                ))}
          </div>
        </div>

        {/* Nossos Funcionários */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Nossos
              <br />
              <span className="text-2xl">Funcionários</span>
            </h2>
            <Link
              to="/staff?category=Todos&title=Nossos Funcionários"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Ver Todos
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 bg-gray-200">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="w-full h-full bg-gray-300 rounded-2xl hidden items-center justify-center text-gray-600 text-xs">
                    Foto
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  {member.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div className="bg-blue-50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bem-vindo de volta, {user.name}! 👋
            </h3>
            <p className="text-gray-600">
              Pronto para agendar seu próximo serviço?
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-center space-x-12">
          <Link to="/" className="flex flex-col items-center">
            <HomeIcon className="w-6 h-6 text-blue-500" />
            <span className="text-xs text-blue-500 font-medium mt-1">
              Início
            </span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Carrinho</span>
          </Link>
          <Link to="/calendar" className="flex flex-col items-center">
            <CalendarIcon className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Agenda</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center">
            <User className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
