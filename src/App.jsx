import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { EnterpriseProvider } from "./contexts/EnterpriseContext";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

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
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminClients from "./pages/admin/AdminClients";
import AdminServices from "./pages/admin/AdminServices";

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
    </div>
  );
}

// Layout sem navbar para as telas de autenticação
function AuthLayout() {
  return <Outlet />;
}

// Router configuration with the new API
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
        path: "calendar",
        element: (
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
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
        element: <div>Funcionários (em desenvolvimento)</div>,
      },
      {
        path: "reports",
        element: <div>Relatórios (em desenvolvimento)</div>,
      },
      {
        path: "settings",
        element: <div>Configurações (em desenvolvimento)</div>,
      },
    ],
  },
  // Rotas de autenticação também disponíveis na raiz para facilitar acesso
  {
    path: "/login",
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        <Register />
      </GuestRoute>
    ),
  },
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
          <RouterProvider router={router} />
        </EnterpriseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
