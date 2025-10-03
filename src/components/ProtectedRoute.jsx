import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useAuth } from "../hooks/useAuth";
import Cookies from "js-cookie";

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const [initializing, setInitializing] = useState(true);

  // 🔧 CORREÇÃO: Verificar cookies de forma mais robusta
  const authToken = Cookies.get("auth_token");
  const userData = Cookies.get("user_data");
  const hasAuthCookie = !!(authToken && userData);

  // 🔧 CORREÇÃO: Aguardar um pouco após o AuthContext carregar para garantir que os cookies foram lidos
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitializing(false);
      }, 100); // Pequeno delay para garantir que cookies foram processados

      return () => clearTimeout(timer);
    }
  }, [loading]);

  console.log("🔍 [ProtectedRoute] Debug completo:", {
    isAuthenticated,
    loading,
    initializing,
    authToken: !!authToken,
    userData: !!userData,
    hasAuthCookie,
    location: location.pathname,
    user: user ? { email: user.email, role: user.role } : null,
  });

  // 🔧 Aguardar se ainda está carregando OU inicializando OU se tem cookies mas auth ainda não finalizou
  if (loading || initializing || (!isAuthenticated && hasAuthCookie)) {
    console.log("🔍 [ProtectedRoute] Aguardando:", {
      loading,
      initializing,
      isAuthenticated,
      hasAuthCookie,
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // 🔧 CORREÇÃO: Só redirecionar se NÃO tem autenticação E NÃO tem cookies válidos
  if (!isAuthenticated && !hasAuthCookie) {
    console.log("🔍 [ProtectedRoute] Redirecionando para login:", {
      isAuthenticated,
      hasAuthCookie,
      adminOnly,
    });

    // Se for área admin, redirecionar para login admin
    if (adminOnly) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Redirecionar para login centralizado em vez da empresa específica
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin" && user?.role !== "owner") {
    // 🔧 CORREÇÃO: Se tem cookies mas usuário não tem permissão, verificar se é transição
    if (hasAuthCookie && !user) {
      console.log(
        "🔍 [ProtectedRoute] Aguardando dados do usuário para verificar permissão..."
      );
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      );
    }

    console.log("🔍 [ProtectedRoute] Usuário sem permissão admin:", {
      userRole: user?.role,
    });

    // Usuário não tem permissão para acessar área administrativa
    return <Navigate to={getEnterpriseUrl("")} replace />;
  }

  console.log("🔍 [ProtectedRoute] Renderizando children - acesso autorizado");
  return children;
}

// Componente para redirecionar usuários autenticados das páginas de auth
export function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirecionar baseado no tipo de usuário
    if (user?.role === "admin" || user?.role === "owner") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to={getEnterpriseUrl("")} replace />;
    }
  }

  return children;
}
