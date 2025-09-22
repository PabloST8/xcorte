import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { EnterpriseProvider } from "./contexts/EnterpriseContext";
import { CartProvider } from "./contexts/CartProvider.jsx";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import EnterpriseDetector from "./components/EnterpriseDetector";
import FloatingMenu from "./components/FloatingMenu";

import Home from "./pages/Home";
import ServiceDetails from "./pages/ServiceDetails";
import Cart from "./pages/Cart";
import Appointment from "./pages/Appointment";
import Payment from "./pages/Payment";
import Staff from "./pages/Staff";
import StaffDetail from "./pages/StaffDetail";
import Register from "./pages/Register";
// import Verification from "./pages/Verification"; // Removido - API não suporta verificação
import Name from "./pages/Name";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import Empresa from "./pages/Empresa";
import DebugEnterprises from "./pages/DebugEnterprises";
import MyAppointments from "./pages/MyAppointments";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminClients from "./pages/admin/AdminClients";
import AdminServices from "./pages/admin/AdminServices";
import AdminStaff from "./pages/admin/AdminStaff";
import SuperAdmin from "./pages/SuperAdmin";

// Criar cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Layout principal (sem navbar para home da barbearia)
function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
      <FloatingMenu />
    </div>
  );
}

// Layout sem navbar para as telas de autenticação
function AuthLayout() {
  return <Outlet />;
}

// Router configuration with enterprise support
const router = createBrowserRouter([
  // Super Admin - rota especial sem enterprise context
  {
    path: "/SAdmin",
    element: <SuperAdmin />,
  },
  // Página de debug (sem exigir slug específico)
  {
    path: "/debug-enterprises",
    element: (
      <EnterpriseDetector>
        <Layout />
      </EnterpriseDetector>
    ),
    children: [{ index: true, element: <DebugEnterprises /> }],
  },
  // Rota raiz - redireciona automaticamente para empresa
  {
    path: "/",
    element: (
      <EnterpriseDetector>
        <Layout />
      </EnterpriseDetector>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },

  // Enterprise scoped routes: /:enterpriseSlug/*
  {
    path: "/:enterpriseSlug",
    element: (
      <EnterpriseDetector>
        <Layout />
      </EnterpriseDetector>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "service-details",
        element: (
          <ProtectedRoute>
            <ServiceDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "cart",
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        ),
      },
      {
        path: "appointment",
        element: (
          <ProtectedRoute>
            <Appointment />
          </ProtectedRoute>
        ),
      },
      {
        path: "payment",
        element: (
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        ),
      },
      {
        path: "staff",
        element: <Staff />,
      },
      {
        path: "staff-detail",
        element: <StaffDetail />,
      },
      {
        path: "empresa",
        element: <Empresa />,
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-appointments",
        element: (
          <ProtectedRoute>
            <MyAppointments />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
      // {
      //   path: "verification",
      //   element: (
      //     <GuestRoute>
      //       <Verification />
      //     </GuestRoute>
      //   ),
      // },
      {
        path: "name",
        element: (
          <GuestRoute>
            <Name />
          </GuestRoute>
        ),
      },
    ],
  },
  // Rota de login admin (fora do ProtectedRoute)
  {
    path: "/admin/login",
    element: (
      <GuestRoute>
        <AdminLogin />
      </GuestRoute>
    ),
  },
  // Rotas de administração
  {
    path: "/admin",
    element: (
      <ProtectedRoute adminOnly>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "appointments",
        element: <AdminAppointments />,
      },
      {
        path: "clients",
        element: <AdminClients />,
      },
      {
        path: "services",
        element: <AdminServices />,
      },
      {
        path: "staff",
        element: <AdminStaff />,
      },
    ],
  },
  // Rotas de autenticação também disponíveis na raiz para facilitar acesso
  // Comentado para evitar conflitos - usar apenas /auth/login
  // {
  //   path: "/login",
  //   element: (
  //     <GuestRoute>
  //       <Login />
  //     </GuestRoute>
  //   ),
  // },
  // {
  //   path: "/register",
  //   element: (
  //     <GuestRoute>
  //       <Register />
  //     </GuestRoute>
  //   ),
  // },
  // {
  //   path: "/verification",
  //   element: (
  //     <GuestRoute>
  //       <Verification />
  //     </GuestRoute>
  //   ),
  // },
  {
    path: "/name",
    element: (
      <GuestRoute>
        <Name />
      </GuestRoute>
    ),
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EnterpriseProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </EnterpriseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
