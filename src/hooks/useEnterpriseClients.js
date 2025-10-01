import { useQuery } from "@tanstack/react-query";
import { firestoreAppointmentsService } from "../services/firestoreAppointmentsService";
import { firestoreClientsService } from "../services/firestoreClientsService";
import { useEnterprise } from "../contexts/EnterpriseContext";
import { formatDateBR } from "../utils/dateUtils";

export const useEnterpriseClients = ({ search = "", sortBy = "name" } = {}) => {
  const { currentEnterprise } = useEnterprise();
  const enterpriseEmail = currentEnterprise?.email;

  return useQuery({
    queryKey: ["enterprise-clients", enterpriseEmail, search, sortBy],
    enabled: !!enterpriseEmail,
    queryFn: async () => {
      console.log("🔍 Buscando clientes para empresa:", enterpriseEmail);

      // 1. Buscar todos os agendamentos da empresa
      const appointmentsResp =
        await firestoreAppointmentsService.getAppointments({ enterpriseEmail });
      if (!appointmentsResp.success || !appointmentsResp.data) {
        console.log(
          "❌ Erro ao buscar agendamentos ou nenhum agendamento encontrado"
        );
        return [];
      }
      const appointments = appointmentsResp.data;
      console.log("📅 Agendamentos encontrados:", appointments.length);

      // 2. Buscar clientes usando o serviço atualizado (que já inclui fotos)
      console.log("👥 Buscando clientes com fotos...");
      const clientsResp = await firestoreClientsService.getClients({
        enterpriseEmail: enterpriseEmail,
      });

      let clients = [];
      if (clientsResp.success && clientsResp.data) {
        clients = clientsResp.data;
        console.log("✅ Clientes encontrados com fotos:", clients.length);
      } else {
        console.log(
          "📱 Fallback: Agrupando clientes por telefone/nome dos agendamentos"
        );
        // Fallback: Se o serviço falhar, agrupar clientes dos agendamentos
        const clientsByPhone = {};
        appointments.forEach((a) => {
          const phone = a.clientPhone || a.phone || a.telefone;
          const name = a.clientName || a.name || a.nome;
          if (phone) {
            if (!clientsByPhone[phone]) {
              clientsByPhone[phone] = {
                id: phone, // usar telefone como ID temporário
                name: name || phone,
                phone,
                email: a.clientEmail || a.email || "",
                photoURL: a.clientPhotoUrl || null, // 📸 Foto do agendamento se disponível
              };
            }
          }
        });
        clients = Object.values(clientsByPhone);
      }

      // 4. Calcular estatísticas para cada cliente
      const clientsWithStats = clients.map((client) => {
        // Filtrar agendamentos deste cliente
        const clientAppointments = appointments.filter((a) => {
          // Se temos ID de cliente, usar isso
          if (client.id && a.clientId) {
            return a.clientId === client.id;
          }
          // Senão, usar telefone
          const appointmentPhone = a.clientPhone || a.phone || a.telefone;
          return appointmentPhone === client.phone;
        });

        console.log(
          `📊 Cliente ${client.name}: ${clientAppointments.length} agendamentos`
        );

        // Calcular total gasto
        const totalSpent = clientAppointments.reduce((total, appointment) => {
          // Tentar diferentes campos onde o preço pode estar
          const price =
            appointment.totalPrice ||
            appointment.productPrice ||
            appointment.price ||
            appointment.valor ||
            0;

          console.log(`💰 Agendamento ${appointment.id}:`, {
            totalPrice: appointment.totalPrice,
            productPrice: appointment.productPrice,
            price: appointment.price,
            valor: appointment.valor,
            priceUsed: price,
          });

          return total + price;
        }, 0);

        console.log(`💰 Total calculado para ${client.name}:`, totalSpent);

        // Encontrar último agendamento
        const sortedAppointments = clientAppointments
          .filter((a) => a.date || a.appointmentDate)
          .sort((a, b) => {
            const dateA = new Date(a.date || a.appointmentDate);
            const dateB = new Date(b.date || b.appointmentDate);
            return dateB - dateA;
          });

        const lastAppointment = sortedAppointments[0]
          ? formatDateBR(
              sortedAppointments[0].date ||
                sortedAppointments[0].appointmentDate
            )
          : "Nunca";

        return {
          ...client,
          appointmentsCount: clientAppointments.length,
          totalSpent: totalSpent,
          lastAppointment: lastAppointment,
        };
      });

      console.log("✅ Clientes processados:", clientsWithStats.length);
      console.log(
        "📸 Primeiro cliente com foto:",
        clientsWithStats.find((c) => c.photoURL)
      ); // Debug fotos

      // Aplicar filtros de busca
      let filteredClients = clientsWithStats;
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredClients = clientsWithStats.filter(
          (client) =>
            (client.name || "").toLowerCase().includes(searchLower) ||
            (client.phone || "").toLowerCase().includes(searchLower) ||
            (client.email || "").toLowerCase().includes(searchLower)
        );
        console.log(
          `🔍 Clientes filtrados por busca "${search}":`,
          filteredClients.length
        );
      }

      // Aplicar ordenação
      filteredClients.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.name || "").localeCompare(b.name || "");

          case "created_at": {
            // Usar o primeiro agendamento como proxy para "criação"
            const dateA = new Date(
              a.lastAppointment === "Nunca" ? 0 : a.lastAppointment
            );
            const dateB = new Date(
              b.lastAppointment === "Nunca" ? 0 : b.lastAppointment
            );
            return dateB - dateA; // Mais recentes primeiro
          }

          case "last_appointment": {
            if (a.lastAppointment === "Nunca" && b.lastAppointment === "Nunca")
              return 0;
            if (a.lastAppointment === "Nunca") return 1;
            if (b.lastAppointment === "Nunca") return -1;

            // Converter formato brasileiro para Date
            const convertBRtoDate = (dateStr) => {
              const [day, month, year] = dateStr.split("/");
              return new Date(year, month - 1, day);
            };

            const lastA = convertBRtoDate(a.lastAppointment);
            const lastB = convertBRtoDate(b.lastAppointment);
            return lastB - lastA; // Mais recentes primeiro
          }

          case "total_spent":
            return (b.totalSpent || 0) - (a.totalSpent || 0); // Maior valor primeiro

          default:
            return 0;
        }
      });

      console.log(
        `📊 Clientes ordenados por "${sortBy}":`,
        filteredClients.length
      );
      return filteredClients;
    },
    staleTime: 5 * 60 * 1000,
  });
};
