import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

// Serviço para buscar dados reais do Firestore para o dashboard
export const firestoreDashboardService = {
  // Buscar estatísticas do dashboard a partir do Firestore
  async getDashboardStats(enterpriseEmail = "empresaadmin@xcortes.com") {
    try {
      const stats = {
        todayAppointments: 0,
        monthlyRevenue: 0,
        totalClients: 0,
        upcomingAppointments: [],
      };

      // 1. Buscar produtos da empresa (para referência futura)
      const productsQuery = query(
        collection(db, "products"),
        where("enterpriseEmail", "==", enterpriseEmail)
      );
      await getDocs(productsQuery);

      // 2. Buscar agendamentos (assumindo que existe coleção bookings/appointments)
      try {
        // Primeiro tentar a estrutura de subcoleção
        let appointments = [];
        try {
          const bookingsRef = collection(
            db,
            "enterprises",
            enterpriseEmail,
            "bookings"
          );
          const appointmentsSnapshot = await getDocs(bookingsRef);
          appointments = appointmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log(
            `Encontrados ${appointments.length} agendamentos na subcoleção para ${enterpriseEmail}`
          );
        } catch {
          console.log("Tentando buscar agendamentos na coleção global...");
          // Fallback para coleção global
          const appointmentsQuery = query(
            collection(db, "bookings"),
            where("enterpriseEmail", "==", enterpriseEmail),
            orderBy("createdAt", "desc"),
            limit(50)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          appointments = appointmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log(
            `Encontrados ${appointments.length} agendamentos na coleção global para ${enterpriseEmail}`
          );
        }

        // Calcular agendamentos de hoje
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const todayEnd = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );

        stats.todayAppointments = appointments.filter((apt) => {
          const aptDate = apt.date ? new Date(apt.date) : null;
          return aptDate && aptDate >= todayStart && aptDate < todayEnd;
        }).length;

        // Calcular receita do mês atual
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );

        const monthlyAppointments = appointments.filter((apt) => {
          const aptDate = apt.date ? new Date(apt.date) : null;
          return aptDate && aptDate >= thisMonth && aptDate < nextMonth;
        });

        stats.monthlyRevenue = monthlyAppointments.reduce((total, apt) => {
          return total + (apt.price || 0);
        }, 0);

        // Próximos agendamentos (próximos 5)
        const futureAppointments = appointments
          .filter((apt) => {
            const aptDate = apt.date ? new Date(apt.date) : null;
            return aptDate && aptDate > today;
          })
          .slice(0, 5);

        stats.upcomingAppointments = futureAppointments.map((apt) => ({
          id: apt.id,
          clientName: apt.clientName || "Cliente",
          productName: apt.productName || apt.serviceName || "Serviço",
          startTime: apt.startTime || "Horário não definido",
          date: apt.date,
          status: apt.status || "AGENDADO",
        }));
      } catch (appointmentError) {
        console.log("Erro ao buscar agendamentos:", appointmentError);
        // Continuar sem agendamentos
      }

      // 3. Buscar clientes únicos da empresa (usando a mesma estrutura do firestoreClientsService)
      try {
        let clientsCount = 0;

        // Estratégia 1: Buscar clientes da subcoleção da empresa
        try {
          const enterpriseClientsRef = collection(
            db,
            "enterprises",
            enterpriseEmail,
            "clients"
          );
          const clientsSnapshot = await getDocs(enterpriseClientsRef);
          clientsCount = clientsSnapshot.docs.length;

          console.log(
            `Encontrados ${clientsCount} clientes na subcoleção para ${enterpriseEmail}`
          );

          // Se não encontrou clientes na subcoleção, tentar buscar dos agendamentos
          if (clientsCount === 0) {
            const bookingsRef = collection(
              db,
              "enterprises",
              enterpriseEmail,
              "bookings"
            );
            const bookingsSnapshot = await getDocs(bookingsRef);

            // Contar clientes únicos dos agendamentos
            const uniqueClients = new Set();
            bookingsSnapshot.forEach((doc) => {
              const booking = doc.data();
              const clientKey =
                booking.clientEmail ||
                booking.clientPhone ||
                booking.clientName;
              if (clientKey) {
                uniqueClients.add(clientKey);
              }
            });

            clientsCount = uniqueClients.size;
            console.log(
              `Encontrados ${clientsCount} clientes únicos dos agendamentos para ${enterpriseEmail}`
            );
          }
        } catch (error) {
          console.log("Erro ao buscar clientes da subcoleção:", error);
        }

        stats.totalClients = clientsCount;
      } catch (clientError) {
        console.log("Erro ao buscar clientes:", clientError);
        // Usar valor padrão
        stats.totalClients = 0;
      }

      return { success: true, data: stats };
    } catch (error) {
      console.error("Erro ao buscar estatísticas do dashboard:", error);

      // Fallback com dados básicos
      return {
        success: false,
        error: error.message,
        data: {
          todayAppointments: 0,
          monthlyRevenue: 0,
          totalClients: 0,
          upcomingAppointments: [],
        },
      };
    }
  },

  // Buscar informações da empresa
  async getEnterpriseInfo(enterpriseEmail = "empresaadmin@xcortes.com") {
    try {
      const enterpriseQuery = query(
        collection(db, "enterprises"),
        where("email", "==", enterpriseEmail),
        limit(1)
      );
      const enterpriseSnapshot = await getDocs(enterpriseQuery);

      if (!enterpriseSnapshot.empty) {
        const enterpriseDoc = enterpriseSnapshot.docs[0];
        return {
          success: true,
          data: {
            id: enterpriseDoc.id,
            ...enterpriseDoc.data(),
          },
        };
      }

      return { success: false, error: "Empresa não encontrada" };
    } catch (error) {
      console.error("Erro ao buscar informações da empresa:", error);
      return { success: false, error: error.message };
    }
  },

  // Buscar produtos da empresa
  async getEnterpriseProducts(enterpriseEmail = "pablofafstar@gmail.com") {
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("enterpriseEmail", "==", enterpriseEmail)
      );
      const productsSnapshot = await getDocs(productsQuery);

      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: products };
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return { success: false, error: error.message, data: [] };
    }
  },
};
