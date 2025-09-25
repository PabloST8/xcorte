import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  LogOut,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentEnterprise, syncEnterpriseWithUser } = useEnterprise();
  const queryClient = useQueryClient();
  const previousEnterpriseRef = useRef(null);
  const previousUserRef = useRef(null);

  // Sincronizar empresa com usuário admin logado
  useEffect(() => {
    console.log("🔍 AdminLayout - Verificando usuário:", {
      user,
      hasUser: !!user,
      email: user?.email,
      role: user?.role,
      enterpriseEmail: user?.enterpriseEmail,
      isAdmin: user?.role === "admin",
      hasEnterpriseEmail: !!user?.enterpriseEmail,
    });

    if (user && user.role === "admin") {
      console.log(`🔄 Admin logado: ${user.email}, sincronizando empresa...`);
      console.log("📋 Dados completos do usuário:", user);

      // Se não tem enterpriseEmail, tentar usar o próprio email como fallback
      let userForSync = user;
      if (
        !user.enterpriseEmail &&
        (user.email === "pablofafstar@gmail.com" ||
          user.email === "empresaadmin@xcortes.com")
      ) {
        console.log(
          "� Definindo enterpriseEmail baseado no email do usuário:",
          user.email
        );
        userForSync = { ...user, enterpriseEmail: user.email };
      }

      if (userForSync.enterpriseEmail) {
        syncEnterpriseWithUser(userForSync);
      } else {
        console.log(
          "⚠️ Não foi possível definir enterpriseEmail para:",
          user.email
        );
      }
    } else {
      console.log("⚠️ Usuário não tem dados suficientes para sincronização:", {
        user,
      });
      if (user && user.role !== "admin") {
        console.log("❌ Role incorreto:", user.role, "esperado: admin");
      }
      if (user && !user.enterpriseEmail) {
        console.log("❌ enterpriseEmail ausente no usuário");
      }
    }
  }, [user, syncEnterpriseWithUser]);

  // Monitorar mudanças no usuário logado
  useEffect(() => {
    console.log("👤 AdminLayout - Mudança no usuário detectada:", {
      currentUser: user?.email,
      currentUserEnterprise: user?.enterpriseEmail,
      previousUser: previousUserRef.current?.email,
      previousUserEnterprise: previousUserRef.current?.enterpriseEmail,
      hasChanged:
        user?.enterpriseEmail !== previousUserRef.current?.enterpriseEmail,
    });

    // Se mudou o enterpriseEmail do usuário, força reload
    if (
      user?.enterpriseEmail &&
      previousUserRef.current?.enterpriseEmail &&
      user.enterpriseEmail !== previousUserRef.current.enterpriseEmail
    ) {
      console.log(
        `🔄 AdminLayout - Usuário mudou de empresa: ${previousUserRef.current.enterpriseEmail} → ${user.enterpriseEmail}, forçando reload IMEDIATO...`
      );

      if (queryClient) {
        queryClient.clear();
      }

      // Reload imediato sem setTimeout
      window.location.reload();
    }

    previousUserRef.current = user;
  }, [user, queryClient]);

  // Adicionar listener para mudanças na empresa via storage/cookies
  useEffect(() => {
    console.log(
      "🔧 AdminLayout - Configurando listener para mudanças de empresa..."
    );

    const handleStorageChange = (e) => {
      console.log(
        "💾 AdminLayout - Mudança detectada no storage:",
        e.key,
        e.newValue
      );

      if (e.key === "current_enterprise" && e.newValue) {
        try {
          const newEnterprise = JSON.parse(e.newValue);
          console.log(
            "🏢 AdminLayout - Nova empresa detectada via storage:",
            newEnterprise.name,
            newEnterprise.email
          );

          if (
            currentEnterprise?.email &&
            newEnterprise.email !== currentEnterprise.email
          ) {
            console.log(
              "🔄 AdminLayout - Forçando reload IMEDIATO por mudança de empresa via storage..."
            );
            window.location.reload();
          }
        } catch (error) {
          console.error(
            "❌ AdminLayout - Erro ao processar mudança de storage:",
            error
          );
        }
      }
    };

    // Monitorar mudanças nos cookies também
    const checkCookieChanges = () => {
      const cookieEnterprise = document.cookie
        .split("; ")
        .find((row) => row.startsWith("current_enterprise="));

      if (cookieEnterprise) {
        try {
          const enterpriseData = JSON.parse(
            decodeURIComponent(cookieEnterprise.split("=")[1])
          );
          if (
            currentEnterprise?.email &&
            enterpriseData.email !== currentEnterprise.email
          ) {
            console.log(
              "🍪 AdminLayout - Mudança detectada via cookie, forçando reload IMEDIATO..."
            );
            window.location.reload();
          }
        } catch (error) {
          console.log("⚠️ AdminLayout - Erro ao verificar cookie:", error);
        }
      }
    };

    // Verificar cookies a cada 1 segundo (mais frequente)
    const cookieInterval = setInterval(checkCookieChanges, 1000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      console.log("🧹 AdminLayout - Limpando listeners...");
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(cookieInterval);
    };
  }, [currentEnterprise]);

  // Monitorar mudanças na empresa atual e invalidar cache quando necessário
  useEffect(() => {
    console.log("🏢 AdminLayout - useEffect empresa disparado:", {
      currentEnterprise: currentEnterprise?.name,
      email: currentEnterprise?.email,
      previous: previousEnterpriseRef.current?.name,
      previousEmail: previousEnterpriseRef.current?.email,
      hasChanged:
        currentEnterprise?.email !== previousEnterpriseRef.current?.email,
    });

    // Se mudou de empresa, invalida o cache
    if (
      currentEnterprise?.email &&
      previousEnterpriseRef.current?.email &&
      currentEnterprise.email !== previousEnterpriseRef.current.email &&
      queryClient
    ) {
      console.log(
        `🗑️ AdminLayout - Invalidando cache por mudança de empresa: ${previousEnterpriseRef.current.email} → ${currentEnterprise.email}`
      );

      try {
        // Método mais agressivo: limpar todo o cache
        queryClient.clear();

        console.log("✅ AdminLayout - Cache limpo com sucesso!");
        console.log("🔄 AdminLayout - Forçando reload IMEDIATO...");

        // Forçar reload IMEDIATO sem setTimeout
        window.location.reload();
      } catch (error) {
        console.error("❌ AdminLayout - Erro ao limpar cache:", error);
        // Mesmo com erro, força reload
        console.log("🔄 AdminLayout - Forçando reload por erro...");
        window.location.reload();
      }
    } else {
      console.log("⚠️ AdminLayout - Não vai fazer reload:", {
        hasCurrentEmail: !!currentEnterprise?.email,
        hasPreviousEmail: !!previousEnterpriseRef.current?.email,
        emailsAreDifferent:
          currentEnterprise?.email !== previousEnterpriseRef.current?.email,
        hasQueryClient: !!queryClient,
      });
    }

    // Atualizar referência da empresa anterior
    if (currentEnterprise) {
      console.log(
        "📌 AdminLayout - Atualizando referência da empresa:",
        currentEnterprise.email
      );
      previousEnterpriseRef.current = currentEnterprise;
    }
  }, [currentEnterprise, queryClient]);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Agendamentos", href: "/admin/appointments", icon: Calendar },
    { name: "Clientes", href: "/admin/clients", icon: Users },
    { name: "Funcionários", href: "/admin/staff", icon: UserCheck },
    { name: "Serviços", href: "/admin/services", icon: Scissors },
  ];

  const handleLogout = async () => {
    try {
      await logout();

      // Usar URL completa para funcionar tanto em localhost quanto em produção
      // Adicionar timestamp para forçar quebra de cache
      const timestamp = Date.now();
      const loginUrl = `${window.location.origin}/auth/login?t=${timestamp}`;

      // Forçar navegação usando window.location para contornar possíveis problemas de cache
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Erro no logout:", error);
      // Mesmo com erro, redirecionar para login
      const timestamp = Date.now();
      const loginUrl = `${window.location.origin}/auth/login?t=${timestamp}`;
      window.location.href = loginUrl;
    }
  };

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        ></div>
        <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentEnterprise?.name || "Admin"} Admin
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-amber-50 text-amber-700 border-r-2 border-amber-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4">
              <h2 className="text-xl font-bold text-gray-900">
                {currentEnterprise?.name || "Admin"} Admin
              </h2>
              {/* Botão temporário de atualização */}
              <button
                onClick={() => window.location.reload()}
                className="ml-4 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                title="Atualizar dados da empresa"
              >
                🔄 Refresh
              </button>
            </div>
            <nav className="mt-8 flex-1">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-amber-50 text-amber-700 border-r-2 border-amber-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* User info and logout */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || "Administrador"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentEnterprise?.name || "Admin"} Admin
            </h1>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
