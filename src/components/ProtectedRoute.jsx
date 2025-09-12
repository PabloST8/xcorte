import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useAuth } from "../contexts/AuthContext";

// Componente para proteger rotas que precisam de autenticação
export function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Se for área admin, redirecionar para login admin
    if (adminOnly) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Redirecionar para login centralizado em vez da empresa específica
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== "admin" && user?.role !== "owner") {
    // Usuário não tem permissão para acessar área administrativa
    return <Navigate to={getEnterpriseUrl("")} replace />;
  }

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
