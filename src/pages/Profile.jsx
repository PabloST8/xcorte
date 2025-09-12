import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Star,
  Edit,
  Camera,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { useUserAppointments } from "../hooks/useBarbershop";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { bookingService } from "../services/bookingService";
import { enterpriseBookingFirestoreService } from "../services/enterpriseBookingFirestoreService";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentEnterprise } = useEnterprise();
  const [isEditing, setIsEditing] = useState(false);
  const [fallbackAppointments, setFallbackAppointments] = useState([]);
  const [loadingFallback, setLoadingFallback] = useState(false);
  
  console.log('🔍 Profile Debug - User:', user);
  console.log('🔍 Profile Debug - CurrentEnterprise:', currentEnterprise);
  
  const { data: appointments, isLoading } = useUserAppointments({
    enterpriseEmail: currentEnterprise?.email,
    clientEmail: user?.email,
    clientName: user?.name,
    clientPhone: user?.phone || user?.phoneNumber,
    userEmail: user?.email,
    userName: user?.name,
    userPhone: user?.phone || user?.phoneNumber,
  });
  
  console.log('🔍 Profile Debug - Appointments from API:', appointments);
  console.log('🔍 Profile Debug - IsLoading:', isLoading);
  console.log('🔍 Profile Debug - Fallback Appointments:', fallbackAppointments);
  
  const { getEnterpriseUrl } = useEnterpriseNavigation();

  // Fallback para carregar agendamentos quando a API principal não funciona
  React.useEffect(() => {
    console.log('🔄 Fallback Effect triggered');
    console.log('🔄 IsLoading:', isLoading);
    console.log('🔄 Appointments length:', (appointments || []).length);
    console.log('🔄 Current Enterprise Email:', currentEnterprise?.email);
    console.log('🔄 User identifier check:', {
      email: user?.email,
      name: user?.name,
      phone: user?.phone,
      phoneNumber: user?.phoneNumber
    });
    
    if (isLoading) {
      console.log('⏳ Still loading, skipping fallback');
      return;
    }
    if ((appointments || []).length > 0) {
      console.log('✅ API has appointments, skipping fallback');
      return;
    }
    if (!currentEnterprise?.email) {
      console.log('❌ No enterprise email, skipping fallback');
      return;
    }
    const hasIdentifier = !!(
      user?.email ||
      user?.name ||
      user?.phone ||
      user?.phoneNumber
    );
    if (!hasIdentifier) {
      console.log('❌ No user identifier, skipping fallback');
      return;
    }

    console.log('🚀 Starting fallback appointment search...');
    let cancelled = false;
    setLoadingFallback(true);
    (async () => {
      try {
        console.log('📊 User data for search:', {
          email: user?.email,
          name: user?.name,
          phone: user?.phone || user?.phoneNumber
        });
        console.log('🏢 Enterprise data for search:', {
          email: currentEnterprise?.email,
          name: currentEnterprise?.name
        });

        // Tentar buscar do Firestore primeiro - BUSCAR EM TODAS AS EMPRESAS
        let firestoreAppointments = [];
        try {
          console.log('🔍 Searching Firestore appointments in ALL enterprises...');
          
          // Lista de todas as empresas conhecidas
          const allEnterprises = [
            'empresaadmin@xcortes.com',
            'pablofafstar@gmail.com', 
            'admin@teste.com'
          ];
          
          // Buscar em todas as empresas
          const allPromises = allEnterprises.map(async (enterpriseEmail) => {
            try {
              console.log('🔍 Searching in enterprise:', enterpriseEmail);
              const bookings = await enterpriseBookingFirestoreService.list(enterpriseEmail);
              console.log('📋 Found', bookings.length, 'bookings in', enterpriseEmail);
              return bookings.map(b => ({ ...b, sourceEnterprise: enterpriseEmail }));
            } catch (error) {
              console.warn('❌ Error searching in', enterpriseEmail, ':', error);
              return [];
            }
          });
          
          const allResults = await Promise.all(allPromises);
          firestoreAppointments = allResults.flat();
          
          console.log('📋 Total Firestore appointments found across all enterprises:', firestoreAppointments.length);
          console.log('📋 All Firestore appointments data:', firestoreAppointments);
        } catch (error) {
          console.warn("❌ Erro ao buscar do Firestore:", error);
        }

        // Fallback para o bookingService (usado na UserAppointments) - APENAS SE A API ESTIVER FUNCIONANDO
        console.log('🔍 Searching API appointments...');
        let apiAppointments = [];
        try {
          const unwrap = (val) =>
            Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          
          const allRaw = await bookingService.getBookings(
            currentEnterprise.email
          );
          console.log('📋 All API appointments raw:', allRaw);
          
          const today = new Date().toISOString().split("T")[0];
          const todayRaw = await bookingService.getBookings(
            currentEnterprise.email,
            today
          );
          console.log('📋 Today API appointments raw:', todayRaw);
          
          apiAppointments = [...unwrap(allRaw), ...unwrap(todayRaw)];
        } catch (error) {
          console.warn('⚠️ API appointments failed, using only Firestore data:', error.message);
          // Não é um erro crítico, apenas seguimos sem dados da API
        }

        const map = new Map();

        // Adicionar agendamentos do Firestore
        firestoreAppointments.forEach((b) => {
          const key = `${b.id || b._id || b.date}-${b.startTime || b.start}`;
          if (!map.has(key)) map.set(key, b);
        });

        // Adicionar agendamentos da API (se houver)
        apiAppointments.forEach((b) => {
          const key = `${b.id || b._id || b.date}-${b.startTime || b.start}`;
          if (!map.has(key)) map.set(key, b);
        });

        console.log('📊 Total appointments in map:', map.size);

        const uEmail = user?.email || "";
        const uName = user?.name || "";
        const uPhone = user?.phone || user?.phoneNumber || "";
        
        console.log('🔍 Filtering by user data:', { uEmail, uName, uPhone });
        
        const merged = Array.from(map.values()).filter((b) => {
          const bEmail = b.clientEmail || b.email || "";
          const bName = b.clientName || b.name || "";
          const bPhone = b.clientPhone || b.phone || "";
          
          const emailMatch = (uEmail && bEmail === uEmail);
          const nameMatch = (uName && bName === uName);
          const phoneMatch = (uPhone && bPhone === uPhone);
          
          console.log('🔍 Checking appointment:', {
            appointment: { bEmail, bName, bPhone },
            matches: { emailMatch, nameMatch, phoneMatch },
            willInclude: emailMatch || nameMatch || phoneMatch
          });
          
          return emailMatch || nameMatch || phoneMatch;
        });
        
        
        console.log('✅ Filtered appointments:', merged.length);
        console.log('✅ Filtered appointments data:', merged);
        if (!cancelled) setFallbackAppointments(merged);
      } catch (error) {
        console.error('❌ Fallback error:', error);
        if (!cancelled) setFallbackAppointments([]);
      } finally {
        if (!cancelled) setLoadingFallback(false);
      }
    })();
    return () => {
      cancelled = true;
      setLoadingFallback(false);
    };
  }, [
    appointments,
    isLoading,
    currentEnterprise?.email,
    currentEnterprise?.name,
    user?.email,
    user?.name,
    user?.phone,
    user?.phoneNumber,
  ]);

  // Usar agendamentos da API ou fallback
  const allAppointments =
    appointments?.length > 0 ? appointments : fallbackAppointments;

  // Ordenar agendamentos por data (mais recentes primeiro)
  const sortedAppointments = allAppointments?.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime || a.time || "00:00"}`);
    const dateB = new Date(`${b.date} ${b.startTime || b.time || "00:00"}`);
    return dateB - dateA; // ordem decrescente (mais recente primeiro)
  });

  const recentAppointments = sortedAppointments?.slice(0, 3) || [];

  const handleLogout = async () => {
    try {
      await logout();
      
      // Limpeza adicional para garantir
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        }
      });
      
      // Limpar localStorage completamente
      localStorage.clear();
      sessionStorage.clear();
      
      // Aguardar um pouco para garantir que o estado seja limpo
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Meu Perfil</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.name || "Usuário"}
              </h2>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">
                  Cliente desde{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).getFullYear()
                    : "2024"}
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {user?.phone || "(11) 99999-9999"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">
                {allAppointments?.length || 0} agendamentos realizados
              </span>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agendamentos Recentes
          </h3>

          {isLoading || loadingFallback ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((appointment, index) => {
                // Formatação da data
                const formatDate = (dateStr) => {
                  if (!dateStr) return "Data não informada";
                  try {
                    const [year, month, day] = dateStr.split("-");
                    return `${day}/${month}/${year}`;
                  } catch {
                    return dateStr;
                  }
                };

                // Formatação do status
                const formatStatus = (status) => {
                  const statusMap = {
                    scheduled: "Agendado",
                    confirmed: "Confirmado",
                    in_progress: "Em andamento",
                    completed: "Concluído",
                    cancelled: "Cancelado",
                    no_show: "Não compareceu",
                  };
                  return statusMap[status] || status || "Agendado";
                };

                return (
                  <div
                    key={appointment.id || appointment._id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.serviceName ||
                          appointment.productName ||
                          appointment.service ||
                          "Serviço"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.staffName ||
                          appointment.employeeName ||
                          appointment.professional ||
                          "Profissional"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.date)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointment.startTime ||
                          appointment.time ||
                          "Horário não informado"}
                      </p>
                      <p className="text-xs text-green-600">
                        {formatStatus(appointment.status)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhum agendamento ainda</p>
              <p className="text-sm text-gray-500 mb-4">
                Que tal agendar seu primeiro corte?
              </p>
              <Link
                to={getEnterpriseUrl(
                  "service-details?category=Todos&title=Serviços"
                )}
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Fazer Primeiro Agendamento
              </Link>
            </div>
          )}

          {recentAppointments.length > 0 && (
            <Link
              to={getEnterpriseUrl(
                "service-details?category=Todos&title=Serviços"
              )}
              className="block text-center mt-4 text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              Fazer Novo Agendamento
            </Link>
          )}
        </div>
        {/* Quick Actions and Settings removed as requested */}

        {/* Logout Button */}
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
