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
    console.log(
      "📊 [Dashboard] Iniciando busca de estatísticas para:",
      enterpriseEmail
    );

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
          console.log("📊 [Dashboard] Tentando buscar da subcoleção...");
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
            `📊 [Dashboard] Encontrados ${appointments.length} agendamentos na subcoleção para ${enterpriseEmail}`,
            appointments
          );
        } catch (subError) {
          console.log("📊 [Dashboard] Erro na subcoleção:", subError);
          console.log(
            "📊 [Dashboard] Tentando buscar agendamentos na coleção global..."
          );
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
            `📊 [Dashboard] Encontrados ${appointments.length} agendamentos na coleção global para ${enterpriseEmail}`,
            appointments
          );
        }

        // Calcular agendamentos de hoje
        const today = new Date();
        const todayString = today.toISOString().split("T")[0]; // Formato YYYY-MM-DD

        console.log("📊 [Dashboard] Data de hoje:", {
          today: today.toISOString(),
          todayString: todayString,
        });

        const todayAppointmentsList = appointments.filter((apt) => {
          // Comparar diretamente as strings de data no formato YYYY-MM-DD
          const isToday = apt.date === todayString;

          console.log("📊 [Dashboard] Verificando agendamento:", {
            id: apt.id,
            date: apt.date,
            todayString,
            isToday,
            clientName: apt.clientName,
          });

          return isToday;
        });

        stats.todayAppointments = todayAppointmentsList.length;
        console.log(
          "📊 [Dashboard] Agendamentos de hoje:",
          stats.todayAppointments,
          todayAppointmentsList
        );

        // Calcular receita do mês atual
        const thisMonth =
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0"); // Formato YYYY-MM
        console.log("📊 [Dashboard] Mês atual:", thisMonth);

        const monthlyAppointments = appointments.filter((apt) => {
          const isThisMonth = apt.date && apt.date.startsWith(thisMonth);

          console.log("📊 [Dashboard] Verificando mês:", {
            id: apt.id,
            date: apt.date,
            thisMonth,
            isThisMonth,
          });

          return isThisMonth;
        });

        stats.monthlyRevenue = monthlyAppointments.reduce((total, apt) => {
          // Tentar diferentes campos onde o preço pode estar
          const price =
            apt.totalPrice || apt.productPrice || apt.price || apt.valor || 0;

          console.log(`💰 Dashboard - Agendamento ${apt.id}:`, {
            date: apt.date,
            totalPrice: apt.totalPrice,
            productPrice: apt.productPrice,
            price: apt.price,
            valor: apt.valor,
            priceUsed: price,
          });

          return total + price;
        }, 0);

        console.log(
          `💰 Dashboard - Receita mensal calculada:`,
          stats.monthlyRevenue,
          "para",
          monthlyAppointments.length,
          "agendamentos"
        );

        // Próximos agendamentos (próximos 5)
        console.log("📊 [Dashboard] Buscando próximos agendamentos...");
        const futureAppointments = appointments
          .filter((apt) => {
            // Comparar datas como strings, considerando agendamentos futuros (incluindo hoje à tarde)
            const isFuture = apt.date && apt.date >= todayString;

            console.log("📊 [Dashboard] Verificando se é futuro:", {
              id: apt.id,
              date: apt.date,
              todayString,
              isFuture,
              clientName: apt.clientName,
            });

            return isFuture;
          })
          .sort((a, b) => {
            // Ordenar por data e hora
            const dateA = a.date + " " + (a.startTime || "00:00");
            const dateB = b.date + " " + (b.startTime || "00:00");
            return dateA.localeCompare(dateB);
          })
          .slice(0, 5);

        console.log(
          "📊 [Dashboard] Agendamentos futuros encontrados:",
          futureAppointments
        );

        stats.upcomingAppointments = futureAppointments.map((apt) => ({
          id: apt.id,
          clientName: apt.clientName || "Cliente",
          productName: apt.productName || apt.serviceName || "Serviço",
          startTime: apt.startTime || "Horário não definido",
          date: apt.date,
          status: apt.status || "AGENDADO",
        }));

        console.log(
          "📊 [Dashboard] Próximos agendamentos formatados:",
          stats.upcomingAppointments
        );
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

      console.log("📊 [Dashboard] Estatísticas finais:", stats);
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
