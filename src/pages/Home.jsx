import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Scissors, Brush, Palette, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { enterpriseProductFirestoreService } from "../services/enterpriseProductFirestoreService";
import { employeeFirestoreService } from "../services/employeeFirestoreService";

function Home() {
  const location = useLocation();
  const { user } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  // welcome message
  useEffect(() => {
    if (location.state?.message) {
      setWelcomeMessage(location.state.message);
    }
  }, [location]);

  // load services and employees when enterprise changes
  useEffect(() => {
    if (!currentEnterprise?.email) return;

    const load = async () => {
      try {
        setIsLoadingServices(true);
        const data = await enterpriseProductFirestoreService.list(
          currentEnterprise.email
        );
        setServices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro ao carregar serviços:", e);
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }

      try {
        setIsLoadingStaff(true);
        const list = await employeeFirestoreService.list(
          currentEnterprise.email
        );
        setEmployees(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
        setEmployees([]);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    load();
  }, [currentEnterprise]);

  // fallback categories when none in Firestore services

  // compute service types (categories) and show only three on Home
  const serviceCategoriesFromData = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    const cats = Array.from(
      new Set(list.map((s) => s.category).filter(Boolean))
    );
    return cats.length > 0 ? cats : ["Cortes", "Barba", "Pinturas"];
  }, [services]);

  const categoryIcon = (category) => {
    switch (category) {
      case "Cortes":
        return <Scissors className="w-12 h-12 text-blue-500" />;
      case "Barba":
        return <Brush className="w-12 h-12 text-blue-500" />;
      case "Pinturas":
        return <Palette className="w-12 h-12 text-blue-500" />;
      default:
        return <Scissors className="w-12 h-12 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentEnterprise?.name || "Corte"}
        </h1>
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

          {/* Avatar da empresa ou login */}
          {user ? (
            <Link
              to={getEnterpriseUrl("empresa")}
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium"
              title={currentEnterprise?.name || "Empresa"}
            >
              {currentEnterprise?.name?.charAt(0)?.toUpperCase() || "E"}
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Entrar
            </Link>
          )}
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
              to={getEnterpriseUrl(
                "service-details?category=Todos&title=Serviços"
              )}
              className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Agendar Agora
            </Link>
          </div>
          {/* elementos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="text-6xl font-bold text-blue-400 transform rotate-12">
              25
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 rounded-full opacity-30" />
          <div className="absolute top-6 right-16 w-12 h-12 bg-blue-400 rounded-full opacity-40" />
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
              to={getEnterpriseUrl(
                "service-details?category=Todos&title=Todos os Serviços"
              )}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Ver Todos
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {isLoadingServices
              ? [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center animate-pulse"
                  >
                    <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-4" />
                    <div className="w-16 h-4 bg-gray-200 rounded mb-2" />
                    <div className="w-12 h-3 bg-gray-200 rounded" />
                  </div>
                ))
              : serviceCategoriesFromData.slice(0, 3).map((cat) => (
                  <Link
                    key={cat}
                    to={getEnterpriseUrl(
                      `service-details?category=${encodeURIComponent(
                        cat
                      )}&title=${encodeURIComponent(
                        cat === "Todos" ? "Todos os Serviços" : cat
                      )}`
                    )}
                    className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="mb-4 p-4 bg-blue-100 rounded-2xl">
                      {categoryIcon(cat)}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-center text-sm">
                      {cat}
                    </h3>
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
              to={getEnterpriseUrl(
                "staff?category=Todos&title=Nossos Funcionários"
              )}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Ver Todos
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {isLoadingStaff
              ? [...Array(3)].map((_, index) => (
                  <div key={index} className="text-center animate-pulse">
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 mx-auto mb-3" />
                    <div className="w-16 h-4 bg-gray-200 rounded mx-auto" />
                  </div>
                ))
              : employees.slice(0, 3).map((member) => (
                  <Link
                    key={member.id}
                    to={getEnterpriseUrl(
                      `staff-detail?id=${encodeURIComponent(member.id)}`
                    )}
                    className="text-center hover:opacity-80 transition-opacity"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 bg-gray-200">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-300 rounded-2xl hidden items-center justify-center text-gray-600 text-xs">
                        Foto
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {member.name || "Funcionário"}
                    </h3>
                  </Link>
                ))}
          </div>
        </div>

        {user && (
          <div className="bg-blue-50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bem-vindo de volta, {user.name || user.email}!
            </h3>
            <p className="text-gray-600">
              Pronto para agendar seu próximo serviço?
            </p>
          </div>
        )}

        {/* Link discreto para acesso admin */}
        <div className="mt-12 text-center">
          <Link
            to="/admin/login"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Acesso Administrativo
          </Link>
        </div>
      </div>

      {/* Bottom Navigation removed; FloatingMenu is used globally */}
    </div>
  );
}

export default Home;
